import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getLatestModel = query({
    args: { modelType: v.string() },
    handler: async (ctx, args) => {
        const model = await ctx.db
            .query("models")
            .withIndex("by_type_and_version", (q) => q.eq("modelType", args.modelType))
            .filter((q) => q.eq(q.field("active"), true))
            .order("desc")
            .first();

        if (!model) return null;

        const fileUrl = await ctx.storage.getUrl(model.fileId);

        return {
            ...model,
            downloadUrl: fileUrl,
        };
    },
});

export const getActiveGames = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("games")
            .filter((q) => q.eq(q.field("active"), true))
            .collect();
    },
});

export const logModelUpdate = mutation({
    args: {
        deviceId: v.string(),
        modelType: v.string(),
        oldVersion: v.string(),
        newVersion: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("updateLogs", {
            deviceId: args.deviceId,
            modelType: args.modelType,
            oldVersion: args.oldVersion,
            newVersion: args.newVersion,
        });
        return true;
    },
});
