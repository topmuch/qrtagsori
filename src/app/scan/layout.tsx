import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scanner un QR code QRTags — Vous avez trouvé un objet ?",
  description: "Vous avez trouvé un objet avec une étiquette QRTags ? Scannez le QR code pour alerter le propriétaire sur WhatsApp avec votre position GPS. Aucune application requise.",
  openGraph: { title: "Scanner un QR code QRTags — Vous avez trouvé un objet ?", description: "Vous avez trouvé un objet avec une étiquette QRTags ? Scannez le QR code pour alerter le propriétaire sur WhatsApp avec votre position GPS. Aucune application requise.", url: "https://qrtags.com/scan/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Scanner un QR code QRTags — Vous avez trouvé un objet ?", description: "Vous avez trouvé un objet avec une étiquette QRTags ? Scannez le QR code pour alerter le propriétaire sur WhatsApp avec votre position GPS. Aucune application requise.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/scan/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Scanner un QR code QRTags", url: "https://qrtags.com/scan", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Scanner QR", item: "https://qrtags.com/scan" }] } }) }} />{children}</>);
}
