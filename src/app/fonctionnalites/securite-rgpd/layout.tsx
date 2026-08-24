import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sécurité RGPD — Protection des données",
  description: "QRTags est conforme au RGPD. Le trouveur ne voit que le prénom du propriétaire. Le numéro WhatsApp n'est révélé qu'au clic volontaire. Conforme France et Europe.",
  openGraph: { title: "Sécurité RGPD — Protection des données", description: "QRTags est conforme au RGPD. Le trouveur ne voit que le prénom du propriétaire. Le numéro WhatsApp n'est révélé qu'au clic volontaire. Conforme France et Europe.", url: "https://qrtags.com/fonctionnalites/securite-rgpd", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Sécurité RGPD — Protection des données", description: "QRTags est conforme au RGPD. Le trouveur ne voit que le prénom du propriétaire. Le numéro WhatsApp n'est révélé qu'au clic volontaire. Conforme France et Europe.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/fonctionnalites/securite-rgpd" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Sécurité RGPD — Protection des données", url: "https://qrtags.com/fonctionnalites/securite-rgpd", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Fonctionnalités", item: "https://qrtags.com/fonctionnalites" }, { "@type": "ListItem", position: 3, name: "Sécurité RGPD — Protection des données", item: "https://qrtags.com/fonctionnalites/securite-rgpd" }] } }) }} />{children}</>);
}
