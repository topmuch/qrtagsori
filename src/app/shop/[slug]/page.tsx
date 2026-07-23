'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Phone,
  MapPin,
  User,
  Home,
  ChevronRight,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowLeft,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// ════════════════════════════════════════════════════════════════
// COULEURS BOUTIQUE — Noir + Jaune Moutarde
// ════════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#111111',
  bgCard: '#1a1a1a',
  mustard: '#E3B23C',
  mustardDark: '#c89a00',
  mustardLight: '#F5D76E',
  black: '#000000',
  white: '#FFFFFF',
  whiteMuted: '#aaaaaa',
  border: '#333333',
  inputBg: '#F9FAFB',
  inputBorder: '#000000',
  green: '#22C55E',
};

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  description: string | null;
  image: string | null;
}

export default function ShopProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulaire
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('Dakar');
  const [quartier, setQuartier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Charger le produit
  useEffect(() => {
    fetch(`/api/shop/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setProduct(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur de connexion');
        setLoading(false);
      });
  }, [slug]);

  // ─── Submit ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          customerName,
          customerPhone,
          city,
          quartier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFormErrors(data.errors);
        } else {
          setFormErrors({ general: data.error || 'Erreur inconnue' });
        }
        setSubmitting(false);
        return;
      }

      // Redirect vers /shop/success
      window.location.href = `/shop/success?phone=${encodeURIComponent(customerPhone.startsWith('+221') ? customerPhone : '+221' + customerPhone.replace(/\s/g, ''))}`;
    } catch {
      setFormErrors({ general: 'Erreur de connexion. Réessayez.' });
      setSubmitting(false);
    }
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh' }} className="flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <ShoppingBag className="w-12 h-12" style={{ color: COLORS.mustard }} />
        </motion.div>
      </div>
    );
  }

  // ─── Error state ───
  if (error || !product) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh' }} className="flex flex-col items-center justify-center px-5">
        <ShoppingBag className="w-16 h-16 mb-4" style={{ color: COLORS.whiteMuted }} />
        <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.white }}>Produit non trouvé</h1>
        <p className="mb-6" style={{ color: COLORS.whiteMuted }}>
          Ce pack n&apos;existe pas ou a été désactivé.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-bold"
          style={{ background: COLORS.mustard, color: COLORS.black }}
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  // ─── Prix formaté ───
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

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

      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
        {/* ─── Produit Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-8 md:p-10 mb-8"
          style={{ background: COLORS.mustard, border: `4px solid ${COLORS.black}` }}
        >
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Nombre de stickers en grand */}
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: COLORS.black }}
            >
              <span className="text-5xl md:text-6xl font-black" style={{ color: COLORS.mustard }}>
                {product.quantity}
              </span>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: COLORS.black }}>
                {product.name}
              </h1>
              {product.description && (
                <p className="text-base mb-4" style={{ color: COLORS.black }}>
                  {product.description}
                </p>
              )}
              <div className="flex items-center gap-4">
                <div className="text-3xl md:text-4xl font-black" style={{ color: COLORS.black }}>
                  {formatPrice(product.price)} FCFA
                </div>
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: COLORS.black, color: COLORS.mustard }}
                >
                  <Truck className="w-3 h-3 inline mr-1" />
                  Paiement à la livraison
                </div>
              </div>
            </div>
          </div>

          {/* Badges de confiance */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: COLORS.black }}>
              <ShieldCheck className="w-4 h-4" style={{ color: COLORS.mustard }} />
              <span className="text-sm font-bold" style={{ color: COLORS.mustard }}>Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: COLORS.black }}>
              <Phone className="w-4 h-4" style={{ color: COLORS.mustard }} />
              <span className="text-sm font-bold" style={{ color: COLORS.mustard }}>Confirmation sous 24h</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: COLORS.black }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.green }} />
              <span className="text-sm font-bold" style={{ color: COLORS.mustard }}>98% objets retrouvés</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Formulaire Express ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-6 md:p-8"
          style={{ background: COLORS.bgCard, border: `2px solid ${COLORS.border}` }}
        >
          <h2 className="text-xl md:text-2xl font-black mb-2" style={{ color: COLORS.mustard }}>
            Commander maintenant
          </h2>
          <p className="text-sm mb-6" style={{ color: COLORS.whiteMuted }}>
            4 champs, 0 compte, 0 friction. Nous livrons à Dakar.
          </p>

          {/* Erreur générale */}
          {formErrors.general && (
            <div
              className="rounded-xl px-4 py-3 mb-4 text-sm font-medium"
              style={{ background: '#ff444420', color: '#ff4444', border: '1px solid #ff4444' }}
            >
              {formErrors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom complet */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: COLORS.white }}>
                <User className="w-4 h-4 inline mr-1" style={{ color: COLORS.mustard }} />
                Nom complet <span style={{ color: COLORS.mustard }}>*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Votre nom et prénom"
                className="w-full px-4 py-3 rounded-xl text-base font-medium outline-none transition-all focus:ring-2"
                style={{
                  background: COLORS.inputBg,
                  color: COLORS.black,
                  border: `2px solid ${formErrors.customerName ? '#ff4444' : COLORS.inputBorder}`,
                  boxShadow: 'none',
                }}
              />
              {formErrors.customerName && (
                <p className="text-xs mt-1" style={{ color: '#ff4444' }}>{formErrors.customerName}</p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: COLORS.white }}>
                <Phone className="w-4 h-4 inline mr-1" style={{ color: COLORS.mustard }} />
                Numéro de téléphone <span style={{ color: COLORS.mustard }}>*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="+221 77 123 45 67"
                className="w-full px-4 py-3 rounded-xl text-base font-medium outline-none transition-all focus:ring-2"
                style={{
                  background: COLORS.inputBg,
                  color: COLORS.black,
                  border: `2px solid ${formErrors.customerPhone ? '#ff4444' : COLORS.inputBorder}`,
                }}
              />
              {formErrors.customerPhone && (
                <p className="text-xs mt-1" style={{ color: '#ff4444' }}>{formErrors.customerPhone}</p>
              )}
            </div>

            {/* Ville */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: COLORS.white }}>
                <MapPin className="w-4 h-4 inline mr-1" style={{ color: COLORS.mustard }} />
                Ville <span style={{ color: COLORS.mustard }}>*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Dakar"
                className="w-full px-4 py-3 rounded-xl text-base font-medium outline-none transition-all focus:ring-2"
                style={{
                  background: COLORS.inputBg,
                  color: COLORS.black,
                  border: `2px solid ${formErrors.city ? '#ff4444' : COLORS.inputBorder}`,
                }}
              />
              {formErrors.city && (
                <p className="text-xs mt-1" style={{ color: '#ff4444' }}>{formErrors.city}</p>
              )}
            </div>

            {/* Quartier */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: COLORS.white }}>
                <Home className="w-4 h-4 inline mr-1" style={{ color: COLORS.whiteMuted }} />
                Quartier <span style={{ color: COLORS.whiteMuted }}>(optionnel)</span>
              </label>
              <input
                type="text"
                value={quartier}
                onChange={e => setQuartier(e.target.value)}
                placeholder="Ex : Médina, Plateau, Almadies..."
                className="w-full px-4 py-3 rounded-xl text-base font-medium outline-none transition-all focus:ring-2"
                style={{
                  background: COLORS.inputBg,
                  color: COLORS.black,
                  border: `2px solid ${COLORS.inputBorder}`,
                }}
              />
            </div>

            {/* Bouton Commander */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: COLORS.black, color: COLORS.mustard, border: `3px solid ${COLORS.mustard}` }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  COMMANDER MAINTENANT
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Mention */}
            <p className="text-xs text-center" style={{ color: COLORS.whiteMuted }}>
              Paiement à la livraison. Nous vous appellerons sous 24h pour confirmer.
            </p>
          </form>
        </motion.div>

        {/* ─── Section info ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 grid md:grid-cols-3 gap-4"
        >
          <div className="rounded-xl p-4" style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}` }}>
            <Truck className="w-6 h-6 mb-2" style={{ color: COLORS.mustard }} />
            <h3 className="text-sm font-bold mb-1" style={{ color: COLORS.white }}>Livraison à Dakar</h3>
            <p className="text-xs" style={{ color: COLORS.whiteMuted }}>Nous livrons directement chez vous à Dakar et environs.</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}` }}>
            <ShieldCheck className="w-6 h-6 mb-2" style={{ color: COLORS.mustard }} />
            <h3 className="text-sm font-bold mb-1" style={{ color: COLORS.white }}>Cash on Delivery</h3>
            <p className="text-xs" style={{ color: COLORS.whiteMuted }}>Pas de paiement en ligne. Vous payez quand vous recevez vos stickers.</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}` }}>
            <Phone className="w-6 h-6 mb-2" style={{ color: COLORS.mustard }} />
            <h3 className="text-sm font-bold mb-1" style={{ color: COLORS.white }}>Confirmation sous 24h</h3>
            <p className="text-xs" style={{ color: COLORS.whiteMuted }}>Nous vous appelons pour confirmer la commande avant livraison.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
