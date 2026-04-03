# Autonomy Intake

> Complete this before architecture work starts. If something is missing, record the blocker instead of leaving it implicit.

## Project Basics

- App: `TripBrief`
- Owner: `Product owner`
- Target user: `frequent travelers who want a fast, organized trip plan`
- Pain being solved: `trip planning is fragmented across tabs, notes, maps, and booking emails`
- Offer: `AI-assisted itinerary building with shared trip state across web and mobile`
- Success metric: `first 20 users who create and revisit a saved trip plan`

## Access Checklist

| Item | Status | Owner | Notes / blocker |
|------|--------|-------|-----------------|
| Prototype source of truth | done | `Product owner` | `Figma flow and rough feature notes are available` |
| Brand assets | pending | `Product owner` | `logo and app icon still need to be finalized` |
| GitHub / repo access | done | `Product owner` | `repo access confirmed` |
| Hosting provider access | pending | `Product owner` | `deployment project still needs to be created` |
| Auth provider access | pending | `Product owner` | `auth project still needs keys and redirect config` |
| Backend / data access | pending | `Product owner` | `data project still needs to be provisioned` |
| Payments access | pending | `Product owner` | `billing account not created yet` |
| Product analytics access | pending | `Product owner` | `analytics tool not chosen yet` |
| Observability access | pending | `Product owner` | `error monitoring project not created yet` |
| Transactional email access | pending | `Product owner` | `email provider not chosen yet` |
| Domain / DNS access | pending | `Product owner` | `production domain not selected yet` |
| Apple / Google store access | pending | `Product owner` | `store accounts need confirmation` |
| Support / feedback inbox | pending | `Product owner` | `support mailbox not configured yet` |

## Operating Guardrails

- Budget guardrails: `keep early recurring tool spend under $100 per month until activation is proven`
- Approval policy: `every irreversible production action requires product owner approval`
- Privacy posture: `collect only data needed for trips, auth, billing, and support`
- Legal sign-off owner: `Product owner`
- Real-device testing path: `owner devices plus a small internal beta group`

## Missing Prerequisites

| Missing item | Impact | Owner | Next action |
|--------------|--------|-------|-------------|
| `Auth provider keys` | `blocks real sign-in` | `Product owner` | `create the auth project and record keys in env-manifest.md` |
| `Billing account` | `blocks monetization testing` | `Product owner` | `open a sandbox billing account` |
| `Store access` | `blocks release planning` | `Product owner` | `confirm Apple and Google console access` |

## Ready Check

- [x] Enough access exists to begin architecture work
- [ ] Enough access exists to deploy safely
- [ ] Enough access exists to submit to stores
- [ ] Enough access exists to run billing in sandbox