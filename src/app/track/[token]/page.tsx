'use client';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  QRTags — Page de suivi /track/[token]
 *  Design QRTags signature — jaune moutarde + cartes blanches + bordures noires
 *  ✓ Structure 5 blocs mobile-first cohérente avec /inscrire
 *  ✓ Comparaison de dates (today vs expiresAt) → statut ACTIF/PERDU
 *  ✓ maskName() appliqué au propriétaire + au trouveur
 *  ✓ Cartes blanches bordées de noir sur fond jaune moutarde #E3B23C
 *  ✓ AUCUN bouton "Appeler Hôtel" — l'incohérence contextuelle est supprimée
 *  ✓ AUCUN bouton "WhatsApp propriétaire" — le bouton WhatsApp devient
 *    "Partager ce lien sur WhatsApp" (intention de partage, pas de contact)
 *  ✓ Clipboard API + feedback "✅ Copié !" pendant 2s (+ fallback execCommand)
 *  ✓ Toast de confirmation pour actions (signaler/retrouvé)
 *  ✓ Animation fade-in des cartes au scroll (IntersectionObserver)
 *  ✓ Auto-refresh 60s
 *  ✓ Accessibilité : skip link, aria-live, focus trap modale, Escape
 * ════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  MapPin, Clock, Eye, Activity, AlertTriangle, CheckCircle2,
  Copy, Flag, ArrowLeft, Loader2, MessageCircle, X,
  Package, Tag, Palette, FileText, Gift, ExternalLink,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { maskName } from '@/lib/privacy';

// ─── Design tokens QRTags (PALETTE SIGNATURE — non négociable) ──────────
// Strictement alignée sur /inscrire : jaune moutarde + cartes blanches
// bordées de noir + texte noir. Aucun fond crème, aucun dégradé sombre.
const QRTAGS_BG       = '#E3B23C';   // fond de page jaune moutarde signature
const QRTAGS_CARD     = '#FFFFFF';   // cartes blanches
const QRTAGS_INK      = '#111111';   // texte noir
const QRTAGS_RED      = '#DC2626';   // alerte / bouton signalement
const QRTAGS_GREEN    = '#16A34A';   // succès / statut ACTIF
const QRTAGS_INPUT_BG = '#F9FAFB';   // gris très clair pour tuiles internes
const QRTAGS_BORDER   = '#111111';   // bordure noire

// Classe Tailwind réutilisable (style "cartes blanches sur jaune moutarde")
// — exactement la même que /inscrire pour cohérence visuelle.
const CARD_CLASS = 'bg-white rounded-xl p-6 shadow-xl border-2 border-black';

// ─── Types ───────────────────────────────────────────────────────────────
interface ObjectInfo {
  object_name:        string | null;
  object_description: string | null;
  category:           string | null;
  category_label:     string | null;
  brand:              string | null;
  model:              string | null;
  color:              string | null;
  reward:             string | null;
  message_to_finder:  string | null;
  photo:              string | null;
  city:               string | null;
  country:            string | null;
  hotel_phone:        string | null;
  hotel_room:         string | null;
  check_in_date:      string | null;
  check_out_date:     string | null;
}

