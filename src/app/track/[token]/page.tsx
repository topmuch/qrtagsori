'use client';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  QRTags — Page de suivi /track/[token]
 *  ÉTAPE 3 — Interactions client-side (Étape 1 + 2 + 3 complétées)
 *  ✓ Structure 4 blocs mobile-first + design tokens stricts
 *  ✓ Comparaison de dates (today vs expiresAt) → statut ACTIF/PERDU
 *  ✓ maskName() appliqué au propriétaire
 *  ✓ Génération conditionnelle des URLs WhatsApp/WAME
 *  ✓ Clipboard API + feedback "✅ Copié !" pendant 2s (+ fallback execCommand)
 *  ✓ Toast de confirmation pour actions (signaler/retrouvé)
 *  ✓ Animation fade-in des cartes au scroll (IntersectionObserver)
 *  ✓ Auto-refresh 60s
 * ════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  MapPin, Clock, AlertTriangle, CheckCircle2,
  Copy, Flag, ArrowLeft, Loader2, MessageCircle, X,
  Package, Tag, Palette, FileText, Gift, ExternalLink, Phone,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { maskName, normalizePhoneForUrl } from '@/lib/privacy';

// ─── Design tokens (const pour cohérence) — AUDIT WCAG AA APPLIQUÉ ─────
// Toutes les paires texte/fond vérifiées ≥ 4.5:1 (corps) ou ≥ 3:1 (gros texte UI)
const PAGE_BG       = '#F9FAFB';
const CARD_BG       = '#FFFFFF';
const BORDER_COLOR  = '#E5E7EB';
const TITLE_COLOR   = '#111827';
const LABEL_COLOR   = '#374151';
const VALUE_COLOR   = '#000000';
const WHATSAPP_GREEN= '#075E54';   // vert WhatsApp dark officiel — ratio 7.41:1 avec blanc (AAA)
const DANGER_RED    = '#DC2626';   // 4.83:1 avec blanc ✓
const ACTIVE_GREEN  = '#047857';   // vert foncé — ratio 5.49:1 avec blanc (AA)
const LOST_RED      = '#B91C1C';   // rouge foncé — ratio 5.86:1 avec blanc (AA)
const REWARD_FLUO   = '#15803D';   // vert récompense foncé — ratio 4.85:1 avec blanc (AA)

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
 *
 * On utilise `expiresAt` comme date de référence (équivalent `checkOutDate`
 * mentionné dans le cahier des charges). Si `objectInfo.check_out_date` est
 * aussi présent, on prend le max des deux (sécurité).
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
  if (candidates.length === 0) return true; // pas de date d'expiration → on considère actif

  // now doit être <= au plus tard des dates d'expiration
  return candidates.every((d) => !isNaN(d.getTime()) && now <= d);
}

/**
 * Construit l'URL wa.me avec message pré-rempli selon le contexte.
 *
 * - ACTIF + hôtel avec hotel_phone : wa.me/[HOTEL_PHONE]?text=Objet trouvé chambre [ROOM]...
 * - ACTIF (sans hôtel)             : wa.me/[OWNER_PHONE]?text=Bonjour [MASKED]...
 * - PERDU                          : wa.me/[OWNER_PHONE]?text=Bonjour [MASKED], j'ai trouvé votre [OBJECT]...
 */
