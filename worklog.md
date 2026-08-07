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

---
Task ID: track-restore-old-design
Agent: Main Orchestrator
Task: Restaurer l'ancien design QRTags (jaune moutarde + bordures noires) sur /track/[token] + supprimer l'incohérence "Appeler Hôtel"

Work Log:
- Diagnostic utilisateur (screenshot 1 vs 2) :
  • Page actuelle (commit 8e22ebe) = fond crème + cartes sans bordure noire + header sticky noir = NON aligné avec /inscrire
  • Ancienne page (commit e9304d1) = fond #E3B23C + cartes blanches border-2 border-black = alignée avec /inscrire ✓
- Incohérences boutons "Appeler" identifiées :
  1. Bouton "WhatsApp" du sticky footer ouvrait WhatsApp vers le propriétaire — mais le visiteur EST le propriétaire (il consulte SON propre lien de suivi) → se contacter soi-même n'a aucun sens
  2. Bouton "Appeler Hôtel" apparaissait dans le sticky footer pour les objets d'agences type "hotel" — mais l'utilisateur vient d'activer le QR code sans avoir déclaré de perte, donc appeler l'hôtel n'a aucun sens à ce stade
- Refonte complète de src/app/track/[token]/page.tsx (1181 → 1058 lignes) :
  • Restauration palette QRTags signature : QRTAGS_BG=#E3B23C, QRTAGS_CARD=#FFFFFF, QRTAGS_INK=#111111, QRTAGS_RED=#DC2626, QRTAGS_GREEN=#16A34A
  • Classe CARD_CLASS = 'bg-white rounded-xl p-6 shadow-xl border-2 border-black' — STRICTEMENT identique à /inscrire
  • Header centré : logo QRTags (badge blanc bordé noir) + titre "📍 SUIVI DE MON OBJET" + sous-titre italique
  • 5 cartes empilées (au lieu de sticky header + sticky footer) :
    1. Identité du tag (référence + statut ACTIF/PERDU + propriétaire masqué + expiration)
    2. Informations de l'objet (photo + nom + catégorie + marque/modèle + couleur + description + récompense + message propriétaire) — UNIQUEMENT si au moins un champ est renseigné
    3. Statistiques de suivi (grille 3 colonnes : Scans / Activités / Sûr + dernière activité + dernière position)
    4. Historique des scans (3 derniers, avec finder name + finder phone affichés en texte brut)
    5. Actions rapides (WhatsApp partager + Copier lien + URL privée + Signaler PERDU/J'ai retrouvé)
  • SUPPRESSION du sticky footer avec "Appeler Hôtel" / "WhatsApp propriétaire"
  • SUPPRESSION des helpers buildWhatsAppUrl + buildTelUrl + isHotelContext + telUrl + primaryAction
  • Le bouton WhatsApp devient "Partager ce lien sur WhatsApp" — intention : partager avec amis/famille, PAS contacter le propriétaire
  • Suppression de l'import Phone (lucide-react) — plus utilisé
- Conservation des features modernes :
  • Object info (nom, catégorie, marque, modèle, couleur, description, récompense, message, photo)
  • maskName() pour propriétaire + trouveur
  • IntersectionObserver fade-in
  • Auto-refresh 60s
  • Clipboard API + fallback execCommand
  • Toast feedback (success/error/info)
  • Modale accessible (Escape, focus trap, aria-modal, aria-labelledby, aria-describedby)
  • Skip link clavier
  • computeIsActive() avec gestion expiresAt + check_out_date
- Vérifications :
  • TypeScript : 0 erreur sur src/app/track/[token]/page.tsx (erreurs préexistantes ailleurs non touchées)
  • ESLint : 2 warnings préexistants (react-hooks/preserve-manual-memoization sur hasReward et objectDisplayName) — déjà présents dans la version précédente

Stage Summary:
- Design QRTags signature restauré : jaune moutarde #E3B23C + cartes blanches border-2 border-black ✓
- Cohérence visuelle avec /inscrire retrouvée (même palette, même CARD_CLASS, même header logo badge) ✓
- Incohérence "Appeler Hôtel" supprimée — plus aucun bouton contextualisé hôtel ✓
- Incohérence "WhatsApp vers soi-même" supprimée — le bouton WhatsApp devient partage de lien ✓
- Features modernes conservées (object info, photo, reward, accessibility, fade-in, auto-refresh, toast) ✓
- Types et contrat API préservés (GET /api/track/[token], POST declare_lost/cancel_lost) ✓

---
Task ID: logo-replace-all-pages
Agent: Main Orchestrator
Task: Remplacer le logo QRTags par le nouveau fichier fourni (log.jpg) sur toutes les pages (accueil, footer, etc.)

Work Log:
- Analyse centralisation logo : QRTagsLogo.tsx est l'unique source de vérité, référencé par 19 fichiers (27 sites de rendu)
- Conversion log.jpg (335x100 JPEG) → public/logo.png (PNG optimisé, même dimensions)
- Update src/components/qrtags/QRTagsLogo.tsx :
  • LOGO_VERSION '20260725' → '20260726' (cache-buster pour forcer refresh navigateur)
  • width={276} → width={335} (nouvelles dimensions intrinsèques pour éviter layout shift)
- Update public/sw.js :
  • CACHE_NAME 'qrbag-v2' → 'qrbag-v3' (invalide precache SW pour refetch du nouveau logo)
- Cohérence marque — favicon & PWA icons aussi régénérés depuis le nouveau logo :
  • public/favicon.png (32x32, crop centre du logo horizontal)
  • public/apple-touch-icon.png (180x180)
  • public/icons/icon-{72,96,128,144,152,192,384,512}.png (8 tailles PWA)
  • public/icons/maskable-icon-{192,512}.png (avec padding 30% pour safe zone Android)
  • public/icons/favicon-16x16.png
- Vérifications :
  • TypeScript : 0 erreur sur QRTagsLogo.tsx
  • Fichiers générés valides (PNG optimisés, tailles conformes aux références dans layout.tsx + manifest.json)

Stage Summary:
- Nouveau logo propagé sur TOUS les sites de rendu via QRTagsLogo.tsx (27 sites / 19 fichiers) ✓
- Pages concernées : homepage (header + footer), devenir-partenaire, voyageurs-standard, inscrire, inscription, success, scan, suivi, track, checklist, shop, auth (login/agence/admin), 404, reset-password, verify-email, forgot-password, et toutes les pages via PublicLayout (a-propos, cgu, contact, confidentialite, mentions-legales, demo, fonctionnalites/*, etapes/*)
- Cache-buster bumped (LOGO_VERSION + CACHE_NAME) pour forcer refresh chez tous les visiteurs ✓
- Favicon + PWA icons régénérés pour cohérence marque ✓

---
Task ID: reviews-from-tracking-page
Agent: Main Orchestrator
Task: Ajouter un système d'avis publié IMMÉDIATEMENT depuis /track/[token] après qu'un objet a été retrouvé, avec page publique /avis dédiée

Work Log:
- Analyse infrastructure existante :
  • ReviewModal.tsx existe (formulaire générique) — étendu avec nouveaux champs
  • /api/reviews route POST/GET existe — étendue
  • Review model Prisma existe — étendu avec 5 nouveaux champs
  • Publication était modérée (isApproved=false par défaut) → passé à true
- Schéma Prisma — ajout de 5 champs au model Review :
  • trackingToken (String?) — lien vers baggage
  • finderName (String?) — nom du trouveur (masqué côté UI via maskName)
  • objectName (String?) — nom de l'objet retrouvé
  • objectPhoto (String?) — URL photo objet (depuis objectInfo.photo)
  • objectCategory (String?) — catégorie objet
  • isApproved default false → true (publication immédiate)
  • Index ajouté sur trackingToken
- Script de migration SQL scripts/migrate-db.cjs :
  • Ajout ALTER TABLE pour les 5 nouveaux champs Review
  • Création d'index Review_trackingToken_idx
- API /api/reviews/route.ts :
  • POST étendu pour accepter finderName, trackingToken, objectName, objectPhoto, objectCategory
  • Logique : isApproved=true si trackingToken présent (avis depuis /track/[token]), false sinon (avis legacy générique)
  • Validation des nouveaux champs (types string optionnels)
  • GET étendu pour retourner les nouveaux champs
- API /api/reviews/public/route.ts (NOUVEAU) :
  • GET publique sans rate limit
  • Retourne les avis publiés (isApproved=true) avec champs publics only
  • Limite 50 avis + agrégat stats (averageRating + totalReviews)
- ReviewModal.tsx — refactor complet :
  • Ajout props : trackingToken, finderName, objectName, objectPhoto, objectCategory, reviewerName, onSubmitted
  • Bandeau "Objet retrouvé" en haut de la modale avec photo + nom + catégorie (fond jaune doré)
  • reviewerName pré-rempli avec maskName du propriétaire
  • onSubmitted callback pour permettre au parent de marquer l'avis comme publié
- Page /track/[token] — ajout du bouton "Laisser un avis" :
  • Visible UNIQUEMENT après que l'objet a été marqué retrouvé
    (baggage.foundAt existe OU baggage.declaredLostAt && !baggage.isLost)
  • Bouton vert avec icône étoile
  • Anti-double-post via state hasReviewed
  • Passe les bons champs à ReviewModal : trackingToken, finderName (du dernier scan), objectName, objectPhoto, objectCategory
  • onSubmitted → setHasReviewed(true) + toast succès "Votre avis est publié sur /avis"
  • Import de Star (lucide-react) + ReviewModal
- Page publique /avis (NOUVEAU src/app/avis/page.tsx) :
  • Design QRTags signature — jaune moutarde #E3B23C + cartes blanches border-2 border-black
  • Header : logo QRTags + titre "⭐ AVIS QRTAGS" + stats globales (note moyenne + nombre d'avis)
  • Liste des avis sous forme de cartes empilées :
    - Étoiles 1-5 (vert QRTAGS_GREEN)
    - Bandeau "Objet retrouvé" avec photo + nom + catégorie (si présent)
    - Titre (optionnel)
    - Message du propriétaire entre guillemets
    - Pied : nom du propriétaire + "Merci à {finderName masqué}" + localisation + date
  • États : loading (spinner), error (retry), empty (message + CTA)
  • CTA bas de page : "Activer mon QR code" → /inscrire
  • Utilise PublicNavigation + PublicFooter pour cohérence
- Footer PublicLayout.tsx — ajout lien "Avis ⭐" dans section Entreprise
- Sitemap src/app/sitemap.ts — ajout /avis (changeFrequency: 'daily', priority: 0.8)

Vérifications :
- TypeScript : 0 erreur sur les fichiers modifiés
- ESLint : 0 erreur sur nouveaux fichiers (avis/page.tsx, ReviewModal.tsx, route.ts)
  • 2 warnings préexistants dans track/[token] (react-hooks/preserve-manual-memoization) — non touchés
- Next.js build : SUCCESS, page /avis pré-rendue en statique ✓
- Prisma client regénéré avec nouveaux champs Review
- Script migrate-db.cjs met à jour SQLite automatiquement au prochain déploiement

Stage Summary:
- Flux complet propriétaire → trouveur → avis public opérationnel ✓
- Publication immédiate sans modération admin (conforme demande) ✓
- Page /avis dédiée avec design QRTags signature cohérent ✓
- Photo de l'objet + nom du trouveur masqué (RGPD) affichés sur l'avis ✓
- Footer + sitemap mis à jour ✓
- Aucune régression sur l'existant (ReviewModal étendu, pas cassé)
