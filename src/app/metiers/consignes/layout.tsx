import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QRTags pour Consignes bagagerie — Traçabilité",
  description: "Solution de traçabilité pour consignes. QRTags suit chaque bagage avec des étiquettes QR. Réduction des réclamations.",
  openGraph: { title: "QRTags pour Consignes bagagerie — Traçabilité", description: "Solution de traçabilité pour consignes. QRTags suit chaque bagage avec des étiquettes QR. Réduction des réclamations.", url: "https://qrtags.com/metiers/consignes", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "QRTags pour Consignes bagagerie — Traçabilité", description: "Solution de traçabilité pour consignes. QRTags suit chaque bagage avec des étiquettes QR. Réduction des réclamations.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/metiers/consignes" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "QRTags pour Consignes bagagerie — Traçabilité", url: "https://qrtags.com/metiers/consignes", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Solutions professionnels", item: "https://qrtags.com/metiers" }, { "@type": "ListItem", position: 3, name: "Consignes bagagerie — Traçabilité", item: "https://qrtags.com/metiers/consignes" }] } }) }} />{children}</>);
}
