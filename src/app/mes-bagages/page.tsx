'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Luggage, Search, ArrowRight, Clock, LogIn, LogOut, User, Shield, Bell, BellOff, Loader2, Link2, X, Plus, Star, MessageSquare, QrCode, CheckCircle2 } from 'lucide-react';
import { useTravelerAuth, type TravelerBaggage } from '@/contexts/TravelerAuthContext';
import TravelerAuthModal from '@/components/traveler/TravelerAuthModal';

// ─── Types ───
interface LocalBaggageItem {
  reference: string;
  type: string;
  status: string;
  travelerName: string;
  lastScanDate: string | null;
  lastLocation: string | null;
  lastScanLocation: string | null;
  scanCount: number;
  trackingToken: string | null;
  expiresAt: string | null;
  objectInfo?: {
    object_name?: string | null;
    category_label?: string | null;
    color?: string | null;
  } | null;
}

interface DisplayBaggage {
  reference: string;
  status: string;
  travelerName: string;
  lastScanDate: string | null;
  lastScanLocation: string | null;
  scanCount: number;
  trackingToken: string | null;
  expiresAt: string | null;
  objectName?: string | null;
  color?: string | null;
  categoryLabel?: string | null;
}

interface SearchResult {
  id: string;
  reference: string;
  objectName: string | null;
  color: string | null;
  categoryLabel: string | null;
  status: string;
  isLinked: boolean;
}

function toDisplay(b: LocalBaggageItem | TravelerBaggage): DisplayBaggage {
  if ('objectInfo' in b) {
    const lb = b as LocalBaggageItem;
    return {
      reference: lb.reference,
      status: lb.status,
      travelerName: lb.travelerName,
      lastScanDate: lb.lastScanDate,
      lastScanLocation: lb.lastScanLocation,
      scanCount: lb.scanCount,
      trackingToken: lb.trackingToken,
      expiresAt: lb.expiresAt,
      objectName: lb.objectInfo?.object_name || null,
      color: lb.objectInfo?.color || null,
      categoryLabel: lb.objectInfo?.category_label || null,
    };
  }
  const tb = b as TravelerBaggage;
  return {
    reference: tb.reference,
    status: tb.status,
    travelerName: '',
    lastScanDate: tb.lastScanDate,
    lastScanLocation: tb.lastScanLocation,
    scanCount: tb.scanCount,
    trackingToken: tb.trackingToken,
    expiresAt: tb.expiresAt,
    objectName: tb.customData?.object_name,
    color: tb.customData?.color,
    categoryLabel: tb.customData?.category_label,
  };
}

