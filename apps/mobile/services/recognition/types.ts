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
  variant?: string;
  finish?: string;
  cardId?: string;
  pricePending?: boolean;
  hp?: number;
  attacks?: { name: string; damage: string; energyCost: string }[];
  power?: number;
  cost?: number;
  attribute?: string;
  lore?: string;
  artist?: string;
  notableDetail?: string;
}

export interface RecognitionProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  identify(imageBase64: string): Promise<RecognitionResult>;
}
