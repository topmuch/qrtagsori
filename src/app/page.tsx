'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  Shield,
  Search,
  MessageCircle,
  HandHelping,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  ShoppingBag,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import TrackingWidget from '@/components/home/TrackingWidget';
import BlogTeaserSection from '@/components/home/BlogTeaserSection';

const LandingChatbotWidget = dynamic(
  () => import('@/components/finder/LandingChatbotWidget'),
  { ssr: false, loading: () => null },
);

// ════════════════════════════════════════════════════════════════════
// QRTags — Landing ORIENTÉE OBJETS TROUVÉS / PARTICULIER
// Accent sur : "Vous avez trouvé un objet ?" & "J'ai perdu quelque chose"
// Messaging citoyen, finder-hero, pas B2B enterprise
// ════════════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#ffffff',
  bgAlt: '#fafafa',
  bgCream: '#fffdf5',
  bgWarm: '#FFF8E7',      // Fond warm accent (trouvailles)
  text: '#0d0d0f',
  textMuted: '#525252',
  accent: '#FDB900',
  accentAlt: '#E3B23C',
  accentDark: '#c89a00',
  green: '#22C55E',        // Vert retrouvaille
  greenDark: '#16A34A',
  card: '#ffffff',
  cardAlt: '#fffdf5',
  border: '#e5e5e5',
  borderAccent: 'rgba(253, 185, 0, 0.3)',
};

// ════════════════════════════════════════════════════════════════════
// DONNÉES — Orientation PARTICULIER / OBJETS TROUVÉS
// ════════════════════════════════════════════════════════════════════

const FINDER_STEPS = [
  {
    num: '01',
    image: '/images/how-it-works/step-1-generation.png',
    title: 'Vous trouvez un objet',
    desc: 'Dans la rue, à l\'aéroport, dans un taxi, au café... Vous voyez un QR tag QRTags sur l\'objet perdu.',
    color: COLORS.accent,
  },
  {
    num: '02',
    image: '/images/how-it-works/step-3-scan-alert.png',
    title: 'Scannez le QR code',
    desc: 'Un simple scan avec votre téléphone — aucune app à installer, pas besoin de batterie ou de GPS sur l\'objet.',
    color: COLORS.accentAlt,
  },
  {
    num: '03',
    image: '/images/how-it-works/step-3-scan-alert.png',
    title: 'Contactez le propriétaire',
    desc: 'La page WAME s\'ouvre automatiquement avec votre position GPS. Un message WhatsApp pré-rempli est envoyé au propriétaire.',
    color: COLORS.green,
  },
  {
    num: '04',
    image: '/images/how-it-works/step-4-recovered.png',
    title: 'L\'objet est rendu',
    desc: 'Le propriétaire sait exactement où vous êtes. Vous rendez l\'objet en 2h en moyenne. Un geste simple qui change une vie.',
    color: COLORS.greenDark,
  },
];

const OWNER_STEPS = [
  {
    num: '01',
    image: '/images/how-it-works/step-1-generation.png',
    title: 'Collez un QR tag',
    desc: 'Commandez vos tags QRTags et collez-les sur vos objets : valise, clés, sac, lunettes, téléphone... Chaque tag est unique.',
    color: COLORS.accent,
  },
  {
    num: '02',
    image: '/images/how-it-works/step-2-activation.png',
    title: 'Activez en 30 secondes',
    desc: 'Scannez votre propre tag, entrez vos infos (prénom, WhatsApp) et l\'objet est protégé. Pas d\'app, pas de compte obligatoire.',
    color: COLORS.accentAlt,
  },
  {
    num: '03',
    image: '/images/how-it-works/step-3-scan-alert.png',
    title: 'Recevez une alerte',
    desc: 'Si quelqu\'un trouve votre objet, vous recevez un message WhatsApp avec la position exacte du trouveur. Instantané.',
    color: COLORS.green,
  },
  {
    num: '04',
    image: '/images/how-it-works/step-4-recovered.png',
    title: 'Récupérez votre objet',
    desc: 'Contactez le trouveur via WhatsApp, récupérez votre objet. 98% des objets étiquetés sont retrouvés.',
    color: COLORS.greenDark,
  },
];

const STATS = [
  { value: '98%', label: 'Objets retrouvés' },
  { value: '< 2h', label: 'Délai moyen retour' },
  { value: 'Sans app', label: 'Aucune installation' },
  { value: '3 langues', label: 'FR · EN · AR' },
];

