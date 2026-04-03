

export enum TCG {
  POKEMON = 'Pokemon',
  MAGIC_THE_GATHERING = 'Magic: The Gathering',
  YUGIOH = 'Yu-Gi-Oh!',
  ONE_PIECE = 'One Piece',
}

export enum CardLanguage {
  ENGLISH = 'English',
  JAPANESE = 'Japanese',
  GERMAN = 'German',
  FRENCH = 'French',
  SPANISH = 'Spanish',
  ITALIAN = 'Italian',
  CHINESE_SIMPLIFIED = 'Chinese (Simplified)',
  CHINESE_TRADITIONAL = 'Chinese (Traditional)',
  KOREAN = 'Korean',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  KRW = 'KRW',
  CNY = 'CNY',
}

export enum SortOption {
  DATE_ADDED = 'dateAdded',
  VALUE = 'price',
  RARITY = 'rarity',
  NAME = 'name',
  SET = 'set',
  RELEASE_DATE = 'releaseDate',
  CARD_NUMBER = 'number',
  TAGS = 'tags',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export enum GroupOption {
  NONE = 'none',
  GAME = 'game',
  SET = 'set',
  RARITY = 'rarity',
}

export interface ViewSettings {
  viewMode: 'grid' | 'list';
  gridZoom: 1 | 2 | 3 | 4 | 5;
  sortBy: SortOption;
  sortDirection: SortDirection;
  groupBy: GroupOption;
  visibleLanguages: CardLanguage[];
}

export interface SingleSourceMarketPrice {
  date: string;
  price: number;
}

export interface MarketPrice {
  date: string;
  usPrice: number;
  euPrice: number;
  gbpPrice: number;
  jpyPrice: number;
  krwPrice: number;
  cnyPrice: number;
}

export type CardFinish = 'Normal' | 'Foil' | 'Reverse Holo' | 'Etched';

export interface Card {
  id: string;
  name: string;
  set: string; // Mapped from setName for compatibility
  setName?: string; 
  rarity: string;
  number: string;
  imageUrl: string;
  price: number; // Mapped from usMarketValue for compatibility
  usMarketValue?: number;
  usDayChange?: number;
  marketTrend: 'up' | 'down' | 'stable';
  dateAdded: string;
  condition?: 'NM' | 'LP' | 'MP' | 'HP';
  isNew?: boolean;
  finish?: CardFinish;
  
  // Extended fields
  game?: TCG;
  quantity?: number;
  note?: string;
  customGroups?: string[];
  tags?: string[];
  language?: CardLanguage;
  releaseDate?: string;
  priceHistory?: MarketPrice[];
  marketData?: any;
  dailyVolume?: number;
  priceSpread?: { value: number; percentage: number };
  
  // Multi-currency support
  euMarketValue?: number;
  euDayChange?: number;
  gbpMarketValue?: number;
  gbpDayChange?: number;
  jpyMarketValue?: number;
  jpyDayChange?: number;
  krwMarketValue?: number;
  krwDayChange?: number;
  cnyMarketValue?: number;
  cnyDayChange?: number;
}

export interface MarketData {
  date: string;
  value: number;
}

export enum AppView {
  SCANNER = 'SCANNER',
  BINDER = 'BINDER',
  MARKET = 'MARKET',
  TRADE = 'TRADE',
  FLEA = 'FLEA',
  PROFILE = 'PROFILE',
  SOCIAL = 'SOCIAL',
}

export type MarketSource = 'TCGplayer' | 'Cardmarket' | 'eBay';

export interface TrustStats {
  score: number; // 0-100
  tradesCompleted: number;
  disputeFreeRate: number; // percentage
  avgReplyTime: string; // e.g. "2h"
  badges: string[]; // 'Verified Scans', 'Graded Proof', 'Escrow-Ready', 'On-time Shipper', 'Guild Officer'
}

export interface TradingPreferences {
  openToTrades: boolean;
  shipFromCountry: string;
  typicalShipTime: string; // e.g. "1-2 Days"
  packagingStandard: string; // e.g. "Toploader + Bubble"
  acceptedConditions: string[]; // ['NM', 'LP']
  acceptedLanguages: string[];
  priceBands?: { min: number; max: number };
  paymentMethods: string[]; // ['PayPal', 'Escrow', 'Cash']
  preferredTCGs: string[];
}

export interface PrivacySettings {
  portfolioVisibility: 'Me' | 'Links' | 'Everyone';
  showDuplicates: boolean;
  showRecentAcquisitions: boolean;
  allowDMs: 'Links' | 'Guilds' | 'Everyone';
  publicProfile: boolean;
}

export interface NotificationSettings {
  inApp: boolean;
  email: boolean;
  push: boolean;
  dailyDigestTime: string;
  volumeCap: number;
  scoreThreshold: number;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  discord?: string;
  website?: string;
  email?: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  level: number;
  xp: number;
  achievements: Achievement[];
  isPro?: boolean;
  subscriptionPlan?: 'monthly' | 'yearly' | null;
  primaryMarket: MarketSource;
  
