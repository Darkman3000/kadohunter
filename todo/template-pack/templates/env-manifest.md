# Environment Manifest

> Purpose: record every environment variable, who owns it, where it lives, and whether it is public or secret before implementation expands.

## Prototype References

List only the reference projects or docs that are useful inputs for this project:

- `{{REFERENCE_INPUT_1}}`
- `{{REFERENCE_INPUT_2}}`
- `{{REFERENCE_INPUT_3}}`

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
| `{{AI_SECRET_VAR}}` | secret/server | `{{AI_SECRET_USAGE}}` | dev/staging/prod | `{{OWNER}}` | provider console | pending | server only |
| `{{AUTH_SECRET_VAR}}` | secret/server | `{{AUTH_SECRET_USAGE}}` | dev/staging/prod | `{{OWNER}}` | auth provider | pending | server only |
| `{{AUTH_PUBLIC_VAR}}` | public/client | `{{AUTH_PUBLIC_USAGE}}` | dev/staging/prod | `{{OWNER}}` | auth provider | pending | client-safe |
| `{{DATA_URL_VAR}}` | server/config | `{{DATA_URL_USAGE}}` | dev/staging/prod | `{{OWNER}}` | data provider | pending | backend only |
| `{{HOSTING_PROJECT_VAR}}` | operator | `{{HOSTING_PROJECT_USAGE}}` | dev/staging/prod | `{{OWNER}}` | hosting provider | pending | operational only |
| `{{BILLING_SECRET_VAR}}` | secret/server | `{{BILLING_SECRET_USAGE}}` | staging/prod | `{{OWNER}}` | billing provider | pending | server only |
| `{{OBSERVABILITY_SECRET_VAR}}` | operator secret | `{{OBSERVABILITY_USAGE}}` | staging/prod | `{{OWNER}}` | observability provider | pending | CI or operator only |
| `{{PUBLIC_API_BASE_VAR}}` | public/client | `{{PUBLIC_API_BASE_USAGE}}` | dev/staging/prod | `{{OWNER}}` | frontend env config | pending | override only when needed |

## Prototype Variables Intentionally Not Adopted

- `{{VARIABLE_TO_AVOID_1}}`
- `{{VARIABLE_TO_AVOID_2}}`
- `{{VARIABLE_TO_AVOID_3}}`

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