const TESTIMONIALS = [
  {
    name: 'Lucas Dupont',
    role: 'Étudiant, Lyon',
    text: 'J\'ai trouvé un sac à dos avec un QR tag dans le métro. J\'ai scanné, WhatsApp s\'est ouvert avec la position. Le propriétaire m\'a contacté en 5 minutes. Je lui ai rendu son sac le soir même. Impressionnant !',
    avatar: 'LD',
    type: 'finder',
  },
  {
    name: 'Amira Bensaïd',
    role: 'Voyageuse, Marseille',
    text: 'Ma valise a été égarée à l\'aéroport. Quelqu\'un a scanné le tag QRTags — j\'ai reçu un WhatsApp avec sa position exacte. Je l\'ai récupérée 3h après. Sans QRTags, j\'aurais attendu des jours.',
    avatar: 'AB',
    type: 'owner',
  },
  {
    name: 'Thomas Legrand',
    role: 'Enseignant, Paris',
    text: 'Mon fils a perdu ses lunettes à l\'école. Le QR tag était collé dessus. Une maman les a trouvées, a scanné, et m\'a envoyé un WhatsApp. Récupérées le lendemain matin. Magique.',
    avatar: 'TL',
    type: 'owner',
  },
];

// ─── Packs Boutique — fetched dynamically from DB ───
interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  description: string | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
}

// Default fallback packs (used before API fetch completes OR if API returns image: null)
// Each pack has its own dedicated sachet image showing the correct sticker count.
const SHOP_PACKS_FALLBACK = [
  { quantity: 3, name: 'Pack 3 Stickers', slug: 'pack-3-stickers', price: 1500, desc: '3 étiquettes QR indestructibles. Idéal pour tester.', badge: '', image: '/images/shop/pack-3-stickers.png' },
  { quantity: 5, name: 'Pack 5 Stickers', slug: 'pack-5-stickers', price: 3000, desc: '5 étiquettes QR indestructibles. Le plus populaire.', badge: 'POPULAIRE', image: '/images/shop/pack-5-stickers.png' },
  { quantity: 10, name: 'Pack 10 Stickers', slug: 'pack-10-stickers', price: 4000, desc: '10 étiquettes QR indestructibles. Pour usage fréquent.', badge: '', image: '/images/shop/pack-10-stickers.png' },
  { quantity: 15, name: 'Pack 15 Stickers', slug: 'pack-15-stickers', price: 5500, desc: '15 étiquettes QR indestructibles. Le plus économique.', badge: 'ÉCONOMIQUE', image: '/images/shop/pack-15-stickers.png' },
];

// ─── Image fallback strategy ───
// Production DB products often have either:
//   • image: null (seed not re-run)
//   • image: '/images/shop/product-XXXX.jpeg' pointing to a file that does NOT exist
//     (uploaded via admin panel, but the upload failed silently or was lost)
//   • slug variants like 'pack-5-stickers-' (trailing dash) or 'packs-10-stickers'
//     that don't match SHOP_PACKS_FALLBACK slugs exactly.
//
// To ALWAYS show a sachet image we:
//   1. Map quantity → local pack image (most reliable, the sachet shows the right number)
//   2. Map slug → local pack image (handles edge cases where quantity differs)
//   3. On <img> onError, swap the broken src to the quantity-mapped local image
//      (instead of hiding it and showing the number fallback, which is less pretty)
const PACK_IMAGE_BY_QUANTITY: Record<number, string> = Object.fromEntries(
  SHOP_PACKS_FALLBACK.map(p => [p.quantity, p.image])
);
const PACK_IMAGE_BY_SLUG: Record<string, string> = Object.fromEntries(
  SHOP_PACKS_FALLBACK.map(p => [p.slug, p.image])
);
// Generic sachet used when quantity is unknown (e.g. Pack Revendeur qty=35)
const GENERIC_PACK_IMAGE = '/images/shop/pack-15-stickers.png';

/**
 * Resolve the best local image for a given product.
 *
 * CRITICAL: we NEVER trust DB-uploaded images (pattern: /images/shop/product-*.jpeg)
 * because they are almost always broken uploads (admin panel saved the path but
 * the file was never written, or was lost during deploy). We only trust the 4
 * known-good local sachet images that ship with the codebase.
 *
 * Strategy (in order):
 *   1. If DB image matches the known-good local pattern → use it as-is.
 *   2. Otherwise resolve by quantity (most reliable — sachet shows the right number).
 *   3. Then by slug, slug-without-trailing-dash, slug-without-s.
 *   4. Finally fall back to the generic pack-15 sachet.
 *
 * This guarantees the <img src> is ALWAYS a valid local path from the first render,
 * so there is no flash of broken image, no 30s-then-disappear bug, no need to rely
 * on the onError swap (which can race with React re-renders).
 */
