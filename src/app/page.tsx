'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  QrCode,
  Smartphone,
  MapPin,
  MessageCircle,
  Menu,
  X,
  Shield,
  Building2,
  GraduationCap,
  Car,
  Luggage,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Package,
  Bell,
  Globe,
  Zap,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import TrackingWidget from '@/components/home/TrackingWidget';

const LandingChatbotWidget = dynamic(
  () => import('@/components/finder/LandingChatbotWidget'),
  { ssr: false, loading: () => null },
);

// ════════════════════════════════════════════════════════════════════
// QRTags — Couleurs harmonisées avec le logo
// Logo : Jaune doré #fdb900 / #ffb706 sur fond noir #0d0d0f
// Charte QRTags : Noir #111111 + Jaune moutarde/doré #E3B23C / #FDB900
// ════════════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#0d0d0f',          // Noir profond (logo)
  bgAlt: '#111111',       // Noir QRTags
  accent: '#FDB900',      // Jaune doré (logo)
  accentAlt: '#E3B23C',   // Jaune moutarde (charte QRTags)
  accentHover: '#FFB706', // Variante hover
  text: '#fdfdfd',        // Blanc (logo)
  textMuted: 'rgba(253, 253, 253, 0.7)',
  card: 'rgba(253, 185, 0, 0.08)',
  border: 'rgba(253, 185, 0, 0.2)',
};

// ════════════════════════════════════════════════════════════════════
// DONNÉES MÉTIER QRTags — Multi-métiers
// ════════════════════════════════════════════════════════════════════
const AGENCY_TYPES = [
  {
    icon: Building2,
    name: 'Hôtels',
    desc: 'Effets personnels clients (valises, poches, électronique).',
    color: COLORS.accent,
  },
  {
    icon: GraduationCap,
    name: 'Écoles',
    desc: 'Cartables, uniformes, instruments de musique.',
    color: COLORS.accentAlt,
  },
  {
    icon: Luggage,
    name: 'Consignes',
    desc: 'Bagages en gare, aéroport, gare routière.',
    color: COLORS.accent,
  },
  {
    icon: Car,
    name: 'Loueurs auto',
    desc: 'Clés, documents, sièges enfant, GPS.',
    color: COLORS.accentAlt,
  },
  {
    icon: Stethoscope,
    name: 'Cliniques',
    desc: 'Effets personnels patients, dossiers, prothèses.',
    color: COLORS.accent,
  },
  {
    icon: Package,
    name: 'Autres',
    desc: 'Bibliothèques, événementiel, logistique.',
    color: COLORS.accentAlt,
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    icon: QrCode,
    title: 'Génération QR',
    desc: 'Le Superadmin génère des lots de QR codes uniques et les assigne aux entreprises partenaires.',
  },
  {
    num: '02',
    icon: Package,
    title: 'Vente au client',
    desc: 'L\'entreprise vend les tags QRTags à ses clients finaux et trace chaque vente dans son dashboard.',
  },
  {
    num: '03',
    icon: Smartphone,
    title: 'Activation',
    desc: 'Le client scanne son QR code, remplit ses infos et l\'associe à son objet. Le tag est désormais protégé.',
  },
  {
    num: '04',
    icon: MessageCircle,
    title: 'Perte & trouvaille',
    desc: 'Un trouveur scanne le QR → la page WAME s\'ouvre avec sa géoloc → le propriétaire est contacté instantanément.',
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Contact instantané',
    desc: 'WhatsApp WAME (click-to-chat) pré-rempli avec la géolocalisation du trouveur. Aucune app à installer.',
  },
  {
    icon: MapPin,
    title: 'Géolocalisation GPS',
    desc: 'Position précise du trouveur envoyée automatiquement au propriétaire via Google Maps.',
  },
  {
    icon: Shield,
    title: 'Aucune donnée sensible',
    desc: 'Le trouveur ne voit que le prénom du propriétaire et la référence. Le numéro WhatsApp n\'est révélé qu\'au clic.',
  },
  {
    icon: Globe,
    title: 'Multilingue',
    desc: 'La page trouveur s\'adapte automatiquement en FR / EN / AR selon la langue du navigateur.',
  },
  {
    icon: Bell,
    title: 'Traçabilité complète',
    desc: 'Chaque scan est journalisé (position, heure, contexte). L\'entreprise voit tout depuis son dashboard.',
  },
  {
    icon: Building2,
    title: 'Multi-métiers',
    desc: 'Hôtels, écoles, consignes, loueurs, cliniques — champs dynamiques selon votre activité.',
  },
];

const STATS = [
  { value: '10 000+', label: 'Objets protégés' },
  { value: '< 2h', label: 'Délai moyen de récupération' },
  { value: '98%', label: 'Objets retrouvés' },
  { value: '24/7', label: 'Disponible sans app' },
];

