import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recevez vos étiquettes QR",
  description: "Commandez vos étiquettes QR QRTags. Livraison en Afrique de l'Ouest et France. Packs de 3, 5, 10 ou 15 stickers. Paiement à la livraison à Dakar.",
  openGraph: { title: "Recevez vos étiquettes QR", description: "Commandez vos étiquettes QR QRTags. Livraison en Afrique de l'Ouest et France. Packs de 3, 5, 10 ou 15 stickers. Paiement à la livraison à Dakar.", url: "https://qrtags.com/etapes/recevez-votre-qr", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Recevez vos étiquettes QR", description: "Commandez vos étiquettes QR QRTags. Livraison en Afrique de l'Ouest et France. Packs de 3, 5, 10 ou 15 stickers. Paiement à la livraison à Dakar.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/etapes/recevez-votre-qr" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Recevez vos étiquettes QR", url: "https://qrtags.com/etapes/recevez-votre-qr", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Comment ça marche", item: "https://qrtags.com/etapes" }, { "@type": "ListItem", position: 3, name: "Recevez vos étiquettes QR", item: "https://qrtags.com/etapes/recevez-votre-qr" }] } }) }} />{children}</>);
}
