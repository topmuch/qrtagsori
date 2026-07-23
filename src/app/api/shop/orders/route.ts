import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// POST /api/shop/orders — Créer une commande express (Checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, customerName, customerPhone, city, quartier } = body;

    // ─── Validation ───
    const errors: Record<string, string> = {};

    if (!slug || slug.trim().length === 0) {
      errors.slug = 'Produit non spécifié';
    }

    if (!customerName || customerName.trim().length < 2) {
      errors.customerName = 'Le nom doit contenir au moins 2 caractères';
    }

    const phoneClean = customerPhone?.replace(/\s/g, '') || '';
    if (!phoneClean.match(/^(\+221|221)?\d{9}$/)) {
      errors.customerPhone = 'Numéro invalide. Format : +221XXXXXXXXX (9 chiffres)';
    }

    if (!city || city.trim().length < 2) {
      errors.city = 'La ville est requise';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // ─── Récupérer le produit ───
    const product = await prisma.product.findUnique({
      where: { slug, active: true },
    });

    if (!product) {
      return NextResponse.json(
        { errors: { slug: 'Produit non trouvé ou désactivé' } },
        { status: 404 }
      );
    }

    // ─── Créer l'Order ───
    const formattedPhone = phoneClean.startsWith('+221') ? phoneClean : `+221${phoneClean.replace(/^221/, '')}`;

    const order = await prisma.order.create({
      data: {
        productId: product.id,
        customerName: customerName.trim(),
        customerPhone: formattedPhone,
        city: city.trim(),
        quartier: quartier?.trim() || null,
        quantity: 1,
        total: product.price,
        status: 'PENDING',
      },
    });

    // ─── Envoyer email au superadmin ───
    try {
      await sendEmail({
        to: process.env.EMAIL_TO || 'admin@qrtags.pro',
        subject: `🛍️ Nouvelle commande QRTags — ${product.name}`,
        html: buildOrderEmailHtml(order, product),
        text: buildOrderEmailText(order, product),
        type: 'shop_order',
      });
    } catch (emailError) {
      console.error('[shop] Email notification failed:', emailError);
      // Ne pas bloquer la commande si l'email échoue
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      phone: order.customerPhone,
    });
  } catch (error) {
    console.error('[shop] Error creating order:', error);
    return NextResponse.json(
      { error: 'Erreur serveur. Réessayez.' },
      { status: 500 }
    );
  }
}

// ─── Email HTML ───
function buildOrderEmailHtml(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  city: string | null;
  quartier: string | null;
  total: number;
  status: string;
}, product: {
  name: string;
  quantity: number;
}): string {
  return `
    <div style="background:#111111;padding:40px;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:auto;background:#E3B23C;border:4px solid #000000;padding:30px;border-radius:8px;">
        <h1 style="color:#000000;margin:0 0 20px;font-size:24px;">🛍️ NOUVELLE COMMANDE QRTags</h1>
        <table style="width:100%;color:#000000;font-size:16px;">
          <tr><td style="padding:8px;font-weight:bold;">Client :</td><td style="padding:8px;">${order.customerName}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Téléphone :</td><td style="padding:8px;">${order.customerPhone}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Ville :</td><td style="padding:8px;">${order.city || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Quartier :</td><td style="padding:8px;">${order.quartier || '—'}</td></tr>
          <tr><td colspan="2" style="padding:8px;"><hr style="border:1px solid #000000;"></td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Produit :</td><td style="padding:8px;">${product.name} (${product.quantity} stickers)</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Quantité :</td><td style="padding:8px;">1 pack</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Total :</td><td style="padding:8px;font-weight:bold;font-size:18px;">${order.total.toLocaleString('fr-FR')} FCFA</td></tr>
          <tr><td colspan="2" style="padding:8px;"><hr style="border:1px solid #000000;"></td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Statut :</td><td style="padding:8px;color:#c89a00;">⏳ En attente de confirmation</td></tr>
        </table>
        <p style="color:#000000;margin:20px 0 0;font-weight:bold;">📞 Appelez le client pour confirmer la livraison !</p>
        <p style="color:#000000;font-size:14px;margin:8px 0 0;">ID commande : ${order.id}</p>
      </div>
    </div>
  `;
}

// ─── Email Text ───
function buildOrderEmailText(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  city: string | null;
  quartier: string | null;
  total: number;
  status: string;
}, product: {
  name: string;
  quantity: number;
}): string {
  return `
🛍️ NOUVELLE COMMANDE QRTags

Client : ${order.customerName}
Téléphone : ${order.customerPhone}
Ville : ${order.city || '—'}
Quartier : ${order.quartier || '—'}

Produit : ${product.name} (${product.quantity} stickers)
Quantité : 1 pack
Total : ${order.total.toLocaleString('fr-FR')} FCFA

Statut : En attente de confirmation

Appelez le client pour confirmer la livraison !

ID commande : ${order.id}
  `.trim();
}
