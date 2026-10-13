import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QRTags pour les professionnels — Solutions par métier",
  description: "Solutions QRTags adaptées : hôtels, écoles, consignes bagagerie, loueurs, cliniques et hôpitaux. Gestion centralisée des objets trouvés en France, Afrique et Europe.",
  openGraph: { title: "QRTags pour les professionnels — Solutions par métier", description: "Solutions QRTags adaptées : hôtels, écoles, consignes bagagerie, loueurs, cliniques et hôpitaux. Gestion centralisée des objets trouvés en France, Afrique et Europe.", url: "https://qrtags.com/metiers/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "QRTags pour les professionnels — Solutions par métier", description: "Solutions QRTags adaptées : hôtels, écoles, consignes bagagerie, loueurs, cliniques et hôpitaux. Gestion centralisée des objets trouvés en France, Afrique et Europe.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/metiers/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Solutions professionnels QRTags", url: "https://qrtags.com/metiers", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Solutions professionnels", item: "https://qrtags.com/metiers" }] } }) }} />{children}</>);
}
