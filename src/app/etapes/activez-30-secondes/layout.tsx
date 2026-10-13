import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activez votre QR en 30 secondes",
  description: "Scannez votre étiquette QR QRTags, entrez votre prénom et numéro WhatsApp. Activation en 30 secondes. Aucune application. Protégez vos objets instantanément.",
  openGraph: { title: "Activez votre QR en 30 secondes", description: "Scannez votre étiquette QR QRTags, entrez votre prénom et numéro WhatsApp. Activation en 30 secondes. Aucune application. Protégez vos objets instantanément.", url: "https://qrtags.com/etapes/activez-30-secondes", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Activez votre QR en 30 secondes", description: "Scannez votre étiquette QR QRTags, entrez votre prénom et numéro WhatsApp. Activation en 30 secondes. Aucune application. Protégez vos objets instantanément.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/etapes/activez-30-secondes" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Activez votre QR en 30 secondes", url: "https://qrtags.com/etapes/activez-30-secondes", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Comment ça marche", item: "https://qrtags.com/etapes" }, { "@type": "ListItem", position: 3, name: "Activez votre QR en 30 secondes", item: "https://qrtags.com/etapes/activez-30-secondes" }] } }) }} />{children}</>);
}
