import { NextRequest, NextResponse } from 'next/server';
import { ZipArchive } from 'archiver';
import { db } from '@/lib/db';
import {
  generateQRCodeImage,
  formatPassengerFolderName,
} from '@/lib/qr-server';

/**
 * POST /api/admin/baggages/export-zip
 *
 * Export QR codes as a ZIP file organized by passenger.
 * Uses streaming to handle large exports (1800+ QR codes) without memory issues.
 *
 * Body:
 *   - agencyId: string (required) - Filter by agency
 *   - type: 'hajj' | 'voyageur' (optional) - Filter by type
 *   - setId: string (optional) - Export a specific set only
 *   - setIds: string[] (optional) - Export multiple specific sets
 *   - status: string (optional) - Filter by status
 *
 * Response: ZIP file stream
 */

// Max QR codes per export to prevent server overload
const MAX_EXPORT_SIZE = 5000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, type, setId, setIds, status } = body;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (agencyId && agencyId !== '__all__') {
      where.agencyId = agencyId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Filter by specific set(s)
    if (setId) {
      where.setId = setId;
    } else if (setIds && Array.isArray(setIds) && setIds.length > 0) {
      where.setId = { in: setIds };
    }

    // If no filter at all, reject to prevent accidental massive exports
    if (!agencyId && !setId && (!setIds || setIds.length === 0)) {
      return NextResponse.json(
        { error: 'Veuillez spécifier au moins un filtre (agencyId, setId, ou setIds)' },
        { status: 400 }
      );
    }

    // First, count total baggages to check size
    const totalCount = await db.baggage.count({ where });

    if (totalCount === 0) {
      return NextResponse.json(
        { error: 'Aucun baggage trouvé avec ces critères' },
        { status: 404 }
      );
    }

    if (totalCount > MAX_EXPORT_SIZE) {
      return NextResponse.json(
        { error: `Trop de bagages (${totalCount}). Maximum ${MAX_EXPORT_SIZE} par export. Veuillez filtrer par type ou par set.` },
        { status: 400 }
      );
    }

    // Fetch baggages
    const baggages = await db.baggage.findMany({
      where,
      include: { agency: true },
      orderBy: [{ setId: 'asc' }, { baggageIndex: 'asc' }],
    });

    // Get base URL from request - handle both http/https and x-forwarded-proto
    const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
    const host = request.headers.get('host') || request.nextUrl.host;
    const baseUrl = `${protocol}://${host}`;

    // Build a map of setId -> traveler info for folder naming
    const travelerInfoMap = new Map<string, { firstName: string | null; lastName: string | null }>();
    const setIdOrder: string[] = [];

    for (const baggage of baggages) {
      const key = baggage.setId || baggage.reference.split('-')[0];
      if (!travelerInfoMap.has(key)) {
        travelerInfoMap.set(key, {
          firstName: baggage.travelerFirstName,
          lastName: baggage.travelerLastName,
        });
        setIdOrder.push(key);
      }
    }

    // Sort setIds for consistent ordering
    const sortedSetIds = setIdOrder.sort();

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const agencyName = baggages[0]?.agency?.name || 'export';
    const baggageType = type || 'all';
    const zipFilename = `QRBag-${agencyName}-${baggageType}-${baggages.length}QR-${timestamp}.zip`;

    // Group baggages by setId for batch processing
    const baggagesBySetId = new Map<string, typeof baggages>();
    for (const baggage of baggages) {
      const key = baggage.setId || baggage.reference.split('-')[0];
      if (!baggagesBySetId.has(key)) {
        baggagesBySetId.set(key, []);
      }
      baggagesBySetId.get(key)!.push(baggage);
    }

    // Create ZIP archive using streaming approach
    const archive = new ZipArchive({
      zlib: { level: 6 },
    });

    // Handle archive errors
    let archiveError: Error | null = null;
    archive.on('error', (err: Error) => {
      console.error('[EXPORT-ZIP] Archive error:', err);
      archiveError = err;
    });

    // Process QR codes in chunks and add to archive progressively
    // This avoids loading all QR images in memory at once
    const CHUNK_SIZE = 25; // Process 25 passengers at a time

    for (let chunkStart = 0; chunkStart < sortedSetIds.length; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, sortedSetIds.length);
      const chunkSetIds = sortedSetIds.slice(chunkStart, chunkEnd);

      // Generate QR images for this chunk
      const chunkPromises = chunkSetIds.map(async (currentSetId, relativeIndex) => {
        const setBaggages = baggagesBySetId.get(currentSetId) || [];
        const globalIndex = chunkStart + relativeIndex;
        const travelerInfo = travelerInfoMap.get(currentSetId);

        const folderName = formatPassengerFolderName(
          globalIndex,
          currentSetId,
          travelerInfo?.firstName,
          travelerInfo?.lastName,
        );

        const entries: Array<{ data: Buffer; name: string }> = [];

        // Generate QR images for each baggage in this set
        for (const baggage of setBaggages) {
          try {
            const image = await generateQRCodeImage({
              reference: baggage.reference,
              type: baggage.type as 'hajj' | 'voyageur',
              baggageIndex: baggage.baggageIndex,
              baggageType: baggage.baggageType,
              baseUrl,
            });
            entries.push({
              data: image.buffer,
              name: `${folderName}/${image.filename}`,
            });
          } catch (qrError) {
            console.error(`[EXPORT-ZIP] Error generating QR for ${baggage.reference}:`, qrError);
            // Skip this QR code rather than failing the entire export
          }
        }

        // Add README for this passenger
        const readmeContent = generatePassengerReadme(
          currentSetId,
          setBaggages.map(b => ({
            reference: b.reference,
            baggageIndex: b.baggageIndex,
            baggageType: b.baggageType,
          })),
          travelerInfo?.firstName,
          travelerInfo?.lastName,
        );
        entries.push({
          data: Buffer.from(readmeContent, 'utf-8'),
          name: `${folderName}/README.txt`,
        });

        return entries;
      });

      // Wait for this chunk to finish
      const chunkResults = await Promise.all(chunkPromises);

      // Add entries to archive
      for (const entries of chunkResults) {
        for (const entry of entries) {
          archive.append(entry.data, { name: entry.name });
        }
      }
    }

    // Add a global manifest file
    const manifestContent = generateManifest(baggages, sortedSetIds, travelerInfoMap);
    archive.append(manifestContent, { name: '_MANIFEST.txt' });

    // Finalize the archive
    await archive.finalize();

    if (archiveError) {
      throw archiveError;
    }

    // Convert archive stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of archive as unknown as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const zipBuffer = Buffer.concat(chunks);

    // Return ZIP file with proper headers
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[EXPORT-ZIP] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export ZIP', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate a README.txt for each passenger folder
 */
