# `TripBrief` Zero-to-Hero Implementation Plan

> Source blueprint: `internal zero-to-hero blueprint`  
> Intent: adapt the blueprint to the actual starting point of `TripBrief`.  
> End state: `web, iOS, and Android with shared backend contracts, real account-linked persistence, AI itinerary generation, and launch-ready operations`.

## Executive Summary

- This plan follows the blueprint phases from Phase 0 through Phase 9.
- The target product surfaces are `web, iOS, and Android`.
- The current product reference is `design prototype and feature notes`.
- Tooling defaults are documented separately in `todo/template-pack/stack-defaults.md` and should be copied only if they fit the new project.
- The highest-risk sequencing dependency is `real shared auth and persisted trip data before monetization or launch work`.

## Current State Audit

- Current frontend state: `wireframes exist, but the real product shell is not built yet`
- Current backend state: `backend boundaries need to be scaffolded`
- Current data/auth state: `providers are chosen but not configured`
- Current verification baseline: `no production-ready verification exists yet`

## What Multi-Surface Means For `TripBrief`

Multi-surface in this plan means all of the following are true:

- `web is a real product surface, not just a prototype`
- `mobile is one maintained app for iOS and Android`
- `the backend owns auth, persistence, and AI boundaries`
- `shared contracts keep data shapes aligned across surfaces`
- `users can recover the same saved trip state on any supported surface`

If the project is intentionally single-surface, replace this section with the actual supported surface definition.

## Non-Negotiable Rules For This App

- Keep all project documentation in `todo/`.
- No private secrets may be exposed in browser or mobile client code.
- Treat long-running media or AI work as an async job system unless the product proves otherwise.
- Break work into commit-sized slices. After each slice: verify, update `progress.md`, and commit.
- No production file should remain over `300` lines without a clear reason and follow-up split plan.
- The app must support a reviewer-safe demo flow before store submission if stores are in scope.
- Shared contracts must stay aligned across all shipped surfaces.

## Required Companion Docs In `todo/`

- `todo/PRD.md`
- `todo/progress.md`
- `todo/autonomy-intake.md`
- `todo/approval-matrix.md`
- `todo/env-manifest.md`
- `todo/legal-risk.md`

## Reference Inputs

### Primary blueprint

- `internal zero-to-hero blueprint`

### Product and implementation references to adapt

- `design prototype`
- `feature outline`
- `provider setup notes`

## Installed Tooling And Workflow Defaults

- Web: `Next.js`
- Mobile: `Expo`
- Backend: `Express`
- Auth: `Clerk`
- Data: `Convex`
- Hosting: `Railway`
- AI: `OpenAI`

## Target Architecture

### Architecture decisions

- Product surfaces: `web, iOS, and Android`
- Auth boundary: `backend-verified identity with public client providers`
- Data boundary: `shared backend plus one source of truth for account-owned state`
- Asset storage boundary: `object storage only if file uploads become core to the product`
- Async job boundary: `backend-created jobs with persisted status and client polling`

## Cross-Phase Dependencies

- `auth and account persistence must exist before cross-device claims are made`
- `legal, QA, and ops gates must be green before public launch`
- `billing must attach to real account state`
- `analytics and support paths must exist before scale efforts begin`

## Planned Command Surface By End Of Phase 1

- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run dev`

## Phase 0 - Validate

Goal: lock the product, user, and risk assumptions before architecture work expands.

- Create the required companion docs.
- Lock the MVP scope and non-goals in `PRD.md`.
- Record access, approvals, and environment ownership.

## Phase 1 - Architecture

Goal: make the system structurally safe to build on.

- Finalize workspace boundaries and shared packages.
- Move secrets and sensitive integrations behind the backend.
- Define shared contracts, auth, data, and async job boundaries.

## Phase 2 - Build MVP Only

Goal: ship the smallest real product loop.

- Implement the core user flow end to end.
- Replace placeholder data with real persistence where required by the MVP.
- Keep UX scoped to the MVP promise only.

## Phase 3 - Monetization

Goal: add the smallest monetization loop that matches the product.

- Define free and paid limits.
- Implement purchase, entitlement, and restore flows.
- Add reviewer-safe billing behavior if stores are in scope.

## Phase 4 - QA And Testing

Goal: prove the product is stable enough for real users.

- Add end-to-end smoke checks for the core loop.
- Validate auth, persistence, and async job recovery.
- Validate compact, medium, and expanded layouts if multi-surface.

## Phase 5 - App Store Launch

Goal: prepare and submit the app-store-facing surfaces.

- Finalize metadata, screenshots, reviewer notes, and demo flows.
- Verify app-store policy requirements and deletion/account paths.
- Submit only after legal, QA, and ops gates are green.

## Phase 6 - Distribution, Growth, And First Customers

Goal: get real users and learn from measured behavior.

- Launch initial acquisition channels.
- Instrument the core loop and retention checkpoints.
- Tie user feedback to measurable behavior.

## Phase 7 - Legal And Compliance

Goal: close the policy, privacy, and consent gaps before public scale.

- Finalize privacy policy, terms, and data disclosures.
- Validate permissions, tracking, and regional compliance.
- Review legal-risk flags against the shipped feature set.

## Phase 8 - Operational Readiness

Goal: make the product supportable in production.

- Finalize deploy, rollback, backup, and alerting paths.
- Finalize support, incident, and change-approval workflows.
- Verify production environment ownership and access.

## Phase 9 - Iterate And Scale

Goal: improve the product based on real evidence.

- Prioritize work based on usage, retention, and revenue.
- Prune dead features and dead variables.
- Revisit kill criteria and pivot gates on schedule.

## Immediate Execution Order For This Repo

1. Lock the PRD and approval docs.
2. Finalize environment ownership and stack choices.
3. Build or stabilize the core MVP loop.
4. Validate on all target surfaces.
5. Add monetization, legal, and ops gates before public launch.

## Verification Matrix

### Current baseline

- `docs are created and agree on scope`
- `the chosen stack and providers are recorded`
- `basic dev commands are defined`

### Required by the end of Phase 1

- `auth boundary is real`
- `shared contracts exist`
- `data ownership is documented and implemented`

### Required by the end of Phase 2

- `core trip planning flow works end to end`
- `saved state survives sign-out and device changes`
- `core smoke checks pass on web and mobile`

### Required before public launch

- `legal pages and store disclosures are ready`
- `billing and restore flows are validated`
- `rollback, support, and alerting paths are documented`

## Success Definition

- `users can create and revisit a saved trip plan on multiple surfaces`
- `the first paid users can upgrade and retain value`
- `launch readiness is gated by QA, legal, and ops evidence`