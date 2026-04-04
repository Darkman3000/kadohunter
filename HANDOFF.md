# KadoHunterApp — Handoff Document

> **Last updated:** 2026-04-03
> **Masterplan version:** Zero-to-Hero v3.40
> **Current phase:** Phase 2 (Build) — incomplete
> **Overall progress:** ~25-30% through the full masterplan

---

## What This App Does

**Kado Hunter** is a cross-platform TCG (Trading Card Game) collection manager. Users scan trading cards with their phone camera, an AI (Gemini 2.5 Flash) identifies the card, and the app shows market prices and saves it to their digital collection ("Binder").

**Target user:** TCG collectors (Pokémon, MTG, Yu-Gi-Oh!, One Piece, Dragon Ball) who want to know what their cards are worth.

**Revenue model:** Freemium — 5 free scans/day, unlimited with Pro subscription ($4.99/mo or $39.99/yr).

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Mobile | Expo 55 + React Native 0.83.2 + Expo Router |
| Web | React 19 + Vite 6 (stub only) |
| Backend | Convex (serverless DB + realtime API) |
| Auth | Clerk (OAuth) |
| AI | Google Gemini 2.5 Flash (card recognition) |
| External APIs | Pokémon TCG API, Scryfall (MTG), YGO Pro Deck |
| Styling | NativeWind + Tailwind CSS |
| Build | EAS (Expo Application Services) |
| Monorepo | npm workspaces: 2 apps + 3 shared packages |

---

## What Was Done (Most Recent Session — 2026-04-03)

### Backend Refactoring (convex/)

**Created shared utilities:**
- `convex/utils/auth.ts` — `getAuthenticatedUser`, `requireCurrentUser`, `requireAuthorizedUser`, `requireOwnedScan`, `getCurrentUserOrNull`
  - Replaced duplicate auth logic that existed in 5 separate files
- `convex/utils/friendships.ts` — `areFriends`, `requireFriendship`, `friendshipExists`
  - Replaced duplicate friendship checks in 3 files
- `convex/utils/imageResolver.ts` — `resolveImageUrl` for Pokemon/YGO/MTG APIs
  - Replaced duplicate image resolution in 2 files

**Files rewritten to use shared utils:**
- `convex/users.ts` — uses shared auth, simplified with spread operator and `requireOwnedScan`
- `convex/wishlists.ts` — uses `getCurrentUserOrNull` and `requireCurrentUser`
- `convex/friends.ts` — uses shared auth + `friendshipExists` + `areFriends`
- `convex/trades.ts` — uses shared auth + `areFriends`, extracted `validateCardOwnership`, fixed N+1 in `getMyTrades`
- `convex/sessions.ts` — uses shared auth + `areFriends`, fixed N+1 in `getSharedSessions`
- `convex/http.ts` — uses shared `resolveImageUrl`, extracted CORS headers, added JSON parse try-catch
- `convex/imageBackfill.ts` — uses shared `resolveImageUrl`, changed `getScansWithoutImages` from `internalMutation` to `internalQuery`

### Frontend Refactoring (apps/mobile/)

**Created shared code:**
- `apps/mobile/constants/breakpoints.ts` — `BREAKPOINTS.DESKTOP` (was hardcoded `768` in 6 files)
- `apps/mobile/utils/gameLabels.ts` — `getGameLabel()` (was duplicated in 3 files)
- `apps/mobile/utils/gameStyles.ts` — `getGameTone()`, `getRarityBorderColor()`
- `apps/mobile/hooks/useCurrentUser.ts` — shared auth query hook
- `apps/mobile/hooks/useResponsiveLayout.ts` — `{ width, isWeb, isDesktop }`