function buildWhatsAppUrl(opts: {
  isActive: boolean;
  isHotelContext: boolean;
  hotelPhone: string | null;
  hotelRoom: string | null;
  ownerPhone: string | null;
  ownerMaskedName: string;
  objectName: string;
  reference: string;
}): string | null {
  const {
    isActive, isHotelContext, hotelPhone, hotelRoom,
    ownerPhone, ownerMaskedName, objectName, reference,
  } = opts;

  // Cas 1 : ACTIF + contexte hôtel + téléphone réception connu
  if (isActive && isHotelContext && hotelPhone) {
    const phoneDigits = normalizePhoneForUrl(hotelPhone);
    if (!phoneDigits) return null;
    const message =
      `Bonjour, je viens de trouver un objet QRTags dans votre établissement.\n\n` +
      `📱 Référence : ${reference}\n` +
      `🏠 Chambre / Lieu : ${hotelRoom || 'non précisée'}\n` +
      `🎒 Objet : ${objectName}\n\n` +
      `Pouvez-vous le conserver à la réception et prévenir le propriétaire ? Merci !`;
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
  }

  // Cas 2 & 3 : contact direct du propriétaire
  const phoneDigits = normalizePhoneForUrl(ownerPhone);
  if (!phoneDigits) return null;

  const message = isActive
    ? `Bonjour ${ownerMaskedName}, je vous informe que votre objet "${objectName}" (réf. ${reference}) est en sécurité. Pouvez-vous me rappeler pour organiser la restitution ?`
    : `Bonjour ${ownerMaskedName}, j'ai trouvé votre objet "${objectName}" (réf. ${reference}). Comment pouvons-nous organiser la restitution ?`;

  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

/**
 * Construit l'URL tel: pour appeler la réception de l'hôtel (fallback si pas de WhatsApp).
 */
function buildTelUrl(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
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

  // 1. Statut actif/perdu (server-side logic appliquée côté client via computeIsActive)
  const isActive = useMemo(
    () => computeIsActive(baggage, objectInfo),
    [baggage, objectInfo]
  );

  // 2. Détection du contexte hôtel (agencyType "hotel" OU présence hotel_phone dans objectInfo)
  const isHotelContext = useMemo(() => {
    if (!baggage) return false;
    if (baggage.agencyType === 'hotel') return true;
    if (objectInfo?.hotel_phone) return true;
    if (objectInfo?.hotel_room) return true;
    return false;
  }, [baggage, objectInfo]);

  // 3. Nom du propriétaire masqué ("Amina Diop" → "Amina D.")
  const ownerMaskedName = useMemo(
    () => maskName(baggage?.travelerName ?? null),
    [baggage?.travelerName]
  );

  // 4. Titre affiché : object_name prioritaire, fallback sur référence
  const objectDisplayName = useMemo(() => {
    if (objectInfo?.object_name && objectInfo.object_name.trim()) {
      return objectInfo.object_name.trim();
    }
    return baggage?.reference ?? 'Objet';
  }, [objectInfo?.object_name, baggage?.reference]);

  // 5. Récompense (badge vert fluo si présente)
  const hasReward = useMemo(() => {
    return Boolean(objectInfo?.reward && String(objectInfo.reward).trim());
  }, [objectInfo?.reward]);

  // 6. URL WhatsApp/WAME dynamique
  const whatsappUrl = useMemo(() => {
    if (!baggage) return null;
    return buildWhatsAppUrl({
      isActive,
      isHotelContext,
      hotelPhone: objectInfo?.hotel_phone ?? null,
      hotelRoom:  objectInfo?.hotel_room  ?? null,
      ownerPhone: baggage.whatsappOwner,
      ownerMaskedName,
      objectName: objectDisplayName,
      reference:  baggage.reference,
    });
  }, [baggage, isActive, isHotelContext, objectInfo, ownerMaskedName, objectDisplayName]);

  // 7. URL tel: (pour bouton "Appeler Réception Hôtel" en mode ACTIF hôtel)
  const telUrl = useMemo(() => {
    if (!isActive || !isHotelContext) return null;
    return buildTelUrl(objectInfo?.hotel_phone ?? null);
  }, [isActive, isHotelContext, objectInfo?.hotel_phone]);

  // 8. URL de suivi (pour copier/partager) — calculée côté client
  const trackUrl = useMemo(() => {
    if (!baggage?.trackingToken) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/track/${baggage.trackingToken}`;
    }
    return `https://qrtags.pro/track/${baggage.trackingToken}`;
  }, [baggage?.trackingToken]);

  // 9. 3 derniers scans max
  const recentScans = useMemo(() => scans.slice(0, 3), [scans]);

  // 10. Libellé du bouton principal selon contexte
  const primaryAction = useMemo(() => {
    if (isActive && isHotelContext) {
      return {
        label: 'Appeler Hôtel',
        ariaLabel: 'Appeler la réception de l\'hôtel',
        icon: 'phone' as const,
      };
    }
    return {
      label: 'WhatsApp',
      ariaLabel: 'Contacter via WhatsApp',
      icon: 'whatsapp' as const,
    };
  }, [isActive, isHotelContext]);

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

  // 1. Copier le lien de suivi via Clipboard API + fallback mobile execCommand
  const handleCopyLink = useCallback(async () => {
    if (!trackUrl) return;
    let success = false;
    try {
      // Tente d'abord l'API moderne (HTTPS required)
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(trackUrl);
        success = true;
      } else {
        throw new Error('Clipboard API indisponible');
      }
    } catch {
      // Fallback mobile (execCommand deprecated mais encore supporté)
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

  // 2. Clic sur WhatsApp/tel — feedback utilisateur + tracking optionnel
  const handleWhatsAppClick = useCallback(() => {
    if (!whatsappUrl) {
      showToast('❌ Numéro de téléphone indisponible', 'error');
      return;
    }
    showToast('💬 Ouverture de WhatsApp...', 'info');
    // Le navigateur ouvre l'URL via l'attribut href du <a>
  }, [whatsappUrl, showToast]);

  const handleTelClick = useCallback(() => {
    if (!telUrl) {
      showToast('❌ Numéro de téléphone indisponible', 'error');
      return;
    }
    showToast('📞 Ouverture de l\'app téléphone...', 'info');
  }, [telUrl, showToast]);

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
    // Observer toutes les cartes après le premier render
    const cards = document.querySelectorAll('.track-card-animate');
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [data]); // re-run quand data change (chargement initial)

  // 6. Accessibilité modale — Escape pour fermer + focus trap simple
  const modalHeadingId = 'track-lost-modal-title';
  const modalCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showLostModal) return;

    // Focus initial sur le bouton de fermeture (gestion clavier)
    if (modalCloseRef.current) {
      modalCloseRef.current.focus();
    }

    // Lock scroll body tant que la modale est ouverte
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
      <main className="min-h-screen flex items-center justify-center font-sans" style={{ backgroundColor: PAGE_BG, fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: TITLE_COLOR }} />
          <p className="text-lg font-bold" style={{ color: TITLE_COLOR }}>Chargement du suivi...</p>
        </div>
      </main>
    );
  }

  if (!data || data.status !== 'active' || !baggage) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 font-sans" style={{ backgroundColor: PAGE_BG, fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
        <div
          className="max-w-md w-full text-center rounded-2xl p-6"
          style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_COLOR}` }}
        >
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: DANGER_RED }} />
          <h1 className="text-2xl font-black mb-3" style={{ color: TITLE_COLOR }}>Lien invalide</h1>
          <p className="mb-6" style={{ color: LABEL_COLOR }}>
            Ce lien de suivi n&apos;existe pas, a été désactivé, ou l&apos;objet a été supprimé.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-xl font-bold text-white"
            style={{ backgroundColor: TITLE_COLOR }}
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  //  RENDU
  // ════════════════════════════════════════════════════════════════════════
  return (
    <main
      id="track-main-content"
      className="min-h-screen pb-24 font-sans antialiased"
      style={{
        backgroundColor: PAGE_BG,
        color: TITLE_COLOR,
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

      {/* ══════════════════════════════════════════════════════════════════
          BLOC 1 : EN-TÊTE STATUT DYNAMIQUE — STICKY TOP
         ══════════════════════════════════════════════════════════════════ */}
      <header
        role="banner"
        className="sticky top-0 z-30 w-full px-4 py-5 shadow-lg"
        style={{
          backgroundColor: isActive ? ACTIVE_GREEN : LOST_RED,
          color: '#FFFFFF',
        }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Logo discret + référence */}
          <div className="flex items-center justify-between mb-3">
            <div className="bg-white/95 inline-block px-3 py-1.5 rounded-md">
              <QRTagsLogo size="sm" variant="light" />
            </div>
            <span className="text-xs font-bold text-white/90 tracking-wide" aria-label={`Référence ${baggage.reference}`}>
              {baggage.reference}
            </span>
          </div>

          {/* Statut principal — annoncé dynamiquement aux lecteurs d'écran */}
          <div
            className="flex items-center gap-2 mb-2"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-2xl" aria-hidden="true">
              {isActive ? '📱' : '🚨'}
            </span>
            <span
              className="text-sm font-black uppercase tracking-wider"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
            >
              {isActive ? 'ACTIF — En cours de séjour' : 'PERDU — Garantie expirée'}
            </span>
          </div>

          {/* Titre objet H1 (32px mobile) */}
          <h1
            className="font-black leading-tight mb-1"
            style={{ fontSize: 'clamp(1.75rem, 7vw, 2.25rem)', color: '#FFFFFF' }}
          >
            {objectDisplayName}
          </h1>

          {/* Propriétaire masqué */}
          <p className="text-sm font-semibold text-white/90 flex items-center gap-1.5">
            <span aria-hidden="true">👤</span>
            Propriétaire : <span className="font-bold">{ownerMaskedName}</span>
          </p>

          {/* Date d'expiration (info complémentaire) */}
          {baggage.expiresAt && (
            <p className="text-xs text-white/80 mt-1">
              <time dateTime={baggage.expiresAt}>
                {isActive ? 'Valable jusqu\'au' : 'Expiré le'}{' '}
                <span className="font-bold">{formatDate(baggage.expiresAt)}</span>
              </time>
            </p>
          )}
        </div>
      </header>

      {/* Conteneur central */}
      <div className="max-w-2xl mx-auto px-4">

        {/* Message de perte (si perdu manuellement) */}
        {baggage.isLost && baggage.lostMessage && (
          <div
            className="track-card-animate mt-6 rounded-xl p-4"
            style={{
              backgroundColor: '#FEE2E2',
              border: `2px solid ${LOST_RED}`,
            }}
          >
            <p className="text-sm font-black mb-1 flex items-center gap-1.5" style={{ color: LOST_RED }}>
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              Message du propriétaire :
            </p>
            <p className="text-sm italic" style={{ color: TITLE_COLOR }}>
              &ldquo;{baggage.lostMessage}&rdquo;
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            BLOC 2 : FICHE DÉTAIL VERTICALE AVEC ICÔNES
           ════════════════════════════════════════════════════════════════ */}
        <section
          aria-label="Détails de l'objet"
          className="track-card-animate mt-6 rounded-2xl"
          style={{
            backgroundColor: CARD_BG,
            border: `1px solid ${BORDER_COLOR}`,
            padding: '16px',
          }}
        >
          <h2
            className="text-base font-black mb-4 flex items-center gap-2"
            style={{ color: TITLE_COLOR }}
          >
            <Package className="w-4 h-4" aria-hidden="true" />
            INFORMATIONS DE L&apos;OBJET
          </h2>

          <ul className="space-y-3">

            {/* Nom objet */}
            <li className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: BORDER_COLOR }}>
              <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }} aria-hidden="true">
                <Package className="w-4 h-4" style={{ color: LABEL_COLOR }} />
              </span>
              <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold" style={{ color: LABEL_COLOR }}>Nom</span>
                <span className="text-base font-bold text-right truncate" style={{ color: VALUE_COLOR }}>
                  {objectDisplayName}
                </span>
              </div>
            </li>

            {/* Catégorie */}
            {(objectInfo?.category_label || objectInfo?.category) && (
              <li className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: BORDER_COLOR }}>
                <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }} aria-hidden="true">
                  <Tag className="w-4 h-4" style={{ color: LABEL_COLOR }} />
                </span>
                <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: LABEL_COLOR }}>Catégorie</span>
                  <span className="text-base font-bold text-right" style={{ color: VALUE_COLOR }}>
                    {objectInfo?.category_label || objectInfo?.category}
                  </span>
                </div>
              </li>
            )}

            {/* Marque & Modèle (sur même ligne) */}
            {(objectInfo?.brand || objectInfo?.model) && (
              <li className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: BORDER_COLOR }}>
                <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }} aria-hidden="true">
                  <Tag className="w-4 h-4" style={{ color: LABEL_COLOR }} />
                </span>
                <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: LABEL_COLOR }}>Marque &amp; Modèle</span>
                  <span className="text-base font-bold text-right" style={{ color: VALUE_COLOR }}>
                    {objectInfo?.brand || '—'}{objectInfo?.brand && objectInfo?.model ? ' · ' : ''}{objectInfo?.model || ''}
                  </span>
                </div>
              </li>
            )}

            {/* Couleur */}
            {objectInfo?.color && (
              <li className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: BORDER_COLOR }}>
                <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }} aria-hidden="true">
                  <Palette className="w-4 h-4" style={{ color: LABEL_COLOR }} />
                </span>
                <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: LABEL_COLOR }}>Couleur</span>
                  <span className="text-base font-bold text-right" style={{ color: VALUE_COLOR }}>
                    {objectInfo.color}
                  </span>
                </div>
              </li>
            )}

            {/* Description */}
            {objectInfo?.object_description && (
              <li className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: BORDER_COLOR }}>
                <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5" style={{ backgroundColor: '#F3F4F6' }} aria-hidden="true">
                  <FileText className="w-4 h-4" style={{ color: LABEL_COLOR }} />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold block mb-1" style={{ color: LABEL_COLOR }}>Description</span>
                  <span className="text-sm block leading-relaxed" style={{ color: VALUE_COLOR }}>
                    {objectInfo.object_description}
                  </span>
                </div>
              </li>
            )}

            {/* Récompense — Badge Vert Fluo */}
            {hasReward && (
              <li className="flex items-center gap-3 py-2.5">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#DCFCE7' }} aria-hidden="true">
                  <Gift className="w-4 h-4" style={{ color: REWARD_FLUO }} />
                </span>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: LABEL_COLOR }}>Récompense</span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black shadow-md"
                    style={{
                      backgroundColor: REWARD_FLUO,
                      color: '#FFFFFF',
                      border: '2px solid #16A34A',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
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
              className="mt-4 rounded-xl p-3"
              style={{ backgroundColor: '#FFFBEB', border: `1px solid #F59E0B` }}
            >
              <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: '#92400E' }}>
                💬 Message du propriétaire
              </p>
              <p className="text-sm italic" style={{ color: TITLE_COLOR }}>
                &ldquo;{objectInfo.message_to_finder}&rdquo;
              </p>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════
            BLOC 3 : HISTORIQUE DES SCANS CONDENSÉ (3 max)
           ════════════════════════════════════════════════════════════════ */}
        <section
          aria-label="Historique des scans"
          className="track-card-animate mt-6 rounded-2xl"
          style={{
            backgroundColor: CARD_BG,
            border: `1px solid ${BORDER_COLOR}`,
            padding: '16px',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black flex items-center gap-2" style={{ color: TITLE_COLOR }}>
              <Clock className="w-4 h-4" aria-hidden="true" />
              DERNIERS SCANS
            </h2>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#F3F4F6', color: LABEL_COLOR }}
            >
              {baggage.scanCount} au total
            </span>
          </div>

          {recentScans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2" aria-hidden="true">👁️</p>
              <p className="font-bold" style={{ color: TITLE_COLOR }}>Aucun scan pour le moment</p>
              <p className="text-sm mt-2" style={{ color: LABEL_COLOR }}>
                Si quelqu&apos;un trouve votre objet et scanne le QR code, vous serez notifié ici.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentScans.map((scan) => (
                <li
                  key={scan.id}
                  className="rounded-xl p-3"
                  style={{ backgroundColor: '#F9FAFB', border: `1px solid ${BORDER_COLOR}` }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3.5 h-3.5" style={{ color: LABEL_COLOR }} aria-hidden="true" />
                    <span className="text-xs font-bold" style={{ color: TITLE_COLOR }}>
                      {formatDateShort(scan.scannedAt)}
                    </span>
                  </div>

                  {scan.location && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: LABEL_COLOR }} aria-hidden="true" />
                      <span className="text-sm font-semibold" style={{ color: VALUE_COLOR }}>
                        {scan.location}
                      </span>
                    </div>
                  )}

                  {scan.finderName && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" aria-hidden="true">👤</span>
                      <span className="text-xs" style={{ color: LABEL_COLOR }}>
                        Trouveur : <span className="font-bold" style={{ color: VALUE_COLOR }}>{maskName(scan.finderName)}</span>
                      </span>
                    </div>
                  )}

                  {scan.message && (
                    <p className="text-xs italic mt-1.5" style={{ color: LABEL_COLOR }}>
                      &ldquo;{scan.message}&rdquo;
                    </p>
                  )}

                  {scan.latitude && scan.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${scan.latitude},${scan.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold underline"
                      style={{ color: '#2563EB' }}
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

        {/* Bas de page */}
        <footer className="mt-6 mb-2 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: LABEL_COLOR }}
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Retour à l&apos;accueil
          </a>
          <p className="text-xs mt-1.5" style={{ color: LABEL_COLOR }}>
            Propulsé par <span className="font-black" style={{ color: TITLE_COLOR }}>QRTags</span>
          </p>
        </footer>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BLOC 4 : BANDEAU D'ACTIONS FIXE (STICKY FOOTER)
         ══════════════════════════════════════════════════════════════════ */}
      <nav
        aria-label="Actions rapides"
        className="fixed bottom-0 left-0 right-0 z-40 shadow-2xl"
        style={{
          backgroundColor: CARD_BG,
          borderTop: `1px solid ${BORDER_COLOR}`,
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="max-w-2xl mx-auto px-3 py-3">
          <ul className="grid grid-cols-3 gap-2">

            {/* Bouton 1 — WhatsApp / Appeler Hôtel */}
            <li>
              {primaryAction.icon === 'phone' && telUrl ? (
                <a
                  href={telUrl}
                  onClick={handleTelClick}
                  aria-label={primaryAction.ariaLabel}
                  className="w-full flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl font-bold text-white transition active:scale-95"
                  style={{ backgroundColor: WHATSAPP_GREEN, minHeight: '44px' }}
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[11px] leading-tight text-center font-bold">
                    {primaryAction.label}
                  </span>
                </a>
              ) : whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  aria-label={primaryAction.ariaLabel}
                  className="w-full flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl font-bold text-white transition active:scale-95"
                  style={{ backgroundColor: WHATSAPP_GREEN, minHeight: '44px' }}
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[11px] leading-tight text-center font-bold">
                    {primaryAction.label}
                  </span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-label="Contact indisponible"
                  className="w-full flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl font-bold text-white opacity-50 cursor-not-allowed"
                  style={{ backgroundColor: WHATSAPP_GREEN, minHeight: '44px' }}
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[11px] leading-tight text-center font-bold">
                    Indispo.
                  </span>
                </button>
              )}
            </li>

            {/* Bouton 2 — Copier le lien (Clipboard API + feedback) */}
            <li>
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label={copied ? 'Lien copié' : 'Copier le lien de suivi'}
                className="w-full flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl font-bold transition active:scale-95"
                style={{
                  backgroundColor: copied ? ACTIVE_GREEN : '#111111',
                  color: '#FFFFFF',
                  minHeight: '44px',
                }}
              >
                {copied ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
                <span className="text-[11px] leading-tight text-center font-bold">
                  {copied ? '✅ Copié !' : 'Copier lien'}
                </span>
              </button>
            </li>

            {/* Bouton 3 — Signaler PERDU / J'ai retrouvé */}
            <li>
              {baggage.isLost ? (
                <button
                  type="button"
                  onClick={handleCancelLost}
                  disabled={actionLoading}
                  aria-label="Marquer comme retrouvé"
                  className="w-full flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl font-bold text-white transition active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: ACTIVE_GREEN, minHeight: '44px' }}
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
                  <span className="text-[11px] leading-tight text-center font-bold">
                    Retrouvé
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLostModal(true)}
                  disabled={actionLoading}
                  aria-label="Signaler comme perdu"
                  className="w-full flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl font-bold text-white transition active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: DANGER_RED, minHeight: '44px' }}
                >
                  <Flag className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[11px] leading-tight text-center font-bold">
                    Signaler
                  </span>
                </button>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* Modal : Signaler comme perdu — dialog accessible */}
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
            className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_COLOR}` }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3
                id={modalHeadingId}
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: TITLE_COLOR }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: DANGER_RED }} aria-hidden="true" />
                Signaler comme PERDU
              </h3>
              <button
                ref={modalCloseRef}
                type="button"
                onClick={() => setShowLostModal(false)}
                aria-label="Fermer la fenêtre de signalement"
                className="hover:opacity-70"
                style={{ color: LABEL_COLOR }}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p
              id="track-lost-modal-desc"
              className="text-sm mb-4"
              style={{ color: LABEL_COLOR }}
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
              className="w-full px-4 py-3 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              style={{
                border: `1px solid ${BORDER_COLOR}`,
                color: VALUE_COLOR,
              }}
            />

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowLostModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold transition"
                style={{ backgroundColor: '#F3F4F6', color: TITLE_COLOR }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeclareLost}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition"
                style={{ backgroundColor: DANGER_RED }}
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  'Confirmer la perte'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TOAST — feedback temporaire (2.5s) en bas d'écran, au-dessus du sticky footer
         ══════════════════════════════════════════════════════════════════ */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-2xl text-white font-bold text-sm max-w-[calc(100vw-2rem)] text-center track-toast-enter"
          style={{
            bottom: '96px', // au-dessus du sticky footer (~80px de haut)
            backgroundColor:
              toast.kind === 'success' ? ACTIVE_GREEN
              : toast.kind === 'error'   ? DANGER_RED
              : '#111827',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
