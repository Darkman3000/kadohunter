import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveImageUrl } from "./utils/imageResolver";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

const http = httpRouter();

function hexToBytes(hex: string) {
  const clean = hex.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(clean) || clean.length % 2 !== 0) return null;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

function timingSafeEqualHex(aHex: string, bHex: string) {
  const a = hexToBytes(aHex);
  const b = hexToBytes(bHex);
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function signHmacSha256Hex(secret: string, payload: string) {
  const keyData = new TextEncoder().encode(secret);
  const message = new TextEncoder().encode(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, message);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

http.route({
  path: "/api/recognize",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: imageBase64,
                    },
                  },
                  {
                    text: `Identify this trading card. Pay careful attention to the exact printing/variant — cards with the same number can have vastly different values depending on whether they are Standard, Alternate Art, Parallel, Full Art, Manga Art, Secret Rare, etc.

Return a JSON object with these fields:
- name (string): The card's name
- set (string): The set or expansion name
- rarity (string): The rarity level (e.g. "Common", "Rare", "Secret Rare", "Super Rare")
- number (string): The card number (e.g. "OP01-016", "102/165")
- variant (string): The exact printing variant. One of: "Standard", "Alternate Art", "Parallel", "Full Art", "Manga Art", "Secret Rare", "Promo", "Special Art Rare". Use "Standard" if it is the regular/normal printing.
- finish (string): The card's finish. One of: "Normal", "Foil", "Holo", "Reverse Holo", "Textured". Use "Normal" for non-foil cards.
- game (string): One of "pokemon", "yugioh", "onepiece", "mtg", "dragonball"
- confidence (number): Your confidence from 0.0 to 1.0

Additional Intel Fields:
- hp (number or null): Pokémon HP if applicable
- attacks (array of objects): Pokémon or Dragon Ball attacks. Each object must have "name" (string), "damage" (string), and "energyCost" (string).
- power (number or null): One Piece power if applicable
- cost (number or null): One Piece cost if applicable
- attribute (string or null): One Piece attribute (STR/DEX/INT/etc) if applicable
- lore (string): Write ONE punchy sentence a collector would find interesting — not a generic flavor text/Pokédex entry. Focus on market significance, art uniqueness, or competitive relevance.
- artist (string or null): Card artist name
- notableDetail (string or null): "Tournament promo only" / "Alt art by HYOGONOSUKE" etc.

Do NOT estimate the price. Focus only on accurate identification and the intel details.`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  set: { type: "STRING" },
                  rarity: { type: "STRING" },
                  number: { type: "STRING" },
                  variant: { type: "STRING" },
                  finish: { type: "STRING" },
                  game: { type: "STRING" },
                  confidence: { type: "NUMBER" },
                  hp: { type: "NUMBER", nullable: true },
                  attacks: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        name: { type: "STRING" },
                        damage: { type: "STRING" },
                        energyCost: { type: "STRING" },
                      },
                    },
                    nullable: true,
                  },
                  power: { type: "NUMBER", nullable: true },
                  cost: { type: "NUMBER", nullable: true },
                  attribute: { type: "STRING", nullable: true },
                  lore: { type: "STRING" },
                  artist: { type: "STRING", nullable: true },
                  notableDetail: { type: "STRING", nullable: true },
                },
              },
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        console.error("Gemini API error:", errText);
        return new Response(
          JSON.stringify({ error: "Recognition service unavailable" }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      const geminiData = await geminiResponse.json();
      const text =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      let parsed: any;
      try {
        parsed = JSON.parse(text.trim());
      } catch {
        return new Response(
          JSON.stringify({ error: "Failed to parse recognition result" }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      const cardName = parsed.name ?? "Unknown Card";
      const cardGame = parsed.game ?? "unknown";
      const variant = parsed.variant ?? "Standard";
      const finish = parsed.finish ?? "Normal";

      // Fire image resolution in background — don't block the response
      const imageUrlPromise = resolveImageUrl(cardGame, cardName).catch(() => undefined);

      // Build a deterministic cardId that includes variant for pricing lookups
      const cardIdParts = [cardGame, cardName, parsed.set, parsed.number]
        .filter(Boolean)
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const cardId = cardIdParts || `scan-${Date.now().toString(36)}`;

      // Schedule real price sync via Convex action (non-blocking)
      // The client will subscribe to the prices table and get the real price reactively
      void ctx.runAction(internal.prices.syncPriceInternal, {
        cardId,
        gameCode: cardGame,
        cardName,
        setName: parsed.set,
        number: parsed.number,
        variant,
        finish,
      }).catch((err: unknown) => {
        console.error("Background price sync failed:", err);
      });

      // Wait for image URL (with a short timeout so we don't block too long)
      let imageUrl = await Promise.race([
        imageUrlPromise,
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 2000)),
      ]);

      if (!imageUrl && imageBase64) {
        try {
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, ""); 
          const binary = atob(base64Data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
          }
          const storageId = await ctx.storage.store(new Blob([bytes], { type: "image/jpeg" }));
          const fallbackUrl = await ctx.storage.getUrl(storageId);
          if (fallbackUrl) imageUrl = fallbackUrl;
        } catch (e) {
          console.error("Failed to store fallback image", e);
        }
      }

      const result = {
        name: cardName,
        set: parsed.set ?? "Unknown Set",
        rarity: parsed.rarity ?? "Common",
        number: parsed.number ?? "---",
        variant,
        finish,
        estimatedPriceUsd: 0, // Real price arrives via Convex reactivity
        game: cardGame,
        confidence: parsed.confidence ?? 0.5,
        providerUsed: "gemini",
        imageUrl,
        cardId, // Return the cardId so the client can subscribe to prices
        pricePending: true, // Signal to the client that real price is being fetched
        hp: parsed.hp ?? undefined,
        attacks: parsed.attacks ?? undefined,
        power: parsed.power ?? undefined,
        cost: parsed.cost ?? undefined,
        attribute: parsed.attribute ?? undefined,
        lore: parsed.lore ?? undefined,
        artist: parsed.artist ?? undefined,
        notableDetail: parsed.notableDetail ?? undefined,
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    } catch (error: any) {
      console.error("Recognition error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to identify card" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

http.route({
  path: "/api/detect",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: imageBase64,
                    },
                  },
                  {
                    text: `You are a precise trading card detector. Find EVERY single trading card - do NOT miss any. If there are 6 cards visible, return 6 boxes. Return JSON array where each item has box_2d: [ymin, xmin, ymax, xmax] normalized 0-1000. Bound each individual card tightly.`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    box_2d: {
                      type: "ARRAY",
                      items: { type: "INTEGER" }
                    }
                  }
                }
              },
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Edge detection failed" }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      const geminiData = await geminiResponse.json();
      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
      let boxes = [];
      try {
        boxes = JSON.parse(text.trim());
      } catch {}

      return new Response(JSON.stringify({ boxes }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: "Failed to detect cards" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

http.route({
  path: "/api/billing/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.BILLING_WEBHOOK_SECRET;
    if (!secret) {
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const signature = request.headers.get("x-kado-signature") ?? "";
    const timestamp = request.headers.get("x-kado-timestamp") ?? "";
    const rawBody = await request.text();

    if (!signature || !timestamp) {
      return new Response(JSON.stringify({ error: "Missing signature headers" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Timestamp outside allowed window" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expected = await signHmacSha256Hex(secret, `${timestamp}.${rawBody}`);
    if (!timingSafeEqualHex(signature, expected)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let payload: {
      tokenIdentifier: string;
      tier: "free" | "pro";
      billingCycle?: "monthly" | "annual";
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!payload?.tokenIdentifier || !payload?.tier) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runMutation(internal.users.setSubscriptionTierByToken, {
      tokenIdentifier: payload.tokenIdentifier,
      tier: payload.tier,
      billingCycle: payload.billingCycle,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/recognize",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }),
});

http.route({
  path: "/api/detect",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }),
});

export default http;