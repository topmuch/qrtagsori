import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog QRTags — Conseils objets perdus, bagages égarés, étiquettes QR",
  description: "Tous nos conseils pour ne plus perdre vos objets : comment étiqueter vos bagages, que faire si vous perdez vos affaires, astuces voyage, actualités QRTags. Articles pour la France, l'Afrique et l'Europe.",
  openGraph: { title: "Blog QRTags — Conseils et actualités sur les objets perdus", description: "Conseils voyage, astuces anti-perte, actualités QRTags. Étiquettes QR intelligentes en France, Afrique et Europe.", url: "https://qrtags.com/blog", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630, alt: "Blog QRTags — Conseils objets perdus et étiquettes QR" }] },
  twitter: { card: "summary_large_image", title: "Blog QRTags — Conseils objets perdus", description: "Conseils voyage, astuces anti-perte, actualités QRTags. France, Afrique, Europe.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/blog" },
  robots: { index: true, follow: true },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Blog QRTags", url: "https://qrtags.com/blog", isPartOf: { "@type": "WebSite", name: "QRTags", url: "https://qrtags.com" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Blog", item: "https://qrtags.com/blog" }] } }) }} />
      {children}
    </>
  );
}
