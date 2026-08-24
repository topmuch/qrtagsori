import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QRTags pour Écoles — Gestion des objets perdus",
  description: "Réduisez les objets perdus dans votre école avec QRTags. Étiquettes QR pour cartables, trousses, calculatrices. Tableau de bord pour le personnel.",
  openGraph: { title: "QRTags pour Écoles — Gestion des objets perdus", description: "Réduisez les objets perdus dans votre école avec QRTags. Étiquettes QR pour cartables, trousses, calculatrices. Tableau de bord pour le personnel.", url: "https://qrtags.com/metiers/ecoles", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "QRTags pour Écoles — Gestion des objets perdus", description: "Réduisez les objets perdus dans votre école avec QRTags. Étiquettes QR pour cartables, trousses, calculatrices. Tableau de bord pour le personnel.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/metiers/ecoles" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "QRTags pour Écoles — Gestion des objets perdus", url: "https://qrtags.com/metiers/ecoles", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Solutions professionnels", item: "https://qrtags.com/metiers" }, { "@type": "ListItem", position: 3, name: "Écoles — Gestion des objets perdus", item: "https://qrtags.com/metiers/ecoles" }] } }) }} />{children}</>);
}
