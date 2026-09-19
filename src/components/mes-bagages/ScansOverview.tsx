'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Clock, MapPin, Loader2 } from 'lucide-react';

const ScanMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] flex items-center justify-center bg-[#FFF8E7] rounded-xl">
      <Loader2 className="w-6 h-6 text-[#E3B23C] animate-spin" />
    </div>
  ),
});

interface OverviewItem {
  reference: string;
  objectName: string | null;
  token: string;
}

interface TrackScan {
  id: string;
  scannedAt: string | null;
  location: string | null;
  finderName: string | null;
  latitude: number | null;
  longitude: number | null;
}

type LoadedItem = OverviewItem & { scans: TrackScan[] };

interface ScansOverviewProps {
  items: OverviewItem[];
}

/**
 * Vue d'ensemble des scans de TOUS les objets du propriétaire :
 * carte agrégée (Leaflet) + historique des derniers scans.
 * Données : /api/track/{token} par objet possédant un trackingToken.
 * Rend NOTHING si aucun objet traçable ou aucun scan — la page reste intacte.
 */
export default function ScansOverview({ items }: ScansOverviewProps) {
  const [data, setData] = useState<LoadedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Signature stable : évite les refetchs à chaque re-render du parent
  const signature = items.map((i) => i.token).join('|');

  useEffect(() => {
    if (!signature) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(
      items.map((item) =>
        fetch(`/api/track/${encodeURIComponent(item.token)}`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => ({ ...item, scans: (Array.isArray(d?.scans) ? d.scans : []) as TrackScan[] }))
          .catch(() => ({ ...item, scans: [] as TrackScan[] }))
      )
    ).then((results) => {
      if (cancelled) return;
      setData(results);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // Dep = signature : les tokens déterminent le contenu ; items change d'identité à chaque render parent
  }, [signature]);

  // Points GPS agrégés (tous objets)
  const mapPoints = useMemo(
    () =>
      data.flatMap((d) =>
        d.scans
          .filter((s): s is TrackScan & { latitude: number; longitude: number } =>
            s.latitude != null && s.longitude != null
          )
          .map((s) => ({
            id: s.id,
            latitude: s.latitude,
            longitude: s.longitude,
            location: s.location,
            city: null as string | null,
            country: null as string | null,
            context: 'scan',
            scannedAt: s.scannedAt || '',
            finderName: s.finderName,
            label: d.objectName || d.reference,
          }))
      ),
    [data]
  );

  // Historique fusionné, du plus récent au plus ancien (10 derniers)
  const recentScans = useMemo(() => {
    const all = data.flatMap((d) =>
      d.scans.map((s) => ({ ...s, label: d.objectName || d.reference, token: d.token }))
    );
    all.sort(
      (a, b) => new Date(b.scannedAt || 0).getTime() - new Date(a.scannedAt || 0).getTime()
    );
    return all.slice(0, 10);
  }, [data]);

  const totalScans = data.reduce((n, d) => n + d.scans.length, 0);

  if (loading) {
    return (
      <div className="space-y-3 mb-4" aria-busy="true">
        <div className="h-40 bg-[#fafafa] border-2 border-dashed border-[#e5e5e5] rounded-2xl flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-[#E3B23C] animate-spin" />
        </div>
      </div>
    );
  }

  // Aucun scan du tout → la section reste invisible (page inchangée)
  if (totalScans === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {/* ─── Carte des scans ─── */}
      <section
        className="bg-white border-2 border-[#1a1a1a] rounded-2xl overflow-hidden shadow-[3px_3px_0_0_#1a1a1a]"
        aria-label="Carte des scans de mes objets"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#E3B23C] border-b-2 border-[#1a1a1a]">
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1a1a1a]">
            🗺️ Carte des scans
          </h2>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/70 text-[#1a1a1a] whitespace-nowrap">
            {mapPoints.length} position{mapPoints.length > 1 ? 's' : ''} GPS
          </span>
        </div>
        <div className="h-[300px]">
          <ScanMap scans={mapPoints} destination={null} />
        </div>
      </section>

      {/* ─── Historique des derniers scans ─── */}
      <section
        className="bg-white border-2 border-[#E3B23C]/40 rounded-2xl overflow-hidden"
        aria-label="Historique des derniers scans"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#E3B23C]/20 bg-[#FFFDF5]">
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1a1a1a]">
            🕘 Derniers scans
          </h2>
          <span className="text-[10px] font-bold text-[#525252] whitespace-nowrap">
            {totalScans} scan{totalScans > 1 ? 's' : ''} au total
          </span>
        </div>
        <ul className="max-h-96 overflow-y-auto chat-scroll divide-y divide-[#f0f0f0]">
          {recentScans.map((s) => (
            <li key={s.id}>
              <Link
                href={`/track/${s.token}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF8E7] transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1a1a1a] truncate">{s.label}</p>
                  <p className="text-xs text-[#525252] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {s.location || 'Lieu non précisé'}
                      {s.finderName ? ` · 👤 ${s.finderName}` : ''}
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-[#a3a3a3] flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {s.scannedAt
                      ? new Date(s.scannedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                  <p className="text-[11px] font-bold text-[#E3B23C] flex items-center gap-0.5 justify-end mt-0.5">
                    Suivi <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
