'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, AlertCircle, Clock, MapPin, Eye,
  CheckCircle2, ArrowLeft, MessageCircle, Navigation, Search, Shield, Phone,
} from 'lucide-react';
import { motion } from 'framer-motion';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

// ─── Design tokens harmonisés avec la homepage ───
const COLORS = {
  bg: '#FFF8E7',           // Fond warm accent (harmonisé avec homepage)
  bgAlt: '#fafafa',
  text: '#0d0d0f',
  textMuted: '#525252',
  accent: '#FDB900',
  accentDark: '#c89a00',
  green: '#22C55E',
  greenDark: '#16A34A',
  card: '#ffffff',
  border: '#e5e5e5',
  borderAccent: 'rgba(253, 185, 0, 0.3)',
  red: '#DC2626',
};

interface ObjectInfo {
  category?: string | null;
  category_label?: string | null;
  object_name?: string | null;
  object_description?: string | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  reward?: string | null;
  message_to_finder?: string | null;
  city?: string | null;
  country?: string | null;
}

interface SuiviScan {
  id?: string;
  location: string | null;
  city: string | null;
  country: string | null;
  finderName: string | null;
  finderPhone: string | null;
  message: string | null;
  scannedAt: string;
  hasMap?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface SuiviData {
  status: string;
  message?: string;
  baggage?: {
    reference: string;
    type: string;
    travelerName: string;
    status: string;
    agency?: string | null;
    createdAt?: string | null;
    lastScanDate?: string | null;
    lastLocation?: string | null;
    lastScanLocation?: string | null;
    scanCount?: number;
    declaredLostAt?: string | null;
    foundAt?: string | null;
    expiresAt?: string | null;
    trackingToken?: string | null;
    objectInfo?: ObjectInfo | null;
  };
  lastFinder?: { name: string | null; phone: string | null } | null;
  scans?: SuiviScan[];
  lastPosition?: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    hasCoordinates: boolean;
  } | null;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function SuiviPage() {
  const params = useParams();
  const router = useRouter();
  const reference = (params?.reference as string) || '';

  const [data, setData] = useState<SuiviData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) return;
    if (typeof window === 'undefined') return;
    try {
      const KEY = 'qrbag_my_references';
      const refs: string[] = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!refs.includes(reference)) {
        refs.unshift(reference);
        localStorage.setItem(KEY, JSON.stringify(refs.slice(0, 20)));
      }
    } catch {
      // silent
    }
  }, [reference]);

  useEffect(() => {
    if (!reference) return;
    (async () => {
      try {
        const res = await fetch(`/api/suivi/${reference}`, { cache: 'no-store' });
        if (!res.ok) {
          setError('Erreur lors du chargement');
          return;
        }
        const d: SuiviData = await res.json();
        setData(d);
      } catch (err) {
        console.error('[suivi] error:', err);
        setError('Erreur réseau');
      } finally {
        setLoading(false);
      }
    })();
  }, [reference]);

  useEffect(() => {
    if (!reference || loading || error) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/suivi/${reference}`, { cache: 'no-store' });
        if (res.ok) {
          const d: SuiviData = await res.json();
          setData(d);
        }
      } catch {
        // silent
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [reference, loading, error]);

  // ─── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
            style={{ background: COLORS.accent }}
          >
            <Search className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-lg font-bold" style={{ color: COLORS.text }}>
            Chargement du suivi...
          </p>
          <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>
            Nous localisons votre objet
          </p>
        </motion.div>
      </main>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────
  if (error || !data || !data.baggage) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.bg }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center rounded-2xl p-8 shadow-xl"
          style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#FEE2E2' }}
          >
            <AlertCircle className="w-7 h-7" style={{ color: COLORS.red }} />
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: COLORS.text }}>Suivi indisponible</h1>
          <p className="mb-6" style={{ color: COLORS.textMuted }}>
            {error || data?.message || 'Ce tag n\'existe pas ou n\'est pas encore activé.'}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: COLORS.accent, color: COLORS.text }}
          >
            Retour à l&apos;accueil
          </a>
        </motion.div>
      </main>
    );
  }

  // ─── Pending activation ─────────────────────────────────────────
  if (data.status === 'pending_activation') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.bg }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center rounded-2xl p-8 shadow-xl"
          style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: COLORS.bg }}
          >
            <Clock className="w-7 h-7" style={{ color: COLORS.accentDark }} />
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: COLORS.text }}>Tag non activé</h1>
          <p className="mb-6" style={{ color: COLORS.textMuted }}>Ce QR code n&apos;a pas encore été activé par son propriétaire.</p>
          <a
            href={`/inscrire?qr=${reference}`}
            className="inline-block px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: COLORS.green, color: 'white' }}
          >
            L&apos;activer maintenant
          </a>
        </motion.div>
      </main>
    );
  }

  // ─── Expired ────────────────────────────────────────────────────
  if (data.status === 'expired') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.bg }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center rounded-2xl p-8 shadow-xl"
          style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#FEE2E2' }}
          >
            <Clock className="w-7 h-7" style={{ color: COLORS.red }} />
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: COLORS.text }}>Tag expiré</h1>
          <p className="mb-6" style={{ color: COLORS.textMuted }}>La période de validité de ce tag est terminée.</p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: COLORS.accent, color: COLORS.text }}
          >
            Retour à l&apos;accueil
          </a>
        </motion.div>
      </main>
    );
  }

  // ─── Blocked ────────────────────────────────────────────────────
  if (data.status === 'blocked') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.bg }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center rounded-2xl p-8 shadow-xl"
          style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#FEE2E2' }}
          >
            <AlertCircle className="w-7 h-7" style={{ color: COLORS.red }} />
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: COLORS.text }}>Tag bloqué</h1>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: COLORS.accent, color: COLORS.text }}
          >
            Retour à l&apos;accueil
          </a>
        </motion.div>
      </main>
    );
  }

  const baggage = data.baggage;
  const objInfo = baggage.objectInfo;
  const isLost = data.status === 'lost' || Boolean(baggage.declaredLostAt && !baggage.foundAt);
  const scans = data.scans || [];
  const lastFinder = data.lastFinder;
  const hasTrackingToken = Boolean(baggage.trackingToken);

  return (
    <main className="min-h-screen py-8 px-4" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-block px-6 py-3 rounded-xl mb-4 shadow-lg" style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}>
            <QRTagsLogo size="md" variant="light" />
          </div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{
              background: isLost ? '#FEE2E2' : '#DCFCE7',
              border: `2px solid ${isLost ? COLORS.red : COLORS.green}`,
            }}
          >
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: isLost ? COLORS.red : COLORS.green }}
            />
            <span className="font-bold text-sm" style={{ color: isLost ? COLORS.red : COLORS.greenDark }}>
              {isLost ? 'Objet signalé perdu' : 'Objet suivi'}
            </span>
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: COLORS.text }}>
            Suivi de l&apos;objet
          </h1>
          <p style={{ color: COLORS.textMuted }}>
            Référence : <span className="font-bold" style={{ color: COLORS.text }}>{baggage.reference}</span>
          </p>
        </motion.div>

        {/* Propriétaire tracking link */}
        {hasTrackingToken && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 mb-6 shadow-xl"
            style={{ background: COLORS.card, border: `2px solid ${COLORS.borderAccent}` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#DCFCE7' }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.green }} />
              </div>
              <div className="flex-1">
                <p className="font-bold mb-1" style={{ color: COLORS.text }}>Vous êtes le propriétaire de cet objet ?</p>
                <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
                  Accédez à votre page de suivi propriétaire pour signaler une perte, partager le lien
                  sur WhatsApp, ou voir les statistiques détaillées.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/track/${baggage.trackingToken}`)}
                  className="inline-block px-5 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: COLORS.green, color: 'white' }}
                >
                  Ouvrir ma page de suivi &rarr;
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Carte : infos objet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 mb-6 shadow-xl"
          style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.text }}>
            <MapPin className="w-5 h-5" style={{ color: COLORS.accent }} />
            Informations
          </h3>
          <div className="rounded-xl p-4" style={{ background: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase font-bold" style={{ color: COLORS.textMuted }}>Propriétaire</p>
                <p className="font-bold" style={{ color: COLORS.text }}>{baggage.travelerName || 'Anonyme'}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold" style={{ color: COLORS.textMuted }}>Statut</p>
                <p className="font-bold" style={{ color: isLost ? COLORS.red : COLORS.green }}>
                  {isLost ? 'Perdu' : 'Actif'}
                </p>
              </div>
              {objInfo?.object_name && (
                <div>
                  <p className="text-xs uppercase font-bold" style={{ color: COLORS.textMuted }}>Objet</p>
                  <p className="font-bold" style={{ color: COLORS.text }}>{objInfo.object_name}</p>
                </div>
              )}
              {objInfo?.category_label && (
                <div>
                  <p className="text-xs uppercase font-bold" style={{ color: COLORS.textMuted }}>Catégorie</p>
                  <p className="font-bold" style={{ color: COLORS.text }}>{objInfo.category_label}</p>
                </div>
              )}
              {objInfo?.color && (
                <div>
                  <p className="text-xs uppercase font-bold" style={{ color: COLORS.textMuted }}>Couleur</p>
                  <p className="font-bold" style={{ color: COLORS.text }}>{objInfo.color}</p>
                </div>
              )}
              {objInfo?.brand && (
                <div>
                  <p className="text-xs uppercase font-bold" style={{ color: COLORS.textMuted }}>Marque</p>
                  <p className="font-bold" style={{ color: COLORS.text }}>{objInfo.brand}</p>
                </div>
              )}
              {baggage.agency && (
                <div>
                  <p className="text-xs uppercase font-bold" style={{ color: COLORS.textMuted }}>Agence</p>
                  <p className="font-bold" style={{ color: COLORS.text }}>{baggage.agency}</p>
                </div>
              )}
              {baggage.expiresAt && (
                <div>
                  <p className="text-xs uppercase font-bold" style={{ color: COLORS.textMuted }}>Expire le</p>
                  <p className="font-bold" style={{ color: COLORS.text }}>{formatDate(baggage.expiresAt)}</p>
                </div>
              )}
            </div>

            {objInfo?.object_description && (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <p className="text-xs uppercase font-bold mb-1" style={{ color: COLORS.textMuted }}>Description</p>
                <p className="text-sm" style={{ color: COLORS.text }}>{objInfo.object_description}</p>
              </div>
            )}

            {objInfo?.message_to_finder && (
              <div className="mt-4 p-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.borderAccent}` }}>
                <p className="text-xs uppercase font-bold mb-1" style={{ color: COLORS.accentDark }}>Message du propriétaire</p>
                <p className="text-sm italic" style={{ color: COLORS.text }}>&ldquo;{objInfo.message_to_finder}&rdquo;</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Carte : statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6 mb-6 shadow-xl"
          style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.text }}>
            <Eye className="w-5 h-5" style={{ color: COLORS.accent }} />
            Statistiques
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}>
              <Eye className="w-5 h-5 mx-auto mb-1" style={{ color: COLORS.accent }} />
              <p className="text-3xl font-black" style={{ color: COLORS.text }}>{baggage.scanCount || 0}</p>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Scans</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: COLORS.bgAlt, border: `1px solid ${COLORS.border}` }}>
              <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: COLORS.accent }} />
              <p className="text-3xl font-black" style={{ color: COLORS.text }}>{scans.length}</p>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Activités</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: isLost ? '#FEE2E2' : '#DCFCE7', border: `1px solid ${isLost ? '#FCA5A5' : '#BBF7D0'}` }}>
              {isLost ? (
                <>
                  <AlertCircle className="w-5 h-5 mx-auto mb-1" style={{ color: COLORS.red }} />
                  <p className="text-2xl font-black" style={{ color: COLORS.red }}>!</p>
                  <p className="text-xs mt-1" style={{ color: COLORS.red }}>Perdu</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1" style={{ color: COLORS.green }} />
                  <p className="text-2xl font-black" style={{ color: COLORS.green }}>OK</p>
                  <p className="text-xs mt-1" style={{ color: COLORS.greenDark }}>Sûr</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <p className="text-sm flex items-center gap-1" style={{ color: COLORS.textMuted }}>
              <Clock className="w-4 h-4" /> Dernière activité
            </p>
            <p className="font-bold" style={{ color: COLORS.text }}>{formatDate(baggage.lastScanDate)}</p>
            {baggage.lastScanLocation && (
              <>
                <p className="text-sm mt-2 flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                  <MapPin className="w-4 h-4" /> Dernière position connue
                </p>
                <p className="font-bold" style={{ color: COLORS.text }}>{baggage.lastScanLocation}</p>
              </>
            )}
          </div>
        </motion.div>

        {/* Carte : dernier trouveur — MISE EN ÉVIDENCE + boutons d'action */}
        {lastFinder && (lastFinder.name || lastFinder.phone) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6 mb-6 shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.greenDark} 100%)`,
              border: `3px solid ${COLORS.greenDark}`,
            }}
          >
            {/* Badge "Action requise" + titre */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-lg font-black flex items-center gap-2 text-white">
                <MessageCircle className="w-5 h-5" />
                Dernier trouveur
              </h3>
              <span
                className="text-xs font-black px-3 py-1 rounded-full text-white animate-pulse"
                style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
              >
                ● ACTION REQUISE
              </span>
            </div>

            {/* Carte infos trouveur */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              {lastFinder.name && (
                <p className="text-sm">
                  <span className="text-white/80">👤 Nom :</span>{' '}
                  <span className="font-black text-white text-base">{lastFinder.name}</span>
                </p>
              )}
              {lastFinder.phone && (
                <p className="text-sm mt-2">
                  <span className="text-white/80">📞 Téléphone :</span>{' '}
                  <a
                    href={`tel:${lastFinder.phone}`}
                    className="font-black text-white text-base underline decoration-2 underline-offset-2"
                    dir="ltr"
                  >
                    {lastFinder.phone}
                  </a>
                </p>
              )}
            </div>

            {/* Boutons d'action : WhatsApp + Téléphone */}
            {lastFinder.phone && (() => {
              // Normaliser le numéro pour wa.me (chiffres uniquement, sans +)
              const digits = lastFinder.phone.replace(/[^0-9]/g, '');
              if (!digits) return null;
              const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
                `Bonjour${lastFinder.name ? ` ${lastFinder.name}` : ''}, ` +
                `vous avez trouvé mon objet (réf. ${baggage?.reference || reference}). ` +
                `Merci beaucoup ! Pouvez-vous m'indiquer comment le récupérer ? — Message envoyé via QRTags.`
              )}`;
              return (
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wa-pulse flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-white text-sm transition hover:opacity-90 min-h-[48px]"
                    style={{ backgroundColor: '#075E54', border: '2px solid #054c46' }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Contacter le trouveur via WhatsApp
                  </a>
                  <a
                    href={`tel:${lastFinder.phone}`}
                    className="flex-1 sm:flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm transition hover:opacity-90 min-h-[48px]"
                    style={{ backgroundColor: 'white', color: COLORS.greenDark, border: '2px solid white' }}
                  >
                    <Phone className="w-5 h-5" />
                    Appeler
                  </a>
                </div>
              );
            })()}

            <p className="text-xs text-white/80 mt-3 text-center">
              💡 Cliquez sur WhatsApp ou Appeler pour convenir de la restitution.
            </p>
          </motion.div>
        )}

        {/* Carte : historique des scans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-6 mb-6 shadow-xl"
          style={{ background: COLORS.card, border: `2px solid ${COLORS.border}` }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.text }}>
            <Navigation className="w-5 h-5" style={{ color: COLORS.accent }} />
            Historique des scans
          </h3>
          {scans.length === 0 ? (
            <div className="text-center py-8">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: COLORS.bg }}
              >
                <Eye className="w-6 h-6" style={{ color: COLORS.accent }} />
              </div>
              <p className="font-bold" style={{ color: COLORS.text }}>Aucun scan pour le moment</p>
              <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>
                Si quelqu&apos;un trouve cet objet et scanne le QR code, vous verrez l&apos;activité ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan, idx) => (
                <motion.div
                  key={scan.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="p-4 rounded-xl"
                  style={{ background: COLORS.bgAlt, borderLeft: `4px solid ${COLORS.accent}` }}
                >
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <p className="text-sm font-bold flex items-center gap-1" style={{ color: COLORS.text }}>
                      <Clock className="w-3 h-3" /> {formatDate(scan.scannedAt)}
                    </p>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-bold"
                      style={{ background: COLORS.bg, color: COLORS.accentDark }}
                    >
                      Scan #{scans.length - idx}
                    </span>
                  </div>
                  {(scan.location || scan.city) && (
                    <p className="text-sm flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                      <MapPin className="w-3 h-3" /> {scan.location || scan.city}
                    </p>
                  )}
                  {scan.finderName && (
                    <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
                      Trouveur : {scan.finderName}
                      {scan.finderPhone ? ` · ${scan.finderPhone}` : ''}
                    </p>
                  )}
                  {scan.message && (
                    <p className="text-sm mt-2 italic" style={{ color: COLORS.textMuted }}>
                      &ldquo;{scan.message}&rdquo;
                    </p>
                  )}
                  {scan.latitude && scan.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline mt-2 inline-block font-bold"
                      style={{ color: COLORS.green }}
                    >
                      Voir sur Google Maps
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70" style={{ color: COLORS.textMuted }}>
            <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
          </a>
          <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>
            Propulsé par <span className="font-bold" style={{ color: COLORS.text }}>QRTags</span>
          </p>
        </div>
      </div>
    </main>
  );
}
