'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Home, Bed, Maximize, Euro, Phone, User, MessageSquare,
  Eye, ChevronLeft, ChevronRight, Send, Loader2, CheckCircle2, Building2,
} from 'lucide-react';

// ─── Qrioo Immobilier Pack ───
// Professional property listing card with warm amber/gold accent colors
// Hero image gallery, property details, contact agent form

const QRIOO_PURPLE = '#7C3AED';
const AMBER_ACCENT = '#D97706';
const AMBER_BG = '#FFFBEB';

interface PackImmobilierProps {
  reference: string;
  contentMetadata: Record<string, unknown> | null;
  travelerName: string | null;
}

function formatPrice(price: unknown): string {
  if (price == null) return '';
  const n = Number(price);
  if (isNaN(n)) return String(price);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function PackImmobilier({ reference, contentMetadata, travelerName }: PackImmobilierProps) {
  const meta = contentMetadata || {};

  const title = (meta.title as string) || 'Bien immobilier';
  const description = (meta.description as string) || '';
  const price = meta.price;
  const surface = meta.surface;
  const rooms = meta.rooms;
  const images = Array.isArray(meta.images) ? meta.images as string[] : [];
  const virtualTourUrl = (meta.virtualTourUrl as string) || null;

  const [currentImage, setCurrentImage] = useState(0);
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentMessage, setAgentMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const nextImage = () => setCurrentImage((i) => (i + 1) % (images.length || 1));
  const prevImage = () => setCurrentImage((i) => (i - 1 + (images.length || 1)) % (images.length || 1));

  const handleContact = async () => {
    if (!agentName.trim() || !agentPhone.trim()) {
      alert('Veuillez remplir votre nom et votre numéro de téléphone.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'contact_agent',
          finderName: agentName.trim(),
          finderPhone: agentPhone.trim(),
          message: agentMessage.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
      } else {
        alert(data.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      alert('Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-lg mx-auto">

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-4 text-white"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium opacity-80">Qrioo Immobilier</span>
          </div>
          <h1 className="text-xl font-bold mt-1">{title}</h1>
          {travelerName && (
            <p className="text-amber-100 text-sm mt-1">Proposé par {travelerName}</p>
          )}
        </motion.div>

        {/* ─── Image Gallery ─── */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative bg-gray-100"
            style={{ height: '280px' }}
          >
            <img
              src={images[currentImage]}
              alt={`${title} - photo ${currentImage + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"
                  aria-label="Photo suivante"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentImage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentImage ? 'bg-white w-5' : 'bg-white/50'
                      }`}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ─── Property Details ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="px-5 py-5"
        >
          {/* Price */}
          {price != null && (
            <div className="mb-4">
              <p className="text-3xl font-black text-amber-700">
                {formatPrice(price)}
              </p>
            </div>
          )}

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {surface != null && (
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                <Maximize className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <p className="text-lg font-bold text-amber-900">{String(surface)}</p>
                <p className="text-xs text-amber-600">m²</p>
              </div>
            )}
            {rooms != null && (
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                <Bed className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <p className="text-lg font-bold text-amber-900">{String(rooms)}</p>
                <p className="text-xs text-amber-600">pièces</p>
              </div>
            )}
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
              <Home className="w-5 h-5 mx-auto mb-1 text-amber-600" />
              <p className="text-sm font-bold text-amber-900 mt-1">À vendre</p>
              <p className="text-xs text-amber-600">Bien</p>
            </div>
          </div>

          {/* Description */}
          {description && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-amber-900 uppercase mb-2">Description</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          )}

          {/* Virtual tour button */}
          {virtualTourUrl && (
            <motion.a
              href={virtualTourUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex items-center justify-center gap-2 w-full px-5 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-shadow mb-5"
            >
              <Eye className="w-5 h-5" />
              Visite virtuelle
            </motion.a>
          )}
        </motion.div>

        {/* ─── Contact Agent Form ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mx-5 mb-8 bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden"
        >
          <div className="bg-amber-600 px-5 py-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Phone className="w-4 h-4" /> Contacter l&apos;agent
            </h3>
          </div>

          {isSubmitted ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-bold text-gray-900 mb-1">Message envoyé !</p>
              <p className="text-sm text-gray-600">L&apos;agent vous recontactera bientôt.</p>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="agent-name" className="block text-sm font-bold text-gray-700 mb-1.5">
                  <User className="w-3.5 h-3.5 inline mr-1" /> Votre nom <span className="text-red-500">*</span>
                </label>
                <input
                  id="agent-name"
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Nom complet"
                  className="w-full min-h-[44px] px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="agent-phone" className="block text-sm font-bold text-gray-700 mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1" /> Votre téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  id="agent-phone"
                  type="tel"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full min-h-[44px] px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="agent-msg" className="block text-sm font-bold text-gray-700 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1" /> Message (optionnel)
                </label>
                <textarea
                  id="agent-msg"
                  rows={3}
                  value={agentMessage}
                  onChange={(e) => setAgentMessage(e.target.value)}
                  placeholder="Je suis intéressé(e) par ce bien..."
                  className="w-full min-h-[44px] px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition text-sm resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleContact}
                disabled={isSubmitting || !agentName.trim() || !agentPhone.trim()}
                className="w-full px-5 py-3.5 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-h-[48px]"
                style={{ backgroundColor: AMBER_ACCENT }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer ma demande
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* ─── Branding ─── */}
        <div className="text-center pb-8">
          <p className="text-gray-400 text-sm">
            Propulsé par <span className="font-bold text-gray-600">Qrioo</span>
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: QRIOO_PURPLE }} />
            <span className="text-gray-400 text-xs">L&apos;immobilier simplifié</span>
          </div>
        </div>
      </div>
    </main>
  );
}
