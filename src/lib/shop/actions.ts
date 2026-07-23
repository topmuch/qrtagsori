'use server';

import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { redirect } from 'next/navigation';

// ════════════════════════════════════════════════════════════════
// Server Actions — QRTags Boutique Express
// Checkout sans compte, paiement à la livraison.
// ════════════════════════════════════════════════════════════════

interface OrderFormData {
  slug: string;
  customerName: string;
  customerPhone: string;
  city: string;
  quartier?: string;
}

/**
 * Crée une commande express (Order) et envoie un email au superadmin.
 * Redirige vers /shop/success après succès.
 */
export async function createOrder(formData: OrderFormData) {
  // ─── Validation ───
  const errors: Record<string, string> = {};

  if (!formData.slug || formData.slug.trim().length === 0) {
    errors.slug = 'Produit non spécifié';
  }

  if (!formData.customerName || formData.customerName.trim().length < 2) {
    errors.customerName = 'Le nom doit contenir au moins 2 caractères';
  }

  // Téléphone : format +221XXXXXXXXX (10 chiffres après +221)
  const phoneClean = formData.customerPhone.replace(/\s/g, '');
  if (!phoneClean.match(/^(\+221|221)?\d{9}$/)) {
    errors.customerPhone = 'Numéro invalide. Format : +221XXXXXXXXX (9 chiffres)';
  }

  if (!formData.city || formData.city.trim().length < 2) {
    errors.city = 'La ville est requise';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // ─── Récupérer le produit ───
  const product = await prisma.product.findUnique({
    where: { slug: formData.slug, active: true },
  });

  if (!product) {
    return { success: false, errors: { slug: 'Produit non trouvé ou désactivé' } };
  }

  // ─── Calculer le total ───
  const total = product.price; // quantité = 1 pack par commande

  // ─── Créer l'Order ───
  const order = await prisma.order.create({
    data: {
      productId: product.id,
      customerName: formData.customerName.trim(),
      customerPhone: phoneClean.startsWith('+221') ? phoneClean : `+221${phoneClean}`,
      city: formData.city.trim(),
      quartier: formData.quartier?.trim() || null,
      quantity: 1,
      total,
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
    // Ne pas bloquer la commande si l'email échoue
    console.error('[shop] Email notification failed:', emailError);
  }

  // ─── Rediriger vers la page de succès ───
  redirect(`/shop/success?phone=${encodeURIComponent(order.customerPhone)}`);
}

// ════════════════════════════════════════════════════════════════
// Helpers — Email content generation
// ════════════════════════════════════════════════════════════════

function buildOrderEmailHtml(order: OrderRecord, product: ProductRecord): string {
  return `
    <div style="background:#111111;padding:40px;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:auto;background:#E3B23C;border:4px solid #000000;padding:30px;border-radius:8px;">
        <h1 style="color:#000000;margin:0 0 20px;font-size:24px;">🛍️ NOUVELLE COMMANDE QRTags</h1>
        <table style="width:100%;color:#000000;font-size:16px;">
          <tr><td style="padding:8px;font-weight:bold;">Client :</td><td style="padding:8px;">${order.customerName}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Téléphone :</td><td style="padding:8px;">${order.customerPhone}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Ville :</td><td style="padding:8px;">${order.city}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Quartier :</td><td style="padding:8px;">${order.quartier || '—'}</td></tr>
          <tr><td colspan="2" style="padding:8px;"><hr style="border:1px solid #000000;"></td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Produit :</td><td style="padding:8px;">${product.name} (${product.quantity} stickers)</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Quantité :</td><td style="padding:8px;">1 pack</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Total :</td><td style="padding:8px;font-weight:bold;font-size:18px;">${order.total} FCFA</td></tr>
          <tr><td colspan="2" style="padding:8px;"><hr style="border:1px solid #000000;"></td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Statut :</td><td style="padding:8px;color:#c89a00;">⏳ En attente de confirmation</td></tr>
        </table>
        <p style="color:#000000;margin:20px 0 0;font-weight:bold;">📞 Appelez le client pour confirmer la livraison !</p>
        <p style="color:#000000;font-size:14px;margin:8px 0 0;">ID commande : ${order.id}</p>
      </div>
    </div>
  `;
}

function buildOrderEmailText(order: OrderRecord, product: ProductRecord): string {
  return `
🛍️ NOUVELLE COMMANDE QRTags

Client : ${order.customerName}
Téléphone : ${order.customerPhone}
Ville : ${order.city}
Quartier : ${order.quartier || '—'}

Produit : ${product.name} (${product.quantity} stickers)
Quantité : 1 pack
Total : ${order.total} FCFA

Statut : En attente de confirmation

 Appelez le client pour confirmer la livraison !

ID commande : ${order.id}
  `.trim();
}

// Types locaux (Prisma retourne des objets avec ces champs)
type OrderRecord = {
  id: string;
  customerName: string;
  customerPhone: string;
  city: string | null;
  quartier: string | null;
  total: number;
  status: string;
};

type ProductRecord = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};
