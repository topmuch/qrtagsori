import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ─── LABS — Feature H: Export PDF parcours bagage ───
//
// Génère un PDF officiel avec l'historique complet du bagage.
// Utilisable comme preuve pour assurances et compagnies aériennes.
//
// Auth : PIN propriétaire (passé en query param ?pin=1234 pour GET download)

interface ScanLogRow {
  location: string | null;
  city: string | null;
  country: string | null;
  ipAddress: string | null;
  finderName: string | null;
  finderPhone: string | null;
  context: string | null;
  createdAt: Date;
}

const BRAND_BLUE = rgb(0x00 / 255, 0x47 / 255, 0xd6 / 255);
const BRAND_YELLOW = rgb(0xfc / 255, 0xd6 / 255, 0x16 / 255);
const INK = rgb(0x1a / 255, 0x1a / 255, 0x1a / 255);
const SLATE_600 = rgb(0x47 / 255, 0x55 / 255, 0x69 / 255);
const SLATE_400 = rgb(0x94 / 255, 0xa3 / 255, 0xb8 / 255);

function formatDate(date: Date | null | undefined, locale = 'fr-FR'): string {
  if (!date) return '—';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const pin = request.nextUrl.searchParams.get('pin');

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN requis (paramètre ?pin=XXXX)' },
        { status: 400 }
      );
    }

    // Récupérer le baggage avec scans + agency
    const baggage = await db.baggage.findUnique({
      where: { reference },
      include: {
        agency: true,
        scanLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
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
      return NextResponse.json(
        { error: 'Aucun PIN défini pour ce bagage' },
        { status: 400 }
      );
    }

    if (!pinValid) {
      return NextResponse.json(
        { error: 'PIN incorrect' },
        { status: 401 }
      );
    }

    // ─── Générer le PDF avec pdf-lib ───
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`QRTags — Parcours bagage ${reference}`);
    pdfDoc.setAuthor('QRTags');
    pdfDoc.setSubject('Historique officiel du bagage');
    pdfDoc.setCreator('QRTags Labs');
    pdfDoc.setProducer('QRTags');
    pdfDoc.setCreationDate(new Date());

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // ─── Header : bandeau bleu QRTags ───
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width,
      height: 80,
      color: BRAND_BLUE,
    });
    // Bandeau jaune (accent)
    page.drawRectangle({
      x: 0,
      y: height - 84,
      width,
      height: 4,
      color: BRAND_YELLOW,
    });

    page.drawText('QRTags', {
      x: margin,
      y: height - 50,
      size: 24,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('Historique officiel du bagage', {
      x: margin,
      y: height - 70,
      size: 11,
      font: fontRegular,
      color: rgb(1, 1, 1),
    });

    y = height - 110;

    // ─── Section 1 : Informations bagage ───
    page.drawText('Informations du bagage', {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: BRAND_BLUE,
    });
    y -= 20;

    const travelerName = `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim() || 'Non renseigné';
    const transportLabel = baggage.transportMode === 'flight' ? 'Avion'
      : baggage.transportMode === 'train' ? 'Train'
      : baggage.transportMode === 'boat' ? 'Bateau'
      : baggage.transportMode === 'bus' ? 'Bus'
      : baggage.transportMode;

    const infoRows: Array<[string, string]> = [
      ['Référence', baggage.reference],
      ['Type', baggage.type === 'hajj' ? 'Hajj / Omra' : 'Voyageur'],
      ['Voyageur', travelerName],
      ['Mode de transport', transportLabel],
      ['Compagnie', baggage.airlineName || baggage.trainCompany || baggage.shipName || baggage.busCompany || '—'],
      ['Numéro vol/train/bus', baggage.flightNumber || baggage.trainNumber || baggage.busLineNumber || '—'],
      ['Destination', baggage.destination || '—'],
      ['Date de départ', baggage.departureDate ? formatDate(baggage.departureDate) : '—'],
      ['Agence', baggage.agency?.name || '—'],
      ['Statut actuel', baggage.status === 'active' ? 'Actif' : baggage.status === 'scanned' ? 'Scanné' : baggage.status === 'lost' ? 'Perdu' : baggage.status === 'found' ? 'Trouvé' : baggage.status],
      ['Mode transit', baggage.transitMode === 'inactive' ? 'Désactivé par le propriétaire' : 'Actif'],
      ['Date d\'activation', baggage.createdAt ? formatDate(baggage.createdAt) : '—'],
      ['Expiration', baggage.expiresAt ? formatDate(baggage.expiresAt) : 'Selon formule'],
      ['Dernier scan', baggage.lastScanDate ? formatDate(baggage.lastScanDate) : 'Aucun'],
      ['Dernière position', baggage.lastLocation || '—'],
      ['Scans suspects (pays mismatch)', String(baggage.suspiciousScanCount || 0)],
    ];

    for (const [label, value] of infoRows) {
      page.drawText(label, {
        x: margin,
        y,
        size: 10,
        font: fontRegular,
        color: SLATE_600,
      });
      const displayValue = value.length > 60 ? value.substring(0, 57) + '...' : value;
      page.drawText(displayValue, {
        x: margin + 180,
        y,
        size: 10,
        font: fontBold,
        color: INK,
      });
      y -= 16;
    }

    y -= 10;

    // ─── Section 2 : Statistiques ───
    page.drawText('Statistiques', {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: BRAND_BLUE,
    });
    y -= 20;

    const totalScans = baggage.scanLogs.length;
    const uniqueCountries = new Set(
      baggage.scanLogs
        .map((s: ScanLogRow) => s.country)
        .filter((c: string | null): c is string => !!c)
    ).size;
    const uniqueCities = new Set(
      baggage.scanLogs
        .map((s: ScanLogRow) => s.city)
        .filter((c: string | null): c is string => !!c)
    ).size;

    const statsRows: Array<[string, string]> = [
      ['Nombre total de scans', String(totalScans)],
      ['Pays différents', String(uniqueCountries)],
      ['Villes différentes', String(uniqueCities)],
      ['Premier scan', baggage.scanLogs.length > 0 ? formatDate(baggage.scanLogs[baggage.scanLogs.length - 1].createdAt) : '—'],
      ['Dernier scan', baggage.scanLogs.length > 0 ? formatDate(baggage.scanLogs[0].createdAt) : '—'],
    ];

    for (const [label, value] of statsRows) {
      page.drawText(label, {
        x: margin,
        y,
        size: 10,
        font: fontRegular,
        color: SLATE_600,
      });
      page.drawText(value, {
        x: margin + 180,
        y,
        size: 10,
        font: fontBold,
        color: INK,
      });
      y -= 16;
    }

    y -= 10;

    // ─── Section 3 : Historique des scans ───
    page.drawText('Historique des scans', {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: BRAND_BLUE,
    });
    y -= 20;

    if (baggage.scanLogs.length === 0) {
      page.drawText('Aucun scan enregistré.', {
        x: margin,
        y,
        size: 10,
        font: fontRegular,
        color: SLATE_400,
      });
      y -= 16;
    } else {
      // En-têtes de tableau
      const colX = [margin, margin + 110, margin + 240, margin + 360, margin + 460];
      const colHeaders = ['Date', 'Lieu', 'Pays', 'IP', 'Trouveur'];

      for (let i = 0; i < colHeaders.length; i++) {
        page.drawText(colHeaders[i], {
          x: colX[i],
          y,
          size: 9,
          font: fontBold,
          color: SLATE_600,
        });
      }
      y -= 6;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 0.5,
        color: SLATE_400,
      });
      y -= 12;

      // Lignes du tableau
      for (const scan of baggage.scanLogs) {
        // Vérifier s'il faut changer de page
        if (y < margin + 40) {
          // Nouvelle page
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          // TODO: pour simplifier, on continue sur nouvelle page avec même y
          // (en pratique, pdf-lib gère les pages via pdfDoc.addPage)
          y = 841.89 - margin;
        }

        const scanRow = scan as ScanLogRow;
        const dateStr = formatDate(scanRow.createdAt);
        const locationStr = scanRow.city || scanRow.location || '—';
        const countryStr = scanRow.country || '—';
        const ipStr = scanRow.ipAddress || '—';
        const finderStr = scanRow.finderName || '—';

        page.drawText(dateStr.length > 18 ? dateStr.substring(0, 18) : dateStr, {
          x: colX[0], y, size: 9, font: fontRegular, color: INK,
        });
        page.drawText(locationStr.length > 20 ? locationStr.substring(0, 20) : locationStr, {
          x: colX[1], y, size: 9, font: fontRegular, color: INK,
        });
        page.drawText(countryStr.length > 15 ? countryStr.substring(0, 15) : countryStr, {
          x: colX[2], y, size: 9, font: fontMono, color: INK,
        });
        page.drawText(ipStr.length > 15 ? ipStr.substring(0, 15) : ipStr, {
          x: colX[3], y, size: 9, font: fontMono, color: INK,
        });
        page.drawText(finderStr.length > 15 ? finderStr.substring(0, 15) : finderStr, {
          x: colX[4], y, size: 9, font: fontRegular, color: INK,
        });
        y -= 14;
      }
    }

    y -= 20;

    // ─── Footer : timestamp + URL de vérification ───
    if (y < margin + 80) {
      // Place insuffisante, on aura déjà ajouté une page si besoin
      y = margin + 80;
    }

    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: SLATE_400,
    });
    y -= 16;

    const generatedAt = formatDate(new Date());
    page.drawText(`Document généré le ${generatedAt}`, {
      x: margin, y, size: 9, font: fontRegular, color: SLATE_600,
    });
    y -= 14;
    page.drawText('QRTags — Protection intelligente des bagages', {
      x: margin, y, size: 9, font: fontBold, color: BRAND_BLUE,
    });
    y -= 14;

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://qrtags.com'}/suivi/${reference}`;
    page.drawText(`URL de vérification : ${verifyUrl}`, {
      x: margin, y, size: 9, font: fontMono, color: SLATE_600,
    });
    y -= 14;
    page.drawText('⚠️ Ce document est une preuve d\'historique. Pour toute réclamation, contactez votre compagnie aérienne ou assurance.', {
      x: margin, y, size: 8, font: fontRegular, color: SLATE_400,
    });

    // ─── Renvoyer le PDF ───
    const pdfBytes = await pdfDoc.save();
    const filename = `QRTags-parcours-${reference}-${Date.now()}.pdf`;

    return new NextResponse(new Uint8Array(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[export-pdf] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
