# Environment Manifest

> Purpose: record every environment variable, who owns it, where it lives, and whether it is public or secret before implementation expands.

## Prototype References

List only the reference projects or docs that are useful inputs for this project:

- `internal product brief`
- `design prototype`
- `existing stack setup notes`

These are references, not drop-in truth.

## Naming Rules

- Web public variables use the framework-appropriate public prefix.
- Mobile public variables use the framework-appropriate public prefix.
- Backend/server secrets stay unprefixed and never ship to client bundles.
- If the web stack changes, rename public variables as part of that migration.
- Do not introduce client-side secrets for auth, billing, AI, or operator workflows.

## Environment Strategy

| Environment | Purpose | Frontend | Backend | Data/Auth | Notes |
|-------------|---------|----------|---------|-----------|-------|
| development | local coding and integration | local dev | local or dev deployment | dev providers | no production data |
| staging | preview and QA | preview builds | staging API | staging providers | used for smoke tests |
| production | public release | live builds | live API | live providers | requires approval gate |

## Core Variables

| Variable | Scope | Used by | Environments | Owner | Source of truth | Status | Notes |
|----------|-------|---------|--------------|-------|-----------------|--------|-------|
| `OPENAI_API_KEY` | secret/server | `AI itinerary generation and summarization` | dev/staging/prod | `Product owner` | provider console | pending | server only |
| `CLERK_SECRET_KEY` | secret/server | `auth verification and user lookup` | dev/staging/prod | `Product owner` | auth provider | pending | server only |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | public/client | `web auth provider setup` | dev/staging/prod | `Product owner` | auth provider | pending | client-safe |
| `CONVEX_URL` | server/config | `backend data client` | dev/staging/prod | `Product owner` | data provider | pending | backend only |
| `RAILWAY_PROJECT_ID` | operator | `deploy and environment selection` | dev/staging/prod | `Product owner` | hosting provider | pending | operational only |
| `STRIPE_SECRET_KEY` | secret/server | `checkout, billing, and webhook handling` | staging/prod | `Product owner` | billing provider | pending | server only |
| `SENTRY_AUTH_TOKEN` | operator secret | `release tasks and sourcemap upload` | staging/prod | `Product owner` | observability provider | pending | CI or operator only |
| `NEXT_PUBLIC_API_BASE_URL` | public/client | `client API origin override` | dev/staging/prod | `Product owner` | frontend env config | pending | override only when needed |

## Prototype Variables Intentionally Not Adopted

- `client-side AI API keys`
- `duplicate auth variables with obsolete naming`
- `unused operator variables without an owning workflow`

## Rules

- Every secret must have a documented owner and source of truth.
- Every public variable must be intentionally marked as safe for client exposure.
- Remove dead variables when the code path is removed.
- Keep local seed notes out of the generic manifest; record them only in live project docs.

## Phase 1 Checklist

- [ ] All required auth variables are mapped
- [ ] All required data variables are mapped
- [ ] All required billing variables are mapped
- [ ] All required observability variables are mapped
- [ ] All public variables are safe for client exposure
- [ ] No client-side secret variables exist