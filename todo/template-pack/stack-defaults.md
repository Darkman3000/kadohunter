# Optional Stack Defaults

This file records optional defaults that can be reused when they fit a new project.

These defaults are not required by the templates. Replace them freely.

## Selected Defaults

| Capability | Default placeholder | Notes |
|------------|---------------------|-------|
| Web stack | `{{WEB_STACK}}` | example: modern TypeScript web app |
| Mobile stack | `{{MOBILE_STACK}}` | example: single mobile codebase for iOS and Android |
| Backend stack | `{{BACKEND_STACK}}` | example: typed API and job orchestration layer |
| Auth provider | `{{AUTH_PROVIDER}}` | use one shared identity provider across web and mobile when possible |
| Data provider | `{{DATA_PROVIDER}}` | use one primary source of truth for account-owned data |
| Hosting provider | `{{HOSTING_PROVIDER}}` | keep deploy and environment management centralized |
| AI provider | `{{AI_PROVIDER}}` | keep AI calls server-side unless the product explicitly requires client-side access |

## Workspace Shape

Recommended monorepo layout:

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

## Boundary Defaults

- Keep client apps thin and push secrets behind the backend
- Share contracts between web, mobile, and backend
- Treat long-running AI or media work as async jobs
- Separate account metadata from large asset storage when the product handles files

## UI Defaults

Suggested layout tier language:

- `compact`: phone-first
- `medium`: tablet or narrow desktop
- `expanded`: wide desktop or multi-panel tablet

## Documentation Defaults

- Keep project operating docs in `todo/`
- Update `progress.md` in the same pass as meaningful implementation slices
- Treat `approval-matrix.md` and `env-manifest.md` as required before irreversible actions

## When To Keep These Defaults

Keep them if the new project:

- is account-based
- targets web plus mobile
- needs shared contracts
- includes async jobs, media, or AI work

Replace them if the new project:

- is single-surface only
- has no backend
- has no auth or persistence
- uses a different operating model