import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUserOrNull, requireCurrentUser } from "./utils/auth";
import { areFriends } from "./utils/friendships";

const tradeCardValidator = v.object({
    scanId: v.id("savedScans"),
    cardId: v.string(),
    cardName: v.string(),
    imageUrl: v.optional(v.string()),
    estimatedPrice: v.optional(v.number()),
});

async function validateCardOwnership(ctx: any, cards: any[], expectedUserId: string, label: string) {
    for (const card of cards) {
        const scan = await ctx.db.get(card.scanId);
        if (!scan || scan.userId !== expectedUserId) {
            throw new Error(`${label} doesn't own card: ${card.cardName}`);
        }
    }
}

/** Propose a trade to a friend. */
export const proposeTrade = mutation({
    args: {
        receiverId: v.id("users"),
        proposerCards: v.array(tradeCardValidator),
        receiverCards: v.array(tradeCardValidator),
        message: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);
        if (user._id === args.receiverId) throw new Error("Cannot trade with yourself");

        if (!(await areFriends(ctx, user._id, args.receiverId))) {
            throw new Error("You can only trade with friends");
        }

        await validateCardOwnership(ctx, args.proposerCards, user._id, "You");
        await validateCardOwnership(ctx, args.receiverCards, args.receiverId, "Friend");

        const proposerValue = args.proposerCards.reduce((sum, c) => sum + (c.estimatedPrice ?? 0), 0);
        const receiverValue = args.receiverCards.reduce((sum, c) => sum + (c.estimatedPrice ?? 0), 0);

        return await ctx.db.insert("trades", {
            proposerId: user._id,
            receiverId: args.receiverId,
            proposerCards: args.proposerCards,
            receiverCards: args.receiverCards,
            status: "proposed",
            proposerValue,
            receiverValue,
            message: args.message,
            createdAt: Date.now(),
        });
    },
});

/** Accept a trade — swap card ownership. */
export const acceptTrade = mutation({
    args: { tradeId: v.id("trades") },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);
        const trade = await ctx.db.get(args.tradeId);
        if (!trade) throw new Error("Trade not found");
        if (trade.receiverId !== user._id) throw new Error("Not your trade to accept");
        if (trade.status !== "proposed") throw new Error("Trade is no longer pending");

        // Swap ownership: proposer's cards → receiver, receiver's cards → proposer
        for (const card of trade.proposerCards) {
            await ctx.db.patch(card.scanId, { userId: user._id });
        }
        for (const card of trade.receiverCards) {
            await ctx.db.patch(card.scanId, { userId: trade.proposerId });
        }

        await ctx.db.patch(args.tradeId, { status: "accepted", resolvedAt: Date.now() });
    },
});

/** Reject a trade. */
export const rejectTrade = mutation({
    args: { tradeId: v.id("trades") },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);
        const trade = await ctx.db.get(args.tradeId);
        if (!trade) throw new Error("Trade not found");
        if (trade.receiverId !== user._id) throw new Error("Not your trade to reject");
        if (trade.status !== "proposed") throw new Error("Trade is no longer pending");

        await ctx.db.patch(args.tradeId, { status: "rejected", resolvedAt: Date.now() });
    },
});

/** Cancel a trade (proposer only). */
export const cancelTrade = mutation({
    args: { tradeId: v.id("trades") },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);
        const trade = await ctx.db.get(args.tradeId);
        if (!trade) throw new Error("Trade not found");
        if (trade.proposerId !== user._id) throw new Error("Only the proposer can cancel");
        if (trade.status !== "proposed") throw new Error("Trade is no longer pending");

        await ctx.db.patch(args.tradeId, { status: "cancelled", resolvedAt: Date.now() });
    },
});

/** Get all trades involving the current user. */
export const getMyTrades = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return [];

        const proposed = await ctx.db
            .query("trades")
            .withIndex("by_proposer", (q) => q.eq("proposerId", user._id))
            .collect();

        const received = await ctx.db
            .query("trades")
            .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
            .collect();

        const all = [...proposed, ...received].sort((a, b) => b.createdAt - a.createdAt);

        // Batch-collect unique user IDs to avoid N+1
        const userIds = [...new Set(all.flatMap((t) => [t.proposerId, t.receiverId]))];
        const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
        const userMap = new Map(users.filter(Boolean).map((u) => [u!._id, u!]));

        return all.map((trade) => ({
            ...trade,
            proposerName: userMap.get(trade.proposerId)?.name ?? "Unknown",
            receiverName: userMap.get(trade.receiverId)?.name ?? "Unknown",
        }));
    },
});

/** Get a single trade by ID (must be a party to it). */
export const getTradeById = query({
    args: { tradeId: v.id("trades") },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return null;

        const trade = await ctx.db.get(args.tradeId);
        if (!trade) return null;
        if (trade.proposerId !== user._id && trade.receiverId !== user._id) return null;

        const proposer = await ctx.db.get(trade.proposerId);
        const receiver = await ctx.db.get(trade.receiverId);
        return {
            ...trade,
            proposerName: proposer?.name ?? "Unknown",
            receiverName: receiver?.name ?? "Unknown",
        };
    },
});