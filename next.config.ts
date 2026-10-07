import type { NextConfig } from "next";

/**
 * Routes privées / dynamiques qui ne doivent pas être indexées par Google.
 *
 * Contexte : Google Search Console signale des "Soft 404" sur des URLs comme
 * /scan/<invalid>, /suivi/<invalid>, /checklist/<invalid>. Ces pages sont des
 * composants client qui affichent un message "non trouvé" avec un statut HTTP
 * 200 (au lieu d'un vrai HTTP 404) — Google détecte ce pattern comme un
 * soft 404 et bloque l'indexation.
 *
 * Solution : on injecte l'en-tête HTTP `X-Robots-Tag: noindex, nofollow` via
 * `next.config.ts` `headers()` plutôt que via middleware.ts (qui émet un
 * warning de dépréciation en Next.js 16) ou proxy.ts (qui crashe Turbopack).
 * Cette approche est 100% stable.
 *
 * L'en-tête X-Robots-Tag a le même effet que la balise meta robots mais
 * fonctionne au niveau HTTP. Google retirera les URLs déjà indexées de
 * l'index lors du prochain crawl.
 *
 * Notes :
 * - Les chemins déjà disallow dans src/app/robots.ts sont aussi couverts ici
 *   par belt-and-suspenders (double protection) : /admin/, /agence/, /api/,
 *   /dashboard/, /checklist/*.
 * - Les chemins crawlables par design (/blog/:slug, /features/:slug,
 *   /agency/:slug, /metiers/:slug, /workflow/:step) ne sont PAS noindex car
 *   ils ont un vrai contenu à indexer et utilisent déjà notFound() côté
 *   serveur pour les slugs inexistants (pas de soft 404).
 * - /scan/:path* et /suivi/:path* sont noindex car ce sont des pages
 *   éphémères spécifiques à un bagage (scan trouvéur / suivi propriétaire).
 *   Les URL valides elles-mêmes n'ont pas vocation à être indexées par
 *   Google (elles sont accédées via QR code ou partage direct).
 */
const NOINDEX_HEADERS = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const PRIVATE_ROUTE_PATTERNS = [
  // Pages dynamiques éphémères (soft 404 sources principales)
  "/scan/:path*",
  "/suivi/:path*",

  // Espaces authentifiés (déjà disallow dans robots.ts — belt-and-suspenders)
  "/admin/:path*",
  "/agence/:path*",
  "/dashboard/:path*",

  // API (jamais indexée)
  "/api/:path*",

  // Checklists privées (déjà disallow dans robots.ts)
  "/checklist/:path*",
];

const PRIVATE_EXACT_ROUTES = [
  "/expired",
  "/offline",
  "/success",
  "/hajj/activate",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/demo",
  "/mes-bagages",
  "/connexion",
  "/login",
  "/connexion-voyageur",
  "/voyageurs-standard",
];

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  serverExternalPackages: ['nodemailer', 'pdf-lib', 'pdfkit', 'qrcode', 'archiver', 'sharp'],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // Bypass the Next.js image optimizer. We already serve optimized images
    // (PNG/JPEG), and the optimizer can fail in production environments
    // where sharp is not properly bundled (especially with output: 'standalone'
    // + serverExternalPackages). Setting unoptimized = true serves the
    // images directly via /public, which is more reliable across dev/preview/
    // production environments. The browser still benefits from srcset because
    // next/image keeps generating it when the Image component is used.
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },

  async headers() {
    return [
      ...PRIVATE_ROUTE_PATTERNS.map((source) => ({
        source,
        headers: NOINDEX_HEADERS,
      })),
      ...PRIVATE_EXACT_ROUTES.map((source) => ({
        source,
        headers: NOINDEX_HEADERS,
      })),
    ];
  },
};

export default nextConfig;
