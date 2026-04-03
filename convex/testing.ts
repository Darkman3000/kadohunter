import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const seedCard = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.insert("savedScans", {
            userId: args.userId,
            gameCode: "pokemon",
            cardId: "base1-4",
            cardName: "Charizard",
            setName: "Base Set",
            rarity: "Rare Holo",
            number: "4/102",
            imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
            createdAt: Date.now(),
        });
    },
});
