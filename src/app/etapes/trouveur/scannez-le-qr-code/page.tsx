'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  QrCode,
  Smartphone,
  Camera,
  Zap,
  Clock,
  Wifi,
  Battery,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Apple,
  CheckCircle2,
} from 'lucide-react';
import { PublicNavigation, PublicFooter } from '@/components/public/PublicLayout';

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ScannezLeQrCodePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-amber-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-amber-700 mb-5">
                <QrCode className="w-3.5 h-3.5" /> Étape 2 sur 4 · Parcours trouveur
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Scannez le
                <br />
                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">QR code</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Un simple scan avec votre téléphone — aucune application à installer, pas besoin de
                batterie ou de GPS sur l&apos;objet. Tous les smartphones modernes (iPhone, Android)
                savent scanner un QR code nativement via l&apos;appareil photo. Voici comment
                procéder en moins de 5 secondes.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/etapes/trouveur/contactez-le-proprietaire"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105"
                >
                  Voir l&apos;étape suivante <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/etapes/trouveur/vous-trouvez-un-objet"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
                >
                  <ChevronLeft className="w-4 h-4" /> Étape précédente
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100 aspect-[3/4] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-white shadow-xl flex items-center justify-center relative">
                      <QrCode className="w-20 h-20 text-amber-600" />
                      {/* corners */}
                      <div className="absolute top-2 left-2 w-5 h-5 border-t-4 border-l-4 border-amber-600 rounded-tl-lg" />
                      <div className="absolute top-2 right-2 w-5 h-5 border-t-4 border-r-4 border-amber-600 rounded-tr-lg" />
                      <div className="absolute bottom-2 left-2 w-5 h-5 border-b-4 border-l-4 border-amber-600 rounded-bl-lg" />
                      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-4 border-r-4 border-amber-600 rounded-br-lg" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-2">Ouvrez l&apos;appareil photo</p>
                    <p className="text-slate-500">et visez le QR code</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: '5 secondes', desc: 'Le temps de sortir votre téléphone et de viser le QR' },
              { icon: Apple, title: '0 application', desc: 'Appareil photo natif, sur iPhone comme Android' },
              { icon: Battery, title: '0 batterie requise', desc: 'Pas de GPS ni de Bluetooth sur l\'objet' },
              { icon: Wifi, title: 'Hors-ligne OK', desc: 'Le scan marche même sans connexion (la page s\'ouvrira après)' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="bg-amber-50/40 rounded-2xl p-6 border border-amber-100 h-full">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-lg font-black text-slate-900 mb-1">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Comment scanner selon votre téléphone */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-amber-700 mb-4">
              <Smartphone className="w-3.5 h-3.5" /> Selon votre téléphone
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Comment scanner selon votre smartphone
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              La méthode varie légèrement entre iPhone et Android, mais dans tous les cas c&apos;est
              intégré nativement — aucune application à télécharger.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* iPhone */}
            <FadeIn>
              <div className="bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <Apple className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Sur iPhone</h3>
                    <p className="text-xs text-slate-500">iOS 11 et supérieur</p>
                  </div>
                </div>
                <ol className="space-y-4">
                  {[
                    'Ouvrez l\'application Appareil photo (icône grise avec un objectif).',
                    'Visez le QR code avec l\'objectif arrière, en le plaçant bien au centre de l\'écran.',
                    'Une notification jaune apparaît en haut de l\'écran avec le nom du site QRTags.',
                    'Tapez sur cette notification : la page d\'alerte s\'ouvre dans Safari.',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700 leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </FadeIn>

            {/* Android */}
            <FadeIn delay={0.1}>
              <div className="bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Sur Android</h3>
                    <p className="text-xs text-slate-500">Samsung, Pixel, Xiaomi, Huawei…</p>
                  </div>
                </div>
                <ol className="space-y-4">
                  {[
                    'Ouvrez l\'application Appareil photo.',
                    'Visez le QR code avec le mode Photo. Sur certains modèles, activez "Scan QR" dans les paramètres de l\'appareil photo.',
                    'Une vignette apparaît en bas avec l\'URL qrtags.com/scan/...',
                    'Tapez dessus : la page d\'alerte s\'ouvre dans Chrome ou votre navigateur par défaut.',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700 leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.3} className="mt-8">
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Et si l&apos;appareil photo ne reconnaît pas le QR code&nbsp;?
                  </p>
                  <p className="text-sm text-slate-600">
                    Sur les modèles plus anciens, ouvrez simplement Google Lens (icône objectif dans
                    Google, ou dans l&apos;appareil photo sur Android) et visez le QR code. Sur
                    iPhone, vous pouvez aussi ouvrir l&apos;app Lecteur de code QR dans les Réglages
                    &gt; Centre de contrôle.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Que se passe-t-il après le scan ? */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Que se passe-t-il après le scan&nbsp;?
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              En moins de 5 secondes, votre téléphone ouvre une page web QRTags qui va tout
              déclencher automatiquement.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Clock,
                title: '0 à 2 secondes',
                description:
                  'Le scan déclenche l\'ouverture de l\'URL qrtags.com/scan/QRT26-XXXXXX dans votre navigateur. La page charge instantanément, même en 3G.',
                color: 'from-amber-500 to-yellow-600',
              },
              {
                step: '2',
                icon: Camera,
                title: '2 à 4 secondes',
                description:
                  'La page affiche un message de bienvenue : "Bonjour, vous avez trouvé un objet QRTags". Elle vous propose de contacter le propriétaire via WhatsApp en un clic.',
                color: 'from-yellow-500 to-orange-500',
              },
              {
                step: '3',
                icon: CheckCircle2,
                title: '4 à 5 secondes',
                description:
                  'Vous êtes prêt à passer à l\'étape 3 : contacter le propriétaire. Tout est pré-rempli, vous n\'avez plus qu\'à appuyer sur "Envoyer".',
                color: 'from-orange-500 to-red-500',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.12}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-xl hover:shadow-amber-100/40 transition-all duration-500 h-full">
                  <span
                    className={`inline-flex w-11 h-11 bg-gradient-to-br ${item.color} text-white text-sm font-bold rounded-xl items-center justify-center shadow-lg mb-6`}
                  >
                    {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Questions fréquentes sur le scan
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Tout ce qui peut bloquer un scan, et comment le résoudre.
            </p>
          </FadeIn>

          <div className="space-y-4">
            {[
              {
                q: 'Le scan ne fonctionne pas, que faire ?',
                r: 'Vérifiez d\'abord l\'éclairage : si l\'objet est dans l\'ombre, activez le flash de l\'appareil photo. Essuyez le QR code s\'il est sale ou mouillé. Rapprochez-vous à environ 15-20 cm du QR code. Enfin, sur les vieux Android, installez l\'application gratuite "QR Code Reader" depuis le Play Store.',
              },
              {
                q: 'Le QR code est endommagé (déchiré, rayé), est-ce grave ?',
                r: 'Les QR codes QRTags sont conçus avec une correction d\'erreur de niveau H (haute), ce qui permet de lire le code même s\'il est partiellement endommagé (jusqu\'à 30% de surface altérée). Si vraiment le scan échoue, notez la référence imprimée sous le QR (format QRT26-XXXXXX) et entrez-la directement sur qrtags.com/scan.',
              },
              {
                q: 'Le scan nécessite-t-il une connexion internet ?',
                r: 'Le scan en lui-même (lecture du QR par l\'appareil photo) fonctionne hors-ligne. En revanche, l\'ouverture de la page QRTags nécessite une connexion (4G, 5G, WiFi). Si vous êtes hors-ligne au moment du scan, notez la référence et ouvrez la page plus tard.',
              },
              {
                q: 'Dois-je payer pour scanner ?',
                r: 'Non, absolument rien. Le scan et l\'ouverture de la page sont 100% gratuits pour le trouveur. QRTags est un service citoyen : seuls les propriétaires paient (lorsqu\'ils commandent leurs tags). Vous, trouveur, vous ne payez rien.',
              },
              {
                q: 'Mes données personnelles sont-elles collectées quand je scanne ?',
                r: 'QRTags ne collecte que le strict minimum : la position GPS (si vous l\'autorisez au moment du scan), l\'heure, et la référence de l\'objet. Aucune information personnelle n\'est demandée au trouveur avant l\'envoi du message WhatsApp. Vous restez anonyme jusqu\'à ce que vous décidiez de contacter le propriétaire.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
                  <h3 className="text-base font-bold text-slate-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.r}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Prochaine étape */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-amber-500 via-orange-600 to-red-500 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-white/70 mb-4">
              Étape suivante
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">
              Contactez le propriétaire en 1 clic
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              La page s&apos;est ouverte, le message est pré-rempli avec votre position GPS. Voyons
              comment envoyer l&apos;alerte WhatsApp au propriétaire.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/etapes/trouveur/contactez-le-proprietaire"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-amber-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Étape 3 : Contactez le propriétaire <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/etapes/trouveur/vous-trouvez-un-objet"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 backdrop-blur text-white font-bold text-sm border border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4" /> Étape 1
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
