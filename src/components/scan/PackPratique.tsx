'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  MapPin, Loader2, CheckCircle2, ArrowLeft,
  Package, User, Phone, Clock,
  ExternalLink, MessagesSquare,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import PhoneInput from '@/components/ui/PhoneInput';
import FinderChat from '@/components/scan/FinderChat';
import { getDialCode, normalizePhone } from '@/lib/phone';

// ─── Design tokens QRTags (fond jaune moutarde + cartes blanches) ───
const QRTAGS_BG       = '#E3B23C';
const QRTAGS_INK      = '#111111';
const QRTAGS_RED      = '#DC2626';
const QRTAGS_GREEN    = '#16A34A';
const CARD_CLASS      = 'bg-white rounded-xl p-6 shadow-xl border-2 border-black';
const INPUT_CLASS     =
  'w-full min-h-[48px] px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C] transition text-base';

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
  photo?: string | null;
}

interface BaggageData {
  reference: string;
  type: string;
  travelerName: string;
  travelerFirstName?: string | null;
  status: string;
  agency?: string | null;
  whatsappOwner?: string | null;
  declaredLostAt?: string | null;
  foundAt?: string | null;
  createdAt?: string | null;
  isLost?: boolean;
  objectInfo?: ObjectInfo | null;
}

// ─── Icônes par catégorie d'objet (emoji pour universalité) ───
const CATEGORY_ICONS: Record<string, string> = {
  electronics:    '📱',
  phone:          '📱',
  laptop:         '💻',
  computer:       '💻',
  tablet:         '📱',
  travel:         '🧳',
  luggage:        '🧳',
  suitcase:       '🧳',
  bag:            '🎒',
  backpack:       '🎒',
  handbag:        '👜',
  documents:      '📄',
  passport:       '📄',
  id:             '🪪',
  wallet:         '👛',
  keys:           '🔑',
  keychain:       '🔑',
  glasses:        '👓',
  sunglasses:     '🕶️',
  watch:          '⌚',
  jewelry:        '💍',
  clothing:       '👕',
  jacket:         '🧥',
  coat:           '🧥',
  bicycle:        '🚲',
  vehicle:        '🚗',
  car:            '🚗',
  motorcycle:     '🏍️',
  pet:            '🐾',
  musical:        '🎸',
  instrument:     '🎸',
  camera:         '📷',
  sport:          '⚽',
  baby:           '🧸',
  kids:           '🧸',
  toys:           '🧸',
  medical:        '💊',
  medication:     '💊',
  tools:          '🔧',
  other:          '📦',
  general:        '📦',
};

function getCategoryIcon(category?: string | null): string {
  if (!category) return '📦';
  const key = category.toLowerCase().trim();
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return '📦';
}

// ─── Hook : détection du pays + de la ville via IP (pour la ligne « 📍 Position ») ───
function useDetectedLocation(): {
  countryCode: string;
  city: string | null;
  countryName: string | null;
  ipLat: number | null;
  ipLng: number | null;
  isLoading: boolean;
} {
  const [countryCode, setCountryCode] = useState('FR');
  const [city, setCity] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [ipLat, setIpLat] = useState<number | null>(null);
  const [ipLng, setIpLng] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/detect-country', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json() as {
            countryCode?: string; country?: string; city?: string | null;
            latitude?: number | null; longitude?: number | null;
          };
          if (!cancelled) {
            if (data?.countryCode) setCountryCode(String(data.countryCode).toUpperCase());
            setCity(data?.city ?? null);
            setCountryName(data?.country ?? null);
            setIpLat(typeof data?.latitude === 'number' ? data.latitude : null);
            setIpLng(typeof data?.longitude === 'number' ? data.longitude : null);
          }
        }
      } catch {
        // Silent fallback to FR
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { countryCode, city, countryName, ipLat, ipLng, isLoading };
}

// ─── Géolocalisation GPS silencieuse (appelée au clic WhatsApp, jamais affichée) ───
function captureGpsSilently(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), 8000);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve(null); // refus ou erreur → on continue sans GPS (l'IP est enregistrée côté serveur)
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
    );
  });
}

