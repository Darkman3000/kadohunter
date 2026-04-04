import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/**
 * Check whether two users have an accepted friendship (in either direction).
 */
export async function areFriends(ctx: Ctx, userA: Id<"users">, userB: Id<"users">): Promise<boolean> {
    const forward = await ctx.db
        .query("friendships")
        .withIndex("by_pair", (q) => q.eq("requesterId", userA).eq("addresseeId", userB))
        .first();
    if (forward?.status === "accepted") return true;

    const reverse = await ctx.db
        .query("friendships")
        .withIndex("by_pair", (q) => q.eq("requesterId", userB).eq("addresseeId", userA))
        .first();
    return reverse?.status === "accepted";
}

/**
 * Require that two users are accepted friends, or throw.
 */
export async function requireFriendship(ctx: Ctx, userA: Id<"users">, userB: Id<"users">) {
    if (!(await areFriends(ctx, userA, userB))) {
        throw new Error("Users are not friends");
    }
}

/**
 * Check if a friendship (in either direction) already exists between two users,
 * regardless of status. Used to prevent duplicate friend requests.
 */
export async function friendshipExists(ctx: Ctx, userA: Id<"users">, userB: Id<"users">): Promise<boolean> {
    const forward = await ctx.db
        .query("friendships")
        .withIndex("by_pair", (q) => q.eq("requesterId", userA).eq("addresseeId", userB))
        .first();
    if (forward) return true;

    const reverse = await ctx.db
        .query("friendships")
        .withIndex("by_pair", (q) => q.eq("requesterId", userB).eq("addresseeId", userA))
        .first();
    return !!reverse;
}
