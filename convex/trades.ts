import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

async function getAuthenticatedUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
}

async function areFriends(ctx: any, userA: any, userB: any): Promise<boolean> {
    const forward = await ctx.db
        .query("friendships")
        .withIndex("by_pair", (q: any) => q.eq("requesterId", userA).eq("addresseeId", userB))
        .first();
    if (forward?.status === "accepted") return true;

    const reverse = await ctx.db
        .query("friendships")
        .withIndex("by_pair", (q: any) => q.eq("requesterId", userB).eq("addresseeId", userA))
        .first();
    return reverse?.status === "accepted";
}

const tradeCardValidator = v.object({
    scanId: v.id("savedScans"),
    cardId: v.string(),
    cardName: v.string(),
    imageUrl: v.optional(v.string()),
    estimatedPrice: v.optional(v.number()),
});

/** Propose a trade to a friend. */
export const proposeTrade = mutation({
    args: {
        receiverId: v.id("users"),
        proposerCards: v.array(tradeCardValidator),
        receiverCards: v.array(tradeCardValidator),
        message: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) throw new Error("Not authenticated");
        if (user._id === args.receiverId) throw new Error("Cannot trade with yourself");

        if (!(await areFriends(ctx, user._id, args.receiverId))) {
            throw new Error("You can only trade with friends");
        }

        // Validate proposer owns their cards
        for (const card of args.proposerCards) {
            const scan = await ctx.db.get(card.scanId);
            if (!scan || scan.userId !== user._id) {
                throw new Error(`You don't own card: ${card.cardName}`);
            }
        }

        // Validate receiver owns their cards
        for (const card of args.receiverCards) {
            const scan = await ctx.db.get(card.scanId);
            if (!scan || scan.userId !== args.receiverId) {
                throw new Error(`Friend doesn't own card: ${card.cardName}`);
            }
        }

        const proposerValue = args.proposerCards.reduce(
            (sum, c) => sum + (c.estimatedPrice ?? 0), 0
        );
        const receiverValue = args.receiverCards.reduce(
            (sum, c) => sum + (c.estimatedPrice ?? 0), 0
        );

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
        const user = await getAuthenticatedUser(ctx);
        if (!user) throw new Error("Not authenticated");

        const trade = await ctx.db.get(args.tradeId);
        if (!trade) throw new Error("Trade not found");
        if (trade.receiverId !== user._id) throw new Error("Not your trade to accept");
        if (trade.status !== "proposed") throw new Error("Trade is no longer pending");

        // Swap ownership: proposer's cards go to receiver
        for (const card of trade.proposerCards) {
            await ctx.db.patch(card.scanId, { userId: user._id });
        }
        // Swap ownership: receiver's cards go to proposer
        for (const card of trade.receiverCards) {
            await ctx.db.patch(card.scanId, { userId: trade.proposerId });
        }

        await ctx.db.patch(args.tradeId, {
            status: "accepted",
            resolvedAt: Date.now(),
        });
    },
});

/** Reject a trade. */
export const rejectTrade = mutation({
    args: { tradeId: v.id("trades") },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) throw new Error("Not authenticated");

        const trade = await ctx.db.get(args.tradeId);
        if (!trade) throw new Error("Trade not found");
        if (trade.receiverId !== user._id) throw new Error("Not your trade to reject");
        if (trade.status !== "proposed") throw new Error("Trade is no longer pending");

        await ctx.db.patch(args.tradeId, {
            status: "rejected",
            resolvedAt: Date.now(),
        });
    },
});

/** Cancel a trade (proposer only). */
export const cancelTrade = mutation({
    args: { tradeId: v.id("trades") },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) throw new Error("Not authenticated");

        const trade = await ctx.db.get(args.tradeId);
        if (!trade) throw new Error("Trade not found");
        if (trade.proposerId !== user._id) throw new Error("Only the proposer can cancel");
        if (trade.status !== "proposed") throw new Error("Trade is no longer pending");

        await ctx.db.patch(args.tradeId, {
            status: "cancelled",
            resolvedAt: Date.now(),
        });
    },
});

/** Get all trades involving the current user. */
export const getMyTrades = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) return [];

        const proposed = await ctx.db
            .query("trades")
            .withIndex("by_proposer", (q: any) => q.eq("proposerId", user._id))
            .collect();

        const received = await ctx.db
            .query("trades")
            .withIndex("by_receiver", (q: any) => q.eq("receiverId", user._id))
            .collect();

        const all = [...proposed, ...received];
        all.sort((a, b) => b.createdAt - a.createdAt);

        // Enrich with user names
        return await Promise.all(
            all.map(async (trade) => {
                const proposer = await ctx.db.get(trade.proposerId);
                const receiver = await ctx.db.get(trade.receiverId);
                return {
                    ...trade,
                    proposerName: proposer?.name ?? "Unknown",
                    receiverName: receiver?.name ?? "Unknown",
                };
            })
        );
    },
});

/** Get a single trade by ID (must be a party to it). */
export const getTradeById = query({
    args: { tradeId: v.id("trades") },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
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
