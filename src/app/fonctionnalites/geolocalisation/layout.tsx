import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Géolocalisation — Position GPS du trouveur",
  description: "Quand un trouveur scanne votre QR, sa position GPS est transmise via WhatsApp. Vous savez où se trouve votre objet perdu. France, Afrique, Europe.",
  openGraph: { title: "Géolocalisation — Position GPS du trouveur", description: "Quand un trouveur scanne votre QR, sa position GPS est transmise via WhatsApp. Vous savez où se trouve votre objet perdu. France, Afrique, Europe.", url: "https://qrtags.com/fonctionnalites/geolocalisation", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Géolocalisation — Position GPS du trouveur", description: "Quand un trouveur scanne votre QR, sa position GPS est transmise via WhatsApp. Vous savez où se trouve votre objet perdu. France, Afrique, Europe.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/fonctionnalites/geolocalisation" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Géolocalisation — Position GPS du trouveur", url: "https://qrtags.com/fonctionnalites/geolocalisation", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Fonctionnalités", item: "https://qrtags.com/fonctionnalites" }, { "@type": "ListItem", position: 3, name: "Géolocalisation — Position GPS du trouveur", item: "https://qrtags.com/fonctionnalites/geolocalisation" }] } }) }} />{children}</>);
}
