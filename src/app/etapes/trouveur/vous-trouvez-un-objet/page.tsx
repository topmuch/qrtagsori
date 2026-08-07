'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Eye,
  Search,
  HandHelping,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Plane,
  Car,
  Coffee,
  ShoppingBag,
  Briefcase,
  Smartphone,
  Key,
  Glasses,
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

const LIEUX = [
  { icon: Plane, label: 'Aéroport', desc: 'Salle d\'embarquement, tapis bagage, salon VIP' },
  { icon: Car, label: 'Taxi / VTC', desc: 'Banquette arrière, coffre, plage arrière' },
  { icon: Coffee, label: 'Café / Restaurant', desc: 'Table, comptoir, toilettes, vestiaire' },
  { icon: ShoppingBag, label: 'Magasin / Mall', desc: 'Caddie, cabine d\'essayage, caisse' },
  { icon: MapPin, label: 'Dans la rue', desc: 'Trottoir, abri bus, parc, plage' },
  { icon: Briefcase, label: 'Bureau / Hôtel', desc: 'Réception, salle de réunion, chambre' },
];

const OBJETS = [
  { icon: Briefcase, label: 'Valise / Bagage' },
  { icon: Key, label: 'Trousseau de clés' },
  { icon: ShoppingBag, label: 'Sac à main / Sac à dos' },
  { icon: Glasses, label: 'Lunettes / Étui' },
  { icon: Smartphone, label: 'Téléphone / Tablette' },
  { icon: Briefcase, label: 'Portefeuille / Passeport' },
];

export default function VousTrouvezUnObjetPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-yellow-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-yellow-700 mb-5">
                <Eye className="w-3.5 h-3.5" /> Étape 1 sur 4 · Parcours trouveur
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Vous trouvez
                <br />
                <span className="bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">un objet perdu</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Dans la rue, à l&apos;aéroport, dans un taxi, au café… Vous découvrez un objet abandonné
                et vous remarquez un autocollant QRTags avec un QR code. Bonne nouvelle : en quelques
                secondes, vous allez pouvoir prévenir son propriétaire et lui rendre son bien. Ce
                guide vous explique exactement quoi faire, étape par étape.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/etapes/trouveur/scannez-le-qr-code"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold text-sm shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all duration-300 hover:scale-105"
                >
                  Voir l&apos;étape suivante <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/#comment"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
                >
                  Retour à l&apos;accueil
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-yellow-200/40 to-amber-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100 aspect-[3/4] bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white shadow-xl flex items-center justify-center">
                      <Eye className="w-12 h-12 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-2">Vous repérez</p>
                    <p className="text-slate-500">un objet avec un QR tag QRTags</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Où trouve-t-on des objets perdus ? */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-yellow-700 mb-4">
              <MapPin className="w-3.5 h-3.5" /> Où ça se passe
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Les lieux où l&apos;on trouve le plus d&apos;objets perdus
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              QRTags est utilisé partout. Voici les contextes les plus fréquents où vous pourriez
              tomber sur un objet perdu portant un QR tag.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {LIEUX.map((lieu, i) => (
              <FadeIn key={lieu.label} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:shadow-xl hover:shadow-yellow-100/40 transition-all duration-500 h-full">
                  <div className="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center mb-4">
                    <lieu.icon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{lieu.label}</h3>
                  <p className="text-sm text-slate-500">{lieu.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Que faire quand on repère l'objet ? */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              3 réflexes quand vous repérez l&apos;objet
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Avant même de scanner, voici les bons gestes pour agir efficacement et protéger
              l&apos;objet en attendant de contacter son propriétaire.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Eye,
                title: 'Repérez le QR tag',
                description:
                  'Cherchez un autocollant jaune et noir avec le mot QRTags et un QR code. Il peut être collé sur n\'importe quelle face de l\'objet : étiquette de valise, dos de téléphone, intérieur de portefeuille, trousseau de clés. Le tag fait généralement 3 à 5 cm de côté.',
                color: 'from-yellow-500 to-amber-600',
              },
              {
                step: '2',
                icon: Search,
                title: 'Examinez l\'objet',
                description:
                  'Notez mentalement où vous l\'avez trouvé (quartier, point de repère), l\'heure approximative, et l\'état de l\'objet. Ces informations seront utiles au propriétaire. Ne fouillez pas l\'objet : respectez la vie privée de son propriétaire, le QR tag suffit à le contacter.',
                color: 'from-amber-500 to-orange-600',
              },
              {
                step: '3',
                icon: HandHelping,
                title: 'Préparez-vous à scanner',
                description:
                  'Sortez votre téléphone, vérifiez que l\'appareil photo fonctionne. Vous n\'avez besoin de rien d\'autre : pas d\'application à installer, pas de compte à créer. L\'étape suivante vous guide pour scanner en toute simplicité.',
                color: 'from-orange-500 to-red-500',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.12}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 h-full">
                  <span
                    className={`inline-flex w-11 h-11 bg-gradient-to-br ${item.color} text-white text-sm font-bold rounded-xl items-center justify-center shadow-lg mb-6`}
                  >
                    {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Quels objets sont équipés ? */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Quels objets sont équipés d&apos;un QR tag&nbsp;?
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Les utilisateurs QRTags collent un tag sur tous les objets du quotidien qu&apos;ils
              veulent pouvoir retrouver. Voici les plus courants.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {OBJETS.map((objet, i) => (
              <FadeIn key={objet.label} delay={i * 0.06}>
                <div className="bg-yellow-50/50 rounded-2xl p-5 text-center border border-yellow-100 hover:bg-yellow-50 transition-all duration-300">
                  <objet.icon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">{objet.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3} className="text-center mt-12">
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              Vous ne voyez pas de QR tag sur l&apos;objet que vous avez trouvé&nbsp;? Il s&apos;agit
              peut-être d&apos;un objet non protégé. Dans ce cas, déposez-le au plus vite au bureau
              des objets trouvés le plus proche (mairie, gare, aéroport, commissariat).
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Questions fréquentes
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Tout ce que vous devez savoir avant de scanner le QR code.
            </p>
          </FadeIn>

          <div className="space-y-4">
            {[
              {
                q: 'Comment reconnaître un QR tag QRTags ?',
                r: 'Le tag QRTags est un autocollant (généralement jaune et noir, mais il existe d\'autres coloris) portant la marque QRTags, un QR code unique, et une référence du type QRT26-XXXXXX. Il fait entre 3 et 5 cm de côté et peut être collé sur n\'importe quelle surface : valise, téléphone, clés, lunettes, sac, etc.',
              },
              {
                q: 'Que faire si l\'objet n\'a pas de QR tag ?',
                r: 'Si l\'objet n\'est pas équipé d\'un tag QRTags, vous ne pourrez pas contacter directement son propriétaire. La marche à suivre est de déposer l\'objet au bureau des objets trouvés le plus proche : mairie, gare SNCF, aéroport, commissariat de police. Vous pouvez aussi publier une annonce sur les groupes locaux ou les réseaux sociaux.',
              },
              {
                q: 'Puis-je garder l\'objet chez moi en attendant ?',
                r: 'Oui, c\'est même recommandé si vous êtes pressé. Scannez le QR tag, contactez le propriétaire, et convenez d\'un rendez-vous pour lui remettre l\'objet. Ne laissez jamais l\'objet sans surveillance à l\'endroit où vous l\'avez trouvé : il pourrait être volé ou définitivement perdu.',
              },
              {
                q: 'Suis-je obligé de rendre l\'objet ?',
                r: 'Légalement, garder un objet trouvé sans tenter de le rendre constitue un délit (recel ou soustraction). QRTags facilite grandement la démarche de restitution : un simple scan suffit à prévenir le propriétaire. La grande majorité des trouveurs rendent l\'objet dans les 24h, souvent avec un sentiment de satisfaction citoyenne.',
              },
              {
                q: 'Y a-t-il une récompense pour le trouveur ?',
                r: 'QRTags ne verse aucune récompense automatique, mais le propriétaire peut, s\'il le souhaite, offrir un geste commercial au trouveur (café, petit cadeau, participation financière). C\'est entre eux deux. L\'esprit QRTags est avant tout citoyen : rendre un objet perdu est un geste simple et humain.',
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
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-600 relative overflow-hidden">
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
              Prêt à scanner le QR code&nbsp;?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Vous avez repéré l&apos;objet et son QR tag&nbsp;? Voyons maintenant comment le scanner
              en 5 secondes, sans application, sans inscription.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/etapes/trouveur/scannez-le-qr-code"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-amber-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Étape 2 : Scannez le QR code <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#comment"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 backdrop-blur text-white font-bold text-sm border border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4" /> Retour
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