export default function MesBagagesPage() {
  const { traveler, baggages: accountBaggages, isLoggedIn, loading: authLoading, logout, linkBaggage } = useTravelerAuth();
  const [localBaggages, setLocalBaggages] = useState<LocalBaggageItem[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // ─── Search QR (public, works even when not logged in) ───
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [linkingRef, setLinkingRef] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  // Référence en attente de lien après inscription
  const [pendingLinkRef, setPendingLinkRef] = useState<string | null>(null);

  // Vérifier l'état push au chargement
  useEffect(() => {
    if (!isLoggedIn || typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const check = () => {
      navigator.serviceWorker.ready
        .then(reg => reg.pushManager.getSubscription())
        .then(sub => setPushEnabled(!!sub))
        .catch(() => {});
    };
    if (navigator.serviceWorker.controller) {
      check();
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', check, { once: true });
      setTimeout(check, 3000);
    }
  }, [isLoggedIn]);

  // Charger les baggages locaux (localStorage) si pas connecté
  useEffect(() => {
    if (isLoggedIn) {
      setLocalLoading(false);
      return;
    }
    const refs = JSON.parse(localStorage.getItem('qrbag_my_references') || '[]');
    if (refs.length === 0) {
      setLocalLoading(false);
      return;
    }
    Promise.all(
      refs.map((ref: string) =>
        fetch(`/api/suivi/${ref}`).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    ).then(results => {
      const valid: LocalBaggageItem[] = results
        .filter(r => r && r.baggage)
        .map(r => ({
          reference: r.baggage.reference,
          type: r.baggage.type,
          status: r.baggage.status,
          travelerName: r.baggage.travelerName,
          lastScanDate: r.baggage.lastScanDate,
          lastLocation: r.baggage.lastLocation,
          lastScanLocation: r.baggage.lastScanLocation,
          scanCount: r.baggage.scanCount || 0,
          trackingToken: r.baggage.trackingToken || null,
          expiresAt: r.baggage.expiresAt,
          objectInfo: r.baggage.objectInfo || null,
        }));
      setLocalBaggages(valid);
    }).finally(() => {
      setLocalLoading(false);
    });
  }, [isLoggedIn]);

  const displayBaggages = isLoggedIn
    ? accountBaggages.map(toDisplay)
    : localBaggages.map(toDisplay);

  const loading = authLoading || localLoading;

  const filtered = displayBaggages.filter(b =>
    b.reference.toLowerCase().includes(search.toLowerCase()) ||
    b.travelerName.toLowerCase().includes(search.toLowerCase()) ||
    (b.objectName || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.lastScanLocation || '').toLowerCase().includes(search.toLowerCase())
  );

  // ─── Recherche publique QR ───
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchDone(false);
    setSearchError('');
    setSearchResults([]);
    setLinkSuccess(null);
    try {
      const res = await fetch(`/api/baggage/search-public?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results || []);
      } else {
        setSearchError(data.error || 'Erreur de recherche');
      }
    } catch {
      setSearchError('Erreur réseau. Réessayez.');
    } finally {
      setSearchLoading(false);
      setSearchDone(true);
    }
  }, [searchQuery]);

  // ─── Lier un bagage ───
  const handleLink = async (ref: string) => {
    setLinkingRef(ref);
    const ok = await linkBaggage(ref);
    if (ok) {
      setLinkSuccess(ref);
      setSearchResults(prev => prev.filter(r => r.reference !== ref));
      setPendingLinkRef(null);
    }
    setLinkingRef(null);
  };

  // ─── Après inscription : lier automatiquement le bagage en attente ───
  const handleAuthSuccess = useCallback(async () => {
 if (!pendingLinkRef) return;
    // Petit délai pour que le token soit bien enregistré dans le context
    setTimeout(async () => {
      await handleLink(pendingLinkRef);
    }, 500);
  }, [pendingLinkRef]);

  // Ouvrir la modal avec le bon mode + stocker la réf en attente
  const openAuthForLink = (ref: string, mode: 'login' | 'signup' = 'signup') => {
    setPendingLinkRef(ref);
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'activated':
        return 'bg-green-500 text-white';
      case 'scanned': return 'bg-[#E3B23C] text-[#1a1a1a]';
      case 'lost': return 'bg-red-600 text-white';
      case 'found': return 'bg-green-600 text-white';
      case 'blocked': return 'bg-slate-500 text-white';
      default: return 'bg-slate-300 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
      case 'activated':
        return '🛡️ Actif';
      case 'lost': return '🚨 Perdu';
      case 'found': return '✅ Trouvé';
      case 'scanned': return '📍 Scanné';
      default: return status;
    }
  };

  const togglePush = async () => {
    setPushLoading(true);
    try {
      const token = localStorage.getItem('qrtags_traveler_token');
      if (!token) return;
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch(`/api/traveler/push-subscribe?token=${token}&endpoint=${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' });
        }
        setPushEnabled(false);
      } else {
        const res = await fetch(`/api/traveler/push-subscribe?token=${token}`);
        const { publicKey } = await res.json();
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { setPushLoading(false); return; }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        await fetch(`/api/traveler/push-subscribe?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
        setPushEnabled(true);
      }
    } catch (err) {
      console.error('[push] Error:', err);
    } finally {
      setPushLoading(false);
    }
  };

  const pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  // ─── Avis ───
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [selectedBaggageRef, setSelectedBaggageRef] = useState('');

  const handleSubmitReview = async () => {
    if (reviewContent.trim().length < 10) {
      setReviewError('Votre avis doit contenir au moins 10 caractères.');
      return;
    }
    if (reviewName.trim().length < 2) {
      setReviewError('Votre nom est requis (2 caractères minimum).');
      return;
    }
    setReviewError('');
    setReviewSubmitting(true);
    try {
      const selectedBaggage = displayBaggages.find(b => b.reference === selectedBaggageRef);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewName.trim(),
          rating: reviewRating,
          content: reviewContent.trim(),
          trackingToken: selectedBaggage?.trackingToken || null,
          baggageRef: selectedBaggageRef || null,
          objectName: selectedBaggage?.objectName || null,
          category: selectedBaggage?.categoryLabel || null,
          language: 'fr',
        }),
      });
      if (res.ok) {
        setReviewSuccess(true);
        setReviewContent('');
        setReviewRating(5);
        setTimeout(() => { setReviewSuccess(false); setShowReviewForm(false); }, 3000);
      } else {
        const data = await res.json();
        setReviewError(data.error || 'Erreur lors de la soumission.');
      }
    } catch {
      setReviewError('Erreur réseau. Réessayez.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-[#E3B23C]/40 py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Luggage className="w-5 h-5 text-[#E3B23C]" />
            <h1 className="text-lg font-bold text-[#1a1a1a]">Mes bagages</h1>
          </div>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[#525252] text-xs">
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{traveler?.name || traveler?.phone}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f5f5f5] hover:bg-[#e5e5e5] transition text-[#1a1a1a] text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setPendingLinkRef(null); setAuthModalMode('login'); setAuthModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E3B23C] hover:bg-[#E3B23C]/80 transition text-black text-xs font-bold"
            >
              <LogIn className="w-3.5 h-3.5" />
              Se connecter
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 pb-20">
        {/* ─── Bannière connexion (si pas connecté, PAS de bagages) ─── */}
        {!isLoggedIn && !loading && displayBaggages.length === 0 && !searchDone && (
          <div className="bg-[#FFF8E7] border border-[#E3B23C]/40 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#E3B23C] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1a1a1a] mb-1">Sauvegardez vos objets dans le cloud ☁️</p>
              <p className="text-xs text-[#525252]">
                Créez un compte pour retrouver vos objets depuis n'importe quel téléphone.
              </p>
            </div>
          </div>
        )}

        {/* ─── Compte connecté : indicateur + push ─── */}
        {isLoggedIn && !loading && (
          <div className="space-y-3 mb-6">
            <div className="bg-green-50 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1a1a1a]">
                  ✅ Connecté{traveler?.name ? ` — ${traveler.name}` : ''}
                </p>
                <p className="text-xs text-[#525252]">{displayBaggages.length} objet{displayBaggages.length !== 1 ? 's' : ''} enregistré{displayBaggages.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {/* Push notifications */}
            {pushSupported && displayBaggages.length > 0 && (
              <button
                onClick={togglePush}
                disabled={pushLoading}
                className={`w-full rounded-2xl p-4 flex items-center gap-3 border transition ${pushEnabled
                  ? 'bg-[#FFF8E7] border-[#E3B23C]/40 hover:bg-[#FFF8E7]'
                  : 'bg-[#fafafa] border-[#e5e5e5] hover:bg-[#f5f5f5]'
                } disabled:opacity-60`}
              >
                {pushLoading ? (
                  <Loader2 className="w-5 h-5 text-[#E3B23C] animate-spin flex-shrink-0" />
                ) : pushEnabled ? (
                  <Bell className="w-5 h-5 text-[#E3B23C] flex-shrink-0" />
                ) : (
                  <BellOff className="w-5 h-5 text-[#a3a3a3] flex-shrink-0" />
                )}
                <div className="flex-1 text-left">
                  <p className={`text-sm font-bold ${pushEnabled ? 'text-[#E3B23C]' : 'text-[#1a1a1a]'}`}>
                    {pushEnabled ? '🔔 Notifications activées' : '🔕 Activer les notifications'}
                  </p>
                  <p className="text-xs text-[#525252]">
                    {pushEnabled
                      ? 'Vous serez alerté si l\'un de vos objets est scanné'
                      : 'Recevez une alerte instantanée au scan de vos objets'}
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* ─── LIEN SUCCÈS ─── */}
        {linkSuccess && (
          <div className="bg-green-50 border border-green-500/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-700">✅ QR code lié avec succès !</p>
              <p className="text-xs text-green-600 font-mono">{linkSuccess}</p>
            </div>
            <button onClick={() => setLinkSuccess(null)} className="text-green-400 hover:text-green-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#e5e5e5] border-t-[#E3B23C] rounded-full mx-auto mb-3" />
            <p className="text-[#525252] text-sm">Chargement...</p>
          </div>
        ) : displayBaggages.length === 0 && !searchDone ? (
          /* ─── ÉTAT VIDE : Recherche QR + inscription intégrée ─── */
          <div>
            <div className="bg-[#fafafa] border-2 border-dashed border-[#e5e5e5] rounded-2xl p-6 mb-6">
              <QrCode className="w-12 h-12 text-[#E3B23C] mx-auto mb-3" />
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-1 text-center">Trouvez et liez votre QR code</h2>
              <p className="text-sm text-[#525252] mb-5 text-center">
                Entrez la référence de votre étiquette QRTags
              </p>

              {/* Champ de recherche */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
                  <input
                    type="text"
                    placeholder="QR-M1ABC..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] text-sm font-mono placeholder:text-[#a3a3a3] placeholder:font-sans focus:ring-2 focus:ring-[#E3B23C] focus:border-[#E3B23C]"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searchLoading || !searchQuery.trim()}
                  className="px-5 py-3 bg-[#1a1a1a] text-[#E3B23C] text-sm font-bold rounded-xl hover:bg-[#1a1a1a]/80 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Chercher
                </button>
              </div>

              {/* Erreur */}
              {searchError && (
                <p className="text-xs text-red-600 font-medium bg-red-50 rounded-lg p-3 mt-3">{searchError}</p>
              )}

              {/* Résultats */}
              {searchDone && searchResults.length === 0 && !searchError && (
                <div className="mt-4 text-center py-4">
                  <p className="text-sm text-[#525252]">Aucun QR code trouvé avec cette référence.</p>
                  <p className="text-xs text-[#a3a3a3] mt-1">Vérifiez la référence sur votre étiquette et réessayez.</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  {searchResults.map((item) => (
                    <div key={item.id} className="bg-white border-2 border-[#E3B23C]/40 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FFF8E7] flex items-center justify-center flex-shrink-0">
                          <QrCode className="w-5 h-5 text-[#E3B23C]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-bold text-[#1a1a1a]">{item.reference}</p>
                          <p className="text-xs text-[#525252] mt-0.5">
                            {item.objectName || 'Étiquette QRTags'}
                            {item.categoryLabel ? ` · ${item.categoryLabel}` : ''}
                          </p>
                          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                      </div>

                      {/* Boutons selon état connexion */}
                      <div className="mt-3 pt-3 border-t border-[#e5e5e5]">
                        {item.isLinked ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold">Déjà lié à un compte</span>
                          </div>
                        ) : isLoggedIn ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLink(item.reference)}
                              disabled={linkingRef === item.reference}
                              className="flex-1 py-2.5 bg-[#E3B23C] text-black text-xs font-bold rounded-xl hover:bg-[#E3B23C]/80 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {linkingRef === item.reference ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                              {linkingRef === item.reference ? 'Liaison...' : 'Lier à mon compte'}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-[#525252] font-medium">Créez un compte pour lier ce QR code :</p>
                            <button
                              onClick={() => openAuthForLink(item.reference, 'signup')}
                              className="w-full py-2.5 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-[#1a1a1a]/80 transition flex items-center justify-center gap-1.5"
                            >
                              <User className="w-3.5 h-3.5" />
                              S'inscrire et lier
                            </button>
                            <button
                              onClick={() => openAuthForLink(item.reference, 'login')}
                              className="w-full py-2 border border-[#E3B23C]/40 text-[#E3B23C] text-xs font-bold rounded-xl hover:bg-[#FFF8E7] transition flex items-center justify-center gap-1.5"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              Se connecter et lier
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lien vers inscription classique */}
            <div className="text-center">
              <p className="text-xs text-[#a3a3a3] mb-2">Vous n'avez pas encore de QR code ?</p>
              <Link href="/inscrire" className="text-xs text-[#E3B23C] font-bold hover:underline">
                Obtenir une étiquette QRTags →
              </Link>
            </div>
          </div>
        ) : (
          /* ─── LISTE DES BAGAGES ─── */
          <>
            {/* Recherche QR (toujours visible quand on a des bagages) */}
            <div className="rounded-2xl border border-[#E3B23C]/40 bg-[#FFFDF5] overflow-hidden mb-4">
              <div className="p-3 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
                  <input
                    type="text"
                    placeholder="Ajouter un QR code (référence)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm font-mono placeholder:text-[#a3a3a3] placeholder:font-sans focus:ring-2 focus:ring-[#E3B23C] focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searchLoading || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-[#E3B23C] text-black text-xs font-bold rounded-xl hover:bg-[#E3B23C]/80 transition disabled:opacity-50"
                >
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Résultats de recherche inline */}
              {searchResults.length > 0 && (
                <div className="px-3 pb-3 space-y-2 border-t border-[#e5e5e5] pt-3">
                  {searchResults.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#e5e5e5]">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold text-[#1a1a1a] truncate">{item.reference}</p>
                        <p className="text-xs text-[#525252]">
                          {item.objectName || 'Sans nom'} · {item.status === 'active' || item.status === 'activated' ? '🟢 Actif' : item.status}
                        </p>
                      </div>
                      {item.isLinked ? (
                        <span className="text-xs text-green-500 font-bold px-3 py-1 bg-green-50 rounded-lg">✓ Déjà lié</span>
                      ) : (
                        <button
                          onClick={() => handleLink(item.reference)}
                          disabled={linkingRef === item.reference}
                          className="px-3 py-1.5 bg-[#E3B23C] text-black text-xs font-bold rounded-lg hover:bg-[#E3B23C]/80 transition disabled:opacity-50"
                        >
                          {linkingRef === item.reference ? '...' : 'Lier'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {searchDone && searchResults.length === 0 && !searchError && searchQuery && (
                <p className="text-xs text-[#a3a3a3] text-center py-2">Aucun résultat trouvé</p>
              )}

              {searchError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mx-3 mb-2">{searchError}</p>
              )}
            </div>

            {/* Filtre liste */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer mes objets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] text-sm focus:ring-2 focus:ring-[#E3B23C]"
              />
            </div>

            {/* Baggage list */}
            <div className="space-y-3">
              {filtered.map((baggage) => {
                const trackHref = baggage.trackingToken
                  ? `/track/${baggage.trackingToken}`
                  : `/suivi/${baggage.reference}`;
                return (
                  <Link
                    key={baggage.reference}
                    href={trackHref}
                    className="block bg-white border-2 border-dashed border-[#e5e5e5] rounded-2xl p-4 hover:bg-[#FFF8E7] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-[#1a1a1a]">{baggage.reference}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(baggage.status)}`}>
                        {getStatusLabel(baggage.status)}
                      </span>
                    </div>
                    {baggage.objectName && (
                      <p className="text-sm font-semibold text-slate-700 mb-1">
                        📦 {baggage.objectName}
                        {baggage.color ? ` · ${baggage.color}` : ''}
                        {baggage.categoryLabel ? ` · ${baggage.categoryLabel}` : ''}
                      </p>
                    )}
                    {baggage.travelerName && (
                      <p className="text-sm text-slate-600 mb-1">{baggage.travelerName}</p>
                    )}
                    {baggage.lastScanLocation && (
                      <p className="text-xs text-slate-500">📍 {baggage.lastScanLocation}</p>
                    )}
                    {baggage.scanCount > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        👁️ {baggage.scanCount} scan{baggage.scanCount > 1 ? 's' : ''}
                      </p>
                    )}
                    {baggage.lastScanDate && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Dernier scan: {new Date(baggage.lastScanDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    <div className="flex items-center justify-end mt-2">
                      <span className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1">
                        Voir le suivi <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal d'auth voyageur */}
      <TravelerAuthModal
        open={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setPendingLinkRef(null); }}
        defaultMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />

      {/* ─── Section Avis ─── */}
      {isLoggedIn && !loading && displayBaggages.length > 0 && (
        <div className="max-w-md mx-auto w-full px-4 pb-20">
          {!showReviewForm ? (
            <button
              onClick={() => { setShowReviewForm(true); setReviewName(traveler?.name || ''); }}
              className="w-full rounded-2xl p-4 flex items-center gap-3 border border-[#E3B23C]/40 bg-[#FFFDF5] hover:bg-[#FFF8E7] transition text-left"
            >
              <MessageSquare className="w-5 h-5 text-[#E3B23C] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1a1a1a]">Laisser un avis ⭐</p>
                <p className="text-xs text-[#525252]">Partagez votre expérience avec QRTags</p>
              </div>
              <Plus className="w-5 h-5 text-[#E3B23C]" />
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-[#E3B23C]/40 bg-[#FFFDF5] overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-[#E3B23C]/20">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#E3B23C]" />
                  <span className="text-sm font-bold text-[#1a1a1a]">Votre avis</span>
                </div>
                <button onClick={() => setShowReviewForm(false)} className="text-[#525252] hover:text-[#1a1a1a]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#525252] mb-1.5">Votre nom</label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#a3a3a3] focus:ring-2 focus:ring-[#E3B23C] focus:border-transparent"
                  />
                </div>
                {displayBaggages.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-[#525252] mb-1.5">Objet concerné (optionnel)</label>
                    <select
                      value={selectedBaggageRef}
                      onChange={(e) => setSelectedBaggageRef(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm focus:ring-2 focus:ring-[#E3B23C] focus:border-transparent"
                    >
                      <option value="">— Aucun objet en particulier —</option>
                      {displayBaggages.map(b => (
                        <option key={b.reference} value={b.reference}>
                          {b.objectName ? `${b.objectName} (${b.reference})` : b.reference}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-[#525252] mb-1.5">Votre note</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          width={28}
                          height={28}
                          className={star <= reviewRating ? 'fill-current text-[#E3B23C]' : 'text-[#d4d4d4]'}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-bold text-[#1a1a1a]">{reviewRating}/5</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#525252] mb-1.5">Votre commentaire</label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#a3a3a3] focus:ring-2 focus:ring-[#E3B23C] focus:border-transparent resize-none"
                  />
                </div>
                {reviewError && (
                  <p className="text-xs text-red-600 font-medium bg-red-50 rounded-lg p-2.5">{reviewError}</p>
                )}
                {reviewSuccess && (
                  <p className="text-xs text-green-700 font-medium bg-green-50 rounded-lg p-2.5">✅ Merci pour votre avis ! Il sera publié après validation.</p>
                )}
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting || reviewContent.trim().length < 10 || reviewName.trim().length < 2}
                  className="w-full py-3 bg-[#E3B23C] text-black text-sm font-bold rounded-xl hover:bg-[#E3B23C]/80 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {reviewSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {reviewSubmitting ? 'Envoi en cours...' : 'Envoyer mon avis'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// Helper: convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
