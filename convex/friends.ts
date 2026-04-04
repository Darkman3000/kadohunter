import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrNull, requireCurrentUser } from "./utils/auth";
import { areFriends, friendshipExists } from "./utils/friendships";

export const getFriends = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return [];

        const friendships = await ctx.db
            .query("friendships")
            .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .collect();

        const friendshipsRev = await ctx.db
            .query("friendships")
            .withIndex("by_addressee", (q) => q.eq("addresseeId", user._id))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .collect();

        const allFriendships = [...friendships, ...friendshipsRev];

        const friendsRaw = await Promise.all(
            allFriendships.map(async (f) => {
                const friendId = f.requesterId === user._id ? f.addresseeId : f.requesterId;
                const friend = await ctx.db.get(friendId);
                if (!friend) return null;
                return {
                    _id: friend._id,
                    name: friend.name,
                    hunterTag: friend.hunterTag,
                    tier: friend.tier,
                };
            })
        );

        return friendsRaw.filter((f): f is Exclude<typeof f, null> => f !== null);
    },
});

export const getPendingRequests = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return [];

        const incoming = await ctx.db
            .query("friendships")
            .withIndex("by_addressee", (q) => q.eq("addresseeId", user._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        return await Promise.all(
            incoming.map(async (req) => {
                const requester = await ctx.db.get(req.requesterId);
                return {
                    _id: req._id,
                    requesterId: req.requesterId,
                    name: requester?.name || "Kado Hunter",
                    hunterTag: requester?.hunterTag || "KDO-0000",
                    createdAt: req.createdAt,
                };
            })
        );
    },
});

export const sendFriendRequest = mutation({
    args: { hunterTag: v.string() },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);

        const targetUser = await ctx.db
            .query("users")
            .withIndex("by_tag", (q) => q.eq("hunterTag", args.hunterTag))
            .first();

        if (!targetUser) throw new Error("User not found");
        if (targetUser._id === user._id) throw new Error("Cannot add yourself");

        if (await friendshipExists(ctx, user._id, targetUser._id)) {
            throw new Error("Friend request already exists or you are already friends");
        }

        await ctx.db.insert("friendships", {
            requesterId: user._id,
            addresseeId: targetUser._id,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

export const acceptFriendRequest = mutation({
    args: { requestId: v.id("friendships") },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);
        const request = await ctx.db.get(args.requestId);
        if (!request || request.addresseeId !== user._id) {
            throw new Error("Invalid request");
        }
        await ctx.db.patch(args.requestId, { status: "accepted" });
    },
});

export const rejectFriendRequest = mutation({
    args: { requestId: v.id("friendships") },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);
        const request = await ctx.db.get(args.requestId);
        if (!request || request.addresseeId !== user._id) {
            throw new Error("Invalid request");
        }
        await ctx.db.delete(args.requestId);
    },
});

/** Securely fetch an accepted friend's collection. */
export const getFriendCollection = query({
    args: { friendId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return [];

        if (!(await areFriends(ctx, user._id, args.friendId))) {
            throw new Error("You can only view collections of accepted friends");
        }

        return await ctx.db
            .query("savedScans")
            .withIndex("by_user", (q) => q.eq("userId", args.friendId))
            .collect();
    },
});