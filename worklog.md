---
Task ID: 1
Agent: Main Agent
Task: Create /suivi/[reference] public tracking page + API + scan context detection + WhatsApp pre-filled message generator

Work Log:
- Cloned qrbags repo from GitHub to restore previous session's work
- Updated Prisma schema: added `context`, `finderName`, `finderPhone` fields to ScanLog model
- Pushed schema with `bunx --bun prisma db push`
- Created `src/lib/scan-context.ts` with `detectScanContext()` — 4 contexts (departure/arrival/transit/static)
- Created `src/lib/whatsapp-message.ts` with `generatePreFilledMessage()` + `buildWhatsAppUrl()`
- Created `/api/suivi/[reference]/route.ts` — GET endpoint with rate limiting, data filtering (no email/owner phone/raw GPS)
- Updated `/api/scan/[reference]/route.ts` POST — saves context, finderName, finderPhone to ScanLog
- Created `/suivi/[reference]/page.tsx` — Full Design Billet Premium tracking page
- Updated `src/lib/logger.ts` — added 'suivi' to logMetric service type
- Added i18n keys (tracking.*) + finder context keys to FR/EN/AR locales

Self-Critique (3 bugs found & fixed):
1. `logMetric('suivi', ...)` — type error: 'suivi' not in union type → Fixed by adding 'suivi' to logger.ts
2. `ContextBadge` had dead `t === (() => '')()` comparison → Removed, used i18n key mapping instead
3. `fetchSuivi(showLoading)` logic inverted — initial load showed refresh spinner, manual refresh didn't → Fixed parameter semantics
4. Dead `lastScan` variable declared but unused in main render → Removed
5. `data.status === 'error'` not caught → Added to error guard
6. `isDeclaredLost` could be truthy with empty string → Added `!!` coercion
7. `window.open() ||` unused expression lint warning → Replaced with explicit null check
8. Unused imports `Luggage`, `User` → Removed

Stage Summary:
- 6 new files created, 3 existing files modified
- Zero TS errors, zero lint errors in all new/modified files
- Design 100% consistent with scan page (white bg, blue blocks, dashed borders, orange buttons)
- Security: API never exposes email, owner WhatsApp, raw GPS coordinates
- Google Maps iframe with lat/lon priority, address fallback, placeholder for unavailable
- i18n complete: FR, EN, AR with all tracking.* keys
- WhatsApp pre-filled message: 4 contextual scenarios, <400 chars, emoji formatting

---
Task ID: 2
Agent: Main Agent (Self-Critique Round)
Task: Comprehensive audit and bug fix of /suivi feature

Work Log:
- Read and audited all 10 files: prisma schema, scan-context.ts, whatsapp-message.ts, suivi API route, suivi page, scan API route, logger.ts, fr/en/ar locales, scan page
- Ran `npx tsc --noEmit` — zero new errors (only pre-existing errors in admin/agence/success files)
- Ran `bun run lint` — zero errors
- Found BUG #1: Context dropdown missing from finder form (i18n keys existed but no <select> UI element)
- Found BUG #2: `selectedContext` missing from `handleWhatsApp` useCallback dependency array (stale closure)
- Found BUG #3: `selectedContext` missing from `handlePhoneCall` useCallback dependency array (stale closure)
- Found UX BUG #4: Found badge showed "VOTRE BAGAGE EST PROTÉGÉ" instead of "BAGAGE RETROUVÉ" — missing `badge_found` i18n key
- Fixed all 4 bugs

Stage Summary:
- Context dropdown now visible in finder form between WhatsApp input and Contact Buttons
- Both `handleWhatsApp` and `handlePhoneCall` now correctly send `context` in POST body
- `selectedContext` added to both dependency arrays (no stale closures)
- Added `tracking.badge_found` key to FR ("BAGAGE RETROUVÉ"), EN ("BAGGAGE FOUND"), AR ("تم العثور على الأمتعة")
- Badge logic now shows: lost → 🚨 badge_lost, found → ✅ badge_found, active → badge_active ✈️
- All pre-existing TS errors documented as out-of-scope (admin routes, agence layout, success page, etc.)

---
Task ID: 8
Agent: Sub Agent (i18n transport keys)
Task: Add `transport` section to FR/EN/AR i18n locale files

Work Log:
- Read worklog.md and all 3 locale files (fr.json, en.json, ar.json)
- Added `transport` section (41 keys) as the last section in each file, after the existing `tracking` section
- Verified all 3 JSON files parse successfully
- Verified all 3 locales have identical key sets (41 keys each)

Files Modified:
- public/locales/fr.json — added transport section (FR translations)
- public/locales/en.json — added transport section (EN translations)
- public/locales/ar.json — added transport section (AR translations)

Stage Summary:
- 3 files modified, 0 existing keys changed
- 41 new i18n keys per locale (123 total): transport mode selection (flight/train/boat/bus), form labels, placeholders, detail headings, activate button
- All JSON validated successfully

---
Task ID: 4-5
Agent: Sub Agent (multi-transport form + API)
Task: Refactor /inscrire page for 2-step transport mode selection + update /api/activate with transport fields

