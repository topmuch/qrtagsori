/**
 * Client-safe checklist constants and types.
 *
 * This file is safe to import from client components — it contains NO server-only
 * imports (no pdfkit, no qrcode, no fs). The PDF-generation utilities live in
 * `src/lib/checklist.ts` and must only be imported from API routes / server code.
 */

// ═══════════════════════════════════════════════════════
//  BRAND COLORS (shared with checklist.ts)
// ═══════════════════════════════════════════════════════

export const BRAND_COLOR = '#c5a643';
export const INK_COLOR = '#1a1a1a';
export const CREAM_COLOR = '#FDFBF7';
export const RED_COLOR = '#c0392b';

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

export interface ChecklistItem {
  category: string;
  name: string;
  qty: number;
  checked: boolean;
}

export interface ChecklistCategory {
  id: string;
  label: { fr: string; en: string; ar: string };
  emoji: string;
  items: string[];
}

// ═══════════════════════════════════════════════════════
//  DEFAULT CHECKLIST CATALOG — 7 categories, ~40 items
// ═══════════════════════════════════════════════════════

export const DEFAULT_CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    id: 'clothing',
    emoji: '👕',
    label: { fr: 'Vêtements', en: 'Clothing', ar: 'ملابس' },
    items: ['T-shirts', 'Polos', 'Pantalons', 'Shorts', 'Robes', 'Pulls', 'Manteau', 'Vestes', 'Sous-vêtements', 'Chaussettes', 'Pyjama'],
  },
  {
    id: 'shoes',
    emoji: '👟',
    label: { fr: 'Chaussures', en: 'Shoes', ar: 'أحذية' },
    items: ['Baskets', 'Sandales', 'Chaussures de ville', 'Tongs', 'Bottes'],
  },
  {
    id: 'toiletries',
    emoji: '🧴',
    label: { fr: 'Articles de toilette', en: 'Toiletries', ar: 'أدوات الزينة' },
    items: ['Brosse à dents', 'Dentifrice', 'Savon', 'Shampoing', 'Déodorant', 'Brosse à cheveux', 'Rasoir', 'Serviettes'],
  },
  {
    id: 'health',
    emoji: '💊',
    label: { fr: 'Santé', en: 'Health', ar: 'صحة' },
    items: ['Médicaments personnels', 'Trousse premiers secours', 'Masques', 'Gel hydroalcoolique', 'Protection solaire'],
  },
  {
    id: 'electronics',
    emoji: '📱',
    label: { fr: 'Électronique', en: 'Electronics', ar: 'إلكترونيات' },
    items: ['Téléphone', 'Chargeur', 'Casque audio', 'Tablette', 'Appareil photo', 'Câbles USB', 'Adaptateur secteur'],
  },
  {
    id: 'accessories',
    emoji: '🎒',
    label: { fr: 'Accessoires', en: 'Accessories', ar: 'ملحقات' },
    items: ['Lunettes de soleil', 'Ceinture', 'Portefeuille', 'Sac à dos', 'Parapluie'],
  },
  {
    id: 'misc',
    emoji: '🎒',
    label: { fr: 'Divers', en: 'Misc', ar: 'متنوع' },
    items: ['Passeport', 'Billet d\'avion', 'Visa', 'Carnet de santé', 'Coordonnées utiles', 'Argent liquide'],
  },
];

/**
 * Flatten catalog → list of {category, name} for the form
 */
export function flattenCatalog(): Array<{ category: string; categoryName: string; name: string }> {
  const out: Array<{ category: string; categoryName: string; name: string }> = [];
  for (const cat of DEFAULT_CHECKLIST_CATEGORIES) {
    for (const item of cat.items) {
      out.push({ category: cat.id, categoryName: cat.label.fr, name: item });
    }
  }
  return out;
}
