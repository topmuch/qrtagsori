'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Luggage, Search, ArrowRight, Clock, LogIn, LogOut, User, Shield } from 'lucide-react';
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
  const { traveler, baggages: accountBaggages, isLoggedIn, loading: authLoading, logout } = useTravelerAuth();
  const [localBaggages, setLocalBaggages] = useState<LocalBaggageItem[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  return (
    <main className="min-h-screen bg-[#111111] flex flex-col">
      <header className="bg-[#111111] border-b border-[#E3B23C]/30 py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Luggage className="w-5 h-5 text-[#E3B23C]" />
            <h1 className="text-lg font-bold text-white">Mes bagages</h1>
          </div>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{traveler?.name || traveler?.phone}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white text-xs font-medium"
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
          <div className="bg-[#E3B23C]/10 border border-[#E3B23C]/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#E3B23C] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white mb-1">Sauvegardez vos objets dans le cloud ☁️</p>
              <p className="text-xs text-white/60 mb-3">
                Créez un compte pour retrouver vos objets depuis n'importe quel téléphone.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 bg-[#E3B23C] text-black text-xs font-bold rounded-lg hover:bg-[#E3B23C]/80 transition"
              >
                Créer mon compte gratuitement
              </button>
            </div>
          </div>
        )}

        {/* Compte connecté : indicateur */}
        {isLoggedIn && !loading && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">
                ✅ Connecté{traveler?.name ? ` — ${traveler.name}` : ''}
              </p>
              <p className="text-xs text-white/60">{displayBaggages.length} objet{displayBaggages.length !== 1 ? 's' : ''} enregistré{displayBaggages.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-[#E3B23C] rounded-full mx-auto mb-3" />
            <p className="text-white/70 text-sm">Chargement...</p>
          </div>
        ) : displayBaggages.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-8 text-center">
            <Luggage className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-700 mb-2">Aucun bagage enregistré</h2>
            <p className="text-sm text-slate-500 mb-6">
              Activez un QR code QRTags pour le voir apparaître ici.
            </p>
            <Link href="/inscrire" className="inline-block bg-[#111111] text-white px-6 py-3 rounded-xl font-bold">
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
                    className="block bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4 hover:bg-[#E3B23C]/10 transition-colors"
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
                      <span className="text-xs font-bold text-[#111111] flex items-center gap-1">
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
