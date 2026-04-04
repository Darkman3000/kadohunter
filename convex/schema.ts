import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    models: defineTable({
        modelType: v.string(),
        version: v.string(),
        fileId: v.id("_storage"),
        fileSize: v.number(),
        checksum: v.string(),
        minAppVersion: v.string(),
        active: v.boolean(),
    }).index("by_type_and_version", ["modelType", "version"]),

    games: defineTable({
        gameName: v.string(),
        gameCode: v.string(),
        modelClassIndex: v.number(),
        active: v.boolean(),
    }).index("by_code", ["gameCode"]),

    updateLogs: defineTable({
        deviceId: v.string(),
        modelType: v.string(),
        oldVersion: v.string(),
        newVersion: v.string(),
    }).index("by_device", ["deviceId"]),

    users: defineTable({
        tokenIdentifier: v.string(),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        hunterTag: v.optional(v.string()), // e.g. "KDO-7842"
        tier: v.union(v.literal("free"), v.literal("pro")),
        billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
        scansToday: v.number(),
        lastScanDate: v.string(),
        stripeCustomerId: v.optional(v.string()),
        subscriptionId: v.optional(v.string()),
        pushToken: v.optional(v.string()), // Expo push token for notifications
    }).index("by_token", ["tokenIdentifier"])
      .index("by_tag", ["hunterTag"]),

    friendships: defineTable({
        requesterId: v.id("users"),
        addresseeId: v.id("users"),
        status: v.union(
            v.literal("pending"),
            v.literal("accepted"),
            v.literal("blocked")
        ),
        createdAt: v.number(),
    })
        .index("by_requester", ["requesterId"])
        .index("by_addressee", ["addresseeId"])
        .index("by_pair", ["requesterId", "addresseeId"]),

    wishlists: defineTable({
        userId: v.id("users"),
        cardId: v.string(),
        gameCode: v.string(),
        cardName: v.string(),
        setName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        targetPrice: v.optional(v.number()),
        createdAt: v.number(),
    }).index("by_user", ["userId"])
      .index("by_user_card", ["userId", "cardId", "gameCode"]),

    savedScans: defineTable({
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
        quantity: v.optional(v.number()),
        isFavorite: v.optional(v.boolean()),
        createdAt: v.number(),
    }).index("by_user", ["userId"]),

    recognitionLogs: defineTable({
        userId: v.optional(v.id("users")),
        provider: v.string(),
        resultName: v.optional(v.string()),
        resultGame: v.optional(v.string()),
        confidence: v.optional(v.number()),
        latencyMs: v.optional(v.number()),
        success: v.boolean(),
        errorMessage: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_user", ["userId"])
        .index("by_provider", ["provider"]),

    prices: defineTable({
        cardId: v.string(),
        gameCode: v.string(),
        cardName: v.string(),
        setName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        rarity: v.optional(v.string()),
        marketPrice: v.number(),
        lowPrice: v.optional(v.number()),
        midPrice: v.optional(v.number()),
        highPrice: v.optional(v.number()),
        source: v.string(),
        currency: v.string(),
        updatedAt: v.number(),
    }).index("by_card", ["cardId", "gameCode"])
      .index("by_game", ["gameCode"])
      .index("by_market_price", ["marketPrice"]),

    marketFeedConfig: defineTable({
        lastRefreshedAt: v.number(),
        status: v.union(v.literal("idle"), v.literal("refreshing")),
    }),

    priceHistory: defineTable({
        cardId: v.string(),
        gameCode: v.string(),
        price: v.number(),
        timestamp: v.number(),
    }).index("by_card", ["cardId", "gameCode", "timestamp"]),

    priceSyncTasks: defineTable({
        cardId: v.string(),
        gameCode: v.string(),
        status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
        startedAt: v.number(),
        completedAt: v.optional(v.number()),
    }).index("by_card", ["cardId", "gameCode"]),

    fleaSessions: defineTable({
        userId: v.optional(v.id("users")),
        deviceId: v.string(),
        title: v.optional(v.string()),
        status: v.union(v.literal("active"), v.literal("completed")),
        totalValue: v.number(),
        cardCount: v.number(),
        startedAt: v.number(),
        completedAt: v.optional(v.number()),
        sharedWith: v.optional(v.array(v.id("users"))), // friends who can review
    }).index("by_user", ["userId"])
      .index("by_device", ["deviceId"]),

    // Ephemeral/staged scans for flea market mode
    stagedScans: defineTable({
        deviceId: v.string(),
        userId: v.optional(v.id("users")),
        sessionId: v.optional(v.id("fleaSessions")),
        gameCode: v.string(),
        cardId: v.string(),
        cardName: v.string(),
        setName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        rarity: v.optional(v.string()),
        marketPrice: v.optional(v.number()),
        reviewed: v.boolean(),
        createdAt: v.number(),
        expiresAt: v.number(), // auto-cleanup after 72h
    }).index("by_device", ["deviceId"])
      .index("by_user", ["userId"])
      .index("by_session", ["sessionId"]),

    trades: defineTable({
        proposerId: v.id("users"),
        receiverId: v.id("users"),
        proposerCards: v.array(v.object({
            scanId: v.id("savedScans"),
            cardId: v.string(),
            cardName: v.string(),
            imageUrl: v.optional(v.string()),
            estimatedPrice: v.optional(v.number()),
        })),
        receiverCards: v.array(v.object({
            scanId: v.id("savedScans"),
            cardId: v.string(),
            cardName: v.string(),
            imageUrl: v.optional(v.string()),
            estimatedPrice: v.optional(v.number()),
        })),
        status: v.union(
            v.literal("proposed"),
            v.literal("accepted"),
            v.literal("rejected"),
            v.literal("cancelled")
        ),
        proposerValue: v.number(),
        receiverValue: v.number(),
        message: v.optional(v.string()),
        createdAt: v.number(),
        resolvedAt: v.optional(v.number()),
    }).index("by_proposer", ["proposerId"])
      .index("by_receiver", ["receiverId"]),
});

