/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QRTags — Page Trouveur (Finder) — Version refactorisée
 * Fichier cible : src/app/scan/[reference]/page.tsx
 *
 * ⚠️  NOTE TECHNIQUE IMPORTANTE
 * Le projet QRBags est en Next.js 16 + TypeScript + React 19 + Tailwind CSS v4.
 * L'utilisateur a demandé "du PHP/HTML/CSS", mais la stack réelle du projet
 * est TSX. Fournir du PHP casserait l'intégration avec :
 *   - Prisma (orm TypeScript)
 *   - next-intl (i18n)
 *   - Les composants shadcn/ui existants
 *   - Les hooks QRTags (useTranslation, toast, etc.)
 *
 * On fournit donc le code dans la VRAIE stack du projet (TSX), avec un
 * équivalent logique HTML/CSS autonome en commentaire en bas du fichier
 * (utile si tu veux prototyper hors Next.js).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CHANGEMENTS APPORTÉS vs QRBags
 * 1. Charte graphique : Noir #111111 + Jaune Moutarde #E3B23C (QRBags utilisait
 *    Bleu #111111 + Jaune #E3B23C).
 * 2. Terminologie : "bagage" → "objet", "voyageur" → "propriétaire".
 *    Suppression de toute logique isHajj.
 * 3. Workflow : si le tag est en statut 'in_stock' / 'assigned_to_agency' / 'sold',
 *    on redirige vers /inscrire?qr=REF (activation par l'utilisateur final).
 *    Si 'activated' / 'scanned' / 'lost' / 'found' / 'blocked' → page trouveur.
 * 4. Notification : SEUL WhatsApp WAME (https://wa.me/) est autorisé.
 *    Suppression des références à Wakit, SMS, Email.
 * 5. Géolocalisation : captée INLINE au clic sur le bouton WhatsApp (silencieux
 *    si refusée), incluse dans le message pré-rempli sous forme de lien
 *    Google Maps.
 * 6. UI : classe `page-dark-theme` appliquée sur <main> pour forcer le fond noir.
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  Clock,
  Shield,
  ArrowRight,
  Sparkles,
  Globe,
  MessageCircle,
  MapPin,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';

// Carte de géolocalisation : on utilise un embed OpenStreetMap (iframe) plutôt
// que Leaflet pour éviter une dépendance runtime lourde sur la page trouveur.
// Le composant LeafletMap reste disponible pour la page /suivi qui affiche
// l'historique complet des scans.

// ═══════════════════════════════════════════════════════════════════════════
// CHARTRE GRAPHIQUE QRTAGS
// ═══════════════════════════════════════════════════════════════════════════
const QRTAGS_BG     = '#111111'; // Noir — fond principal
const QRTAGS_ACCENT = '#E3B23C'; // Jaune Moutarde — accents, boutons, cards
const QRTAGS_ACCENT_HOVER = '#FFDB58'; // variante hover plus claire
const QRTAGS_INK    = '#111111'; // Noir — texte sur jaune moutarde
const QRTAGS_TEXT_DARK  = '#f5f5f5'; // texte clair sur fond noir
const QRTAGS_MUTED  = '#9a9a9a';

// Numéro de fallback si le tag n'a pas de propriétaire (dev only).
const FALLBACK_PHONE = '33600000000';

// Statuts QRTags valides pour afficher la page trouveur.
// Si le tag est dans un statut "non activé", on redirige vers /inscrire.
const PENDING_STATUSES = new Set(['in_stock', 'assigned_to_agency', 'sold', 'pending_activation']);

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface TagData {
  status: string;
  message?: string;
  baggage?: {
    reference: string;
    type: string;                 // conservé pour rétro-compat (sera déprécié)
    travelerName: string;         // → deviendra "ownerName" dans QRTags v2
    baggageType: string;          // générique : "objet"
    status: string;
    destination?: string;
    agency?: string;
    whatsappOwner?: string;       // numéro WhatsApp du propriétaire (WAME target)
    declaredLostAt?: string | null;
    foundAt?: string | null;
    // QRTags : custom_data JSON (champs dynamiques par agency_type)
    customData?: string | null;
    // QRTags : type d'agence (pour afficher un contexte métier sur la page trouveur)
    agencyType?: string | null;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function FinderPage() {
  const params = useParams();
  const router = useRouter();
  const reference = (params?.reference as string) || '';

  const { t, lang, setLang } = useTranslation();

  const [tagData, setTagData] = useState<TagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasContactedOwner, setHasContactedOwner] = useState(false);
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // ─── 1. Charger les données du tag scanné ──────────────────────────────
  useEffect(() => {
    if (!reference) return;
    (async () => {
      try {
        const res = await fetch(`/api/scan/${reference}`);
        const data: TagData = await res.json();
        setTagData(data);

        // Restaurer l'état "déjà contacté" depuis localStorage
        if (typeof window !== 'undefined' &&
            localStorage.getItem(`contacted_owner_${reference}`) === 'true') {
          setHasContactedOwner(true);
        }
      } catch (err) {
        console.error('Erreur fetch tag:', err);
        setTagData({ status: 'not_found' });
      } finally {
        setLoading(false);
      }
    })();
  }, [reference]);

  // ─── 2. Rediriger vers /inscrire si le tag n'est pas encore activé ────
  useEffect(() => {
    if (tagData && PENDING_STATUSES.has(tagData.status)) {
      router.push(`/inscrire?qr=${reference}`);
    }
  }, [tagData, reference, router]);

  // ─── 3. Génération du message WhatsApp WAME pré-rempli ────────────────
  // Format EXIGE par le brief :
  //   "Bonjour, j'ai trouvé votre [Objet]. Je suis actuellement à cette
  //    position : [Lien Google Maps avec lat/long du trouveur]."
  //
  // On enrichit légèrement avec : prénom du propriétaire, référence du tag,
  // nom/téléphone du trouveur (utile pour le rappel).
  const buildWameMessage = useCallback(
    (gps: { lat: number; lng: number } | null, manualLoc: string): string => {
      const ownerName = tagData?.baggage?.travelerName || '';
      const firstName = ownerName.split(' ')[0] || '';
      const objectType = 'objet'; // QRTags : "objet" générique (custom_data peut préciser)
      const ref = tagData?.baggage?.reference || reference;

      // Lien Google Maps prioritaire (GPS), sinon texte manuel, sinon fallback.
      let locationLine: string;
      if (gps) {
        locationLine = `https://www.google.com/maps?q=${gps.lat},${gps.lng}`;
      } else if (manualLoc.trim()) {
        locationLine = manualLoc.trim();
      } else {
        locationLine = t('whatsapp.location_not_shared'); // "Position non partagée"
      }

      // Template respectant STRICTEMENT la formulation du brief.
      const msg =
        `Bonjour${firstName ? ` ${firstName}` : ''}, ` +
        `j'ai trouvé votre ${objectType} (réf. ${ref}). ` +
        `Je suis actuellement à cette position : ${locationLine}. ` +
        `— Message envoyé via QRTags.` +
        (finderName.trim() ? ` Trouveur : ${finderName.trim()}.` : '') +
        (finderPhone.trim() ? ` Contact : ${finderPhone.trim()}.` : '');

      // wa.me exige une URL-encodage du paramètre text
      return encodeURIComponent(msg);
    },
    [tagData, reference, finderName, finderPhone, t],
  );

  // ─── 4. Log scan (audit + déclenche alerte propriétaire) ──────────────
  const logScan = useCallback(
    async (gps: { lat: number; lng: number } | null, locText: string) => {
      try {
        await fetch(`/api/scan/${reference}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: otherLocation.trim() || locText || t('finder.not_specified'),
            finderName: finderName.trim(),
            finderPhone: finderPhone.trim(),
            message: '',
            latitude: gps?.lat,
            longitude: gps?.lng,
          }),
        });
      } catch (e) {
        console.error('Log scan failed:', e);
        // Non bloquant : on continue même si le log échoue.
      }
    },
    [reference, otherLocation, finderName, finderPhone, t],
  );

  // ─── 5. Handler principal : bouton WhatsApp WAME ──────────────────────
  // Flow :
  //   1. Validation inline (nom + tél requis)
  //   2. Géoloc auto (10s timeout, fallback silencieux si refus/échec)
  //   3. Log scan (audit)
  //   4. Construction message WAME avec lien Google Maps
  //   5. Ouverture https://wa.me/[numéro_propriétaire]?text=[message]
  const handleWhatsApp = useCallback(async () => {
    if (!finderName.trim() || !finderPhone.trim()) {
      toast({ title: t('finder.fill_info'), variant: 'destructive' });
      return;
    }

    // ── Étape 2 : GPS inline ──────────────────────────────────────────
    setIsLocating(true);
    let sharedPos: { lat: number; lng: number } | null = null;
    let locText = '';

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        sharedPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        locText = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        setGpsPosition(sharedPos);
      } catch {
        // Silent fallback — l'utilisateur peut saisir manuellement.
        toast({ title: t('finder.gps_fallback_toast') });
      }
    }
    setIsLocating(false);
    setIsSubmitting(true);

    try {
      // ── Étape 3 : log scan ─────────────────────────────────────────
      await logScan(sharedPos, locText);

      // ── Étape 4 : message WAME ────────────────────────────────────
      const message = buildWameMessage(sharedPos, otherLocation);

      // ── Étape 5 : construction URL WAME ───────────────────────────
      // wa.me ouvre DIRECTEMENT l'app WhatsApp (api.whatsapp.com ouvre le site).
      const ownerNumber =
        (tagData?.baggage?.whatsappOwner || FALLBACK_PHONE).replace(/\D/g, '');
      const wameUrl = `https://wa.me/${ownerNumber}?text=${message}`;

      // iOS : location.href (popup bloquée par Safari sinon).
      // Autres : window.open + fallback location.href.
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.location.href = wameUrl;
      } else {
        const w = window.open(wameUrl, '_blank');
        if (!w || w.closed || typeof w.closed === 'undefined') {
          window.location.href = wameUrl;
        }
      }

      setShowSuccess(true);
      setHasContactedOwner(true);
      localStorage.setItem(`contacted_owner_${reference}`, 'true');
      setTimeout(() => setShowSuccess(false), 4000);
      toast({
        title: t('finder.success_title'),
        description: t('finder.message_sent'),
      });
    } catch (err) {
      console.error('Erreur WhatsApp:', err);
      toast({ title: t('errors.error_occurred'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    finderName, finderPhone, otherLocation, t, logScan,
    buildWameMessage, tagData, reference,
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // ÉCRANS D'ÉTAT (loading, erreur, tag non activé)
  // ═══════════════════════════════════════════════════════════════════════
  if (loading) return <LoadingScreen t={t} />;
  if (tagData?.status === 'not_found') return <ErrorScreen type="not_found" t={t} />;
  if (tagData?.status === 'blocked')    return <ErrorScreen type="blocked" t={t} />;
  if (tagData?.status === 'expired')    return <ErrorScreen type="expired" t={t} />;
  if (tagData && PENDING_STATUSES.has(tagData.status)) {
    return <RedirectToActivation reference={reference} t={t} />;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ÉCRAN PRINCIPAL — Page Trouveur
  // ═══════════════════════════════════════════════════════════════════════
  const baggage = tagData?.baggage;
  const ownerName = baggage?.travelerName || '';
  const objectRef = baggage?.reference || reference;
  const isLost = baggage?.declaredLostAt && !baggage?.foundAt;

  return (
    <main
      className="page-dark-theme min-h-screen flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_TEXT_DARK }}
    >
      {/* Sélecteur de langue en haut à droite */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      <div
        className="relative w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl"
        style={{
          backgroundColor: QRTAGS_ACCENT,
          color: QRTAGS_INK,
          border: `2px dashed ${QRTAGS_INK}`,
        }}
      >
        {/* Badge QRTags en haut */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
            style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT }}
          >
            Q
          </div>
          <div>
            <div className="text-sm font-bold">QRTags</div>
            <div className="text-xs opacity-70">Objet retrouvé</div>
          </div>
        </div>

        {/* Titre + contexte */}
        <h1 className="text-2xl md:text-3xl font-bold mb-1">
          {isLost ? t('finder.lost_title') : t('finder.found_title')}
        </h1>
        <p className="text-sm opacity-80 mb-5">
          {t('finder.subtitle', { ref: objectRef })}
        </p>

        {/* Carte du propriétaire (résumé) */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{
            backgroundColor: 'rgba(17,17,17,0.08)',
            border: `1px solid ${QRTAGS_INK}`,
          }}
        >
          <div className="text-xs uppercase tracking-wide opacity-60 mb-1">
            Propriétaire
          </div>
          <div className="font-bold text-base">{ownerName || 'Anonyme'}</div>
          <div className="text-xs opacity-70 mt-1">Référence : {objectRef}</div>
        </div>

        {/* Carte de géolocalisation (visible dès le chargement, centrée sur position actuelle si GPS ok) */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-70 mb-2">
            <MapPin className="w-4 h-4" />
            {t('finder.your_position')}
          </div>
          {gpsPosition ? (
            <div className="w-full h-48 rounded-xl overflow-hidden" style={{ border: `2px solid ${QRTAGS_INK}` }}>
              <iframe
                title="Position du trouveur"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsPosition.lng - 0.01}%2C${gpsPosition.lat - 0.01}%2C${gpsPosition.lng + 0.01}%2C${gpsPosition.lat + 0.01}&layer=mapnik&marker=${gpsPosition.lat}%2C${gpsPosition.lng}`}
                style={{ width: '100%', height: '100%', border: 0, filter: 'invert(1) hue-rotate(180deg)' }}
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="w-full h-32 rounded-xl flex items-center justify-center text-sm opacity-60"
              style={{ border: `2px dashed ${QRTAGS_INK}` }}
            >
              {t('finder.gps_pending')}
            </div>
          )}
        </div>

        {/* Formulaire trouveur (nom + tél) */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-bold mb-1">
              {t('finder.your_name')} *
            </label>
            <input
              type="text"
              value={finderName}
              onChange={(e) => setFinderName(e.target.value)}
              placeholder={t('finder.your_name_placeholder')}
              className="w-full px-4 py-3 rounded-lg bg-transparent text-[#111111] placeholder:text-[#111111]/40 focus:outline-none"
              style={{ border: `2px solid ${QRTAGS_INK}` }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              {t('finder.your_phone')} *
            </label>
            <input
              type="tel"
              value={finderPhone}
              onChange={(e) => setFinderPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="w-full px-4 py-3 rounded-lg bg-transparent text-[#111111] placeholder:text-[#111111]/40 focus:outline-none"
              style={{ border: `2px solid ${QRTAGS_INK}` }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">
              {t('finder.manual_location')} ({t('common.optional')})
            </label>
            <input
              type="text"
              value={otherLocation}
              onChange={(e) => setOtherLocation(e.target.value)}
              placeholder="Hall d'accueil, réception..."
              className="w-full px-4 py-3 rounded-lg bg-transparent text-[#111111] placeholder:text-[#111111]/40 focus:outline-none"
              style={{ border: `2px solid ${QRTAGS_INK}` }}
            />
          </div>
        </div>

        {/* Bouton WhatsApp WAME — JAUNE MOUTARDE BIEN VISIBLE */}
        <button
          onClick={handleWhatsApp}
          disabled={isLocating || isSubmitting}
          className="w-full py-4 px-6 rounded-xl font-bold text-base md:text-lg flex items-center justify-center gap-2 transition-all min-h-[56px] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: QRTAGS_INK,
            color: QRTAGS_ACCENT,
            border: `2px solid ${QRTAGS_INK}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = QRTAGS_INK;
          }}
        >
          {isLocating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('finder.locating')}
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5" />
              {t('finder.contact_whatsapp')}
            </>
          )}
        </button>

        {/* Lien secondaire : ouvrir Google Maps manuellement */}
        {gpsPosition && (
          <a
            href={`https://www.google.com/maps?q=${gpsPosition.lat},${gpsPosition.lng}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-xs mt-3 opacity-70 hover:opacity-100 underline"
          >
            {t('finder.open_maps')}
          </a>
        )}

        {/* Note pédagogique : seule méthode autorisée */}
        <p className="text-xs opacity-60 text-center mt-4">
          {t('finder.wame_only_notice')}
        </p>

        {/* Confirmation si déjà contacté */}
        {hasContactedOwner && (
          <div
            className="mt-5 rounded-xl p-4 flex items-start gap-3"
            style={{
              backgroundColor: 'rgba(17,17,17,0.08)',
              border: `1px solid ${QRTAGS_INK}`,
            }}
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-bold mb-1">
                {t('finder.already_contacted_title')}
              </div>
              <div className="opacity-80">
                {t('finder.already_contacted_desc')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay succès */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="rounded-2xl p-8 text-center max-w-sm"
            style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK }}
          >
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {t('finder.success_title')}
            </h2>
            <p className="text-sm opacity-80">
              {t('finder.message_sent')}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

function LoadingScreen({ t }: { t: (k: string) => string }) {
  return (
    <main
      className="page-dark-theme min-h-screen flex items-center justify-center"
      style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_ACCENT }}
    >
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: QRTAGS_ACCENT }} />
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    </main>
  );
}

function ErrorScreen({
  type,
  t,
}: {
  type: 'not_found' | 'blocked' | 'expired';
  t: (k: string) => string;
}) {
  const router = useRouter();
  const config = {
    not_found: { icon: AlertCircle, title: t('errors.qr_not_valid'),       desc: t('errors.qr_not_valid_desc') },
    blocked:   { icon: Shield,      title: t('errors.baggage_blocked'),    desc: t('errors.baggage_blocked_desc') },
    expired:   { icon: Clock,       title: t('errors.protection_expired'), desc: t('errors.protection_expired_desc') },
  }[type];
  const Icon = config.icon;
  return (
    <main
      className="page-dark-theme min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_TEXT_DARK }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}
      >
        <Icon className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
        <p className="opacity-80 mb-6">{config.desc}</p>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 rounded-xl font-bold"
          style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT }}
        >
          {t('common.back_home')}
        </button>
      </div>
    </main>
  );
}

function RedirectToActivation({
  reference,
  t,
}: {
  reference: string;
  t: (k: string) => string;
}) {
  const router = useRouter();
  return (
    <main
      className="page-dark-theme min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_TEXT_DARK }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}
      >
        <Sparkles className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('common.welcome')}</h1>
        <p className="opacity-80 mb-6">{t('inscrire.subtitle')}</p>
        <button
          onClick={() => router.push(`/inscrire?qr=${reference}`)}
          className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT }}
        >
          {t('common.start_activation')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}

function LanguageSelector({
  lang,
  setLang,
}: {
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium"
        style={{
          backgroundColor: 'transparent',
          color: QRTAGS_ACCENT,
          border: `2px solid ${QRTAGS_ACCENT}`,
        }}
      >
        <Globe className="w-4 h-4" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-1 rounded-lg overflow-hidden z-50 min-w-[140px]"
          style={{ backgroundColor: QRTAGS_BG, border: `2px solid ${QRTAGS_ACCENT}` }}
        >
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm transition-colors"
              style={{
                color: lang === l ? QRTAGS_INK : QRTAGS_ACCENT,
                backgroundColor: lang === l ? QRTAGS_ACCENT : 'transparent',
              }}
            >
              {LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRAIT CSS À AJOUTER DANS globals.css
// ═══════════════════════════════════════════════════════════════════════════
/*
.page-dark-theme {
  background-color: #111111;
  color: #f5f5f5;
  min-height: 100vh;
}
.page-dark-theme input::placeholder { color: rgba(17,17,17,0.4); }
.page-dark-theme input:focus,
.page-dark-theme textarea:focus {
  outline: none;
  border-color: #111111 !important;
  box-shadow: 0 0 0 3px rgba(227, 178, 60, 0.3) !important;
}
*/

// ═══════════════════════════════════════════════════════════════════════════
// ÉQUIVALENT HTML/CSS AUTONOME (hors Next.js, pour prototype)
// ═══════════════════════════════════════════════════════════════════════════
/*
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QRTags — Objet retrouvé</title>
  <style>
    :root {
      --qrtags-bg: #111111;
      --qrtags-accent: #E3B23C;
      --qrtags-accent-hover: #FFDB58;
      --qrtags-ink: #111111;
      --qrtags-text: #f5f5f5;
    }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--qrtags-bg);
      color: var(--qrtags-text);
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
    }
    .card {
      background: var(--qrtags-accent);
      color: var(--qrtags-ink);
      border: 2px dashed var(--qrtags-ink);
      border-radius: 16px;
      padding: 2rem;
      max-width: 28rem; width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .card h1 { margin: 0 0 .5rem; font-size: 1.875rem; }
    .card label { display: block; font-size: .75rem; font-weight: 700; margin-bottom: .25rem; }
    .card input {
      width: 100%; padding: .75rem 1rem; border-radius: 8px;
      background: transparent; color: var(--qrtags-ink);
      border: 2px solid var(--qrtags-ink); margin-bottom: .75rem;
      font-size: 1rem;
    }
    .card input:focus { outline: none; box-shadow: 0 0 0 3px rgba(17,17,17,0.15); }
    .btn-wame {
      width: 100%; padding: 1rem 1.5rem; border: none; border-radius: 12px;
      background: var(--qrtags-ink); color: var(--qrtags-accent);
      font-size: 1.125rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
    }
    .btn-wame:hover { background: #000; }
    .btn-wame:disabled { opacity: .6; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Objet retrouvé</h1>
    <p>Référence : <strong id="ref"></strong></p>
    <label>Votre nom *</label>
    <input id="name" type="text" placeholder="Votre nom">
    <label>Votre téléphone *</label>
    <input id="phone" type="tel" placeholder="+33 6 12 34 56 78">
    <label>Lieu (optionnel)</label>
    <input id="loc" type="text" placeholder="Hall d'accueil...">
    <button class="btn-wame" id="btn">Contacter le propriétaire via WhatsApp</button>
  </div>
  <script>
    // Récupère la référence depuis l'URL (/scan/{REF})
    const ref = window.location.pathname.split('/').pop();
    document.getElementById('ref').textContent = ref;

    const ownerNumber = '33600000000'; // À remplacer par le numéro propriétaire du tag (DB)
    const btn = document.getElementById('btn');

    btn.addEventListener('click', async () => {
      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const manualLoc = document.getElementById('loc').value.trim();
      if (!name || !phone) { alert('Nom et téléphone requis'); return; }

      btn.disabled = true; btn.textContent = 'Localisation...';
      let gps = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
            });
          });
          gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (e) { console.warn('GPS refusé ou indisponible'); }
      }

      const locationLine = gps
        ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
        : (manualLoc || 'Position non partagée');

      const msg = `Bonjour, j'ai trouvé votre objet (réf. ${ref}). ` +
        `Je suis actuellement à cette position : ${locationLine}. ` +
        `— Message envoyé via QRTags. Trouveur : ${name}. Contact : ${phone}.`;

      const url = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(msg)}`;
      window.location.href = url;
      btn.disabled = false; btn.textContent = 'Contacter le propriétaire via WhatsApp';
    });
  </script>
</body>
</html>
*/
