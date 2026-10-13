import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contactez le propriétaire via WhatsApp",
  description: "Après avoir scanné le QR, contactez le propriétaire via WhatsApp en un clic. Votre position GPS est envoyée automatiquement.",
  openGraph: { title: "Contactez le propriétaire via WhatsApp", description: "Après avoir scanné le QR, contactez le propriétaire via WhatsApp en un clic. Votre position GPS est envoyée automatiquement.", url: "https://qrtags.com/etapes/trouveur/contactez-le-proprietaire", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Contactez le propriétaire via WhatsApp", description: "Après avoir scanné le QR, contactez le propriétaire via WhatsApp en un clic. Votre position GPS est envoyée automatiquement.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/etapes/trouveur/contactez-le-proprietaire" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Contactez le propriétaire via WhatsApp", url: "https://qrtags.com/etapes/trouveur/contactez-le-proprietaire", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Vous avez trouvé un objet ?", item: "https://qrtags.com/etapes/trouveur" }, { "@type": "ListItem", position: 3, name: "Contactez le propriétaire via WhatsApp", item: "https://qrtags.com/etapes/trouveur/contactez-le-proprietaire" }] } }) }} />{children}</>);
}
