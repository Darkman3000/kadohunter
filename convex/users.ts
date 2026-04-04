import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const FREE_SCAN_LIMIT = 5; // Mirrors @kado/domain scanLimits.free
import {
    getUserByTokenIdentifier,
    getAuthenticatedUser,
    requireAuthorizedUser,
    requireCurrentUser,
    requireOwnedScan,
} from "./utils/auth";

export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const auth = await getAuthenticatedUser(ctx);
        return auth?.user ?? null;
    },
});

export const storeUser = mutation({
    args: {
        tokenIdentifier: v.string(),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        const tokenIdentifier = identity?.tokenIdentifier ?? args.tokenIdentifier;
        let existingUser = await getUserByTokenIdentifier(ctx, tokenIdentifier);

        if (!existingUser && tokenIdentifier !== args.tokenIdentifier) {
            const legacyUser = await getUserByTokenIdentifier(ctx, args.tokenIdentifier);
            if (legacyUser) {
                await ctx.db.patch(legacyUser._id, {
                    tokenIdentifier,
                    email: args.email ?? legacyUser.email,
                    name: args.name ?? legacyUser.name,
                });
                existingUser = await ctx.db.get(legacyUser._id);
            }
        }

        if (existingUser) {
            const patch: { email?: string; name?: string; hunterTag?: string } = {};

            if (args.email !== undefined && args.email !== existingUser.email) {
                patch.email = args.email;
            }

            if (args.name !== undefined && args.name !== existingUser.name) {
                patch.name = args.name;
            }

            if (!existingUser.hunterTag) {
                const suffix = existingUser._id.slice(-4).toUpperCase();
                patch.hunterTag = `KDO-${suffix}`;
            }

            if (Object.keys(patch).length > 0) {
                await ctx.db.patch(existingUser._id, patch);
            }

            return existingUser._id;
        }

        const userId = await ctx.db.insert("users", {
            tokenIdentifier,
            email: args.email,
            name: args.name,
            tier: "free",
            scansToday: 0,
            lastScanDate: new Date().toISOString().split("T")[0],
        });

        const suffix = userId.slice(-4).toUpperCase();
        await ctx.db.patch(userId, { hunterTag: `KDO-${suffix}` });

        return userId;
    },
});

export const logScanAttempt = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await requireAuthorizedUser(ctx, args.userId);
        const today = new Date().toISOString().split("T")[0];

        if (user.lastScanDate !== today) {
            await ctx.db.patch(args.userId, { scansToday: 1, lastScanDate: today });
            return true;
        }

        if (user.tier === "free" && user.scansToday >= FREE_SCAN_LIMIT) {
            return false;
        }

        await ctx.db.patch(args.userId, { scansToday: user.scansToday + 1 });
        return true;
    },
});

export const saveScanToCollection = mutation({
    args: {
        userId: v.id("users"),
        gameCode: v.string(),
        cardId: v.string(),
        cardName: v.string(),
        setName: v.optional(v.string()),
        rarity: v.optional(v.string()),
        number: v.optional(v.string()),
        condition: v.optional(v.string()),
        foil: v.optional(v.boolean()),
        finish: v.optional(v.string()),
        marketTrend: v.optional(v.string()),
        estimatedPrice: v.optional(v.number()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAuthorizedUser(ctx, args.userId);

        const { userId, ...cardFields } = args;
        return await ctx.db.insert("savedScans", {
            userId,
            ...cardFields,
            createdAt: Date.now(),
        });
    },
});

export const getUserCollection = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await requireAuthorizedUser(ctx, args.userId);
        return await ctx.db
            .query("savedScans")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

export const getBinderScans = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireCurrentUser(ctx);
        return await ctx.db
            .query("savedScans")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();
    },
});

export const getUserStats = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await requireAuthorizedUser(ctx, args.userId);
        const collection = await ctx.db
            .query("savedScans")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        return {
            scansToday: user.scansToday,
            collectionCount: collection.length,
            collectionValue: collection.reduce((total, scan) => total + (scan.estimatedPrice ?? 0), 0),
        };
    },
});

export const registerPushToken = mutation({
    args: { pushToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireCurrentUser(ctx);
        await ctx.db.patch(user._id, { pushToken: args.pushToken });
    },
});

export const getCardById = query({
    args: { scanId: v.id("savedScans") },
    handler: async (ctx, args) => {
        const { scan } = await requireOwnedScan(ctx, args.scanId);
        return scan;
    },
});

export const deleteFromCollection = mutation({
    args: { scanId: v.id("savedScans") },
    handler: async (ctx, args) => {
        await requireOwnedScan(ctx, args.scanId);
        await ctx.db.delete(args.scanId);
    },
});

export const updateCardCondition = mutation({
    args: {
        scanId: v.id("savedScans"),
        condition: v.string(),
    },
    handler: async (ctx, args) => {
        await requireOwnedScan(ctx, args.scanId);
        await ctx.db.patch(args.scanId, { condition: args.condition });
    },
});

export const getStagedScanById = query({
    args: { stagedId: v.id("stagedScans") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.stagedId);
    },
});

export const getStagedScans = query({
    args: { userId: v.optional(v.id("users")), deviceId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.userId) {
            return await ctx.db
                .query("stagedScans")
                .withIndex("by_user", (q) => q.eq("userId", args.userId!))
                .order("desc")
                .collect();
        }

        if (args.deviceId) {
            return await ctx.db
                .query("stagedScans")
                .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId!))
                .order("desc")
                .collect();
        }

        return [];
    },
});

export const saveToStaged = mutation({
    args: {
        userId: v.optional(v.id("users")),
        deviceId: v.optional(v.string()),
        gameCode: v.string(),
        cardId: v.string(),
        cardName: v.string(),
        setName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        rarity: v.optional(v.string()),
        marketPrice: v.optional(v.number()),
        sessionId: v.optional(v.id("fleaSessions")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("stagedScans", {
            userId: args.userId,
            deviceId: args.deviceId ?? "default",
            sessionId: args.sessionId,
            gameCode: args.gameCode,
            cardId: args.cardId,
            cardName: args.cardName,
            setName: args.setName,
            imageUrl: args.imageUrl,
            rarity: args.rarity,
            marketPrice: args.marketPrice,
            reviewed: false,
            createdAt: Date.now(),
            expiresAt: Date.now() + 72 * 60 * 60 * 1000,
        });
    },
});

export const updateCardQuantity = mutation({
    args: { scanId: v.id("savedScans"), quantity: v.number() },
    handler: async (ctx, args) => {
        await requireOwnedScan(ctx, args.scanId);
        if (args.quantity < 1) throw new Error("Quantity must be at least 1");
        await ctx.db.patch(args.scanId, { quantity: args.quantity });
    },
});

export const toggleFavorite = mutation({
    args: { scanId: v.id("savedScans") },
    handler: async (ctx, args) => {
        const { scan } = await requireOwnedScan(ctx, args.scanId);
        await ctx.db.patch(args.scanId, { isFavorite: !((scan as any).isFavorite ?? false) });
    },
});