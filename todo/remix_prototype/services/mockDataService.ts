

import { Card, MarketPrice, TCG, CardLanguage, SingleSourceMarketPrice, MarketMover, HeatmapCard, MarketNews, NewsChannel, Currency, ArbitrageOpportunity, Friend, FeedItem, Guild, RivalryEvent, HotWindow, NextAction, TradeBundle, Bounty, PooledBuy, RivalryState, GapDriver, RivalryCatalyst } from '../types';

export const EXCHANGE_RATES = {
  [Currency.USD]: 1,
  [Currency.EUR]: 0.92,
  [Currency.GBP]: 0.79,
  [Currency.JPY]: 157.0,
  [Currency.KRW]: 1380.0,
  [Currency.CNY]: 7.25,
};

export const convertPrice = (priceInUsd: number, targetCurrency: Currency): number => {
  return priceInUsd * EXCHANGE_RATES[targetCurrency];
};

export const formatCurrency = (value: number, currency: Currency): string => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
};

const USD_TO_EUR = EXCHANGE_RATES[Currency.EUR];
const USD_TO_GBP = EXCHANGE_RATES[Currency.GBP];
const USD_TO_JPY = EXCHANGE_RATES[Currency.JPY];
const USD_TO_KRW = EXCHANGE_RATES[Currency.KRW];
const USD_TO_CNY = EXCHANGE_RATES[Currency.CNY];

