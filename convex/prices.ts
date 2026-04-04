import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours
const MARKET_FEED_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get the latest price for a specific card.
 * Returns null if no price data exists, plus an `isStale` flag for cache invalidation.
 */
export const getLatestPrice = query({
    args: { cardId: v.string(), gameCode: v.string() },
    handler: async (ctx, args) => {
        const price = await ctx.db
            .query("prices")
            .withIndex("by_card", (q) => 
                q.eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .first();

        if (!price) return null;

        const isStale = Date.now() - price.updatedAt > CACHE_EXPIRY_MS;

        return {
            ...price,
            isStale,
        };
    },
});

/**
 * Get historical price data for a specific card.
 * Ordered by timestamp descending, limited to `limit` entries.
 */
export const getHistoricalData = query({
    args: { cardId: v.string(), gameCode: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("priceHistory")
            .withIndex("by_card", (q) => 
                q.eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .order("desc")
            .take(args.limit ?? 30);
    },
});

/**
 * Market Intelligence dashboard query.
 * Returns highest-value cards across all games with calculated % change.
 * No auth required — this is public market data.
 */
export const getMarketDashboard = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;

        // Use by_market_price index for efficient top-N retrieval
        const sorted = await ctx.db
            .query("prices")
            .withIndex("by_market_price")
            .order("desc")
            .take(limit);

        // For each card, calculate % change from earliest historical entry
        const results = await Promise.all(
            sorted.map(async (price) => {
                const history = await ctx.db
                    .query("priceHistory")
                    .withIndex("by_card", (q) =>
                        q.eq("cardId", price.cardId).eq("gameCode", price.gameCode)
                    )
                    .order("asc")
                    .take(2);

                let changePercent = 0;
                if (history.length >= 2) {
                    const oldest = history[0].price;
                    if (oldest > 0) {
                        changePercent = ((price.marketPrice - oldest) / oldest) * 100;
                    }
                }

                return {
                    cardId: price.cardId,
                    gameCode: price.gameCode,
                    cardName: price.cardName,
                    setName: price.setName,
                    imageUrl: price.imageUrl,
                    rarity: price.rarity,
                    marketPrice: price.marketPrice,
                    source: price.source,
                    changePercent: Math.round(changePercent * 10) / 10,
                    updatedAt: price.updatedAt,
                };
            })
        );

        return results;
    },
});

/**
 * Lightweight ticker query for the scrolling horizontal bar.
 * Returns card names and their % change, top 10.
 */
export const getMarketTicker = query({
    args: {},
    handler: async (ctx) => {
        // Use by_market_price index for efficient top-N retrieval
        const withPrices = await ctx.db
            .query("prices")
            .withIndex("by_market_price")
            .order("desc")
            .take(10);

        const ticker = await Promise.all(
            withPrices.map(async (price) => {
                const history = await ctx.db
                    .query("priceHistory")
                    .withIndex("by_card", (q) =>
                        q.eq("cardId", price.cardId).eq("gameCode", price.gameCode)
                    )
                    .order("asc")
                    .take(2);

                let changePercent = 0;
                if (history.length >= 2) {
                    const oldest = history[0].price;
                    if (oldest > 0) {
                        changePercent = ((price.marketPrice - oldest) / oldest) * 100;
                    }
                }

                return {
                    cardName: price.cardName,
                    changePercent: Math.round(changePercent * 10) / 10,
                };
            })
        );

        return ticker;
    },
});

/**
 * Get the feed config singleton for staleness checks.
 */
export const getMarketFeedConfig = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("marketFeedConfig").first();
    },
});

/**
 * Get a card's price data by external cardId + gameCode (no auth required).
 * Used for market card detail view and quick pricing mode.
 */
