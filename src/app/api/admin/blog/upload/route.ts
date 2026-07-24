import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/session';

// POST /api/admin/blog/upload — Upload cover image for a blog post (admin only)
//
// Saves to /public/images/blog/ and returns the public URL.
// Mirrors /api/shop/admin/products/upload/route.ts but adds an admin auth check.
export async function POST(request: NextRequest) {
  try {
    // ─── Auth ──────────────────────────────────────────────────────
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const isAdmin = ['superadmin', 'admin'].includes(user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // ─── Parse multipart form ──────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier envoyé' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 5MB.' },
        { status: 400 },
      );
    }

    // Generate unique filename
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `blog-${timestamp}-${randomStr}.${ext}`;

    // Save to /public/images/blog/ — mkdir recursive ensures the folder
    // exists on first upload (it's not committed to the repo).
    const publicDir = path.join(process.cwd(), 'public', 'images', 'blog');
    await mkdir(publicDir, { recursive: true });
    const filePath = path.join(publicDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL path
    const imageUrl = `/images/blog/${filename}`;

    return NextResponse.json({ url: imageUrl, filename });
  } catch (error) {
    console.error('[blog-admin] Error uploading image:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur serveur lors de l'upload: ${message}` },
      { status: 500 },
    );
  }
}
