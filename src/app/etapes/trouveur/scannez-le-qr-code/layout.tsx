import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scannez le QR code d'un objet trouvé",
  description: "Scannez le QR code QRTags avec la caméra de votre téléphone. Aucune application. La page s'ouvre et montre qui est le propriétaire.",
  openGraph: { title: "Scannez le QR code d'un objet trouvé", description: "Scannez le QR code QRTags avec la caméra de votre téléphone. Aucune application. La page s'ouvre et montre qui est le propriétaire.", url: "https://qrtags.com/etapes/trouveur/scannez-le-qr-code", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Scannez le QR code d'un objet trouvé", description: "Scannez le QR code QRTags avec la caméra de votre téléphone. Aucune application. La page s'ouvre et montre qui est le propriétaire.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/etapes/trouveur/scannez-le-qr-code" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Scannez le QR code d'un objet trouvé", url: "https://qrtags.com/etapes/trouveur/scannez-le-qr-code", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Vous avez trouvé un objet ?", item: "https://qrtags.com/etapes/trouveur" }, { "@type": "ListItem", position: 3, name: "Scannez le QR code d'un objet trouvé", item: "https://qrtags.com/etapes/trouveur/scannez-le-qr-code" }] } }) }} />{children}</>);
}
