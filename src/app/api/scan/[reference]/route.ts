import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Récupérer les infos d'un tag pour la page trouveur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const baggage = await prisma.baggage.findUnique({
      where: { reference },
      include: { agency: true },
    });

    if (!baggage) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Code QR non valide',
      }, { status: 404 });
    }

    if (baggage.status === 'blocked') {
      return NextResponse.json({
        status: 'blocked',
        message: 'Ce tag a été bloqué',
      });
    }

    // Check expiration
    if (baggage.expiresAt && new Date() > baggage.expiresAt) {
      return NextResponse.json({
        status: 'expired',
        message: 'Ce tag a expiré',
        agency: baggage.agency?.name || null,
        baggage: {
          type: baggage.type,
          travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
        },
      });
    }

    // Check if declared lost
    const isDeclaredLost = baggage.declaredLostAt && !baggage.foundAt;

    return NextResponse.json({
      status: isDeclaredLost ? 'lost' : 'active',
      theme: baggage.type === 'hajj' ? 'hajj' : 'voyageur',
      type: baggage.type,
      baggage: {
        reference: baggage.reference,
        type: baggage.type,
        travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
        baggageIndex: baggage.baggageIndex,
        baggageType: baggage.baggageType,
        status: baggage.status,
        agency: baggage.agency?.name || null,
        whatsappOwner: baggage.whatsappOwner || null,
        declaredLostAt: baggage.declaredLostAt,
        foundAt: baggage.foundAt,
        createdAt: baggage.createdAt?.toISOString() || null,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[scan GET] Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Logger un scan (quand le trouveur clique sur WhatsApp)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const { location, finderName, finderPhone, latitude, longitude, message } = body;

    const baggage = await prisma.baggage.findUnique({
      where: { reference },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Tag introuvable' },
        { status: 404 }
      );
    }

    // Logger le scan
    await prisma.scanLog.create({
      data: {
        baggageId: baggage.id,
        location: location || null,
        finderName: finderName || null,
        finderPhone: finderPhone || null,
        latitude: latitude || null,
        longitude: longitude || null,
        message: message || null,
      },
    }).catch(() => {
      // Non-bloquant si le log échoue
    });

    // Mettre à jour lastScanDate et lastLocation
    await prisma.baggage.update({
      where: { id: baggage.id },
      data: {
        lastScanDate: new Date(),
        lastLocation: location || null,
        founderName: finderName || null,
        founderPhone: finderPhone || null,
        founderAt: new Date(),
      },
    }).catch(() => {
      // Non-bloquant
    });

    // Construire l'URL WhatsApp WAME
    const ownerFirstName = baggage.travelerFirstName?.trim() || '';
    const typeLabel = 'objet';
    const lieu = location || 'lieu non précisé';
    const address = latitude && longitude
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : lieu;

    const whatsappText =
      `Bonjour${ownerFirstName ? ` ${ownerFirstName}` : ''}, ` +
      `j'ai trouvé votre ${typeLabel} (réf. ${reference}). ` +
      `Je suis actuellement à cette position : ${address}. ` +
      `— Message envoyé via QRTags.` +
      (finderName ? ` Trouveur : ${finderName}.` : '') +
      (finderPhone ? ` Contact : ${finderPhone}.` : '');

    const phone = (baggage.whatsappOwner || '').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;

    return NextResponse.json({
      success: true,
      whatsappUrl,
      isDeclaredLost: baggage.declaredLostAt && !baggage.foundAt,
    });
  } catch (error) {
    console.error('[scan POST] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
