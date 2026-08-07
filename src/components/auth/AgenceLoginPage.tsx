'use client';

import { useState, useEffect } from 'react';
import QRTagsLogo from "@/components/qrtags/QRTagsLogo";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Building2,
  QrCode,
  Heart,
  HandHelping,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Fingerprint,
  Sparkles,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   DATA — Messaging orienté mission & retrouvaille
   ══════════════════════════════════════════════════════════ */

const STATS = [
  { value: '98%', label: 'Objets retrouvés' },
  { value: '< 2h', label: 'Délai moyen retour' },
  { value: '850+', label: 'Agences partenaires' },
  { value: '3 langues', label: 'FR · EN · AR' },
];

const TESTIMONIALS = [
  {
    name: 'Amira Bensaïd',
    role: 'Voyageuse, Marseille',
    text: 'Ma valise égarée à l\'aéroport a été retrouvée en 3h grâce à un QR tag. Sans ça, j\'aurais attendu des jours.',
    type: 'owner',
  },
  {
    name: 'Lucas Dupont',
    role: 'Étudiant, Lyon',
    text: 'J\'ai trouvé un sac avec un QR tag dans le métro. J\'ai scanné, WhatsApp s\'est ouvert. Le propriétaire m\'a contacté en 5 min.',
    type: 'finder',
  },
];

const SUCCESS_STORIES = [
  {
    emoji: '🧳',
    title: 'Valise retrouvée',
    location: 'Aéroport Marseille',
    time: '3h',
  },
  {
    emoji: '📱',
    title: 'Téléphone rendu',
    location: 'Gare de Lyon',
    time: '45 min',
  },
  {
    emoji: '🔑',
    title: 'Clés récupérées',
    location: 'Café Le Marais',
    time: '1h20',
  },
];

/* ══════════════════════════════════════════════════════════
   FLOATING ICON — animation douce
   ══════════════════════════════════════════════════════════ */

