'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  MessageCircle,
  MapPin,
  Send,
  Shield,
  Lock,
  Eye,
  Clock,
  Navigation,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Phone,
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

export default function ContactezLeProprietairePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-green-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-green-700 mb-5">
                <MessageCircle className="w-3.5 h-3.5" /> Étape 3 sur 4 · Parcours trouveur
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Contactez le
                <br />
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">propriétaire</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                La page WAME (WhatsApp Message) s&apos;ouvre automatiquement avec votre position GPS.
                Un message WhatsApp pré-rempli est envoyé au propriétaire — vous n&apos;avez qu&apos;à
                appuyer sur Envoyer. Votre numéro reste invisible jusqu&apos;à ce que vous décidiez
                de le partager.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/etapes/trouveur/objet-est-rendu"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm shadow-xl shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
                >
                  Voir l&apos;étape suivante <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/etapes/trouveur/scannez-le-qr-code"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
                >
                  <ChevronLeft className="w-4 h-4" /> Étape précédente
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-green-200/40 to-emerald-200/40 rounded-[2rem] blur-[50px]" />
                {/* Mockup WhatsApp */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100 aspect-[3/4] bg-[#E5DDD5] flex flex-col">
                  <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Propriétaire QRTags</p>
                      <p className="text-xs text-white/70">en ligne</p>
                    </div>
                  </div>
                  <div className="flex-1 p-4 overflow-hidden">
                    <div className="bg-white rounded-xl p-3 shadow-sm max-w-[85%] mb-2">
                      <p className="text-sm text-slate-800">
                        🎉 Bonjour ! Un trouveur vient de scanner votre objet QRTags (réf. QRT26-MLQGY7).
                      </p>
                      <p className="text-[10px] text-slate-400 text-right mt-1">14:32</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm max-w-[85%] mb-2">
                      <p className="text-sm text-slate-800">
                        📍 Position GPS : <span className="text-green-600 underline">14.6928°N, 17.4467°W</span>
                      </p>
                      <p className="text-[10px] text-slate-400 text-right mt-1">14:32</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm max-w-[85%]">
                      <p className="text-sm text-slate-800">
                        💬 Message : « J&apos;ai trouvé votre valise à la gare. Disposé à vous la rendre. »
                      </p>
                      <p className="text-[10px] text-slate-400 text-right mt-1">14:32</p>
                    </div>
                  </div>
                  <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 bg-white rounded-full px-4 py-2">
                      <p className="text-xs text-slate-400">Message pré-rempli…</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Pourquoi WhatsApp ? */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-green-700 mb-4">
              <MessageCircle className="w-3.5 h-3.5" /> Pourquoi WhatsApp
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Pourquoi un message WhatsApp&nbsp;?
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              WhatsApp est utilisé par plus de 2 milliards de personnes dans le monde. En
              Afrique de l&apos;Ouest, c&apos;est le canal numéro 1 de communication. QRTags
              l&apos;utilise parce qu&apos;il est instantané, gratuit et universel.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: 'Instantané', desc: 'Le message arrive en moins de 5 secondes' },
              { icon: Shield, title: 'Anonyme', desc: 'Votre numéro n\'est visible qu\'après envoi' },
              { icon: MapPin, title: 'Géolocalisé', desc: 'Position GPS incluse automatiquement' },
              { icon: Phone, title: 'Universel', desc: 'Tout le monde a WhatsApp, aucun app supplémentaire' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100 h-full">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 mb-1">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Les 3 étapes du message */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              3 étapes pour envoyer le message
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Tout est pré-rempli. Vous n&apos;avez qu&apos;à valider et appuyer sur Envoyer.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Navigation,
                title: 'Autorisez la position GPS',
                description:
                  'Au moment d\'ouvrir la page, le navigateur vous demande "qrtags.com souhaite utiliser votre position". Acceptez : c\'est ce qui permet au propriétaire de savoir où se trouve son objet. La position est approximative (à 20-50 m près), pas de précision stalking.',
                color: 'from-green-500 to-emerald-600',
              },
              {
                step: '2',
                icon: Eye,
                title: 'Vérifiez le message pré-rempli',
                description:
                  'WhatsApp s\'ouvre avec un message déjà écrit : "Bonjour, j\'ai trouvé votre objet QRT26-XXXXXX à [position GPS]. Je peux vous le rendre. Cordialement." Vous pouvez modifier le texte avant d\'envoyer, par exemple pour préciser un lieu de rendez-vous.',
                color: 'from-emerald-500 to-teal-600',
              },
              {
                step: '3',
                icon: Send,
                title: 'Appuyez sur Envoyer',
                description:
                  'Une seule touche et le message part. Le propriétaire reçoit immédiatement un WhatsApp avec votre position et votre message. Il vous répondra en général dans les minutes qui suivent. Vous pouvez convenir ensemble du lieu de rendez-vous.',
                color: 'from-teal-500 to-cyan-600',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.12}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-xl hover:shadow-green-100/40 transition-all duration-500 h-full">
                  <span
                    className={`inline-flex w-11 h-11 bg-gradient-to-br ${item.color} text-white text-sm font-bold rounded-xl items-center justify-center shadow-lg mb-6`}
                  >
                    {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Vie privée du trouveur */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-green-700 mb-4">
                <Lock className="w-3.5 h-3.5" /> Vie privée
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em]">
                Votre numéro reste invisible
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-6">
                Tant que vous n&apos;avez pas appuyé sur "Envoyer" dans WhatsApp, le propriétaire ne
                connaît ni votre nom, ni votre numéro, ni votre position. QRTags ne stocke aucune
                information personnelle vous concernant — c&apos;est une promesse RGPD inscrite dans
                notre charte.
              </p>
              <p className="text-base text-slate-600 leading-relaxed mb-6">
                Une fois le message envoyé, le propriétaire vous voit comme un contact WhatsApp
                ordinaire. Vous pouvez à tout moment bloquer la conversation si nécessaire. La
                rencontre pour rendre l&apos;objet se fait toujours dans un lieu public, à votre
                convenance.
              </p>
              <div className="flex flex-wrap gap-3">
                {['RGPD conforme', 'Anonymat avant envoi', 'Position approximative (50 m)', 'Blocage possible'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200"
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100">
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="font-bold text-slate-900">Charte QRTags trouveur</p>
                  </div>
                  <ul className="space-y-3">
                    {[
                      'Aucune donnée personnelle collectée avant envoi',
                      'Position GPS floutée à ±50 m',
                      'Aucun cookie publicitaire tiers',
                      'Numéro WhatsApp jamais revendu',
                      'Droit à l\'oubli sur simple demande',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Questions fréquentes sur le contact
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Tout ce que vous devez savoir avant d&apos;envoyer le message WhatsApp.
            </p>
          </FadeIn>

          <div className="space-y-4">
            {[
              {
                q: 'Que faire si je n\'ai pas WhatsApp ?',
                r: 'QRTags propose aussi un envoi par SMS classique. Sur la page d\'alerte, vous verrez un bouton "Envoyer par SMS" à côté du bouton WhatsApp. Le message sera alors envoyé au propriétaire via votre opérateur (coût d\'un SMS normal selon votre forfait).',
              },
              {
                q: 'Le propriétaire va-t-il voir mon numéro de téléphone ?',
                r: 'Oui, mais uniquement après que vous avez envoyé le message WhatsApp. Avant l\'envoi, vous êtes totalement anonyme. Si vous ne souhaitez pas partager votre numéro principal, vous pouvez utiliser un numéro secondaire ou un WhatsApp Business distinct.',
              },
              {
                q: 'Que se passe-t-il si le propriétaire ne répond pas ?',
                r: 'Attendez 30 minutes, puis renvoyez un message court. Si après 24h il n\'a toujours pas répondu, contactez QRTags via le formulaire de la page d\'alerte : nous relançons le propriétaire par e-mail et SMS. En dernier recours, vous pouvez déposer l\'objet au bureau des objets trouvés le plus proche.',
              },
              {
                q: 'Ma position GPS est-elle précise à 1 mètre près ?',
                r: 'Non, QRTags floute volontairement la position à ±50 mètres pour protéger votre vie privée. Le propriétaire sait dans quel quartier vous êtes, mais pas votre adresse exacte. Vous pourrez préciser le lieu de rendez-vous par message une fois le contact établi.',
              },
              {
                q: 'Puis-je contacter le propriétaire par appel plutôt que par message ?',
                r: 'QRTags privilégie le message WhatsApp pour plusieurs raisons : trace écrite, asynchrone (le propriétaire peut répondre quand il est disponible), et anonymat relatif. L\'appel direct n\'est pas proposé par défaut, mais une fois le contact établi par message, vous pouvez bien sûr vous appeler mutuellement.',
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
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 relative overflow-hidden">
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
              Plus qu&apos;une étape : rendre l&apos;objet
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Le propriétaire a votre message. Vous allez convenir d&apos;un rendez-vous pour lui
              remettre l&apos;objet. Découvrez les bonnes pratiques pour une rencontre sereine.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/etapes/trouveur/objet-est-rendu"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-green-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Étape 4 : L&apos;objet est rendu <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/etapes/trouveur/scannez-le-qr-code"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 backdrop-blur text-white font-bold text-sm border border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4" /> Étape 2
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
