import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Chat anonyme — côté PROPRIÉTAIRE (capability = trackingToken, même
 * mécanisme d'auth que GET/POST /api/track/[token]).
 * GET  ?after=ISO → fil + compteur de non-lus (avant marquage).
 * POST { body } → réponse du propriétaire.
 * Aucun numéro de téléphone n'est JAMAIS renvoyé par ces endpoints.
 */

const MAX_BODY_LEN = 1000;

function sanitizeText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function getClientIp(request: NextRequest): string {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}

async function resolveBaggage(token: string) {
  return prisma.baggage.findUnique({
    where: { trackingToken: token },
    select: { id: true, status: true, trackingEnabled: true, reference: true, customData: true },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const baggage = await resolveBaggage(token);
    if (!baggage) {
      return NextResponse.json({ error: 'Suivi introuvable' }, { status: 404 });
    }
    if (baggage.trackingEnabled === false) {
      return NextResponse.json({ error: 'Suivi désactivé' }, { status: 403 });
    }
    if (baggage.status === 'blocked') {
      return NextResponse.json({ error: 'Tag bloqué' }, { status: 403 });
    }

    const after = request.nextUrl.searchParams.get('after');

    // Compteur de non-lus AVANT le marquage (pour le badge propriétaire)
    const unread = await prisma.finderChatMessage.count({
      where: { baggageId: baggage.id, sender: 'finder', readByOwner: false },
    });

    const messages = await prisma.finderChatMessage.findMany({
      where: {
        baggageId: baggage.id,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: { id: true, sender: true, senderLabel: true, body: true, createdAt: true },
    });

    // Marquer les messages du trouveur comme lus — seulement si l'onglet
    // est visible (paramètre read=1 envoyé par le client) : sinon le badge
    // « non lus » reste affiché pour attirer l'attention du propriétaire.
    const shouldMarkRead = request.nextUrl.searchParams.get('read') === '1';
    if (shouldMarkRead && messages.some((m) => m.sender === 'finder')) {
      await prisma.finderChatMessage.updateMany({
        where: { baggageId: baggage.id, sender: 'finder', readByOwner: false },
        data: { readByOwner: true },
      });
    }

    return NextResponse.json(
      { messages, unread },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('[owner-chat GET] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (rateLimit(`chat-owner:${getClientIp(request)}:${token}`, { windowMs: 60_000, maxRequests: 15 })) {
      return NextResponse.json({ error: 'Trop de messages, patientez un instant' }, { status: 429 });
    }

    const body = await request.json();
    const text = sanitizeText(body?.body, MAX_BODY_LEN);
    if (!text) {
      return NextResponse.json({ error: 'Le message est requis' }, { status: 400 });
    }

    const baggage = await resolveBaggage(token);
    if (!baggage) {
      return NextResponse.json({ error: 'Suivi introuvable' }, { status: 404 });
    }
    if (baggage.trackingEnabled === false) {
      return NextResponse.json({ error: 'Suivi désactivé' }, { status: 403 });
    }
    if (baggage.status === 'blocked') {
      return NextResponse.json({ error: 'Tag bloqué' }, { status: 403 });
    }

    const message = await prisma.finderChatMessage.create({
      data: {
        baggageId: baggage.id,
        sender: 'owner',
        body: text,
        readByOwner: true, // l'auteur vient de l'écrire
      },
      select: { id: true, sender: true, senderLabel: true, body: true, createdAt: true },
    });

    // ─── Notification e-mail au trouveur (s'il a laissé une adresse) ───
    // Fire-and-forget : ne ralentit jamais la réponse du propriétaire.
    // Gardes anti-spam (miroir de la direction inverse) :
    //  1. Uniquement si le trouveur a volontairement laissé un e-mail.
    //  2. Un seul e-mail par lot de réponses non lues (readByFinder).
    //  3. Maximum 1 e-mail / 60 s / référence (EmailLog type chat_reply).
    (async () => {
      try {
        // Garde 2 : le lot de réponses non lues a-t-il déjà été notifié ?
        const prevOwnerMsg = await prisma.finderChatMessage.findFirst({
          where: {
            baggageId: baggage.id,
            sender: 'owner',
            NOT: { id: message.id },
          },
          orderBy: { createdAt: 'desc' },
          select: { readByFinder: true },
        });
        if (prevOwnerMsg && !prevOwnerMsg.readByFinder) return;

        // Garde 1 : l'adresse est optionnelle — on prend la plus récente
        // laissée par le trouveur sur ses messages.
        const finderMsg = await prisma.finderChatMessage.findFirst({
          where: { baggageId: baggage.id, sender: 'finder', notifyEmail: { not: null } },
          orderBy: { createdAt: 'desc' },
          select: { notifyEmail: true },
        });
        const finderEmail = finderMsg?.notifyEmail;
        if (!finderEmail) return;

        const { sendEmail, getEmailSettings, getChatReplyEmailTemplate } =
          await import('@/lib/email');
        const emailSettings = await getEmailSettings();
        if (!emailSettings) return;

        // Garde 3 : throttle 60 s par référence
        const recentEmail = await prisma.emailLog.findFirst({
          where: {
            type: 'chat_reply',
            data: { contains: `"${baggage.reference}"` },
            createdAt: { gte: new Date(Date.now() - 60_000) },
          },
          select: { id: true },
        });
        if (recentEmail) return;

        let objectName = 'objet';
        if (baggage.customData) {
          try {
            const parsed = JSON.parse(baggage.customData) as Record<string, unknown>;
            if (typeof parsed?.object_name === 'string' && parsed.object_name) {
              objectName = parsed.object_name;
            }
          } catch {
            /* customData invalide */
          }
        }
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          'https://qrtags.pro';
        const chatUrl = `${baseUrl}/scan/${baggage.reference}`;

        const template = getChatReplyEmailTemplate({
          ownerMessage: text,
          reference: baggage.reference,
          objectName,
          chatUrl,
          receivedAt: new Date(message.createdAt).toLocaleString('fr-FR', {
            dateStyle: 'long',
            timeStyle: 'short',
          }),
        });

        await sendEmail({
          to: finderEmail,
          subject: `💬 Le propriétaire de votre ${objectName} (${baggage.reference}) vous a répondu`,
          html: template.html,
          text: template.text,
          type: 'chat_reply',
          data: { reference: baggage.reference },
        });
      } catch (err) {
        console.error('[chat-reply-email] Finder notify error:', err);
      }
    })();

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('[owner-chat POST] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
