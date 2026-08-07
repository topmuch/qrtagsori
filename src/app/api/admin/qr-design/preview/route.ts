import { NextRequest, NextResponse } from 'next/server';
import { composeQRWithDesign, DEFAULT_TEMPLATE_PATH, templateExists, VALID_SIZES } from '@/lib/qr-compose';

/**
 * GET /api/admin/qr-design/preview?reference=QRT26-XXXX&sizeCm=4
 * 
 * Returns a composed QR code image (PNG) with design overlay.
 * Used for previewing before export.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const sizeCm = parseFloat(searchParams.get('sizeCm') || '4');

    if (!reference) {
      return NextResponse.json(
        { error: 'Paramètre ?reference= requis.' },
        { status: 400 },
      );
    }

    if (!(VALID_SIZES as readonly number[]).includes(sizeCm)) {
      return NextResponse.json(
        { error: 'Taille invalide. Tailles disponibles : 2, 4, 5, 6, 7, 10, 12, 15 cm.' },
        { status: 400 },
      );
    }

    // Check template exists
    if (!(await templateExists())) {
      return NextResponse.json(
        { error: 'Aucun template de design configuré. Uploadez un template d\'abord.' },
        { status: 400 },
      );
    }

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const scanUrl = `${baseUrl}/scan/${reference}`;

    const result = await composeQRWithDesign({
      reference,
      scanUrl,
      templatePath: DEFAULT_TEMPLATE_PATH,
      sizeCm,
      preview: true, // Lightweight 512px for on-screen display
    });

    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${result.filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[QR-DESIGN PREVIEW] Error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur serveur.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
