import type { RecognitionProvider, RecognitionResult } from "./types";
import { GeminiProvider } from "./gemini";
export type { RecognitionResult, RecognitionProvider, TCG } from "./types";

class RecognitionService {
  private providers: RecognitionProvider[] = [];

  register(provider: RecognitionProvider) {
    if (this.providers.some((existing) => existing.name === provider.name)) {
      return;
    }

    this.providers.push(provider);
  }

  async identify(imageBase64: string): Promise<RecognitionResult> {
    let lastError: unknown = null;
    let foundAvailableProvider = false;

    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          foundAvailableProvider = true;
          return await provider.identify(imageBase64);
        }
      } catch (error) {
        lastError = error;
        console.warn(
          `Provider ${provider.name} failed, trying next...`,
          error
        );
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    if (!foundAvailableProvider && this.providers.length > 0) {
      throw new Error("Recognition service is not configured.");
    }

    if (this.providers.length === 0) {
      throw new Error("No recognition provider is registered.");
    }

    throw new Error("No recognition provider available");
  }

  get activeProviders(): string[] {
    return [...new Set(this.providers.map((p) => p.name))];
  }
}

export const recognitionService = new RecognitionService();

recognitionService.register(new GeminiProvider());
