import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { resolveImageUrl } from "./utils/imageResolver";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

const http = httpRouter();

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
                    text: `Identify this trading card. Return a JSON object with these fields:
- name (string): The card's name
- set (string): The set or expansion name
- rarity (string): The rarity level
- number (string): The card number (e.g. "102/165")
- estimatedPriceUsd (number): Estimated market price in USD
- game (string): One of "pokemon", "yugioh", "onepiece", "mtg", "dragonball"
- confidence (number): Your confidence from 0.0 to 1.0

If you cannot identify the card clearly, still make your best guess and set confidence low.`,
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
                  estimatedPriceUsd: { type: "NUMBER" },
                  game: { type: "STRING" },
                  confidence: { type: "NUMBER" },
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

      // Resolve card image from external APIs (shared utility)
      const imageUrl = await resolveImageUrl(cardGame, cardName);

      const result = {
        name: cardName,
        set: parsed.set ?? "Unknown Set",
        rarity: parsed.rarity ?? "Common",
        number: parsed.number ?? "---",
        estimatedPriceUsd: parsed.estimatedPriceUsd ?? 0,
        game: cardGame,
        confidence: parsed.confidence ?? 0.5,
        providerUsed: "gemini",
        imageUrl,
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
  path: "/api/recognize",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }),
});

export default http;