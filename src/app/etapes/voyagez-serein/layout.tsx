import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voyagez serein avec QRTags",
  description: "Partez l'esprit tranquille avec vos étiquettes QR sur vos bagages. Voyagez en France, Afrique et Europe sans peur de perdre vos affaires.",
  openGraph: { title: "Voyagez serein avec QRTags", description: "Partez l'esprit tranquille avec vos étiquettes QR sur vos bagages. Voyagez en France, Afrique et Europe sans peur de perdre vos affaires.", url: "https://qrtags.com/etapes/voyagez-serein", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Voyagez serein avec QRTags", description: "Partez l'esprit tranquille avec vos étiquettes QR sur vos bagages. Voyagez en France, Afrique et Europe sans peur de perdre vos affaires.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/etapes/voyagez-serein" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Voyagez serein avec QRTags", url: "https://qrtags.com/etapes/voyagez-serein", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Comment ça marche", item: "https://qrtags.com/etapes" }, { "@type": "ListItem", position: 3, name: "Voyagez serein avec QRTags", item: "https://qrtags.com/etapes/voyagez-serein" }] } }) }} />{children}</>);
}