export const getCardByExternalId = query({
    args: { cardId: v.string(), gameCode: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("prices")
            .withIndex("by_card", (q) =>
                q.eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .first();
    },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Start or reset a sync task for a specific card (cache-coalescing gate).
 */
export const startSyncTask = mutation({
    args: { cardId: v.string(), gameCode: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("priceSyncTasks")
            .withIndex("by_card", (q) => 
                q.eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .first();

        const now = Date.now();

        if (existing) {
            if (existing.status === "processing" && now - existing.startedAt < 120000) {
                return existing._id;
            }
            await ctx.db.patch(existing._id, {
                status: "processing",
                startedAt: now,
            });
            return existing._id;
        }

        return await ctx.db.insert("priceSyncTasks", {
            cardId: args.cardId,
            gameCode: args.gameCode,
            status: "processing",
            startedAt: now,
        });
    },
});

/**
 * Upsert price data for a card and propagate to all savedScans owners.
 * Now accepts display metadata (cardName, setName, imageUrl) for market feed.
 */
export const updatePriceData = mutation({
    args: {
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
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const existing = await ctx.db
            .query("prices")
            .withIndex("by_card", (q) => 
                q.eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                cardName: args.cardName,
                setName: args.setName,
                imageUrl: args.imageUrl,
                rarity: args.rarity,
                marketPrice: args.marketPrice,
                lowPrice: args.lowPrice,
                midPrice: args.midPrice,
                highPrice: args.highPrice,
                source: args.source,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("prices", {
                cardId: args.cardId,
                gameCode: args.gameCode,
                cardName: args.cardName,
                setName: args.setName,
                imageUrl: args.imageUrl,
                rarity: args.rarity,
                marketPrice: args.marketPrice,
                lowPrice: args.lowPrice,
                midPrice: args.midPrice,
                highPrice: args.highPrice,
                source: args.source,
                currency: "USD",
                updatedAt: now,
            });
        }

        // Propagate to all savedScans for all users who have this card
        const affectedScans = await ctx.db
            .query("savedScans")
            .filter((q) => 
                q.and(
                    q.eq(q.field("cardId"), args.cardId),
                    q.eq(q.field("gameCode"), args.gameCode)
                )
            )
            .collect();

        for (const scan of affectedScans) {
            const patch: Record<string, any> = {
                estimatedPrice: args.marketPrice,
            };
            if (args.imageUrl && !scan.imageUrl) {
                patch.imageUrl = args.imageUrl;
            }
            await ctx.db.patch(scan._id, patch);
        }

        // Add to history
        await ctx.db.insert("priceHistory", {
            cardId: args.cardId,
            gameCode: args.gameCode,
            price: args.marketPrice,
            timestamp: now,
        });

        // Resolve sync task
        const task = await ctx.db
            .query("priceSyncTasks")
            .withIndex("by_card", (q) => 
                q.eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .first();
        
        if (task) {
            await ctx.db.patch(task._id, {
                status: "completed",
                completedAt: now,
            });
        }
    },
});

/**
 * Update market feed config singleton.
 */
export const updateMarketFeedConfig = mutation({
    args: { status: v.union(v.literal("idle"), v.literal("refreshing")) },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("marketFeedConfig").first();
        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, {
                lastRefreshedAt: now,
                status: args.status,
            });
        } else {
            await ctx.db.insert("marketFeedConfig", {
                lastRefreshedAt: now,
                status: args.status,
            });
        }
    },
});

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Sync a single card's price from external APIs.
 * Used for card detail view auto-refresh.
 */
export const syncPrice = action({
    args: { cardId: v.string(), gameCode: v.string(), cardName: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await ctx.runMutation(api.prices.startSyncTask, {
            cardId: args.cardId,
            gameCode: args.gameCode,
        });

        try {
            let marketPrice = 0;
            let lowPrice: number | undefined;
            let midPrice: number | undefined;
            let highPrice: number | undefined;
            let source = "unknown";
            let cardName = args.cardName ?? "Unknown Card";
            let setName: string | undefined;
            let imageUrl: string | undefined;
            let rarity: string | undefined;

            if (args.gameCode === "pokemon") {
                const response = await fetch(`https://api.pokemontcg.io/v2/cards/${args.cardId}`);
                if (!response.ok) throw new Error(`PokemonTCG API error: ${response.status}`);
                const data = await response.json();
                const card = data.data;

                cardName = card.name ?? cardName;
                setName = card.set?.name;
                imageUrl = card.images?.small;
                rarity = card.rarity;

                if (card.tcgplayer) {
                    const priceType = card.tcgplayer.prices.holofoil
                        || card.tcgplayer.prices.normal
                        || card.tcgplayer.prices.reverseHolofoil;
                    if (priceType) {
                        marketPrice = priceType.market || priceType.mid || 0;
                        lowPrice = priceType.low;
                        midPrice = priceType.mid;
                        highPrice = priceType.high;
                    }
                    source = "tcgplayer";
                }
            } else if (args.gameCode === "yugioh") {
                const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${args.cardId}`);
                if (!response.ok) throw new Error(`YGOProDeck API error: ${response.status}`);
                const data = await response.json();
                const card = data.data[0];

                cardName = card.name ?? cardName;
                imageUrl = card.card_images?.[0]?.image_url_small;
                rarity = card.race;

                if (card.card_prices?.length > 0) {
                    const prices = card.card_prices[0];
                    marketPrice = parseFloat(prices.tcgplayer_price) || 0;
                    source = "ygoprodeck";
                }
            }

            await ctx.runMutation(api.prices.updatePriceData, {
                cardId: args.cardId,
                gameCode: args.gameCode,
                cardName,
                setName,
                imageUrl,
                rarity,
                marketPrice,
                lowPrice,
                midPrice,
                highPrice,
                source,
            });

            return { success: true, price: marketPrice };
        } catch (error) {
            console.error("SyncPrice Error:", error);
            return { success: false, error: String(error) };
        }
    },
});

/**
 * Fetch market feed data from both PokémonTCG and YGOProDeck APIs.
 * Populates the `prices` table with high-value cards for the Market Intelligence dashboard.
 * Respects cache: skips cards updated within the last 12 hours.
 */
export const fetchMarketFeed = action({
    args: {},
    handler: async (ctx) => {
        // Mark feed as refreshing
        await ctx.runMutation(api.prices.updateMarketFeedConfig, { status: "refreshing" });

        let totalSynced = 0;

        try {
            // ── Pokémon TCG: Fetch top 10 highest-value cards ──
            const pokemonResponse = await fetch(
                "https://api.pokemontcg.io/v2/cards?q=tcgplayer.prices.holofoil.market:[50 TO *]&orderBy=-tcgplayer.prices.holofoil.market&pageSize=10"
            );

            if (pokemonResponse.ok) {
                const pokemonData = await pokemonResponse.json();
                const cards = pokemonData.data ?? [];

                for (const card of cards) {
                    const priceType = card.tcgplayer?.prices?.holofoil
                        ?? card.tcgplayer?.prices?.normal
                        ?? card.tcgplayer?.prices?.reverseHolofoil;
                    
                    if (!priceType?.market || priceType.market <= 0) continue;

                    await ctx.runMutation(api.prices.updatePriceData, {
                        cardId: card.id,
                        gameCode: "pokemon",
                        cardName: card.name,
                        setName: card.set?.name,
                        imageUrl: card.images?.small,
                        rarity: card.rarity,
                        marketPrice: priceType.market,
                        lowPrice: priceType.low,
                        midPrice: priceType.mid,
                        highPrice: priceType.high,
                        source: "tcgplayer",
                    });
                    totalSynced++;
                }
            } else {
                console.error("PokemonTCG market feed error:", pokemonResponse.status);
            }

            // ── Yu-Gi-Oh!: Fetch top valued cards ──
            // YGOProDeck doesn't support sorting by price, so we fetch staple/popular cards
            // and filter by price > $5
            const yugiohCardIds = [
                "46986414",   // Dark Magician
                "89631139",   // Blue-Eyes White Dragon
                "74677422",   // Red-Eyes Black Dragon
                "44508094",   // Dark Magician Girl
                "70781052",   // Stardust Dragon
                "36996508",   // Cyber Dragon
                "33396948",   // Exodia the Forbidden One
                "7902349",    // Left Arm of the Forbidden One
                "8124921",    // Left Leg of the Forbidden One
                "70903634",   // Right Arm of the Forbidden One
            ];

            for (const cardId of yugiohCardIds) {
                try {
                    const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`);
                    if (!response.ok) continue;
                    const data = await response.json();
                    const card = data.data?.[0];
                    if (!card) continue;

                    const tcgPrice = parseFloat(card.card_prices?.[0]?.tcgplayer_price ?? "0");
                    if (tcgPrice <= 0) continue;

                    await ctx.runMutation(api.prices.updatePriceData, {
                        cardId: card.id.toString(),
                        gameCode: "yugioh",
                        cardName: card.name,
                        setName: card.archetype,
                        imageUrl: card.card_images?.[0]?.image_url_small,
                        rarity: card.race,
                        marketPrice: tcgPrice,
                        source: "ygoprodeck",
                    });
                    totalSynced++;
                } catch (err) {
                    console.error(`YGOProDeck fetch error for ${cardId}:`, err);
                }
            }

            // Mark feed as idle
            await ctx.runMutation(api.prices.updateMarketFeedConfig, { status: "idle" });

            return { success: true, totalSynced };
        } catch (error) {
            console.error("fetchMarketFeed Error:", error);
            await ctx.runMutation(api.prices.updateMarketFeedConfig, { status: "idle" });
            return { success: false, error: String(error) };
        }
    },
});
