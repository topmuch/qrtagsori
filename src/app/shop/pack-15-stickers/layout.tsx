import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pack 15 étiquettes QR — 5 500 FCFA",
  description: "Pack de 15 étiquettes QR QRTags à 5 500 FCFA. Le plus économique (367 FCFA/étiquette). Protection maximale famille et voyage.",
  openGraph: { title: "Pack 15 étiquettes QR — 5 500 FCFA", description: "Pack de 15 étiquettes QR QRTags à 5 500 FCFA. Le plus économique (367 FCFA/étiquette). Protection maximale famille et voyage.", url: "https://qrtags.com/shop/pack-15-stickers", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Pack 15 étiquettes QR — 5 500 FCFA", description: "Pack de 15 étiquettes QR QRTags à 5 500 FCFA. Le plus économique (367 FCFA/étiquette). Protection maximale famille et voyage.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/shop/pack-15-stickers" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Pack 15 étiquettes QR — 5 500 FCFA", url: "https://qrtags.com/shop/pack-15-stickers", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Boutique", item: "https://qrtags.com/shop" }, { "@type": "ListItem", position: 3, name: "Pack 15 étiquettes QR — 5 500 FCFA", item: "https://qrtags.com/shop/pack-15-stickers" }] } }) }} />{children}</>);
}
