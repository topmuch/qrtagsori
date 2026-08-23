'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Phone, Lock, User, Loader2, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { useTravelerAuth } from '@/contexts/TravelerAuthContext';

// ─── Country code → dial code mapping ───
const COUNTRY_DIAL_CODES: Record<string, { dial: string; label: string; flag: string }> = {
  SN: { dial: '+221', label: 'Sénégal', flag: '🇸🇳' },
  FR: { dial: '+33',  label: 'France',   flag: '🇫🇷' },
  CI: { dial: '+225', label: 'Côte d\'Ivoire', flag: '🇨🇮' },
  ML: { dial: '+223', label: 'Mali',     flag: '🇲🇱' },
  BF: { dial: '+226', label: 'Burkina Faso', flag: '🇧🇫' },
  CM: { dial: '+237', label: 'Cameroun',  flag: '🇨🇲' },
  MA: { dial: '+212', label: 'Maroc',    flag: '🇲🇦' },
  TN: { dial: '+216', label: 'Tunisie',  flag: '🇹🇳' },
  DZ: { dial: '+213', label: 'Algérie',  flag: '🇩🇿' },
  BE: { dial: '+32',  label: 'Belgique', flag: '🇧🇪' },
  CH: { dial: '+41',  label: 'Suisse',   flag: '🇨🇭' },
  CA: { dial: '+1',   label: 'Canada',   flag: '🇨🇦' },
  US: { dial: '+1',   label: 'USA',      flag: '🇺🇸' },
  GB: { dial: '+44',  label: 'Royaume-Uni', flag: '🇬🇧' },
  DE: { dial: '+49',  label: 'Allemagne', flag: '🇩🇪' },
  IT: { dial: '+39',  label: 'Italie',   flag: '🇮🇹' },
  ES: { dial: '+34',  label: 'Espagne',  flag: '🇪🇸' },
  GA: { dial: '+241', label: 'Gabon',    flag: '🇬🇦' },
  CG: { dial: '+242', label: 'Congo',    flag: '🇨🇬' },
  CD: { dial: '+243', label: 'RD Congo', flag: '🇨🇩' },
  GN: { dial: '+224', label: 'Guinée',   flag: '🇬🇳' },
  TG: { dial: '+228', label: 'Togo',     flag: '🇹🇬' },
  BJ: { dial: '+229', label: 'Bénin',    flag: '🇧🇯' },
  NE: { dial: '+227', label: 'Niger',    flag: '🇳🇪' },
  TD: { dial: '+235', label: 'Tchad',    flag: '🇹🇩' },
  CF: { dial: '+236', label: 'Centrafrique', flag: '🇨🇫' },
  MR: { dial: '+222', label: 'Mauritanie', flag: '🇲🇷' },
  KM: { dial: '+269', label: 'Comores',  flag: '🇰🇲' },
  MG: { dial: '+261', label: 'Madagascar', flag: '🇲🇬' },
  GQ: { dial: '+240', label: 'Guinée Équatoriale', flag: '🇬🇶' },
  ST: { dial: '+239', label: 'São Tomé', flag: '🇸🇹' },
  CV: { dial: '+238', label: 'Cap-Vert', flag: '🇨🇻' },
  GW: { dial: '+245', label: 'Guinée-Bissau', flag: '🇬🇼' },
  LR: { dial: '+231', label: 'Liberia',  flag: '🇱🇷' },
  SL: { dial: '+232', label: 'Sierra Leone', flag: '🇸🇱' },
  GH: { dial: '+233', label: 'Ghana',    flag: '🇬🇭' },
  KE: { dial: '+254', label: 'Kenya',    flag: '🇰🇪' },
  };

const DEFAULT_DIAL = COUNTRY_DIAL_CODES.SN; // Sénégal par défaut (cible principale)

