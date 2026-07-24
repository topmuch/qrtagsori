'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Tag,
  ChevronLeft,
} from "lucide-react";

/**
 * Page ARTICLE DE BLOG PUBLIQUE — /blog/[slug]
 *
 * Accessible aux visiteurs anonymes (pas de redirection vers /login).
 * Utilise l'endpoint public /api/blog/public/[slug].
 *
 *_design identique à /agence/blog/[slug] mais sans dépendre du layout agence
 * (qui redirige les utilisateurs non connectés vers /agence/connexion).
 */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
  views: number;
  createdAt: string;
  author?: {
    id?: string;
    name: string | null;
    email?: string;
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

export default function PublicBlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/blog/public/${slug}`);
      const data = await response.json();

      if (response.ok && data.post) {
        setPost(data.post);
      } else {
        setError(data.error || 'Article non trouvé');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Erreur lors du chargement de l\'article');
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

  // Simple markdown to HTML converter
  const renderMarkdown = (content: string) => {
    let html = content
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-slate-800 mt-6 mb-3">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-slate-800 mt-5 mb-2">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[#2563EB] hover:underline" target="_blank" rel="noopener">$1</a>')
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-4 max-w-full h-auto" />')
      .replace(/^- (.+)$/gm, '<li class="text-slate-600 ml-4">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="text-slate-600 ml-4 list-decimal">$1</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[#2563EB] pl-4 my-4 italic text-slate-600">$1</blockquote>')
      .replace(/\n\n/g, '</p><p class="text-slate-600 leading-relaxed my-4">')
      .replace(/\n/g, '<br />');

    return `<div class="prose prose-slate max-w-none">
      <p class="text-slate-600 leading-relaxed my-4">${html}</p>
    </div>`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c89a00]/30 border-t-[#c89a00] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4">{error || 'Article non trouvé'}</p>
            <Link href="/blog">
              <Button className="bg-[#c89a00] hover:bg-[#a87f00] text-white rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au blog
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryInfo = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.actualites;

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
            href="/blog"
            className="text-sm text-slate-600 hover:text-[#c89a00] transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Tous les articles
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <article>
          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-6 bg-slate-200">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${categoryInfo.color}`}>
              <Tag className="w-3 h-3" />
              {CATEGORY_ICONS[post.category]} {categoryInfo.label}
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mt-4 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt)}
              </span>
              {post.author?.name && (
                <span>Par <strong className="text-slate-700">{post.author.name}</strong></span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views} vues
              </span>
            </div>
          </header>

          {/* Content */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
              />
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex items-center justify-between mt-8">
            <Link href="/blog">
              <Button
                variant="outline"
                className="border-slate-200 text-slate-600 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au blog
              </Button>
            </Link>
            <Link href="/#tarifs">
              <Button className="bg-[#c89a00] hover:bg-[#a87f00] text-white rounded-xl">
                Protéger mes objets
              </Button>
            </Link>
          </div>
        </article>
      </main>

      {/* Simple footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} QRTags — Objets perdus & retrouvés
        </div>
      </footer>
    </div>
  );
}
