import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const PHONE_REGEX = /^\+\d{9,14}$/;
const PIN_REGEX = /^\d{4}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { phone, pin } = body;

    // Normalize phone: strip spaces, dashes, dots
    phone = (phone || '').replace(/[\s\-\.]/g, '');

    // Validate phone
    if (!phone || typeof phone !== 'string' || !PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide. Format international requis (ex: +33612345678)' },
        { status: 400 }
      );
    }

    // Validate PIN
    if (!pin || typeof pin !== 'string' || !PIN_REGEX.test(pin)) {
      return NextResponse.json(
        { error: 'Le PIN doit être composé de exactement 4 chiffres' },
        { status: 400 }
      );
    }

    // Find traveler
    const traveler = await db.traveler.findUnique({
      where: { phone },
    });

    if (!traveler) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Compare PIN
    const valid = await bcrypt.compare(pin, traveler.pin);
    if (!valid) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Create session
    const session = await db.travelerSession.create({
      data: {
        token: uuidv4(),
        travelerId: traveler.id,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      token: session.token,
      traveler: {
        id: traveler.id,
        phone: traveler.phone,
        name: traveler.name,
      },
    });
  } catch (error) {
    console.error('[traveler/login] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
