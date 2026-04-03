# Workspace Starter Handoff

## Purpose

This starter is now prepared for the next dev AI to continue Phase 1 mobile setup work without re-discovering the basics.

It is not a finished app. It is a reusable monorepo scaffold with:
- Expo mobile app
- Vite web app
- Express backend
- shared contracts/domain/ui packages
- reusable `todo/template-pack` docs
- starter EAS profiles and env placeholders for Clerk + Convex

## What Was Added For This Handoff

- `apps/mobile/eas.json`
- `apps/mobile/.env.example` with Clerk + Convex mobile env names
- `apps/web/.env.example` with Clerk + Convex web env names
- root `.env.example` with Clerk + Convex backend env names
- `apps/mobile/src/lib/runtime-config.ts`
- `apps/mobile/App.tsx` setup-status surface
- updated `apps/mobile/app.json` with starter scheme and placeholder package IDs

## Current State

Ready now:
- Expo SDK 55 mobile scaffold exists
- EAS build profiles exist
- mobile env names are standardized
- device-facing setup status screen exists
- root README points the next dev to the right steps

Still manual:
- actual Expo account and EAS login
- actual Clerk project and publishable/secret keys
- actual Convex project and URL/deployment values
- actual bundle/package identifiers
- actual EAS project connection and device/build verification
- real Clerk and Convex client wiring if the next project needs it immediately

## Files The Next Dev Should Read First

1. `README.md`
2. `HANDOFF.md`
3. `apps/mobile/eas.json`
4. `apps/mobile/.env.example`
5. `apps/mobile/app.json`
6. `apps/mobile/App.tsx`
7. `apps/mobile/src/lib/runtime-config.ts`

## Exact Next Steps

1. Run `npm install` from the workspace root.
2. Create local env files from the examples.
3. Fill these values before expecting real provider behavior:
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_CONVEX_URL`
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CONVEX_DEPLOYMENT`
   - `CONVEX_URL`
4. Replace `com.example.workspacestarter` in `apps/mobile/app.json` with the real iOS bundle identifier and Android package.
5. Start local services and verify the app renders:
   - `npm run dev:api`
   - `npm run dev:mobile`
6. From `apps/mobile`, connect EAS:
   - `eas login`
   - `eas build:configure`
7. Run one build profile:
   - `eas build --profile development --platform android`
8. Verify the app on a real device or emulator.
9. Only after the app runs should the next dev expand into real Clerk + Convex UI/provider wiring.

## Good Answer To The Earlier Question

If another dev asks whether the starter already has the Phase 1 pieces:
- yes, it now has EAS build profiles and the right env surface for Expo + Clerk + Convex
- no, it still needs real Expo / EAS / Clerk / Convex projects and credentials before those integrations are truly live

## Reference Bundle

For Zero-to-Hero, copied guides, and reusable skill references, use:
- D:\computer\brain\reference\workspace-starter`r

If you also have a source product, treat that as an optional implementation reference rather than part of this generic starter.
