'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTrackingSocket } from '@/hooks/useTrackingSocket';
import { useTranslation } from '@/hooks/useTranslation';
import { useAudioAlert, POLL_INTERVAL_MS } from '@/hooks/useAudioAlert';
import { usePWAInstallPrompt } from '@/hooks/usePWAInstallPrompt';
import { usePushNotification } from '@/hooks/usePushNotification';
import { PreDepartureAlert } from '@/components/PreDepartureAlert';
import { FeedbackButton } from '@/components/suivi/FeedbackButton';
import {
  Luggage,
  Plane,
  Settings,
  Camera,
  Phone,
  Shield,
  Clock,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Globe,
  AlertCircle,
  Download,
  Bell,
} from 'lucide-react';

// Dynamic imports
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false, loading: () => <MapSkeleton /> });

// ─── Brand constants ───
const BRAND = '#111111';
const ACCENT = '#E3B23C';
const INK = '#1a1a1a';

// ─── Types imported from @/components/suivi/types ───

function MapSkeleton() {
  return <div className="w-full h-44 sm:h-48 md:h-56 bg-slate-200 animate-pulse rounded-xl" />;
}

// ═══════════════════════════════════════════════════════════════
// TAB COMPONENTS (imported from separate files)
// ═══════════════════════════════════════════════════════════════
import { TabOverview } from '@/components/suivi/TabOverview';
import { TabActions } from '@/components/suivi/TabActions';
import { TabHistory } from '@/components/suivi/TabHistory';
import { TabContact } from '@/components/suivi/TabContact';

// Shared types
import type { BaggageInfo, ScanEntry, LastPosition, SuiviData } from '@/components/suivi/types';

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

type TabId = 'overview' | 'actions' | 'history' | 'contact';

