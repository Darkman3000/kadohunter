import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/** Action to check prices and trigger notifications. Scheduled by crons.ts. */
export const checkPriceDrops = internalAction({
    args: {},
    handler: async (ctx) => {
        // 1. Get all wishlist items that have a target price
        const usersWithWishlists = await ctx.runQuery(internal.notifications.getUsersWithTargetPrices);
        
        for (const user of usersWithWishlists) {
            if (!user.pushToken) continue;

            const drops = user.wishlistItems.filter((item) =>
                item.targetPrice && 
                item.currentPrice && 
                item.currentPrice <= item.targetPrice
            );

            if (drops.length > 0) {
                // 2. Send Expo push notification
                const message = drops.length === 1 
                    ? `Price Alert: ${drops[0].cardName} is now ${drops[0].currentPrice}$!`
                    : `Price Alert: ${drops.length} cards from your wishlist are at or below your target!`;

                await sendPushNotification(user.pushToken, "Kado Price Hunter", message, {
                    url: "/(tabs)/profile" // Navigate to wishlist
                });
            }
        }
    },
});

/** Helper to send a push notification via Expo API. */
async function sendPushNotification(expoPushToken: string, title: string, body: string, data: Record<string, string>) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}

/** Query to get users and their items with targets (Internal). */
export const getUsersWithTargetPrices = internalQuery({
    args: {},
    handler: async (ctx) => {
        // 1. Fetch all wishlists that have a target price set
        const allWishlists = await ctx.db.query("wishlists").collect();
        const withTargets = allWishlists.filter(item => item.targetPrice !== undefined);

        if (withTargets.length === 0) return [];

        // 2. Batch-fetch prices for all targeted cards
        const priceKeys = [...new Set(withTargets.map(w => `${w.cardId}:${w.gameCode}`))];
        const priceMap = new Map<string, number>();
        for (const key of priceKeys) {
            const [cardId, gameCode] = key.split(":");
            const price = await ctx.db
                .query("prices")
                .withIndex("by_card", (q) =>
                    q.eq("cardId", cardId).eq("gameCode", gameCode)
                )
                .first();
            if (price) priceMap.set(key, price.marketPrice);
        }

        // 3. Group by userId and fetch user push tokens
        const userIds = [...new Set(withTargets.map(w => w.userId))];
        const userMap = new Map(
            (await Promise.all(userIds.map(id => ctx.db.get(id))))
                .filter(Boolean)
                .map(u => [u!._id, u!])
        );

        // 4. Build results grouped by user
        const resultsByUser = new Map<string, {
            pushToken: string | undefined;
            wishlistItems: { cardName: string; targetPrice: number | undefined; currentPrice: number | undefined }[];
        }>();

        for (const item of withTargets) {
            const user = userMap.get(item.userId);
            if (!user) continue;

            if (!resultsByUser.has(item.userId)) {
                resultsByUser.set(item.userId, {
                    pushToken: user.pushToken,
                    wishlistItems: [],
                });
            }

            const currentPrice = priceMap.get(`${item.cardId}:${item.gameCode}`);
            resultsByUser.get(item.userId)!.wishlistItems.push({
                cardName: item.cardName,
                targetPrice: item.targetPrice,
                currentPrice,
            });
        }

        return [...resultsByUser.values()].filter(r => r.wishlistItems.length > 0);
    },
});
