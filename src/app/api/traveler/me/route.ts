import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header or query param
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      const url = new URL(request.url);
      token = url.searchParams.get('token');
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 401 }
      );
    }

    // Find session
    const session = await db.travelerSession.findUnique({
      where: { token },
      include: {
        traveler: {
          include: {
            baggages: {
              select: {
                id: true,
                reference: true,
                status: true,
                scanCount: true,
                lastScanLocation: true,
                lastScanDate: true,
                expiresAt: true,
                customData: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      // Delete expired session
      await db.travelerSession.delete({ where: { id: session.id } });
      return NextResponse.json(
        { error: 'Session expirée' },
        { status: 401 }
      );
    }

    const { pin, ...travelerData } = session.traveler;

    // Parse customData from JSON string for each baggage
    const baggages = session.traveler.baggages.map((b) => ({
      ...b,
      customData: b.customData ? JSON.parse(b.customData) : null,
    }));

    return NextResponse.json({
      success: true,
      traveler: {
        ...travelerData,
        baggages,
      },
    });
  } catch (error) {
    console.error('[traveler/me] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
