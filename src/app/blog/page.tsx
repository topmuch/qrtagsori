'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Tag,
  ChevronRight,
  FileText,
} from "lucide-react";

/**
 * Page LISTE DU BLOG PUBLIQUE — /blog
 *
 * Accessible aux visiteurs anonymes. Utilise /api/blog/public.
 * Liens vers /blog/[slug] (page article publique).
 */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
  views: number;
  author?: {
    name: string | null;
  };
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  actualites: { label: 'Actualités', color: 'bg-blue-100 text-blue-700' },
  conseils: { label: 'Conseils', color: 'bg-emerald-100 text-emerald-700' },
  hajj: { label: 'Hajj 2026', color: 'bg-amber-100 text-amber-700' },
  mises_a_jour: { label: 'Mises à jour', color: 'bg-purple-100 text-purple-700' },
};

const CATEGORY_ICONS: Record<string, string> = {
  actualites: '📰',
  conseils: '💡',
  hajj: '🕋',
  mises_a_jour: '🚀',
};

export default function PublicBlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('limit', '24');

      const response = await fetch(`/api/blog/public?${params}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple public header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-900">QRTags</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#c89a00]/10 text-[#a87f00] font-bold">BLOG</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-[#c89a00] transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mt-4">
            <div className="w-12 h-12 rounded-2xl bg-[#c89a00]/20 flex items-center justify-center">
              <span className="text-2xl">📰</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Blog QRTags</h1>
              <p className="text-slate-500">Actualités, conseils et mises à jour</p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            onClick={() => setSelectedCategory('all')}
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className={`rounded-xl ${
              selectedCategory === 'all'
                ? 'bg-[#c89a00] hover:bg-[#a87f00] text-white'
                : 'border-slate-200 text-slate-600'
            }`}
          >
            Tous
          </Button>
          {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
            <Button
              key={key}
              onClick={() => setSelectedCategory(key)}
              variant={selectedCategory === key ? 'default' : 'outline'}
              className={`rounded-xl ${
                selectedCategory === key
                  ? 'bg-[#c89a00] hover:bg-[#a87f00] text-white'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              {CATEGORY_ICONS[key]} {value.label}
            </Button>
          ))}
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#c89a00]/30 border-t-[#c89a00] rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">Aucun article disponible pour le moment.</p>
              <p className="text-slate-400 text-sm mt-2">Revenez bientôt pour de nouveaux contenus !</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const categoryInfo = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.actualites;
              return (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="bg-white border-slate-200 shadow-sm rounded-2xl hover:shadow-md hover:border-[#c89a00]/30 transition-all cursor-pointer group">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Cover Image */}
                        {post.coverImage && (
                          <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0 overflow-hidden rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none bg-slate-100">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 p-5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${categoryInfo.color}`}>
                            <Tag className="w-3 h-3" />
                            {categoryInfo.label}
                          </span>

                          <h2 className="text-lg font-semibold text-slate-800 mt-2 group-hover:text-[#c89a00] transition-colors">
                            {post.title}
                          </h2>

                          {post.excerpt && (
                            <p className="text-slate-500 text-sm mt-2 line-clamp-2">{post.excerpt}</p>
                          )}

                          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(post.publishedAt)}
                            </span>
                            {post.author?.name && <span>Par {post.author.name}</span>}
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.views} vues
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[#c89a00] text-sm mt-3 font-medium">
                            Lire l'article
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} QRTags — Objets perdus & retrouvés
        </div>
      </footer>
    </div>
  );
}
