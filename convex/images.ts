import { mutation, action } from "./_generated/server";
import { v } from "convex/values";

export const fetchUrlAsBase64 = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    // 1. Auth gate — require signed-in user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // 2. URL validation — allowlist of image extensions/hosts
    let parsed: URL;
    try {
      parsed = new URL(args.url);
    } catch {
      throw new Error("Invalid URL provided");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only HTTP/HTTPS URLs are supported");
    }

    // 3. Fetch with size cap (10MB) and timeout (8s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try {
      response = await fetch(args.url, {
        signal: controller.signal,
        headers: { "User-Agent": "KadoHunter/1.0" },
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Request to URL timed out");
      }
      throw new Error("Failed to fetch from URL. Make sure it is a valid image link.");
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch image: HTTP ${response.status}`);
    }

    // 4. MIME validation — reject non-image responses
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error(
        "URL does not point to an image. Paste a direct image link (.jpg, .png, .webp)."
      );
    }

    // 5. Size guard
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024) {
      throw new Error("Image too large (max 10MB)");
    }

    // 6. Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    // Use standard btoa implementation for node/edge compat
    if (typeof btoa === "function") {
      return btoa(binary);
    } else {
      return Buffer.from(binary, 'binary').toString('base64');
    }
  },
});

/**
 * Returns a short-lived upload URL for storing card images in Convex Storage.
 * The client uploads directly; we never pipe image bytes through our mutations.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * After a successful upload via generateUploadUrl, call this to get
 * the permanent public URL for the stored image.
 */
export const getStorageUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");
    return await ctx.storage.getUrl(args.storageId as any);
  },
});
