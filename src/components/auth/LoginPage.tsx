'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  QrCode,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Building2,
  ArrowRight,
  CheckCircle,
  Fingerprint,
  KeyRound,
  Mail,
  Lock,
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

/* ══════════════════════════════════════════════
   CONFIG PER VARIANT
   ══════════════════════════════════════════════ */
type LoginVariant = 'agence' | 'superadmin';

interface LoginConfig {
  type: LoginVariant;
  title: string;
  subtitle: string;
  demoEmail: string;
  demoPassword: string;
  demoLabel: string;
  role: string;
  redirectPath: string;
  bgImage: string;
  accentColor: string;
  accentHover: string;
  accentLight: string;
  accentGlow: string;
  badgeText: string;
  badgeIcon: typeof QrCode;
  leftTitle: string;
  leftSubtitle: string;
  switchText: string;
  switchLink: string;
  switchHref: string;
  features: { icon: typeof QrCode; title: string; desc: string }[];
}

const CONFIGS: Record<LoginVariant, LoginConfig> = {
  agence: {
    type: 'agence',
    title: 'Espace Agence',
    subtitle: 'Connectez-vous à votre espace professionnel',
    demoEmail: 'agence@qrbag.com',
    demoPassword: 'agence123',
    demoLabel: 'Agence',
    role: 'agency',
    redirectPath: '/agence/tableau-de-bord',
    bgImage: '/login-agence-bg.png',
    accentColor: '#2563EB',
    accentHover: '#1D4ED8',
    accentLight: '#EFF6FF',
    accentGlow: 'rgba(37,99,235,0.15)',
    badgeText: 'Agence',
    badgeIcon: Building2,
    leftTitle: 'QRBag pour les professionnels du voyage',
    leftSubtitle: 'Gérez vos bagages, vos clients, vos QR — depuis un seul tableau de bord.',
    switchText: 'Vous êtes administrateur ?',
    switchLink: 'Connexion SuperAdmin',
    switchHref: '/admin/connexion',
    features: [
      { icon: CheckCircle, title: 'Scan en temps réel', desc: 'Suivez chaque bagage dès qu\'il est scanné' },
      { icon: QrCode, title: 'Commande en 1 clic', desc: 'Générez des lots de QR en 30 secondes' },
      { icon: Building2, title: 'Dashboard intuitif', desc: 'Suivi des pèlerins, statuts, trouvailles' },
      { icon: Shield, title: 'Support 24/7', desc: 'Nous sommes là pour vous aider' },
    ],
  },
  superadmin: {
    type: 'superadmin',
    title: 'Espace Administrateur',
    subtitle: 'Connexion sécurisée réservée aux administrateurs',
    demoEmail: 'admin@qrbag.com',
    demoPassword: 'admin123',
    demoLabel: 'SuperAdmin',
    role: 'superadmin',
    redirectPath: '/admin/tableau-de-bord',
    bgImage: '/login-admin-bg.png',
    accentColor: '#1E40AF',
    accentHover: '#1E3A8A',
    accentLight: '#EFF6FF',
    accentGlow: 'rgba(30,64,175,0.15)',
    badgeText: 'Admin',
    badgeIcon: Shield,
    leftTitle: 'QRBag — Contrôle centralisé',
    leftSubtitle: 'Gérez agences, QR codes, utilisateurs et API — tout depuis un seul tableau de bord.',
    switchText: 'Vous êtes une agence ?',
    switchLink: 'Connexion Agence',
    switchHref: '/agence/connexion',
    features: [
      { icon: Shield, title: 'Sécurité renforcée', desc: 'Authentification stricte, logs complets' },
      { icon: Building2, title: 'Tableau de bord centralisé', desc: 'Suivi en temps réel de toutes les activités' },
      { icon: QrCode, title: 'Intégrations API', desc: 'Green API, géoloc, PDF à la demande' },
      { icon: CheckCircle, title: 'Gestion des rôles', desc: 'Agences, admins, agents — tout contrôlé' },
    ],
  },
};

/* ══════════════════════════════════════════════
   LOGIN PAGE COMPONENT
   ══════════════════════════════════════════════ */