export const generatePriceHistory = (basePrice: number): MarketPrice[] => {
  const history: MarketPrice[] = [];
  let us = basePrice * (1 + (Math.random() - 0.5) * 0.2);

  for (let i = 90; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    us += (Math.random() - 0.5) * (basePrice / 20);
    us = Math.max(us, basePrice / 2);

    history.push({
      date: date.toISOString().split('T')[0],
      usPrice: parseFloat(us.toFixed(2)),
      euPrice: parseFloat((us * USD_TO_EUR * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
      gbpPrice: parseFloat((us * USD_TO_GBP * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
      jpyPrice: parseFloat((us * USD_TO_JPY * (1 + (Math.random() - 0.5) * 0.03)).toFixed(0)),
      krwPrice: parseFloat((us * USD_TO_KRW * (1 + (Math.random() - 0.5) * 0.03)).toFixed(0)),
      cnyPrice: parseFloat((us * USD_TO_CNY * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
    });
  }
  return history;
};

const generateSingleSourcePriceHistory = (basePrice: number, volatility: number = 0.05, days: number = 90): SingleSourceMarketPrice[] => {
  const history: SingleSourceMarketPrice[] = [];
  let price = basePrice * (1 + (Math.random() - 0.5) * 0.1);

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    price += (Math.random() - 0.5) * (price * volatility);
    price = Math.max(price, basePrice * 0.2);
    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
    });
  }
  return history;
}

// New Analytics Helper
export const generatePortfolioHistory = (cards: Card[], days: number = 90) => {
    const history: { date: string; value: number; cost: number }[] = [];
    
    // Simulate cost basis (usually this would be stored on the card)
    // We'll estimate cost is roughly 80% of current value but varies per card
    const cardCosts = cards.map(c => ({
        id: c.id,
        cost: c.price * (0.7 + Math.random() * 0.4) // Random cost between 70% and 110% of current
    }));

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Calculate total portfolio value for this day
        // We use the card's price history if available, or simulate slight variance from current price
        let dailyValue = 0;
        let dailyCost = 0;

        cards.forEach((card, idx) => {
            const qty = card.quantity || 1;
            const cost = cardCosts[idx].cost;
            
            // If we have history, use it
            let historicPrice = card.price;
            if (card.priceHistory && card.priceHistory.length > 0) {
                // Find closest date
                const entry = card.priceHistory.find(h => h.date === dateStr);
                if (entry) historicPrice = entry.usPrice;
                else {
                    // Fallback interpolation or use last known
                     historicPrice = card.price * (1 - (i * 0.002)); // Simulate slight trend up
                }
            } else {
                 historicPrice = card.price * (1 - (i * 0.002));
            }

            dailyValue += historicPrice * qty;
            dailyCost += cost * qty; // Cost is static
        });

        history.push({
            date: dateStr,
            value: dailyValue,
            cost: dailyCost
        });
    }

    return history;
};

type BaseCard = Omit<Card, 
  | 'priceHistory' | 'usMarketValue' | 'usDayChange' | 'euMarketValue' | 'euDayChange' 
  | 'gbpMarketValue' | 'gbpDayChange' | 'jpyMarketValue' | 'jpyDayChange' 
  | 'krwMarketValue' | 'krwDayChange' | 'cnyMarketValue' | 'cnyDayChange'
  | 'price' | 'marketTrend' | 'dateAdded' | 'set' | 'number'
> & { basePrice: number, setName: string, number?: string };

const baseMockCards: BaseCard[] = [
  {
    id: 'sv3pt5-6',
    game: TCG.POKEMON,
    name: 'Charizard ex',
    setName: 'Scarlet & Violet—151',
    rarity: 'Double Rare',
    imageUrl: 'https://images.pokemontcg.io/sv3pt5/6_hires.png',
    basePrice: 24.55,
    quantity: 1,
    note: 'Pulled from the very first pack of this set I ever opened!',
    customGroups: ['favorites'],
    tags: ['Personal', 'Pack Fresh'],
    language: CardLanguage.ENGLISH,
    releaseDate: '2023-09-22',
    number: '006/165'
  },
  {
    id: 'swsh9-123',
    game: TCG.POKEMON,
    name: 'Arceus VSTAR',
    setName: 'Sword & Shield—Brilliant Stars',
    rarity: 'VSTAR',
    imageUrl: 'https://images.pokemontcg.io/swsh9/123_hires.png',
    basePrice: 15.80,
    quantity: 1,
    customGroups: [],
    tags: ['For Trade'],
    language: CardLanguage.ENGLISH,
    releaseDate: '2022-02-25',
    number: '123/172'
  },
  {
    id: 'swsh11-131',
    game: TCG.POKEMON,
    name: 'Giratina VSTAR',
    setName: 'Sword & Shield—Lost Origin',
    rarity: 'VSTAR',
    imageUrl: 'https://images.pokemontcg.io/swsh11/131_hires.png',
    basePrice: 42.10,
    quantity: 2,
    customGroups: [],
    tags: ['Deck A', 'Meta'],
    language: CardLanguage.ENGLISH,
    releaseDate: '2022-09-09',
    number: '131/196'
  },
    {
    id: 'all-143',
    game: TCG.MAGIC_THE_GATHERING,
    name: 'Force of Will',
    setName: 'Alliances',
    rarity: 'Uncommon',
    imageUrl: 'https://www.mtgpics.com/pics/big/all/054.jpg',
    basePrice: 75.20,
    quantity: 4,
    customGroups: [],
    tags: ['Vintage', 'Played'],
    language: CardLanguage.ENGLISH,
    releaseDate: '1996-06-10',
    number: 'N/A'
  },
  {
    id: 'lea-5',
    game: TCG.MAGIC_THE_GATHERING,
    name: 'Black Lotus',
    setName: 'Limited Edition Alpha',
    rarity: 'Rare',
    imageUrl: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg?1614638838',
    basePrice: 25000.00,
    quantity: 1,
    note: 'Traded a binder full of cards for this at a local shop in 2005. Best trade ever.',
    customGroups: ['favorites'],
    tags: ['Grail', 'Vault'],
    language: CardLanguage.ENGLISH,
    releaseDate: '1993-08-05',
    number: 'N/A'
  },
  {
    id: 'stx-83',
    game: TCG.MAGIC_THE_GATHERING,
    name: 'Expressive Iteration',
    setName: 'Strixhaven: School of Mages',
    rarity: 'Uncommon',
    imageUrl: 'https://cards.scryfall.io/large/front/3/1/31b770cc-09e7-4c0b-b2a4-462ab4f7200d.jpg?1678110681',
    basePrice: 3.50,
    quantity: 3,
    customGroups: [],
    language: CardLanguage.ENGLISH,
    releaseDate: '2021-04-23',
    number: '83'
  },
  {
    id: 'lob-001',
    game: TCG.YUGIOH,
    name: 'Blue-Eyes White Dragon',
    setName: 'Legend of Blue Eyes White Dragon',
    rarity: 'Ultra Rare',
    imageUrl: 'https://images.ygoprodeck.com/images/cards_small/89631139.jpg',
    basePrice: 35.00,
    quantity: 1,
    customGroups: [],
    language: CardLanguage.ENGLISH,
    releaseDate: '2002-03-08',
    number: 'LOB-001'
  },
  {
    id: 'mfc-000',
    game: TCG.YUGIOH,
    name: 'Dark Magician Girl',
    setName: "Magician's Force",
    rarity: 'Secret Rare',
    imageUrl: 'https://images.ygoprodeck.com/images/cards/38033121.jpg',
    basePrice: 120.00,
    quantity: 1,
    customGroups: ['favorites'],
    language: CardLanguage.ENGLISH,
    releaseDate: '2003-10-10',
    number: 'MFC-000'
  },
  {
    id: 'lob-005',
    game: TCG.YUGIOH,
    name: 'Dark Magician',
    setName: 'Legend of Blue Eyes White Dragon',
    rarity: 'Ultra Rare',
    imageUrl: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
    basePrice: 25.00,
    quantity: 1,
    customGroups: [],
    language: CardLanguage.ENGLISH,
    releaseDate: '2002-03-08',
    number: 'LOB-005'
  },
  {
    id: 'lob-007',
    game: TCG.YUGIOH,
    name: 'Celtic Guardian',
    setName: 'Legend of Blue Eyes White Dragon',
    rarity: 'Super Rare',
    imageUrl: 'https://images.ygoprodeck.com/images/cards_small/91152256.jpg',
    basePrice: 5.00,
    quantity: 1,
    customGroups: [],
    language: CardLanguage.ENGLISH,
    releaseDate: '2002-03-08',
    number: 'LOB-007'
  },
  {
    id: 'lob-070',
    game: TCG.YUGIOH,
    name: 'Red-Eyes Black Dragon',
    setName: 'Legend of Blue Eyes White Dragon',
    rarity: 'Ultra Rare',
    imageUrl: 'https://images.ygoprodeck.com/images/cards/74677422.jpg',
    basePrice: 30.00,
    quantity: 1,
    customGroups: [],
    language: CardLanguage.ENGLISH,
    releaseDate: '2002-03-08',
    number: 'LOB-070'
  },
  {
    id: 'lob-118',
    game: TCG.YUGIOH,
    name: 'Monster Reborn',
    setName: 'Legend of Blue Eyes White Dragon',
    rarity: 'Ultra Rare',
    imageUrl: 'https://images.ygoprodeck.com/images/cards/83764718.jpg',
    basePrice: 15.00,
    quantity: 1,
    customGroups: [],
    language: CardLanguage.ENGLISH,
    releaseDate: '2002-03-08',
    number: 'LOB-118'
  },
  {
    id: 'bach-en001',
    game: TCG.YUGIOH,
    name: 'Magikuriboh',
    setName: 'Battle of Chaos',
    rarity: 'Super Rare',
    imageUrl: 'https://images.ygoprodeck.com/images/cards/31699677.jpg',
    basePrice: 1.00,
    quantity: 1,
    customGroups: [],
    language: CardLanguage.ENGLISH,
    releaseDate: '2022-02-10',
    number: 'BACH-EN001'
  },
  {
    id: 'OP01-025',
    game: TCG.ONE_PIECE,
    name: 'Roronoa Zoro',
    setName: 'Romance Dawn',
    rarity: 'Super Rare',
    imageUrl: 'https://www.optcgapi.com/media/static/Card_Images/OP01-025.jpg',
    basePrice: 21.40,
    quantity: 1,
    customGroups: [],
    language: CardLanguage.ENGLISH,
    releaseDate: '2022-12-02',
    number: 'OP01-025'
  },
  {
    id: 'OP05-119',
    game: TCG.ONE_PIECE,
    name: 'Monkey D. Luffy',
    setName: 'Awakening of the New Era',
    rarity: 'Secret Rare',
    imageUrl: 'https://www.optcgapi.com/media/static/Card_Images/OP05-119.jpg',
    basePrice: 48.75,
    quantity: 1,
    customGroups: ['favorites'],
    tags: ['Chase Card'],
    language: CardLanguage.ENGLISH,
    releaseDate: '2023-12-08',
    number: 'OP05-119'
  },
  {
    id: 'OP01-120',
    game: TCG.ONE_PIECE,
    name: 'Shanks',
    setName: 'Romance Dawn',
    rarity: 'Secret Rare',
    imageUrl: 'https://www.optcgapi.com/media/static/Card_Images/OP01-120.jpg',
    basePrice: 32.50,
    quantity: 1,
    customGroups: [],
    language: CardLanguage.ENGLISH,
    releaseDate: '2022-12-02',
    number: 'OP01-120'
  },
];

const processCardData = (cardData: BaseCard): Card => {
  const { basePrice, ...rest } = cardData;
  const priceHistory = generatePriceHistory(basePrice || 10);
  const latestPrice = priceHistory[priceHistory.length - 1];

  // Generate multi-source data
  const tcgplayerHistory = generateSingleSourcePriceHistory(basePrice, 0.05);
  const cardmarketHistory = generateSingleSourcePriceHistory(basePrice * USD_TO_EUR * 0.98, 0.06); // Simulate EU market variance
  const ebayHistory = generateSingleSourcePriceHistory(basePrice * 1.05, 0.1); // Simulate eBay volatility

  const getChange = (history: SingleSourceMarketPrice[], days: number) => {
    if (history.length < days + 1) return 0;
    const current = history[history.length - 1].price;
    const past = history[history.length - 1 - days].price;
    return (current - past) / past * 100;
  };

  const marketData = {
    tcgplayer: {
      price: tcgplayerHistory[tcgplayerHistory.length - 1].price,
      dayChange: getChange(tcgplayerHistory, 1),
      weekChange: getChange(tcgplayerHistory, 7),
      monthChange: getChange(tcgplayerHistory, 30),
      listingCount: Math.floor(Math.random() * 200) + 50,
      buyLink: '#',
      priceHistory: tcgplayerHistory,
    },
    cardmarket: {
      price: cardmarketHistory[cardmarketHistory.length - 1].price,
      dayChange: getChange(cardmarketHistory, 1),
      weekChange: getChange(cardmarketHistory, 7),
      monthChange: getChange(cardmarketHistory, 30),
      listingCount: Math.floor(Math.random() * 300) + 80,
      buyLink: '#',
      priceHistory: cardmarketHistory,
    },
    ebay: {
      price: ebayHistory[ebayHistory.length - 1].price,
      dayChange: getChange(ebayHistory, 1),
      weekChange: getChange(ebayHistory, 7),
      monthChange: getChange(ebayHistory, 30),
      listingCount: Math.floor(Math.random() * 50) + 10,
      buyLink: '#',
      priceHistory: ebayHistory,
    },
  };
  
  const prices = [marketData.tcgplayer.price, marketData.cardmarket.price, marketData.ebay.price].filter(p => p !== undefined) as number[];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const spreadValue = maxPrice - minPrice;
  const spreadPercentage = minPrice > 0 ? (spreadValue / minPrice) * 100 : 0;

  // Determine Trend
  const trendVal = marketData.tcgplayer.dayChange;
  const trend: 'up' | 'down' | 'stable' = trendVal > 1 ? 'up' : trendVal < -1 ? 'down' : 'stable';

  return {
    ...rest,
    set: rest.setName, // Mapping for backward compatibility
    number: rest.number || '---',
    price: marketData.tcgplayer.price, // Mapping for backward compatibility
    dateAdded: new Date().toISOString(),
    condition: 'NM',
    priceHistory, 
    usMarketValue: marketData.tcgplayer.price, 
    marketTrend: trend,
    marketData: marketData,
    dailyVolume: Math.floor(Math.random() * 50) + 5,
    priceSpread: {
      value: spreadValue,
      percentage: spreadPercentage,
    }
  };
};

const mockCards: Card[] = baseMockCards.map(processCardData);

// --- FRIENDS MOCK DATA ---
const mockFriends: Friend[] = [
    {
        id: 'user-kai',
        name: 'Kai',
        avatar: 'sky',
        level: 12,
        status: 'online',
        collectionValue: 42050,
        cardCount: 412,
        topCard: mockCards.find(c => c.name === 'Black Lotus') || mockCards[4],
        lastActive: 'Just now',
        relationship: 'Rival',
        tradePotential: 450,
        reliability: 98,
        overlap: { youHaveTheyWant: 4, theyHaveYouWant: 2 },
        region: 'NA - East'
    },
    {
        id: 'user-elara',
        name: 'Elara',
        avatar: 'mint',
        level: 8,
        status: 'away',
        collectionValue: 12400,
        cardCount: 156,
        topCard: mockCards.find(c => c.name === 'Charizard ex') || mockCards[0],
        lastActive: '2h ago',
        relationship: 'Guildmate',
        tradePotential: 125,
        reliability: 92,
        overlap: { youHaveTheyWant: 1, theyHaveYouWant: 5 },
        region: 'EU - West'
    },
    {
        id: 'user-jax',
        name: 'Jax',
        avatar: 'gold',
        level: 24,
        status: 'offline',
        collectionValue: 89000,
        cardCount: 1240,
        topCard: mockCards.find(c => c.name === 'Dark Magician Girl') || mockCards[7],
        lastActive: '2d ago',
        relationship: 'Mentor',
        tradePotential: 2200,
        reliability: 100,
        overlap: { youHaveTheyWant: 0, theyHaveYouWant: 12 },
        region: 'NA - West',
        alphaYield: 88
    },
    {
        id: 'user-ren',
        name: 'Ren',
        avatar: 'dusk',
        level: 5,
        status: 'online',
        collectionValue: 5600,
        cardCount: 80,
        topCard: mockCards.find(c => c.name === 'Roronoa Zoro') || mockCards[13],
        lastActive: '5m ago',
        relationship: 'None',
        tradePotential: 45,
        reliability: 75,
        overlap: { youHaveTheyWant: 8, theyHaveYouWant: 0 },
        region: 'Asia - JP'
    }
];

// --- GUILDS MOCK DATA ---

export const mockGuilds: Guild[] = [
  {
    id: 'g1',
    name: 'Vintage Grail',
    emblem: '🪷',
    motto: 'Value above all.',
    focusTags: ['MTG Vintage', 'High End'],
    memberCount: 2400,
    totalValue: 450000,
    topGame: 'Magic: The Gathering',
    trustScore: 98,
    isMember: true,
    evUnlockable: 1250,
    notifications: ['Bounty matches your dupes'],
    nextSession: {
        id: 's1',
        title: 'Alpha Raid',
        date: new Date(Date.now() + 7200000).toISOString(), // 2h from now
        type: 'Raid',
        attendees: 142
    },
    bounties: [
        {
            id: 'b1',
            cardName: 'Black Lotus',
            setName: 'Unlimited Edition',
            imageUrl: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg?1614638838',
            targetPrice: 12000,
            bountyFee: 5,
            deadline: '24h left',
            issuer: 'Collector_01',
            status: 'Open'
        },
        {
            id: 'b2',
            cardName: 'Force of Will',
            setName: 'Alliances',
            imageUrl: 'https://www.mtgpics.com/pics/big/all/054.jpg',
            targetPrice: 85,
            bountyFee: 2,
            deadline: '4h left',
            issuer: 'Kai',
            status: 'Filling'
        }
    ],
    pooledBuys: [
        {
            id: 'pb1',
            title: 'Modern Horizons 3 Collector Case',
            productImage: 'https://m.media-amazon.com/images/I/81yX4+1ovRL._AC_SL1500_.jpg', // Placeholder
            unitPrice: 280,
            totalSlots: 6,
            filledSlots: 5,
            savings: 18,
            escrowSecured: true,
            deadline: 'Ends in 2h'
        }
    ]
  },
  {
    id: 'g2',
    name: 'Shiny Hunters',
    emblem: '✨',
    motto: 'Chasing the gleam.',
    focusTags: ['Pokemon Modern', 'Grading'],
    memberCount: 112,
    totalValue: 125000,
    topGame: 'Pokemon',
    trustScore: 85,
    isMember: false,
    evUnlockable: 450,
    bounties: [],
    pooledBuys: [
         {
            id: 'pb2',
            title: 'Pokemon 151 Booster Box Case',
            productImage: 'https://m.media-amazon.com/images/I/71Kk+2qVlJL._AC_SL1000_.jpg', // Placeholder
            unitPrice: 110,
            totalSlots: 12,
            filledSlots: 3,
            savings: 12,
            escrowSecured: true,
            deadline: 'Ends in 3d'
        }
    ]
  }
];

// --- NEWS CHANNELS ---
export const mockNewsChannels: NewsChannel[] = [
    { id: 'ch-pulls', name: '#Pulls', category: 'General', icon: 'Star' },
    { id: 'ch-arbitrage', name: '#Arbitrage', category: 'Finance', icon: 'Zap' },
    { id: 'ch-vintage', name: '#Vintage', category: 'Magic', icon: 'Clock' },
    { id: 'ch-kado', name: '#KadoIntel', category: 'Finance', icon: 'PieChart' },
    { id: 'ch-pokebeach', name: '#PokeBeach', category: 'Pokemon', icon: 'Globe' },
    { id: 'ch-mtggoldfish', name: '#MTGGoldfish', category: 'Magic', icon: 'BarChart2' },
    { id: 'ch-ygorg', name: '#YGOrganization', category: 'Yu-Gi-Oh!', icon: 'Zap' },
    { id: 'ch-pwcc', name: '#PWCC', category: 'Finance', icon: 'Trophy' },
];

// --- NEW HUNTER NET MOCK DATA ---

export const mockHotWindows: HotWindow[] = [
    { id: 'hw1', title: 'MTG: Modern Horizons 3 Preorders', type: 'Preorder', countdown: 'Ends in 3d 4h' },
    { id: 'hw2', title: 'Pokemon 151 UPC Restock', type: 'Restock', countdown: 'Live Now' },
    { id: 'hw3', title: 'YGO: July 2024 Banlist Update', type: 'Banlist', countdown: 'Expected in 12d' }
];

export const mockNextActions: NextAction[] = [
    { id: 'na1', title: 'Grade your Charizard ex', description: 'PSA 10 value projected at +$150', cta: 'Start Submission', icon: 'Layers' },
    { id: 'na2', title: 'Complete "151" Set', description: 'You are missing 12 cards for completion.', cta: 'View Missing', icon: 'CheckSquare' },
    { id: 'na3', title: 'List Duplicate "Arceus VSTAR"', description: 'Market price is currently stable.', cta: 'List on Market', icon: 'UploadCloud' }
];

export const mockRivalryEvents: RivalryEvent[] = [
  { id: 'r1', text: '@Kai scanned a PSA 10 Charizard.', date: '2h ago', type: 'scan', delta: 2500 },
  { id: 'r2', text: 'You sold your bulk collection.', date: '5h ago', type: 'sale', delta: -400 },
  { id: 'r3', text: '@Kai acquired "The One Ring" (Serialized).', date: '1d ago', type: 'trade', delta: 15000 }
];

export const mockTradeBundles: TradeBundle[] = [
    {
        id: 'tb1',
        name: 'Vintage Swap',
        ev: 240,
        yourCards: [mockCards[0], mockCards[1]], // Charizard, Arceus
        theirCards: [mockCards[4]], // Black Lotus (unrealistic value but for mock)
        matchScore: 94
    },
    {
        id: 'tb2',
        name: 'Modern Meta',
        ev: 85,
        yourCards: [mockCards[2]],
        theirCards: [mockCards[13], mockCards[14]],
        matchScore: 88
    }
];

// --- NEW RIVALRY DATA ---

export const mockRivalryState: RivalryState = {
    rival: mockFriends[0], // Kai
    yourValue: 38500,
    rivalValue: 42050,
    valueDelta: -3550,
    trendPercent: -2.4,
    gapDrivers: [
        { 
            id: 'gd1', 
            card: mockCards[4], // Black Lotus 
            actionType: 'Acquisition', 
            impactDelta: -25000, 
            date: '2d ago',
            actor: 'Rival',
            suggestedAction: { label: 'Counter with Vintage', type: 'watchlist' }
        },
        { 
            id: 'gd2', 
            card: mockCards[0], // Charizard 
            actionType: 'Market Move', 
            impactDelta: +1200, 
            date: '12h ago',
            actor: 'Market',
            suggestedAction: { label: 'List Duplicate', type: 'list' }
        },
        { 
            id: 'gd3', 
            card: mockCards[13], // Zoro
            actionType: 'Sale', 
            impactDelta: -450, 
            date: '5d ago',
            actor: 'Rival',
            suggestedAction: { label: 'Acquire at Dip', type: 'watchlist' }
        }
    ],
    opportunities: [
        {
            id: 'rb1',
            name: 'Gap Closer Bundle',
            ev: 450,
            yourCards: [mockCards[1]], // Arceus
            theirCards: [mockCards[7], mockCards[8]], // Dark Magician Girl, Dark Magician
            matchScore: 96
        }
    ],
    catalysts: [
        { id: 'c1', title: 'MTG Banlist', date: 'In 3 days', type: 'Banlist', affectedSets: ['Modern'], impactLevel: 'High' },
        { id: 'c2', title: 'One Piece OP-07', date: 'In 12 days', type: 'Release', affectedSets: ['Future'], impactLevel: 'Medium' }
    ]
};

export const mockFeedItems: FeedItem[] = [
    {
        id: 'b1',
        createdAt: '2m ago',
        type: 'broker' as const,
        brokerType: 'trade_match' as const,
        score: 95,
        confidence: 92,
        source: 'Community' as const,
        channelId: 'ch-vintage',
        message: 'High-Value Match: @Kai needs your "Force of Will".',
        explanation: 'Matches 1 item on their wishlist and you have 4 copies. EV after fees: +$2.50.',
        ev: 2.50,
        relatedCards: {
            you: [{ name: "Force of Will", price: 75, imageUrl: 'https://www.mtgpics.com/pics/big/all/054.jpg' }],
            them: [{ name: "Sheoldred, the Apocalypse", price: 80, imageUrl: 'https://cards.scryfall.io/large/front/d/6/d67be074-4af5-411f-9130-025dfa1d8d21.jpg?1674022495' }]
        },
        cta: [{ label: 'Draft Trade', action: 'draft_trade' }],
        initialInteractions: { comments: 17, repeats: 2, likes: 22 }
    },
    {
        id: 'intel1',
        createdAt: '15m ago',
        type: 'broker' as const,
        brokerType: 'sector_intel' as const,
        score: 88,
        confidence: 75,
        source: 'Official' as const,
        channelId: 'ch-vintage',
        message: 'Network Sentiment: Rotating to Vintage (+18%)',
        explanation: 'Top drivers: Recent tournament results, low supply of key staples. Your holdings in "Alliances" are up 4%.',
        ev: 18.5,
        cta: [{ label: 'Track Sector', action: 'track_sector' }],
        initialInteractions: { comments: 21, repeats: 4, likes: 120 }
    },
    {
        id: 'alert1',
        createdAt: '45m ago',
        type: 'broker' as const,
        brokerType: 'market_alert' as const,
        score: 82,
        channelId: 'ch-pwcc',
        message: 'Massive spike in Base Set holo volume.',
        explanation: 'Someone is cornering the market in Sector 4.',
        timeframe: '24h',
        changePercent: 35,
        ev: 120,
        sparklineData: [5, 10, 8, 15, 20, 25, 35],
        cta: [{ label: 'Set Price Alert', action: 'set_alert' }],
        initialInteractions: { comments: 2, repeats: 5, likes: 32 }
    },
    {
        id: 'rival1',
        createdAt: '1h ago',
        type: 'broker' as const,
        brokerType: 'rivalry_alert' as const,
        score: 75,
        channelId: 'ch-kado',
        message: 'Rival Update: @Kai just surpassed your collection value.',
        explanation: 'Their recent acquisition of "The One Ring" triggered a +$15k delta. The key move was this single high-value purchase.',
        ev: -15000,
        cta: [{ label: 'View Rivalry', action: 'view_rivalry' }, { label: 'Propose Swap', action: 'propose_swap' }],
        initialInteractions: { comments: 45, repeats: 12, likes: 89 }
    },
    {
        id: 'f1',
        createdAt: '2h ago',
        type: 'finding' as const,
        author: 'KAI',
        avatar: 'sky',
        score: 70,
        channelId: 'ch-vintage',
        body: 'Found a pristine Black Lotus at the underground swap. The seller didn\'t know what they had.',
        image: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg?1614638838',
        ev: 25000,
        cta: [{ label: 'Make Offer', action: 'make_offer' }],
        initialInteractions: { comments: 102, repeats: 45, likes: 340 }
    },
    {
        id: 'f2',
        createdAt: '3h ago',
        type: 'finding' as const,
        author: 'ELARA',
        avatar: 'mint',
        score: 65,
        channelId: 'ch-pulls',
        body: 'Just pulled this Charizard ex from a random pack at the local shop! Shaking rn.',
        image: 'https://images.pokemontcg.io/sv3pt5/6_hires.png',
        ev: 115,
        cta: [{ label: 'Congratulate', action: 'congratulate' }],
        initialInteractions: { comments: 56, repeats: 8, likes: 210 }
    },
    {
        id: 'arb1',
        createdAt: '4h ago',
        type: 'broker' as const,
        brokerType: 'market_alpha' as const,
        score: 90,
        channelId: 'ch-arbitrage',
        message: 'Arbitrage Opportunity: Giratina VSTAR',
        explanation: 'Buy on eBay for $35, sell on TCGplayer for $42. Spread is $7 (20%).',
        ev: 7.00,
        relatedCards: {
            you: [],
            them: [{ name: "Giratina VSTAR", price: 42, imageUrl: 'https://images.pokemontcg.io/swsh11/131_hires.png' }]
        },
        cta: [{ label: 'Execute Trade', action: 'execute_arb' }],
        initialInteractions: { comments: 10, repeats: 2, likes: 3 }
    },
    {
        id: 'f3',
        createdAt: '5h ago',
        type: 'finding' as const,
        author: 'JAX',
        avatar: 'gold',
        score: 85,
        channelId: 'ch-vintage',
        body: 'Finally completed my retro Dark Magician Girl collection. The MFC-000 is flawless.',
        image: 'https://images.ygoprodeck.com/images/cards/38033121.jpg',
        ev: 1200,
        cta: [{ label: 'View Binder', action: 'view_binder' }],
        initialInteractions: { comments: 34, repeats: 5, likes: 156 }
    }
].sort((a, b) => b.score - a.score);

export const generateHunterFeed = (): FeedItem[] => mockFeedItems;

export const useMockData = () => {
    const getRandomCard = () => {
        const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)];
        return { ...randomCard, customGroups: randomCard.customGroups || [] };
    };
    
    return { mockCards, mockFriends, mockGuilds, mockRivalryEvents, mockTradeBundles, mockRivalryState, mockNewsChannels, getRandomCard };
};

