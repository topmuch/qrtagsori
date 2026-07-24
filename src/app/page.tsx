'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  QrCode,
  Smartphone,
  MapPin,
  MessageCircle,
  Menu,
  X,
  Shield,
  Search,
  Heart,
  HandHelping,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Eye,
  Bell,
  Globe,
  Zap,
  Package,
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

const FEATURES = [
  {
    image: '/images/landing-v2/features/alertes-whatsapp.jpg',
    title: 'Contact instantané',
    desc: 'WhatsApp pré-rempli avec la géolocalisation. Le trouveur et le propriétaire se contactent en 1 clic. Aucune app à installer.',
  },
  {
    image: '/images/home/gps-map.png',
    title: 'Position GPS automatique',
    desc: 'Le trouveur n\'a rien à taper — sa position est envoyée automatiquement au propriétaire via Google Maps. Simple et précis.',
  },
  {
    image: '/images/landing-v2/features/securise-rgpd.jpg',
    title: 'Vie privée protégée',
    desc: 'Le trouveur ne voit que le prénom du propriétaire et la référence. Le numéro WhatsApp n\'est révélé qu\'au clic volontaire. Conforme RGPD.',
  },
  {
    image: '/images/landing-v2/features/sans-app.jpg',
    title: 'Multilingue automatique',
    desc: 'La page trouveur s\'adapte en FR / EN / AR selon la langue du navigateur. Un tag français peut être scanné par un touristes anglophone.',
  },
  {
    image: '/images/home/tracking-screen.png',
    title: 'Suivi en temps réel',
    desc: 'Entrez votre référence QRTags et suivez l\'état de votre objet : perdu, trouvé, en cours de récupération. Transparence totale.',
  },
  {
    image: '/images/home/solidarity-black.png',
    title: 'Solidarité citoyenne',
    desc: 'QRTags transforme chaque trouveur en héros local. Rendre un objet perdu devient simple, rapide et gratifiant.',
  },
];

