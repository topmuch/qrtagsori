import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

// POST /api/shop/admin/products/upload — Upload product image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier envoye' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporte. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 5MB.' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `product-${timestamp}-${randomStr}.${ext}`;

    // Save to /public/images/shop/
    const publicDir = path.join(process.cwd(), 'public', 'images', 'shop');
    const filePath = path.join(publicDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL path
    const imageUrl = `/images/shop/${filename}`;

    return NextResponse.json({ url: imageUrl, filename });
  } catch (error) {
    console.error('[shop-admin] Error uploading image:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de l\'upload' }, { status: 500 });
  }
}
