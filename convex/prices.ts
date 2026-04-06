import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours
const MARKET_FEED_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

const JUSTTCG_GAME_IDS: Record<string, string> = {
    pokemon: "pokemon",
    yugioh: "yugioh",
    mtg: "mtg",
    onepiece: "one-piece-card-game",
};

type PriceHistoryPoint = {
    timestamp: number;
    price: number;
};

type ExternalPriceResult = {
    cardName: string;
    setName?: string;
    imageUrl?: string;
    rarity?: string;
    marketPrice: number;
    lowPrice?: number;
    midPrice?: number;
    highPrice?: number;
    source: string;
    history?: PriceHistoryPoint[];
};

function firstPositiveNumber(values: Array<number | null | undefined>) {
    for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
            return value;
        }
    }
    return undefined;
}

function normalizeText(value?: string | null) {
    return (value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function scoreTextMatch(target: string, candidate?: string | null) {
    const a = normalizeText(target);
    const b = normalizeText(candidate);
    if (!a || !b) return 0;
    if (a === b) return 120;
    if (b.includes(a) || a.includes(b)) return 80;
    const targetWords = new Set(a.split(" ").filter(Boolean));
    const candidateWords = b.split(" ").filter(Boolean);
    let overlap = 0;
    for (const word of candidateWords) {
        if (targetWords.has(word)) overlap++;
    }
    return overlap * 10;
}

function chooseBestJustTcgCard(
    cards: any[],
    args: { cardName?: string; setName?: string; number?: string }
) {
    const targetNumber = normalizeText(args.number);
    return cards
        .map((card) => {
            let score = 0;
            score += scoreTextMatch(args.cardName ?? "", card?.name);
            score += scoreTextMatch(args.setName ?? "", card?.set_name);
            if (targetNumber && normalizeText(card?.number) === targetNumber) {
                score += 60;
            }
            return { card, score };
        })
        .sort((a, b) => b.score - a.score)[0]?.card ?? null;
}

function chooseBestJustTcgVariant(variants: any[]) {
    return (
        variants
            .map((variant) => {
                let score = 0;
                const condition = normalizeText(variant?.condition);
                const printing = normalizeText(variant?.printing);
                if (condition === "near mint" || condition === "nm") score += 50;
                if (printing === "normal") score += 30;
                if (printing === "unlimited") score += 20;
                score += Number(variant?.price ?? 0) > 0 ? 5 : 0;
                return { variant, score };
            })
            .sort((a, b) => b.score - a.score)[0]?.variant ?? variants[0]
    );
}

function extractJustTcgHistory(variant: any): PriceHistoryPoint[] {
    const rawHistory = Array.isArray(variant?.priceHistory)
        ? variant.priceHistory
        : Array.isArray(variant?.priceHistory30d)
            ? variant.priceHistory30d
            : Array.isArray(variant?.priceHistory90d)
                ? variant.priceHistory90d
                : [];

    return rawHistory
        .map((entry: any) => ({
            timestamp: Number(entry?.t) * 1000,
            price: Number(entry?.p),
        }))
        .filter((entry: PriceHistoryPoint) => Number.isFinite(entry.timestamp) && Number.isFinite(entry.price) && entry.price > 0);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return await response.json() as T;
}

async function resolveJustTcgSetId(gameId: string, setName?: string) {
    const apiKey = process.env.JUSTTCG_API_KEY;
    if (!apiKey || !setName) return undefined;

    const query = new URLSearchParams({
        game: gameId,
        q: setName,
        limit: "5",
    });
    const payload = await fetchJson<{ data?: Array<{ id: string; name?: string }> }>(
        `https://api.justtcg.com/v1/sets?${query.toString()}`,
        { headers: { "x-api-key": apiKey } }
    );
    const matches = payload.data ?? [];
    if (matches.length === 0) return undefined;

    const exact = matches.find((set) => normalizeText(set.name) === normalizeText(setName));
    return exact?.id ?? matches[0]?.id;
}

async function fetchJustTcgPrice(args: {
    cardId: string;
    gameCode: string;
    cardName?: string;
    setName?: string;
    number?: string;
}): Promise<ExternalPriceResult | null> {
    const apiKey = process.env.JUSTTCG_API_KEY;
    const gameId = JUSTTCG_GAME_IDS[args.gameCode];
    if (!apiKey || !gameId || !args.cardName) return null;

    const query = new URLSearchParams({
        game: gameId,
        q: args.cardName,
        condition: "NM",
        include_price_history: "true",
        priceHistoryDuration: "90d",
        include_statistics: "7d,30d,90d",
        limit: "10",
    });

    const setId = await resolveJustTcgSetId(gameId, args.setName);
    if (setId) {
        query.set("set", setId);
    }

    const payload = await fetchJson<{ data?: any[] }>(
        `https://api.justtcg.com/v1/cards?${query.toString()}`,
        { headers: { "x-api-key": apiKey } }
    );

    const cards = payload.data ?? [];
    if (cards.length === 0) return null;

    const bestCard = chooseBestJustTcgCard(cards, args);
    if (!bestCard) return null;

    const bestVariant = chooseBestJustTcgVariant(bestCard.variants ?? []);
    if (!bestVariant) {
        throw new Error("JustTCG returned card without variants");
    }

    const marketPrice = Number(bestVariant.price);
    if (!Number.isFinite(marketPrice) || marketPrice <= 0) {
        throw new Error("JustTCG returned invalid market price");
    }

    return {
        cardName: bestCard.name ?? args.cardName ?? "Unknown Card",
        setName: bestCard.set_name ?? args.setName,
        imageUrl: undefined,
        rarity: bestCard.rarity,
        marketPrice,
        lowPrice: firstPositiveNumber([
            Number(bestVariant.minPrice7d),
            Number(bestVariant.minPrice30d),
            Number(bestVariant.minPrice90d),
        ]),
        midPrice: firstPositiveNumber([
            Number(bestVariant.avgPrice),
            Number(bestVariant.avgPrice30d),
            Number(bestVariant.price),
        ]),
        highPrice: firstPositiveNumber([
            Number(bestVariant.maxPrice7d),
            Number(bestVariant.maxPrice30d),
            Number(bestVariant.maxPrice90d),
        ]),
        source: "justtcg",
        history: extractJustTcgHistory(bestVariant),
    };
}

async function fetchOnePiecePrice(args: { cardId: string; cardName?: string }): Promise<ExternalPriceResult> {
    // OPTCG API has no auth and exposes card snapshots with recent pricing.
    const byCardId = await fetch(`https://optcgapi.com/api/sets/card/${encodeURIComponent(args.cardId)}/`);
    if (!byCardId.ok) {
        throw new Error(`OPTCG API error: ${byCardId.status}`);
    }
    const payload = await byCardId.json();
    const card = Array.isArray(payload) ? payload[0] : payload;
    if (!card) throw new Error("One Piece card not found");

    const marketPrice = firstPositiveNumber([
        Number(card.marketPrice),
        Number(card.market_price),
        Number(card.price?.market),
        Number(card.prices?.market),
    ]);
    if (!marketPrice) throw new Error("No One Piece market price available");

    return {
        cardName: card.cardName ?? card.name ?? args.cardName ?? "Unknown Card",
        setName: card.setName ?? card.set ?? card.set_name,
        imageUrl: card.imageUrl ?? card.image_url ?? card.image,
        rarity: card.rarity,
        marketPrice,
        source: "optcgapi",
    };
}

async function fetchDragonBallPrice(args: { cardId: string; cardName?: string }): Promise<ExternalPriceResult> {
    const apiKey = process.env.TCGAPI_KEY;
    if (!apiKey) {
        throw new Error("TCGAPI_KEY is required for Dragon Ball pricing");
    }

    const query = encodeURIComponent(args.cardName ?? args.cardId);
    const gameSlugs = ["dragon-ball-super", "dragon-ball-super-ccg", "dragonball-super"];
    let card: any = null;

    for (const game of gameSlugs) {
        const response = await fetch(
            `https://api.tcgapi.dev/v1/search?q=${query}&game=${encodeURIComponent(game)}&sort=price_desc&per_page=1`,
            { headers: { "X-API-Key": apiKey } }
        );
        if (!response.ok) continue;
        const data = await response.json();
        const first = data?.data?.[0];
        if (first) {
            card = first;
            break;
        }
    }

    if (!card) throw new Error("Dragon Ball card not found in TCG API");

    const marketPrice = firstPositiveNumber([
        Number(card.market_price),
        Number(card.marketPrice),
        Number(card.price?.market_price),
        Number(card.price?.market),
    ]);
    if (!marketPrice) throw new Error("No Dragon Ball market price available");

    return {
        cardName: card.name ?? args.cardName ?? "Unknown Card",
        setName: card.set_name ?? card.setName,
        imageUrl: card.image_url ?? card.imageUrl,
        rarity: card.rarity,
        marketPrice,
        source: "tcgapi",
    };
}

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

export const failSyncTask = internalMutation({
    args: {
        cardId: v.string(),
        gameCode: v.string(),
        completedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const task = await ctx.db
            .query("priceSyncTasks")
            .withIndex("by_card", (q) =>
                q.eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .first();
        if (!task) return;
        await ctx.db.patch(task._id, {
            status: "failed",
            completedAt: args.completedAt,
        });
    },
});

export const ingestHistoricalData = internalMutation({
    args: {
        cardId: v.string(),
        gameCode: v.string(),
        points: v.array(
            v.object({
                timestamp: v.number(),
                price: v.number(),
            })
        ),
    },
    handler: async (ctx, args) => {
        if (args.points.length === 0) return;

        const existing = await ctx.db
            .query("priceHistory")
            .withIndex("by_card", (q) =>
                q.eq("cardId", args.cardId).eq("gameCode", args.gameCode)
            )
            .collect();
        const existingTimestamps = new Set(existing.map((entry) => entry.timestamp));

        for (const point of args.points) {
            if (existingTimestamps.has(point.timestamp)) continue;
            await ctx.db.insert("priceHistory", {
                cardId: args.cardId,
                gameCode: args.gameCode,
                price: point.price,
                timestamp: point.timestamp,
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
    args: {
        cardId: v.string(),
        gameCode: v.string(),
        cardName: v.optional(v.string()),
        setName: v.optional(v.string()),
        number: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.runMutation(api.prices.startSyncTask, {
            cardId: args.cardId,
            gameCode: args.gameCode,
        });

        try {
            let marketPrice: number | undefined;
            let lowPrice: number | undefined;
            let midPrice: number | undefined;
            let highPrice: number | undefined;
            let source = "unknown";
            let cardName = args.cardName ?? "Unknown Card";
            let setName: string | undefined;
            let imageUrl: string | undefined;
            let rarity: string | undefined;
            let historyPoints: PriceHistoryPoint[] = [];

            const justTcg = await fetchJustTcgPrice(args);
            if (justTcg) {
                cardName = justTcg.cardName;
                setName = justTcg.setName;
                imageUrl = justTcg.imageUrl;
                rarity = justTcg.rarity;
                marketPrice = justTcg.marketPrice;
                lowPrice = justTcg.lowPrice;
                midPrice = justTcg.midPrice;
                highPrice = justTcg.highPrice;
                source = justTcg.source;
                historyPoints = justTcg.history ?? [];
            } else if (args.gameCode === "pokemon") {
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
                        marketPrice = priceType.market || priceType.mid;
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
                    marketPrice = parseFloat(prices.tcgplayer_price);
                    source = "ygoprodeck";
                }
            } else if (args.gameCode === "mtg") {
                // First try direct by id (when cardId is a Scryfall id).
                let response = await fetch(`https://api.scryfall.com/cards/${args.cardId}`);
                if (!response.ok) {
                    // Fallback: fuzzy name search.
                    const q = encodeURIComponent(args.cardName ?? args.cardId);
                    response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${q}`);
                }
                if (!response.ok) throw new Error(`Scryfall API error: ${response.status}`);
                const card = await response.json();

                cardName = card.name ?? cardName;
                setName = card.set_name;
                imageUrl = card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small;
                rarity = card.rarity;

                const usd = Number(card.prices?.usd ?? card.prices?.usd_foil ?? card.prices?.usd_etched);
                if (!Number.isFinite(usd) || usd <= 0) {
                    throw new Error("No valid MTG USD price available");
                }
                marketPrice = usd;
                source = "scryfall";
            } else if (args.gameCode === "onepiece") {
                const onePiece = await fetchOnePiecePrice({
                    cardId: args.cardId,
                    cardName: args.cardName,
                });
                cardName = onePiece.cardName;
                setName = onePiece.setName;
                imageUrl = onePiece.imageUrl;
                rarity = onePiece.rarity;
                marketPrice = onePiece.marketPrice;
                source = onePiece.source;
            } else if (args.gameCode === "dragonball") {
                const dragonBall = await fetchDragonBallPrice({
                    cardId: args.cardId,
                    cardName: args.cardName,
                });
                cardName = dragonBall.cardName;
                setName = dragonBall.setName;
                imageUrl = dragonBall.imageUrl;
                rarity = dragonBall.rarity;
                marketPrice = dragonBall.marketPrice;
                source = dragonBall.source;
            } else {
                throw new Error(`Pricing provider unavailable for game '${args.gameCode}'`);
            }

            if (!marketPrice || !Number.isFinite(marketPrice) || marketPrice <= 0) {
                throw new Error(`No valid market price for ${args.gameCode}:${args.cardId}`);
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

            if (historyPoints.length > 0) {
                await ctx.runMutation(internal.prices.ingestHistoricalData, {
                    cardId: args.cardId,
                    gameCode: args.gameCode,
                    points: historyPoints.slice(-180),
                });
            }

            return { success: true, price: marketPrice };
        } catch (error) {
            console.error("SyncPrice Error:", error);
            await ctx.runMutation(internal.prices.failSyncTask, {
                cardId: args.cardId,
                gameCode: args.gameCode,
                completedAt: Date.now(),
            });
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
            const justTcgKey = process.env.JUSTTCG_API_KEY;
            if (justTcgKey) {
                const feedGames = ["pokemon", "yugioh", "mtg", "onepiece"] as const;

                for (const gameCode of feedGames) {
                    try {
                        const gameId = JUSTTCG_GAME_IDS[gameCode];
                        const query = new URLSearchParams({
                            game: gameId,
                            orderBy: "30d",
                            limit: "5",
                            condition: "NM",
                            include_price_history: "false",
                        });
                        const payload = await fetchJson<{ data?: any[] }>(
                            `https://api.justtcg.com/v1/cards?${query.toString()}`,
                            { headers: { "x-api-key": justTcgKey } }
                        );
                        const cards = payload.data ?? [];

                        for (const card of cards) {
                            const variant = chooseBestJustTcgVariant(card.variants ?? []);
                            const marketPrice = Number(variant?.price);
                            if (!Number.isFinite(marketPrice) || marketPrice <= 0) continue;

                            await ctx.runMutation(api.prices.updatePriceData, {
                                cardId: card.id ?? `${gameCode}-${normalizeText(card.name).replace(/\s+/g, "-")}`,
                                gameCode,
                                cardName: card.name,
                                setName: card.set_name,
                                imageUrl: undefined,
                                rarity: card.rarity,
                                marketPrice,
                                lowPrice: firstPositiveNumber([
                                    Number(variant?.minPrice7d),
                                    Number(variant?.minPrice30d),
                                ]),
                                midPrice: firstPositiveNumber([
                                    Number(variant?.avgPrice),
                                    Number(variant?.avgPrice30d),
                                    marketPrice,
                                ]),
                                highPrice: firstPositiveNumber([
                                    Number(variant?.maxPrice7d),
                                    Number(variant?.maxPrice30d),
                                ]),
                                source: "justtcg",
                            });
                            totalSynced++;
                        }
                    } catch (err) {
                        console.error(`JustTCG market feed error for ${gameCode}:`, err);
                    }
                }
            }

            if (totalSynced === 0) {
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
