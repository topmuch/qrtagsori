import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import TravelerProvider from "@/components/providers/TravelerProvider";
import { PWARegister } from "@/components/PWARegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:
      "QRTags — Étiquette QR objets perdus & retrouvés | France, Afrique, Europe | 98% rendus",
    template: "%s | QRTags",
  },
  description:
    "QRTags protège vos objets du quotidien (valise, clés, sac, lunettes, téléphone, ordinateur, passeport) grâce à une étiquette QR intelligente. " +
    "Sans application, sans batterie, sans GPS. Un scan suffit pour être alerté sur WhatsApp avec la position exacte du trouveur. " +
    "98% des objets étiquetés sont retrouvés en moins de 2h. " +
    "Disponible en France (Paris, Lyon, Marseille, Toulouse, Bordeaux, Nice), en Afrique (Dakar, Abidjan, Bamako, Ouagadougou, Lomé, Cotonou, Conakry) et en Europe (Bruxelles, Genève, Londres, Madrid, Rome, Berlin). " +
    "Solution RGPD pour particuliers, hôtels, écoles, consignes, loueurs et cliniques. " +
    "Livraison en Afrique de l\'Ouest et en France. Paiement à la livraison disponible.",
  keywords: [
    "QRTags", "QR tag", "étiquette QR", "QR code objet perdu", "étiquette QR code",
    "tag QR", "sticker QR", "autocollant QR", "QR perdu", "QR retrouvé",
    "étiquette QR anti-perte", "étiquette QR intelligente", "étiquette QR bagage",
    "objet perdu", "objet retrouvé", "objet trouvé", "objets trouvés",
    "perte bagage", "valise perdue", "valise égarée", "valise retrouvée",
    "bagage égaré", "bagage perdu", "bagage retrouvé",
    "retrouver objets perdus", "signaler objet trouvé", "service objets trouvés",
    "bureau des objets trouvés", "objet perdu avion", "objet perdu aéroport",
    "objet perdu train", "objet perdu gare", "objet perdu métro",
    "clés perdues", "téléphone perdu", "sac perdu", "sac à dos perdu",
    "lunettes perdues", "passeport perdu", "portefeuille perdu", "ordinateur perdu",
    "comment retrouver un objet perdu", "que faire si on trouve un objet",
    "comment retrouver ses clés", "comment retrouver une valise perdue",
    "comment protéger ses objets en voyage", "comment éviter de perdre ses affaires",
    "étiquette valise", "étiquette bagage", "étiquette clés", "étiquette téléphone",
    "tracker bagage", "tracker objets", "localiser objet perdu",
    "objet perdu aéroport Paris CDG", "objet perdu aéroport Orly",
    "objet perdu gare du Nord", "objet perdu métro parisien", "objet perdu SNCF",
    "valise perdue aéroport", "bagage perdu compagnie aérienne",
    "sncf objets trouvés", "ratp objets trouvés",
    "objet perdu Paris", "objet perdu Lyon", "objet perdu Marseille",
    "objet perdu Toulouse", "objet perdu Bordeaux", "objet perdu Nice",
    "objet perdu Nantes", "objet perdu Strasbourg", "objet perdu Montpellier",
    "objet perdu Lille", "objet perdu Rennes", "objet perdu Reims",
    "étiquette bagage France", "objets trouvés Paris",
    "Sénégal", "Dakar", "objet perdu Dakar", "objet trouvé Dakar",
    "Côte d\'Ivoire", "Abidjan", "objet perdu Abidjan",
    "Mali", "Bamako", "Burkina Faso", "Ouagadougou",
    "Togo", "Lomé", "Bénin", "Cotonou", "Guinée", "Conakry", "Niger", "Niamey",
    "Afrique de l\'Ouest", "CEDEAO", "Afrique",
    "Maroc", "Casablanca", "Tunisie", "Tunis", "Algérie", "Alger",
    "Cameroun", "Douala", "Congo", "RDC",
    "Belgique", "Bruxelles", "objet perdu Bruxelles",
    "Suisse", "Genève", "objet perdu Suisse",
    "Royaume-Uni", "Londres", "objet perdu Londres",
    "Espagne", "Madrid", "Italie", "Rome", "Allemagne", "Berlin",
    "Portugal", "Lisbonne", "Pays-Bas", "Amsterdam", "Europe",
    "sans application", "sans batterie", "sans GPS", "alerte WhatsApp",
    "géolocalisation", "RGPD", "vie privée",
    "hôtel objets trouvés", "école objets perdus", "consigne bagagerie",
    "loueur véhicule", "clinique objets trouvés",
    "airtag alternative", "tile alternative", "airtag pas cher",
    "étiquette bagage intelligente", "localisateur objet",
    "Orange Money", "Wave", "MTN Mobile Money",
    "livraison Dakar", "livraison Abidjan", "livraison Afrique",
    "lost and found", "luggage tracker", "QR luggage tag", "lost item tracker",
    "smart luggage tag", "travel tag", "bag finder", "lost luggage",
    "ملصق QR", "أشياء ضائعة", "تتبع الأمتعة", "رمز QR للحقائب",
  ],
  authors: [{ name: "QRTags Team" }, { name: "MMASOLUTION" }],
  creator: "MMASOLUTION",
  publisher: "QRTags",
  category: "Travel & Lifestyle",
  metadataBase: new URL("https://qrtags.com"),
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/maskable-icon-512x512.png", color: "#FDB900" },
    ],
  },
  openGraph: {
    title: "QRTags — Étiquette QR pour objets perdus | 98% retrouvés en moins de 2h",
    description:
      "Protégez vos objets (valise, clés, sac, lunettes, téléphone) avec une étiquette QR intelligente. " +
      "Sans app, sans batterie. Alerte WhatsApp avec la position GPS du trouveur. " +
      "Disponible en France, Afrique et Europe. 98% des objets retrouvés.",
    url: "https://qrtags.com",
    siteName: "QRTags",
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US", "ar_AR"],
    images: [
      { url: "/icons/icon-512x512.png", width: 512, height: 512, alt: "QRTags — Étiquette QR objets perdus France Afrique Europe" },
      { url: "/hero-illustration-new.png", width: 1200, height: 630, alt: "QRTags — Retrouvez vos objets perdus avec un simple scan QR" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@qrtags",
    creator: "@qrtags",
    title: "QRTags — Retrouvez 98% de vos objets perdus grâce au QR code",
    description: "Étiquette QR intelligente. Sans app, sans batterie. Alerte WhatsApp instantanée. France, Afrique, Europe.",
    images: ["/hero-illustration-new.png", "/icons/icon-512x512.png"],
  },
  manifest: "/manifest.json",
  applicationName: "QRTags",
  appleWebApp: { capable: true, title: "QRTags", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: true, email: true, address: true },
  robots: {
    index: true, follow: true, nocache: false,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  alternates: {
    canonical: "https://qrtags.com",
    languages: {
      fr: "https://qrtags.com",
      "fr-fr": "https://qrtags.com",
      "fr-sn": "https://qrtags.com",
      "fr-ci": "https://qrtags.com",
      "fr-ml": "https://qrtags.com",
      "fr-be": "https://qrtags.com",
      "fr-ch": "https://qrtags.com",
      en: "https://qrtags.com/en",
      "en-gb": "https://qrtags.com/en",
      ar: "https://qrtags.com/ar",
      "ar-ma": "https://qrtags.com/ar",
      "ar-tn": "https://qrtags.com/ar",
      "ar-dz": "https://qrtags.com/ar",
      "x-default": "https://qrtags.com",
    },
  },
  verification: { google: "google-site-verification=PLACEHOLDER_GOOGLE_SEARCH_CONSOLE" },
  other: {
    "theme-color": "#FDB900",
    "color-scheme": "light dark",
    "msapplication-TileColor": "#FDB900",
    "referrer": "origin-when-cross-origin",
    "format-detection": "telephone=no",
    "geo.region": "FR,SN,CI,ML,BF,MA,TN,DZ,BE,CH,DE,GB,ES,IT,PT,NL",
    "geo.placename": "Dakar, Sénégal",
    "geo.position": "14.7167;-17.4677",
    "ICBM": "14.7167, -17.4677",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(!t)t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t}catch(e){}})();` }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QRTags" />
        <meta name="application-name" content="QRTags" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* JSON-LD: Organization */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "QRTags", alternateName: ["QRTags by MMASOLUTION", "QRTags - Étiquettes QR intelligentes"], url: "https://qrtags.com", logo: "https://qrtags.com/icons/icon-512x512.png", description: "QRTags protège les objets du quotidien grâce à des étiquettes QR intelligentes. Sans app, sans batterie. Alerte WhatsApp instantanée. 98% retrouvés. France, Afrique, Europe.", slogan: "98% des objets étiquetés sont retrouvés en moins de 2h", foundingDate: "2024", founder: { "@type": "Organization", name: "MMASOLUTION" }, knowsLanguage: ["fr", "en", "ar"], sameAs: ["https://www.facebook.com/qrtags", "https://www.instagram.com/qrtags", "https://twitter.com/qrtags", "https://www.linkedin.com/company/qrtags", "https://www.youtube.com/@qrtags"], contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "contact@qrtags.com", availableLanguage: ["French", "English", "Arabic"] } }) }} />
        {/* JSON-LD: LocalBusiness multi-zone */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "LocalBusiness", "@id": "https://qrtags.com/#organization", name: "QRTags", url: "https://qrtags.com", telephone: "+221-77-000-00-00", priceRange: "1500-5500 FCFA", currenciesAccepted: "XOF, EUR", paymentAccepted: ["Cash", "Orange Money", "Wave", "MTN Mobile Money"], description: "Étiquettes QR intelligentes pour objets perdus et retrouvés. Sans application, sans batterie. Alerte WhatsApp avec géolocalisation.", address: { "@type": "PostalAddress", addressLocality: "Dakar", addressCountry: "SN" }, geo: { "@type": "GeoCoordinates", latitude: 14.7167, longitude: -17.4677 }, openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "08:00", closes: "20:00" }], areaServed: [{ "@type": "Country", name: "Sénégal" }, { "@type": "Country", name: "Côte d'Ivoire" }, { "@type": "Country", name: "Mali" }, { "@type": "Country", name: "Burkina Faso" }, { "@type": "Country", name: "Togo" }, { "@type": "Country", name: "Bénin" }, { "@type": "Country", name: "Guinée" }, { "@type": "Country", name: "Maroc" }, { "@type": "Country", name: "Tunisie" }, { "@type": "Country", name: "Algérie" }, { "@type": "Country", name: "Cameroun" }, { "@type": "Country", name: "France" }, { "@type": "Country", name: "Belgique" }, { "@type": "Country", name: "Suisse" }, { "@type": "Country", name: "Allemagne" }, { "@type": "Country", name: "Royaume-Uni" }, { "@type": "Country", name: "Espagne" }, { "@type": "Country", name: "Italie" }, { "@type": "Country", name: "Portugal" }, { "@type": "Country", name: "Pays-Bas" }], aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "1240", bestRating: "5", worstRating: "1" } }) }} />
        {/* JSON-LD: WebSite + SearchAction */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "QRTags", url: "https://qrtags.com", inLanguage: ["fr-FR", "en-US", "ar-AR"], publisher: { "@type": "Organization", name: "QRTags", url: "https://qrtags.com" }, potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: "https://qrtags.com/suivi/{search_term_string}" }, queryInput: "required name=search_term_string" } }) }} />
        {/* JSON-LD: Product */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: "Étiquette QR QRTags — Pack stickers anti-perte", image: ["https://qrtags.com/icons/icon-512x512.png", "https://qrtags.com/hero-illustration-new.png"], description: "Étiquette QR intelligente pour protéger valise, clés, sac, lunettes, téléphone. Alerte WhatsApp instantanée. 98% retrouvés. France, Afrique, Europe.", brand: { "@type": "Brand", name: "QRTags" }, category: "Travel Accessories", offers: [{ "@type": "Offer", name: "Pack 3 Stickers", price: "1500", priceCurrency: "XOF", availability: "https://schema.org/InStock", url: "https://qrtags.com/shop/pack-3-stickers" }, { "@type": "Offer", name: "Pack 5 Stickers", price: "3000", priceCurrency: "XOF", availability: "https://schema.org/InStock", url: "https://qrtags.com/shop/pack-5-stickers" }, { "@type": "Offer", name: "Pack 10 Stickers", price: "4000", priceCurrency: "XOF", availability: "https://schema.org/InStock", url: "https://qrtags.com/shop/pack-10-stickers" }, { "@type": "Offer", name: "Pack 15 Stickers", price: "5500", priceCurrency: "XOF", availability: "https://schema.org/InStock", url: "https://qrtags.com/shop/pack-15-stickers" }], aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "1240", bestRating: "5", worstRating: "1" } }) }} />
        {/* JSON-LD: Service */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Service", name: "Service d'étiquettes QR pour objets perdus et retrouvés", serviceType: "Protection et traçabilité d'objets perdus par QR code", provider: { "@type": "Organization", name: "QRTags", url: "https://qrtags.com" }, areaServed: { "@type": "GeoCircle", geoMidpoint: { "@type": "GeoCoordinates", latitude: 14.7167, longitude: -17.4677 }, geoRadius: "10000000" }, description: "Service d'étiquettes QR intelligentes permettant de contacter le propriétaire via WhatsApp avec position GPS. Sans application, sans batterie. France, Afrique, Europe.", offers: { "@type": "Offer", priceCurrency: "XOF", price: "1500", availability: "https://schema.org/InStock" } }) }} />
        {/* JSON-LD: HowTo */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "HowTo", name: "Comment retrouver un objet perdu avec une étiquette QR", description: "Guide pour protéger et retrouver vos objets perdus avec QRTags en France, Afrique et Europe.", totalTime: "PT2M", estimatedCost: { "@type": "MonetaryAmount", currency: "XOF", value: "1500" }, tool: [{ "@type": "HowToTool", name: "Étiquette QR QRTags" }, { "@type": "HowToTool", name: "Smartphone avec caméra" }], step: [{ "@type": "HowToStep", name: "Collez l'étiquette QR", text: "Collez l'étiquette QR QRTags sur votre valise, sac, clés ou lunettes.", position: 1 }, { "@type": "HowToStep", name: "Scannez pour activer", text: "Scannez le QR code, entrez votre prénom et numéro WhatsApp. 30 secondes.", position: 2 }, { "@type": "HowToStep", name: "Recevez l'alerte WhatsApp", text: "Si l'objet est trouvé, vous recevez une alerte WhatsApp avec la position GPS du trouveur.", position: 3 }, { "@type": "HowToStep", name: "Récupérez votre objet", text: "Contactez le trouveur via WhatsApp. 98% des objets sont retrouvés en moins de 2h.", position: 4 }] }) }} />
        {/* JSON-LD: FAQPage */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Comment fonctionne QRTags ?", acceptedAnswer: { "@type": "Answer", text: "Collez l'étiquette QR sur votre objet, scannez-la pour l'activer (30s). Si quelqu'un trouve votre objet, un scan ouvre WhatsApp avec sa position GPS. 98% retrouvés en moins de 2h." } }, { "@type": "Question", name: "Faut-il installer une application ?", acceptedAnswer: { "@type": "Answer", text: "Non. QRTags fonctionne sans application, sans batterie et sans GPS. Tout passe par le scan du QR code depuis n'importe quel smartphone." } }, { "@type": "Question", name: "QRTags est-il conforme au RGPD ?", acceptedAnswer: { "@type": "Answer", text: "Oui. Le trouveur ne voit que le prénom du propriétaire. Le numéro WhatsApp n'est révélé qu'au clic volontaire. Conforme RGPD pour la France et l'Europe." } }, { "@type": "Question", name: "Quel est le taux de récupération ?", acceptedAnswer: { "@type": "Answer", text: "98% des objets étiquetés avec QRTags sont retrouvés, avec un délai moyen inférieur à 2 heures grâce à l'alerte WhatsApp immédiate." } }, { "@type": "Question", name: "Quels objets peut-on protéger ?", acceptedAnswer: { "@type": "Answer", text: "Valise, sac à dos, clés, lunettes, téléphone, ordinateur, passeport, gourde, sac à main, portefeuille — tout objet du quotidien." } }, { "@type": "Question", name: "QRTags est-il adapté aux professionnels ?", acceptedAnswer: { "@type": "Answer", text: "Oui. Solutions pour hôtels, écoles, consignes, loueurs et cliniques avec tableau de bord centralisé. France, Afrique, Europe." } }, { "@type": "Question", name: "Combien coûtent les étiquettes ?", acceptedAnswer: { "@type": "Answer", text: "À partir de 1 500 FCFA pour 3 stickers. Packs: 3 (1500), 5 (3000), 10 (4000), 15 (5500). Livraison Afrique et France." } }, { "@type": "Question", name: "Où utiliser QRTags ?", acceptedAnswer: { "@type": "Answer", text: "Partout. Livraison en Afrique de l'Ouest (Sénégal, Côte d'Ivoire, Mali, etc.), Afrique du Nord (Maroc, Tunisie, Algérie), France et Europe." } }, { "@type": "Question", name: "Que faire si je trouve un objet QRTags ?", acceptedAnswer: { "@type": "Answer", text: "Scannez le QR code. La page s'ouvre avec le prénom du propriétaire. Cliquez WhatsApp pour envoyer votre position GPS. Aucune app requise." } }, { "@type": "Question", name: "QRTags est-il une alternative à Apple AirTag ?", acceptedAnswer: { "@type": "Answer", text: "Oui. Contrairement aux AirTags, QRTags ne nécessite ni batterie, ni application, ni Bluetooth. Fonctionne avec tous smartphones. Coûte beaucoup moins cher." } }] }) }} />
        {/* JSON-LD: BreadcrumbList */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }] }) }} />
        {/* JSON-LD: WebPage */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", "@id": "https://qrtags.com/#webpage", url: "https://qrtags.com", name: "QRTags — Étiquette QR pour objets perdus et retrouvés", description: "Protégez vos objets avec des étiquettes QR intelligentes. 98% de taux de récupération. France, Afrique, Europe.", isPartOf: { "@id": "https://qrtags.com/#website" }, inLanguage: "fr-FR" }) }} />
      </head>
      <body className={`${inter.variable} antialiased bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}>
        <ThemeProvider>
          <AuthProvider>
            <TravelerProvider>
              <PWARegister />
              {children}
              <Toaster />
            </TravelerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