function resolvePackImage(p: { image: string | null; quantity: number; slug: string }): string {
  // Only trust DB image if it matches one of our 4 known-good local sachet paths
  if (p.image && /^\/images\/shop\/pack-(3|5|10|15)-stickers\.png$/.test(p.image)) {
    return p.image;
  }
  return (
    PACK_IMAGE_BY_QUANTITY[p.quantity] ||
    PACK_IMAGE_BY_SLUG[p.slug] ||
    PACK_IMAGE_BY_SLUG[p.slug.replace(/[-\s]+$/, '')] || // strip trailing dash: 'pack-5-stickers-' → 'pack-5-stickers'
    PACK_IMAGE_BY_SLUG[p.slug.replace(/^packs-/, 'pack-')] || // 'packs-10-stickers' → 'pack-10-stickers'
    GENERIC_PACK_IMAGE
  );
}

/**
 * Decide what to use as the <img src>. Returns the DB image ONLY if it's safe
 * (one of the 4 known-good local paths). Otherwise returns the fallback.
 *
 * This prevents the "30-second disappear" bug where:
 *   1. Initial render uses SHOP_PACKS_FALLBACK (sachets show).
 *   2. API responds ~30s later with broken DB image URLs.
 *   3. <img src> switches to broken URL → broken image icon.
 *   4. onError swap may race with React re-renders and lose the swap.
 *
 * By NEVER using a DB image that doesn't match the safe pattern, we eliminate
 * the broken-image state entirely.
 */
function getSafeImageSrc(p: { image: string | null; fallbackImage: string }): string {
  if (p.image && /^\/images\/shop\/pack-(3|5|10|15)-stickers\.png$/.test(p.image)) {
    return p.image;
  }
  return p.fallbackImage;
}

// ─── Bande défilante — Produits protégés ───
const MARQUEE_ITEMS = [
  { image: '/images/home/marquee-keychain.png', name: 'Porte-clés' },
  { image: '/images/home/marquee-passport.png', name: 'Documents' },
  { image: '/images/home/marquee-laptop.png', name: 'Ordinateur' },
  { image: '/images/home/marquee-phone.png', name: 'Téléphone' },
  { image: '/images/home/marquee-suitcase.png', name: 'Valise' },
  { image: '/images/home/marquee-glasses.png', name: 'Lunettes' },
  { image: '/images/home/marquee-wallet.png', name: 'Portefeuille' },
  { image: '/images/home/marquee-bag.png', name: 'Sac à dos' },
  { image: '/images/home/suitcase-qr.png', name: 'Bagages' },
  { image: '/images/home/jacket-qr.png', name: 'Veste' },
];

