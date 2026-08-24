import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir partenaire QRTags — Hôtels, écoles, loueurs",
  description: "Devenez partenaire QRTags et offrez le service objets trouvés à vos clients. Solutions pour hôtels, écoles, consignes, loueurs et cliniques en France, Afrique et Europe.",
  openGraph: { title: "Devenir partenaire QRTags — Hôtels, écoles, loueurs", description: "Devenez partenaire QRTags et offrez le service objets trouvés à vos clients. Solutions pour hôtels, écoles, consignes, loueurs et cliniques en France, Afrique et Europe.", url: "https://qrtags.com/devenir-partenaire/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Devenir partenaire QRTags — Hôtels, écoles, loueurs", description: "Devenez partenaire QRTags et offrez le service objets trouvés à vos clients. Solutions pour hôtels, écoles, consignes, loueurs et cliniques en France, Afrique et Europe.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/devenir-partenaire/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Devenir partenaire QRTags", url: "https://qrtags.com/devenir-partenaire", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Devenir partenaire", item: "https://qrtags.com/devenir-partenaire" }] } }) }} />{children}</>);
}
