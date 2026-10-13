import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QRTags pour Cliniques — Gestion effets personnels",
  description: "Gérez les effets personnels des patients avec QRTags. Étiquettes QR pour dossiers, affaires, prothèses. Conforme RGPD.",
  openGraph: { title: "QRTags pour Cliniques — Gestion effets personnels", description: "Gérez les effets personnels des patients avec QRTags. Étiquettes QR pour dossiers, affaires, prothèses. Conforme RGPD.", url: "https://qrtags.com/metiers/cliniques", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "QRTags pour Cliniques — Gestion effets personnels", description: "Gérez les effets personnels des patients avec QRTags. Étiquettes QR pour dossiers, affaires, prothèses. Conforme RGPD.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/metiers/cliniques" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "QRTags pour Cliniques — Gestion effets personnels", url: "https://qrtags.com/metiers/cliniques", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Solutions professionnels", item: "https://qrtags.com/metiers" }, { "@type": "ListItem", position: 3, name: "Cliniques — Gestion effets personnels", item: "https://qrtags.com/metiers/cliniques" }] } }) }} />{children}</>);
}
