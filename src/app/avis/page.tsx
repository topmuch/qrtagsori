'use client';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  QRTags — Page publique /avis
 *
 *  Affiche tous les avis publiés (publication immédiate, sans modération).
 *  Design QRTags signature — jaune moutarde + cartes blanches bordées de
 *  noir, alignée sur /inscrire et /track/[token].
 *
 *  Chaque avis affiche :
 *   - Étoiles (1-5)
 *   - Photo de l'objet retrouvé (si présente)
 *   - Nom de l'objet + catégorie
 *   - Message du propriétaire
 *   - Nom du trouveur (masqué via maskName → "Amina D.")
 *   - Date de publication
 *   - Langue (si ≠ français)
 *
 *  Source : GET /api/reviews/public
 * ════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Star, Package, MapPin, Clock, Loader2, AlertTriangle,
  ArrowLeft, ShoppingBag, BadgeCheck, ShieldCheck, X, Filter,
} from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';
import { PublicNavigation, PublicFooter } from '@/components/public/PublicLayout';
import { maskName } from '@/lib/privacy';

// ─── Design tokens QRTags (PALETTE SIGNATURE) ──────────────────────────
const QRTAGS_BG       = '#E3B23C';
const QRTAGS_CARD     = '#FFFFFF';
const QRTAGS_INK      = '#111111';
const QRTAGS_GREEN    = '#16A34A';

const CARD_CLASS = 'bg-white rounded-xl p-6 shadow-xl border-2 border-black';

// ─── Types ───────────────────────────────────────────────────────────────
interface PublicReview {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  title: string | null;
  content: string;
  createdAt: string;
  finderName: string | null;
  objectName: string | null;
  objectPhoto: string | null;
  objectCategory: string | null;
  language: string;
}

