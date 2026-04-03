# `{{PROJECT_NAME}}` Zero-to-Hero Implementation Plan

> Source blueprint: `{{BLUEPRINT_REFERENCE}}`  
> Intent: adapt the blueprint to the actual starting point of `{{PROJECT_NAME}}`.  
> End state: `{{END_STATE_DESCRIPTION}}`.

## Executive Summary

- This plan follows the blueprint phases from Phase 0 through Phase 9.
- The target product surfaces are `{{TARGET_SURFACES}}`.
- The current product reference is `{{CURRENT_PRODUCT_REFERENCE}}`.
- Tooling defaults are documented separately in `todo/template-pack/stack-defaults.md` and should be copied only if they fit the new project.
- The highest-risk sequencing dependency is `{{TOP_SEQUENCING_DEPENDENCY}}`.

## Current State Audit

- Current frontend state: `{{CURRENT_FRONTEND_STATE}}`
- Current backend state: `{{CURRENT_BACKEND_STATE}}`
- Current data/auth state: `{{CURRENT_DATA_AUTH_STATE}}`
- Current verification baseline: `{{CURRENT_VERIFICATION_BASELINE}}`

## What Multi-Surface Means For `{{PROJECT_NAME}}`

Multi-surface in this plan means all of the following are true:

- `{{SURFACE_RULE_1}}`
- `{{SURFACE_RULE_2}}`
- `{{SURFACE_RULE_3}}`
- `{{SURFACE_RULE_4}}`
- `{{SURFACE_RULE_5}}`

If the project is intentionally single-surface, replace this section with the actual supported surface definition.

## Non-Negotiable Rules For This App

- Keep all project documentation in `{{DOCS_DIRECTORY}}`.
- No private secrets may be exposed in browser or mobile client code.
- Treat long-running media or AI work as an async job system unless the product proves otherwise.
- Break work into commit-sized slices. After each slice: verify, update `progress.md`, and commit.
- No production file should remain over `{{MAX_FILE_LINES}}` lines without a clear reason and follow-up split plan.
- The app must support a reviewer-safe demo flow before store submission if stores are in scope.
- Shared contracts must stay aligned across all shipped surfaces.

## Required Companion Docs In `{{DOCS_DIRECTORY}}`

- `{{DOCS_DIRECTORY}}/PRD.md`
- `{{DOCS_DIRECTORY}}/progress.md`
- `{{DOCS_DIRECTORY}}/autonomy-intake.md`
- `{{DOCS_DIRECTORY}}/approval-matrix.md`
- `{{DOCS_DIRECTORY}}/env-manifest.md`
- `{{DOCS_DIRECTORY}}/legal-risk.md`

## Reference Inputs

### Primary blueprint

- `{{BLUEPRINT_REFERENCE}}`

### Product and implementation references to adapt

- `{{REFERENCE_INPUT_1}}`
- `{{REFERENCE_INPUT_2}}`
- `{{REFERENCE_INPUT_3}}`

## Installed Tooling And Workflow Defaults

- Web: `{{WEB_STACK}}`
- Mobile: `{{MOBILE_STACK}}`
- Backend: `{{BACKEND_STACK}}`
- Auth: `{{AUTH_PROVIDER}}`
- Data: `{{DATA_PROVIDER}}`
- Hosting: `{{HOSTING_PROVIDER}}`
- AI: `{{AI_PROVIDER}}`

## Target Architecture

### Architecture decisions

- Product surfaces: `{{TARGET_SURFACES}}`
- Auth boundary: `{{AUTH_BOUNDARY_DECISION}}`
- Data boundary: `{{DATA_BOUNDARY_DECISION}}`
- Asset storage boundary: `{{ASSET_BOUNDARY_DECISION}}`
- Async job boundary: `{{ASYNC_BOUNDARY_DECISION}}`

## Cross-Phase Dependencies

- `{{DEPENDENCY_GATE_1}}`
- `{{DEPENDENCY_GATE_2}}`
- `{{DEPENDENCY_GATE_3}}`
- `{{DEPENDENCY_GATE_4}}`

## Planned Command Surface By End Of Phase 1

- `{{COMMAND_1}}`
- `{{COMMAND_2}}`
- `{{COMMAND_3}}`
- `{{COMMAND_4}}`

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

- `{{BASELINE_CHECK_1}}`
- `{{BASELINE_CHECK_2}}`
- `{{BASELINE_CHECK_3}}`

### Required by the end of Phase 1

- `{{PHASE1_CHECK_1}}`
- `{{PHASE1_CHECK_2}}`
- `{{PHASE1_CHECK_3}}`

### Required by the end of Phase 2

- `{{PHASE2_CHECK_1}}`
- `{{PHASE2_CHECK_2}}`
- `{{PHASE2_CHECK_3}}`

### Required before public launch

- `{{LAUNCH_CHECK_1}}`
- `{{LAUNCH_CHECK_2}}`
- `{{LAUNCH_CHECK_3}}`

## Success Definition

- `{{SUCCESS_DEFINITION_1}}`
- `{{SUCCESS_DEFINITION_2}}`
- `{{SUCCESS_DEFINITION_3}}`