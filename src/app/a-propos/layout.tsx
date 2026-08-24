import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos de QRTags — Plus aucun objet perdu",
  description: "Découvrez QRTags : la solution d'étiquettes QR intelligentes née à Dakar pour protéger les objets du quotidien en France, Afrique et Europe. Notre mission, notre équipe, nos valeurs.",
  openGraph: { title: "À propos de QRTags — Plus aucun objet perdu", description: "Découvrez QRTags : la solution d'étiquettes QR intelligentes née à Dakar pour protéger les objets du quotidien en France, Afrique et Europe. Notre mission, notre équipe, nos valeurs.", url: "https://qrtags.com/a-propos/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "À propos de QRTags — Plus aucun objet perdu", description: "Découvrez QRTags : la solution d'étiquettes QR intelligentes née à Dakar pour protéger les objets du quotidien en France, Afrique et Europe. Notre mission, notre équipe, nos valeurs.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/a-propos/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "À propos de QRTags", url: "https://qrtags.com/a-propos", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "À propos", item: "https://qrtags.com/a-propos" }] } }) }} />{children}</>);
}
