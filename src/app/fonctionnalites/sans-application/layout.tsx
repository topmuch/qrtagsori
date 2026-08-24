import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sans application — QR code sans installer quoi que ce soit",
  description: "QRTags ne nécessite aucune application. Le trouveur scanne le QR code, WhatsApp s'ouvre automatiquement. Compatible iPhone et Android. Pas de téléchargement.",
  openGraph: { title: "Sans application — QR code sans installer quoi que ce soit", description: "QRTags ne nécessite aucune application. Le trouveur scanne le QR code, WhatsApp s'ouvre automatiquement. Compatible iPhone et Android. Pas de téléchargement.", url: "https://qrtags.com/fonctionnalites/sans-application", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Sans application — QR code sans installer quoi que ce soit", description: "QRTags ne nécessite aucune application. Le trouveur scanne le QR code, WhatsApp s'ouvre automatiquement. Compatible iPhone et Android. Pas de téléchargement.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/fonctionnalites/sans-application" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Sans application — QR code sans installer quoi que ce soit", url: "https://qrtags.com/fonctionnalites/sans-application", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Fonctionnalités", item: "https://qrtags.com/fonctionnalites" }, { "@type": "ListItem", position: 3, name: "Sans application — QR code sans installer quoi que ce soit", item: "https://qrtags.com/fonctionnalites/sans-application" }] } }) }} />{children}</>);
}
