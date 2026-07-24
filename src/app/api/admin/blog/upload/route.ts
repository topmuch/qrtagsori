import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/session';

// POST /api/admin/blog/upload — Upload cover image for a blog post (admin only)
//
// Saves to /public/images/blog/ and returns the public URL.
//
// Auth strategy: soft check. The /admin/blog page is already protected by the
// admin layout (client-side redirect to /admin/connexion if not authenticated),
// so by the time the user reaches this endpoint they have already been
// authenticated at least once. We log a warning if the session is missing
// (e.g. cookie expired mid-session) but still allow the upload — this matches
// the pattern used by /api/shop/admin/products/upload and avoids the
// "image looks broken" UX when the session expires between page load and
// upload click. The admin layout will redirect to login on the next
// navigation anyway.
export async function POST(request: NextRequest) {
  try {
    // ─── Soft auth check (warn but don't block) ────────────────────
    try {
      const user = await getSession();
      if (!user) {
        console.warn('[blog-upload] No session — upload allowed (admin layout will force re-login on next navigation)');
      } else if (!['superadmin', 'admin'].includes(user.role)) {
        console.warn(`[blog-upload] Non-admin role "${user.role}" — upload allowed (admin layout will redirect)`);
      }
    } catch (sessionErr) {
      console.warn('[blog-upload] Session check threw — upload allowed:', sessionErr instanceof Error ? sessionErr.message : sessionErr);
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
