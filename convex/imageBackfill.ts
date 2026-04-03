import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const BATCH_SIZE = 20;

/** Resolve a card image URL from external APIs by game and name. */
async function resolveImageUrl(
    gameCode: string,
    cardName: string
): Promise<string | undefined> {
    try {
        if (gameCode === "pokemon") {
            const resp = await fetch(
                `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(cardName)}"&pageSize=1`
            );
            if (resp.ok) {
                const data = await resp.json();
                return data.data?.[0]?.images?.small;
            }
        } else if (gameCode === "yugioh") {
            const resp = await fetch(
                `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`
            );
            if (resp.ok) {
                const data = await resp.json();
                return data.data?.[0]?.card_images?.[0]?.image_url_small;
            }
        } else if (gameCode === "mtg") {
            const resp = await fetch(
                `https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}&unique=cards&order=released`
            );
            if (resp.ok) {
                const data = await resp.json();
                return data.data?.[0]?.image_uris?.small;
            }
        }
    } catch {
        // Non-fatal
    }
    return undefined;
}

/** Patch a single scan with its resolved image URL. */
export const patchImage = internalMutation({
    args: { scanId: v.id("savedScans"), imageUrl: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.scanId, { imageUrl: args.imageUrl });
    },
});

/** Backfill images for savedScans missing imageUrl. Processes BATCH_SIZE per run. */
export const backfillImages = internalAction({
    args: {},
    handler: async (ctx) => {
        const scans: Array<{ _id: any; gameCode: string; cardName: string }> =
            await ctx.runQuery(internal.imageBackfill.getScansWithoutImages);

        let patched = 0;
        for (const scan of scans) {
            const imageUrl = await resolveImageUrl(scan.gameCode, scan.cardName);
            if (imageUrl) {
                await ctx.runMutation(internal.imageBackfill.patchImage, {
                    scanId: scan._id,
                    imageUrl,
                });
                patched++;
            }
        }

        console.log(`Image backfill: patched ${patched}/${scans.length} scans`);

        // If we hit the batch limit, there may be more — reschedule
        if (scans.length >= BATCH_SIZE) {
            await ctx.scheduler.runAfter(1000, internal.imageBackfill.backfillImages);
        }
    },
});

/** Query to get scans that need image backfill. */
export const getScansWithoutImages = internalMutation({
    args: {},
    handler: async (ctx) => {
        const allScans = await ctx.db.query("savedScans").collect();
        return allScans
            .filter((s) => !s.imageUrl)
            .slice(0, BATCH_SIZE)
            .map((s) => ({ _id: s._id, gameCode: s.gameCode, cardName: s.cardName }));
    },
});