export default function LoginPage({ variant }: { variant: LoginVariant }) {
  const config = CONFIGS[variant];
  const router = useRouter();
  const { user, login, loading: authLoading, isAgency, isSuperAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return;
    if (user && ((variant === 'agence' && isAgency) || (variant === 'superadmin' && isSuperAdmin))) {
      router.replace(config.redirectPath);
    }
  }, [user, authLoading, isAgency, isSuperAdmin, variant, router, config.redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: config.role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        router.push(config.redirectPath);
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(config.demoEmail);
    setPassword(config.demoPassword);
  };

  const isAgence = variant === 'agence';
  const BadgeIcon = config.badgeIcon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* ─── LEFT: Immersive Visual Panel ─── */}
      <div className="relative hidden lg:flex lg:w-[55%] xl:w-[58%] min-h-screen items-center justify-center overflow-hidden">
        {/* Background Image */}
        <Image
          src={config.bgImage}
          alt="QRBag"
          fill
          className="object-cover"
          priority
          sizes="58vw"
        />

        {/* Multi-layer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/40" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${config.accentColor}33 0%, transparent 50%, ${config.accentColor}22 100%)` }} />

        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Top: Logo + Badge */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <div className="w-14 h-14 rounded-2xl backdrop-blur-xl p-1.5 border border-white/20 flex items-center justify-center group-hover:bg-white/15 transition-all duration-300">
                <img src="/logo.png" alt="QRBag" className="w-full h-full object-contain" />
              </div>
            </Link>

            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase backdrop-blur-xl border ${
              isAgence
                ? 'bg-blue-500/15 border-blue-400/20 text-blue-300'
                : 'bg-blue-800/20 border-blue-600/20 text-blue-200'
            }`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              {config.badgeText}
            </span>
          </div>

          {/* Middle: Title + Subtitle */}
          <div className="max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-5 leading-tight">
              {config.leftTitle}
            </h2>
            <p className="text-white/65 text-lg xl:text-xl leading-relaxed max-w-md">
              {config.leftSubtitle}
            </p>
          </div>

          {/* Bottom: Feature Cards */}
          <div className="grid grid-cols-2 gap-3">
            {config.features.map((feat, i) => (
              <div
                key={feat.title}
                className="group bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <feat.icon className="w-5 h-5 text-white/50 mb-2.5 group-hover:text-white/70 transition-colors" />
                <p className="text-white text-sm font-semibold leading-tight mb-1">{feat.title}</p>
                <p className="text-white/40 text-xs leading-snug">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Form Panel ─── */}
      <div className="w-full lg:w-[45%] xl:w-[42%] min-h-screen flex items-center justify-center bg-white px-6 py-12 sm:px-10 relative">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30 blur-[120px] pointer-events-none" style={{ background: config.accentGlow }} />

        <div className="w-full max-w-[420px] relative z-10">

          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-18 h-18 rounded-2xl p-1.5 mb-3 flex items-center justify-center" style={{ background: config.accentLight }}>
              <img src="/logo.png" alt="QRBag" className="w-full h-full object-contain" />
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mt-2`} style={{ background: config.accentLight, color: config.accentColor }}>
              <BadgeIcon className="w-3.5 h-3.5" />
              {config.badgeText}
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="hidden lg:flex items-center gap-2 mb-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase`} style={{ background: config.accentLight, color: config.accentColor }}>
                <BadgeIcon className="w-3.5 h-3.5" />
                {config.badgeText}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {config.title}
            </h1>
            <p className="text-slate-500 text-sm">{config.subtitle}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-red-500 text-sm">!</span>
              </div>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adresse email
              </label>
              <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                focusedField === 'email' ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}>
                <div className={`pl-4 transition-colors ${focusedField === 'email' ? 'text-slate-900' : 'text-slate-400'}`}>
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-3 text-sm"
                  placeholder={variant === 'agence' ? 'vous@agence.com' : 'admin@qrbag.com'}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                focusedField === 'password' ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}>
                <div className={`pl-4 transition-colors ${focusedField === 'password' ? 'text-slate-900' : 'text-slate-400'}`}>
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-3 text-sm"
                  placeholder="Entrez votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer gap-2.5 group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border-2 border-slate-300 peer-checked:border-transparent transition-colors group-hover:border-slate-400 peer-hover:border-slate-400" style={{ borderColor: rememberMe ? config.accentColor : undefined }}>
                  </div>
                  {rememberMe && (
                    <CheckCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white" style={{ color: config.accentColor }} />
                  )}
                </div>
                <span className="text-sm text-slate-500">Se souvenir de moi</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: config.accentColor }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentHover})`,
                boxShadow: `0 8px 24px ${config.accentColor}33`,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Demo Account */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5" />
                Compte de démonstration
              </h3>
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs font-semibold transition-colors px-3 py-1 rounded-lg hover:opacity-80"
                style={{ color: config.accentColor, background: config.accentLight }}
              >
                Remplir
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: config.accentLight, color: config.accentColor }}>
                {config.demoLabel}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {config.demoEmail} / {config.demoPassword}
              </span>
            </div>
          </div>

          {/* Switch */}
          <div className="mt-8 text-center text-sm text-slate-500">
            {config.switchText}{' '}
            <Link
              href={config.switchHref}
              className="font-semibold transition-colors hover:underline"
              style={{ color: config.accentColor }}
            >
              {config.switchLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
