'use client';

import { useState, useEffect } from 'react';
import { X, Phone, Lock, User, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTravelerAuth } from '@/contexts/TravelerAuthContext';

interface TravelerAuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export default function TravelerAuthModal({ open, onClose, defaultMode }: TravelerAuthModalProps) {
  const { login, signup } = useTravelerAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form & apply defaultMode when modal opens
  useEffect(() => {
    if (open) {
      setMode(defaultMode || 'login');
      setPhone('');
      setPin('');
      setName('');
      setError('');
      setLoading(false);
    }
  }, [open, defaultMode]);
  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      const result = await fn(phone, pin, name.trim() || undefined);
      if (result.success) {
        onClose();
        setPhone('');
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

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1" /> Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^+\d\s]/g, '');
                setPhone(val);
              }}
              placeholder="+336 12 34 56 78"
              required
              className="w-full px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C]"
            />
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
            disabled={loading || pin.length !== 4 || !phone.trim()}
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
