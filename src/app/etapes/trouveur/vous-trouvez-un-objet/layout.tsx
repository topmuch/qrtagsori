import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vous avez trouvé un objet ?",
  description: "Vous avez trouvé un objet avec une étiquette QRTags ? Scannez le QR code, WhatsApp s'ouvre avec votre position. Un geste simple qui rend service.",
  openGraph: { title: "Vous avez trouvé un objet ?", description: "Vous avez trouvé un objet avec une étiquette QRTags ? Scannez le QR code, WhatsApp s'ouvre avec votre position. Un geste simple qui rend service.", url: "https://qrtags.com/etapes/trouveur/vous-trouvez-un-objet", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Vous avez trouvé un objet ?", description: "Vous avez trouvé un objet avec une étiquette QRTags ? Scannez le QR code, WhatsApp s'ouvre avec votre position. Un geste simple qui rend service.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/etapes/trouveur/vous-trouvez-un-objet" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Vous avez trouvé un objet ?", url: "https://qrtags.com/etapes/trouveur/vous-trouvez-un-objet", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Vous avez trouvé un objet ?", item: "https://qrtags.com/etapes/trouveur" }, { "@type": "ListItem", position: 3, name: "Vous avez trouvé un objet ?", item: "https://qrtags.com/etapes/trouveur/vous-trouvez-un-objet" }] } }) }} />{children}</>);
}
