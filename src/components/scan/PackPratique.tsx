'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  AlertCircle, Clock, Shield, Sparkles,
  MapPin, Loader2, CheckCircle2, ArrowLeft, RefreshCw,
  Package, Gift, MessageCircle, User, Phone, Navigation,
  ChevronDown, ExternalLink, Zap, ShieldCheck,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import PhoneInput from '@/components/ui/PhoneInput';
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

type GpsStatus = 'idle' | 'loading' | 'success' | 'error';

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

// ─── Hook minimal : détection du pays via IP ───
function useDetectedCountry(): { countryCode: string; isLoading: boolean } {
  const [countryCode, setCountryCode] = useState('FR');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/detect-country', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.countryCode && !cancelled) {
            setCountryCode(String(data.countryCode).toUpperCase());
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

  return { countryCode, isLoading };
}

function isLocalPhoneValid(localDigits: string): boolean {
  const n = localDigits.replace(/\D/g, '');
  return n.length >= 6 && n.length <= 15;
}

function getMonthlyFoundCount(): number {
  const month = new Date().getMonth();
  return 127 + ((month * 13) % 40);
}

interface PackPratiqueProps {
  reference: string;
  baggage: BaggageData;
}

export default function PackPratique({ reference, baggage }: PackPratiqueProps) {
  const { countryCode, isLoading: countryLoading } = useDetectedCountry();

  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('FR');
  const [otherLocation, setOtherLocation] = useState('');
  const [finderMessage, setFinderMessage] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasContactedOwner, setHasContactedOwner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string>('');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Sync la country détectée par IP vers le PhoneInput
  useEffect(() => {
    if (!countryLoading && countryCode) {
      setPhoneCountry(countryCode);
    }
  }, [countryCode, countryLoading]);

  // ─── Check if already contacted ───
  useEffect(() => {
    if (typeof window !== 'undefined' &&
        localStorage.getItem(`contacted_owner_${reference}`) === 'true') {
      setHasContactedOwner(true);
    }
  }, [reference]);

  // ─── Auto GPS detection on mount ───
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      return;
    }

    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(accuracy));
        setGpsStatus('success');

        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr' } }
        )
          .then((res) => res.json())
          .then((data) => {
            if (data?.display_name) {
              setGpsAddress(data.display_name);
            } else {
              setGpsAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          })
          .catch(() => {
            setGpsAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          });
      },
      () => {
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // ─── Submit → POST scan + open WhatsApp ───
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
      const res = await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: otherLocation.trim() || gpsAddress || '',
          finderName: finderName.trim(),
          finderPhone: `+${normalized}`,
          message: finderMessage.trim() || null,
          latitude: gpsCoords?.lat,
          longitude: gpsCoords?.lng,
        }),
      });

      const data = await res.json();
      const whatsappUrl = data.whatsappUrl as string;
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
      setShowSuccess(true);
      setHasContactedOwner(true);
      localStorage.setItem(`contacted_owner_${reference}`, 'true');
      setTimeout(() => setShowSuccess(false), 6000);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la notification');
    } finally {
      setIsSubmitting(false);
    }
  }, [finderName, finderPhone, phoneCountry, otherLocation, finderMessage, gpsCoords, gpsAddress, reference]);

  const retryGps = () => {
    setGpsStatus('idle');
    setGpsCoords(null);
    setGpsAddress('');
    setGpsAccuracy(null);
    setTimeout(() => {
      if ('geolocation' in navigator) {
        setGpsStatus('loading');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setGpsCoords({ lat: latitude, lng: longitude });
            setGpsAccuracy(Math.round(accuracy));
            setGpsStatus('success');
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'fr' } }
            )
              .then((r) => r.json())
              .then((d) => setGpsAddress(d?.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`))
              .catch(() => setGpsAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`));
          },
          () => setGpsStatus('error'),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setGpsStatus('error');
      }
    }, 100);
  };

  const autofillLocation = useCallback(() => {
    if (gpsAddress) {
      setOtherLocation(gpsAddress.split(',').slice(0, 3).join(',').trim());
      setShowMoreOptions(true);
      return;
    }
    if (gpsCoords) {
      setOtherLocation(`${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`);
      setShowMoreOptions(true);
      return;
    }
    if ('geolocation' in navigator) {
      setGpsStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGpsCoords({ lat: latitude, lng: longitude });
          setGpsAccuracy(Math.round(accuracy));
          setGpsStatus('success');
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'fr' } }
          )
            .then((r) => r.json())
            .then((d) => {
              const addr = d?.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
              setGpsAddress(addr);
              setOtherLocation(addr.split(',').slice(0, 3).join(',').trim());
            })
            .catch(() => {
              const addr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
              setGpsAddress(addr);
              setOtherLocation(addr);
            });
          setShowMoreOptions(true);
        },
        () => {
          setGpsStatus('error');
          alert('Géolocalisation indisponible. Veuillez saisir le lieu manuellement.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('Géolocalisation non supportée sur cet appareil.');
    }
  }, [gpsAddress, gpsCoords]);

  // ═══════════════════════════════════════════════════════════════════
  // Derived values
  // ═══════════════════════════════════════════════════════════════════
  const objInfo = baggage?.objectInfo || null;
  const ownerFirstName = baggage?.travelerFirstName || '';
  const ownerFullName = baggage?.travelerName || 'Anonyme';
  const objectRef = baggage?.reference || reference;
  const isLost = baggage?.isLost || (baggage?.declaredLostAt && !baggage?.foundAt);

  const ownerDisplayName = useMemo(() => {
    if (!ownerFullName || ownerFullName === 'Anonyme') return 'Propriétaire vérifié';
    const parts = ownerFullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || '';
    return lastInitial ? `${first} ${lastInitial}.` : first;
  }, [ownerFullName]);

  const phoneLocalDigits = useMemo(() => {
    const dialDigits = getDialCode(phoneCountry).replace('+', '');
    const digits = finderPhone.replace(/\D/g, '');
    if (digits.startsWith(dialDigits)) return digits.slice(dialDigits.length);
    return digits;
  }, [finderPhone, phoneCountry]);
  const isPhoneValid = phoneLocalDigits.length >= 6 && phoneLocalDigits.length <= 15;

  const accuracyLabel = useMemo(() => {
    if (gpsAccuracy == null) return null;
    if (gpsAccuracy <= 20) return 'Position très précise';
    if (gpsAccuracy <= 80) return 'Position précise';
    if (gpsAccuracy <= 200) return 'Position approximative';
    return 'Position imprécise';
  }, [gpsAccuracy]);

  const monthlyCount = getMonthlyFoundCount();
  const categoryIcon = getCategoryIcon(objInfo?.category);
  const hasReward = Boolean(objInfo?.reward && String(objInfo.reward).trim());

  return (
    <main className="min-h-screen py-8 px-4 pb-32 md:pb-8" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_INK }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-black">
            <QRTagsLogo size="md" variant="light" />
          </div>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-4 border-2 border-black">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: isLost ? QRTAGS_RED : QRTAGS_GREEN }}
            />
            <span className="text-black font-bold text-sm">
              {isLost ? 'Objet signalé perdu' : 'Objet retrouvé'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-black mb-2">
            🎯 {isLost ? 'OBJET PERDU' : 'OBJET RETROUVÉ'}
          </h1>
          <p className="text-black/80">
            Référence : <span className="font-bold text-black">{objectRef}</span>
          </p>
        </div>

        {/* ═════ BANDEAU RÉCOMPENSE ═════ */}
        {hasReward && (
          <div
            className="reward-pulse reward-shimmer relative overflow-hidden mb-5 rounded-2xl text-center"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #DC2626 100%)',
              border: '3px solid #111',
              boxShadow: '0 10px 28px rgba(217, 119, 6, 0.45)',
            }}
          >
            <div className="relative z-10 px-5 py-4 md:py-5">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow" />
                <span className="text-white text-xs md:text-sm font-black uppercase tracking-wider drop-shadow">
                  Récompense offerte
                </span>
              </div>
              <p className="text-white font-black leading-none drop-shadow-lg"
                 style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', textShadow: '2px 2px 0 rgba(0,0,0,0.35)' }}>
                {objInfo!.reward}
              </p>
              <p className="text-white/95 text-xs md:text-sm font-bold mt-1.5 drop-shadow">
                💰 À vous qui aiderez à retrouver cet objet
              </p>
            </div>
          </div>
        )}

        {/* ═════ Carte : infos de l'objet ═════ */}
        <div className={`${CARD_CLASS} mb-6`}>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <Package className="w-5 h-5" /> OBJET
            </h2>
          </div>

          {/* Icône catégorie + nom objet */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg p-4 border-2 border-black mb-4">
            <div className="flex items-center gap-4">
              <div
                className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-4xl shadow-md"
                style={{ backgroundColor: 'white', border: '2px solid #111' }}
              >
                {categoryIcon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-black/60 uppercase font-bold">Objet</p>
                <p className="text-black font-black text-xl truncate">
                  {objInfo?.object_name || 'Objet non spécifié'}
                </p>
                <p className="text-sm text-black/70 font-medium">
                  {objInfo?.category_label || objInfo?.category || 'Catégorie non précisée'}
                </p>
              </div>
            </div>
          </div>

          {/* Photo de l'objet */}
          {objInfo?.photo && /^data:image\//i.test(objInfo.photo) && (
            <div className="mb-4">
              <p className="text-xs text-black/60 uppercase font-bold mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" /> Photo de l'objet
              </p>
              <div
                className="relative w-full rounded-lg overflow-hidden border-2 border-black bg-gray-100"
                style={{ maxHeight: '360px' }}
              >
                <img
                  src={objInfo.photo}
                  alt={`Photo de l'objet : ${objInfo?.object_name || 'objet non nommé'}`}
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '360px' }}
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-black/50 mt-1 italic">
                📸 Photo partagée par le propriétaire pour vous aider à confirmer qu'il s'agit bien de cet objet.
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 border-2 border-black">
            <div className="grid grid-cols-2 gap-4">
              {objInfo?.color && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Couleur</p>
                  <p className="text-black font-bold">{objInfo.color}</p>
                </div>
              )}
              {objInfo?.brand && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Marque</p>
                  <p className="text-black font-bold">{objInfo.brand}</p>
                </div>
              )}
              {objInfo?.model && (
                <div>
                  <p className="text-xs text-black/60 uppercase font-bold">Modèle</p>
                  <p className="text-black font-bold">{objInfo.model}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-black/60 uppercase font-bold">Propriétaire</p>
                <p className="text-black font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" style={{ color: QRTAGS_GREEN }} />
                  {ownerDisplayName}
                </p>
              </div>
            </div>

            {objInfo?.object_description && (
              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <p className="text-xs text-black/60 uppercase font-bold mb-1">Description</p>
                <p className="text-black text-sm">{objInfo.object_description}</p>
              </div>
            )}

            {objInfo?.message_to_finder && (
              <div
                className="mt-4 relative overflow-hidden rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 60%, #FDE68A 100%)',
                  border: '3px solid #B45309',
                  boxShadow: '0 6px 16px rgba(180, 83, 9, 0.18)',
                }}
              >
                <div
                  className="absolute top-0 left-0 h-full w-1.5"
                  style={{ background: 'linear-gradient(180deg, #F59E0B, #DC2626)' }}
                />
                <div className="relative px-5 py-4 pl-7">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#DC2626', border: '2px solid #7F1D1D' }}
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <p
                      className="text-xs uppercase font-black tracking-wider"
                      style={{ color: '#7C2D12' }}
                    >
                      Message du propriétaire
                    </p>
                  </div>
                  <p
                    className="font-bold leading-relaxed"
                    style={{
                      color: '#1C1917',
                      fontSize: '1.05rem',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                    }}
                  >
                    &ldquo;{objInfo.message_to_finder}&rdquo;
                  </p>
                  <p className="mt-2 text-xs font-bold flex items-center gap-1" style={{ color: '#92400E' }}>
                    ✉️ Merci de lire ce message avant toute chose.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═════ Carte : Géolocalisation automatique ═════ */}
        <div className={`${CARD_CLASS} mb-6`}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-bold text-black flex items-center gap-2">
              <Navigation className="w-5 h-5" /> VOTRE POSITION GPS
            </h3>
            {accuracyLabel && gpsStatus === 'success' && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: gpsAccuracy! <= 80 ? '#dcfce7' : '#fef3c7',
                  color: gpsAccuracy! <= 80 ? '#14532d' : '#78350f',
                  border: '1px solid currentColor',
                }}
              >
                <Zap className="w-3 h-3" />
                {accuracyLabel} · ~{gpsAccuracy}m
              </span>
            )}
          </div>

          {gpsStatus === 'idle' && (
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-black/40" />
              <p className="text-black/70 text-sm">En attente de détection...</p>
            </div>
          )}

          {gpsStatus === 'loading' && (
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: QRTAGS_INK }} />
              <p className="text-black font-bold">Détection de votre position...</p>
              <p className="text-sm text-black/60 mt-2">Veuillez autoriser l'accès à la géolocalisation</p>
            </div>
          )}

          {gpsStatus === 'success' && gpsCoords && (
            <div className="bg-green-50 rounded-lg p-4 border-2" style={{ borderColor: QRTAGS_GREEN }}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_GREEN }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold mb-1" style={{ color: QRTAGS_GREEN }}>Position détectée avec succès !</p>
                  <p className="text-black text-sm mb-2 break-words">
                    {gpsAddress || `${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)}`}
                  </p>
                  <div className="bg-white rounded-md p-1 border mb-2" style={{ borderColor: QRTAGS_GREEN }}>
                    <iframe
                      title="Carte de votre position"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsCoords.lng - 0.005}%2C${gpsCoords.lat - 0.005}%2C${gpsCoords.lng + 0.005}%2C${gpsCoords.lat + 0.005}&layer=mapnik&marker=${gpsCoords.lat}%2C${gpsCoords.lng}`}
                      className="w-full rounded"
                      style={{ height: '160px', border: 0 }}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <a
                      href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-white transition hover:opacity-90 min-h-[40px]"
                      style={{ backgroundColor: QRTAGS_GREEN }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?ll=${gpsCoords.lat}%2C${gpsCoords.lng}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-white transition hover:opacity-90 min-h-[40px]"
                      style={{ backgroundColor: '#33A1FF' }}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Ouvrir dans Waze
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {gpsStatus === 'error' && (
            <div className="bg-red-50 rounded-lg p-4 border-2" style={{ borderColor: QRTAGS_RED }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_RED }} />
                <div className="flex-1">
                  <p className="font-bold mb-2" style={{ color: QRTAGS_RED }}>Géolocalisation non disponible</p>
                  <p className="text-black text-sm mb-3">
                    La géolocalisation aide le propriétaire à retrouver son objet plus rapidement.
                    Vous pouvez quand même remplir le formulaire ci-dessous.
                  </p>
                  <button
                    type="button"
                    onClick={retryGps}
                    className="px-4 py-2 rounded-lg font-bold text-sm text-white transition min-h-[40px]"
                    style={{ backgroundColor: QRTAGS_RED }}
                  >
                    <RefreshCw className="w-3 h-3 inline mr-1" /> Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═════ Carte : Formulaire du trouveur ═════ */}
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
                <Phone className="w-3 h-3 inline mr-1" /> Votre téléphone <span style={{ color: QRTAGS_RED }}>*</span>
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
              <button
                type="button"
                onClick={autofillLocation}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-black/70 hover:text-black underline min-h-[36px]"
              >
                <Zap className="w-3 h-3" /> Remplir automatiquement le lieu précis avec ma position
              </button>
            </div>

            <div className="border-t-2 border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-full flex items-center justify-between text-sm font-bold text-black/70 hover:text-black transition min-h-[40px]"
                aria-expanded={showMoreOptions}
              >
                <span className="flex items-center gap-1.5">
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`} />
                  {showMoreOptions ? 'Moins d\'options' : '+ Plus d\'options'}
                </span>
                <span className="text-xs text-black/50">Optionnel</span>
              </button>

              {showMoreOptions && (
                <div className="space-y-4 mt-3">
                  <div>
                    <label htmlFor="finder-location" className="block text-sm font-bold text-black mb-2">
                      <MapPin className="w-3 h-3 inline mr-1" /> Lieu précis (optionnel)
                    </label>
                    <input
                      id="finder-location"
                      type="text"
                      value={otherLocation}
                      onChange={(e) => setOtherLocation(e.target.value)}
                      placeholder="Ex: Hall d'accueil, réception, devant la gare..."
                      className={INPUT_CLASS}
                      autoComplete="street-address"
                    />
                  </div>

                  <div>
                    <label htmlFor="finder-message" className="block text-sm font-bold text-black mb-2">
                      <MessageCircle className="w-3 h-3 inline mr-1" /> Message au propriétaire (optionnel)
                    </label>
                    <textarea
                      id="finder-message"
                      rows={3}
                      value={finderMessage}
                      onChange={(e) => setFinderMessage(e.target.value)}
                      placeholder="Ex: J'ai trouvé votre objet ce matin devant l'entrée..."
                      className={`${INPUT_CLASS} resize-none`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-sm font-bold text-black mt-5 mb-2">
            👉 Cliquez pour contacter {ownerFirstName || 'le propriétaire'} gratuitement
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !finderName.trim() || !isPhoneValid}
            className="wa-pulse w-full mt-2 px-6 py-5 rounded-xl font-black text-lg text-white transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 min-h-[56px]"
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
                Contacter le propriétaire via WhatsApp
              </>
            )}
          </button>

          {baggage?.whatsappOwner && (() => {
            const digits = baggage.whatsappOwner.replace(/[^0-9]/g, '');
            if (!digits) return null;
            return (
              <a
                href={`tel:+${digits}`}
                className="w-full mt-3 px-6 py-4 rounded-xl font-bold text-base text-black transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-h-[52px]"
                style={{ backgroundColor: 'white', border: '2px solid #111' }}
              >
                <Phone className="w-5 h-5" style={{ color: QRTAGS_INK }} />
                Contacter par téléphone
              </a>
            );
          })()}

          <p className="text-center text-xs text-black/70 mt-3 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: QRTAGS_GREEN }} />
            Déjà {monthlyCount} objets retrouvés ce mois-ci grâce à QRTags
          </p>

          <p className="text-xs text-black/60 text-center mt-3">
            Le propriétaire sera contacté via WhatsApp (clic-vers-chat).
            Aucune autre notification n'est envoyée.
          </p>
        </div>

        {/* Confirmation si déjà contacté */}
        {hasContactedOwner && !showSuccess && (
          <div className={`${CARD_CLASS} mb-6`}>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_GREEN }} />
              <div className="text-sm">
                <div className="font-bold mb-1 text-black">Propriétaire déjà contacté</div>
                <div className="text-black/70">
                  Vous avez déjà envoyé un message au propriétaire de cet objet. Vous pouvez
                  renvoyer un message si nécessaire.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mb-8 hidden md:block">
          <a href="/" className="inline-flex items-center gap-2 text-black/70 hover:text-black text-sm">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </a>
          <p className="text-black/70 text-sm mt-2">
            Propulsé par <span className="font-bold text-black">QRTags</span>
          </p>
          <p className="text-black/50 text-xs mt-1">Ensemble, retrouvons les objets perdus</p>
        </div>
      </div>

      {/* ═════ Sticky WhatsApp + Tel buttons (mobile only) ═════ */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 shadow-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderTop: '2px solid #111' }}
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !finderName.trim() || !isPhoneValid}
            className="wa-pulse flex-1 px-3 py-4 rounded-xl font-black text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
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
                WhatsApp
              </>
            )}
          </button>
          {baggage?.whatsappOwner && (() => {
            const digits = baggage.whatsappOwner.replace(/[^0-9]/g, '');
            if (!digits) return null;
            return (
              <a
                href={`tel:+${digits}`}
                className="flex-shrink-0 px-4 py-4 rounded-xl font-black text-sm text-black transition flex items-center justify-center gap-1.5 min-h-[52px]"
                style={{ backgroundColor: 'white', border: '2px solid #111' }}
                aria-label="Contacter par téléphone"
              >
                <Phone className="w-5 h-5" style={{ color: QRTAGS_INK }} />
                Appeler
              </a>
            );
          })()}
        </div>
      </div>

      {/* Modal de succès */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center border-2 border-black shadow-2xl">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: QRTAGS_GREEN }}
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-black text-black mb-3">MESSAGE ENVOYÉ !</h2>
            <p className="text-black/80 mb-6">
              WhatsApp s'est ouvert dans un nouvel onglet avec le message pré-rempli.
              Le propriétaire a aussi reçu votre position GPS.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-black mb-6 text-left">
              <p className="text-sm font-bold text-black mb-2">Prochaines étapes :</p>
              <ul className="text-sm text-black space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_GREEN }} />
                  <span>WhatsApp s'est ouvert avec le message pré-rempli</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_INK }} />
                  <span>Cliquez sur &quot;Envoyer&quot; dans WhatsApp</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: QRTAGS_INK }} />
                  <span>Convenez d'un rendez-vous pour la restitution</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="w-full px-6 py-3 rounded-lg font-bold bg-black text-[#E3B23C] hover:bg-gray-900 transition min-h-[48px]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