Work Log:
- Read worklog.md, inscrire/page.tsx, api/activate/route.ts, useTranslation hook, TransportModeSelector component, transport.ts lib, all 3 locale files, Prisma schema
- Added `inscrire` section (36 keys) to all 3 locale files (fr/en/ar) for complete i18n of the activation form
- Added `transport` section (24 keys) to all 3 locale files (fr/en/ar) — some keys overlapped with existing task-8 transport section, so merged/extended as needed
- Rewrote `/src/app/inscrire/page.tsx`:
  - Added imports: useTranslation, TransportModeSelector, TransportMode type, TRANSPORT_ICONS, TRANSPORT_FIELDS
  - Added state: transportMode, step (1 or 2), extended formData with all transport conditional fields
  - Step 1: TransportModeSelector grid with continue button (disabled until mode selected)
  - Step 2: Dynamic form fields rendered from TRANSPORT_FIELDS[transportMode]; universal fields (destination, date/time, whatsapp) always shown; back button to step 1
  - CardHeader uses TRANSPORT_ICONS[transportMode] instead of hardcoded Plane icon
  - All text uses t() — zero hardcoded French strings in render
  - Submit button disabled if !transportMode
  - handleSubmit sends transportMode + all conditional fields to /api/activate
  - sessionStorage activationData includes transportMode
  - Preserved: bg-[#6613e3] purple background, glassmorphism cards, orange buttons, Tabs (manual/scan), scan tab unchanged, pre-fill from URL, loading states, min-h-[48px] touch targets
  - All TRANSPORT-FEATURE changes marked with `// TRANSPORT-FEATURE:` comments
- Modified `/src/app/api/activate/route.ts`:
  - Added to Zod schema: transportMode (z.enum), trainCompany, trainNumber, shipName, shipCabin, busCompany, busLineNumber (all optional)
  - Added transportMode + all conditional fields to main db.baggage.update() data object
  - Added transportMode: 'flight' (forced) + all conditional fields set to null for hajj-related group baggage updates
  - All changes marked with `// TRANSPORT-FEATURE:` comments
- Ran `bun run lint` — zero errors
- Dev server compiles successfully (verified via dev.log)

Files Modified:
- public/locales/fr.json — added inscrire section + extended transport section
- public/locales/en.json — added inscrire section + extended transport section
- public/locales/ar.json — added inscrire section + extended transport section
- src/app/inscrire/page.tsx — complete rewrite with 2-step transport mode form
- src/app/api/activate/route.ts — extended Zod schema + DB updates with transport fields

Self-Critique:
- No bugs found. All changes are additive; no existing functionality broken.
- i18n keys carefully chosen to not conflict with existing sections.
- TransportModeSelector component already existed and was correctly integrated.

Stage Summary:
- 5 files modified (3 locale + 2 source)
- Zero lint errors, zero compilation errors
- /inscrire now supports multi-transport mode selection (flight/train/boat/bus) via 2-step form
- /api/activate now accepts and persists transportMode + all conditional transport fields
- Complete i18n coverage: FR, EN, AR with inscrire.* and transport.* keys
- All existing features preserved (pre-fill from URL, scan tab, glassmorphism design, responsive layout)

---
Task ID: 6
Agent: Sub Agent (scan page multi-transport)
Task: Add multi-transport mode display support to scan API GET response + finder scan page

Work Log:
- Read worklog.md, API route (scan/[reference]/route.ts), scan page (scan/[reference]/page.tsx), and transport.ts lib
- Modified `/src/app/api/scan/[reference]/route.ts` GET handler:
  - Added `transportMode: baggage.transportMode || 'flight'` to baggage response object
  - Added 6 conditional transport fields: trainCompany, trainNumber, shipName, shipCabin, busCompany, busLineNumber
  - POST handler left untouched
- Modified `/src/app/scan/[reference]/page.tsx`:
  - Added 7 new fields to BaggageData interface: transportMode, trainCompany, trainNumber, shipName, shipCabin, busCompany, busLineNumber
  - Added imports: safeTransportMode, getTransportIcon, getTransportBlockHeader, TransportMode from @/lib/transport
  - Replaced hardcoded flight-only BLOC 2 with conditional rendering based on transportMode (flight/train/boat/bus)
  - Each transport mode renders its own DashedEncart with mode-specific fields and emoji icon
  - Block header now uses getTransportBlockHeader() for localized titles
  - Status badge emoji now dynamically uses getTransportIcon(safeTransportMode(baggage?.transportMode)) instead of hardcoded ✈️
  - Destination and date sections now use transport.common_destination / transport.common_departure_date i18n keys
  - Ran `bun run lint` — zero errors

Files Modified:
- src/app/api/scan/[reference]/route.ts — added transportMode + 6 conditional fields to GET response
- src/app/scan/[reference]/page.tsx — added interface fields, transport imports, conditional BLOC 2, dynamic badge emoji

Self-Critique:
- No bugs found. All changes are additive; no existing functionality broken.
- Existing ChatbotWidget, groq.ts, whatsapp-message.ts, GPS logic, rate-limiting all untouched.
- POST handler in API route untouched.
- Design preserved: bg-white, bg-[#0A192F] blocks, border-dashed, text-white, orange buttons.
- All TRANSPORT-FEATURE changes marked with comments.

Stage Summary:
- 2 files modified
- Zero lint errors
- /scan page now dynamically displays transport info based on transportMode (flight/train/boat/bus)
- API GET response now includes all transport fields for consumer flexibility
- Backward compatible: legacy baggage without transportMode defaults to 'flight' display

---
Task ID: 7
Agent: Sub Agent (suivi multi-transport display)
Task: Add multi-transport mode display support to /suivi/[reference] API + page

Work Log:
- Read worklog.md, api/suivi/[reference]/route.ts, suivi/[reference]/page.tsx
- Modified `/src/app/api/suivi/[reference]/route.ts`:
  - Added `transportMode` field (default 'flight') to baggage response object
  - Added 6 conditional transport fields: trainCompany, trainNumber, shipName, shipCabin, busCompany, busLineNumber (all nullable)
  - All changes marked with `// TRANSPORT-FEATURE:` comment
- Modified `/src/app/suivi/[reference]/page.tsx`:
  - Added imports: safeTransportMode, getTransportIcon, getTransportBlockHeader from @/lib/transport; TransportMode type
  - Extended BaggageInfo interface with transportMode + 6 conditional fields (trainCompany, trainNumber, shipName, shipCabin, busCompany, busLineNumber)
  - Replaced hardcoded "Airline + Flight" DashedEncart block with conditional IIFE that renders mode-specific transport info (flight/train/boat/bus) with appropriate icons and i18n keys
  - Updated status badge emoji from hardcoded ✈️ to dynamic `getTransportIcon(safeTransportMode(baggage.transportMode))`
  - Updated "Destination" label from t('finder.destination') to t('transport.common_destination')
  - Updated "Départ prévu" label from t('finder.departureDate') to t('transport.common_departure_date')
  - All changes marked with `// TRANSPORT-FEATURE:` comments
- Ran `bun run lint` — zero errors

Files Modified:
- src/app/api/suivi/[reference]/route.ts — added transportMode + 6 conditional fields to API response
- src/app/suivi/[reference]/page.tsx — added imports, interface fields, conditional transport block, dynamic badge icon, updated i18n labels

Stage Summary:
- 2 files modified, zero lint errors
- /suivi page now displays transport-specific info based on transportMode (flight ✈️ / train 🚆 / boat 🚢 / bus 🚌)
- API response includes all transport fields for frontend consumption
- Existing "Billet Premium" design fully preserved
- All TRANSPORT-FEATURE changes clearly marked with comments

---
Task ID: 9
Agent: Sub Agent (transport display minor adjustments)
Task: Add transport mode support to success page, marketing page, and baggage detail page

Work Log:
- Read worklog.md and all 3 target files
- Modified `/src/app/success/page.tsx` (3 changes):
  - Added `transportMode?: string` to ActivationData interface
  - Updated download proof canvas: replaced hardcoded flight detail with dynamic IIFE that renders mode-specific transport info (✈️/🚆/🚢/🚌)
  - Updated destination info section: replaced hardcoded `flightNumber || 'Destination'` with dynamic transport mode label + icon
- Modified `/src/app/admin/marketing/page.tsx` (2 changes):
  - Added `transportMode?`, `trainNumber?`, `shipName?`, `busLineNumber?` to TravelerBaggage interface
  - Replaced single `b.flightNumber` span with conditional rendering for each transport mode + fallback for legacy data without transportMode
- Modified `/src/app/admin/baggage/[id]/page.tsx` (2 changes):
  - Added 13 transport fields to BaggageData interface (transportMode, airlineName, flightNumber, trainCompany, trainNumber, shipName, shipCabin, busCompany, busLineNumber, destination, departureDate, departureTime)
  - Added "Informations de transport" section after Baggage Details with mode-specific cards (flight/train/boat/bus) + destination card
- Ran `bun run lint` — zero errors

Files Modified:
- src/app/success/page.tsx — interface + download proof + destination info (3 targeted edits)
- src/app/admin/marketing/page.tsx — interface + transport display in detail modal (2 targeted edits)
- src/app/admin/baggage/[id]/page.tsx — interface + transport info section (2 targeted edits)

Self-Critique:
- No bugs found. All changes are purely additive; no existing functionality broken.
- Backward compatible: legacy data without transportMode still renders correctly (defaults to 'flight').
- All TRANSPORT-FEATURE changes clearly marked with comments.

Stage Summary:
- 3 files modified, 7 targeted edits total
- Zero lint errors
- success/page.tsx: dynamic transport detail in download proof canvas + destination info
- marketing/page.tsx: per-mode transport display in traveler detail modal baggage list
- baggage/[id]/page.tsx: full "Informations de transport" section with mode + mode-specific detail cards + destination
