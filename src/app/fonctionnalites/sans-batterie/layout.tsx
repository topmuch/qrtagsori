import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sans batterie — Étiquette QR qui dure toute la vie",
  description: "Les étiquettes QR QRTags fonctionnent sans batterie. Contrairement aux AirTags, nos stickers QR n'ont jamais besoin d'être rechargés. Durée de vie illimitée, résistants à l'eau et aux UV.",
  openGraph: { title: "Sans batterie — Étiquette QR qui dure toute la vie", description: "Les étiquettes QR QRTags fonctionnent sans batterie. Contrairement aux AirTags, nos stickers QR n'ont jamais besoin d'être rechargés. Durée de vie illimitée, résistants à l'eau et aux UV.", url: "https://qrtags.com/fonctionnalites/sans-batterie", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Sans batterie — Étiquette QR qui dure toute la vie", description: "Les étiquettes QR QRTags fonctionnent sans batterie. Contrairement aux AirTags, nos stickers QR n'ont jamais besoin d'être rechargés. Durée de vie illimitée, résistants à l'eau et aux UV.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/fonctionnalites/sans-batterie" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Sans batterie — Étiquette QR qui dure toute la vie", url: "https://qrtags.com/fonctionnalites/sans-batterie", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Fonctionnalités", item: "https://qrtags.com/fonctionnalites" }, { "@type": "ListItem", position: 3, name: "Sans batterie — Étiquette QR qui dure toute la vie", item: "https://qrtags.com/fonctionnalites/sans-batterie" }] } }) }} />{children}</>);
}
