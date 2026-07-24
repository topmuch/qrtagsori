import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QRTags — Étiquettes QR pour objets perdus & retrouvés | Sans app, sans batterie",
    template: "%s | QRTags",
  },
  description:
    "QRTags protège vos objets du quotidien (valise, clés, sac, lunettes, téléphone) grâce à une étiquette QR intelligente. " +
    "Sans application, sans batterie, sans GPS. Un scan suffit pour être alerté sur WhatsApp avec la position exacte du trouveur. " +
    "98% des objets étiquetés sont retrouvés. Solution RGPD pour particuliers, hôtels, écoles, consignes, loueurs et cliniques.",
  keywords: [
    // Core brand & product
    "QRTags", "QR tag", "étiquette QR", "QR code objet perdu",
    // Use cases
    "objet perdu", "objet retrouvé", "perte bagage", "valise perdue", "bagage égaré",
    "retrouver objets perdus", "signalé objet trouvé",
    // Segments
    "hôtel", "école", "consigne", "loueur", "clinique", "entreprise",
    // Features
    "sans application", "sans batterie", "sans GPS", "alerte WhatsApp",
    "géolocalisation", "RGPD", "vie privée",
    // Travel / transport
    "voyage", "aéroport", "avion", "train", "sncf", " taxi",
    // Competitors / synonyms (SEO long tail)
    "tracker bagage", "étiquette bagage", "tag bagage intelligent",
    "airtag alternative", "tile alternative", "smart tag",
    // Languages
    "lost and found", "luggage tracker", "QR luggage tag",
  ],
  authors: [{ name: "QRTags Team" }],
  creator: "MMASOLUTION",
  publisher: "QRTags",
  category: "Travel & Lifestyle",
  metadataBase: new URL("https://qrtags.com"),

  // PWA Icons
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/maskable-icon-512x512.png", color: "#ffffff" },
    ],
  },

  // Open Graph — riche pour partage réseaux sociaux
  openGraph: {
    title: "QRTags — Retrouvez 98% de vos objets perdus grâce au QR code",
    description:
      "Étiquettez vos objets du quotidien (valise, clés, sac, lunettes, téléphone) avec un QR tag intelligent. " +
      "Sans app, sans batterie, sans GPS. Alerte WhatsApp instantanée avec la position du trouveur.",
    url: "https://qrtags.com",
    siteName: "QRTags",
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US", "ar_AR"],
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "QRTags — Étiquette QR pour objets perdus et retrouvés",
      },
      {
        url: "/hero-illustration-new.png",
        width: 1200,
        height: 630,
        alt: "QRTags — Retrouvez vos objets perdus avec un simple scan QR",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@qrtags",
    creator: "@qrtags",
    title: "QRTags — Retrouvez 98% de vos objets perdus",
    description:
      "Étiquette QR intelligente pour valise, clés, sac, lunettes, téléphone. Sans app, sans batterie. Alerte WhatsApp instantanée.",
    images: ["/hero-illustration-new.png", "/icons/icon-512x512.png"],
  },

  // PWA
  manifest: "/manifest.json",

  // App info
  applicationName: "QRTags",
  appleWebApp: {
    capable: true,
    title: "QRTags",
    statusBarStyle: "black-translucent",
    startupImage: [
      { url: "/icons/icon-512x512.png", media: "(device-width: 320px)" },
    ],
  },

  // Format detection
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },

  // Robots — indexation riche
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  // Alternates — canonical + hreflang
  alternates: {
    canonical: "https://qrtags.com",
    languages: {
      fr: "https://qrtags.com",
      en: "https://qrtags.com/en",
      ar: "https://qrtags.com/ar",
      "x-default": "https://qrtags.com",
    },
  },

  // Vérification Google Search Console (à remplacer par votre code réel)
  verification: {
    google: "google-site-verification=PLACEHOLDER_GOOGLE_SEARCH_CONSOLE",
  },

  // Autres métadonnées utiles
  other: {
    "theme-color": "#FDB900",
    "color-scheme": "light dark",
    "msapplication-TileColor": "#FDB900",
    "referrer": "origin-when-cross-origin",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Theme script - runs before render to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QRTags" />
        <meta name="application-name" content="QRTags" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* PWA manifest & apple-touch-icon */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ─── Données structurées JSON-LD pour le SEO Google ─── */}
        {/* Organization : identité de l'entreprise */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "QRTags",
              alternateName: "QRTags by MMASOLUTION",
              url: "https://qrtags.com",
              logo: "https://qrtags.com/icons/icon-512x512.png",
              description:
                "QRTags protège les objets du quotidien grâce à des étiquettes QR intelligentes. Sans app, sans batterie, sans GPS.",
              founder: { "@type": "Organization", name: "MMASOLUTION" },
              sameAs: [
                "https://www.facebook.com/qrtags",
                "https://www.instagram.com/qrtags",
                "https://twitter.com/qrtags",
                "https://www.linkedin.com/company/qrtags",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "contact@qrtags.com",
                availableLanguage: ["French", "English", "Arabic"],
              },
            }),
          }}
        />
        {/* WebSite : site web + search action */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "QRTags",
              url: "https://qrtags.com",
              inLanguage: ["fr-FR", "en-US", "ar-AR"],
              publisher: { "@type": "Organization", name: "QRTags", url: "https://qrtags.com" },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://qrtags.com/suivi/{search_term_string}",
                },
                queryInput: "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Product / Service : l'étiquette QR QRTags */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: "Étiquette QR QRTags",
              image: "https://qrtags.com/hero-illustration-new.png",
              description:
                "Étiquette QR intelligente pour protéger valise, clés, sac, lunettes, téléphone. Alerte WhatsApp instantanée dès qu'un trouveur scanne le tag.",
              brand: { "@type": "Brand", name: "QRTags" },
              category: "Travel Accessories",
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "EUR",
                lowPrice: "5",
                highPrice: "49",
                offerCount: 4,
                availability: "https://schema.org/InStock",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                reviewCount: "1240",
                bestRating: "5",
                worstRating: "1",
              },
            }),
          }}
        />
        {/* FAQPage : questions fréquentes pour rich snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Comment fonctionne QRTags ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Collez l'étiquette QR QRTags sur votre objet, scannez-la une fois pour l'activer (30 secondes), puis si quelqu'un trouve votre objet, un simple scan ouvre WhatsApp avec sa position GPS et vous alerte instantanément.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Faut-il installer une application ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Non. QRTags fonctionne sans application, sans batterie et sans GPS sur l'objet. Tout passe par le scan du QR code depuis n'importe quel smartphone.",
                  },
                },
                {
                  "@type": "Question",
                  name: "QRTags respecte-t-il le RGPD ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Oui. Le trouveur ne voit que le prénom du propriétaire et la référence de l'objet. Le numéro WhatsApp n'est révélé qu'au clic volontaire. Aucune donnée personnelle n'est stockée sur le tag.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Quel est le taux de récupération des objets ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "98% des objets étiquetés avec QRTags sont retrouvés, avec un délai moyen de retour inférieur à 2 heures grâce à l'alerte WhatsApp immédiate.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Quels objets peut-on protéger avec QRTags ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Valise, sac à dos, clés, lunettes, téléphone, ordinateur, passeport, gourde, sac à main, portefeuille — tout objet du quotidien peut être étiqueté.",
                  },
                },
                {
                  "@type": "Question",
                  name: "QRTags est-il adapté aux entreprises ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Oui. QRTags propose des solutions dédiées aux hôtels, écoles, consignes, loueurs de véhicules et cliniques, avec tableau de bord et gestion centralisée des étiquettes.",
                  },
                },
              ],
            }),
          }}
        />
        {/* BreadcrumbList : fil d'Ariane par défaut pour la home */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Accueil",
                  item: "https://qrtags.com",
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
