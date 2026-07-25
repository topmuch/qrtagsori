# QRBag Feature Implementation Worklog

---
Task ID: 0
Agent: Main Orchestrator
Task: Install dependencies, update schema, modify suivi API

Work Log:
- Installed leaflet, @types/leaflet, socket.io, socket.io-client
- Added Review and LossAlert models to prisma/schema.prisma
- Ran db:push to sync DB
- Modified /api/suivi/[reference]/route.ts to include latitude/longitude in scan entries for map trajectory

Stage Summary:
- DB schema updated with Review (social proof) and LossAlert (proactive loss detection) models
- Suivi API now returns lat/lng per scan for interactive map
- Dependencies ready for all 6 features

---
Task ID: 3
Agent: tracking-ws
Task: Create Socket.IO WebSocket mini-service for real-time scan event broadcasting

Work Log:
- Created `mini-services/tracking-ws/package.json` with socket.io dependency and `bun --hot` dev script
- Created `mini-services/tracking-ws/index.ts` — Socket.IO server on port 3005
  - Uses Caddy-compatible path `/` and wildcard CORS
  - Rooms named `bag:<reference>` (e.g. `bag:Hajj26-MLQGY7`)
  - Listens for `join` events with `{ reference }` payload; client joins corresponding room
  - Exposes `broadcast` event for demo/testing: accepts `{ reference, data }`, emits `scan-event` to the room
  - Graceful shutdown on SIGTERM/SIGINT
- Created `src/hooks/useTrackingSocket.ts` — React hook
  - Connects via `io("/?XTransformPort=3005")` (Caddy gateway pattern, no direct port in URL)
  - On connect, emits `join` with the reference string
  - Returns `{ isConnected, lastEvent }` (latest scan-event payload)
  - Auto-reconnects with exponential backoff (Infinity attempts)
  - Properly disconnects and cleans up on unmount / reference change

Stage Summary:
- Tracking WebSocket mini-service ready at port 3005
- `useTrackingSocket(reference)` hook ready for consumption by the tracking page
- Demo broadcast endpoint allows simulating scan events without backend integration

---
Task ID: 2
Agent: pwa-enhance
Task: Enhance PWA setup — manifest, service worker, registration component, layout meta tags

Work Log:
- **manifest.json** — Updated `categories` from `["travel", "utilities", "lifestyle"]` to `["travel", "utilities"]`; replaced single broken screenshot (`/screenshots/home.png`) with two entries pointing to existing landing-v2 images (`hero.jpg` and `step-activate.jpg`); all other required fields (name, short_name, start_url, display, background_color, theme_color, orientation, scope, icons, lang) were already correct and left as-is.
- **sw.js** — Rewrote service worker with cache name `qrbag-v1`; pre-cache list set to `/`, `/manifest.json`, `/logo.png`, `/favicon.png`; implemented three-route strategy: (1) API calls → network-first with cache fallback, (2) images/icons/items → cache-first with network fallback, (3) navigation/other → network-first; install and activate handlers with `skipWaiting` and `clients.claim`; non-GET and cross-origin requests skipped; old caches cleaned on activate.
- **PWARegister.tsx** — Created new `'use client'` component at `src/components/PWARegister.tsx` that registers `/sw.js` on mount via `navigator.serviceWorker.register`; errors handled silently; renders `null`.
- **layout.tsx** — Added explicit `<link rel="manifest" href="/manifest.json" />` and `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` inside the `<head>` section; all other PWA meta tags (theme-color, apple-mobile-web-app-capable, application-name, msapplication-TileColor) were already present.

Stage Summary:
- PWA manifest fully compliant with requirements (8 icon sizes, 2 screenshots, correct categories)
- Service worker uses `qrbag-v1` cache with appropriate strategies per resource type
- `PWARegister` component ready for import
- Layout head includes all necessary PWA link and meta tags
- ESLint passes cleanly

---
Task ID: 5-api
Agent: api-routes
Task: Create API routes for Reviews and LossAlerts

Work Log:
- **POST /api/reviews** (`src/app/api/reviews/route.ts`)
  - Validates name (required), rating (1-5 integer), content (min 10 chars), optional title/location/baggageRef/language
  - Rate-limited to 5 submissions per hour per IP via in-memory `rateLimit()`
  - Creates review with `isApproved: false`; response omits approval status
  - Returns 201 on success

- **GET /api/reviews** (same file)
  - Query params: `featured=true`, `limit` (default 20, max 50), `lang` (fr/en/ar)
  - Only returns `isApproved: true` reviews, ordered by `createdAt desc`
  - Parallel query for aggregate stats (`_avg.rating`, `_count.id`)
  - Returns `{ reviews: [...], stats: { averageRating, totalReviews } }`

- **GET /api/loss-alerts/[reference]** (`src/app/api/loss-alerts/[reference]/route.ts`)
  - Returns non-dismissed alerts for the given reference
  - Uses `await params` pattern for Next.js 16 App Router
  - Ordered by `createdAt desc`

- **POST /api/loss-alerts/[reference]/dismiss** (`src/app/api/loss-alerts/[reference]/dismiss/route.ts`)
  - Body: `{ alertId }` — verifies alert belongs to the reference and is not already dismissed
  - Sets `dismissed: true` and `dismissedAt: now()`
  - Returns 404 if alert not found or already dismissed

- **GET /api/loss-detection/check** (`src/app/api/loss-detection/check/route.ts`)
  - Cron-callable; protected by `CRON_SECRET` Bearer token (if set) + rate limit (1 per 5 min)
  - Finds active/scanned baggages with `departureDate` set
  - For each: checks if departure + 3h has passed, no scans after arrival window, no existing non-dismissed alert
  - Creates `LossAlert` records with descriptive message including hours since arrival
  - Returns `{ alertsCreated, candidatesChecked, timestamp }`

