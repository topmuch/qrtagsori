import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutique QRTags — Étiquettes QR anti-perte",
  description: "Achetez des étiquettes QR QRTags à partir de 1500 FCFA. Packs de 3, 5, 10 ou 15 stickers. Livraison en Afrique de l'Ouest et en France. Paiement à la livraison.",
  openGraph: { title: "Boutique QRTags — Étiquettes QR anti-perte", description: "Achetez des étiquettes QR QRTags à partir de 1500 FCFA. Packs de 3, 5, 10 ou 15 stickers. Livraison en Afrique de l'Ouest et en France. Paiement à la livraison.", url: "https://qrtags.com/shop/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Boutique QRTags — Étiquettes QR anti-perte", description: "Achetez des étiquettes QR QRTags à partir de 1500 FCFA. Packs de 3, 5, 10 ou 15 stickers. Livraison en Afrique de l'Ouest et en France. Paiement à la livraison.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/shop/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Boutique QRTags", url: "https://qrtags.com/shop", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Boutique", item: "https://qrtags.com/shop" }] } }) }} />{children}</>);
}
