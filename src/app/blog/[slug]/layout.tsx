import type { Metadata } from "next";
import { db } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug, status: 'published' },
    select: { title: true, excerpt: true, coverImage: true, publishedAt: true, category: true, author: { select: { name: true } }, updatedAt: true },
  });
  if (!post) return {};
  const ogImage = post.coverImage || "/hero-illustration-new.png";
  const url = `https://qrtags.com/blog/${slug}`;
  return {
    title: post.title,
    description: post.excerpt?.slice(0, 160) || `Découvrez ${post.title} sur le blog QRTags. Conseils et actualités pour protéger vos objets en France, Afrique et Europe.`,
    openGraph: { title: post.title, description: post.excerpt?.slice(0, 160), url, siteName: "QRTags", type: "article", locale: "fr_FR", publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt?.toISOString(), authors: post.author?.name ? [post.author.name] : undefined, tags: post.category ? [post.category] : undefined, images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }] },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt?.slice(0, 160), images: [ogImage] },
    alternates: { canonical: url },
    robots: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  };
}

export default async function BlogPostLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug, status: 'published' },
    select: { title: true, excerpt: true, coverImage: true, publishedAt: true, category: true, author: { select: { name: true } }, updatedAt: true },
  });
  if (!post) return <>{children}</>;
  const ogImage = post.coverImage || "/hero-illustration-new.png";
  const articleLd = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.excerpt || `Découvrez ${post.title} sur QRTags.`, image: ogImage.startsWith('http') ? ogImage : `https://qrtags.com${ogImage}`, datePublished: post.publishedAt?.toISOString(), dateModified: post.updatedAt?.toISOString() || post.publishedAt?.toISOString(), author: { "@type": post.author?.name ? "Person" : "Organization", name: post.author?.name || "QRTags Team" }, publisher: { "@type": "Organization", name: "QRTags", url: "https://qrtags.com", logo: { "@type": "ImageObject", url: "https://qrtags.com/icons/icon-512x512.png" } }, mainEntityOfPage: { "@type": "WebPage", "@id": `https://qrtags.com/blog/${slug}` }, isAccessibleForFree: true, inLanguage: "fr-FR", articleSection: post.category || "Conseils" };
  const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Accueil", item: "https://qrtags.com" }, { "@type": "ListItem", position: 2, name: "Blog", item: "https://qrtags.com/blog" }, { "@type": "ListItem", position: 3, name: post.title, item: `https://qrtags.com/blog/${slug}` }] };
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />{children}</>);
}
