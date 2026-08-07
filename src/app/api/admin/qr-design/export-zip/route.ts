import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { ZipArchive } from 'archiver';
import { db } from '@/lib/db';
import {
  composeQRWithDesign,
  DEFAULT_TEMPLATE_PATH,
  templateExists,
  EXPORT_DPI,
} from '@/lib/qr-compose';

/**
 * POST /api/admin/qr-design/export-zip
 * 
 * Export QR codes as a ZIP of high-resolution PNG files.
 * Each QR is composited with the design template.
 * 
 * Body: { references: string[], sizeCm: 2|4|7 }
 * Response: Streaming ZIP file
 */
const MAX_EXPORT = 500;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { references, sizeCm } = body as {
      references: string[];
      sizeCm: number;
    };

    if (!references?.length || !Array.isArray(references)) {
      return NextResponse.json(
        { error: 'Liste de références requise.' },
        { status: 400 },
      );
    }

    if (![2, 4, 7].includes(sizeCm)) {
      return NextResponse.json(
        { error: 'Taille invalide (2, 4 ou 7 cm).' },
        { status: 400 },
      );
    }

    if (references.length > MAX_EXPORT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_EXPORT} QR codes par export.` },
        { status: 400 },
      );
    }

    if (!(await templateExists())) {
      return NextResponse.json(
        { error: 'Aucun template de design. Uploadez un template d\'abord.' },
        { status: 400 },
      );
    }

    // Fetch baggages from DB
    const baggages = await db.baggage.findMany({
      where: { reference: { in: references } },
      select: { reference: true, id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (baggages.length === 0) {
      return NextResponse.json(
        { error: 'Aucun baggage trouvé avec ces références.' },
        { status: 404 },
      );
    }

    // Get base URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Create ZIP archive (streaming)
    const archive = new ZipArchive({ zlib: { level: 6 } });
    const nodeStream = archive as unknown as Readable;
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    // Process QR codes
    const processingPromise = (async () => {
      try {
        for (const baggage of baggages) {
          const scanUrl = `${baseUrl}/scan/${baggage.reference}`;
          const result = await composeQRWithDesign({
            reference: baggage.reference,
            scanUrl,
            templatePath: DEFAULT_TEMPLATE_PATH,
            sizeCm,
            dpi: EXPORT_DPI,
          });
          archive.append(result.buffer, { name: result.filename });
        }

        // Add manifest
        const manifest = [
          'QRTags — Export Design',
          `Date: ${new Date().toLocaleString('fr-FR')}`,
          `Taille: ${sizeCm}cm × ${sizeCm}cm`,
          `Résolution: 1024×1024 px${sizeCm === 7 ? ' (1654×1654)' : ''} avec métadonnées DPI`,
          `Nombre de QR: ${baggages.length}`,
          '',
          '--- Références ---',
          ...baggages.map((b) => `  ${b.reference}`),
        ].join('\n');
        archive.append(Buffer.from(manifest, 'utf-8'), { name: '_MANIFEST.txt' });

        await archive.finalize();
      } catch (err) {
        console.error('[QR-DESIGN EXPORT-ZIP] Processing error:', err);
        archive.abort();
      }
    })();

    const timestamp = new Date().toISOString().slice(0, 10);
    const zipFilename = `QRTags-Design-${sizeCm}cm-${baggages.length}QR-${timestamp}.zip`;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        'Cache-Control': 'no-cache',
        'X-Export-Count': String(baggages.length),
      },
    });
  } catch (error) {
    console.error('[QR-DESIGN EXPORT-ZIP] Error:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'export ZIP." },
      { status: 500 },
    );
  }
}
