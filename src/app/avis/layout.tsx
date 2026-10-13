import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avis QRTags — Témoignages clients vérifiés",
  description: "Découvrez les avis vérifiés de nos utilisateurs en France, Afrique et Europe. QRTags obtient 4.8/5 en moyenne. Témoignages sur les objets retrouvés grâce aux étiquettes QR.",
  openGraph: { title: "Avis QRTags — Témoignages clients vérifiés", description: "Découvrez les avis vérifiés de nos utilisateurs en France, Afrique et Europe. QRTags obtient 4.8/5 en moyenne. Témoignages sur les objets retrouvés grâce aux étiquettes QR.", url: "https://qrtags.com/avis/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Avis QRTags — Témoignages clients vérifiés", description: "Découvrez les avis vérifiés de nos utilisateurs en France, Afrique et Europe. QRTags obtient 4.8/5 en moyenne. Témoignages sur les objets retrouvés grâce aux étiquettes QR.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/avis/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Avis QRTags", url: "https://qrtags.com/avis", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Avis", item: "https://qrtags.com/avis" }] } }) }} />{children}</>);
}