const TESTIMONIALS = [
  {
    name: 'Sophie Martin',
    role: 'Directrice, Hôtel Le Royal',
    text: 'QRTags a transformé notre gestion des objets perdus. Les clients récupèrent leurs affaires en moins de 2h. Le ROI est immédiat.',
    avatar: 'SM',
  },
  {
    name: 'Karim Benali',
    role: 'Responsable consigne, Gare de Lyon',
    text: 'Plus aucun bagage égaré depuis qu\'on a étiqueté tous nos casiers. Le système WAME est bluffant de simplicité.',
    avatar: 'KB',
  },
  {
    name: 'Dr. Élise Fournier',
    role: 'Clinique Saint-Antoine',
    text: 'Adieu lunettes et prothèses perdues. Les patients sont rassurés et notre réception est désengorgée.',
    avatar: 'EF',
  },
];

// ════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main
      style={{
        background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bgAlt} 100%)`,
        color: COLORS.text,
        minHeight: '100vh',
      }}
    >
      {/* ═══ NAVBAR ═══ */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: scrolled ? `${COLORS.bg}ee` : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? `1px solid ${COLORS.border}` : '1px solid transparent',
          transition: 'all 0.3s',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <QRTagsLogo size="md" variant="dark" withHover />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <a href="#metiers" className="px-4 py-2 text-sm font-medium hover:text-[#FDB900] transition-colors">
                Métiers
              </a>
              <a href="#workflow" className="px-4 py-2 text-sm font-medium hover:text-[#FDB900] transition-colors">
                Comment ça marche
              </a>
              <a href="#features" className="px-4 py-2 text-sm font-medium hover:text-[#FDB900] transition-colors">
                Fonctionnalités
              </a>
              <a href="#temoignages" className="px-4 py-2 text-sm font-medium hover:text-[#FDB900] transition-colors">
                Témoignages
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/agence/connexion"
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-[#FDB900] transition-colors"
              >
                Espace agence
              </Link>
              <Link
                href="/devenir-partenaire"
                className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: COLORS.accent,
                  color: COLORS.bg,
                }}
              >
                Devenir partenaire
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <a href="#metiers" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-white/80">Métiers</a>
              <a href="#workflow" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-white/80">Comment ça marche</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-white/80">Fonctionnalités</a>
              <a href="#temoignages" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-white/80">Témoignages</a>
              <Link href="/agence/connexion" className="block px-4 py-2 text-sm text-[#FDB900]">Espace agence →</Link>
              <Link href="/devenir-partenaire" className="block px-4 py-3 text-sm font-bold text-center rounded-lg" style={{ background: COLORS.accent, color: COLORS.bg }}>
                Devenir partenaire
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${COLORS.accent}22 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, ${COLORS.accentAlt}11 0%, transparent 50%)`,
          }}
        />
        <div className="max-w-7xl mx-auto relative grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: COLORS.accent }} />
              <span className="text-sm font-medium" style={{ color: COLORS.accent }}>
                SaaS multi-métiers pour entreprises
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Retrouvez vos{' '}
              <span style={{ color: COLORS.accent }}>objets perdus</span>{' '}
              en un scan
            </h1>

            <p className="text-lg md:text-xl mb-8 max-w-xl" style={{ color: COLORS.textMuted }}>
              QRTags — étiquettes QR pour hôtels, écoles, consignes, loueurs et cliniques.
              Quand un objet est perdu, le trouveur vous contacte instantanément via WhatsApp
              avec sa géolocalisation. Sans app, sans batterie, sans GPS intégré.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/devenir-partenaire"
                className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{
                  background: COLORS.accent,
                  color: COLORS.bg,
                }}
              >
                Devenir partenaire
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#workflow"
                className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 border-2 transition-all hover:bg-white/5"
                style={{ borderColor: COLORS.border, color: COLORS.text }}
              >
                Voir comment ça marche
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
                  <div className="text-2xl md:text-3xl font-black" style={{ color: COLORS.accent }}>
                    {s.value}
                  </div>
                  <div className="text-xs md:text-sm" style={{ color: COLORS.textMuted }}>
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tracking widget card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            <div
              className="rounded-3xl p-8 shadow-2xl"
              style={{
                background: `linear-gradient(145deg, ${COLORS.bgAlt}, #1a1a1a)`,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-5 h-5" style={{ color: COLORS.accent }} />
                  <span className="text-sm font-bold" style={{ color: COLORS.accent }}>
                    Suivre un objet
                  </span>
                </div>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  Entrez votre référence QRTags pour voir le suivi
                </p>
              </div>
              <TrackingWidget />

              {/* Mini "objet trouvé" preview */}
              <div className="mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: COLORS.accent, color: COLORS.bg }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: COLORS.text }}>
                      Objet retrouvé
                    </div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>
                      Il y a 2h · Hôtel Le Royal
                    </div>
                  </div>
                </div>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  « Bonjour Marie, j'ai trouvé votre objet (réf. QRT26-MLQGY7).
                  Je suis à la réception. — Sophie, réceptionniste »
                </p>
              </div>
            </div>

            {/* Floating WhatsApp badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-4 -right-4 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2"
              style={{
                background: '#25D366',
                color: 'white',
              }}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Contact WhatsApp</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ MÉTIERS ═══ */}
      <section id="metiers" className="py-20 lg:py-28 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.card, color: COLORS.accent, border: `1px solid ${COLORS.border}` }}
            >
              MULTI-MÉTIERS
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Un tag QR pour <span style={{ color: COLORS.accent }}>chaque métier</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              Chaque type d'entreprise a ses propres champs dynamiques.
              QRTags s'adapte automatiquement à votre activité.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENCY_TYPES.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-6 transition-all hover:scale-105 cursor-default"
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: t.color, color: COLORS.bg }}
                >
                  <t.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t.name}</h3>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKFLOW ═══ */}
      <section id="workflow" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.card, color: COLORS.accent, border: `1px solid ${COLORS.border}` }}
            >
              WORKFLOW QRTAGS
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              4 étapes vers la <span style={{ color: COLORS.accent }}>retrouvaille</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              Du génération du QR code jusqu'au contact WhatsApp du trouveur
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl p-6"
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: COLORS.accent, color: COLORS.bg }}
                >
                  {step.num}
                </div>
                <step.icon className="w-8 h-8 mb-4" style={{ color: COLORS.accent }} />
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/devenir-partenaire"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all hover:scale-105"
              style={{ background: COLORS.accent, color: COLORS.bg }}
            >
              Démarrer avec QRTags
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 lg:py-28 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.card, color: COLORS.accent, border: `1px solid ${COLORS.border}` }}
            >
              FONCTIONNALITÉS
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Pensé pour la <span style={{ color: COLORS.accent }}>retrouvaille</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              Tout ce qu'il faut pour que vos objets reviennent à leur propriétaire
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
                className="rounded-2xl p-6"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <f.icon className="w-7 h-7 mb-3" style={{ color: COLORS.accent }} />
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TÉMOIGNAGES ═══ */}
      <section id="temoignages" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.card, color: COLORS.accent, border: `1px solid ${COLORS.border}` }}
            >
              TÉMOIGNAGES
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Ils ont <span style={{ color: COLORS.accent }}>récupéré</span> leurs objets
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
                <div className="text-4xl mb-4" style={{ color: COLORS.accent }}>"</div>
                <p className="text-sm mb-6" style={{ color: COLORS.text }}>{t.text}</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: COLORS.accent, color: COLORS.bg }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t.name}</div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-20 lg:py-28 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12"
            style={{
              background: `linear-gradient(145deg, ${COLORS.accent}, ${COLORS.accentAlt})`,
              color: COLORS.bg,
            }}
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Prêt à ne plus jamais rien perdre ?
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Rejoignez les entreprises qui ont déjà protégé plus de 10 000 objets avec QRTags.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/devenir-partenaire"
                className="px-8 py-4 rounded-xl font-black text-base inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.bg, color: COLORS.accent }}
              >
                Devenir partenaire
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/agence/connexion"
                className="px-8 py-4 rounded-xl font-bold text-base inline-flex items-center justify-center gap-2 border-2 transition-all hover:bg-black/10"
                style={{ borderColor: COLORS.bg, color: COLORS.bg }}
              >
                J'ai déjà un compte
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-5 border-t" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <QRTagsLogo size="md" variant="dark" />
              <p className="text-sm mt-4 max-w-md" style={{ color: COLORS.textMuted }}>
                QRTags — SaaS de gestion d'objets perdus pour entreprises.
                Hôtels, écoles, consignes, loueurs, cliniques. Multi-métiers.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm" style={{ color: COLORS.accent }}>Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#metiers" style={{ color: COLORS.textMuted }}>Métiers</a></li>
                <li><a href="#workflow" style={{ color: COLORS.textMuted }}>Workflow</a></li>
                <li><a href="#features" style={{ color: COLORS.textMuted }}>Fonctionnalités</a></li>
                <li><Link href="/devenir-partenaire" style={{ color: COLORS.textMuted }}>Devenir partenaire</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm" style={{ color: COLORS.accent }}>Compte</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/agence/connexion" style={{ color: COLORS.textMuted }}>Espace agence</Link></li>
                <li><Link href="/admin/connexion" style={{ color: COLORS.textMuted }}>Espace admin</Link></li>
                <li><Link href="/inscrire" style={{ color: COLORS.textMuted }}>Activer un tag</Link></li>
                <li><Link href="/contact" style={{ color: COLORS.textMuted }}>Contact</Link></li>
              </ul>
            </div>
          </div>
          <div
            className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
            style={{ borderColor: COLORS.border }}
          >
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              © {new Date().getFullYear()} QRTags. Tous droits réservés.
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
