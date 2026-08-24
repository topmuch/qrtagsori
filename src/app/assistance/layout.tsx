import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assistance QRTags — Aide, FAQ, support objets perdus",
  description: "Besoin d'aide avec QRTags ? Consultez notre FAQ, guide d'activation et contactez notre support en français, anglais et arabe. Service disponible en France, Afrique et Europe.",
  openGraph: { title: "Assistance QRTags — Aide, FAQ, support objets perdus", description: "Besoin d'aide avec QRTags ? Consultez notre FAQ, guide d'activation et contactez notre support en français, anglais et arabe. Service disponible en France, Afrique et Europe.", url: "https://qrtags.com/assistance/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Assistance QRTags — Aide, FAQ, support objets perdus", description: "Besoin d'aide avec QRTags ? Consultez notre FAQ, guide d'activation et contactez notre support en français, anglais et arabe. Service disponible en France, Afrique et Europe.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/assistance/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Assistance QRTags", url: "https://qrtags.com/assistance", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Assistance", item: "https://qrtags.com/assistance" }] } }) }} />{children}</>);
}
