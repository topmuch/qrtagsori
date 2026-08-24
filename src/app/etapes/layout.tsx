import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comment ça marche QRTags — 4 étapes simples",
  description: "Protégez vos objets en 4 étapes : collez, activez en 30 secondes, recevez une alerte WhatsApp, récupérez-le. Solution pour la France, l'Afrique et l'Europe.",
  openGraph: { title: "Comment ça marche QRTags — 4 étapes simples", description: "Protégez vos objets en 4 étapes : collez, activez en 30 secondes, recevez une alerte WhatsApp, récupérez-le. Solution pour la France, l'Afrique et l'Europe.", url: "https://qrtags.com/etapes/layout.tsx", siteName: "QRTags", type: "website", locale: "fr_FR", images: [{ url: "/hero-illustration-new.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Comment ça marche QRTags — 4 étapes simples", description: "Protégez vos objets en 4 étapes : collez, activez en 30 secondes, recevez une alerte WhatsApp, récupérez-le. Solution pour la France, l'Afrique et l'Europe.", images: ["/hero-illustration-new.png"] },
  alternates: { canonical: "https://qrtags.com/etapes/layout.tsx" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: "Comment ça marche QRTags", url: "https://qrtags.com/etapes", isPartOf: { "@type": "WebSite", name: "QRTags" }, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Comment ça marche", item: "https://qrtags.com/etapes" }] } }) }} />{children}</>);
}
