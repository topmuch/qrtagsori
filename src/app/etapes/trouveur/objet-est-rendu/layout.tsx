import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "L'objet est rendu à son propriétaire",
  description: "Grâce à QRTags, 98% des objets sont rendus en moins de 2h. Le propriétaire reçoit votre position GPS via WhatsApp.",
  openGraph: { title: "L'objet est rendu à son propriétaire", description: "Grâce à QRTags, 98% des objets sont rendus en moins de 2h. Le propriétaire reçoit votre position GPS via WhatsApp.", url: "https://qrtags.com/etapes/trouveur/objet-est-rendu", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "L'objet est rendu à son propriétaire", description: "Grâce à QRTags, 98% des objets sont rendus en moins de 2h. Le propriétaire reçoit votre position GPS via WhatsApp.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/etapes/trouveur/objet-est-rendu" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "L'objet est rendu à son propriétaire", url: "https://qrtags.com/etapes/trouveur/objet-est-rendu", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Vous avez trouvé un objet ?", item: "https://qrtags.com/etapes/trouveur" }, { "@type": "ListItem", position: 3, name: "L'objet est rendu à son propriétaire", item: "https://qrtags.com/etapes/trouveur/objet-est-rendu" }] } }) }} />{children}</>);
}
