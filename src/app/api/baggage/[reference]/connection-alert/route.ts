import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { sendEmail, getConnectionMissedEmailTemplate } from '@/lib/email';
import { evaluateConnection, isAviationStackConfigured } from '@/lib/aviationstack';

// ─── LABS — Feature #5: Alerte de Correspondance Manquée ───
//
// 2 modes de déclenchement:
//  - "manual" : le propriétaire signale un retard + saisit sa correspondance
//  - "auto"   : détecté automatiquement via AviationStack (à venir, nécessite
//               que l'utilisateur ait configuré AVIATIONSTACK_API_KEY)
//
// Dans les 2 cas, on calcule si la correspondance est ok / at_risk / missed
// et on envoie un email d'alerte (avec anti-spam 1h entre 2 envois).

const connectionAlertSchema = z.object({
  pin: z.string().min(4).max(8),
  // Mode manuel : le propriétaire saisit les infos
  delayMinutes: z.number().min(0).max(1440).optional(), // retard en minutes
  connectingFlight: z.string().min(2).max(20).optional(), // ex: "AF456"
  connectionTimeMinutes: z.number().min(15).max(720).optional(), // temps correspondance prévu
  // Mode auto : utiliser AviationStack
  autoCheck: z.boolean().optional(),
});

const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1h entre 2 alertes (anti-spam)
const MIN_CONNECTION_TIME = 45; // 45 min minimum pour correspondance sûre

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const validated = connectionAlertSchema.parse(body);

    // Récupérer le baggage
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        id: true,
        ownerPin: true,
        status: true,
        flightNumber: true,
        connectingFlight: true,
        connectionAlertSentAt: true,
        travelerFirstName: true,
        travelerLastName: true,
        agency: { select: { email: true } },
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Bagage introuvable' },
        { status: 404 }
      );
    }

    if (baggage.status === 'pending_activation') {
      return NextResponse.json(
        { error: 'Ce bagage n\'est pas encore activé' },
        { status: 400 }
      );
    }

    // Vérifier le PIN
    if (!baggage.ownerPin) {
      return NextResponse.json(
        { error: 'Aucun PIN défini. Impossible d\'utiliser cette fonctionnalité.' },
        { status: 400 }
      );
    }

    const pinValid = await bcrypt.compare(validated.pin, baggage.ownerPin);
    if (!pinValid) {
      return NextResponse.json(
        { error: 'PIN incorrect' },
        { status: 401 }
      );
    }

    // ─── Anti-spam : 1h minimum entre 2 alertes ───
    if (baggage.connectionAlertSentAt) {
      const elapsed = Date.now() - baggage.connectionAlertSentAt.getTime();
      if (elapsed < ALERT_COOLDOWN_MS) {
        const minutesLeft = Math.ceil((ALERT_COOLDOWN_MS - elapsed) / 60000);
        return NextResponse.json(
          {
            error: `Une alerte a déjà été envoyée récemment. Réessayez dans ${minutesLeft} min.`,
            cooldown: true,
          },
          { status: 429 }
        );
      }
    }

    // ─── Déterminer le mode : auto (AviationStack) ou manuel ───
    let delayMinutes: number;
    let connectingFlight: string;
    let connectionTimeMinutes: number;
    let dataSource: 'manual' | 'aviationstack';

    if (validated.autoCheck) {
      // Mode auto via AviationStack
      if (!isAviationStackConfigured()) {
        return NextResponse.json(
          {
            error: 'Détection automatique indisponible. AviationStack API key non configurée. Utilisez le mode manuel.',
            autoCheckAvailable: false,
          },
          { status: 400 }
        );
      }

      if (!baggage.flightNumber) {
        return NextResponse.json(
          { error: 'Aucun numéro de vol initial enregistré pour ce bagage.' },
          { status: 400 }
        );
      }

      // Lazy import pour éviter de charger si pas nécessaire
      const { getFlightStatus } = await import('@/lib/aviationstack');
      const flightStatus = await getFlightStatus(baggage.flightNumber);

      if (!flightStatus || flightStatus.departure.delay === null) {
        return NextResponse.json(
          {
            error: 'Statut du vol indisponible pour le moment. Réessayez plus tard ou utilisez le mode manuel.',
            flightStatus: flightStatus ? 'no_delay_data' : 'not_found',
          },
          { status: 404 }
        );
      }

      delayMinutes = flightStatus.departure.delay;
      connectingFlight = baggage.connectingFlight || validated.connectingFlight || '';
      connectionTimeMinutes = validated.connectionTimeMinutes || 90; // défaut 90 min
      dataSource = 'aviationstack';

      if (!connectingFlight) {
        return NextResponse.json(
          { error: 'Aucun vol de correspondance enregistré. Saisissez-le via "Modifier mon profil".' },
          { status: 400 }
        );
      }
    } else {
      // Mode manuel
      if (validated.delayMinutes === undefined
          || !validated.connectingFlight
          || validated.connectionTimeMinutes === undefined) {
        return NextResponse.json(
          {
            error: 'Mode manuel : delayMinutes, connectingFlight et connectionTimeMinutes sont requis.',
          },
          { status: 400 }
        );
      }

      delayMinutes = validated.delayMinutes;
      connectingFlight = validated.connectingFlight;
      connectionTimeMinutes = validated.connectionTimeMinutes;
      dataSource = 'manual';
    }

    // ─── Calculer le statut de la correspondance ───
    const connectionStatus = evaluateConnection(
      delayMinutes,
      connectionTimeMinutes,
      MIN_CONNECTION_TIME
    );

    if (connectionStatus === 'ok') {
      return NextResponse.json({
        success: true,
        status: 'ok',
        message: `Retard de ${delayMinutes} min, mais correspondance de ${connectionTimeMinutes - delayMinutes} min encore suffisante. Aucune alerte envoyée.`,
        delayMinutes,
        effectiveConnectionTime: connectionTimeMinutes - delayMinutes,
      });
    }

    // ─── Envoyer l'email d'alerte (at_risk ou missed) ───
    const effectiveConnectionTime = connectionTimeMinutes - delayMinutes;
    const travelerName = `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim() || 'Voyageur';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrbags.com';
    const trackingUrl = `${appUrl}/suivi/${reference}`;

    const emailTemplate = getConnectionMissedEmailTemplate({
      travelerName,
      reference: baggage.reference,
      firstFlightNumber: baggage.flightNumber || 'N/A',
      connectingFlight,
      delayMinutes,
      connectionTimeMinutes,
      effectiveConnectionTime,
      status: connectionStatus,
      dataSource,
      trackingUrl,
    });

    const notifEmail = baggage.agency?.email || 'proprietaire@qrbag.com';
    const emailResult = await sendEmail({
      to: notifEmail,
      subject: connectionStatus === 'missed'
        ? `❌ Correspondance manquée — ${baggage.reference}`
        : `⚠️ Correspondance serrée — ${baggage.reference}`,
      html: emailTemplate.html,
      text: emailTemplate.text,
      type: 'connection_alert',
    });

    // ─── Mettre à jour le baggage (connectingFlight si fourni + timestamp alerte) ───
    await db.baggage.update({
      where: { id: baggage.id },
      data: {
        connectingFlight: connectingFlight !== baggage.connectingFlight ? connectingFlight : undefined,
        connectionAlertSentAt: new Date(),
        lastDelayCheckAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      status: connectionStatus,
      delayMinutes,
      connectionTimeMinutes,
      effectiveConnectionTime,
      emailSent: emailResult.success,
      emailError: emailResult.error,
      dataSource,
      message: connectionStatus === 'missed'
        ? `❌ Correspondance manquée. Retard de ${delayMinutes} min dépassant le temps de correspondance (${connectionTimeMinutes} min). Email envoyé.`
        : `⚠️ Correspondance à risque. Il ne reste que ${effectiveConnectionTime} min pour la correspondance (minimum recommandé: ${MIN_CONNECTION_TIME} min). Email envoyé.`,
    });
  } catch (error) {
    console.error('[connection-alert] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
