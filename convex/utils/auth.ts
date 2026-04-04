import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/**
 * Look up a user row by their Clerk token identifier.
 */
export async function getUserByTokenIdentifier(ctx: Ctx, tokenIdentifier: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
        .first();
}

/**
 * When Convex has a valid JWT, returns identity and user row (user may be null until storeUser runs).
 */
export async function getAuthenticatedUser(ctx: Ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await getUserByTokenIdentifier(ctx, identity.tokenIdentifier);
    return { identity, user: user ?? null };
}

/**
 * Return the current user row or throw if not authenticated.
 */
export async function requireCurrentUser(ctx: Ctx) {
    const auth = await getAuthenticatedUser(ctx);
    if (!auth?.user) throw new Error("Unauthorized");
    return auth.user;
}

/**
 * Return the user row only if the caller owns the given userId, else throw.
 */
export async function requireAuthorizedUser(ctx: Ctx, userId: string) {
    const auth = await getAuthenticatedUser(ctx);
    if (!auth?.user) throw new Error("Unauthorized");
    if (auth.user._id !== userId) throw new Error("Unauthorized");
    return auth.user;
}

/**
 * Return the current user row (without identity), or null.
 * Simpler variant used in files that only need the user document.
 */
export async function getCurrentUserOrNull(ctx: Ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await getUserByTokenIdentifier(ctx, identity.tokenIdentifier);
}

/**
 * Verify the caller owns a savedScan, returning both user and scan.
 * Throws if not authenticated or scan not owned by caller.
 */
export async function requireOwnedScan(ctx: Ctx, scanId: string) {
    const user = await requireCurrentUser(ctx);
    const scan = await ctx.db.get(scanId as any);
    if (!scan || (scan as any).userId !== user._id) {
        throw new Error("Not found");
    }
    return { user, scan };
}
