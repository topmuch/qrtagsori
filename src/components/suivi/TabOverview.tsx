'use client';

import {
  MapPin,
  Calendar,
  Plane,
  Train,
  Ship,
  Bus,
  User,
  Clock,
  Shield,
} from 'lucide-react';
import type { SuiviData, BaggageInfo } from './types';

const INK = '#1a1a1a';

export function TabOverview({
  data,
  baggage,
  lang,
  t,
}: {
  data: SuiviData;
  baggage: BaggageInfo;
  lang: string;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const TransportIcon = baggage.transportMode === 'train' ? Train
    : baggage.transportMode === 'boat' ? Ship
    : baggage.transportMode === 'bus' ? Bus
    : Plane;

  return (
    <div className="space-y-3">
      {/* Travel info */}
      <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
        <h2 className="text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: INK }}>
          <TransportIcon className="w-4 h-4" /> Informations de voyage
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Voyageur</span>
            <span className="font-bold" style={{ color: INK }}>{baggage.travelerName}</span>
          </div>
          {baggage.flightNumber && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Vol</span>
              <span className="font-mono font-bold" style={{ color: INK }}>{baggage.airlineName} {baggage.flightNumber}</span>
            </div>
          )}
          {baggage.trainNumber && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Train</span>
              <span className="font-mono font-bold" style={{ color: INK }}>{baggage.trainCompany} {baggage.trainNumber}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500"><MapPin className="w-3.5 h-3.5 inline" /> Destination</span>
            <span className="font-bold" style={{ color: INK }}>{baggage.destination || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500"><Calendar className="w-3.5 h-3.5 inline" /> Départ</span>
            <span className="font-bold" style={{ color: INK }}>
              {formatDate(baggage.departureDate)}{baggage.departureTime ? ` — ${baggage.departureTime}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Last scan */}
      <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4">
        <h2 className="text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-2" style={{ color: INK }}>
          <Clock className="w-4 h-4" /> Dernier scan
        </h2>
        {baggage.lastScanDate ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-bold" style={{ color: INK }}>{formatDate(baggage.lastScanDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Lieu</span>
              <span className="font-bold" style={{ color: INK }}>{baggage.lastLocation || 'Non précisé'}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Aucun scan pour le moment.</p>
        )}
      </div>

      {/* Finder info */}
      {data.lastFinder && (data.lastFinder.name || data.lastFinder.phone) && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4">
          <h2 className="text-xs uppercase tracking-widest font-bold mb-3 text-green-700 flex items-center gap-2">
            <User className="w-4 h-4" /> Trouveur
          </h2>
          <div className="space-y-2 text-sm">
            {data.lastFinder.name && (
              <div className="flex items-center justify-between">
                <span className="text-green-600">Nom</span>
                <span className="font-bold text-green-700">{data.lastFinder.name}</span>
              </div>
            )}
            {data.lastFinder.phone && (
              <div className="flex items-center justify-between">
                <span className="text-green-600">Téléphone</span>
                <a href={`tel:${data.lastFinder.phone}`} className="font-bold text-green-700 underline" dir="ltr">
                  {data.lastFinder.phone}
                </a>
              </div>
            )}
          </div>
          <p className="text-xs text-green-600 mt-3 bg-green-100 rounded-lg p-2">
            💡 Allez dans l&apos;onglet <strong>Contact</strong> pour appeler ou envoyer un WhatsApp.
          </p>
        </div>
      )}

      {/* Trust note */}
      <div className="text-center text-xs text-white/60 flex items-center justify-center gap-1.5 pt-2">
        <Shield className="w-3 h-3" />
        <span>QRBag — Suivi sécurisé</span>
      </div>
    </div>
  );
}
