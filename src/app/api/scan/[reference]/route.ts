import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ─── Helpers ────────────────────────────────────────────────────

/** Safely parse a JSON string, returning null on failure */
function safeJsonParse(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── GET handler ────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const baggage = await prisma.baggage.findUnique({
      where: { reference },
      include: { agency: { select: { id: true, name: true } } },
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

    const packType = baggage.packType || 'pratique';

    // Increment scan count asynchronously (fire and forget)
    prisma.baggage.update({
      where: { id: baggage.id },
      data: {
        scanCount: { increment: 1 },
        lastScanDate: new Date(),
      },
    }).catch(() => {
      // Non-bloquant
    });

    // ─── Switch on packType ───────────────────────────────────

    switch (packType) {
      // ─── PRATIQUE : comportement QRTags existant (objets perdus) ───
      case 'pratique': {
        // Si le tag n'a PAS de whatsappOwner, il n'est pas activé
        if (!baggage.whatsappOwner || baggage.whatsappOwner.trim() === '') {
          return NextResponse.json({
            status: 'pending_activation',
            packType: 'pratique',
            message: "Ce tag n'est pas encore activé",
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

        // Parser customData pour afficher les infos objet au trouveur
        let objectInfo: Record<string, unknown> | null = null;
        if (baggage.customData) {
          const parsed = safeJsonParse(baggage.customData);
          if (parsed) {
            const rawPhoto = typeof parsed.photo === 'string' ? parsed.photo : null;
            const safePhoto = rawPhoto && /^data:image\/(jpeg|jpg|png|webp|gif|avif);base64,/i.test(rawPhoto)
              ? rawPhoto
              : null;
            objectInfo = {
              category: parsed.category || null,
              category_label: parsed.category_label || null,
              object_name: parsed.object_name || null,
              object_description: parsed.object_description || null,
              brand: parsed.brand || null,
              model: parsed.model || null,
              color: parsed.color || null,
              reward: parsed.reward || null,
              message_to_finder: parsed.message_to_finder || null,
              city: parsed.city || null,
              country: parsed.country || null,
              photo: safePhoto,
            };
          }
        }

        return NextResponse.json({
          status: isDeclaredLost ? 'lost' : 'active',
          packType: 'pratique',
          theme: baggage.type === 'hajj' ? 'hajj' : 'voyageur',
          type: baggage.type,
          baggage: {
            reference: baggage.reference,
            type: baggage.type,
            travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
            travelerFirstName: baggage.travelerFirstName || null,
            status: baggage.status,
            agency: baggage.agency?.name || null,
            whatsappOwner: baggage.whatsappOwner || null,
            declaredLostAt: baggage.declaredLostAt,
            foundAt: baggage.foundAt,
            createdAt: baggage.createdAt?.toISOString() || null,
            isLost: Boolean(baggage.isLost),
            objectInfo,
          },
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }

      // ─── EMOTION : message audio/texte ───
      case 'emotion': {
        const metadata = safeJsonParse(baggage.contentMetadata);

        return NextResponse.json({
          status: 'active',
          packType: 'emotion',
          contentType: baggage.contentType || 'text',
          content: {
            message: (metadata?.message as string) || null,
            duration: (metadata?.duration as number) || null,
            contentUrl: baggage.contentUrl || null,
          },
          baggage: {
            reference: baggage.reference,
            travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
            createdAt: baggage.createdAt?.toISOString() || null,
          },
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }

      // ─── EVENEMENTIEL : infos événement + livre d'or ───
      case 'evenementiel': {
        const metadata = safeJsonParse(baggage.contentMetadata);

        // Fetch the latest 20 guest messages for this event
        const guestMessages = await prisma.guestMessage.findMany({
          where: { baggageId: baggage.id },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        return NextResponse.json({
          status: 'active',
          packType: 'evenementiel',
          event: {
            eventName: (metadata?.eventName as string) || null,
            eventDate: (metadata?.eventDate as string) || null,
            guestBookEnabled: (metadata?.guestBookEnabled as boolean) ?? true,
            playlistUrl: (metadata?.playlistUrl as string) || null,
          },
          guestMessages: guestMessages.map((msg) => ({
            id: msg.id,
            authorName: msg.authorName,
            content: msg.content,
            contentUrl: msg.contentUrl || null,
            contentType: msg.contentType || 'text',
            createdAt: msg.createdAt.toISOString(),
          })),
          baggage: {
            reference: baggage.reference,
            travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
            createdAt: baggage.createdAt?.toISOString() || null,
          },
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }

      // ─── IMMOBILIER : annonce immobilière ───
      case 'immobilier': {
        const metadata = safeJsonParse(baggage.contentMetadata);

        return NextResponse.json({
          status: 'active',
          packType: 'immobilier',
          property: {
            title: (metadata?.title as string) || null,
            description: (metadata?.description as string) || null,
            price: (metadata?.price as string) || null,
            surface: (metadata?.surface as string) || null,
            rooms: (metadata?.rooms as number) || null,
            images: Array.isArray(metadata?.images) ? metadata.images as string[] : [],
            virtualTourUrl: (metadata?.virtualTourUrl as string) || null,
            agentName: (metadata?.agentName as string) || null,
            agentPhone: (metadata?.agentPhone as string) || null,
          },
          baggage: {
            reference: baggage.reference,
            travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
            createdAt: baggage.createdAt?.toISOString() || null,
          },
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }

      // ─── Unknown packType → fallback to pratique ───
      default: {
        console.warn(`[scan GET] Unknown packType "${packType}" for reference ${reference}, falling back to pratique`);

        if (!baggage.whatsappOwner || baggage.whatsappOwner.trim() === '') {
          return NextResponse.json({
            status: 'pending_activation',
            packType: 'pratique',
            message: "Ce tag n'est pas encore activé",
          });
        }

        return NextResponse.json({
          status: 'active',
          packType,
          theme: baggage.type === 'hajj' ? 'hajj' : 'voyageur',
          type: baggage.type,
          baggage: {
            reference: baggage.reference,
            type: baggage.type,
            travelerName: `${baggage.travelerFirstName} ${baggage.travelerLastName}`,
            status: baggage.status,
            agency: baggage.agency?.name || null,
            whatsappOwner: baggage.whatsappOwner || null,
            createdAt: baggage.createdAt?.toISOString() || null,
          },
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }
    }
  } catch (error) {
    console.error('[scan GET] Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ─── POST handler ───────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();

    const baggage = await prisma.baggage.findUnique({
      where: { reference },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Tag introuvable' },
        { status: 404 }
      );
    }

    const packType = baggage.packType || 'pratique';

    // ─── PRATIQUE : comportement existant (WhatsApp + scan log) ───
    if (packType === 'pratique') {
      const { location, finderName, finderPhone, latitude, longitude, message } = body;

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

      // Construire la chaîne de localisation lisible pour le suivi propriétaire
      const readableLocation = location && location.trim() !== ''
        ? location
        : (latitude && longitude
            ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            : 'Position non partagée');

      // Mettre à jour lastScanDate, lastLocation + INCRÉMENTER scanCount + lastScanLocation
      await prisma.baggage.update({
        where: { id: baggage.id },
        data: {
          lastScanDate: new Date(),
          lastLocation: location || null,
          lastScanLocation: readableLocation,
          scanCount: { increment: 1 },
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
        packType: 'pratique',
        whatsappUrl,
        isDeclaredLost: baggage.declaredLostAt && !baggage.foundAt,
      });
    }

    // ─── EVENEMENTIEL : accepter un message d'invité ───
    if (packType === 'evenementiel') {
      const { authorName, content, contentType } = body;

      if (!content || typeof content !== 'string' || content.trim() === '') {
        return NextResponse.json(
          { error: 'Le contenu du message est requis' },
          { status: 400 }
        );
      }

      if (!authorName || typeof authorName !== 'string' || authorName.trim() === '') {
        return NextResponse.json(
          { error: 'Le nom de l\'auteur est requis' },
          { status: 400 }
        );
      }

      // Check if guest book is enabled
      const metadata = safeJsonParse(baggage.contentMetadata);
      const guestBookEnabled = (metadata?.guestBookEnabled as boolean) ?? true;

      if (!guestBookEnabled) {
        return NextResponse.json(
          { error: 'Le livre d\'or est désactivé pour cet événement' },
          { status: 403 }
        );
      }

      const guestMessage = await prisma.guestMessage.create({
        data: {
          baggageId: baggage.id,
          authorName: authorName.trim(),
          content: content.trim(),
          contentUrl: body.contentUrl || null,
          contentType: contentType || 'text',
        },
      });

      // Log the scan
      await prisma.scanLog.create({
        data: {
          baggageId: baggage.id,
          location: body.location || null,
          message: `Guest message from ${authorName}`,
        },
      }).catch(() => {});

      // Increment scan count
      prisma.baggage.update({
        where: { id: baggage.id },
        data: {
          scanCount: { increment: 1 },
          lastScanDate: new Date(),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        packType: 'evenementiel',
        guestMessage: {
          id: guestMessage.id,
          authorName: guestMessage.authorName,
          content: guestMessage.content,
          contentType: guestMessage.contentType,
          createdAt: guestMessage.createdAt.toISOString(),
        },
      });
    }

    // ─── EMOTION & IMMOBILIER : juste logger le scan (pas de WhatsApp) ───
    await prisma.scanLog.create({
      data: {
        baggageId: baggage.id,
        location: body.location || null,
        finderName: body.finderName || null,
        finderPhone: body.finderPhone || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        message: body.message || null,
      },
    }).catch(() => {});

    // Increment scan count
    prisma.baggage.update({
      where: { id: baggage.id },
      data: {
        scanCount: { increment: 1 },
        lastScanDate: new Date(),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      packType,
      message: 'Scan enregistré',
    });
  } catch (error) {
    console.error('[scan POST] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