interface ReviewsResponse {
  reviews: PublicReview[];
  stats: {
    averageRating: number;
    totalReviews: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function StarRow({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} sur 5 étoiles`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          width={size}
          height={size}
          className={star <= rating ? 'fill-current' : ''}
          style={{
            color: star <= rating ? QRTAGS_GREEN : 'rgba(0,0,0,0.15)',
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  COMPOSANT — Carte d'un avis
// ════════════════════════════════════════════════════════════════════════
function ReviewCard({
  review,
  onPhotoClick,
}: {
  review: PublicReview;
  onPhotoClick?: (src: string) => void;
}) {
  const hasObject = review.objectName || review.objectPhoto || review.objectCategory;

  return (
    <article className={`${CARD_CLASS} mb-6`}>
      {/* En-tête : étoiles + date + finder */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <StarRow rating={review.rating} />
          <span className="text-sm font-bold" style={{ color: QRTAGS_INK }}>
            {review.rating}/5
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: '#DCFCE7',
              color: QRTAGS_GREEN,
              border: `1px solid ${QRTAGS_GREEN}`,
            }}
            title="Avis laissé par le propriétaire depuis son lien de suivi authentique"
          >
            <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Achat vérifié
          </span>
        </div>
        <span className="text-xs flex items-center gap-1" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {formatDate(review.createdAt)}
        </span>
      </div>

      {/* Bandeau objet retrouvé (si présent) */}
      {hasObject && (
        <div
          className="mb-4 p-3 rounded-lg border-2 flex items-center gap-3"
          style={{ backgroundColor: '#FEF9E7', borderColor: QRTAGS_BG }}
        >
          {review.objectPhoto ? (
            <button
              type="button"
              onClick={() => onPhotoClick?.(review.objectPhoto!)}
              className="relative flex-shrink-0 group"
              aria-label="Agrandir la photo de l'objet retrouvé"
            >
              <img
                src={review.objectPhoto}
                alt={review.objectName || 'Objet retrouvé'}
                className="w-16 h-16 object-cover rounded-lg border-2 border-black transition group-hover:opacity-80 group-hover:scale-105"
                loading="lazy"
              />
              <span
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none"
                aria-hidden="true"
              >
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }}
                >
                  Agrandir
                </span>
              </span>
            </button>
          ) : (
            <div
              className="w-16 h-16 rounded-lg border-2 border-black flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#F3F4F6' }}
            >
              <Package className="w-7 h-7" style={{ color: QRTAGS_INK }} aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
              Objet retrouvé
            </p>
            {review.objectName && (
              <p className="text-base font-bold truncate" style={{ color: QRTAGS_INK }}>
                {review.objectName}
              </p>
            )}
            {review.objectCategory && (
              <p className="text-xs" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
                {review.objectCategory}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Titre (optionnel) */}
      {review.title && (
        <h3 className="text-lg font-bold mb-2" style={{ color: QRTAGS_INK }}>
          {review.title}
        </h3>
      )}

      {/* Contenu de l'avis */}
      <p className="text-base leading-relaxed mb-4" style={{ color: QRTAGS_INK }}>
        &ldquo;{review.content}&rdquo;
      </p>

      {/* Pied : remerciement au trouveur + localisation */}
      <div
        className="pt-3 border-t-2 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: '#E5E7EB' }}
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold" style={{ color: QRTAGS_INK }}>
            {review.name}
          </span>
          {review.finderName && (
            <span style={{ color: QRTAGS_INK, opacity: 0.7 }}>
              · Merci à <span className="font-bold">{maskName(review.finderName)}</span>
            </span>
          )}
        </div>
        {review.location && (
          <span
            className="text-xs flex items-center gap-1"
            style={{ color: QRTAGS_INK, opacity: 0.6 }}
          >
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {review.location}
          </span>
        )}
      </div>
    </article>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════
export default function AvisPage() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Filtres + tri + lightbox ──────────────────────────────────────────
  const [minRating, setMinRating] = useState<number>(0); // 0 = tous
  const [sortBy, setSortBy] = useState<'recent' | 'best'>('recent');
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/reviews/public', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP error');
        const json: ReviewsResponse = await res.json();
        setData(json);
      } catch (err) {
        console.error('[avis] fetch error:', err);
        setError('Impossible de charger les avis pour le moment.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ─── Fermeture lightbox (Escape + scroll lock) ─────────────────────────
  useEffect(() => {
    if (!lightboxPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxPhoto(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxPhoto]);

  // ─── Avis filtrés + triés (mémoïsés pour éviter le recompute inutile) ──
  const filteredReviews = (() => {
    if (!data) return [];
    const list = data.reviews.filter((r) => r.rating >= minRating);
    if (sortBy === 'best') {
      return [...list].sort((a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  })();

  // ─── SEO : injecte les données structurées Schema.org/Review ─────────────
  // Permet à Google d'afficher les étoiles dans les résultats de recherche
  // (rich snippets). Nécessite un AggregateRating + un Review par avis.
  useEffect(() => {
    if (!data || data.reviews.length === 0) return;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'QRTags — Étiquette QR pour objets perdus',
      description:
        "Étiquette QR intelligente pour valise, clés, sac, lunettes, téléphone. Sans app, sans batterie. Alerte WhatsApp instantanée avec la position du trouveur.",
      brand: { '@type': 'Brand', name: 'QRTags' },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.stats.averageRating.toFixed(1),
        reviewCount: data.stats.totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
      review: data.reviews.slice(0, 20).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name },
        datePublished: r.createdAt,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        ...(r.title ? { name: r.title } : {}),
        reviewBody: r.content,
      })),
    };

    let scriptTag = document.getElementById('avis-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'avis-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLd);

    return () => {
      // Cleanup on unmount: remove the JSON-LD block
      const existing = document.getElementById('avis-jsonld');
      if (existing) existing.remove();
    };
  }, [data]);

  return (
    <main
      className="min-h-screen font-sans antialiased"
      style={{
        backgroundColor: QRTAGS_BG,
        color: QRTAGS_INK,
        fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
      }}
    >
      <PublicNavigation />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* ─── HEADER ─── */}
        <header className="text-center mb-12">
          <div className="bg-white inline-block px-6 py-3 rounded-lg mb-4 shadow-lg border-2 border-black">
            <QRTagsLogo size="md" variant="light" />
          </div>
          <h1 className="text-4xl font-black mb-3" style={{ color: QRTAGS_INK }}>
            ⭐ AVIS QRTAGS
          </h1>
          <p className="text-lg italic" style={{ color: QRTAGS_INK, opacity: 0.8 }}>
            Les témoignages de personnes qui ont retrouvé leurs objets grâce à QRTags
          </p>

          {/* Stats globales */}
          {data && data.stats.totalReviews > 0 && (
            <div
              className="mt-8 inline-flex items-center gap-6 px-6 py-4 rounded-xl border-2 border-black shadow-lg"
              style={{ backgroundColor: QRTAGS_CARD }}
            >
              <div className="text-center">
                <p className="text-3xl font-black" style={{ color: QRTAGS_INK }}>
                  {data.stats.averageRating.toFixed(1)}/5
                </p>
                <div className="flex justify-center mt-1">
                  <StarRow rating={Math.round(data.stats.averageRating)} size={16} />
                </div>
              </div>
              <div className="w-px h-12" style={{ backgroundColor: '#E5E7EB' }} />
              <div className="text-center">
                <p className="text-3xl font-black" style={{ color: QRTAGS_INK }}>
                  {data.stats.totalReviews}
                </p>
                <p className="text-xs uppercase tracking-wider font-bold" style={{ color: QRTAGS_INK, opacity: 0.6 }}>
                  Avis publiés
                </p>
              </div>
            </div>
          )}
        </header>

        {/* ─── LISTE DES AVIS ─── */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: QRTAGS_INK }} />
            <p className="text-lg font-bold" style={{ color: QRTAGS_INK }}>
              Chargement des avis...
            </p>
          </div>
        ) : error ? (
          <div className={`${CARD_CLASS} text-center`}>
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#DC2626' }} />
            <p className="font-bold mb-4" style={{ color: QRTAGS_INK }}>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-block px-6 py-3 rounded-lg font-bold"
              style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_BG }}
            >
              Réessayer
            </button>
          </div>
        ) : !data || data.reviews.length === 0 ? (
          <div className={`${CARD_CLASS} text-center`}>
            <p className="text-5xl mb-4" aria-hidden="true">💬</p>
            <h2 className="text-xl font-bold mb-2" style={{ color: QRTAGS_INK }}>
              Aucun avis pour le moment
            </h2>
            <p className="text-sm mb-6" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
              Les avis laissés par les propriétaires après avoir retrouvé leurs objets
              apparaîtront ici automatiquement.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold"
              style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_BG }}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Retour à l&apos;accueil
            </Link>
          </div>
        ) : (
          <>
            {/* ─── Barre de filtres + tri ─── */}
            {data && data.reviews.length > 0 && (
              <div
                className="mb-8 p-4 rounded-xl flex flex-wrap items-center gap-3 justify-between"
                style={{ backgroundColor: QRTAGS_CARD, border: `2px solid ${QRTAGS_INK}` }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4" style={{ color: QRTAGS_INK }} aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: QRTAGS_INK }}>
                    Filtrer :
                  </span>
                  {[
                    { v: 0, label: 'Tous' },
                    { v: 5, label: '5 ★' },
                    { v: 4, label: '4+ ★' },
                    { v: 3, label: '3+ ★' },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setMinRating(opt.v)}
                      className="px-3 py-1 rounded-full text-xs font-bold transition"
                      style={{
                        backgroundColor: minRating === opt.v ? QRTAGS_INK : 'transparent',
                        color: minRating === opt.v ? QRTAGS_BG : QRTAGS_INK,
                        border: `1px solid ${QRTAGS_INK}`,
                      }}
                      aria-pressed={minRating === opt.v}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: QRTAGS_INK }}>
                    Trier :
                  </span>
                  {[
                    { v: 'recent' as const, label: 'Récents' },
                    { v: 'best' as const, label: 'Mieux notés' },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setSortBy(opt.v)}
                      className="px-3 py-1 rounded-full text-xs font-bold transition"
                      style={{
                        backgroundColor: sortBy === opt.v ? QRTAGS_INK : 'transparent',
                        color: sortBy === opt.v ? QRTAGS_BG : QRTAGS_INK,
                        border: `1px solid ${QRTAGS_INK}`,
                      }}
                      aria-pressed={sortBy === opt.v}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
                  {filteredReviews.length} avis{filteredReviews.length !== data.reviews.length ? ` (sur ${data.reviews.length})` : ''}
                </span>
              </div>
            )}

            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onPhotoClick={(src) => setLightboxPhoto(src)}
                />
              ))
            ) : (
              <div className={`${CARD_CLASS} text-center`}>
                <p className="text-4xl mb-3" aria-hidden="true">🔍</p>
                <h2 className="text-xl font-bold mb-2" style={{ color: QRTAGS_INK }}>
                  Aucun avis ne correspond à ce filtre
                </h2>
                <p className="text-sm mb-4" style={{ color: QRTAGS_INK, opacity: 0.7 }}>
                  Essayez d&apos;élargir votre recherche.
                </p>
                <button
                  type="button"
                  onClick={() => { setMinRating(0); setSortBy('recent'); }}
                  className="inline-block px-6 py-3 rounded-lg font-bold"
                  style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_BG }}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {/* CTA bas de page */}
            <div className="text-center mt-12 mb-4">
              <p className="text-base mb-4" style={{ color: QRTAGS_INK }}>
                Vous aussi, protégez vos objets avec QRTags
              </p>
              <Link
                href="/#tarifs"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: QRTAGS_INK, color: QRTAGS_BG }}
              >
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                Acheter des tags
              </Link>
            </div>
          </>
        )}

        {/* Lien retour + RGPD */}
        <div className="text-center mt-12 space-y-6">
          {/* RGPD — Droit à l'effacement */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: 'rgba(255,255,255,0.5)',
              color: QRTAGS_INK,
              border: `1px solid ${QRTAGS_INK}`,
            }}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>
              Vous souhaitez demander la suppression d&apos;un avis ?
              {' '}
              <Link
                href="/contact?subject=suppression-avis"
                className="font-bold underline hover:no-underline"
                style={{ color: QRTAGS_INK }}
              >
                Contactez-nous
              </Link>
              {' '}
              (droit RGPD à l&apos;effacement).
            </span>
          </div>

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm hover:underline"
              style={{ color: QRTAGS_INK, opacity: 0.7 }}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />

      {/* ─── Lightbox photo (objet retrouvé) ─── */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setLightboxPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo agrandie de l'objet retrouvé"
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
            onClick={() => setLightboxPhoto(null)}
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Objet retrouvé (agrandi)"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ border: '3px solid white' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