function FloatingIcon({
  icon: Icon,
  className,
  delay = 0,
  duration = 6,
}: {
  icon: React.ElementType;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0.06, 0.14, 0.06],
        scale: [0.85, 1.05, 0.85],
        y: [0, -14, 0],
        rotate: [0, 6, -3, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Icon className="w-full h-full" strokeWidth={1.2} />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   ANIMATED TESTIMONIAL — avec badge type
   ══════════════════════════════════════════════════════════ */

function AnimatedTestimonial({
  testimonial,
  isActive,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  isActive: boolean;
}) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={testimonial.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="space-y-3"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
            style={{
              background: testimonial.type === 'finder' ? 'rgba(34,197,94,0.2)' : 'rgba(253,185,0,0.2)',
              color: testimonial.type === 'finder' ? '#4ADE80' : '#FDB900',
            }}
          >
            {testimonial.type === 'finder' ? '🤝 Trouveur' : '💼 Propriétaire'}
          </div>
          <p className="text-white/60 text-sm italic leading-relaxed">
            &ldquo;{testimonial.text}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: testimonial.type === 'finder' ? '#22C55E' : '#FDB900',
                color: testimonial.type === 'finder' ? 'white' : '#0d0d0f',
              }}
            >
              <span className="text-xs font-bold">
                {testimonial.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>
            <div>
              <p className="text-white/85 text-xs font-medium">
                {testimonial.name}
              </p>
              <p className="text-white/35 text-[10px]">{testimonial.role}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════
   SUCCESS CARD — mini story animée
   ══════════════════════════════════════════════════════════ */

function SuccessCard({ emoji, title, location, time }: (typeof SUCCESS_STORIES)[number]) {
  return (
    <motion.div
      className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.06] border border-white/[0.08]"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="text-lg">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-xs font-bold">{title}</p>
        <p className="text-white/30 text-[10px]">{location}</p>
      </div>
      <div className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] font-bold">
        {time}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function AgenceLoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading, isAgency, isSuperAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (user && isAgency) {
      router.replace('/agence/tableau-de-bord');
    }
  }, [user, authLoading, isAgency, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'agency' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        router.push('/agence/tableau-de-bord');
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
    setEmail('agence@qrtags.com');
    setPassword('agence123');
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ══════════════════════════════════════════════════
          LEFT PANEL — Warm Mission-Driven (desktop only)
          ══════════════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-[52%] min-h-screen flex-col overflow-hidden">
        {/* Base gradient — noir avec accents jaune/vert */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#111111] to-[#0d0d0f]" />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-[#FDB900]/20"
          />
        </div>

        {/* Animated warm orbs */}
        <div className="absolute top-[12%] -left-16 w-[340px] h-[340px] rounded-full bg-[#FDB900]/15 blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-[25%] right-[-40px] w-[400px] h-[400px] rounded-full bg-[#22C55E]/8 blur-[120px] animate-pulse"
          style={{ animationDelay: '1.2s' }}
        />
        <div
          className="absolute top-[55%] left-[35%] w-[500px] h-[500px] rounded-full bg-[#FDB900]/5 blur-[150px] animate-pulse"
          style={{ animationDelay: '2.4s' }}
        />
        <div
          className="absolute bottom-[5%] left-[15%] w-[200px] h-[200px] rounded-full bg-[#22C55E]/6 blur-[100px] animate-pulse"
          style={{ animationDelay: '0.6s' }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(253,185,0,0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(253,185,0,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Floating icons — warm/mission */}
        <FloatingIcon icon={HandHelping} className="top-[18%] right-[12%] w-14 h-14 text-green-400/40" delay={0} duration={7} />
        <FloatingIcon icon={Heart} className="top-[32%] left-[8%] w-11 h-11 text-yellow-300/40" delay={1.5} duration={8} />
        <FloatingIcon icon={CheckCircle2} className="bottom-[28%] right-[18%] w-12 h-12 text-green-300/40" delay={2.8} duration={6.5} />
        <FloatingIcon icon={QrCode} className="top-[60%] left-[22%] w-10 h-10 text-yellow-400/40" delay={0.8} duration={9} />
        <FloatingIcon icon={MapPin} className="bottom-[42%] left-[55%] w-8 h-8 text-green-400/40" delay={3.5} duration={7.5} />
        <FloatingIcon icon={MessageCircle} className="top-[10%] left-[42%] w-7 h-7 text-yellow-300/40" delay={4.2} duration={8.5} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Top: Logo */}
          <div className="flex items-center">
            <Link href="/" className="group">
              <motion.div
                className="w-[76px] h-[76px] rounded-2xl bg-white/[0.08] backdrop-blur-md p-2.5 border border-white/[0.12] flex items-center justify-center group-hover:bg-white/[0.14] transition-all duration-300 shadow-xl shadow-black/10"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <QRTagsLogo size="md" variant="light" />
              </motion.div>
            </Link>
          </div>

          {/* Middle: Hero — mission-driven */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* QR + Heart illustration */}
            <motion.div
              className="relative mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FDB900] to-[#E3B23C] flex items-center justify-center shadow-2xl shadow-amber-600/40">
                <QrCode className="w-10 h-10 text-[#0d0d0f]" />
              </div>
              {/* Heart badge */}
              <div
                className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center shadow-lg animate-bounce"
                style={{ animationDelay: '0.4s' }}
              >
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div
                className="absolute -bottom-1.5 -right-5 w-3.5 h-3.5 rounded-full bg-yellow-300/70 animate-bounce"
                style={{ animationDelay: '1s' }}
              />
            </motion.div>

            <motion.h2
              className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              Chaque objet
              <br />
              <span className="bg-gradient-to-r from-[#FDB900] via-[#FDB900] to-[#22C55E] bg-clip-text text-transparent">
                retrouvé, c&apos;est
              </span>
              <br />
              un sourire.
            </motion.h2>

            <motion.p
              className="text-white/50 text-lg leading-relaxed mb-8 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              Votre agence connecte les trouveurs aux propriétaires.
              Gérez vos QR tags, vos bagages et vos clients depuis un
              tableau de bord simple et efficace.
            </motion.p>

            {/* Success stories */}
            <motion.div
              className="space-y-2.5 mb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-1">Retouvailles récentes</p>
              {SUCCESS_STORIES.map((story, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <SuccessCard {...story} />
                </motion.div>
              ))}
            </motion.div>

            {/* Stats row */}
            <motion.div
              className="grid grid-cols-4 gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {STATS.map((stat, i) => (
                <div key={i} className="text-center py-3 rounded-xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.06]">
                  <p className="text-white font-bold text-lg xl:text-xl"
                    style={{ color: i === 0 ? '#22C55E' : 'white' }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-white/30 text-[10px] xl:text-xs mt-1 leading-tight px-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom: Testimonial */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="border-l-2 pl-5"
              style={{ borderColor: 'rgba(253, 185, 0, 0.5)' }}
            >
              <div className="min-h-[80px]">
                {TESTIMONIALS.map((t, i) => (
                  <AnimatedTestimonial
                    key={t.name}
                    testimonial={t}
                    isActive={i === activeTestimonial}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-1.5 mt-4">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  aria-label={`Témoignage ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial
                      ? 'bg-[#FDB900] w-4'
                      : 'bg-white/20 w-1.5 hover:bg-white/35'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          RIGHT PANEL — Clean Warm Form
          ══════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[48%] min-h-screen flex items-center justify-center bg-[#FFF8E7] px-6 py-12 sm:px-10 relative">
        {/* Warm gradient accent at top */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, #111111, #FDB900, #22C55E, #FDB900, #111111)',
          }}
        />

        {/* Decorative warm circles */}
        <div className="absolute top-[10%] right-[-80px] w-[300px] h-[300px] rounded-full bg-[#FDB900]/10 blur-[80px]" />
        <div className="absolute bottom-[15%] left-[-60px] w-[200px] h-[200px] rounded-full bg-[#22C55E]/5 blur-[60px]" />

        <motion.div
          className="w-full max-w-[400px] relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile Logo */}
          <motion.div
            className="lg:hidden flex items-center justify-center mb-8"
            variants={itemVariants}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FDB900] to-[#E3B23C] p-2 flex items-center justify-center shadow-lg shadow-amber-600/20">
              <QRTagsLogo size="md" variant="light" />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div className="flex items-center gap-2 mb-6" variants={itemVariants}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0d0d0f] text-[#FDB900] shadow-sm">
              <Building2 className="w-3 h-3" />
              Agence
            </span>
          </motion.div>

          {/* Header — welcoming */}
          <motion.div className="mb-8" variants={itemVariants}>
            <h1 className="text-3xl font-bold text-[#0d0d0f] tracking-tight mb-2">
              Bonjour, agence 👋
            </h1>
            <p className="text-[#525252] text-sm leading-relaxed">
              Connectez-vous pour gérer vos tags, vos bagages et
              vos retrouvailles. Chaque connexion, c&apos;est un objet qui rentre.
            </p>
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            variants={itemVariants}
          >
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#525252] uppercase tracking-wider mb-2">
                Email
              </label>
              <div
                className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                  focusedField === 'email'
                    ? 'border-[#FDB900] bg-white ring-4 ring-[#FDB900]/10'
                    : 'border-[#e5e5e5] bg-white hover:border-[#ccc]'
                }`}
              >
                <div
                  className={`pl-4 transition-colors duration-200 ${
                    focusedField === 'email' ? 'text-[#c89a00]' : 'text-[#525252]/40'
                  }`}
                >
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-none outline-none text-[#0d0d0f] placeholder-[#525252]/40 py-3.5 px-3 text-sm"
                  placeholder="vous@agence.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-[#525252] uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div
                className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                  focusedField === 'password'
                    ? 'border-[#FDB900] bg-white ring-4 ring-[#FDB900]/10'
                    : 'border-[#e5e5e5] bg-white hover:border-[#ccc]'
                }`}
              >
                <div
                  className={`pl-4 transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-[#c89a00]' : 'text-[#525252]/40'
                  }`}
                >
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-none outline-none text-[#0d0d0f] placeholder-[#525252]/40 py-3.5 px-3 text-sm"
                  placeholder="Entrez votre mot de passe"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 text-[#525252]/40 hover:text-[#c89a00] transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer gap-2 group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#e5e5e5] text-[#FDB900] focus:ring-[#FDB900]/20 cursor-pointer"
                />
                <span className="text-sm text-[#525252] group-hover:text-[#0d0d0f] transition-colors">
                  Se souvenir de moi
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#c89a00] hover:text-[#0d0d0f] transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.01 }}
              whileTap={loading ? {} : { scale: 0.98 }}
              className="w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm bg-gradient-to-r from-[#0d0d0f] to-[#1a1a1a] hover:from-[#1a1a1a] hover:to-[#0d0d0f] shadow-lg shadow-black/20 hover:shadow-xl relative overflow-hidden group"
            >
              {/* Shimmer */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-[#FDB900]/10 to-transparent" />
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Demo account card removed for production */}

          {/* Switch to Admin */}
          <motion.div
            className="mt-8 text-center text-sm text-[#525252]"
            variants={itemVariants}
          >
            Vous êtes administrateur ?{' '}
            <Link
              href="/admin/connexion"
              className="font-semibold text-[#c89a00] hover:text-[#0d0d0f] transition-colors"
            >
              Connexion SuperAdmin
            </Link>
          </motion.div>

          {/* Bottom links */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-4 text-xs text-[#525252]/60"
            variants={itemVariants}
          >
            <Link
              href="/cgu"
              className="hover:text-[#c89a00] transition-colors"
            >
              CGU
            </Link>
            <span className="text-[#e5e5e5]">•</span>
            <Link
              href="/confidentialite"
              className="hover:text-[#c89a00] transition-colors"
            >
              Confidentialité
            </Link>
            <span className="text-[#e5e5e5]">•</span>
            <Link
              href="/contact"
              className="hover:text-[#c89a00] transition-colors"
            >
              Aide
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
