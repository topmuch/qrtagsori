import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soyez notifié quand votre objet est trouvé",
  description: "Si quelqu'un trouve votre objet, vous recevez une notification WhatsApp avec la position GPS du trouveur. Alerte en moins de 5 secondes.",
  openGraph: { title: "Soyez notifié quand votre objet est trouvé", description: "Si quelqu'un trouve votre objet, vous recevez une notification WhatsApp avec la position GPS du trouveur. Alerte en moins de 5 secondes.", url: "https://qrtags.com/etapes/soyez-notifie", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Soyez notifié quand votre objet est trouvé", description: "Si quelqu'un trouve votre objet, vous recevez une notification WhatsApp avec la position GPS du trouveur. Alerte en moins de 5 secondes.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/etapes/soyez-notifie" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Soyez notifié quand votre objet est trouvé", url: "https://qrtags.com/etapes/soyez-notifie", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Comment ça marche", item: "https://qrtags.com/etapes" }, { "@type": "ListItem", position: 3, name: "Soyez notifié quand votre objet est trouvé", item: "https://qrtags.com/etapes/soyez-notifie" }] } }) }} />{children}</>);
}
