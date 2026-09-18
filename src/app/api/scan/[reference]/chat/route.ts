import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Chat anonyme — côté TROUVEUR (capability = référence publique du tag).
 * GET  ?after=ISO → fil de discussion (incrémental), sans jamais renvoyer de numéro.
 * POST { body, senderLabel? } → nouveau message du trouveur + notification propriétaire.
 */

const MAX_BODY_LEN = 1000;
const MAX_LABEL_LEN = 40;

/** Strip HTML + normalize whitespace + hard length cap. */
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const baggage = await prisma.baggage.findUnique({
      where: { reference },
      select: { id: true, status: true },
    });
    if (!baggage) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }
    if (baggage.status === 'blocked') {
      return NextResponse.json({ error: 'Tag bloqué' }, { status: 403 });
    }

    const after = request.nextUrl.searchParams.get('after');
    const messages = await prisma.finderChatMessage.findMany({
      where: {
        baggageId: baggage.id,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: { id: true, sender: true, senderLabel: true, body: true, createdAt: true },
    });

    // Marquer les messages du propriétaire comme lus côté trouveur
    if (messages.some((m) => m.sender === 'owner')) {
      await prisma.finderChatMessage.updateMany({
        where: { baggageId: baggage.id, sender: 'owner', readByFinder: false },
        data: { readByFinder: true },
      });
    }

    return NextResponse.json(
      { messages },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('[finder-chat GET] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    // Anti-abus : 10 messages / minute / IP / référence
    if (rateLimit(`chat-finder:${getClientIp(request)}:${reference}`, { windowMs: 60_000, maxRequests: 10 })) {
      return NextResponse.json({ error: 'Trop de messages, patientez un instant' }, { status: 429 });
    }

    const body = await request.json();
    const text = sanitizeText(body?.body, MAX_BODY_LEN);
    if (!text) {
      return NextResponse.json({ error: 'Le message est requis' }, { status: 400 });
    }
    const senderLabel = sanitizeText(body?.senderLabel, MAX_LABEL_LEN) || null;

    const baggage = await prisma.baggage.findUnique({
      where: { reference },
      select: { id: true, status: true, travelerId: true, trackingToken: true, customData: true },
    });
    if (!baggage) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }
    if (baggage.status === 'blocked') {
      return NextResponse.json({ error: 'Tag bloqué' }, { status: 403 });
    }

    const message = await prisma.finderChatMessage.create({
      data: {
        baggageId: baggage.id,
        sender: 'finder',
        senderLabel,
        body: text,
        readByFinder: true, // l'auteur vient de l'écrire
      },
      select: { id: true, sender: true, senderLabel: true, body: true, createdAt: true },
    });

    // ─── Notification push au propriétaire (fire-and-forget) ───
    (async () => {
      try {
        if (!baggage.travelerId) return;
        const subs = await prisma.travelerPushSubscription.findMany({
          where: { travelerId: baggage.travelerId },
        });
        if (subs.length === 0) return;

        const { webpush } = await import('@/lib/web-push');
        const payload = JSON.stringify({
          title: '💬 Nouveau message du trouveur',
          body: `${senderLabel || 'Le trouveur'} vous a écrit au sujet de votre tag (${reference}).`,
          url: baggage.trackingToken
            ? `/track/${baggage.trackingToken}`
            : `/suivi/${reference}`,
          tag: `qrtags-chat-${reference}`,
        });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
          } catch (err) {
            console.error('[chat-push] Failed for', sub.endpoint, err);
            await prisma.travelerPushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[chat-push] Owner notify error:', err);
      }
    })();

    // ─── Notification e-mail au propriétaire (s'il n'est pas connecté) ───
    // Fire-and-forget : ne ralentit jamais la réponse au trouveur.
    // Anti-spam à deux niveaux :
    //  1. Un seul e-mail par « lot » de messages non lus (le message
    //     précédent du trouveur doit avoir été lu, ou n'exister).
    //  2. Maximum 1 e-mail / 60 s / référence (si le propriétaire garde
    //     le chat ouvert pendant une conversation active).
    (async () => {
      try {
        // Garde 1 : le lot de messages non lus a-t-il déjà été notifié ?
        const prevFinderMsg = await prisma.finderChatMessage.findFirst({
          where: {
            baggageId: baggage.id,
            sender: 'finder',
            NOT: { id: message.id },
          },
          orderBy: { createdAt: 'desc' },
          select: { readByOwner: true },
        });
        if (prevFinderMsg && !prevFinderMsg.readByOwner) return;

        // E-mail du propriétaire = optionnel (Baggage.customData JSON)
        let custom: Record<string, unknown> = {};
        if (baggage.customData) {
          try {
            custom = JSON.parse(baggage.customData) as Record<string, unknown>;
          } catch {
            custom = {};
          }
        }
        const ownerEmail = typeof custom.email === 'string' ? custom.email.trim() : '';
        if (!ownerEmail || !ownerEmail.includes('@')) return;

        const { sendEmail, getEmailSettings, getChatMessageEmailTemplate } =
          await import('@/lib/email');
        const emailSettings = await getEmailSettings();
        if (!emailSettings) return;

        // Garde 2 : throttle 60 s par référence
        const recentEmail = await prisma.emailLog.findFirst({
          where: {
            type: 'chat_message',
            data: { contains: `"${reference}"` },
            createdAt: { gte: new Date(Date.now() - 60_000) },
          },
          select: { id: true },
        });
        if (recentEmail) return;

        const objectName =
          typeof custom.object_name === 'string' && custom.object_name
            ? custom.object_name
            : 'objet';
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          'https://qrtags.pro';
        const trackingUrl = baggage.trackingToken
          ? `${baseUrl}/track/${baggage.trackingToken}`
          : `${baseUrl}/suivi/${reference}`;

        const template = getChatMessageEmailTemplate({
          senderLabel: senderLabel || 'Le trouveur',
          message: text,
          reference,
          objectName,
          trackingUrl,
          receivedAt: new Date(message.createdAt).toLocaleString('fr-FR', {
            dateStyle: 'long',
            timeStyle: 'short',
          }),
        });

        await sendEmail({
          to: ownerEmail,
          subject: `💬 ${senderLabel || 'Un trouveur'} vous a écrit au sujet de votre ${objectName} (${reference})`,
          html: template.html,
          text: template.text,
          type: 'chat_message',
          data: { reference, senderLabel },
        });
      } catch (err) {
        console.error('[chat-email] Owner notify error:', err);
      }
    })();

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('[finder-chat POST] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
