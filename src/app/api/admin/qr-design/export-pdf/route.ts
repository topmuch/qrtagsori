import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  composeQRWithDesign,
  DEFAULT_TEMPLATE_PATH,
  templateExists,
  EXPORT_DPI,
  VALID_SIZES,
} from '@/lib/qr-compose';

/**
 * POST /api/admin/qr-design/export-pdf
 * 
 * Export QR codes as an A4 PDF with a grid layout, ready to print and cut.
 * 
 * Body: { references: string[], sizeCm: 2|4|7 }
 * Response: PDF file
 * 
 * A4 dimensions: 210mm × 297mm
 * Margins: 5mm all sides → usable: 200mm × 287mm
 * 
 * Grid calculations:
 *   2cm stickers: ~9 cols × 14 rows = 126 per page
 *   4cm stickers: ~4 cols × 7 rows = 28 per page
 *   7cm stickers: ~2 cols × 4 rows = 8 per page
 */

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 5;
const USABLE_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;
const USABLE_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_MM * 2;
const MM_TO_PT = 2.835; // 1mm = 2.835 points (72 DPI)

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

    if (!(VALID_SIZES as readonly number[]).includes(sizeCm)) {
      return NextResponse.json(
        { error: 'Taille invalide. Tailles : 2, 4, 5, 6, 7, 10, 12, 15 cm.' },
        { status: 400 },
      );
    }

    if (!(await templateExists())) {
      return NextResponse.json(
        { error: "Aucun template de design. Uploadez un template d'abord." },
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
        { error: 'Aucun baggage trouvé.' },
        { status: 404 },
      );
    }

    // Get base URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // PDF Kit for PDF generation
    const PDFDocument = await import('pdfkit');
    const pdfBuffer: Buffer[] = [];

    // Create a PDF document
    const doc = new PDFDocument.default({
      size: 'A4',
      margins: { top: MARGIN_MM * MM_TO_PT, bottom: MARGIN_MM * MM_TO_PT, left: MARGIN_MM * MM_TO_PT, right: MARGIN_MM * MM_TO_PT },
      bufferPages: true,
    });

    // Collect PDF output into buffer
    doc.on('data', (chunk: Buffer) => pdfBuffer.push(chunk));

    // Grid calculations
    const stickerSizePt = sizeCm * MM_TO_PT; // sticker size in points
    const cols = Math.floor(USABLE_WIDTH_MM / sizeCm);
    const rows = Math.floor(USABLE_HEIGHT_MM / sizeCm);
    const stickersPerPage = cols * rows;

    // Compose all QR images first (batch)
    const qrImages: Array<{ reference: string; buffer: Buffer; filename: string }> = [];

    for (const baggage of baggages) {
      const scanUrl = `${baseUrl}/scan/${baggage.reference}`;
      const result = await composeQRWithDesign({
        reference: baggage.reference,
        scanUrl,
        templatePath: DEFAULT_TEMPLATE_PATH,
        sizeCm,
        dpi: EXPORT_DPI,
      });
      qrImages.push({
        reference: result.reference,
        buffer: result.buffer,
        filename: result.filename,
      });
    }

    // Layout stickers on A4 pages
    const usableWidthPt = USABLE_WIDTH_MM * MM_TO_PT;
    const usableHeightPt = USABLE_HEIGHT_MM * MM_TO_PT;
    
    // Center the grid if stickers don't fill the full usable area
    const totalGridWidthPt = cols * stickerSizePt;
    const totalGridHeightPt = rows * stickerSizePt;
    const offsetX = (usableWidthPt - totalGridWidthPt) / 2;
    const offsetY = (usableHeightPt - totalGridHeightPt) / 2;

    for (let i = 0; i < qrImages.length; i++) {
      const pageIndex = Math.floor(i / stickersPerPage);
      const indexInPage = i % stickersPerPage;

      // Add new page if needed (skip first page, it's auto-created)
      if (pageIndex > 0 && indexInPage === 0) {
        doc.addPage({
          size: 'A4',
          margins: { top: MARGIN_MM * MM_TO_PT, bottom: MARGIN_MM * MM_TO_PT, left: MARGIN_MM * MM_TO_PT, right: MARGIN_MM * MM_TO_PT },
        });
      }

      const col = indexInPage % cols;
      const row = Math.floor(indexInPage / cols);

      const x = MARGIN_MM * MM_TO_PT + offsetX + col * stickerSizePt;
      const y = MARGIN_MM * MM_TO_PT + offsetY + row * stickerSizePt;

      // Embed the composited QR image
      doc.image(qrImages[i].buffer, x, y, {
        width: stickerSizePt,
        height: stickerSizePt,
      });
    }

    // Add footer on last page with generation info
    doc.fontSize(7).fillColor('#999999');
    doc.text(
      `QRTags — ${qrImages.length} étiquettes — ${sizeCm}cm × ${sizeCm}cm — ${new Date().toLocaleDateString('fr-FR')}`,
      0,
      A4_HEIGHT_MM * MM_TO_PT - 12,
      { align: 'center', width: A4_WIDTH_MM * MM_TO_PT },
    );

    doc.end();

    // Wait for PDF to finish
    await new Promise<void>((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });

    const finalBuffer = Buffer.concat(pdfBuffer);
    const timestamp = new Date().toISOString().slice(0, 10);
    const pdfFilename = `QRTags-Design-${sizeCm}cm-${qrImages.length}QR-${timestamp}.pdf`;

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(pdfFilename)}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[QR-DESIGN EXPORT-PDF] Error:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'export PDF." },
      { status: 500 },
    );
  }
}
