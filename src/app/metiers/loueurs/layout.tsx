import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QRTags pour Louveurs de véhicules — Protection",
  description: "Protégez vos véhicules de location avec QRTags. Étiquettes QR pour clés, documents et accessoires. Satisfaction client améliorée.",
  openGraph: { title: "QRTags pour Louveurs de véhicules — Protection", description: "Protégez vos véhicules de location avec QRTags. Étiquettes QR pour clés, documents et accessoires. Satisfaction client améliorée.", url: "https://qrtags.com/metiers/loueurs", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "QRTags pour Louveurs de véhicules — Protection", description: "Protégez vos véhicules de location avec QRTags. Étiquettes QR pour clés, documents et accessoires. Satisfaction client améliorée.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/metiers/loueurs" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "QRTags pour Louveurs de véhicules — Protection", url: "https://qrtags.com/metiers/loueurs", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Solutions professionnels", item: "https://qrtags.com/metiers" }, { "@type": "ListItem", position: 3, name: "Louveurs de véhicules — Protection", item: "https://qrtags.com/metiers/loueurs" }] } }) }} />{children}</>);
}
