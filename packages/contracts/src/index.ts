// ── TCG & Card Types ────────────────────────────────────────────────

export type TCG = 'pokemon' | 'yugioh' | 'onepiece' | 'mtg' | 'dragonball' | 'unknown';

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP';

export type CardFinish = 'Normal' | 'Foil' | 'Reverse Holo' | 'Etched';

export type SortOption = 'dateAdded' | 'price' | 'rarity' | 'name' | 'set';

export type SortDirection = 'asc' | 'desc';

export interface Card {
  id: string;
  name: string;
  set: string;
  rarity: string;
  number: string;
  imageUrl: string;
  price: number;
  marketTrend: 'up' | 'down' | 'stable';
  dateAdded: string;
  condition?: CardCondition;
  finish?: CardFinish;
  game?: TCG;
  quantity?: number;
  note?: string;
  tags?: string[];
}

// ── Recognition ─────────────────────────────────────────────────────

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

// ── User & Subscription ─────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro';

export interface UserProfile {
  name: string;
  avatar: string;
  tier: SubscriptionTier;
  scansToday: number;
  collectionCount: number;
  collectionValue: number;
}

// ── Scan Mode ───────────────────────────────────────────────────────

export type ScanMode = 'ADD_TO_BINDER' | 'PRICE_CHECK';

// ── Web Shell Types (used by apps/web) ──────────────────────────────

export type RuntimeEnvironment = 'development' | 'staging' | 'production';
export type SessionState = 'anonymous' | 'authenticated';

export interface HealthResponse {
  status: 'ok';
  service: string;
  environment: RuntimeEnvironment;
  stack: {
    web: string;
    mobile: string;
    backend: string;
    auth: string;
    dataLayer: string;
    hosting: string;
    ai?: string;
  };
  routes: {
    health: string;
    session: string;
  };
}

export interface SessionResponse {
  auth: {
    provider: string;
    configured: boolean;
  };
  session: {
    state: SessionState;
    userId?: string;
    displayName?: string;
  };
}
