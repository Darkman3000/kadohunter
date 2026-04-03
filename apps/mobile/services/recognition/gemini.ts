import type { RecognitionProvider, RecognitionResult } from "./types";

function toConvexHttpBaseUrl(rawUrl: string) {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname.endsWith(".convex.cloud")) {
      parsed.hostname = parsed.hostname.replace(/\.convex\.cloud$/, ".convex.site");
    }

    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";

    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return trimmed.replace(/\.convex\.cloud$/, ".convex.site");
  }
}

export class GeminiProvider implements RecognitionProvider {
  readonly name = "gemini";
  private readonly convexUrl: string;

  constructor(convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "") {
    this.convexUrl = toConvexHttpBaseUrl(convexUrl);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.convexUrl;
  }

  async identify(imageBase64: string): Promise<RecognitionResult> {
    if (!this.convexUrl) {
      throw new Error("Recognition service is not configured.");
    }

    const response = await fetch(`${this.convexUrl}/api/recognize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Recognition failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
      name: data.name ?? "Unknown Card",
      set: data.set ?? "Unknown Set",
      rarity: data.rarity ?? "Common",
      number: data.number ?? "---",
      estimatedPriceUsd: data.estimatedPriceUsd ?? 0,
      game: data.game ?? "unknown",
      confidence: data.confidence ?? 0.5,
      providerUsed: this.name,
      imageUrl: data.imageUrl,
    };
  }
}
