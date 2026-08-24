import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fonctionnalités QRTags — Sans app, sans batterie, WhatsApp",
  description: "Découvrez toutes les fonctionnalités QRTags : alertes WhatsApp instantanées, pas d'application, pas de batterie, géolocalisation du trouveur, conformité RGPD.",
  openGraph: { title: "Fonctionnalités QRTags — Sans app, sans batterie, WhatsApp", description: "Découvrez toutes les fonctionnalités QRTags : alertes WhatsApp instantanées, pas d'application, pas de batterie, géolocalisation du trouveur, conformité RGPD.", url: "https://qrtags.com/fonctionnalites/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Fonctionnalités QRTags — Sans app, sans batterie, WhatsApp", description: "Découvrez toutes les fonctionnalités QRTags : alertes WhatsApp instantanées, pas d'application, pas de batterie, géolocalisation du trouveur, conformité RGPD.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/fonctionnalites/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Fonctionnalités QRTags", url: "https://qrtags.com/fonctionnalites", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Fonctionnalités", item: "https://qrtags.com/fonctionnalites" }] } }) }} />{children}</>);
}