  // Extended Identity Fields
  title?: string; // e.g. "Single Star Hunter"
  region?: string;
  timezone?: string;
  bio?: string;
  socials?: SocialLinks;
  trust?: TrustStats;
  trading?: TradingPreferences;
  privacy?: PrivacySettings;
  notifications?: NotificationSettings;
  
  // News Preferences
  mutedNewsChannels?: string[];
}

export interface Friend {
    id: string;
    name: string;
    avatar: string; // ID of avatar
    level: number;
    status: 'online' | 'offline' | 'away' | 'busy';
    collectionValue: number;
    cardCount: number;
    topCard: Card;
    lastActive: string;
    relationship?: 'Guildmate' | 'Rival' | 'Mentor' | 'None';
    
    // Network Deal Radar props
    tradePotential?: number; // Estimated Value unlockable
    reliability?: number; // 0-100 score
    overlap?: {
        youHaveTheyWant: number;
        theyHaveYouWant: number;
    };
    region?: string;
    alphaYield?: number; // For Mentors: success rate of signals
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
  description?: string;
}

export interface TradeSide {
  cards: Card[];
  cash: number;
}

export enum ScanMode {
  ADD_TO_BINDER = 'ADD_TO_BINDER',
  PRICE_CHECK = 'PRICE_CHECK',
  FLEA_MARKET = 'FLEA_MARKET',
}

export interface FleaSession {
  id: string;
  name: string;
  date: string;
  location?: string;
  note?: string;
  cards: Card[];
  totalValue: number;
  status: 'active' | 'completed' | 'archived';
  coordinates?: { lat: number, lng: number };
}

export interface MarketMover extends Card {
  change24h: number;
  change7d: number;
  change30d: number;
  reason?: string; // AI Reason for movement
}

export interface HeatmapCard extends Card {
    performance: number; // -1 to 1
}

export interface NewsChannel {
    id: string;
    name: string;
    category: 'Pokemon' | 'Magic' | 'Yu-Gi-Oh!' | 'One Piece' | 'Finance' | 'General';
    icon?: string;
}

export interface MarketNews {
    id: string;
    title: string;
    snippet: string;
    source: string;
    channelId: string; // Link to NewsChannel
    date: string;
    imageUrl: string;
}

export interface MarketAnalysis {
  totalCap: number;
  volume24h: number;
  btcDominance: number; // Joke, maybe "Pika Dominance"
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  topSector: string;
}

export interface ArbitrageOpportunity {
  id: string;
  cardName: string;
  setName: string;
  imageUrl: string;
  buySource: 'eBay' | 'Mercari' | 'Local';
  buyPrice: number;
  sellSource: 'TCGplayer' | 'Cardmarket';
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  confidence: number; // AI Confidence score
  foundAt: string;
}

export interface BinderGroupDef {
  id: string;
  label: string;
  icon: string;
}

export interface BinderViewProps {
  cards: Card[];
  currency?: Currency;
  setCurrency?: (c: Currency) => void;
  onCardClick?: (card: Card) => void;
  onUpdateCards?: (cards: Card[]) => void;
  onSelectionModeChange?: (isSelectionMode: boolean) => void;
  isPureView?: boolean;
  onPureViewToggle?: () => void;
  onStartScanning?: () => void;
}

// --- Hunter Net Types ---

export type FeedItemType = 'alert' | 'finding' | 'system' | 'warning' | 'news';
export type BrokerType = 'trade_match' | 'rivalry_alert' | 'market_alpha' | 'hype_alert' | 'session_summary' | 'guild_intel' | 'market_alert' | 'sector_intel';

export interface FeedItem {
  id: string;
  createdAt: string;
  type: FeedItemType | 'broker';
  brokerType?: BrokerType;
  score: number; // For sorting by usefulness

