# Todo Template Pack

This folder contains a reusable documentation pack for future projects.

- The live project records remain in `todo/*.md`.
- The files in `todo/template-pack/templates/` are reusable derivatives.
- Use `stack-defaults.md` only as an optional starting point.

## Contents

- `file-map.md`: classification of the current `todo` docs and what was extracted
- `stack-defaults.md`: optional default stack and operating choices
- `templates/`: reusable docs to copy into a new project's `todo/`
- `examples/`: dry-run instantiations used to validate the pack

## Mandatory Docs For A New Project

Instantiate these before implementation starts:

1. `project-rules.md`
2. `autonomy-intake.md`
3. `approval-matrix.md`
4. `PRD.md`
5. `implementation-plan.md`
6. `env-manifest.md`
7. `ARCHITECTURE.md`
8. `progress.md`

## Optional Or Phase-Gated Docs

- `kill-criteria.md`: add before launch planning or growth work
- `legal-risk.md`: add before store submission, data collection, or regulated feature work

## Boot Order

Use this order when starting a new repo:

1. `project-rules.md`
2. `autonomy-intake.md`
3. `approval-matrix.md`
4. `PRD.md`
5. `implementation-plan.md`
6. `env-manifest.md`
7. `ARCHITECTURE.md`
8. `progress.md`
9. `kill-criteria.md`
10. `legal-risk.md`

## Placeholder Interface

- Placeholder syntax: `{{PLACEHOLDER_NAME}}`
- Allowed reusable status values: `pending`, `in_progress`, `blocked`, `done`
- Replace placeholders before implementation starts unless a section is intentionally left open
- Keep section order stable when adapting these templates

Required placeholders used across the pack:

- `{{PROJECT_NAME}}`
- `{{OWNER}}`
- `{{TARGET_USER}}`
- `{{CORE_PROBLEM}}`
- `{{SUCCESS_METRIC}}`
- `{{WEB_STACK}}`
- `{{MOBILE_STACK}}`
- `{{BACKEND_STACK}}`
- `{{AUTH_PROVIDER}}`
- `{{DATA_PROVIDER}}`
- `{{HOSTING_PROVIDER}}`
- `{{AI_PROVIDER}}`

## What To Customize First

Before implementation starts, replace at least:

- project name and owner
- target user, core problem, and success metric
- chosen web, mobile, backend, auth, data, hosting, and AI stack
- environment variables and ownership rules
- approval roles and spend thresholds
- phase goals, launch gates, and verification commands

## What Can Stay As-Is

These are safe defaults if they match the new project:

- the document set and boot order
- the progress log structure
- the approval matrix structure
- the Zero-to-Hero phase layout
- the environment matrix shape
- the adaptive layout tier language in the architecture template

## What Is Only An Example

- any placeholder text that names a metric, milestone, or module
- example rows in tables
- suggested package names and workspace layout
- optional defaults listed in `stack-defaults.md`
- any content under `examples/`