'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Calendar, FileText, Newspaper } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  author?: { name: string | null; email: string | null } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  actualites: 'Actualités',
  conseils: 'Conseils',
  hajj: 'Hajj & Voyage',
  mises_a_jour: 'Mises à jour',
};

/**
 * Widget « Derniers articles du blog » pour le dashboard ADMIN.
 * Fetch /api/blog (auth requise) et pointe vers /admin/blog (gestion).
 */
export default function AdminLatestBlogPosts({ limit = 3 }: { limit?: number }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/blog?limit=${limit}&status=published`, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) setPosts(data.posts || []);
      } catch (err) {
        console.error('[AdminLatestBlogPosts] fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Derniers articles publiés</h3>
          </div>
          <Link
            href="/admin/blog"
            className="text-sm text-amber-600 hover:underline flex items-center gap-1"
          >
            Gérer le blog
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun article publié pour le moment.</p>
            <Link
              href="/admin/blog"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
            >
              Rédiger un article
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {posts.map((post) => (
              <Link
                key={post.id}
                href="/admin/blog"
                className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex gap-3">
                  {/* Cover */}
                  {post.coverImage ? (
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                      {CATEGORY_LABELS[post.category] || 'Article'}
                    </span>
                    <h4 className="font-medium text-slate-800 dark:text-white text-sm mt-1 line-clamp-1">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                      {post.author?.name && <span className="ml-2">· par {post.author.name}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
