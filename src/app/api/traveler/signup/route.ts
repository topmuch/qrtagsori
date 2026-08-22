import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const PHONE_REGEX = /^\+\d{9,14}$/;
const PIN_REGEX = /^\d{4}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, pin, name } = body;

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

    // Check if phone already exists
    const existing = await db.traveler.findUnique({
      where: { phone },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ce numéro de téléphone est déjà enregistré' },
        { status: 409 }
      );
    }

    // Hash PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create traveler + session
    const traveler = await db.traveler.create({
      data: {
        phone,
        pin: hashedPin,
        name: name || null,
        sessions: {
          create: {
            token: uuidv4(),
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: { sessions: true },
    });

    const session = traveler.sessions[0];

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
    console.error('[traveler/signup] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
