import { NextRequest, NextResponse } from 'next/server';
import { saveTemplate, getTemplateInfo } from '@/lib/qr-compose';

/**
 * POST /api/admin/qr-design/upload
 * Upload a design template (circular PNG with transparent background).
 * The template should be a square image where the QR code zone
 * is a white rectangle in the center-upper area.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('template') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni. Utilisez le champ "template".' },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image (PNG recommandé).' },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux (max 5 Mo).' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await saveTemplate(buffer);

    const info = await getTemplateInfo();

    return NextResponse.json({
      success: true,
      message: 'Template de design enregistré avec succès.',
      template: info,
    });
  } catch (error) {
    console.error('[QR-DESIGN UPLOAD] Error:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du template." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/qr-design/upload
 * Get current template info.
 */
export async function GET() {
  try {
    const info = await getTemplateInfo();
    return NextResponse.json({ template: info });
  } catch (error) {
    console.error('[QR-DESIGN UPLOAD GET] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur.' },
      { status: 500 },
    );
  }
}
