'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Heart,
  Handshake,
  Clock,
  MapPin,
  Shield,
  Coffee,
  Gift,
  Smile,
  Star,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Award,
  Sparkles,
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

const TEMOIGNAGES = [
  {
    name: 'Aïssatou D.',
    city: 'Dakar',
    text: 'J\'ai trouvé un sac à main dans un taxi. Scanné le QR tag, message WhatsApp envoyé. La propriétaire m\'a rejointe 30 minutes plus tard au café. Elle était si reconnaissante qu\'elle m\'a offert le café et un petit cadeau. Une rencontre humaine super.',
    objet: 'Sac à main',
    delay: '30 min',
  },
  {
    name: 'Mamadou S.',
    city: 'Bamako',
    text: 'Valise oubliée à l\'aéroport. J\'ai scanné, le propriétaire était encore dans la zone d\'embarquement. Je lui ai rendu en 15 minutes. Il m\'a donné 10 000 FCFA en remerciement. QRTags, c\'est la solidarité numérique.',
    objet: 'Valise',
    delay: '15 min',
  },
  {
    name: 'Lucas M.',
    city: 'Marseille',
    text: 'Trouvé un trousseau de clés QRTags sur un banc. Scan, message, rendez-vous fixé 1h plus tard devant la mairie. Le propriétaire était soulagé : ses clés ouvraient son appartement et son bureau. Geste tout simple, énorme impact pour lui.',
    objet: 'Trousseau de clés',
    delay: '1 h',
  },
];

