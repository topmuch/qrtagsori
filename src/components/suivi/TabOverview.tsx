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
  AlertTriangle,
  Phone,
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
      {/* ─── Alerte expiration proche (≤ 3 jours) ─── */}
      {(() => {
        if (!baggage.expiresAt) return null;
        const now = new Date();
        const expiry = new Date(baggage.expiresAt);
        const diffMs = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return null; // déjà expiré — pas d'alerte ici
        if (diffDays > 3) return null; // plus de 3 jours — pas d'alerte

        return (
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">
                  ⏰ Votre QR code expire {diffDays === 0 ? "aujourd'hui" : diffDays === 1 ? 'demain' : `dans ${diffDays} jours`}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Date d&apos;expiration : {expiry.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Contactez votre agence ou QRTags pour prolonger la validité.
                </p>
                <a
                  href="mailto:contact@qrtags.com?subject=Prolongation QR Bag"
                  className="inline-block mt-2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  Demander une prolongation
                </a>
              </div>
            </div>
          </div>
        );
      })()}

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
        <div className="bg-green-600 border-2 border-green-700 rounded-2xl p-4">
          <h2 className="text-xs uppercase tracking-widest font-bold mb-3 text-white flex items-center gap-2">
            <User className="w-4 h-4" /> Trouveur
          </h2>
          <div className="space-y-2 text-sm">
            {data.lastFinder.name && (
              <div className="flex items-center justify-between">
                <span className="text-green-200">Nom</span>
                <span className="font-bold text-white">{data.lastFinder.name}</span>
              </div>
            )}
            {data.lastFinder.phone && (
              <div className="flex items-center justify-between">
                <span className="text-green-200">Téléphone</span>
                <a href={`tel:${data.lastFinder.phone}`} className="font-bold text-white underline" dir="ltr">
                  {data.lastFinder.phone}
                </a>
              </div>
            )}
          </div>

          {/* Boutons d'action directs : WhatsApp + Appeler */}
          {data.lastFinder.phone && (() => {
            const digits = data.lastFinder.phone.replace(/[^0-9]/g, '');
            if (!digits) return null;
            const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
              `Bonjour${data.lastFinder.name ? ` ${data.lastFinder.name}` : ''}, ` +
              `vous avez trouvé mon objet (réf. ${baggage.reference}). ` +
              `Merci beaucoup ! Pouvez-vous m'indiquer comment le récupérer ? — Message envoyé via QRTags.`
            )}`;
            return (
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-pulse flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-white text-sm font-bold min-h-[44px]"
                  style={{ backgroundColor: '#075E54', border: '2px solid #054c46' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={`tel:${data.lastFinder.phone}`}
                  className="flex-1 sm:flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-bold min-h-[44px]"
                  style={{ backgroundColor: 'white', color: '#14532d', border: '2px solid white' }}
                >
                  <Phone className="w-4 h-4" />
                  Appeler
                </a>
              </div>
            );
          })()}

          <p className="text-xs text-green-100 mt-3 bg-green-700/50 rounded-lg p-2">
            💡 Contactez le trouveur directement via WhatsApp ou par téléphone pour convenir de la restitution.
          </p>
        </div>
      )}

      {/* Trust note */}
      <div className="text-center text-xs text-white/60 flex items-center justify-center gap-1.5 pt-2">
        <Shield className="w-3 h-3" />
        <span>QRTags — Suivi sécurisé</span>
      </div>
    </div>
  );
}