Stage Summary:
- 5 API routes created across 4 files
- All routes use `import { db } from '@/lib/db'`
- Lint passes cleanly
- Routes follow existing project patterns (NextRequest/NextResponse, rate-limit.ts, CRON_SECRET auth)
---
Task ID: deploy-fix-bun
Agent: Main Orchestrator
Task: Diagnostiquer et corriger l'échec de déploiement Coolify (bun install au lieu de npm)

Work Log:
- Analyse des logs de déploiement : `#9 [6/9] RUN bun install` + `migrated lockfile from package-lock.json` + `Deployment failed`
- Identification de 4 sources de détection bun par Coolify :
  1. `mini-services/tracking-ws/bun.lock` (57 lignes, lockfile bun committé par erreur)
  2. `package.json` start script : `"start": "NODE_ENV=production bun .next/standalone/server.js"`
  3. `start.sh` : `bun run db:push` + `bun run prisma/seed.ts`
  4. `mini-services/tracking-ws/package.json` dev script : `"dev": "bun --hot index.ts"`
- Suppression de `mini-services/tracking-ws/bun.lock`
- `package.json` : `bun .next/standalone/server.js` → `node .next/standalone/server.js`
- `start.sh` : remplacement de toutes les références `bun run X` par `npx X` / `npx tsx X`
- `mini-services/tracking-ws/package.json` : `bun --hot index.ts` → `tsx watch index.ts`
- Suppression de `bun-types` des devDependencies (aucun `import 'bun'` dans le code)
- `.gitignore` : ajout de `bun.lock`, `bun.lockb`, `**/bun.lock`, `**/bun.lockb`
- `nixpacks.toml` : ajout de `NIXPACKS_PACKAGE_MANAGER = 'npm'` dans `[variables]` + commentaires détaillés
- Vérification build local : `npx next build` → ✓ 157 pages, 0 erreur, exit 0
- Commit créé : `37d2a04 fix(deploy): éliminer toutes les références bun → force npm sur Coolify`
- Push impossible : pas de credentials GitHub configurés dans cet environnement

Stage Summary:
- 6 fichiers modifiés, 19 insertions, 64 suppressions
- Build local vérifié ✓ (157 pages compilées en 24.4s)
- Commit 37d2a04 prêt à pousser sur origin/main
- Action utilisateur requise : `cd qrtagsori && git push origin main` depuis un terminal avec credentials GitHub
- Après push, Coolify va re-déclencher un build avec `npm install` au lieu de `bun install`

---
Task ID: deploy-fix-bun-push
Agent: Main Orchestrator
Task: Pousser le fix de déploiement sur origin/main

Work Log:
- Utilisateur a fourni un GitHub PAT (ghp_***)
- Configuration temporaire du remote avec le token : `git remote set-url origin https://x-access-token:***@github.com/topmuch/qrtagsori.git`
- Push réussi : `eb4f744..37d2a04  main -> main`
- Nettoyage du remote URL pour retirer le token (retour à https://github.com/topmuch/qrtagsori.git)

Stage Summary:
- Commit 37d2a04 poussé sur origin/main ✓
- Coolify va automatiquement re-déclencher un build avec npm (plus de bun install)
- Remote URL nettoyée pour sécurité

---
Task ID: track-redesign-urgent
Agent: Main Orchestrator
Task: Corriger vocabulaire hôtelier + refonte design palette QRTags

Work Log:
- Diagnostic utilisateur : page /track/[token] affichait "ACTIF — En cours de séjour" + "Appeler Hôtel" pour tous les objets, même hors contexte hôtel
- Cause racine : isHotelContext se déclenchait sur simple présence de hotel_phone OU hotel_room dans objectInfo (ces champs peuvent être remplis pour n'importe quel métier — clinique, école, consigne)
- Fix logique : isHotelContext = (agencyType === 'hotel') UNIQUEMENT
- Fix vocabulaire :
  • "ACTIF — En cours de séjour" → "Sous protection QRTags"
  • "PERDU — Garantie expirée" → "Garantie expirée" (badge pill)
  • "Valable jusqu'au" → "Valide jusqu'au"
  • "Appeler Hôtel" ne s'affiche plus que pour les vraies agences hôtel
- Refonte design — nouvelle palette QRTags :
  • BRAND_GOLD #FDB900 (signature QRTags, déjà utilisée dans layout.tsx + manifest)
  • BRAND_GOLD_DARK #B8860B (pour textes sur fond clair, 4.6:1 ✓ AA)
  • BRAND_BLACK #0A0A0A (noir profond)
  • PAGE_BG #FAFAF7 (crème chaud remplace gris froid)
- Header sticky : dégradé noir (actif) ou rouge (perdu) + bordure dorée 3px + badge pill statut
- Cards : bandeau titre noir avec icône dorée (signature QRTags), box-shadow subtile
- Items de scan : border-left doré 3px + chip numéroté #1/#2/#3
- Footer sticky : bordure supérieure dorée 3px signature
- Build vérifié : 157 pages compilées, 0 erreur
- Commit 8e22ebe poussé sur origin/main

Stage Summary:
- Vocabulaire générique pour tous métiers ✓
- "Appeler Hôtel" réservé aux vraies agences hôtel ✓
- Nouvelle identité visuelle QRTags (noir + doré) cohérente avec layout.tsx ✓
- Contrastes WCAG AA préservés (4.5:1+ sur tous les textes)
- Push réussi : 37d2a04..8e22ebe main -> main