export default function ObjetEstRenduPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-emerald-700 mb-5">
                <Heart className="w-3.5 h-3.5" /> Étape 4 sur 4 · Parcours trouveur
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                L&apos;objet
                <br />
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">est rendu</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Le propriétaire sait exactement où vous êtes. Vous rendez l&apos;objet en 2h en
                moyenne. Un geste simple qui change une vie : vacances sauvées, travail retrouvé,
                souvenirs préservés. Voici comment finaliser la rencontre en toute sérénité.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/#tarifs"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
                >
                  Commander mes tags <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/etapes/trouveur/contactez-le-proprietaire"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
                >
                  <ChevronLeft className="w-4 h-4" /> Étape précédente
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-emerald-200/40 to-green-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100 aspect-[3/4] bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-white shadow-xl flex items-center justify-center">
                      <Handshake className="w-14 h-14 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 mb-2">2 h</p>
                    <p className="text-slate-500">délai moyen de restitution</p>
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100">
                      <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                      <span className="text-sm font-bold text-emerald-700">98% de succès</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Stats clés */}
      <section className="py-12 px-5 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '2 h', label: 'Délai moyen de restitution', icon: Clock },
              { value: '98%', label: 'Objets rendus avec QRTags', icon: CheckCircle2 },
              { value: '4 200+', label: 'Trouveurs satisfaits', icon: Smile },
              { value: '27 pays', label: 'Couverture QRTags', icon: MapPin },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 mx-auto">
                    <stat.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-slate-500 leading-tight">{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Comment rendre l'objet en sécurité */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-emerald-700 mb-4">
              <Shield className="w-3.5 h-3.5" /> Rencontre en sécurité
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Comment rendre l&apos;objet en toute sécurité
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              La rencontre doit être sereine pour vous comme pour le propriétaire. Voici les
              bonnes pratiques pour un échange réussi.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: MapPin,
                title: 'Choisissez un lieu public',
                description:
                  'Fixez rendez-vous dans un lieu fréquenté : café, mairie, commissariat, hall de gare, centre commercial. Évitez les endroits isolés ou privés (domicile, parking souterrain). La transparence protège les deux parties et rassure tout le monde.',
                color: 'from-emerald-500 to-green-600',
              },
              {
                step: '2',
                icon: Handshake,
                title: 'Vérifiez l\'identité du propriétaire',
                description:
                  'Demandez au propriétaire de décrire l\'objet (couleur, marque, contenu) avant de le lui remettre. S\'il hésite ou se trompe, méfiance. En cas de doute, demandez une pièce d\'identité. QRTags traque les usurpateurs : tout scan est tracé.',
                color: 'from-green-500 to-teal-600',
              },
              {
                step: '3',
                icon: Heart,
                title: 'Remettez l\'objet cordialement',
                description:
                  'Sourire, poignée de main, petit mot sympa. Vous venez de sauver la journée de quelqu\'un. Le propriétaire peut vous offrir un geste (café, petit cadeau) : acceptez si vous le souhaitez, refusez si vous préférez. Aucune obligation, c\'est l\'esprit citoyen avant tout.',
                color: 'from-teal-500 to-cyan-600',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.12}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-xl hover:shadow-emerald-100/40 transition-all duration-500 h-full">
                  <span
                    className={`inline-flex w-11 h-11 bg-gradient-to-br ${item.color} text-white text-sm font-bold rounded-xl items-center justify-center shadow-lg mb-6`}
                  >
                    {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages de trouveurs */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-emerald-700 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Témoignages
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Des trouveurs qui ont changé une vie
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Voici quelques histoires réelles de restitution d&apos;objets via QRTags.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMOIGNAGES.map((temoignage, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-3xl p-6 border border-emerald-100/60 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white font-bold flex items-center justify-center">
                      {temoignage.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{temoignage.name}</p>
                      <p className="text-xs text-slate-500">{temoignage.city}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">
                    « {temoignage.text} »
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-emerald-100/80">
                    <div>
                      <p className="text-xs text-slate-400">Objet rendu</p>
                      <p className="text-sm font-bold text-slate-900">{temoignage.objet}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Délai</p>
                      <p className="text-sm font-bold text-emerald-600">{temoignage.delay}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Le geste citoyen */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-emerald-700 mb-4">
                <Award className="w-3.5 h-3.5" /> Geste citoyen
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em]">
                Plus qu&apos;une restitution, un geste citoyen
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-6">
                Rendre un objet trouvé, c&apos;est plus qu&apos;une obligation légale. C&apos;est
                un acte de solidarité, de respect, d&apos;humanité. Dans un monde de plus en plus
                individuel, QRTags recrée du lien entre inconnus. Chaque restitution est une
                petite victoire contre la fatalité du « j&apos;ai perdu, c&apos;est mort ».
              </p>
              <p className="text-base text-slate-600 leading-relaxed mb-6">
                Et qui sait, la prochaine fois c&apos;est peut-être vous qui perdrez un objet. En
                adoptant QRTags aujourd&apos;hui — comme trouveur puis comme propriétaire — vous
                entrez dans une communauté de personnes qui se font confiance.
              </p>
              <Link
                href="/#tarifs"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all duration-300"
              >
                Protéger mes objets <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Coffee, title: 'Un café offert', desc: 'Le geste le plus courant', color: 'from-amber-400 to-orange-500' },
                  { icon: Gift, title: 'Un petit cadeau', desc: 'Pour les objets de valeur', color: 'from-pink-400 to-rose-500' },
                  { icon: Heart, title: 'Un merci sincère', desc: 'La meilleure récompense', color: 'from-red-400 to-pink-500' },
                  { icon: Smile, title: 'Le sourire', desc: 'Celui du propriétaire retrouvé', color: 'from-emerald-400 to-teal-500' },
                ].map((item, i) => (
                  <FadeIn key={i} delay={0.2 + i * 0.08}>
                    <div className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 text-white shadow-lg`}>
                      <item.icon className="w-8 h-8 mb-3" />
                      <p className="font-bold text-base mb-1">{item.title}</p>
                      <p className="text-xs text-white/80">{item.desc}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">
              Questions fréquentes sur la restitution
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Tout ce qu&apos;il faut savoir pour finaliser la rencontre sereinement.
            </p>
          </FadeIn>

          <div className="space-y-4">
            {[
              {
                q: 'Le propriétaire peut-il me verser une récompense ?',
                r: 'Oui, mais ce n\'est jamais obligatoire. QRTags ne fixe aucun montant. Le propriétaire peut offrir un café (le plus fréquent), un petit cadeau, ou une participation financière (surtout pour les objets de valeur comme un ordinateur ou des papiers d\'identité). Acceptez ou refusez librement.',
              },
              {
                q: 'Que faire si le propriétaire ne se présente pas au rendez-vous ?',
                r: 'Attendez 15 minutes, envoyez un message WhatsApp pour relancer. S\'il ne répond pas, vous pouvez rentrer chez vous avec l\'objet. QRTags vous suggère alors de déposer l\'objet au bureau des objets trouvés le plus proche et de le signaler via le bouton "Signaler un problème" sur la page d\'alerte.',
              },
              {
                q: 'Que se passe-t-il si l\'objet est endommagé pendant que je l\'ai ?',
                r: 'QRTags déconseille de manipuler l\'objet plus que nécessaire. Si malgré tout il s\'avère endommagé à la remise, soyez transparent avec le propriétaire. La plupart du temps, le propriétaire est juste reconnaissant d\'avoir récupéré son objet, peu importe son état. En cas de litige sérieux, QRTags peut médier.',
              },
              {
                q: 'Puis-je envoyer l\'objet par La Poste au propriétaire ?',
                r: 'Oui, si vous êtes loin (autre ville, autre pays) et que le propriétaire accepte, vous pouvez lui envoyer par colis. Convenez à l\'avance qui paie les frais de port. QRTags recommande un colis suivi et assuré pour les objets de valeur. Gardez le reçu jusqu\'à confirmation de réception.',
              },
              {
                q: 'Dois-je signaler à QRTags que l\'objet a été rendu ?',
                r: 'Ce n\'est pas obligatoire, mais c\'est apprécié. Sur la page d\'alerte, un bouton "Marquer comme rendu" permet de fermer le signalement. Cela aide QRTags à mesurer son impact (statistiques de restitution) et à améliorer le service. Vos retours restent anonymes.',
              },
              {
                q: 'Et si je veux devenir utilisateur QRTags après cette expérience ?',
                r: 'C\'est la meilleure suite ! Rendez-vous sur la page Tarifs, choisissez votre pack (3, 5, 10 ou 15 stickers), commandez en paiement à la livraison. Vous recevrez vos tags sous 48h à Dakar, sous 5 jours en Afrique de l\'Ouest. Bienvenue dans la communauté QRTags !',
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

      {/* CTA final */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-emerald-600 via-green-700 to-teal-700 relative overflow-hidden">
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
            <Award className="w-12 h-12 text-white/80 mx-auto mb-6" />
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-white/70 mb-4">
              Bravo, vous avez rendu un objet&nbsp;!
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">
              Et si vous protégiez vos propres objets&nbsp;?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Vous venez de vivre l&apos;expérience QRTags côté trouveur. Passez côté propriétaire
              : commandez vos stickers et collez-les sur vos objets précieux. Vous dormirez plus
              tranquille.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/#tarifs"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-emerald-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Commander mes tags <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#comment"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 backdrop-blur text-white font-bold text-sm border border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                Retour à l&apos;accueil <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
