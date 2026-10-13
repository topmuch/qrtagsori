import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription QRTags — Créez votre compte gratuitement",
  description: "Inscrivez-vous gratuitement sur QRTags pour gérer vos étiquettes QR et recevoir des alertes WhatsApp quand vos objets sont trouvés. Activation en 30 secondes.",
  openGraph: { title: "Inscription QRTags — Créez votre compte gratuitement", description: "Inscrivez-vous gratuitement sur QRTags pour gérer vos étiquettes QR et recevoir des alertes WhatsApp quand vos objets sont trouvés. Activation en 30 secondes.", url: "https://qrtags.com/inscription/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Inscription QRTags — Créez votre compte gratuitement", description: "Inscrivez-vous gratuitement sur QRTags pour gérer vos étiquettes QR et recevoir des alertes WhatsApp quand vos objets sont trouvés. Activation en 30 secondes.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/inscription/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Inscription QRTags", url: "https://qrtags.com/inscription", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Inscription", item: "https://qrtags.com/inscription" }] } }) }} />{children}</>);
}