**Files updated to use shared code:**
- `app/_layout.tsx` — uses `BREAKPOINTS`
- `app/(tabs)/_layout.tsx` — uses `BREAKPOINTS`
- `app/(tabs)/binder.tsx` — uses `BREAKPOINTS`, imported `getGameLabel`, `getGameTone`, `getRarityBorderColor`
- `app/(tabs)/index.tsx` — imported `getGameLabel`
- `app/(tabs)/market.tsx` — uses `useResponsiveLayout`
- `app/(tabs)/hunternet.tsx` — uses `useResponsiveLayout`, fixed missing `useMutation` import
- `app/(tabs)/profile.tsx` — uses `useResponsiveLayout`
- `app/card/[id].tsx` — uses `BREAKPOINTS`

### Masterplan Update

- Updated `D:\computer\brain\zero-to-hero.md` to v3.40 with:
  - "Lessons Learned & AI Pitfalls" section (failure modes, session continuity, MVP scope discipline)
  - "Feature Scope Gate" added to Phase 2 (2.1.1)
  - Strengthened Phase 0.7 refactoring rules with continuous extraction
  - Added v3.40 checks to Phase 1 Done checklist (strict TS, 300-line limit, progress.md)

---

## What Remains (Prioritized)

### HIGH PRIORITY — Required for store submission

#### Phase 1 Gaps (Architecture)
- [ ] Wire real Clerk + Convex credentials (currently placeholder keys)
- [ ] Set up CI/CD pipeline (lint + types + audit on push)
- [ ] Branch protection on `main`
- [ ] Environment separation (dev/staging/prod)
- [ ] Native signing: APNs key, FCM, keystore backup
- [ ] iOS privacy manifest compliance
- [ ] Enable `"strict": true, "noImplicitAny": true` in tsconfig

#### Phase 2 Gaps (Build)
- [ ] Split `profile.tsx` (1,140 lines → ~400 lines + extracted components)
  - Extract: `HunterLicenseCard.tsx` (~140 lines), `Avatar.tsx` (~65 lines), `ProfileDashboard.tsx`, `ProfileFriends.tsx`, `ProfileWishlist.tsx`
  - Extract hooks: `useProfileAuth`, `useFlipAnimation`
- [ ] Split `index.tsx` scanner (888 lines → ~350 lines + extracted components)
  - Extract: `ScanResultCard.tsx` (~160 lines), `ScannerFrame.tsx`, `ScanModeSelector.tsx`
  - Extract hooks: `useScanRecognition`, `useScanAnimation`
- [ ] Fix all `any` types in `trade.tsx`, `CardPicker.tsx`, `FriendPicker.tsx`
- [ ] Complete visual parity migration (Profile Identity/Settings, Profile Network/Friends screens not started)
- [ ] Schema alignment: `schema.ts` uses `"pro_monthly" | "pro_annual"` but contracts/domain use `"free" | "pro"` — normalize to single `tier` + `billingCycle`
- [ ] Build onboarding flow (4 screens per plan 2.1)
- [ ] Add demo mode for store reviewers
- [ ] Integrate analytics events (PostHog or equivalent)
- [ ] Add "Delete Account" in settings

#### Phase 3 (Monetization) — Not started
- [ ] Integrate RevenueCat (iOS + Android IAP)
- [ ] Set up Stripe for web payments
- [ ] Build entitlement state machine
- [ ] Wire paywall to real IAP products
- [ ] Add "Restore Purchases" button
- [ ] Unit economics baseline document

#### Phase 4 (Legal) — Not started
- [ ] Write Privacy Policy (GDPR + CCPA compliant)
- [ ] Write Terms of Service
- [ ] Host at real URLs: `/privacy-policy`, `/terms-of-service`, `/support`
- [ ] Complete domain risk classification (camera, minors, AI advice flags apply)
- [ ] Data inventory + lawful basis map
- [ ] AI disclosure in privacy policy (Gemini usage)

#### Phase 5 (Ops) — Not started
- [ ] Integrate Sentry (web + mobile + convex)
- [ ] Set up support email (`support@kadohunter.com`)
- [ ] Disaster recovery playbook
- [ ] Admin "grant Pro" mutation

