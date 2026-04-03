import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrNull, requireCurrentUser } from "./utils/auth";
import { areFriends } from "./utils/friendships";

/** Start a new flea market scanning session. */
export const startSession = mutation({
    args: {
        deviceId: v.string(),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrNull(ctx);

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
        return await ctx.db
            .query("fleaSessions")
            .withIndex("by_device", (q: any) => q.eq("deviceId", args.deviceId))
            .filter((q: any) => q.eq(q.field("status"), "active"))
            .order("desc")
            .first();
    },
});

/** Get completed session history for the current user. */
export const getSessionHistory = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return [];

        return await ctx.db
            .query("fleaSessions")
            .withIndex("by_user", (q: any) => q.eq("userId", user._id))
            .filter((q: any) => q.eq(q.field("status"), "completed"))
            .order("desc")
            .collect();
    },
});

/** Get all staged scans for a given session. */
export const getSessionCards = query({
    args: { sessionId: v.id("fleaSessions") },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrNull(ctx);
        const session = await ctx.db.get(args.sessionId);
        if (!session) return [];

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
        const user = await requireCurrentUser(ctx);

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== user._id) {
            throw new Error("Not found or unauthorized");
        }

        // Verify all friendIds are accepted friends
        for (const friendId of args.friendIds) {
            if (!(await areFriends(ctx, user._id, friendId))) {
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
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return [];

        // Convex doesn't support array-contains index queries,
        // so we scan completed sessions and filter by sharedWith
        const allSessions = await ctx.db
            .query("fleaSessions")
            .filter((q: any) => q.eq(q.field("status"), "completed"))
            .collect();

        const sharedWithMe = allSessions.filter(
            (s) => s.sharedWith?.includes(user._id)
        );

        // Batch-collect unique owner IDs
        const ownerIds = [...new Set(sharedWithMe.map((s) => s.userId).filter(Boolean))];
        const owners = await Promise.all(ownerIds.map((id) => ctx.db.get(id!)));
        const ownerMap = new Map(owners.filter(Boolean).map((u) => [u!._id, u!]));

        return sharedWithMe.map((session) => ({
            ...session,
            ownerName: (session.userId && ownerMap.get(session.userId)?.name) ?? "Kado Hunter",
            ownerTag: (session.userId && ownerMap.get(session.userId)?.hunterTag) ?? "KDO-0000",
        }));
    },
});