// ════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'finder' | 'owner'>('finder');
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);

  // Fetch active products from DB on mount
  useEffect(() => {
    fetch('/api/shop/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setShopProducts(data);
        }
      })
      .catch(() => {
        // Keep fallback if API fails
      });
  }, []);

  // Use DB products if available, otherwise fallback.
  // resolvePackImage() guarantees every product gets a working local sachet image
  // even when DB image is null, broken, or points to a missing upload.
  const displayPacks = shopProducts.length > 0
    ? shopProducts.map(p => ({
        quantity: p.quantity,
        name: p.name,
        slug: p.slug,
        price: p.price,
        desc: p.description || `${p.quantity} étiquettes QR indestructibles.`,
        badge: p.quantity >= 10 ? 'ÉCONOMIQUE' : p.quantity === 5 ? 'POPULAIRE' : '',
        image: p.image,                              // Original DB image (may be broken)
        fallbackImage: resolvePackImage(p),          // Always a working local sachet
      }))
    : SHOP_PACKS_FALLBACK.map(p => ({ ...p, fallbackImage: p.image }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentSteps = activeTab === 'finder' ? FINDER_STEPS : OWNER_STEPS;

  return (
    <main style={{ background: COLORS.bg, color: COLORS.text, minHeight: '100vh' }}>
      {/* ═══ NAVBAR ═══ */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
          backdropFilter: scrolled ? 'blur(12px)' : 'blur(6px)',
          borderBottom: scrolled ? `1px solid ${COLORS.border}` : '1px solid transparent',
          transition: 'all 0.3s',
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <QRTagsLogo size="md" variant="light" withHover />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <a href="#comment" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Comment ça marche</a>
              <a href="#contact-whatsapp" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Comment suis-je contacté ?</a>
              <a href="#tarifs" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Tarifs</a>
              <a href="#temoignages" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Témoignages</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a
                href="#tracker"
                className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors"
              >
                Suivre un objet
              </a>
              <Link
                href="#tarifs"
                className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                style={{ background: COLORS.accent, color: COLORS.text }}
              >
                Protéger mes objets
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <a href="#comment" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Comment ça marche</a>
              <a href="#contact-whatsapp" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Comment suis-je contacté ?</a>
              <a href="#tarifs" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Tarifs</a>
              <a href="#temoignages" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Témoignages</a>
              <a href="#tracker" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[#c89a00]">Suivre un objet</a>
              <Link href="#tarifs" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-bold text-center rounded-lg" style={{ background: COLORS.accent, color: COLORS.text }}>
                Protéger mes objets
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ═══ HERO — Carrousel défilant EN HAUT + infos en dessous ═══ */}
      <section id="objets" className="pt-24 pb-20 lg:pt-28 lg:pb-32 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(ellipse at 20% 30%, ${COLORS.accent}22 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, ${COLORS.green}11 0%, transparent 50%)`,
          }}
        />

        {/* ─── TOP : Carrousel défilant pleine largeur (immersif, cards 500x500) ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{
            width: '100vw',
            marginLeft: 'calc(50% - 50vw)',
            marginRight: 'calc(50% - 50vw)',
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{ background: COLORS.bgWarm, padding: '32px 0 40px 0' }}
          >
            {/* Fade edges */}
            <div
              className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to right, ${COLORS.bgWarm}, transparent)` }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to left, ${COLORS.bgWarm}, transparent)` }}
            />

            {/* Titre au-dessus du défilement */}
            <div className="px-6 md:px-12 mb-5 flex items-center justify-between">
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.accentDark }}>
                Objets protégés par QRTags · défilement continu
              </p>
              <div
                className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: COLORS.green }} />
                <span className="text-xs font-bold" style={{ color: COLORS.textMuted }}>98% retrouvés</span>
              </div>
            </div>

            {/* Bande de cards qui défile en continu (45s, plus lent) — cards 500x500 */}
            <div className="flex animate-marquee-slow">
              {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, i) => (
                <div
                  key={`hero-card-${i}`}
                  className="flex-shrink-0 mx-4 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                  style={{
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    width: 'min(500px, 85vw)',
                  }}
                >
                  {/* Image carrée 500x500 */}
                  <div className="relative" style={{ height: 'min(500px, 85vw)' }}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="500px"
                    />
                    {/* Badge QR en bas à droite de l'image */}
                    <div
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md"
                      style={{ background: 'rgba(255,255,255,0.95)', color: COLORS.accentDark }}
                    >
                      QR Tag
                    </div>
                  </div>
                  {/* Texte (bas) — sobre : juste le nom, pas de description répétitive */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>
                      {item.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA flottant superposé au carrousel — 'Commander mes tags' */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute left-1/2 -translate-x-1/2 z-20"
              style={{ bottom: '24px' }}
            >
              <Link
                href="/#tarifs"
                className="cta-pulse flex items-center gap-3 px-7 py-4 rounded-full font-black text-base shadow-2xl transition-all hover:scale-105 hover:shadow-2xl"
                style={{
                  background: COLORS.accent,
                  color: COLORS.text,
                  border: `3px solid ${COLORS.text}`,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                }}
              >
                <ShoppingBag className="w-5 h-5" />
                Commander mes tags
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ─── BOTTOM : Grille 2 colonnes — texte + preview trouvaille ─── */}
        <div className="max-w-screen-2xl mx-auto relative px-5 mt-16 lg:mt-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge citoyen */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: COLORS.bgWarm, border: `1px solid ${COLORS.borderAccent}` }}
            >
              <HandHelping className="w-4 h-4" style={{ color: COLORS.greenDark }} />
              <span className="text-sm font-medium" style={{ color: COLORS.accentDark }}>
                Rendre un objet perdu — geste citoyen
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6" style={{ color: COLORS.text }}>
              Vous avez{' '}
              <span style={{ color: COLORS.greenDark }}>trouvé</span>{' '}
              un objet ?
            </h1>
            <p className="text-lg md:text-xl mb-3 max-w-xl" style={{ color: COLORS.textMuted }}>
              Scannez le QR tag, contactez le propriétaire en 1 clic via WhatsApp.
              Pas d&apos;app, pas de formulaire, pas de stress. Juste un geste simple.
            </p>
            <p className="text-base mb-8 max-w-xl" style={{ color: COLORS.textMuted }}>
              Vous avez <strong style={{ color: COLORS.accentDark }}>perdu</strong> quelque chose ?
              Collez un tag QRTags et toute personne qui trouve votre objet peut vous contacter instantanément
              avec sa position GPS.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="#tracker"
                className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.green, color: 'white' }}
              >
                <Search className="w-5 h-5" />
                Suivre un objet perdu
              </a>
              <Link
                href="#tarifs"
                className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 border-2 transition-all hover:bg-[#fffdf5]"
                style={{ borderColor: COLORS.accent, color: COLORS.text }}
              >
                <Sparkles className="w-5 h-5" style={{ color: COLORS.accentDark }} />
                Protéger mes objets
              </Link>
            </div>

            {/* Stats inline */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <div className="text-2xl md:text-3xl font-black" style={{ color: COLORS.accentDark }}>
                    {s.value}
                  </div>
                  <div className="text-xs md:text-sm" style={{ color: COLORS.textMuted }}>
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right : Preview trouvaille + badges flottants */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            {/* Preview : "objet trouvé" card */}
            <div
              className="rounded-2xl p-6 shadow-lg"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: COLORS.green, color: 'white' }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: COLORS.text }}>
                    Objet trouvé !
                  </div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>
                    Il y a 45 min · Gare Saint-Charles, Marseille
                  </div>
                </div>
              </div>
              <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
                &laquo; Bonjour Amira, j&apos;ai trouvé votre valise (réf. QRT26-MLQGY7). Je suis à la sortie de la gare, près du café. Je peux vous la rendre tout de suite. — Lucas &raquo;
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: '#25D36622', color: '#25D366' }}
                >
                  Position GPS envoyée
                </div>
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: COLORS.bgWarm, color: COLORS.accentDark }}
                >
                  Contact WhatsApp
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-4 -right-4 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2"
              style={{ background: '#25D366', color: 'white' }}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-bold">1 clic = contact</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="absolute -top-4 -left-4 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2"
              style={{ background: COLORS.accent, color: COLORS.text }}
            >
              <Shield className="w-5 h-5" />
              <span className="text-sm font-bold">RGPD · vie privée</span>
            </motion.div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ TRACKER — Suivre un objet ═══ */}
      <section id="tracker">
        <TrackingWidget />
      </section>

      {/* ═══ COMMENT ÇA MARCHE — Tabs Trouveur / Propriétaire ═══ */}
      <section id="comment" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bg }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.bgWarm, color: COLORS.accentDark, border: `1px solid ${COLORS.borderAccent}` }}
            >
              SIMPLE & RAPIDE
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: COLORS.text }}>
              Comment ça <span style={{ color: COLORS.accentDark }}>marche</span> ?
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              Que vous soyez le trouveur ou le propriétaire, QRTags rend la retrouvaille simple.
            </p>
          </div>

          {/* Tabs : Trouveur / Propriétaire */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveTab('finder')}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: activeTab === 'finder' ? COLORS.green : COLORS.card,
                color: activeTab === 'finder' ? 'white' : COLORS.textMuted,
                border: `2px solid ${activeTab === 'finder' ? COLORS.green : COLORS.border}`,
              }}
            >
              J&apos;ai trouvé un objet
            </button>
            <button
              onClick={() => setActiveTab('owner')}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: activeTab === 'owner' ? COLORS.accent : COLORS.card,
                color: activeTab === 'owner' ? COLORS.text : COLORS.textMuted,
                border: `2px solid ${activeTab === 'owner' ? COLORS.accent : COLORS.border}`,
              }}
            >
              J&apos;ai perdu un objet
            </button>
          </div>

          {/* Steps — with real images */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentSteps.map((step, i) => (
              <motion.div
                key={`${activeTab}-${i}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl h-full"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div
                    className="absolute top-3 left-3 text-xs font-black px-2 py-1 rounded-lg"
                    style={{ background: step.color, color: 'white' }}
                  >
                    Étape {step.num}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.text }}>{step.title}</h3>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMMENT SUIS-JE CONTACTÉ ? — Mockup WhatsApp réaliste ═══ */}
      <section id="contact-whatsapp" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* ─── Left : Explications ─── */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ background: '#25D36622', border: '1px solid #25D36655' }}
              >
                <MessageCircle className="w-4 h-4" style={{ color: '#25D366' }} />
                <span className="text-sm font-bold" style={{ color: '#128C7E' }}>
                  Alerte WhatsApp instantanée
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 leading-tight" style={{ color: COLORS.text }}>
                Comment <span style={{ color: '#128C7E' }}>suis-je contacté</span> quand on trouve mon objet&nbsp;?
              </h2>

              <p className="text-lg mb-6" style={{ color: COLORS.textMuted }}>
                Dès qu&apos;un trouveur scanne votre QR tag, vous recevez un WhatsApp avec sa position GPS exacte.
                Pas de spam, pas d&apos;appel inconnu — juste un message clair, et vous décidez de la suite.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  { icon: '📍', text: 'Position GPS du trouveur envoyée automatiquement' },
                  { icon: '💬', text: 'Message pré-rempli : référence, objet, heure du scan' },
                  { icon: '🔒', text: 'Votre numéro reste invisible — le trouveur passe par QRTags' },
                  { icon: '⚡', text: 'Notification en moins de 5 secondes après le scan' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0" aria-hidden="true">{item.icon}</span>
                    <span className="text-base" style={{ color: COLORS.text }}>{item.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="#tarifs"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                style={{ background: '#25D366', color: 'white' }}
              >
                <MessageCircle className="w-5 h-5" />
                Recevoir mes alertes WhatsApp
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* ─── Right : Mockup WhatsApp réaliste ─── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto"
              style={{ maxWidth: '380px' }}
            >
              {/* Cadre téléphone */}
              <div
                className="rounded-[2.5rem] p-2.5 shadow-2xl"
                style={{ background: '#1a1a1a', border: '8px solid #0a0a0a' }}
              >
                {/* Encoche */}
                <div className="relative mx-auto mb-1" style={{ width: '120px', height: '22px', background: '#0a0a0a', borderRadius: '0 0 14px 14px' }} />

                {/* Écran WhatsApp */}
                <div
                  className="rounded-[2rem] overflow-hidden"
                  style={{ background: '#ECE5DD', height: '600px' }}
                >
                  {/* ─── Header vert WhatsApp ─── */}
                  <div
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ background: '#075E54', color: 'white' }}
                  >
                    {/* Avatar */}
                    <div
                      className="rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ width: '38px', height: '38px', background: '#FDB900', color: '#0d0d0f' }}
                    >
                      Q
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">Alerte QRTags</div>
                      <div className="text-xs opacity-80">en ligne · vérifié</div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 opacity-90" aria-hidden="true">
                      <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 0 0-1.02.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.58l2.2-2.21a1 1 0 0 0 .25-1.02A11.36 11.36 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1c0 9.39 7.61 17 17 17a1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1z"/>
                    </svg>
                  </div>

                  {/* ─── Zone de chat ─── */}
                  <div className="px-3 py-4 space-y-2.5" style={{ height: 'calc(100% - 64px)', backgroundImage: 'url(\'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\"><circle cx=\"20\" cy=\"20\" r=\"1\" fill=\"%23d4cab1\" opacity=\"0.3\"/></svg>\')' }}>
                    {/* Date separator */}
                    <div className="flex justify-center">
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={{ background: '#E1F2FA', color: '#54656F' }}
                      >Aujourd&rsquo;hui</span>
                    </div>

                    {/* Message entrant 1 — texte */}
                    <div className="flex justify-start">
                      <div
                        className="rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm"
                        style={{ background: 'white' }}
                      >
                        <p className="text-sm mb-1" style={{ color: '#111' }}>
                          <strong>🔔 Objet trouvé !</strong>
                        </p>
                        <p className="text-sm mb-1" style={{ color: '#111' }}>
                          Bonjour Amira 👋
                        </p>
                        <p className="text-sm" style={{ color: '#111' }}>
                          Quelqu&rsquo;un vient de scanner votre valise <strong>Réf. QRT26-MLQGY7</strong>.
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px]" style={{ color: '#667781' }}>10:42</span>
                        </div>
                      </div>
                    </div>

                    {/* Message entrant 2 — localisation */}
                    <div className="flex justify-start">
                      <div
                        className="rounded-xl rounded-tl-sm overflow-hidden max-w-[80%] shadow-sm"
                        style={{ background: 'white' }}
                      >
                        {/* Preview carte (gradient simulé) */}
                        <div
                          className="relative flex items-center justify-center"
                          style={{
                            height: '120px',
                            background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 35%, #81c784 70%, #66bb6a 100%)',
                          }}
                        >
                          {/* Routes simulées */}
                          <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M0,80 Q50,60 100,75 T200,70" stroke="white" strokeWidth="3" fill="none" opacity="0.7"/>
                            <path d="M50,0 L60,120" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
                            <path d="M0,30 L200,45" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
                          </svg>
                          {/* Pin centrale */}
                          <div className="relative z-10 flex flex-col items-center">
                            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#ea4335" aria-hidden="true">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                            </svg>
                            <span className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'white', color: '#111' }}>
                              Position GPS
                            </span>
                          </div>
                        </div>
                        <div className="px-3 py-2">
                          <p className="text-sm font-bold" style={{ color: '#111' }}>📍 Gare Saint-Charles, Marseille</p>
                          <p className="text-xs" style={{ color: '#667781' }}>Précision : 8 mètres · il y a 2 min</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px]" style={{ color: '#667781' }}>10:42</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message entrant 3 — message du trouveur */}
                    <div className="flex justify-start">
                      <div
                        className="rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm"
                        style={{ background: 'white' }}
                      >
                        <p className="text-sm" style={{ color: '#111' }}>
                          « Bonjour, j&rsquo;ai trouvé votre valise à la sortie de la gare. Je peux vous la rendre tout de suite. — Lucas »
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px]" style={{ color: '#667781' }}>10:43</span>
                        </div>
                      </div>
                    </div>

                    {/* Message sortant — votre réponse */}
                    <div className="flex justify-end">
                      <div
                        className="rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm"
                        style={{ background: '#DCF8C6' }}
                      >
                        <p className="text-sm" style={{ color: '#111' }}>
                          Merci Lucas !! J&rsquo;arrive dans 15 minutes 🙏
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px]" style={{ color: '#667781' }}>10:44</span>
                          {/* Double check bleu */}
                          <svg viewBox="0 0 16 11" className="w-4 h-3" fill="#53bdeb" aria-hidden="true">
                            <path d="M11.07 0.65l-0.36 0.36 3.46 3.46-3.5 3.5 0.36 0.36 3.86-3.86zM7.07 0.65l-0.36 0.36 3.46 3.46-3.5 3.5 0.36 0.36 3.86-3.86z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge flottant — Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute -top-4 -right-4 lg:-right-6 rounded-2xl px-4 py-3 shadow-xl"
                style={{ background: 'white', border: '2px solid #25D366' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{ width: '32px', height: '32px', background: '#25D366', color: 'white' }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: COLORS.text }}>98% rendus</div>
                    <div className="text-[10px]" style={{ color: COLORS.textMuted }}>en moins de 2h</div>
                  </div>
                </div>
              </motion.div>

              {/* Badge flottant — Temps réel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-4 -left-4 lg:-left-6 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2"
                style={{ background: '#FDB900', color: COLORS.text }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: COLORS.greenDark }} />
                <span className="text-xs font-bold">Temps réel</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ TÉMOIGNAGES ═══ */}
      <section id="temoignages" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.bgWarm, color: COLORS.accentDark, border: `1px solid ${COLORS.borderAccent}` }}
            >
              TÉMOIGNAGES
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: COLORS.text }}>
              Ils ont <span style={{ color: COLORS.accentDark }}>retrouvé</span> ce qui comptait le{' '}
              <span style={{ color: COLORS.greenDark }}>plus.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                {/* Badge type */}
                <div
                  className="inline-block px-3 py-1 rounded-lg text-xs font-bold mb-4"
                  style={{
                    background: t.type === 'finder' ? COLORS.green + '22' : COLORS.accent + '22',
                    color: t.type === 'finder' ? COLORS.greenDark : COLORS.accentDark,
                  }}
                >
                  {t.type === 'finder' ? 'Trouveur' : 'Propriétaire'}
                </div>
                <div className="text-4xl mb-2" style={{ color: t.type === 'finder' ? COLORS.green : COLORS.accent }}>&laquo;</div>
                <p className="text-sm mb-6" style={{ color: COLORS.text }}>{t.text}</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      background: t.type === 'finder' ? COLORS.green : COLORS.accent,
                      color: t.type === 'finder' ? 'white' : COLORS.text,
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: COLORS.text }}>{t.name}</div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BOUTIQUE — Nos Packs de Stickers ═══ */}
      <section id="tarifs" className="py-20 lg:py-28 px-5" style={{ background: '#111111' }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: '#E3B23C', color: '#000000', border: '2px solid #000000' }}
            >
              <ShoppingBag className="w-4 h-4 inline mr-1" />
              CHECKOUT EXPRESS
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: '#FFFFFF' }}>
              Nos Packs de <span style={{ color: '#E3B23C' }}>Stickers</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#aaaaaa' }}>
              Commandez en 4 champs. Pas de compte, pas de panier. Paiement à la livraison à Dakar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayPacks.map((pack, i) => (
              <motion.div
                key={pack.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl relative overflow-hidden flex flex-col"
                style={{
                  background: '#E3B23C',
                  border: '4px solid #000000',
                }}
              >
                {/* Badge */}
                {pack.badge && (
                  <div
                    className="absolute top-3 right-3 z-10 px-3 py-1 rounded-lg text-xs font-black"
                    style={{ background: '#000000', color: '#E3B23C' }}
                  >
                    {pack.badge}
                  </div>
                )}

                {/* Product image GRANDE (format portrait) — src TOUJOURS valide */}
                <div className="relative w-full" style={{ aspectRatio: '3 / 4', background: '#000000' }}>
                  <img
                    src={getSafeImageSrc(pack)}
                    alt={pack.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // Filet de sécurité ultime : si l'image locale elle-même
                      // casse (ce qui ne devrait jamais arriver), on affiche
                      // le chiffre doré sur fond noir.
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = 'none';
                      const num = img.parentElement?.querySelector('[data-fallback-number]') as HTMLElement | null;
                      if (num) num.style.display = 'flex';
                    }}
                  />
                  {/* Number fallback — uniquement si même l'image locale casse */}
                  <div
                    data-fallback-number
                    className="w-full h-full items-center justify-center"
                    style={{ display: 'none' }}
                  >
                    <span className="text-7xl md:text-8xl font-black" style={{ color: '#E3B23C' }}>
                      {pack.quantity}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-black mb-2" style={{ color: '#000000' }}>
                    {pack.name}
                  </h3>
                  <p className="text-sm mb-4 flex-1" style={{ color: '#000000', opacity: 0.8 }}>
                    {pack.desc}
                  </p>

                  <div className="text-2xl font-black mb-4" style={{ color: '#000000' }}>
                    {new Intl.NumberFormat('fr-FR').format(pack.price)} FCFA
                  </div>

                  <Link
                    href={`/shop/${pack.slug}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{ background: '#000000', color: '#E3B23C', border: '2px solid #E3B23C' }}
                  >
                    Commander maintenant
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: '#aaaaaa' }}>
              <Shield className="w-4 h-4 inline mr-1" style={{ color: '#E3B23C' }} />
              Cash on Delivery — vous payez quand vous recevez. Zéro risque.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SECTION PROFESSIONNELS — lien discret ═══ */}
      <section className="py-16 lg:py-20 px-5" style={{ background: COLORS.bg }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8 text-center"
            style={{ background: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}
          >
            <Users className="w-8 h-8 mb-4 mx-auto" style={{ color: COLORS.accentDark }} />
            <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.text }}>
              Vous êtes un professionnel ?
            </h3>
            <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
              Hôtels, écoles, consignes, cliniques, loueurs — QRTags propose des solutions
              adaptées à chaque métier avec dashboard, champs dynamiques et gestion multi-sites.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/devenir-partenaire"
                className="px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.accent, color: COLORS.text }}
              >
                Devenir partenaire
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/metiers/hotels"
                className="px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 border-2 transition-all hover:bg-[#fffdf5]"
                style={{ borderColor: COLORS.border, color: COLORS.text }}
              >
                Voir les métiers
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA FINAL — sobre, sans dupliquer le hero ═══ */}
      <section className="py-14 lg:py-16 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8 shadow-lg"
            style={{ background: `linear-gradient(145deg, ${COLORS.green}, ${COLORS.greenDark})`, color: 'white' }}
          >
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              Chaque objet perdu peut être retrouvé
            </h2>
            <p className="text-base md:text-lg mb-6 opacity-90">
              Un geste citoyen, une technologie simple. Protégez vos affaires, rendez ce que vous trouvez.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="#tarifs"
                className="px-6 py-3 rounded-xl font-black text-base inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.accent, color: COLORS.text }}
              >
                Commander mes tags
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#tracker"
                className="px-6 py-3 rounded-xl font-bold text-base inline-flex items-center justify-center gap-2 border-2 transition-all hover:bg-white/10"
                style={{ borderColor: 'white', color: 'white' }}
              >
                <Search className="w-5 h-5" />
                Suivre un objet
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ DERNIERS ARTICLES DU BLOG ═══ */}
      <BlogTeaserSection
        limit={3}
        title="Dernières actualités"
        subtitle="Conseils, actualités et bonnes pratiques pour protéger vos objets du quotidien."
        colors={{
          bg: COLORS.bgAlt,
          text: COLORS.text,
          textMuted: COLORS.textMuted,
          accentDark: COLORS.accentDark,
          card: COLORS.card,
          border: COLORS.border,
        }}
      />

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-5 border-t" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <QRTagsLogo size="md" variant="light" />
              <p className="text-sm mt-4 max-w-md" style={{ color: COLORS.textMuted }}>
                QRTags — étiquettes QR pour objets perdus. Trouvez, rendez, protégez.
                Simple, rapide, citoyen. Sans app, sans batterie.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm" style={{ color: COLORS.accentDark }}>Pour particuliers</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#comment" style={{ color: COLORS.textMuted }}>Comment ça marche</a></li>
                <li><a href="#contact-whatsapp" style={{ color: COLORS.textMuted }}>Comment suis-je contacté ?</a></li>
                <li><a href="#tracker" style={{ color: COLORS.textMuted }}>Suivre un objet</a></li>
                <li><a href="#tarifs" style={{ color: COLORS.textMuted }}>Tarifs</a></li>
                <li><Link href="#tarifs" style={{ color: COLORS.textMuted }}>Protéger mes objets</Link></li>
                <li><Link href="/scan" style={{ color: COLORS.textMuted }}>Scanner un QR</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm" style={{ color: COLORS.accentDark }}>Pour professionnels</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/devenir-partenaire" style={{ color: COLORS.textMuted }}>Devenir partenaire</Link></li>
                <li><Link href="/agence/connexion" style={{ color: COLORS.textMuted }}>Espace agence</Link></li>
                <li><Link href="/admin/connexion" style={{ color: COLORS.textMuted }}>Espace admin</Link></li>
                <li><Link href="/contact" style={{ color: COLORS.textMuted }}>Contact</Link></li>
              </ul>
            </div>
          </div>
          <div
            className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
            style={{ borderColor: COLORS.border }}
          >
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              &copy; {new Date().getFullYear()} QRTags. Tous droits réservés.
            </p>
            <div className="flex gap-4 text-xs">
              <Link href="/cgu" style={{ color: COLORS.textMuted }}>CGU</Link>
              <Link href="/confidentialite" style={{ color: COLORS.textMuted }}>Confidentialité</Link>
              <Link href="/mentions-legales" style={{ color: COLORS.textMuted }}>Mentions légales</Link>
            </div>
          </div>
        </div>
      </footer>

      <LandingChatbotWidget />
    </main>
  );
}
