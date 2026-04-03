import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Wishlist module — tracks cards the user wants but doesn't own yet.
 * Each item can optionally have a targetPrice for price-drop alerts.
 */

async function getAuthenticatedUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
}

/** Get all wishlist items for the current user, enriched with latest market price. */
export const getWishlist = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) return [];

        const items = await ctx.db
            .query("wishlists")
            .withIndex("by_user", (q: any) => q.eq("userId", user._id))
            .collect();

        // Enrich with latest price from prices table
        const enriched = await Promise.all(
            items.map(async (item) => {
                const latestPrice = await ctx.db
                    .query("prices")
                    .withIndex("by_card", (q: any) =>
                        q.eq("cardId", item.cardId).eq("gameCode", item.gameCode)
                    )
                    .order("desc")
                    .first();

                return {
                    ...item,
                    currentPrice: latestPrice?.marketPrice ?? null,
                    priceSource: latestPrice?.source ?? null,
                    priceCurrency: latestPrice?.currency ?? null,
                    belowTarget:
                        item.targetPrice && latestPrice?.marketPrice
                            ? latestPrice.marketPrice <= item.targetPrice
                            : false,
                };
            })
        );

        return enriched;
    },
});

/** Add a card to the wishlist. */
export const addToWishlist = mutation({
    args: {
        cardId: v.string(),
        gameCode: v.string(),
        cardName: v.string(),
        setName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        targetPrice: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check if already on wishlist
        const existing = await ctx.db
            .query("wishlists")
            .withIndex("by_user_card", (q: any) =>
                q.eq("userId", user._id).eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .first();

        if (existing) {
            // Update target price if provided
            if (args.targetPrice !== undefined) {
                await ctx.db.patch(existing._id, { targetPrice: args.targetPrice });
            }
            return existing._id;
        }

        return await ctx.db.insert("wishlists", {
            userId: user._id,
            cardId: args.cardId,
            gameCode: args.gameCode,
            cardName: args.cardName,
            setName: args.setName,
            imageUrl: args.imageUrl,
            targetPrice: args.targetPrice,
            createdAt: Date.now(),
        });
    },
});

/** Remove a card from the wishlist. */
export const removeFromWishlist = mutation({
    args: { wishlistId: v.id("wishlists") },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const item = await ctx.db.get(args.wishlistId);
        if (!item || item.userId !== user._id) {
            throw new Error("Not found or unauthorized");
        }

        await ctx.db.delete(args.wishlistId);
    },
});

/** Toggle a card's wishlist status — add if missing, remove if present. */
export const toggleWishlistItem = mutation({
    args: {
        cardId: v.string(),
        gameCode: v.string(),
        cardName: v.string(),
        setName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("wishlists")
            .withIndex("by_user_card", (q: any) =>
                q.eq("userId", user._id).eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { action: "removed" as const, id: existing._id };
        }

        const id = await ctx.db.insert("wishlists", {
            userId: user._id,
            cardId: args.cardId,
            gameCode: args.gameCode,
            cardName: args.cardName,
            setName: args.setName,
            imageUrl: args.imageUrl,
            createdAt: Date.now(),
        });

        return { action: "added" as const, id };
    },
});

/** Check if a specific card is on the current user's wishlist. */
export const isOnWishlist = query({
    args: {
        cardId: v.string(),
        gameCode: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) return false;

        const existing = await ctx.db
            .query("wishlists")
            .withIndex("by_user_card", (q: any) =>
                q.eq("userId", user._id).eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .first();

        return !!existing;
    },
});

/** Update the target price for a wishlist item. */
export const updateTargetPrice = mutation({
    args: {
        wishlistId: v.id("wishlists"),
        targetPrice: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const item = await ctx.db.get(args.wishlistId);
        if (!item || item.userId !== user._id) {
            throw new Error("Not found or unauthorized");
        }

        await ctx.db.patch(args.wishlistId, { targetPrice: args.targetPrice });
    },
});
