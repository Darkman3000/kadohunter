# Checkpoint: Initial Scaffold

**Date**: 2026-04-03 09:41
**Module**: Full KadoHunter monorepo scaffold

## Summary

Initial commit of the KadoHunter monorepo workspace. This is the Phase 1 scaffold containing:

- **apps/mobile**: Expo SDK 55 mobile app with EAS build profiles, Clerk + Convex env surface
- **apps/web**: Vite web app scaffold
- **convex/**: Convex backend (schemas, functions, image backfill)
- **packages/**: Shared packages (contracts, domain, ui)
- **reference/**: Design and architecture reference docs
- **todo/**: Task tracking

## State

- Monorepo structure: ✅ working
- EAS profiles: ✅ configured
- Env surface: ✅ standardized (.env.example files)
- Lint (mobile): ⚠️ 9 TS errors (pre-existing — missing imports, type mismatches)
- Lint (web, contracts, domain, ui): ✅ clean

## Known Issues

- `useMutation` not imported in hunternet.tsx
- Type mismatches in profile.tsx (6 errors)
- `PlusIcon` undefined in card/[id].tsx
- Internal query reference issue in convex/imageBackfill.ts
