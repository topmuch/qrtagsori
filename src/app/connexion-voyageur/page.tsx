'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Lock,
  User,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Luggage,
  Bell,
  Cloud,
} from 'lucide-react';
import { useTravelerAuth } from '@/contexts/TravelerAuthContext';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const QRTAGS_BG = '#E3B23C';

export default function ConnexionVoyageurPage() {
  const router = useRouter();
  const { login, signup } = useTravelerAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        router.push('/mes-bagages');
      } else {
        setError(result.error || 'Erreur');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: QRTAGS_BG }}
    >
      {/* Header */}
      <div className="px-4 pt-6">
        <QRTagsLogo />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-black">
            {/* Title */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                {mode === 'login' ? (
                  <Luggage className="w-7 h-7 text-[#E3B23C]" />
                ) : (
                  <Cloud className="w-7 h-7 text-[#E3B23C]" />
                )}
              </div>
              <h1 className="text-xl font-black text-black">
                {mode === 'login' ? 'Retrouvez vos objets' : 'Créez votre compte'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'login'
                  ? 'Connectez-vous depuis n\'importe quel appareil'
                  : 'Sauvegardez vos objets dans le cloud'}
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <Cloud className="w-5 h-5 mx-auto mb-1 text-[#E3B23C]" />
                <p className="text-[10px] font-semibold text-gray-600">Cloud</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <Bell className="w-5 h-5 mx-auto mb-1 text-[#E3B23C]" />
                <p className="text-[10px] font-semibold text-gray-600">Alertes</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-xl">
                <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-[#E3B23C]" />
                <p className="text-[10px] font-semibold text-gray-600">RGPD</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="+221 77 000 00 00"
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
                  className="w-full px-4 py-3 border-2 border-black rounded-lg bg-gray-50 text-black text-center text-2xl tracking-[0.6em] placeholder-gray-400 focus:outline-none focus:border-[#E3B23C] focus:ring-2 focus:ring-[#E3B23C]"
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
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                className="text-sm font-medium text-gray-600 hover:text-black transition"
              >
                {mode === 'login' ? (
                  <>Pas de compte ? <span className="underline text-black font-bold">Créer un compte</span></>
                ) : (
                  <>Déjà un compte ? <span className="underline text-black font-bold">Se connecter</span></>
                )}
              </button>
            </div>
          </div>

          {/* Security footer */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-black/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Données sécurisées et conformes au RGPD</span>
          </div>
        </div>
      </div>
    </main>
  );
}
