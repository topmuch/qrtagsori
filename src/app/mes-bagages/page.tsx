'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Luggage, Search, ArrowRight, Clock, LogIn, LogOut, User, Shield, Bell, BellOff, Loader2, Link2, X, Plus } from 'lucide-react';
import { useTravelerAuth, type TravelerBaggage } from '@/contexts/TravelerAuthContext';
import TravelerAuthModal from '@/components/traveler/TravelerAuthModal';

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

// Type unifié pour l'affichage
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
      objectName: lb.objectInfo?.object_name,
      color: lb.objectInfo?.color,
      categoryLabel: lb.objectInfo?.category_label,
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
  const { traveler, baggages: accountBaggages, isLoggedIn, loading: authLoading, logout, linkBaggage, unlinkBaggage, searchBaggage } = useTravelerAuth();
  const [localBaggages, setLocalBaggages] = useState<LocalBaggageItem[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [showLinkSearch, setShowLinkSearch] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<any[]>([]);
  const [linkSearchLoading, setLinkSearchLoading] = useState(false);
  const [linkingRef, setLinkingRef] = useState<string | null>(null);

  // Vérifier l'état push au chargement
  useEffect(() => {
    if (!isLoggedIn || typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setPushEnabled(!!sub))
      .catch(() => {});
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

  const handleLinkSearch = async () => {
    if (!linkSearchQuery.trim()) return;
    setLinkSearchLoading(true);
    const result = await searchBaggage(linkSearchQuery.trim());
    if (result.success && result.results) {
      setLinkSearchResults(result.results);
    } else {
      setLinkSearchResults([]);
    }
    setLinkSearchLoading(false);
  };

  const handleLinkItem = async (ref: string) => {
    setLinkingRef(ref);
    const ok = await linkBaggage(ref);
    if (ok) {
      setLinkSearchResults(prev => prev.filter(r => r.reference !== ref));
    }
    setLinkingRef(null);
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
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E3B23C] hover:bg-[#E3B23C]/80 transition text-black text-xs font-bold"
            >
              <LogIn className="w-3.5 h-3.5" />
              Se connecter
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6 pb-20">
        {/* Bannière connexion (si pas connecté) */}
        {!isLoggedIn && !loading && (
          <div className="bg-[#FFF8E7] border border-[#E3B23C]/40 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#E3B23C] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1a1a1a] mb-1">Sauvegardez vos objets dans le cloud ☁️</p>
              <p className="text-xs text-[#525252] mb-3">
                Créez un compte pour retrouver vos objets depuis n'importe quel téléphone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 bg-[#E3B23C] text-black text-xs font-bold rounded-lg hover:bg-[#E3B23C]/80 transition"
                >
                  Créer mon compte
                </button>
                <Link
                  href="/connexion-voyageur"
                  className="px-4 py-2 border border-[#E3B23C]/40 text-[#E3B23C] text-xs font-bold rounded-lg hover:bg-[#FFF8E7] transition"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Compte connecté : indicateur + push */}
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

            {/* Section: Lier un QR code existant */}
            <div className="rounded-2xl border border-[#E3B23C]/40 bg-[#FFFDF5] overflow-hidden">
              <button
                onClick={() => setShowLinkSearch(!showLinkSearch)}
                className="w-full p-4 flex items-center gap-3 hover:bg-[#FFF8E7] transition text-left"
              >
                <Link2 className="w-5 h-5 text-[#E3B23C] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1a1a1a]">Lier un QR code existant</p>
                  <p className="text-xs text-[#525252]">Vous avez déjà un QR code ? Recherchez-le et liez-le à votre compte</p>
                </div>
                <span className={`text-[#E3B23C] transition-transform ${showLinkSearch ? 'rotate-45' : ''}`}>
                  <Plus className="w-5 h-5" />
                </span>
              </button>

              {showLinkSearch && (
                <div className="px-4 pb-4 space-y-3 border-t border-[#e5e5e5] pt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Entrez la référence QR (ex: QR-M1ABC...)"
                      value={linkSearchQuery}
                      onChange={(e) => setLinkSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleLinkSearch();
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#fafafa] border border-[#e5e5e5] text-[#1a1a1a] text-sm placeholder:text-[#a3a3a3] focus:ring-2 focus:ring-[#E3B23C] focus:border-transparent"
                    />
                    <button
                      onClick={handleLinkSearch}
                      disabled={linkSearchLoading || !linkSearchQuery.trim()}
                      className="px-4 py-2.5 bg-[#E3B23C] text-black text-sm font-bold rounded-xl hover:bg-[#E3B23C]/80 transition disabled:opacity-50"
                    >
                      {linkSearchLoading ? '...' : 'Chercher'}
                    </button>
                  </div>

                  {/* Résultats de recherche */}
                  {linkSearchResults.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {linkSearchResults.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-[#fafafa] rounded-xl border border-[#e5e5e5]">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm font-bold text-[#1a1a1a] truncate">{item.reference}</p>
                            <p className="text-xs text-[#525252]">
                              {item.objectName || 'Sans nom'} · {item.status === 'active' || item.status === 'activated' ? '🟢 Actif' : item.status}
                            </p>
                          </div>
                          {item.isLinked ? (
                            <span className="text-xs text-green-400 font-bold px-3 py-1 bg-green-400/10 rounded-lg">✓ Déjà lié</span>
                          ) : (
                            <button
                              onClick={() => handleLinkItem(item.reference)}
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

                  {linkSearchQuery && linkSearchResults.length === 0 && !linkSearchLoading && (
                    <p className="text-xs text-[#a3a3a3] text-center py-2">Aucun résultat trouvé</p>
                  )}

                  {linkSearchLoading && (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin w-5 h-5 border-2 border-[#E3B23C] border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#e5e5e5] border-t-[#E3B23C] rounded-full mx-auto mb-3" />
            <p className="text-[#525252] text-sm">Chargement...</p>
          </div>
        ) : displayBaggages.length === 0 ? (
          <div className="bg-[#fafafa] border-2 border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center">
            <Luggage className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-700 mb-2">Aucun bagage enregistré</h2>
            <p className="text-sm text-slate-500 mb-6">
              Activez un QR code QRTags pour le voir apparaître ici.
            </p>
            <Link href="/inscrire" className="inline-block bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-bold">
              Activer un QR code
            </Link>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher (référence, nom, lieu...)..."
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
      <TravelerAuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
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