export const generateMarketData = (): {
    gainers: MarketMover[];
    losers: MarketMover[];
    heatmap: HeatmapCard[];
    news: MarketNews[];
    arbitrage: ArbitrageOpportunity[];
} => {
    const shuffledCards = [...mockCards].sort(() => 0.5 - Math.random());
    const movers = shuffledCards.slice(0, 10).map((card, i): MarketMover => {
        const change24h = card.marketData?.tcgplayer.dayChange || 0;
        const change7d = card.marketData?.tcgplayer.weekChange || 0;
        const change30d = card.marketData?.tcgplayer.monthChange || 0;
        return {
            ...card,
            change24h: change24h * (1 + (Math.random() - 0.5) * 0.1 * i),
            change7d: change7d * (1 + (Math.random() - 0.5) * 0.2 * i),
            change30d: change30d * (1 + (Math.random() - 0.5) * 0.3 * i),
        };
    });
    
    const arbitrage = shuffledCards.slice(0, 5).map((card): ArbitrageOpportunity => {
      const market = card.price;
      const discount = market * (0.6 + Math.random() * 0.15); // 60-75% of market value
      const spread = market - discount;
      return {
        id: crypto.randomUUID(),
        cardName: card.name,
        setName: card.set,
        imageUrl: card.imageUrl,
        buySource: Math.random() > 0.5 ? 'eBay' : 'Mercari',
        buyPrice: discount,
        sellSource: 'TCGplayer',
        sellPrice: market,
        spread: spread,
        spreadPercent: (spread / discount) * 100,
        confidence: 85 + Math.random() * 14, // High confidence
        foundAt: `${Math.floor(Math.random() * 10) + 2}m ago`
      };
    }).sort((a,b) => b.spreadPercent - a.spreadPercent);

    return {
        gainers: movers.slice(0, 5).sort((a, b) => b.change24h - a.change24h),
        losers: movers.slice(5, 10).sort((a, b) => a.change24h - b.change24h),
        heatmap: shuffledCards.slice(0, 12).map(c => ({...c, performance: (c.marketData?.tcgplayer.dayChange || 0) / 15 })), // Normalize change to ~ -1 to 1
        news: [
            { id: '1', title: "New Pokémon Set 'Temporal Forces' Causes Market Frenzy", snippet: "Prices for key Paradox Pokémon cards have surged over 30% since the set's release last week, with Iron Crown ex seeing unprecedented demand from competitive players.", source: 'PokéBeach', channelId: 'ch-pokebeach', date: '2 days ago', imageUrl: 'https://picsum.photos/seed/temporal-forces-art/800/400' },
            { id: '2', title: "Magic Pro Tour Thunder Junction: The Winning Decklists", snippet: "A surprising 'Boros Convoke' strategy took down the top prize. We analyze the key cards and why this archetype is now a top-tier contender in the meta.", source: 'ChannelFireball', channelId: 'ch-channelfireball', date: '5 days ago', imageUrl: 'https://picsum.photos/seed/mtg-pro-tour-stage/800/400' },
            { id: '3', title: "Yu-Gi-Oh! Ban List Shakeup: 'Snake-Eye' Archetype Hit Hard", snippet: "With 'Snake-Eye Ash' now limited, duelists are scrambling to find the next dominant strategy. Will 'Tenpai Dragon' rise to the top? Our experts weigh in.", source: 'YGOrganization', channelId: 'ch-ygorg', date: '1 week ago', imageUrl: 'https://picsum.photos/seed/yugioh-banlist-scroll/800/400' },
            { id: '4', title: "One Piece Card Game: Hype Builds for OP-07 Release", snippet: "The upcoming set, '500 Years in the Future', sold out of pre-release allocations at many stores. The new Egghead and Vegapunk cards are expected to be meta-defining.", source: 'OPTCG Gateway', channelId: 'ch-optcg', date: '3 days ago', imageUrl: 'https://picsum.photos/seed/one-piece-egghead/800/400' },
            { id: '5', title: "Investing in Sealed TCG Products: A 2024 Analysis", snippet: "A deep dive into the Q2 sales data suggests a slight normalization of prices for modern booster boxes, while vintage sets like Base Set Pokémon continue to hold strong value.", source: 'Kado Hunter Insights', channelId: 'ch-kado', date: '1 week ago', imageUrl: 'https://picsum.photos/seed/sealed-booster-boxes/800/400' },
            { id: '6', title: "Record Sale: PSA 10 1st Edition Charizard Sells for $250,000", snippet: "A pristine copy of the iconic Pokémon card has just fetched a staggering price at a PWCC auction, highlighting the continued strength of the high-end collector's market.", source: 'PWCC Weekly', channelId: 'ch-pwcc', date: '2 weeks ago', imageUrl: 'https://picsum.photos/seed/charizard-psa-10/800/400' },
            { id: '7', title: "Strategy Guide: Mastering the Side Deck in Modern Magic", snippet: "Side-decking is one of the most crucial skills in competitive Magic. We break down how to build an effective sideboard to counter the current top decks in the format.", source: 'TCGplayer Infinite', channelId: 'ch-tcgplayer', date: '4 days ago', imageUrl: 'https://picsum.photos/seed/mtg-strategy-brain/800/400' },
        ],
        arbitrage: arbitrage
    };
};