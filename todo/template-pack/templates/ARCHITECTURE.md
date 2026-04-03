# Architecture Map

## Current Phase 1 State

`{{PROJECT_NAME}}` currently uses the following working shape:

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

- `apps/web`: `{{WEB_APP_ROLE}}`
- `apps/mobile`: `{{MOBILE_APP_ROLE}}`
- `packages/backend`: `{{BACKEND_ROLE}}`
- `packages/contracts`: `{{CONTRACTS_ROLE}}`
- `packages/domain`: `{{DOMAIN_ROLE}}`
- `packages/ui`: `{{UI_ROLE}}`

## Default Toolchain

- Hosting: `{{HOSTING_PROVIDER}}`
- Auth: `{{AUTH_PROVIDER}}`
- Data layer: `{{DATA_PROVIDER}}`
- AI: `{{AI_PROVIDER}}`
- Web target: `{{WEB_STACK}}`
- Mobile target: `{{MOBILE_STACK}}`
- Backend target: `{{BACKEND_STACK}}`

## Layout Tiers

- `compact`: phone-first layout with stacked content
- `medium`: tablet or narrow desktop layout with denser content
- `expanded`: desktop-width layout with multi-panel content

These tiers can be shared across surfaces or replaced if the product is single-surface.

## Auth Runtime

- Backend auth runtime: `{{BACKEND_AUTH_RUNTIME}}`
- Web auth runtime: `{{WEB_AUTH_RUNTIME}}`
- Mobile auth runtime: `{{MOBILE_AUTH_RUNTIME}}`
- Trust boundary: `{{AUTH_TRUST_BOUNDARY}}`

## Phase 1 Persistence

- Primary source of truth: `{{DATA_PROVIDER}}`
- Account-owned entities: `{{ACCOUNT_OWNED_ENTITIES}}`
- Large asset storage: `{{ASSET_STORAGE_STRATEGY}}`
- Fallback or migration adapter: `{{FALLBACK_STORAGE_STRATEGY}}`

## Async Job Pipeline

- Long-running work type: `{{ASYNC_WORK_TYPE}}`
- Job entrypoint: `{{JOB_ENTRYPOINT}}`
- Polling or callback model: `{{JOB_COMPLETION_MODEL}}`
- Output persistence: `{{JOB_OUTPUT_PERSISTENCE}}`

## Current Reality

- What is already real: `{{REAL_SURFACES_AND_SYSTEMS}}`
- What is still placeholder or incomplete: `{{PLACEHOLDER_SURFACES_AND_SYSTEMS}}`
- Highest-risk gap: `{{HIGHEST_RISK_GAP}}`