function generatePassengerReadme(
  setId: string,
  images: Array<{ reference: string; baggageIndex: number; baggageType: string }>,
  firstName?: string | null,
  lastName?: string | null,
): string {
  const lines: string[] = [
    '===================================',
    '  QRBag - QR Codes Bagage',
    '===================================',
    '',
    `Set ID    : ${setId}`,
    `Passager  : ${firstName || 'En attente d\'activation'} ${lastName || ''}`.trim(),
    `Date      : ${new Date().toLocaleDateString('fr-FR')}`,
    '',
    '--- QR Codes ---',
    '',
  ];

  for (const img of images) {
    const typeLabel = img.baggageType === 'cabine' ? 'Bagage cabine' : 'Bagage soute';
    lines.push(`  ${typeLabel} #${img.baggageIndex}: ${img.reference}`);
  }

  lines.push('');
  lines.push('--- Instructions ---');
  lines.push('');
  lines.push('1. Imprimez chaque QR code sur une etiquette.');
  lines.push('2. Collez chaque etiquette sur le bagage correspondant.');
  lines.push('3. Le voyageur active ses QR codes sur qrbags.com/activate');
  lines.push('4. Si un bagage est perdu, le trouveur scanne le QR code');
  lines.push('   et le proprietaire recoit une notification WhatsApp.');
  lines.push('');
  lines.push('QRBag - Protegez vos bagages, en toute serenite.');

  return lines.join('\n');
}

/**
 * Generate a global manifest for the ZIP
 */
function generateManifest(
  baggages: Array<{
    reference: string;
    type: string;
    setId: string | null;
    baggageIndex: number;
    baggageType: string;
    travelerFirstName: string | null;
    travelerLastName: string | null;
    status: string;
    createdAt: Date;
  }>,
  sortedSetIds: string[],
  travelerInfoMap: Map<string, { firstName: string | null; lastName: string | null }>,
): string {
  const lines: string[] = [
    '===================================',
    '  QRBag - Export Manifest',
    '===================================',
    '',
    `Date d'export    : ${new Date().toLocaleString('fr-FR')}`,
    `Total QR codes   : ${baggages.length}`,
    `Total passagers  : ${sortedSetIds.length}`,
    `Type             : ${baggages[0]?.type === 'hajj' ? 'Hajj' : 'Voyageur'}`,
    '',
    '--- Liste des passagers ---',
    '',
  ];

  sortedSetIds.forEach((currentSetId, index) => {
    const info = travelerInfoMap.get(currentSetId);
    const paddedIndex = String(index + 1).padStart(3, '0');
    const name = info?.firstName && info?.lastName
      ? `${info.firstName} ${info.lastName}`
      : 'En attente d\'activation';
    lines.push(`  ${paddedIndex}. ${currentSetId} - ${name}`);
  });

  lines.push('');
  lines.push('--- Details complets ---');
  lines.push('');

  for (const baggage of baggages) {
    lines.push(
      `${baggage.reference} | Set: ${baggage.setId || 'N/A'} | ` +
      `Type: ${baggage.baggageType} #${baggage.baggageIndex} | ` +
      `Statut: ${baggage.status} | ` +
      `Passager: ${baggage.travelerFirstName || '-'} ${baggage.travelerLastName || ''}`,
    );
  }

  return lines.join('\n');
}
