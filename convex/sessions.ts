import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Flea Market Sessions module — groups staged scans into reviewable sessions.
 * Sessions can be shared with friends for collaborative judging.
 */

async function getAuthenticatedUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
}

/** Start a new flea market scanning session. */
export const startSession = mutation({
    args: {
        deviceId: v.string(),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);

        return await ctx.db.insert("fleaSessions", {
            userId: user?._id,
            deviceId: args.deviceId,
            title: args.title ?? `Session ${new Date().toLocaleDateString()}`,
            status: "active",
            totalValue: 0,
            cardCount: 0,
            startedAt: Date.now(),
        });
    },
});

/** End a session and calculate totals from its staged scans. */
export const endSession = mutation({
    args: { sessionId: v.id("fleaSessions") },
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session) throw new Error("Session not found");
        if (session.status === "completed") throw new Error("Session already completed");

        // Aggregate scans for this session
        const scans = await ctx.db
            .query("stagedScans")
            .withIndex("by_session", (q: any) => q.eq("sessionId", args.sessionId))
            .collect();

        const totalValue = scans.reduce((sum, s) => sum + (s.marketPrice ?? 0), 0);

        await ctx.db.patch(args.sessionId, {
            status: "completed",
            totalValue,
            cardCount: scans.length,
            completedAt: Date.now(),
        });

        return { totalValue, cardCount: scans.length };
    },
});

/** Get the user's active session (if any). */
export const getActiveSession = query({
    args: { deviceId: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("fleaSessions")
            .withIndex("by_device", (q: any) => q.eq("deviceId", args.deviceId))
            .filter((q: any) => q.eq(q.field("status"), "active"))
            .order("desc")
            .first();

        return session;
    },
});

/** Get completed session history for the current user. */
export const getSessionHistory = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) return [];

        const sessions = await ctx.db
            .query("fleaSessions")
            .withIndex("by_user", (q: any) => q.eq("userId", user._id))
            .filter((q: any) => q.eq(q.field("status"), "completed"))
            .order("desc")
            .collect();

        return sessions;
    },
});

/** Get all staged scans for a given session. */
export const getSessionCards = query({
    args: { sessionId: v.id("fleaSessions") },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        const session = await ctx.db.get(args.sessionId);
        if (!session) return [];

        // Verify access: owner or shared-with friend
        const isOwner = user && session.userId === user._id;
        const isShared = user && session.sharedWith?.includes(user._id);
        if (!isOwner && !isShared) return [];

        return await ctx.db
            .query("stagedScans")
            .withIndex("by_session", (q: any) => q.eq("sessionId", args.sessionId))
            .collect();
    },
});

/** Share a completed session with friends for review. */
export const shareSession = mutation({
    args: {
        sessionId: v.id("fleaSessions"),
        friendIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== user._id) {
            throw new Error("Not found or unauthorized");
        }

        // Verify all friendIds are accepted friends
        for (const friendId of args.friendIds) {
            const friendship = await ctx.db
                .query("friendships")
                .withIndex("by_pair", (q: any) =>
                    q.eq("requesterId", user._id).eq("addresseeId", friendId)
                )
                .first();
            const friendshipRev = await ctx.db
                .query("friendships")
                .withIndex("by_pair", (q: any) =>
                    q.eq("requesterId", friendId).eq("addresseeId", user._id)
                )
                .first();

            const isFriend =
                (friendship?.status === "accepted") ||
                (friendshipRev?.status === "accepted");

            if (!isFriend) {
                throw new Error(`User ${friendId} is not an accepted friend`);
            }
        }

        const existing = session.sharedWith ?? [];
        const merged = [...new Set([...existing, ...args.friendIds])];
        await ctx.db.patch(args.sessionId, { sharedWith: merged });
    },
});

/** Get sessions shared with me by friends. */
export const getSharedSessions = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) return [];

        // Must scan all completed sessions and filter by sharedWith
        // (Convex doesn't support array-contains index queries)
        const allSessions = await ctx.db
            .query("fleaSessions")
            .filter((q: any) => q.eq(q.field("status"), "completed"))
            .collect();

        const sharedWithMe = allSessions.filter(
            (s) => s.sharedWith?.includes(user._id)
        );

        // Enrich with owner name
        const enriched = await Promise.all(
            sharedWithMe.map(async (session) => {
                const owner = session.userId ? await ctx.db.get(session.userId) : null;
                return {
                    ...session,
                    ownerName: owner?.name ?? "Kado Hunter",
                    ownerTag: owner?.hunterTag ?? "KDO-0000",
                };
            })
        );

        return enriched;
    },
});
