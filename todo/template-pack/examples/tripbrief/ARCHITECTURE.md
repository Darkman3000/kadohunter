# Architecture Map

## Current Phase 1 State

`TripBrief` currently uses the following working shape:

```text
/apps
  /web
  /mobile
/packages
  /backend
  /contracts
  /domain
  /ui
/todo
```

Replace this layout if the project is intentionally not multi-surface.

## Package Roles

- `apps/web`: `account-aware trip planning web client`
- `apps/mobile`: `phone-first trip planning client for iOS and Android`
- `packages/backend`: `API and orchestration layer for auth, trip persistence, and AI calls`
- `packages/contracts`: `shared API payloads and type contracts`
- `packages/domain`: `shared business rules, prompt inputs, and event names`
- `packages/ui`: `shared design tokens and primitive components`

## Default Toolchain

- Hosting: `Railway`
- Auth: `Clerk`
- Data layer: `Convex`
- AI: `OpenAI`
- Web target: `Next.js`
- Mobile target: `Expo`
- Backend target: `Express`

## Layout Tiers

- `compact`: phone-first layout with stacked content
- `medium`: tablet or narrow desktop layout with denser content
- `expanded`: desktop-width layout with multi-panel content

These tiers can be shared across surfaces or replaced if the product is single-surface.

## Auth Runtime

- Backend auth runtime: `server-verified auth tokens and session-aware API routes`
- Web auth runtime: `client session provider plus backend session checks`
- Mobile auth runtime: `native auth provider plus backend session checks`
- Trust boundary: `client apps may hold public auth state, but the backend is the source of truth for account identity`

## Phase 1 Persistence

- Primary source of truth: `Convex`
- Account-owned entities: `users, trips, itinerary items, preferences, and entitlements`
- Large asset storage: `external object storage if user-uploaded attachments become part of the product`
- Fallback or migration adapter: `temporary local or mock adapter only during early development`

## Async Job Pipeline

- Long-running work type: `AI itinerary generation and enrichment`
- Job entrypoint: `backend route that creates and tracks generation jobs`
- Polling or callback model: `client polling with persisted job state`
- Output persistence: `save completed itineraries and job metadata to the data layer`

## Current Reality

- What is already real: `shared workspace structure, auth boundary, and persistence contract`
- What is still placeholder or incomplete: `final product UX, production deploy wiring, and store-specific release prep`
- Highest-risk gap: `shipping a reliable core itinerary loop before expanding scope`