import type { Metadata } from 'next';

/**
 * Metadata SEO pour la page /avis
 * - Open Graph riche pour partage WhatsApp/Facebook
 * - Twitter Card
 * - Description ciblée sur les témoignages et le taux de récupération
 */
export const metadata: Metadata = {
  title: 'Avis clients & témoignages — Objets retrouvés avec QRTags',
  description:
    "Découvrez les avis authentiques des propriétaires qui ont retrouvé leurs objets grâce à QRTags. " +
    "Étoiles, photos des objets retrouvés, messages de remerciement. Publication immédiate, sans modération. " +
    "98% des objets étiquetés sont retrouvés en moins de 2h.",
  alternates: {
    canonical: 'https://qrtags.com/avis',
  },
  openGraph: {
    title: 'Avis QRTags — Témoignages de objets retrouvés',
    description:
      "Les propriétaires remercient les trouveurs : étoiles, photos, messages. " +
      "98% des objets étiquetés QRTags sont retrouvés.",
    url: 'https://qrtags.com/avis',
    siteName: 'QRTags',
    type: 'website',
    locale: 'fr_FR',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Avis QRTags — Témoignages objets retrouvés',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@qrtags',
    creator: '@qrtags',
    title: 'Avis QRTags — Objets retrouvés',
    description:
      "Témoignages authentiques de propriétaires qui ont retrouvé leurs objets grâce à QRTags.",
    images: ['/icons/icon-512x512.png'],
  },
  keywords: [
    'avis QRTags',
    'témoignages QRTags',
    'avis étiquette QR',
    'objet retrouvé témoignage',
    'bagage retrouvé avis',
    'QRTags fiable',
    '98% objets retrouvés',
    'avis étiquette bagage',
    ' QR code objet perdu avis',
  ],
};

export default function AvisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
