'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Newspaper } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
  author?: { name: string | null } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  actualites: 'Actualités',
  conseils: 'Conseils',
  hajj: 'Hajj & Voyage',
  mises_a_jour: 'Mises à jour',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  actualites: { bg: 'bg-blue-100', text: 'text-blue-700' },
  conseils: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  hajj: { bg: 'bg-amber-100', text: 'text-amber-700' },
  mises_a_jour: { bg: 'bg-violet-100', text: 'text-violet-700' },
};

interface BlogTeaserSectionProps {
  /** Nombre d'articles à afficher (défaut 3) */
  limit?: number;
  /** Endpoint à fetcher (par défaut /api/blog/public) */
  endpoint?: string;
  /** Préfixe des liens vers les articles (par défaut /agence/blog/) */
  linkPrefix?: string;
  /** Titre de la section */
  title?: string;
  /** Sous-titre */
  subtitle?: string;
  /** Palette de couleurs (clés attendues: bg, text, textMuted, accentDark, card, border) */
  colors?: {
    bg?: string;
    text?: string;
    textMuted?: string;
    accentDark?: string;
    card?: string;
    border?: string;
  };
}

/**
 * Section « Derniers articles du blog » — réutilisable sur la home page et ailleurs.
 * Fetch un endpoint public (sans auth) par défaut.
 */
export default function BlogTeaserSection({
  limit = 3,
  endpoint = '/api/blog/public',
  linkPrefix = '/agence/blog/',
  title = 'Dernières actualités',
  subtitle = 'Conseils, actualités et bonnes pratiques pour protéger vos objets du quotidien.',
  colors,
}: BlogTeaserSectionProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${endpoint}?limit=${limit}`, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) setPosts(data.posts || []);
      } catch (err) {
        console.error('[BlogTeaserSection] fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint, limit]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Loading skeleton
  if (loading) {
    return (
      <section className="py-20 lg:py-24 px-5" style={{ background: colors?.bg }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: colors?.text }}>
              {title}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: colors?.card, border: `1px solid ${colors?.border}` }}>
                <div className="aspect-[16/10] bg-gray-200/50" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-20 bg-gray-200/50 rounded" />
                  <div className="h-5 w-full bg-gray-200/50 rounded" />
                  <div className="h-3 w-2/3 bg-gray-200/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty state — ne rien afficher (évite une section vide)
  if (posts.length === 0) return null;

  return (
    <section className="py-20 lg:py-24 px-5" style={{ background: colors?.bg }}>
      <div className="max-w-screen-2xl mx-auto">
        <div className="text-center mb-12">
          <div
            className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
            style={{
              background: '#FDB90015',
              color: colors?.accentDark || '#B27B00',
              border: '1px solid #FDB90040',
            }}
          >
            BLOG & ACTUALITÉS
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ color: colors?.text }}>
            {title}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: colors?.textMuted }}>
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {posts.map((post) => {
            const cat = CATEGORY_LABELS[post.category] || 'Article';
            const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.actualites;
            return (
              <Link
                key={post.id}
                href={`${linkPrefix}${post.slug}`}
                className="group rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl h-full flex flex-col"
                style={{ background: colors?.card, border: `1px solid ${colors?.border}` }}
              >
                {/* Cover */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#FDB90015' }}>
                      <Newspaper className="w-12 h-12" style={{ color: colors?.accentDark || '#B27B00' }} />
                    </div>
                  )}
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold ${catColor.bg} ${catColor.text}`}
                  >
                    {cat}
                  </span>
                </div>
                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3
                    className="text-lg font-bold mb-2 line-clamp-2 group-hover:underline"
                    style={{ color: colors?.text }}
                  >
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm line-clamp-2 mb-3 flex-1" style={{ color: colors?.textMuted }}>
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs" style={{ color: colors?.textMuted }}>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.publishedAt)}
                    </div>
                    {post.author?.name && <span>par {post.author.name}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA "Voir tous les articles" */}
        <div className="text-center">
          <Link
            href={linkPrefix}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{
              background: '#FDB900',
              color: '#0d0d0f',
            }}
          >
            Voir tous les articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