export default function SuiviPage() {
  const params = useParams();
  const reference = params.reference as string;
  const { t, lang, setLang, dir, countryCode } = useTranslation();

  // ─── State ───
  const [data, setData] = useState<SuiviData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [statusToast, setStatusToast] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Audio alert
  const { audioEnabled, enableAudio, toggleAudio } = useAudioAlert(lang);
  const { canInstall, promptInstall } = usePWAInstallPrompt();
  const { isSubscribed: pushSubscribed, subscribe: pushSubscribe, supported: pushSupported } = usePushNotification(reference);

  // WebSocket
  const { isConnected: wsConnected, lastEvent } = useTrackingSocket(reference);

  // Store last reference for PWA redirect + multi-bagages
  useEffect(() => {
    if (reference) {
      localStorage.setItem('qrbag_last_reference', reference);
      // Ajouter à la liste des bagages consultés (multi-bagages)
      const refs = JSON.parse(localStorage.getItem('qrbag_my_references') || '[]');
      if (!refs.includes(reference)) {
        refs.unshift(reference);
        // Garder max 20 références
        localStorage.setItem('qrbag_my_references', JSON.stringify(refs.slice(0, 20)));
      }
    }
  }, [reference]);

  // ─── Fetch tracking data ───
  const fetchSuivi = useCallback(async (isRefresh = false, isSilent = false) => {
    if (isRefresh && !isSilent) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/suivi/${reference}`);
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      setData(d);
    } catch {
      // silent
    } finally {
      setLoading(false);
      if (isRefresh && !isSilent) {
        setIsRefreshing(false);
        setRefreshToast(true);
        setTimeout(() => setRefreshToast(false), 2000);
      }
    }
  }, [reference]);

  // Initial fetch
  useEffect(() => {
    fetchSuivi(false);
  }, [fetchSuivi]);

  // Polling when audio enabled
  useEffect(() => {
    if (!audioEnabled) return;
    const interval = setInterval(() => fetchSuivi(false, true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [audioEnabled, fetchSuivi]);

  // WebSocket real-time alerts
  useEffect(() => {
    if (!lastEvent) return;
    fetchSuivi(true, true);
    setRefreshToast(true);
    setTimeout(() => setRefreshToast(false), 5000);
    if (audioEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch { /* silent */ }
    }
    // BroadcastChannel for push notification
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('qrtags-tracking');
      bc.postMessage({ type: 'scan_detected', reference, message: `Votre bagage ${reference} vient d'être scanné.` });
      bc.close();
    }
  }, [lastEvent, fetchSuivi, audioEnabled, reference]);

  const handleRefresh = useCallback(async () => {
    await fetchSuivi(true);
  }, [fetchSuivi]);

  const handleStatusToggle = useCallback(async (action: 'mark-lost' | 'mark-found') => {
    if (action === 'mark-lost') {
      const confirmed = window.confirm(t('tracking.declare_lost_confirm'));
      if (!confirmed) return;
    }
    setIsTogglingStatus(true);
    try {
      await fetch(`/api/baggage/${reference}/declare-lost`, { method: 'PUT' });
      await fetchSuivi(true, true);
      setStatusToast(true);
      setTimeout(() => setStatusToast(false), 3000);
    } catch {
      // silent
    } finally {
      setIsTogglingStatus(false);
    }
  }, [reference, t, fetchSuivi]);

  // ─── Loading ───
  if (loading) {
    return (
      <main className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <Luggage className="w-16 h-16 text-[#E3B23C] mx-auto mb-4 animate-bounce" />
          <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-[#E3B23C] rounded-full mx-auto mb-4" />
          <p className="text-white">Chargement du suivi...</p>
        </div>
      </main>
    );
  }

  // ─── Error states ───
  if (!data || data.status === 'not_found' || data.status === 'error') {
    return (
      <main className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2" style={{ color: INK }}>Bagage introuvable</h1>
          <p className="text-sm mb-4" style={{ color: INK, opacity: 0.7 }}>
            Ce code QR n&apos;existe pas ou n&apos;est pas encore activé.
          </p>
          <p className="text-xs" style={{ color: INK, opacity: 0.5 }}>
            Contactez le support : contact@qrtags.com
          </p>
        </div>
      </main>
    );
  }

  const baggage = data.baggage;
  const isDeclaredLost = !!baggage?.declaredLostAt && !baggage?.foundAt;
  const hasFinderInfo = !!(data.lastFinder?.name || data.lastFinder?.phone);
  const isFound = !!baggage?.foundAt || hasFinderInfo;
  const hasFinderPhone = !!(data.lastFinder?.phone);

  // ─── Status badge config ───
  const statusConfig = (() => {
    if (isDeclaredLost) return { title: '🚨 Perdu', class: 'bg-red-600 text-white animate-pulse' };
    if (isFound && hasFinderInfo) return { title: '✅ Retrouvé', class: 'bg-green-500 text-white' };
    if (baggage.status === 'scanned') return { title: '📍 Localisé', class: 'bg-[#E3B23C] text-[#1a1a1a]' };
    return { title: '🛡️ Protégé', class: 'bg-[#1a1a1a] text-[#E3B23C]' };
  })();

  // ─── Tab config ───
  const tabs: { id: TabId; label: string; icon: typeof Plane; badge?: number }[] = [
    { id: 'overview', label: 'Suivi', icon: Luggage },
    { id: 'actions', label: 'Actions', icon: Settings },
    { id: 'history', label: 'Historique', icon: Clock, badge: data.scans.length || undefined },
    { id: 'contact', label: 'Contact', icon: Phone },
  ];

  return (
    <main className="min-h-screen bg-[#111111] flex flex-col" dir={dir}>
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-40 bg-[#111111] border-b border-[#E3B23C]/30 py-3 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Luggage className="w-5 h-5 text-[#E3B23C]" />
            <span className="text-sm font-bold text-white">QRTags Suivi</span>
            {wsConnected ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-white/40" />}
          </div>
          <div className="flex items-center gap-2">
            {pushSupported && !pushSubscribed && (
              <button onClick={pushSubscribe} className="p-2 text-white/70 hover:text-white" aria-label="Activer les notifications push">
                <Bell className="w-4 h-4" />
              </button>
            )}
            {pushSubscribed && (
              <span className="text-green-400" title="Notifications push activées">
                <Bell className="w-4 h-4" />
              </span>
            )}
            <button onClick={toggleAudio} className="p-2 text-white/70 hover:text-white" aria-label="Audio">
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 text-white/70 hover:text-white" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'fr' | 'en' | 'ar')}
              className="bg-[#111111] text-white text-xs border border-white/20 rounded-lg px-2 py-1"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
          </div>
        </div>
      </header>

      {/* ═══ Hero: Valise + QR ═══ */}
      <div className="max-w-md mx-auto w-full px-4 pt-4">
        <div className="bg-[#E3B23C] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-[#1a1a1a]">
            <Luggage className="w-8 h-8" style={{ color: INK }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium" style={{ color: INK, opacity: 0.7 }}>Référence</p>
            <p className="text-lg font-mono font-bold truncate" style={{ color: INK }}>{reference}</p>
            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${statusConfig.class}`}>
              {statusConfig.title}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Pre-departure alert ═══ */}
      <div className="max-w-md mx-auto w-full px-4 pt-3">
        <PreDepartureAlert
          reference={reference}
          departureDate={baggage.departureDate}
          departureTime={baggage.departureTime}
          hasScans={data.scans.length > 0}
          lang={lang}
        />
      </div>

      {/* ═══ Refresh toast ═══ */}
      {refreshToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ Données rafraîchies
        </div>
      )}

      {/* ═══ PWA Install Banner ═══ */}
      {canInstall && (
        <div className="max-w-md mx-auto w-full px-4 pt-3">
          <button
            onClick={promptInstall}
            className="w-full bg-[#E3B23C] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-3 flex items-center gap-3 hover:bg-[#E3B23C]/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-[#1a1a1a]">📱 Installer l&apos;application</p>
              <p className="text-xs text-slate-700">Recevez les notifications sur votre téléphone</p>
            </div>
            <span className="text-xs font-bold text-[#111111]">Installer →</span>
          </button>
        </div>
      )}

      {/* ═══ Tab content ═══ */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-4 pb-24">
        {activeTab === 'overview' && (
          <TabOverview
            data={data}
            baggage={baggage}
            lang={lang}
            t={t}
          />
        )}
        {activeTab === 'actions' && (
          <TabActions
            reference={reference}
            baggage={baggage}
            data={data}
            isDeclaredLost={isDeclaredLost}
            isTogglingStatus={isTogglingStatus}
            onStatusToggle={handleStatusToggle}
            lang={lang}
            t={t}
          />
        )}
        {activeTab === 'history' && (
          <TabHistory
            scans={data.scans}
            lang={lang}
            t={t}
          />
        )}
        {activeTab === 'contact' && (
          <TabContact
            reference={reference}
            baggage={baggage}
            lastFinder={data.lastFinder}
            hasFinderPhone={hasFinderPhone}
            isDeclaredLost={isDeclaredLost}
            lang={lang}
            t={t}
          />
        )}
      </div>

      {/* ═══ Bottom tab bar ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#1a1a1a] z-50">
        <div className="max-w-md mx-auto flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-3 relative transition-colors ${
                  isActive
                    ? 'bg-[#111111] text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">{tab.label}</span>
                {tab.badge ? (
                  <span className="absolute top-1.5 right-1/4 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {tab.badge}
                  </span>
                ) : null}
                {isActive && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-1 bg-[#111111] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Feedback button */}
      <FeedbackButton reference={reference} />
    </main>
  );
}
