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

            const drops = user.wishlistItems.filter((item: any) => 
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
async function sendPushNotification(expoPushToken: string, title: string, body: string, data: any) {
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
        const users = await ctx.db.query("users").collect();
        const results = [];

        for (const user of users) {
            const wishlistItems = await ctx.db
                .query("wishlists")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .collect();

            const itemsWithTargets = await Promise.all(
                wishlistItems
                    .filter(item => item.targetPrice !== undefined)
                    .map(async (item) => {
                        const latestPrice = await ctx.db
                            .query("prices")
                            .withIndex("by_card", (q) =>
                                q.eq("cardId", item.cardId).eq("gameCode", item.gameCode)
                            )
                            .order("desc")
                            .first();

                        return {
                            cardName: item.cardName,
                            targetPrice: item.targetPrice,
                            currentPrice: latestPrice?.marketPrice,
                        };
                    })
            );

            if (itemsWithTargets.length > 0) {
                results.push({
                    pushToken: user.pushToken,
                    wishlistItems: itemsWithTargets,
                });
            }
        }

        return results;
    },
});