#### Phase 6 (QA) — Not started
- [ ] Write automated tests (entitlement logic, scan limits at minimum)
- [ ] Smoke test on real iOS + Android devices
- [ ] Pre-launch security audit (`npm audit`, `gitleaks`, no exposed keys)
- [ ] Sourcemaps uploaded to Sentry

#### Phase 7 (Store) — Not started
- [ ] Create App Store Connect + Play Console records
- [ ] IAP products mapped to RevenueCat
- [ ] Screenshots, app icon (1024x1024), ASO keywords
- [ ] Store listing metadata

### MEDIUM PRIORITY — Improves quality but not blocking

- [ ] Backend N+1 fixes remaining in `wishlists.ts` (price enrichment) and `notifications.ts` (user+wishlist+price)
- [ ] Add pagination to `prices.ts` (currently `.collect()` loads all into memory)
- [ ] Add missing index on `hunterTag` in schema
- [ ] Add input validation to mutation handlers (price ranges, hunterTag format)
- [ ] Extract more custom hooks: `useGridLayout` (binder), `useTabNavigation` (multiple screens)
- [ ] Use `scanLimits` from `@kado/domain` instead of hardcoded `5` in `users.ts` (comment exists, import needed)

### LOW PRIORITY — Phase 9 (post-launch polish)

- [ ] Landing page for marketing
- [ ] Distribution plan + attribution
- [ ] Re-engagement push notifications (D3, D7, D14)
- [ ] Market intelligence dashboard improvements
- [ ] Flea market mode polish

---

## Known Issues

1. **Pre-existing type errors in `app/card/[id].tsx`** — generic `ctx.db.get()` return type doesn't narrow properly. These existed before the refactoring.
2. **`hunternet.tsx` line 85** — `useMutation` was missing from import (fixed in this session).
3. **Schema tier mismatch** — `schema.ts` defines `"free" | "pro_monthly" | "pro_annual"` but `@kado/contracts` defines `"free" | "pro"`. Frontend uses `@kado/domain` correctly but backend schema diverges.
4. **`PUBLIC-SHARE-CHECKLIST.md` blockers** — .env files may contain live secrets, hardcoded `D:\` paths in docs, placeholder Clerk/Convex keys.

---

## Key Decisions Made

| Decision | Choice | Why |
|----------|--------|-----|
| Platform strategy | Unified (Expo Web + Mobile) | Product UI is the same across platforms; scan on mobile, manage on desktop |
| Backend | Convex | Real-time sync, type safety, no infra management |
| Auth | Clerk | Speed to ship, managed auth, native/mobile ergonomics |
| AI provider | Gemini 2.5 Flash | Generous free tier, multi-modal, fast |
| Styling | NativeWind | True UI parity across platforms |
| Image resolution | External APIs (Pokemon TCG, Scryfall, YGO Pro) | Free, canonical sources, no image hosting needed |

---

## Files The Next Dev Should Read First

1. This file (`HANDOFF.md`)
2. `convex/schema.ts` — database schema (200 lines, source of truth)
3. `packages/contracts/src/index.ts` — shared TypeScript types
4. `packages/domain/src/index.ts` — app constants (scan limits, subscription plans, games)
5. `apps/mobile/app/_layout.tsx` — root layout with Clerk + Convex providers
6. `apps/mobile/app/(tabs)/index.tsx` — scanner (main feature)
7. `convex/utils/auth.ts` — shared backend auth helpers
8. `D:\computer\brain\zero-to-hero.md` — the masterplan (read Phase 2 and Phase 3 sections)

---

## Project Locations

- **App repo:** `D:\myprojects\KadoHunterApp`
- **Masterplan:** `D:\computer\brain\zero-to-hero.md` (v3.40)
- **Prototype reference:** `D:\myprojects\KadoHunterApp\todo\remix_prototype\`
- **Visual parity guide:** `D:\myprojects\KadoHunterApp\todo\visual-parity-workflow.md`