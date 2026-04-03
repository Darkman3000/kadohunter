# Template Pack File Map

This file records how each live `todo` doc was handled during extraction.

| Source file | Extraction type | Template file | What is kept | What is removed or generalized |
|-------------|-----------------|---------------|--------------|--------------------------------|
| `todo/approval-matrix.md` | direct | `templates/approval-matrix.md` | rules, approval table shape, emergency exception structure | approver names, spend thresholds, environment names, project-specific notes |
| `todo/autonomy-intake.md` | direct | `templates/autonomy-intake.md` | project basics, access checklist, guardrails, ready check | product wording, provider choices, owner-specific notes, current blockers |
| `todo/project-rules.md` | direct | `templates/project-rules.md` | documentation rule format and standards framing | project-only storage assumptions if they are not meant to travel |
| `todo/progress.md` | split | `templates/progress.md` | current state, next step, challenge log, decisions, task log structure | historical entries, live branch state, completed implementation notes |
| `todo/kill-criteria.md` | split | `templates/kill-criteria.md` | milestone framing, metric table shape, pivot log | project-specific thresholds, decisions, and launch dates |
| `todo/legal-risk.md` | split | `templates/legal-risk.md` | risk flags, store form impact, sign-off table | current answers, named modules, project identity |
| `todo/PRD.md` | split | `templates/PRD.md` | section order, decision prompts, MVP tiering | product promise, user story, scope details, success metrics |
| `todo/ARCHITECTURE.md` | split | `templates/ARCHITECTURE.md` | workspace role framing, layout tiers, boundary sections | domain entities, named routes, current runtime details, provider coupling |
| `todo/env-manifest.md` | split | `templates/env-manifest.md` | naming rules, environment strategy, variable table shape, checklist | live variables, provider names, local seed notes, validated statuses |
| `todo/implementation-plan.md` | split | `templates/implementation-plan.md` | phase structure, companion docs, dependency gates, verification matrix | product-specific routes, reference inputs, provider choices, baseline history |

## Output Files

- `templates/*.md`: reusable templates to copy into a new repo
- `stack-defaults.md`: optional default stack and operating choices separated from the generic templates
- `README.md`: usage guide for instantiating the pack

## Extraction Rules

- Generic templates use placeholders instead of project values
- Extraction notes live only in this file
- The live root `todo/*.md` files remain unchanged and authoritative for the current project