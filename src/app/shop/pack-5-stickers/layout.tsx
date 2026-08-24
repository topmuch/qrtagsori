import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pack 5 étiquettes QR — 3 000 FCFA",
  description: "Pack de 5 étiquettes QR QRTags à 3 000 FCFA. Le plus populaire. Protégez bagages, clés, sac, lunettes. Alerte WhatsApp. Livraison Afrique et France.",
  openGraph: { title: "Pack 5 étiquettes QR — 3 000 FCFA", description: "Pack de 5 étiquettes QR QRTags à 3 000 FCFA. Le plus populaire. Protégez bagages, clés, sac, lunettes. Alerte WhatsApp. Livraison Afrique et France.", url: "https://qrtags.com/shop/pack-5-stickers", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Pack 5 étiquettes QR — 3 000 FCFA", description: "Pack de 5 étiquettes QR QRTags à 3 000 FCFA. Le plus populaire. Protégez bagages, clés, sac, lunettes. Alerte WhatsApp. Livraison Afrique et France.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/shop/pack-5-stickers" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Pack 5 étiquettes QR — 3 000 FCFA", url: "https://qrtags.com/shop/pack-5-stickers", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Boutique", item: "https://qrtags.com/shop" }, { "@type": "ListItem", position: 3, name: "Pack 5 étiquettes QR — 3 000 FCFA", item: "https://qrtags.com/shop/pack-5-stickers" }] } }) }} />{children}</>);
}
