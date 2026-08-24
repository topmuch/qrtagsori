import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pack 3 étiquettes QR — 1 500 FCFA",
  description: "Pack de 3 étiquettes QR QRTags à 1 500 FCFA. Stickers résistants à l'eau et UV. Activation 30 secondes, alerte WhatsApp. Livraison Afrique et France.",
  openGraph: { title: "Pack 3 étiquettes QR — 1 500 FCFA", description: "Pack de 3 étiquettes QR QRTags à 1 500 FCFA. Stickers résistants à l'eau et UV. Activation 30 secondes, alerte WhatsApp. Livraison Afrique et France.", url: "https://qrtags.com/shop/pack-3-stickers", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Pack 3 étiquettes QR — 1 500 FCFA", description: "Pack de 3 étiquettes QR QRTags à 1 500 FCFA. Stickers résistants à l'eau et UV. Activation 30 secondes, alerte WhatsApp. Livraison Afrique et France.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/shop/pack-3-stickers" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Pack 3 étiquettes QR — 1 500 FCFA", url: "https://qrtags.com/shop/pack-3-stickers", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Boutique", item: "https://qrtags.com/shop" }, { "@type": "ListItem", position: 3, name: "Pack 3 étiquettes QR — 1 500 FCFA", item: "https://qrtags.com/shop/pack-3-stickers" }] } }) }} />{children}</>);
}
