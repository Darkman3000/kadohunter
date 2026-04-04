# Checkpoint: Profile Refactor & Monorepo Stability

**Date**: 2026-04-04 08:03
**Module**: Profile Component, Metro Infrastructure, Convex Schema

## Summary

This checkpoint focuses on improving code maintainability in the mobile app by extracting large sub-views from `profile.tsx` into standalone components. It also addresses critical monorepo infrastructure issues and updates the billing model.

### Core Changes

- **Mobile UI**:
  - Extracted `ProfileWishlist` and `ProfileHistory` components from `profile.tsx` (moved to `apps/mobile/components/profile/`).
  - Extracted code-scanning UI into `apps/mobile/components/scanner/`.
  - Added `clsx` and `tailwind-merge` for cleaner dynamic styling.
- **Infrastructure**:
  - Updated `apps/mobile/metro.config.js` with a robust monorepo resolver. This fixes issues where symlinked packages from the workspace root (like `@kado/ui`) were not correctly resolved.
  - Added basic GitHub Actions folder `.github/` for future CI/CD.
- **Convex Backend**:
  - Simplified `users` table: consolidated `pro_monthly` and `pro_annual` into a single `pro` tier with an optional `billingCycle` field.
  - Added `by_market_price` index to `savedScans` to support future sorting features.
  - Refined `trades.ts` queries to use better type safety.

## State

- Backend Schema: ✅ Updated
- Mobile Infrastructure: ✅ Resolving monorepo packages correctly
- UI Integrity: ✅ Profile view functional after refactor
- Lint: ⚠️ 21 TS errors in `app/card/[id].tsx` (Property 'cardName' and 'imageUrl' issues on mixed user/card types).

## Next Steps

- Refactor `app/card/[id].tsx` to resolve type ambiguities between user objects and card objects.
- Finish integrating the new `FriendPicker` and `CardPicker` components.
