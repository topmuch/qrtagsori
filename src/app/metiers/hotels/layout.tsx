import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QRTags pour Hôtels — Service objets trouvés automatisé",
  description: "Solution objets trouvés pour hôtels et résidences. QRTags automatise la gestion des objets perdus avec des étiquettes QR et un tableau de bord. France, Afrique, Europe.",
  openGraph: { title: "QRTags pour Hôtels — Service objets trouvés automatisé", description: "Solution objets trouvés pour hôtels et résidences. QRTags automatise la gestion des objets perdus avec des étiquettes QR et un tableau de bord. France, Afrique, Europe.", url: "https://qrtags.com/metiers/hotels", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "QRTags pour Hôtels — Service objets trouvés automatisé", description: "Solution objets trouvés pour hôtels et résidences. QRTags automatise la gestion des objets perdus avec des étiquettes QR et un tableau de bord. France, Afrique, Europe.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/metiers/hotels" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "QRTags pour Hôtels — Service objets trouvés automatisé", url: "https://qrtags.com/metiers/hotels", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Solutions professionnels", item: "https://qrtags.com/metiers" }, { "@type": "ListItem", position: 3, name: "Hôtels — Service objets trouvés automatisé", item: "https://qrtags.com/metiers/hotels" }] } }) }} />{children}</>);
}
