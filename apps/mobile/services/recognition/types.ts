export type TCG =
  | "pokemon"
  | "yugioh"
  | "onepiece"
  | "mtg"
  | "dragonball"
  | "unknown";

export interface RecognitionResult {
  name: string;
  set: string;
  rarity: string;
  number: string;
  estimatedPriceUsd: number;
  game: TCG;
  confidence: number;
  providerUsed: string;
  imageUrl?: string;
}

export interface RecognitionProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  identify(imageBase64: string): Promise<RecognitionResult>;
}
