'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle, Clock, Shield, Sparkles,
  MessageCircle, MapPin, Loader2, CheckCircle2,
} from 'lucide-react';

const QRTAGS_BG = '#111111';
const QRTAGS_ACCENT = '#E3B23C';
const QRTAGS_INK = '#111111';
const FALLBACK_PHONE = '33600000000';

interface BaggageData {
  status: string;
  message?: string;
  baggage?: {
    reference: string;
    travelerName: string;
    status: string;
    agency?: string;
    whatsappOwner?: string;
    declaredLostAt?: string | null;
    foundAt?: string | null;
    createdAt?: string | null;
  };
}

const PENDING_STATUSES = new Set(['in_stock', 'assigned_to_agency', 'sold', 'pending_activation']);

export default function FinderPage() {
  const params = useParams();
  const router = useRouter();
  const reference = (params?.reference as string) || '';

  const [tagData, setTagData] = useState<BaggageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [otherLocation, setOtherLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasContactedOwner, setHasContactedOwner] = useState(false);
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!reference) return;
    (async () => {
      try {
        const res = await fetch(`/api/scan/${reference}`, { cache: 'no-store' });
        const data: BaggageData = await res.json();
        setTagData(data);
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

  useEffect(() => {
    if (tagData && PENDING_STATUSES.has(tagData.status)) {
      router.push(`/inscrire?qr=${reference}`);
    }
  }, [tagData, reference, router]);

  const handleWhatsApp = useCallback(async () => {
    if (!finderName.trim() || !finderPhone.trim()) {
      alert('Veuillez remplir votre nom et téléphone');
      return;
    }
    setIsLocating(true);
    let sharedPos: { lat: number; lng: number } | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
          });
        });
        sharedPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGpsPosition(sharedPos);
      } catch { /* silent fallback */ }
    }
    setIsLocating(false);
    setIsSubmitting(true);
    try {
      await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: otherLocation.trim() || '',
          finderName: finderName.trim(),
          finderPhone: finderPhone.trim(),
          latitude: sharedPos?.lat,
          longitude: sharedPos?.lng,
        }),
      });

      const locationLine = sharedPos
        ? `https://www.google.com/maps?q=${sharedPos.lat},${sharedPos.lng}`
        : (otherLocation.trim() || 'Position non partagée');

      const ownerName = tagData?.baggage?.travelerName || '';
      const firstName = ownerName.split(' ')[0] || '';
      const msg =
        `Bonjour${firstName ? ` ${firstName}` : ''}, ` +
        `j'ai trouvé votre objet (réf. ${reference}). ` +
        `Je suis actuellement à cette position : ${locationLine}. ` +
        `— Message envoyé via QRTags.` +
        (finderName ? ` Trouveur : ${finderName}.` : '') +
        (finderPhone ? ` Contact : ${finderPhone}.` : '');

      const ownerNumber = (tagData?.baggage?.whatsappOwner || FALLBACK_PHONE).replace(/\D/g, '');
      const url = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(msg)}`;
      window.location.href = url;

      setShowSuccess(true);
      setHasContactedOwner(true);
      localStorage.setItem(`contacted_owner_${reference}`, 'true');
      setTimeout(() => setShowSuccess(false), 4000);
    } catch {
      alert('Erreur');
    } finally {
      setIsSubmitting(false);
    }
  }, [finderName, finderPhone, otherLocation, tagData, reference]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_ACCENT }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: QRTAGS_ACCENT }} />
          <p className="text-lg">Chargement...</p>
        </div>
      </main>
    );
  }

  if (tagData?.status === 'not_found') {
    return (
      <main className="min-h-screen flex items-center justify-center p-5" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_ACCENT }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Code QR non valide</h1>
          <p className="mb-6 opacity-80">Ce code QR n'existe pas dans notre système.</p>
          <button onClick={() => router.push('/')} className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT, border: `2px dashed ${QRTAGS_ACCENT}` }}>Retour à l'accueil</button>
        </div>
      </main>
    );
  }

  if (tagData?.status === 'expired') {
    return (
      <main className="min-h-screen flex items-center justify-center p-5" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_ACCENT }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}>
          <Clock className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Tag expiré</h1>
          <button onClick={() => router.push('/')} className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT, border: `2px dashed ${QRTAGS_ACCENT}` }}>Retour</button>
        </div>
      </main>
    );
  }

  if (tagData?.status === 'blocked') {
    return (
      <main className="min-h-screen flex items-center justify-center p-5" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_ACCENT }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}>
          <Shield className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Tag bloqué</h1>
          <button onClick={() => router.push('/')} className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT, border: `2px dashed ${QRTAGS_ACCENT}` }}>Retour</button>
        </div>
      </main>
    );
  }

  if (tagData && PENDING_STATUSES.has(tagData.status)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-5" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_ACCENT }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}>
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Redirection...</h1>
          <p className="mb-6 opacity-80">Ce tag doit être activé. Vous allez être redirigé.</p>
        </div>
      </main>
    );
  }

  const baggage = tagData?.baggage;
  const ownerName = baggage?.travelerName || 'Anonyme';
  const objectRef = baggage?.reference || reference;
  const isLost = baggage?.declaredLostAt && !baggage?.foundAt;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ backgroundColor: QRTAGS_BG, color: QRTAGS_ACCENT }}>
      <div className="relative w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl" style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black" style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT, border: `2px dashed ${QRTAGS_ACCENT}` }}>Q</div>
          <div>
            <div className="text-sm font-bold">QRTags</div>
            <div className="text-xs opacity-70">{isLost ? 'Objet signalé perdu' : 'Objet retrouvé'}</div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">{isLost ? 'Objet signalé perdu' : 'Objet retrouvé'}</h1>
        <p className="text-sm opacity-70 mb-5">Référence : {objectRef}</p>

        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(17,17,17,0.08)', border: `2px dashed ${QRTAGS_INK}40` }}>
          <div className="text-xs uppercase tracking-wide opacity-60 mb-1">Propriétaire</div>
          <div className="font-bold text-base">{ownerName}</div>
          <div className="text-xs opacity-70 mt-1">Référence : {objectRef}</div>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-70 mb-2">
            <MapPin className="w-4 h-4" /> Votre position
          </div>
          {gpsPosition ? (
            <div className="w-full h-48 rounded-xl overflow-hidden" style={{ border: `2px dashed ${QRTAGS_INK}` }}>
              <iframe
                title="Position"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsPosition.lng - 0.01}%2C${gpsPosition.lat - 0.01}%2C${gpsPosition.lng + 0.01}%2C${gpsPosition.lat + 0.01}&layer=mapnik&marker=${gpsPosition.lat}%2C${gpsPosition.lng}`}
                style={{ width: '100%', height: '100%', border: 0, filter: 'invert(1) hue-rotate(180deg)' }}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-32 rounded-xl flex items-center justify-center text-sm opacity-60" style={{ border: `2px dashed ${QRTAGS_INK}` }}>
              GPS en attente...
            </div>
          )}
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-bold mb-1">Votre nom *</label>
            <input type="text" value={finderName} onChange={(e) => setFinderName(e.target.value)} placeholder="Votre nom"
              className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none border-2 border-dashed" style={{ borderColor: QRTAGS_ACCENT }} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Votre téléphone *</label>
            <input type="tel" value={finderPhone} onChange={(e) => setFinderPhone(e.target.value)} placeholder="+33 6 12 34 56 78"
              className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none border-2 border-dashed" style={{ borderColor: QRTAGS_ACCENT }} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Lieu précis (optionnel)</label>
            <input type="text" value={otherLocation} onChange={(e) => setOtherLocation(e.target.value)} placeholder="Hall d'accueil, réception..."
              className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none border-2 border-dashed" style={{ borderColor: QRTAGS_ACCENT }} />
          </div>
        </div>

        <button onClick={handleWhatsApp} disabled={isLocating || isSubmitting}
          className="w-full py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all min-h-[56px] disabled:opacity-60"
          style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_ACCENT, border: `2px dashed ${QRTAGS_ACCENT}` }}>
          {isLocating ? (<><Loader2 className="w-5 h-5 animate-spin" /> Localisation...</>) : isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" /> Envoi...</>) : (<><MessageCircle className="w-5 h-5" /> Contacter le propriétaire via WhatsApp</>)}
        </button>

        {gpsPosition && (
          <a href={`https://www.google.com/maps?q=${gpsPosition.lat},${gpsPosition.lng}`} target="_blank" rel="noreferrer" className="block text-center text-xs mt-3 opacity-70 hover:opacity-100 underline">Ouvrir dans Google Maps</a>
        )}
        <p className="text-xs opacity-60 text-center mt-4">Le propriétaire sera contacté via WhatsApp (clic-vers-chat). Aucune autre notification n'est envoyée.</p>

        {hasContactedOwner && (
          <div className="mt-5 rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(17,17,17,0.08)', border: `2px dashed ${QRTAGS_INK}40` }}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm"><div className="font-bold mb-1">Propriétaire déjà contacté</div><div className="opacity-80">Vous avez déjà envoyé un message au propriétaire de cet objet.</div></div>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl p-8 text-center max-w-sm" style={{ backgroundColor: QRTAGS_ACCENT, color: QRTAGS_INK, border: `2px dashed ${QRTAGS_INK}` }}>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Message envoyé !</h2>
            <p className="text-sm opacity-80">Le propriétaire a été notifié via WhatsApp.</p>
          </div>
        </div>
      )}
    </main>
  );
}