  // Classic fields
  title?: string;
  body?: string;
  author?: string;
  avatar?: string;
  image?: string;
  color?: string; // Tailwind color class
  
  // Broker / Actionable fields
  message?: string;
  explanation?: string; // "Why this"
  priority?: 'low' | 'medium' | 'high';
  confidence?: number;
  source?: 'Official' | 'Retailer' | 'Community';
  channelId?: string; // For filtering news sources
  cta?: { label: string; action: string; payload?: any }[];
  relatedCards?: { you: Partial<Card>[], them: Partial<Card>[] }; // For trade matches
  
  // Market alert fields
  timeframe?: string;
  changePercent?: number;
  sparklineData?: number[];
  ev?: number;
  initialInteractions?: { comments: number; repeats: number; likes: number; };
}

export interface Bounty {
  id: string;
  cardName: string;
  setName: string;
  imageUrl: string;
  targetPrice: number;
  bountyFee: number; // Percentage
  deadline: string;
  issuer: string;
  status: 'Open' | 'Filling' | 'Filled';
  fillPercentage?: number;
}

export interface PooledBuy {
  id: string;
  title: string;
  productImage: string;
  unitPrice: number;
  totalSlots: number;
  filledSlots: number;
  savings: number; // Percentage savings vs retail
  escrowSecured: boolean;
  deadline: string;
}

export interface GuildSession {
  id: string;
  title: string;
  date: string;
  type: 'Raid' | 'Trade' | 'General';
  attendees: number;
}

export interface Guild {
  id: string;
  name: string;
  emblem: string;
  motto: string;
  focusTags: string[];
  memberCount: number;
  totalValue: number;
  topGame: string;
  trustScore: number; // 0-100
  
  // Dynamic Data
  bounties: Bounty[];
  pooledBuys: PooledBuy[];
  nextSession?: GuildSession;
  
  // User Context
  isMember: boolean;
  evUnlockable?: number; // Value user can unlock by trading/selling to this guild
  overlapCount?: number;
  notifications?: string[]; // Specific alerts for "For You" strip
}

export interface RivalryEvent {
  id: string;
  text: string;
  date: string;
  type: 'scan' | 'trade' | 'sale' | 'value_jump';
  delta?: number;
}

export interface HotWindow {
    id: string;
    title: string;
    type: 'Preorder' | 'Restock' | 'Banlist';
    countdown: string;
}

export interface NextAction {
    id: string;
    title: string;
    description: string;
    cta: string;
    icon: keyof any;
}

export interface TradeBundle {
    id: string;
    name: string;
    ev: number;
    yourCards: Partial<Card>[];
    theirCards: Partial<Card>[];
    matchScore: number;
}

export interface NetworkFilter {
    search: string;
    region: string;
    tcg: string;
    onlyDuplicates: boolean;
}

// --- RIVALRY TYPES ---

export interface GapDriver {
    id: string;
    card: Partial<Card>;
    actionType: 'Acquisition' | 'Sale' | 'Market Move';
    impactDelta: number;
    date: string;
    actor: 'Rival' | 'You' | 'Market';
    suggestedAction: {
        label: string;
        type: 'watchlist' | 'list' | 'swap';
    };
}

export interface RivalryCatalyst {
    id: string;
    title: string;
    date: string;
    type: 'Banlist' | 'Release' | 'Tournament';
    affectedSets: string[];
    impactLevel: 'High' | 'Medium' | 'Low';
}

export interface RivalryState {
    rival: Friend;
    yourValue: number;
    rivalValue: number;
    valueDelta: number;
    trendPercent: number; // Your performance relative to them
    gapDrivers: GapDriver[];
    opportunities: TradeBundle[];
    catalysts: RivalryCatalyst[];
}
