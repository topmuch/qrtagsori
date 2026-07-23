'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, Phone, Truck, ShieldCheck } from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// ════════════════════════════════════════════════════════════════
// COULEURS BOUTIQUE — Noir + Jaune Moutarde
// ════════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#111111',
  bgCard: '#1a1a1a',
  mustard: '#E3B23C',
  black: '#000000',
  white: '#FFFFFF',
  whiteMuted: '#aaaaaa',
  border: '#333333',
  green: '#22C55E',
};

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh' }}>
      {/* ─── Header ─── */}
      <nav
        className="sticky top-0 z-50 px-5"
        style={{ background: COLORS.bg, borderBottom: `2px solid ${COLORS.border}` }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <QRTagsLogo size="sm" variant="dark" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: COLORS.mustard }}
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-5 py-12 md:py-20">
        {/* ─── Success Card ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-8 md:p-10 text-center"
          style={{ background: COLORS.mustard, border: `4px solid ${COLORS.black}` }}
        >
          {/* Icône */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CheckCircle2
              className="w-20 h-20 mx-auto mb-4"
              style={{ color: COLORS.black }}
              strokeWidth={1.5}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-4xl font-black mb-3"
            style={{ color: COLORS.black }}
          >
            Commande envoyée !
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg mb-2"
            style={{ color: COLORS.black }}
          >
            Merci ! Nous vous appellerons sous 24h pour confirmer la livraison.
          </motion.p>

          {phone && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-base font-bold mb-6"
              style={{ color: COLORS.black }}
            >
              <Phone className="w-4 h-4 inline mr-1" />
              Numéro : <span style={{ textDecoration: 'underline' }}>{phone}</span>
            </motion.p>
          )}

          {/* Info badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col gap-3 mb-8"
          >
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: COLORS.black }}>
              <Truck className="w-5 h-5" style={{ color: COLORS.mustard }} />
              <span className="text-sm font-bold" style={{ color: COLORS.mustard }}>
                Livraison et paiement à la livraison à Dakar
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: COLORS.black }}>
              <ShieldCheck className="w-5 h-5" style={{ color: COLORS.mustard }} />
              <span className="text-sm font-bold" style={{ color: COLORS.mustard }}>
                Zero risque : vous payez quand vous recevez
              </span>
            </div>
          </motion.div>

          {/* Bouton retour */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-lg transition-all hover:scale-105"
              style={{ background: COLORS.black, color: COLORS.mustard, border: `3px solid ${COLORS.mustard}` }}
            >
              <ArrowLeft className="w-5 h-5" />
              Retour a l&apos;accueil
            </Link>
          </motion.div>
        </motion.div>

        {/* ─── Section info complementaire ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-sm" style={{ color: COLORS.whiteMuted }}>
            Votre commande est enregistree. Notre equipe vous contactera par telephone pour confirmer
            l&apos;adresse de livraison et le timing. Vous recevrez vos stickers QRTags directement chez vous.
          </p>
          <p className="text-sm mt-3" style={{ color: COLORS.whiteMuted }}>
            Une question ? Appelez-nous au <span style={{ color: COLORS.mustard }}>+221 78 485 82 26</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