// ─── Reverse-geocoding client (BigDataCloud, gratuit, sans clé) → « Ville, Pays » précis ───
async function reverseGeocode(lat: number, lng: number): Promise<{ city: string | null; country: string | null } | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=fr`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return { city: d.city || d.locality || null, country: d.countryName || null };
  } catch {
    return null;
  }
}

interface PackPratiqueProps {
  reference: string;
  baggage: BaggageData;
}

export default function PackPratique({ reference, baggage }: PackPratiqueProps) {
  const { countryCode, city, countryName, ipLat, ipLng, isLoading: countryLoading } = useDetectedLocation();

  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('FR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLabel, setGpsLabel] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const openChat = useCallback(() => {
    setChatOpen(true);
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }, []);

  // Sync la country détectée par IP vers le PhoneInput
  useEffect(() => {
    if (!countryLoading && countryCode) {
      setPhoneCountry(countryCode);
    }
  }, [countryCode, countryLoading]);

  // ─── Détection GPS silencieuse DÈS L'ARRIVÉE sur la page (aucune carte affichée) ───
  useEffect(() => {
    let cancelled = false;
    captureGpsSilently().then((c) => {
      if (!cancelled && c) setGpsCoords(c);
    });
    return () => { cancelled = true; };
  }, []);

  // ─── Reverse-geocoding du GPS → libellé « Ville, Pays » précis (fallback : IP) ───
  useEffect(() => {
    if (!gpsCoords) return;
    let cancelled = false;
    reverseGeocode(gpsCoords.lat, gpsCoords.lng).then((r) => {
      if (!cancelled && r) {
        const label = [r.city, r.country].filter(Boolean).join(', ');
        if (label) setGpsLabel(label);
      }
    });
    return () => { cancelled = true; };
  }, [gpsCoords]);

  // ─── Derived values ───
  const objInfo = baggage?.objectInfo || null;
  const ownerFirstName = baggage?.travelerFirstName || '';
  const objectRef = baggage?.reference || reference;
  const isLost = baggage?.isLost || (baggage?.declaredLostAt && !baggage?.foundAt);

  const phoneLocalDigits = useMemo(() => {
    const dialDigits = getDialCode(phoneCountry).replace('+', '');
    const digits = finderPhone.replace(/\D/g, '');
    if (digits.startsWith(dialDigits)) return digits.slice(dialDigits.length);
    return digits;
  }, [finderPhone, phoneCountry]);
  const isPhoneValid = phoneLocalDigits.length >= 6 && phoneLocalDigits.length <= 15;

  const categoryIcon = getCategoryIcon(objInfo?.category);
  const hasReward = Boolean(objInfo?.reward && String(objInfo.reward).trim());

  // Position : GPS précis si accordé, sinon IP — libellé « Ville, Pays »
  const positionLabel = useMemo(
    () => gpsLabel || [city, countryName].filter(Boolean).join(', ') || null,
    [gpsLabel, city, countryName]
  );
  const mapsUrl = useMemo(() => {
    if (gpsCoords) {
      return `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`;
    }
    if (ipLat != null && ipLng != null) {
      return `https://www.google.com/maps?q=${ipLat},${ipLng}`;
    }
    if (positionLabel) {
      return `https://www.google.com/maps?q=${encodeURIComponent(positionLabel)}`;
    }
    return null;
  }, [gpsCoords, ipLat, ipLng, positionLabel]);

  // ─── Submit → géoloc silencieuse → POST scan → redirection WhatsApp AUTOMATIQUE ───
  const handleSubmit = useCallback(async () => {
    if (!finderName.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }
    const normalized = normalizePhone(finderPhone, phoneCountry);
    if (normalized.length < 8) {
      alert('Veuillez entrer un numéro de téléphone valide');
      return;
    }
    setIsSubmitting(true);
    try {
      // GPS capturé en silence : déjà pris au chargement si accordé, sinon on retente ici
      const coords = gpsCoords ?? (await captureGpsSilently());
      if (coords && !gpsCoords) setGpsCoords(coords);

      const res = await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: positionLabel || '',
          finderName: finderName.trim(),
          finderPhone: `+${normalized}`,
          message: null,
          latitude: coords?.lat,
          longitude: coords?.lng,
        }),
      });

      const data = await res.json();
      const whatsappUrl = (data.whatsappUrl as string) || null;
      localStorage.setItem(`contacted_owner_${reference}`, 'true');

      // Aucun message intermédiaire : ouverture immédiate de WhatsApp (évite le blocage popup)
      if (whatsappUrl) {
        const win = window.open(whatsappUrl, '_blank');
        if (!win) {
          // Popup bloquée → navigation directe dans l'onglet courant (jamais bloquée)
          window.location.href = whatsappUrl;
          return;
        }
      }
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la notification');
      setIsSubmitting(false);
    }
  }, [finderName, finderPhone, phoneCountry, gpsCoords, positionLabel, reference]);

  return (
    <main className="min-h-screen py-8 px-4 pb-32 md:pb-8" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}>
      <div className="max-w-2xl mx-auto">
        {/* ─── Header : logo QRTags + titre + référence ─── */}
        <div className="text-center mb-6">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-black">
            <QRTagsLogo size="md" variant="light" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-black mb-2">
            {isLost ? 'OBJET PERDU' : 'OBJET RETROUVÉ'}
          </h1>
          <p className="text-black/80">
            Réf : <span className="font-bold text-black">{objectRef}</span>
          </p>
        </div>

        {/* ─── Récompense compacte ─── */}
        {hasReward && (
          <div
            className="relative overflow-hidden mb-5 rounded-2xl text-center border-2 border-black shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}
          >
            <div className="px-5 py-3">
              <p className="text-white font-black text-lg md:text-xl leading-tight drop-shadow">
                💰 RÉCOMPENSE : {objInfo!.reward}
              </p>
              <p className="text-white/95 text-xs font-bold mt-0.5">
                (À vous si vous rendez l&apos;objet)
              </p>
            </div>
          </div>
        )}

        {/* ─── Carte unique : objet + position ─── */}
        <div className={`${CARD_CLASS} mb-6`}>
          {/* Nom de l'objet (+ marque/modèle) */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg p-4 border-2 border-black mb-4">
            <div className="flex items-center gap-4">
              <div
                className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md"
                style={{ backgroundColor: 'white', border: '2px solid #111' }}
              >
                {categoryIcon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-black font-black text-lg md:text-xl leading-tight">
                  {objInfo?.object_name || 'Objet non spécifié'}
                </p>
                {(objInfo?.brand || objInfo?.model) && (
                  <p className="text-sm text-black/70 font-bold">
                    {[objInfo?.brand, objInfo?.model].filter(Boolean).join(' ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Photo de l'objet */}
          {objInfo?.photo && /^data:image\//i.test(objInfo.photo) && (
            <div className="mb-4">
              <div
                className="relative w-full rounded-lg overflow-hidden border-2 border-black bg-gray-100"
                style={{ maxHeight: '300px' }}
              >
                <img
                  src={objInfo.photo}
                  alt={`Photo de l'objet : ${objInfo?.object_name || 'objet non nommé'}`}
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '300px' }}
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* Couleur */}
          {objInfo?.color && (
            <p className="text-black text-sm font-bold mb-3">
              Couleur : <span className="font-black">{objInfo.color}</span>
            </p>
          )}

          {/* Position détectée (IP) + Google Maps */}
          <div className="border-t-2 border-dashed border-gray-200 pt-4">
            <p className="text-black text-sm font-bold flex items-start gap-1.5">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_RED }} />
              <span>
                Position :{' '}
                {countryLoading ? (
                  <span className="text-black/50 font-medium">détection…</span>
                ) : positionLabel ? (
                  <span className="font-black">{positionLabel}</span>
                ) : (
                  <span className="text-black/50 font-medium">non disponible</span>
                )}
              </span>
            </p>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-black transition hover:opacity-90 min-h-[48px]"
                style={{ backgroundColor: 'white', border: '2px solid #111' }}
              >
                <ExternalLink className="w-4 h-4" />
                Voir sur Google Maps
              </a>
            )}
          </div>
        </div>

        {/* ─── Carte : VOS INFORMATIONS ─── */}
        <div className={`${CARD_CLASS} mb-6`}>
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
            <User className="w-5 h-5" /> VOS INFORMATIONS
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="finder-name" className="block text-sm font-bold text-black mb-2">
                <User className="w-3 h-3 inline mr-1" /> Votre nom <span style={{ color: QRTAGS_RED }}>*</span>
              </label>
              <input
                id="finder-name"
                type="text"
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                placeholder="Entrez votre nom complet"
                className={INPUT_CLASS}
                inputMode="text"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="finder-phone" className="block text-sm font-bold text-black mb-2">
                <Phone className="w-3 h-3 inline mr-1" /> Votre numéro WhatsApp <span style={{ color: QRTAGS_RED }}>*</span>
                {finderPhone && isPhoneValid && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs" style={{ color: QRTAGS_GREEN }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Numéro valide
                  </span>
                )}
              </label>
              <PhoneInput
                countryCode={phoneCountry}
                onCountryChange={setPhoneCountry}
                value={finderPhone}
                onChange={setFinderPhone}
                placeholder="6 12 34 56 78"
                required
                hint="Pays détecté automatiquement via votre IP. Modifiable si besoin."
              />
            </div>
          </div>

          {/* Bouton WhatsApp (gros, vert) */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !finderName.trim() || !isPhoneValid}
            className="wa-pulse w-full mt-5 px-6 py-5 rounded-xl font-black text-lg text-white transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 min-h-[56px]"
            style={{ backgroundColor: QRTAGS_GREEN, border: '3px solid #14532d' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WHATSAPP
              </>
            )}
          </button>

          {/* Bouton APPELER (bleu) */}
          {baggage?.whatsappOwner && (() => {
            const digits = baggage.whatsappOwner.replace(/[^0-9]/g, '');
            if (!digits) return null;
            return (
              <a
                href={`tel:+${digits}`}
                className="w-full mt-3 px-6 py-4 rounded-xl font-black text-base text-white transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-h-[52px]"
                style={{ backgroundColor: '#2563EB', border: '2px solid #1E40AF' }}
              >
                <Phone className="w-5 h-5" />
                APPELER
              </a>
            );
          })()}

          {/* Bouton CHAT (noir, gros) — choix : WHATSAPP · APPELER · CHAT */}
          <button
            type="button"
            onClick={openChat}
            className="w-full mt-3 px-6 py-4 rounded-xl font-black text-base text-white transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-h-[52px]"
            style={{ backgroundColor: QRTAGS_INK, border: '2px solid #000000' }}
          >
            <MessagesSquare className="w-5 h-5" />
            CHAT
          </button>
          <p className="text-center text-xs font-semibold text-black/50 mt-1.5">
            Anonyme — sans laisser de numéro
          </p>

          {/* Badge fixe : propriétaire notifié */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse flex-shrink-0"
              style={{ backgroundColor: QRTAGS_GREEN }}
            />
            <p className="text-sm font-bold text-black flex items-center gap-1.5">
              <Clock className="w-4 h-4" style={{ color: QRTAGS_GREEN }} />
              Propriétaire notifié — répond généralement vite
            </p>
          </div>

          {/* Panneau chat anonyme (ouvert via le bouton CHAT) */}
          {chatOpen && (
            <div ref={chatRef} className="mt-3">
              <FinderChat reference={reference} defaultName={finderName} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mb-8 hidden md:block">
          <a href="/" className="inline-flex items-center gap-2 text-black/70 hover:text-black text-sm">
            <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
          </a>
          <p className="text-black/70 text-sm mt-2">
            Propulsé par <span className="font-bold text-black">QRTags</span>
          </p>
        </div>
      </div>

      {/* ─── Sticky WhatsApp + Appeler (mobile only) ─── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 shadow-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderTop: '2px solid #111' }}
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !finderName.trim() || !isPhoneValid}
            className="wa-pulse flex-1 min-w-0 px-1 py-4 rounded-xl font-black text-xs text-white transition flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
            style={{ backgroundColor: QRTAGS_GREEN, border: '2px solid #14532d' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WHATSAPP
              </>
            )}
          </button>
          {baggage?.whatsappOwner && (() => {
            const digits = baggage.whatsappOwner.replace(/[^0-9]/g, '');
            if (!digits) return null;
            return (
              <a
                href={`tel:+${digits}`}
                className="flex-1 min-w-0 px-1 py-4 rounded-xl font-black text-xs text-white transition flex items-center justify-center gap-1 min-h-[52px]"
                style={{ backgroundColor: '#2563EB', border: '2px solid #1E40AF' }}
                aria-label="Contacter par téléphone"
              >
                <Phone className="w-5 h-5" />
                APPELER
              </a>
            );
          })()}

          {/* Bouton CHAT (noir) */}
          <button
            type="button"
            onClick={openChat}
            className="flex-1 min-w-0 px-1 py-4 rounded-xl font-black text-xs text-white transition flex items-center justify-center gap-1 min-h-[52px]"
            style={{ backgroundColor: QRTAGS_INK, border: '2px solid #000000' }}
            aria-label="Ouvrir le chat anonyme"
          >
            <MessagesSquare className="w-5 h-5" />
            CHAT
          </button>
        </div>
      </div>
    </main>
  );
}
