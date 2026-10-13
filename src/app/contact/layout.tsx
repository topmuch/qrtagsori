import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contactez QRTags — Partenaires et support",
  description: "Contactez QRTags pour devenir partenaire (hôtels, écoles, loueurs, cliniques), obtenir du support ou commander des étiquettes QR. Disponible en France, Afrique de l'Ouest et Europe.",
  openGraph: { title: "Contactez QRTags — Partenaires et support", description: "Contactez QRTags pour devenir partenaire (hôtels, écoles, loueurs, cliniques), obtenir du support ou commander des étiquettes QR. Disponible en France, Afrique de l'Ouest et Europe.", url: "https://qrtags.com/contact/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Contactez QRTags — Partenaires et support", description: "Contactez QRTags pour devenir partenaire (hôtels, écoles, loueurs, cliniques), obtenir du support ou commander des étiquettes QR. Disponible en France, Afrique de l'Ouest et Europe.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/contact/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Contact QRTags", url: "https://qrtags.com/contact", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Contact", item: "https://qrtags.com/contact" }] } }) }} />{children}</>);
}
