import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alertes WhatsApp — Notification instantanée",
  description: "Recevez une alerte WhatsApp instantanée avec la position GPS du trouveur dès que quelqu'un scanne votre étiquette QR. Alerte en moins de 5 secondes.",
  openGraph: { title: "Alertes WhatsApp — Notification instantanée", description: "Recevez une alerte WhatsApp instantanée avec la position GPS du trouveur dès que quelqu'un scanne votre étiquette QR. Alerte en moins de 5 secondes.", url: "https://qrtags.com/fonctionnalites/alertes-whatsapp", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Alertes WhatsApp — Notification instantanée", description: "Recevez une alerte WhatsApp instantanée avec la position GPS du trouveur dès que quelqu'un scanne votre étiquette QR. Alerte en moins de 5 secondes.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/fonctionnalites/alertes-whatsapp" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Alertes WhatsApp — Notification instantanée", url: "https://qrtags.com/fonctionnalites/alertes-whatsapp", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Fonctionnalités", item: "https://qrtags.com/fonctionnalites" }, { "@type": "ListItem", position: 3, name: "Alertes WhatsApp — Notification instantanée", item: "https://qrtags.com/fonctionnalites/alertes-whatsapp" }] } }) }} />{children}</>);
}