interface TravelerAuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export default function TravelerAuthModal({ open, onClose, defaultMode, onSuccess }: TravelerAuthModalProps) {
  const { login, signup } = useTravelerAuth();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [localNumber, setLocalNumber] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialCode, setDialCode] = useState(DEFAULT_DIAL);
  const [detectingCountry, setDetectingCountry] = useState(false);

  // Detect country on first modal open
  const countryDetected = useRef(false);
  useEffect(() => {
    if (open && !countryDetected.current) {
      countryDetected.current = true;
      setDetectingCountry(true);
      fetch('/api/detect-country')
        .then(res => res.json())
        .then(data => {
          const code = data.countryCode || '';
          const matched = COUNTRY_DIAL_CODES[code];
          if (matched) {
            setDialCode(matched);
          }
        })
        .catch(() => {}) // silent fallback
        .finally(() => setDetectingCountry(false));
    }
  }, [open]);

  // Reset form & apply defaultMode when modal opens
  useEffect(() => {
    if (open) {
      setMode(defaultMode || 'login');
      setLocalNumber('');
      setPin('');
      setName('');
      setError('');
      setLoading(false);
      // Focus phone input after a tick
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
  }, [open, defaultMode]);

  const fullPhone = dialCode.dial + localNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (localNumber.length < 6) {
      setError('Numéro de téléphone trop court');
      return;
    }

    if (pin.length !== 4) {
      setError('Le code PIN doit contenir exactement 4 chiffres');
      return;
    }

    if (mode === 'signup' && name.trim().length > 0 && name.trim().length < 2) {
      setError('Le nom doit faire au moins 2 caractères');
      return;
    }

    setLoading(true);
    try {
      const fn = mode === 'login' ? login : signup;
      const result = await fn(fullPhone, pin, name.trim() || undefined);
      if (result.success) {
        onSuccess?.();
        onClose();
        setLocalNumber('');
        setPin('');
        setName('');
      } else {
        setError(result.error || 'Erreur');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-0 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border-2 border-black overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-black">
            {mode === 'login' ? '🔑 Connexion' : '✨ Créer un compte'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Description */}
        <div className="px-5 pt-4">
          <p className="text-sm text-gray-600">
            {mode === 'login'
              ? 'Connectez-vous pour retrouver tous vos objets protégés depuis n\'importe quel appareil.'
              : 'Créez un compte pour sauvegarder vos objets et les retrouver partout.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nom (signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                <User className="w-3.5 h-3.5 inline mr-1" /> Nom (optionnel)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C]"
              />
            </div>
          )}

          {/* Téléphone — indicatif auto-détecté + numéro local */}
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1" /> Numéro de téléphone
            </label>
            <div className="flex gap-0">
              {/* Indicatif pays (pré-rempli, non éditable) */}
              <div className="relative flex-shrink-0">
                <select
                  value={dialCode.dial}
                  onChange={(e) => {
                    const found = Object.values(COUNTRY_DIAL_CODES).find(c => c.dial === e.target.value);
                    if (found) setDialCode(found);
                  }}
                  className="h-full px-3 py-3 border-2 border-r-0 border-black rounded-l-lg bg-gray-100 text-black text-sm font-bold appearance-none cursor-pointer pr-7 focus:outline-none focus:border-[#E3B23C]"
                  style={{ minWidth: '110px' }}
                >
                  {Object.entries(COUNTRY_DIAL_CODES)
                    .sort(([, a], [, b]) => a.dial.localeCompare(b.dial))
                    .map(([code, info]) => (
                      <option key={code} value={info.dial}>
                        {info.flag} {info.dial}
                      </option>
                    ))}
                </select>
                {detectingCountry && (
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E3B23C]" />
                  </div>
                )}
              </div>
              {/* Numéro local */}
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                value={localNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setLocalNumber(val);
                }}
                placeholder="78 123 45 67"
                required
                className="flex-1 px-4 py-3 border-2 border-l-0 border-black rounded-r-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C]"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {dialCode.flag} {dialCode.label} ({dialCode.dial}) — indicatif détecté automatiquement
            </p>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <Lock className="w-3.5 h-3.5 inline mr-1" /> Code PIN (4 chiffres)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(val);
              }}
              placeholder="• • • •"
              required
              className="w-full px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black text-center text-xl tracking-[0.5em] placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || pin.length !== 4 || localNumber.length < 6}
            className="w-full py-3.5 bg-black text-[#E3B23C] font-bold text-base rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={switchMode}
            className="w-full text-center text-sm font-medium text-gray-600 hover:text-black transition"
          >
            {mode === 'login' ? (
              <>Pas de compte ? <span className="underline text-black font-bold">Créer un compte</span></>
            ) : (
              <>Déjà un compte ? <span className="underline text-black font-bold">Se connecter</span></>
            )}
          </button>
        </div>

        {/* Security notice */}
        <div className="bg-gray-50 px-5 py-3 flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100">
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
          <span>Vos données sont sécurisées et stockées en conformité RGPD.</span>
        </div>
      </div>
    </div>
  );
}