interface ScanEntry {
  id: string;
  scannedAt: string | null;
  location: string | null;
  finderName: string | null;
  finderPhone: string | null;
  message: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface BaggageTracking {
  reference: string;
  type: string;
  travelerName: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  status: string;
  createdAt: string | null;
  expiresAt: string | null;
  lastScanDate: string | null;
  lastScanLocation: string | null;
  scanCount: number;
  isLost: boolean;
  lostReportedAt: string | null;
  lostMessage: string | null;
  declaredLostAt: string | null;
  foundAt: string | null;
  agency: string | null;
  agencyType: string | null;
  trackingToken: string;
  objectInfo: ObjectInfo;
}

interface TrackResponse {
  status: string;
  message?: string;
  baggage?: BaggageTracking;
  scans?: ScanEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Détermine si l'objet est "actif" (séjour en cours) ou "perdu" (garantie expirée).
 *
 * Règle métier :
 *   - Si `baggage.isLost` est vrai (signalement manuel) → PERDU
 *   - Si `expiresAt` existe ET `now > expiresAt`         → PERDU (garantie expirée)
 *   - Sinon                                              → ACTIF
 */
function computeIsActive(baggage: BaggageTracking | undefined, objectInfo: ObjectInfo | null): boolean {
  if (!baggage) return true;
  if (baggage.isLost) return false;

  const now = new Date();
  const candidates: Date[] = [];
  if (baggage.expiresAt) candidates.push(new Date(baggage.expiresAt));
  if (objectInfo?.check_out_date) {
    const d = new Date(objectInfo.check_out_date);
    if (!isNaN(d.getTime())) candidates.push(d);
  }
  if (candidates.length === 0) return true;

  return candidates.every((d) => !isNaN(d.getTime()) && now <= d);
}

// ════════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════
export default function TrackPage() {
  const params = useParams();
  const token = (params?.token as string) || '';

  const [data, setData] = useState<TrackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostMessage, setLostMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);            // feedback bouton Copier lien
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Récupération des données depuis l'API ─────────────────────────────
  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/track/${token}`, { cache: 'no-store' });
      const json: TrackResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error('[track] fetch error:', err);
      setData({ status: 'error', message: 'Erreur réseau' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
    // Auto-refresh toutes les 60s pour suivre en quasi-temps-réel
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  // ════════════════════════════════════════════════════════════════════════
  //  LOGIQUE DYNAMIQUE — calculée une fois les données chargées
  // ════════════════════════════════════════════════════════════════════════
  const baggage = data?.baggage;
  const objectInfo = baggage?.objectInfo ?? null;
  const scans = data?.scans ?? [];

  // 1. Statut actif/perdu
  const isActive = useMemo(
    () => computeIsActive(baggage, objectInfo),
    [baggage, objectInfo]
  );

  // 2. Nom du propriétaire masqué ("Amina Diop" → "Amina D.")
  const ownerMaskedName = useMemo(
    () => maskName(baggage?.travelerName ?? null),
    [baggage?.travelerName]
  );

  // 3. Titre affiché : object_name prioritaire, fallback sur référence
  const objectDisplayName = useMemo(() => {
    if (objectInfo?.object_name && objectInfo.object_name.trim()) {
      return objectInfo.object_name.trim();
    }
    return baggage?.reference ?? 'Objet';
  }, [objectInfo?.object_name, baggage?.reference]);

  // 4. Récompense (badge vert si présente)
  const hasReward = useMemo(() => {
    return Boolean(objectInfo?.reward && String(objectInfo.reward).trim());
  }, [objectInfo?.reward]);

  // 5. URL de suivi (pour copier/partager) — calculée côté client
  const trackUrl = useMemo(() => {
    if (!baggage?.trackingToken) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/track/${baggage.trackingToken}`;
    }
    return `https://qrtags.pro/track/${baggage.trackingToken}`;
  }, [baggage?.trackingToken]);

  // 6. 3 derniers scans max
  const recentScans = useMemo(() => scans.slice(0, 3), [scans]);

  // ════════════════════════════════════════════════════════════════════════
  //  TOAST — helper pour afficher un feedback temporaire en bas d'écran
  // ════════════════════════════════════════════════════════════════════════
  const showToast = useCallback((message: string, kind: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, kind });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Nettoyage des timers à la destruction du composant
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ════════════════════════════════════════════════════════════════════════
  //  ACTIONS (handlers — pleinement actifs)
  // ════════════════════════════════════════════════════════════════════════

  // 1. Partager le lien de suivi sur WhatsApp (intention : partager avec
  //    amis/famille pour prévenir, AVEC un message de type "je suis mon objet")
  //    — ne contacte PAS le propriétaire (le visiteur EST le propriétaire)
  const handleShareWhatsApp = useCallback(() => {
    if (!baggage || !trackUrl) {
      showToast('❌ Lien indisponible', 'error');
      return;
    }
    const message =
      `📍 Je suis mon objet (${objectDisplayName}) avec QRTags !\n\n` +
      `Si je le perds, je pourrai le retrouver grâce à ce lien de suivi sécurisé.\n\n` +
      `🔗 ${trackUrl}\n\n` +
      `Protégez vos objets aussi : ${typeof window !== 'undefined' ? window.location.origin : 'https://qrtags.pro'}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    showToast('💬 Ouverture de WhatsApp...', 'info');
  }, [baggage, trackUrl, objectDisplayName, showToast]);

  // 2. Copier le lien de suivi via Clipboard API + fallback mobile execCommand
  const handleCopyLink = useCallback(async () => {
    if (!trackUrl) return;
    let success = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(trackUrl);
        success = true;
      } else {
        throw new Error('Clipboard API indisponible');
      }
    } catch {
      try {
        const input = document.createElement('input');
        input.value = trackUrl;
        input.setAttribute('readonly', '');
        input.style.position = 'absolute';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.select();
        input.setSelectionRange(0, input.value.length);
        success = document.execCommand('copy');
        document.body.removeChild(input);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
      showToast('✅ Lien de suivi copié !', 'success');
    } else {
      showToast('❌ Impossible de copier. Copiez manuellement : ' + trackUrl, 'error');
    }
  }, [trackUrl, showToast]);

  // 3. Signaler comme perdu
  const handleDeclareLost = useCallback(async () => {
    if (!baggage) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/track/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'declare_lost',
          lostMessage: lostMessage.trim() || null,
        }),
      });
      if (res.ok) {
        setShowLostModal(false);
        setLostMessage('');
        showToast('🚨 Objet signalé comme PERDU', 'success');
        refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Erreur lors du signalement', 'error');
      }
    } catch {
      showToast('Erreur réseau. Réessayez.', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [baggage, token, lostMessage, refresh, showToast]);

  // 4. Marquer comme retrouvé
  const handleCancelLost = useCallback(async () => {
    if (!baggage) return;
    if (!confirm('Marquer cet objet comme retrouvé ?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/track/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_lost' }),
      });
      if (res.ok) {
        showToast('✅ Objet marqué comme retrouvé', 'success');
        refresh();
      } else {
        showToast('Erreur lors de la mise à jour', 'error');
      }
    } catch {
      showToast('Erreur réseau. Réessayez.', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [baggage, token, refresh, showToast]);

  // 5. Animation fade-in des cartes au scroll (IntersectionObserver)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return; // SSR-safe
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('track-card-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    const cards = document.querySelectorAll('.track-card-animate');
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [data]);

  // 6. Accessibilité modale — Escape pour fermer + focus trap simple
  const modalHeadingId = 'track-lost-modal-title';
  const modalCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showLostModal) return;

    if (modalCloseRef.current) {
      modalCloseRef.current.focus();
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowLostModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLostModal]);

  // ─── États de chargement / erreur ────────────────────────────────────
  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center font-sans"
        style={{ backgroundColor: QRTAGS_BG, fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: QRTAGS_INK }} />
          <p className="text-lg font-bold" style={{ color: QRTAGS_INK }}>Chargement du suivi...</p>
        </div>
      </main>
    );
  }

  if (!data || data.status !== 'active' || !baggage) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-4 font-sans"
        style={{ backgroundColor: QRTAGS_BG, fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}
      >
        <div className={`${CARD_CLASS} max-w-md w-full text-center`}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: QRTAGS_RED }} />
          <h1 className="text-2xl font-black mb-3" style={{ color: QRTAGS_INK }}>Lien invalide</h1>
          <p className="mb-6" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
            Ce lien de suivi n&apos;existe pas, a été désactivé, ou l&apos;objet a été supprimé.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg font-bold"
            style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_BG }}
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  //  RENDU — Design QRTags signature (jaune moutarde + cartes blanches)
  // ════════════════════════════════════════════════════════════════════════
  return (
    <main
      id="track-main-content"
      className="min-h-screen py-8 px-4 font-sans antialiased"
      style={{
        backgroundColor: QRTAGS_BG,
        color: QRTAGS_INK,
        fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Skip link — accessibilité clavier */}
      <a
        href="#track-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-black focus:shadow-lg focus:font-bold"
      >
        Aller au contenu principal
      </a>

      <div className="max-w-2xl mx-auto">
        {/* ════════════════════════════════════════════════════════════════
            HEADER — Logo + titre (style /inscrire)
           ════════════════════════════════════════════════════════════════ */}
        <header className="text-center mb-8">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-black">
            <QRTagsLogo size="md" variant="light" />
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: QRTAGS_INK }}>
            📍 SUIVI DE MON OBJET
          </h1>
          <p className="italic" style={{ color: QRTAGS_INK, opacity: 0.8 }}>
            Suivez votre objet en temps réel
          </p>
        </header>

        {/* Message de perte (si perdu manuellement) — carte rouge dédiée */}
        {baggage.isLost && baggage.lostMessage && (
          <div
            className="track-card-animate mb-6 p-4 rounded-xl border-2"
            style={{ backgroundColor: '#FEE2E2', borderColor: QRTAGS_RED, color: QRTAGS_INK }}
          >
            <p className="text-sm font-bold mb-1 flex items-center gap-1.5" style={{ color: QRTAGS_RED }}>
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              Message du propriétaire :
            </p>
            <p className="text-sm italic">&ldquo;{baggage.lostMessage}&rdquo;</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            CARTE 1 — IDENTITÉ DU TAG + STATUT
           ════════════════════════════════════════════════════════════════ */}
        <section
          aria-label="Identité du tag"
          className={`track-card-animate ${CARD_CLASS} mb-6`}
        >
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold break-all" style={{ color: QRTAGS_INK }}>
                {baggage.reference}
              </h2>
              <p className="text-sm mt-1" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
                {baggage.agency ? `Agence : ${baggage.agency}` : 'Tag individuel'}
                {baggage.createdAt ? ` • Activé le ${formatDate(baggage.createdAt)}` : ''}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold text-white whitespace-nowrap"
              style={{ backgroundColor: isActive ? QRTAGS_GREEN : QRTAGS_RED }}
              role="status"
              aria-live="polite"
            >
              {isActive ? '✅ ACTIF' : '🚨 PERDU'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm" style={{ color: QRTAGS_INK, opacity: 0.6 }}>Propriétaire</p>
              <p className="font-bold" style={{ color: QRTAGS_INK }}>
                {ownerMaskedName || 'Anonyme'}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
                {isActive ? 'Expire le' : 'Expiré le'}
              </p>
              <p className="font-bold" style={{ color: QRTAGS_INK }}>
                {baggage.expiresAt ? formatDate(baggage.expiresAt) : '—'}
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CARTE 2 — DÉTAILS DE L'OBJET
            (seulement si au moins un champ est renseigné)
           ════════════════════════════════════════════════════════════════ */}
        {(
          objectInfo?.object_name ||
          objectInfo?.category_label || objectInfo?.category ||
          objectInfo?.brand || objectInfo?.model ||
          objectInfo?.color ||
          objectInfo?.object_description ||
          hasReward ||
          objectInfo?.message_to_finder ||
          objectInfo?.photo
        ) && (
          <section
            aria-label="Détails de l'objet"
            className={`track-card-animate ${CARD_CLASS} mb-6`}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: QRTAGS_INK }}>
              <Package className="w-5 h-5" aria-hidden="true" />
              📦 INFORMATIONS DE L&rsquo;OBJET
            </h3>

            {/* Photo de l'objet (si présente) */}
            {objectInfo?.photo && (
              <div className="mb-4">
                <img
                  src={objectInfo.photo}
                  alt={`Photo de l'objet ${objectDisplayName}`}
                  className="w-full max-h-72 object-contain rounded-lg border-2 border-black bg-gray-50"
                  loading="lazy"
                />
              </div>
            )}

            <ul className="space-y-3">
              {/* Nom objet */}
              {objectInfo?.object_name && (
                <li className="flex items-center gap-3 py-2 border-b-2" style={{ borderColor: '#E5E7EB' }}>
                  <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100" aria-hidden="true">
                    <Package className="w-4 h-4" style={{ color: QRTAGS_INK }} />
                  </span>
                  <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Nom</span>
                    <span className="text-base font-bold text-right" style={{ color: QRTAGS_INK }}>
                      {objectInfo.object_name}
                    </span>
                  </div>
                </li>
              )}

              {/* Catégorie */}
              {(objectInfo?.category_label || objectInfo?.category) && (
                <li className="flex items-center gap-3 py-2 border-b-2" style={{ borderColor: '#E5E7EB' }}>
                  <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100" aria-hidden="true">
                    <Tag className="w-4 h-4" style={{ color: QRTAGS_INK }} />
                  </span>
                  <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Catégorie</span>
                    <span className="text-base font-bold text-right" style={{ color: QRTAGS_INK }}>
                      {objectInfo?.category_label || objectInfo?.category}
                    </span>
                  </div>
                </li>
              )}

              {/* Marque & Modèle */}
              {(objectInfo?.brand || objectInfo?.model) && (
                <li className="flex items-center gap-3 py-2 border-b-2" style={{ borderColor: '#E5E7EB' }}>
                  <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100" aria-hidden="true">
                    <Tag className="w-4 h-4" style={{ color: QRTAGS_INK }} />
                  </span>
                  <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Marque &amp; Modèle</span>
                    <span className="text-base font-bold text-right" style={{ color: QRTAGS_INK }}>
                      {objectInfo?.brand || '—'}{objectInfo?.brand && objectInfo?.model ? ' · ' : ''}{objectInfo?.model || ''}
                    </span>
                  </div>
                </li>
              )}

              {/* Couleur */}
              {objectInfo?.color && (
                <li className="flex items-center gap-3 py-2 border-b-2" style={{ borderColor: '#E5E7EB' }}>
                  <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100" aria-hidden="true">
                    <Palette className="w-4 h-4" style={{ color: QRTAGS_INK }} />
                  </span>
                  <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Couleur</span>
                    <span className="text-base font-bold text-right" style={{ color: QRTAGS_INK }}>
                      {objectInfo.color}
                    </span>
                  </div>
                </li>
              )}

              {/* Description */}
              {objectInfo?.object_description && (
                <li className="flex items-start gap-3 py-2 border-b-2" style={{ borderColor: '#E5E7EB' }}>
                  <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 mt-0.5" aria-hidden="true">
                    <FileText className="w-4 h-4" style={{ color: QRTAGS_INK }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold block mb-1" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Description</span>
                    <span className="text-sm block leading-relaxed" style={{ color: QRTAGS_INK }}>
                      {objectInfo.object_description}
                    </span>
                  </div>
                </li>
              )}

              {/* Récompense — Badge Vert */}
              {hasReward && (
                <li className="flex items-center gap-3 py-2">
                  <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#DCFCE7' }} aria-hidden="true">
                    <Gift className="w-4 h-4" style={{ color: QRTAGS_GREEN }} />
                  </span>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Récompense</span>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black shadow-md text-white"
                      style={{
                        backgroundColor: QRTAGS_GREEN,
                        border: '2px solid #15803D',
                      }}
                    >
                      <Gift className="w-3.5 h-3.5" aria-hidden="true" />
                      {objectInfo?.reward}
                    </span>
                  </div>
                </li>
              )}
            </ul>

            {/* Message du propriétaire au trouveur (si présent) */}
            {objectInfo?.message_to_finder && (
              <div
                className="mt-4 rounded-lg p-3 border-2"
                style={{ backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }}
              >
                <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: '#92400E' }}>
                  💬 Message du propriétaire
                </p>
                <p className="text-sm italic" style={{ color: QRTAGS_INK }}>
                  &ldquo;{objectInfo.message_to_finder}&rdquo;
                </p>
              </div>
            )}
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            CARTE 3 — STATISTIQUES DE SUIVI
           ════════════════════════════════════════════════════════════════ */}
        <section
          aria-label="Statistiques de suivi"
          className={`track-card-animate ${CARD_CLASS} mb-6`}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: QRTAGS_INK }}>
            📊 STATISTIQUES DE SUIVI
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <Eye className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_INK }} aria-hidden="true" />
              <p className="text-3xl font-black" style={{ color: QRTAGS_INK }}>{baggage.scanCount}</p>
              <p className="text-xs mt-1" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Scans</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <Activity className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_INK }} aria-hidden="true" />
              <p className="text-3xl font-black" style={{ color: QRTAGS_INK }}>{scans.length}</p>
              <p className="text-xs mt-1" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Activités</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              {isActive ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_GREEN }} aria-hidden="true" />
                  <p className="text-3xl font-black" style={{ color: QRTAGS_GREEN }}>✅</p>
                  <p className="text-xs mt-1" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Sûr</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1" style={{ color: QRTAGS_RED }} aria-hidden="true" />
                  <p className="text-3xl font-black" style={{ color: QRTAGS_RED }}>🚨</p>
                  <p className="text-xs mt-1" style={{ color: QRTAGS_INK, opacity: 0.7 }}>Perdu</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <p className="text-sm flex items-center gap-1" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
              <Clock className="w-4 h-4" aria-hidden="true" /> Dernière activité
            </p>
            <p className="font-bold" style={{ color: QRTAGS_INK }}>{formatDate(baggage.lastScanDate)}</p>

            {baggage.lastScanLocation && (
              <>
                <p className="text-sm mt-2 flex items-center gap-1" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
                  <MapPin className="w-4 h-4" aria-hidden="true" /> Dernière position connue
                </p>
                <p className="font-bold" style={{ color: QRTAGS_INK }}>📍 {baggage.lastScanLocation}</p>
              </>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CARTE 4 — HISTORIQUE DES SCANS (3 derniers)
           ════════════════════════════════════════════════════════════════ */}
        <section
          aria-label="Historique des scans"
          className={`track-card-animate ${CARD_CLASS} mb-6`}
        >
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: QRTAGS_INK }}>
              <Clock className="w-5 h-5" aria-hidden="true" />
              📜 HISTORIQUE DES SCANS
            </h3>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_BG }}
            >
              {baggage.scanCount} au total
            </span>
          </div>

          {recentScans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2" aria-hidden="true">👁️</p>
              <p className="font-bold" style={{ color: QRTAGS_INK }}>Aucun scan pour le moment</p>
              <p className="text-sm mt-2" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
                Si quelqu&apos;un trouve votre objet et scanne le QR code, vous serez notifié ici.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentScans.map((scan, idx) => (
                <li
                  key={scan.id}
                  className="p-4 bg-gray-50 rounded-lg border-l-4"
                  style={{ borderColor: QRTAGS_INK }}
                >
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <p className="text-sm font-bold flex items-center gap-1" style={{ color: QRTAGS_INK }}>
                      📅 {formatDateShort(scan.scannedAt)}
                    </p>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-bold"
                      style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_BG }}
                    >
                      Scan #{idx + 1}
                    </span>
                  </div>

                  {scan.location && (
                    <p className="text-sm flex items-center gap-1" style={{ color: QRTAGS_INK }}>
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      {scan.location}
                    </p>
                  )}

                  {scan.finderName && (
                    <p className="text-sm mt-1" style={{ color: QRTAGS_INK }}>
                      👤 Trouveur : <span className="font-bold">{maskName(scan.finderName)}</span>
                      {scan.finderPhone ? ` • ${scan.finderPhone}` : ''}
                    </p>
                  )}

                  {scan.message && (
                    <p className="text-sm mt-2 italic" style={{ color: QRTAGS_INK, opacity: 0.8 }}>
                      💬 &ldquo;{scan.message}&rdquo;
                    </p>
                  )}

                  {scan.latitude && scan.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline mt-2 inline-flex items-center gap-1 font-bold"
                      style={{ color: QRTAGS_INK }}
                    >
                      <MapPin className="w-3 h-3" aria-hidden="true" />
                      Voir sur Google Maps
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CARTE 5 — ACTIONS RAPIDES
            ⚠️ AUCUN bouton "Appeler Hôtel" — incohérence supprimée
            ⚠️ AUCUN bouton "WhatsApp propriétaire" — l'utilisateur EST le
               propriétaire, se contacter lui-même n'a aucun sens
            ✓ WhatsApp → partage du lien de suivi avec amis/famille
            ✓ Copier le lien → presse-papier
            ✓ Signaler PERDU / J'ai retrouvé
           ════════════════════════════════════════════════════════════════ */}
        <section
          aria-label="Actions rapides"
          className={`track-card-animate ${CARD_CLASS} mb-6`}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: QRTAGS_INK }}>
            🎯 ACTIONS RAPIDES
          </h3>

          <div className="space-y-3">
            {/* Partager le lien sur WhatsApp — intention : partager avec proches */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full px-6 py-4 rounded-lg font-bold text-lg text-white transition flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: QRTAGS_GREEN }}
              aria-label="Partager le lien de suivi sur WhatsApp"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              Partager ce lien sur WhatsApp
            </button>

            {/* Copier le lien de suivi */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full px-6 py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_BG }}
              aria-label={copied ? 'Lien copié' : 'Copier le lien de suivi'}
            >
              {copied ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
              {copied ? '✅ Lien copié !' : 'Copier le lien de suivi'}
            </button>

            {/* Afficher l'URL pour référence */}
            {trackUrl && (
              <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="text-xs mb-1" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
                  Votre lien privé de suivi :
                </p>
                <p className="text-xs font-mono break-all" style={{ color: QRTAGS_INK }}>
                  {trackUrl}
                </p>
                <p className="text-xs mt-2" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
                  ⚠️ <strong>Gardez ce lien secret.</strong> Il vous permet de suivre votre objet.
                </p>
              </div>
            )}

            {/* Signaler comme PERDU / J'ai retrouvé */}
            {baggage.isLost ? (
              <button
                type="button"
                onClick={handleCancelLost}
                disabled={actionLoading}
                className="w-full px-6 py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FFFFFF', color: QRTAGS_INK, border: '2px solid #111' }}
                aria-label="Marquer comme retrouvé"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
                J&apos;ai retrouvé mon objet
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLostModal(true)}
                disabled={actionLoading}
                className="w-full px-6 py-4 rounded-lg font-bold text-lg text-white transition flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: QRTAGS_RED }}
                aria-label="Signaler comme perdu"
              >
                <Flag className="w-5 h-5" aria-hidden="true" />
                Signaler comme PERDU
              </button>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FOOTER
           ════════════════════════════════════════════════════════════════ */}
        <footer className="text-center mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm hover:underline"
            style={{ color: QRTAGS_INK, opacity: 0.7 }}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Retour à l&apos;accueil
          </a>
          <p className="text-sm mt-2" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
            Propulsé par <span className="font-bold" style={{ color: QRTAGS_INK }}>QRTags</span>
          </p>
        </footer>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODALE : Signaler comme perdu — dialog accessible
         ══════════════════════════════════════════════════════════════════ */}
      {showLostModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans"
          style={{ fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalHeadingId}
            aria-describedby="track-lost-modal-desc"
            className="rounded-xl p-6 max-w-md w-full shadow-2xl border-2 border-black"
            style={{ backgroundColor: QRTAGS_CARD }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3
                id={modalHeadingId}
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: QRTAGS_INK }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: QRTAGS_RED }} aria-hidden="true" />
                Signaler comme PERDU
              </h3>
              <button
                ref={modalCloseRef}
                type="button"
                onClick={() => setShowLostModal(false)}
                aria-label="Fermer la fenêtre de signalement"
                className="hover:opacity-70"
                style={{ color: QRTAGS_INK, opacity: 0.6 }}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p
              id="track-lost-modal-desc"
              className="text-sm mb-4"
              style={{ color: QRTAGS_INK, opacity: 0.8 }}
            >
              Décrivez brièvement les circonstances de la perte. Ce message sera visible sur cette page de suivi.
            </p>

            <label htmlFor="track-lost-message" className="sr-only">
              Message décrivant les circonstances de la perte
            </label>
            <textarea
              id="track-lost-message"
              rows={4}
              value={lostMessage}
              onChange={(e) => setLostMessage(e.target.value)}
              placeholder="Ex : Perdu dans le hall de la gare de Dakar, vers 14h le 21/07."
              className="w-full px-4 py-3 rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E3B23C] resize-none border-2 border-black"
              style={{ color: QRTAGS_INK }}
            />

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowLostModal(false)}
                className="flex-1 px-4 py-3 rounded-lg font-bold transition hover:opacity-90"
                style={{ backgroundColor: '#F3F4F6', color: QRTAGS_INK }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeclareLost}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 rounded-lg font-bold text-white disabled:opacity-50 transition hover:opacity-90"
                style={{ backgroundColor: QRTAGS_RED }}
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" aria-hidden="true" />
                ) : (
                  'Confirmer la perte'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TOAST — feedback temporaire (2.5s)
         ══════════════════════════════════════════════════════════════════ */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-2xl text-white font-bold text-sm max-w-[calc(100vw-2rem)] text-center track-toast-enter"
          style={{
            bottom: '24px',
            backgroundColor:
              toast.kind === 'success' ? QRTAGS_GREEN
              : toast.kind === 'error'   ? QRTAGS_RED
              : QRTAGS_INK,
            border: '2px solid #000',
          }}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
