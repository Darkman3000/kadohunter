# Public Share Checklist

Use this before sharing `workspace-starter` outside your local machine or turning it into a public template repo.

## Secrets And Local Data

- [ ] Confirm `.env`, `apps/mobile/.env`, and `apps/web/.env.local` are not committed
- [ ] Confirm all `.env.example` files contain placeholders only
- [ ] Search the repo for seeded keys or tokens: `pk_`, `sk_`, `AIza`, `VENICE_API_KEY`, `CLERK_SECRET_KEY`, `CONVEX_URL=` with a real value
- [ ] Confirm no private certificates or signing files are present (`*.keystore`, `*.jks`, `*.p12`, `*.mobileprovision`)

## Local Machine References

- [ ] Replace or remove any absolute local paths such as `D:\computer\...` or `D:\myprojects\...`
- [ ] Replace any references that assume your private reference bundle exists locally
- [ ] Make sure the README still makes sense on a machine that only has this repo

## Branding And Package Identity

- [ ] Replace `Workspace Starter` with the intended public/project name if needed
- [ ] Replace `@starter/*` package names if publishing packages or using the starter as a real app base
- [ ] Replace `com.example.workspacestarter` in `apps/mobile/app.json`
- [ ] Replace Expo `slug`, `scheme`, and any public-facing app metadata if this becomes a real shipped app

## Build And Setup

- [ ] Run `npm install`
- [ ] Run `npm run lint`
- [ ] Run `npm run dev:api`
- [ ] Run `npm run dev:web`
- [ ] Run `npm run dev:mobile`
- [ ] If EAS is part of the share, verify `apps/mobile/eas.json` still matches the intended workflow

## Documentation

- [ ] Review `README.md`
- [ ] Review `HANDOFF.md`
- [ ] Review `todo/template-pack/README.md`
- [ ] Remove project-specific implementation references if the goal is a fully generic public starter

## Git Hygiene

- [ ] Review `git status`
- [ ] Make the first commit only after the secret/path scan is clean
- [ ] Tag the repo as template-ready only after all checklist items above are complete