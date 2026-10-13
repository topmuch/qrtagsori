import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { VAPID_PUBLIC_KEY } from '@/lib/web-push';

// GET: retourne la clé publique VAPID
export async function GET() {
  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY });
}

// POST: sauvegarder la push subscription du voyageur
export async function POST(request: NextRequest) {
  try {
    // Auth par token
    const authHeader = request.headers.get('authorization');
    const tokenQuery = new URL(request.url).searchParams.get('token');
    const token = authHeader?.replace('Bearer ', '') || tokenQuery;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const session = await db.travelerSession.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      if (session) await db.travelerSession.delete({ where: { id: session.id } });
      return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 });
    }

    // Upsert: supprimer les anciennes subscriptions du même endpoint
    await db.travelerPushSubscription.deleteMany({
      where: { endpoint: subscription.endpoint },
    });

    await db.travelerPushSubscription.create({
      data: {
        travelerId: session.travelerId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[traveler/push-subscribe] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE: supprimer la push subscription
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const tokenQuery = new URL(request.url).searchParams.get('token');
    const token = authHeader?.replace('Bearer ', '') || tokenQuery;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const session = await db.travelerSession.findUnique({ where: { token } });
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint) {
      await db.travelerPushSubscription.deleteMany({
        where: { travelerId: session.travelerId, endpoint },
      });
    } else {
      // Supprimer toutes les subscriptions du voyageur
      await db.travelerPushSubscription.deleteMany({
        where: { travelerId: session.travelerId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[traveler/push-subscribe] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