const STATS = [
  { value: '98%', label: 'Objets retrouvés' },
  { value: '< 2h', label: 'Délai moyen retour' },
  { value: '0 app', label: 'Aucune app requise' },
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

const OBJECT_TYPES = [
  { image: '/images/home/suitcase-qr.png', name: 'Valises & bagages' },
  { image: '/images/home/phone-tablet-qr.png', name: 'Téléphones & tablettes' },
  { image: '/images/home/keys-qr.png', name: 'Clés & portefeuilles' },
  { image: '/images/home/glasses-qr.png', name: 'Lunettes & accessoires' },
  { image: '/images/home/jacket-qr.png', name: 'Vestes & sacs' },
  { image: '/images/home/passport-qr.png', name: 'Documents & passeports' },
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

// Default fallback packs (used before API fetch completes)
const SHOP_PACKS_FALLBACK = [
  { quantity: 3, name: 'Pack 3 Stickers', slug: 'pack-3-stickers', price: 1500, desc: '3 étiquettes QR indestructibles. Idéal pour tester.', badge: '', image: null },
  { quantity: 5, name: 'Pack 5 Stickers', slug: 'pack-5-stickers', price: 3000, desc: '5 étiquettes QR indestructibles. Le plus populaire.', badge: 'POPULAIRE', image: null },
  { quantity: 10, name: 'Pack 10 Stickers', slug: 'pack-10-stickers', price: 4000, desc: '10 étiquettes QR indestructibles. Pour usage fréquent.', badge: '', image: null },
  { quantity: 15, name: 'Pack 15 Stickers', slug: 'pack-15-stickers', price: 5500, desc: '15 étiquettes QR indestructibles. Le plus économique.', badge: 'ÉCONOMIQUE', image: null },
];

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

  // Use DB products if available, otherwise fallback
  const displayPacks = shopProducts.length > 0
    ? shopProducts.map(p => ({
        quantity: p.quantity,
        name: p.name,
        slug: p.slug,
        price: p.price,
        desc: p.description || `${p.quantity} étiquettes QR indestructibles.`,
        badge: p.quantity >= 10 ? 'ÉCONOMIQUE' : p.quantity === 5 ? 'POPULAIRE' : '',
        image: p.image,
      }))
    : SHOP_PACKS_FALLBACK;

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
              <a href="#features" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Avantages</a>
              <a href="#objets" className="px-4 py-2 text-sm font-medium hover:text-[#c89a00] transition-colors">Objets protégés</a>
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
                href="/#tarifs"
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
              <a href="#features" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Avantages</a>
              <a href="#objets" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Objets protégés</a>
              <a href="#tarifs" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Tarifs</a>
              <a href="#temoignages" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm">Témoignages</a>
              <a href="#tracker" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-[#c89a00]">Suivre un objet →</a>
              <Link href="/#tarifs" className="block px-4 py-3 text-sm font-bold text-center rounded-lg" style={{ background: COLORS.accent, color: COLORS.text }}>
                Protéger mes objets
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ═══ HERO — DOUBLE ORIENTATION ═══ */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(ellipse at 20% 30%, ${COLORS.accent}22 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, ${COLORS.green}11 0%, transparent 50%)`,
          }}
        />
        <div className="max-w-screen-2xl mx-auto relative grid lg:grid-cols-2 gap-12 items-center">
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
                href="/#tarifs"
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

          {/* Hero : Real photo — scène réelle objets retrouvés + Preview trouvaille */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative space-y-6"
          >
            <div
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ border: `1px solid ${COLORS.border}` }}
            >
              <Image
                src="/images/home/hero-found-objects.png"
                alt="QRTags — retrouvez vos objets perdus : un inconnu rend une valise étiquetée à sa propriétaire"
                width={1344}
                height={768}
                className="w-full h-auto object-cover"
                priority
              />
            </div>

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
      </section>

      {/* ═══ BANDE DÉFILANTE — Produits protégés (hauteur augmentée pour meilleure visibilité) ═══ */}
      <section className="py-10 overflow-hidden" style={{ background: COLORS.bgWarm }}>
        <div className="text-center mb-6">
          <p className="text-base font-bold" style={{ color: COLORS.accentDark }}>
            Protégez tous vos objets du quotidien avec QRTags
          </p>
        </div>
        {/* Scrolling marquee */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10" style={{ background: `linear-gradient(to right, ${COLORS.bgWarm}, transparent)` }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10" style={{ background: `linear-gradient(to left, ${COLORS.bgWarm}, transparent)` }} />
          <div className="flex animate-marquee">
            {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, i) => (
              <div
                key={`m-${i}`}
                className="flex-shrink-0 mx-4 flex items-center gap-4 px-6 py-5 rounded-2xl transition-all hover:scale-105 shadow-sm"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, minWidth: '180px' }}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-inner">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                </div>
                <span className="text-base font-bold whitespace-nowrap" style={{ color: COLORS.text }}>{item.name}</span>
              </div>
            ))}
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

      {/* ═══ OBJETS PROTÉGÉS — with real images ═══ */}
      <section id="objets" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.bgWarm, color: COLORS.accentDark, border: `1px solid ${COLORS.borderAccent}` }}
            >
              OBJETS DU QUOTIDIEN
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: COLORS.text }}>
              Quels objets pouvez-vous <span style={{ color: COLORS.accentDark }}>protéger</span> ?
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              Tout ce que vous emmenez avec vous et que vous ne voulez pas perdre.
              Un QR tag, et votre objet est traçable par n&apos;importe qui.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {OBJECT_TYPES.map((obj, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={obj.image}
                    alt={obj.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1" style={{ color: COLORS.text }}>{obj.name}</h3>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>
                    Collez un tag QR, et si cet objet est perdu, toute personne qui le trouve peut vous contacter en 1 clic.
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/#tarifs"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all hover:scale-105"
              style={{ background: COLORS.accent, color: COLORS.text }}
            >
              Protéger mes objets maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ AVANTAGES — with real images ═══ */}
      <section id="features" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bg }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.bgWarm, color: COLORS.accentDark, border: `1px solid ${COLORS.borderAccent}` }}
            >
              AVANTAGES
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: COLORS.text }}>
              Objets <span style={{ color: COLORS.accentDark }}>perdus</span> &{' '}
              <span style={{ color: COLORS.greenDark }}>retrouvés</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              QRTags fonctionne pour tout le monde — pas besoin de compte, d&apos;app ou de technologie.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl h-full"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={f.image}
                    alt={f.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.text }}>{f.title}</h3>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
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
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: '#E3B23C',
                  border: '4px solid #000000',
                }}
              >
                {/* Badge */}
                {pack.badge && (
                  <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-black"
                    style={{ background: '#000000', color: '#E3B23C' }}
                  >
                    {pack.badge}
                  </div>
                )}

                {/* Product image or quantity number */}
                {pack.image ? (
                  <img
                    src={pack.image}
                    alt={pack.name}
                    className="w-16 h-16 rounded-xl object-cover mb-4"
                    style={{ border: '3px solid #000000' }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: '#000000' }}
                  >
                    <span className="text-3xl font-black" style={{ color: '#E3B23C' }}>
                      {pack.quantity}
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-black mb-2" style={{ color: '#000000' }}>
                  {pack.name}
                </h3>
                <p className="text-sm mb-4" style={{ color: '#000000', opacity: 0.8 }}>
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

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-20 lg:py-28 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12 shadow-2xl"
            style={{ background: `linear-gradient(145deg, ${COLORS.green}, ${COLORS.greenDark})`, color: 'white' }}
          >
            <HandHelping className="w-12 h-12 mb-6 mx-auto" />
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Chaque objet perdu peut être retrouvé
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Protégez vos affaires avec un QR tag. Et si vous trouvez un objet étiqueté,
              rendez-le en 1 clic. Solidarité citoyenne, technologie simple.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/#tarifs"
                className="px-8 py-4 rounded-xl font-black text-base inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.accent, color: COLORS.text }}
              >
                Protéger mes objets
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#tracker"
                className="px-8 py-4 rounded-xl font-bold text-base inline-flex items-center justify-center gap-2 border-2 transition-all hover:bg-white/10"
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
                <li><a href="#tracker" style={{ color: COLORS.textMuted }}>Suivre un objet</a></li>
                <li><a href="#tarifs" style={{ color: COLORS.textMuted }}>Tarifs</a></li>
                <li><Link href="/#tarifs" style={{ color: COLORS.textMuted }}>Protéger mes objets</Link></li>
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
