'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  QrCode, Search, MapPin, MessageCircle, Shield,
  ArrowRight, Smartphone, CheckCircle2, Heart, Sparkles,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// ─── Color tokens harmonisés ───
const COLORS = {
  bg: '#ffffff',
  bgAlt: '#fafafa',
  bgCream: '#fffdf5',
  bgWarm: '#FFF8E7',
  text: '#0d0d0f',
  textMuted: '#525252',
  accent: '#FDB900',
  accentDark: '#c89a00',
  green: '#22C55E',
  greenDark: '#16A34A',
  card: '#ffffff',
  border: '#e5e5e5',
  borderAccent: 'rgba(253, 185, 0, 0.3)',
};

const STEPS = [
  {
    icon: QrCode,
    title: 'Scannez le QR code',
    desc: 'Vous avez trouvé un objet avec un tag QRTags ? Ouvrez l\'appareil photo de votre téléphone et scannez le QR code collé sur l\'objet.',
    color: COLORS.accent,
  },
  {
    icon: MapPin,
    title: 'Votre position est captée',
    desc: 'Le scan capture automatiquement votre position GPS. Le propriétaire sait exactement où son objet a été vu.',
    color: COLORS.accentDark,
  },
  {
    icon: MessageCircle,
    title: 'Contactez via WhatsApp',
    desc: 'La page WAME s\'ouvre instantanément. Un message WhatsApp pré-rempli est envoyé au propriétaire. Aucune app à installer.',
    color: COLORS.green,
  },
  {
    icon: Heart,
    title: 'L\'objet est rendu !',
    desc: 'Le propriétaire vous contacte, vous vous retrouvez, et l\'objet est rendu. En moyenne en 2 heures. Un geste citoyen qui change une vie.',
    color: COLORS.greenDark,
  },
];

export default function ScanPage() {
  return (
    <main className="min-h-screen" style={{ background: COLORS.bg }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b" style={{ borderColor: COLORS.border }}>
        <div className="max-w-screen-xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <QRTagsLogo size="sm" variant="dark" />
          </Link>
          <Link
            href="/inscrire"
            className="px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105"
            style={{ background: COLORS.accent, color: COLORS.text }}
          >
            <Sparkles className="w-4 h-4" />
            Protéger mes objets
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 px-5" style={{ background: COLORS.bgWarm }}>
        <div className="max-w-screen-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: COLORS.bgWarm, border: `1px solid ${COLORS.borderAccent}` }}
            >
              <QrCode className="w-4 h-4" style={{ color: COLORS.accentDark }} />
              <span className="text-sm font-bold" style={{ color: COLORS.accentDark }}>Scanner un QR QRTags</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6" style={{ color: COLORS.text }}>
              Vous avez <span style={{ color: COLORS.greenDark }}>trouvé</span> un objet ?
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8" style={{ color: COLORS.textMuted }}>
              Un simple scan avec votre téléphone suffit à contacter le propriétaire.
              Pas d\'app, pas de formulaire, pas de stress. Juste un geste citoyen.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#comment"
                className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{ background: COLORS.green, color: 'white' }}
              >
                <Search className="w-5 h-5" />
                Comment ça marche ?
              </a>
              <Link
                href="/inscrire"
                className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 border-2 transition-all hover:bg-[#fffdf5]"
                style={{ borderColor: COLORS.accent, color: COLORS.text }}
              >
                <Sparkles className="w-5 h-5" style={{ color: COLORS.accentDark }} />
                J\'ai perdu un objet
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section id="comment" className="py-20 lg:py-28 px-5" style={{ background: COLORS.bg }}>
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: COLORS.bgWarm, color: COLORS.accentDark, border: `1px solid ${COLORS.borderAccent}` }}
            >
              SIMPLE & RAPIDE
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: COLORS.text }}>
              4 étapes pour <span style={{ color: COLORS.greenDark }}>rendre</span> un objet
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textMuted }}>
              Vous n\'avez besoin que de votre téléphone. Tout se fait en moins de 30 secondes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
                style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: step.color + '22' }}
                >
                  <step.icon className="w-6 h-6" style={{ color: step.color }} />
                </div>
                <div
                  className="text-xs font-bold mb-2 inline-block px-2 py-1 rounded-lg"
                  style={{ background: COLORS.bgWarm, color: COLORS.accentDark }}
                >
                  Étape {i + 1}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.text }}>
                  {step.title}
                </h3>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages du scan */}
      <section className="py-20 lg:py-28 px-5" style={{ background: COLORS.bgAlt }}>
        <div className="max-w-screen-xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: COLORS.text }}>
              Pourquoi <span style={{ color: COLORS.accentDark }}>QRTags</span> ?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, title: 'Sans application', desc: 'Un simple scan avec l\'appareil photo de votre smartphone. Pas besoin d\'installer quoi que ce soit.' },
              { icon: Shield, title: 'Vie privée protégée', desc: 'Vos coordonnées ne sont jamais partagées. Le contact se fait via WhatsApp, sans exposer votre numéro.' },
              { icon: MapPin, title: 'GPS automatique', desc: 'Votre position GPS est captée lors du scan, permettant au propriétaire de savoir exactement où son objet a été trouvé.' },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="rounded-2xl p-6 shadow-lg"
                style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                  style={{ background: COLORS.green, color: 'white' }}
                >
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.text }}>{feat.title}</h3>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5" style={{ background: COLORS.green }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-white" />
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-white">
            Prêt à faire un geste citoyen ?
          </h2>
          <p className="text-lg mb-8 text-white/80">
            Si vous avez trouvé un objet avec un tag QRTags, scannez-le maintenant.
            Si vous voulez protéger vos objets, commandez vos tags.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-105"
              style={{ background: COLORS.accent, color: COLORS.text }}
            >
              <QrCode className="w-5 h-5" />
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/inscrire"
              className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 border-2 border-white transition-all hover:bg-white/10 text-white"
            >
              <Sparkles className="w-5 h-5" />
              Protéger mes objets
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 border-t" style={{ background: COLORS.bg, borderColor: COLORS.border }}>
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <QRTagsLogo size="sm" variant="dark" />
          </Link>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            Propulsé par <span className="font-bold" style={{ color: COLORS.text }}>QRTags</span> ·
            <Link href="/cgu" className="ml-2 hover:underline">CGU</Link> ·
            <Link href="/confidentialite" className="ml-1 hover:underline">Confidentialité</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
