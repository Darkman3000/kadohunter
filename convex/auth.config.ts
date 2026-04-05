import type { AuthConfig } from "convex/server";

/**
 * Validates Clerk session JWTs (template name `convex`) against your Clerk Frontend API.
 * Set `CLERK_JWT_ISSUER_DOMAIN` on your Convex deployment (Dashboard → Settings → Environment Variables,
 * or `npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://YOUR_INSTANCE.clerk.accounts.dev"`).
 *
 * Same value as Clerk Dashboard → API Keys → **Frontend API** URL (include `https://`).
 */
export default {
    providers: [
        {
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
            applicationID: "convex",
        },
    ],
} satisfies AuthConfig;
