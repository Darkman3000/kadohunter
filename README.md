# Workspace Starter

This folder contains a reusable code scaffold that matches the documentation workflow in `todo/template-pack`.

Use it when starting a new project that needs:
- a shared web and mobile workspace
- a backend boundary for secrets and async work
- shared contracts, domain helpers, and UI tokens
- a default path for Expo + EAS + Clerk + Convex + Railway

## Included

- `apps/web`: React + Vite starter surface
- `apps/mobile`: Expo starter surface with EAS build profiles
- `packages/backend`: Express API starter
- `packages/contracts`: shared API types
- `packages/domain`: shared domain constants
- `packages/ui`: shared design tokens
- `todo/template-pack`: reusable planning and operating docs
- `HANDOFF.md`: fresh-chat / fresh-dev handoff for the next implementation pass

## Phase 1 Mobile-Ready Components

The starter now includes:
- `apps/mobile/eas.json`: development, preview, and production build profiles
- `apps/mobile/.env.example`: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_CONVEX_URL`
- `apps/mobile/app.json`: starter scheme plus placeholder iOS/Android identifiers to replace before real builds
- `apps/mobile/src/lib/runtime-config.ts`: runtime setup surface for API, Clerk, and Convex env checks
- `apps/mobile/App.tsx`: a minimal status screen that shows setup readiness on device

## Not Included

- product-specific business logic
- provider-specific billing or AI integrations
- real production Clerk or Convex UI wiring beyond placeholder env surfaces
- completed EAS project initialization or store credentials

## First Steps In A New Repo

1. Copy this folder into the new repo root.
2. Rename the package names from `@starter/*` if desired.
3. Copy the matching docs from `todo/template-pack/templates/` into the new repo's `todo/` folder.
4. Copy `.env.example` to `.env`, `apps/web/.env.example` to `apps/web/.env.local`, and `apps/mobile/.env.example` to `apps/mobile/.env`.
5. Fill the provider values for Clerk and Convex.
6. Replace the placeholder bundle/package IDs in `apps/mobile/app.json`.
7. Run `npm install` from the starter root.
8. Run the local app surfaces before touching EAS:
   - `npm run dev:api`
   - `npm run dev:web`
   - `npm run dev:mobile`

## EAS Notes

- Run EAS commands from `apps/mobile` because that is where the Expo app config and `eas.json` live.
- Typical first commands:
  - `eas login`
  - `eas build:configure`
  - `eas build --profile development --platform android`
- If you have not created the Expo project yet, connect it before expecting remote builds to work.

## Reference Bundle

Use the reusable reference bundle when you need Zero-to-Hero, companion guides, or copied skill references:
- `D:\computer\brain\reference\workspace-starter`

## Security Note

- `.env.example` files are placeholders only and should remain blank
- do not commit live provider keys or tokens into this starter

## Sync Rule

When the source product improves a reusable pattern:
- update the live product first
- then update this starter if the change is generic
- then update `todo/template-pack` if the docs or workflow changed