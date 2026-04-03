import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useAuth } from "@clerk/clerk-expo";
import {
  ArrowUpDown,
  BookOpen,
  Gamepad2,
  Minus,
  Scan,
  Search,
  TrendingDown,
  TrendingUp,
  LayoutGrid,
  List as ListIcon,
  Filter,
  Zap,
  CheckSquare,
  ChevronDown,
  Maximize,
  SlidersHorizontal,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import type { Card } from "@kado/contracts";
import { KadoColors } from "@/constants/theme";
import { api } from "../../../../convex/_generated/api";

const ArrowUpDownIcon = ArrowUpDown as React.ComponentType<any>;
const BookOpenIcon = BookOpen as React.ComponentType<any>;
const Gamepad2Icon = Gamepad2 as React.ComponentType<any>;
const MinusIcon = Minus as React.ComponentType<any>;
const ScanIcon = Scan as React.ComponentType<any>;
const SearchIcon = Search as React.ComponentType<any>;
const TrendingDownIcon = TrendingDown as React.ComponentType<any>;
const TrendingUpIcon = TrendingUp as React.ComponentType<any>;
const ZapIcon = Zap as React.ComponentType<any>;
const CheckSquareIcon = CheckSquare as React.ComponentType<any>;
const ChevronDownIcon = ChevronDown as React.ComponentType<any>;
const MaximizeIcon = Maximize as React.ComponentType<any>;
const SlidersHorizontalIcon = SlidersHorizontal as React.ComponentType<any>;

const GRID_PADDING = 16;
const CARD_GAP = 12;

function useGridLayout() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= 768; // Matching _layout.tsx breakpoint
  
  // If web and not desktop, we are in the 480px centered box
  const availableWidth = isDesktop ? width - 80 : isWeb ? Math.min(width, 480) : width;
  const numColumns = isDesktop ? 5 : 3;
  const cardWidth = (availableWidth - (GRID_PADDING * 2) - (CARD_GAP * (numColumns - 1))) / numColumns;
  const cardHeight = cardWidth * 1.4;

  return { numColumns, cardWidth, cardHeight, isDesktop };
}

type SortBy = "name" | "price" | "dateAdded";

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatUsd(value: number) {
  return USD_FORMATTER.format(value);
}

function mapScanToCard(scan: any): Card {
  const marketTrend = (scan.marketTrend as Card["marketTrend"]) ?? "stable";

  return {
    id: scan._id,
    name: scan.cardName ?? "Unknown Card",
    set: scan.setName ?? "Unknown Set",
    rarity: scan.rarity ?? "Unknown",
    number: scan.number ?? "",
    imageUrl: scan.imageUrl ?? "",
    price: scan.estimatedPrice ?? 0,
    marketTrend,
    dateAdded: new Date(scan.createdAt ?? scan._creationTime).toISOString(),
    condition: scan.condition ?? "NM",
    finish: (scan.finish as Card["finish"]) ?? (scan.foil ? "Foil" : "Normal"),
    game: (scan.gameCode as Card["game"]) || "unknown",
  };
}

function getGameLabel(game?: Card["game"]) {
  switch (game) {
    case "pokemon": return "Pokemon";
    case "mtg": return "Magic";
    case "yugioh": return "Yu-Gi-Oh!";
    case "onepiece": return "One Piece";
    case "dragonball": return "Dragon Ball";
    default: return "TCG";
  }
}

function getGameTone(game?: Card["game"]) {
  switch (game) {
    case "pokemon": return { border: "rgba(245, 158, 11, 0.35)", background: "rgba(245, 158, 11, 0.16)", text: "#fbbf24" };
    case "mtg": return { border: "rgba(249, 115, 22, 0.35)", background: "rgba(249, 115, 22, 0.16)", text: "#fb923c" };
    case "yugioh": return { border: "rgba(168, 85, 247, 0.35)", background: "rgba(168, 85, 247, 0.16)", text: "#c084fc" };
    case "onepiece": return { border: "rgba(56, 189, 248, 0.35)", background: "rgba(56, 189, 248, 0.16)", text: "#67e8f9" };
    case "dragonball": return { border: "rgba(244, 114, 182, 0.35)", background: "rgba(244, 114, 182, 0.16)", text: "#f9a8d4" };
    default: return { border: "rgba(255, 255, 255, 0.12)", background: "rgba(255, 255, 255, 0.08)", text: KadoColors.lightSlate };
  }
}

function getRarityBorderColor(rarity: string) {
  const value = rarity.toLowerCase();
  if (value.includes("secret") || value.includes("illustration") || value.includes("hyper")) return "rgba(245, 158, 11, 0.82)";
  if (value.includes("ultra")) return "rgba(168, 85, 247, 0.82)";
  if (value.includes("rare") || value.includes("holo")) return "rgba(96, 165, 250, 0.82)";
  return "rgba(255, 255, 255, 0.12)";
}

function getConditionStyle(condition?: string) {
  switch ((condition ?? "NM").toUpperCase()) {
    case "NM": return { background: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.24)", text: "#34d399" };
    case "LP": return { background: "rgba(110, 231, 183, 0.12)", border: "rgba(110, 231, 183, 0.28)", text: "#a7f3d0" };
    case "MP": return { background: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.28)", text: "#fbbf24" };
    case "HP": return { background: "rgba(251, 113, 133, 0.12)", border: "rgba(251, 113, 133, 0.28)", text: "#fb7185" };
    default: return { background: "rgba(255, 255, 255, 0.08)", border: "rgba(255, 255, 255, 0.12)", text: KadoColors.lightSlate };
  }
}

function getMarketTrendStyle(trend?: Card["marketTrend"]) {
  switch (trend) {
    case "up": return { label: "Up", icon: TrendingUpIcon, color: "#4ade80", background: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.22)" };
    case "down": return { label: "Down", icon: TrendingDownIcon, color: "#fb7185", background: "rgba(244, 63, 94, 0.14)", border: "rgba(244, 63, 94, 0.22)" };
    default: return { label: "Stable", icon: MinusIcon, color: KadoColors.slateText, background: "rgba(136, 146, 176, 0.12)", border: "rgba(136, 146, 176, 0.2)" };
  }
}

function isFoilLike(card: Card) {
  const finish = (card.finish ?? "Normal").toLowerCase();
  return finish !== "normal";
}

export default function BinderScreen() {
  const [retryKey, setRetryKey] = useState(0);
  return <BinderScreenContent key={retryKey} onRetry={() => setRetryKey((v) => v + 1)} />;
}

function BinderScreenContent({ onRetry }: { onRetry: () => void }) {
  const router = useRouter();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("dateAdded");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser, isAuthLoaded && isSignedIn ? {} : "skip");
  const rawScans = useQuery(api.users.getUserCollection, currentUser?._id ? { userId: currentUser._id } : "skip");

  const { numColumns, cardWidth, cardHeight, isDesktop } = useGridLayout();

  const cards = useMemo<Card[]>(() => {
    if (!rawScans) return [];
    return (Array.isArray(rawScans) ? rawScans.map(mapScanToCard) : []);
  }, [rawScans]);

  const filteredCards = useMemo(() => {
    let result = [...cards];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.set.toLowerCase().includes(q) || c.rarity.toLowerCase().includes(q));
    }
    result.sort((left, right) => {
      if (sortBy === "name") return left.name.localeCompare(right.name);
      if (sortBy === "price") return right.price - left.price;
      return new Date(right.dateAdded).getTime() - new Date(left.dateAdded).getTime();
    });
    return result;
  }, [cards, searchQuery, sortBy]);

  const portfolioStats = useMemo(() => {
    const totalValue = cards.reduce((sum, card) => sum + (card.price * (card.quantity || 1)), 0);
    const uniqueCount = new Set(cards.map((card) => `${card.name}:${card.set}:${card.number}`)).size;
    const trendScore = cards.reduce((sum, card) => (card.marketTrend === "up" ? sum + 1 : card.marketTrend === "down" ? sum - 1 : sum), 0) / Math.max(cards.length, 1);
    return { totalValue, uniqueCount, trendScore };
  }, [cards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const handleCardPress = useCallback((card: Card) => router.push(`/card/${card.id}`), [router]);

  const renderCardItem = useCallback(({ item, index }: { item: Card; index: number }) => {
    const isLeftEdge = index % numColumns === 0;
    const isNew = Date.now() - new Date(item.dateAdded).getTime() < 1000 * 60 * 60 * 24;
    
    const condition = item.condition || 'NM';
    const conditionColor = condition === 'NM' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' 
        : condition === 'LP' ? 'text-emerald-200 bg-emerald-200/10 border-emerald-200/20'
        : condition === 'MP' ? 'text-amber-200 bg-amber-200/10 border-amber-200/20'
        : 'text-rose-400 bg-rose-400/10 border-rose-400/20';

    const finish = item.finish || 'Normal';

    if (viewMode === "list") {
      return (
        <Pressable 
          onPress={() => handleCardPress(item)} 
          className="flex-row items-center gap-4 p-3 border rounded-2xl active:scale-[0.99] transition-all bg-navy/40 border-white/5 mx-4 mb-3"
        >
            <View className="w-12 h-16 bg-midnight rounded-md overflow-hidden shrink-0 border border-white/5 relative">
                <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: "100%", opacity: 0.9 }} contentFit="cover" />
            </View>
            <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-2">
                    <Text className="font-bold text-light-slate text-sm" numberOfLines={1}>{item.name}</Text>
                    {(finish === 'Foil' || finish === 'Reverse Holo') && <ZapIcon size={12} color="#fbbf24" fill="#fbbf24" />}
                </View>
                <View className="flex-row items-center gap-1 text-xs mt-0.5">
                    <Text className="text-slate-text text-xs" numberOfLines={1}>{item.set}</Text>
                    <Text className="text-slate-text text-xs">•</Text>
                    <Text className={`font-bold ${condition === 'NM' ? 'text-emerald-400' : 'text-slate-400'}`}>{condition}</Text>
                </View>
            </View>
            <View className="items-end">
                <Text className="font-bold text-umber text-sm">{formatUsd(item.price)}</Text>
                <Text className="text-[10px] text-slate-text mt-0.5">Qty: {item.quantity || 1}</Text>
            </View>
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={() => handleCardPress(item)}
        style={{ width: cardWidth, marginLeft: isLeftEdge ? 0 : CARD_GAP, marginBottom: CARD_GAP }}
        className="active:scale-[0.98]"
      >
        <View className="border p-1.5 rounded-md shadow-soft-lg bg-navy/40 border-white/5 relative overflow-hidden flex-col">
            <View className={`aspect-[5/7] bg-black rounded-xl overflow-hidden relative shadow-inner w-full mb-2 ${isNew ? 'is-new' : ''}`}>
               <Image 
                 source={{ uri: item.imageUrl }} 
                 style={{ width: "100%", height: "100%", borderRadius: 12, opacity: 0.9 }} 
                 contentFit="cover" 
                 transition={300} 
               />
               
               {/* 1. Quantity (Top Left) */}
               <View className="absolute top-1.5 left-1.5 z-20">
                  <View className="bg-midnight/80 border border-white/10 px-1.5 py-0.5 rounded-full min-w-[20px] items-center shadow-lg">
                      <Text className="text-light-slate text-[9px] font-bold">x{item.quantity || 1}</Text>
                  </View>
               </View>

               {/* 2. Condition (Bottom Left) */}
               <View className="absolute bottom-1.5 left-1.5 z-20">
                  <View className={`border px-1.5 py-0.5 rounded shadow-lg ${conditionColor.split(' ')[1]} ${conditionColor.split(' ')[2]}`}>
                     <Text className={`text-[8px] font-bold uppercase tracking-wider ${conditionColor.split(' ')[0]}`}>{condition}</Text>
                  </View>
               </View>

               {/* 3. Variant (Bottom Right) */}
               {finish !== 'Normal' && (
                  <View className="absolute bottom-1.5 right-1.5 z-20">
                      <View className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 items-center justify-center shadow-lg">
                          {finish === 'Foil' ? <ZapIcon size={10} color="#fbbf24" fill="#fbbf24" /> : 
                           finish === 'Reverse Holo' ? <Text className="text-amber-400 text-[8px] font-bold">RH</Text> : 
                           <ScanIcon size={10} color="#fbbf24" />}
                      </View>
                  </View>
               )}
            </View>
            
            <View className="px-1 pb-0.5">
                <Text className="font-bold text-[10px] text-light-slate" numberOfLines={1}>{item.name}</Text>
                <View className="flex-row justify-between items-center mt-0.5">
                    <Text className="text-[9px] text-slate-text uppercase tracking-wide font-medium flex-1 mr-2" numberOfLines={1}>{item.set}</Text>
                    <Text className="text-[10px] font-bold text-umber">{formatUsd(item.price)}</Text>
                </View>
            </View>
        </View>
      </Pressable>
    );
  }, [handleCardPress, viewMode, cardWidth, numColumns]);

  const renderEmptyState = useCallback(() => {
    if (cards.length === 0) {
      return (
        <View className="flex-1 items-center justify-center px-6 pt-20">
          <View className="w-24 h-24 rounded-full border border-white/10 bg-navy/60 items-center justify-center mb-5 relative overflow-hidden">
            <View className="absolute inset-0 bg-umber/5" />
            <BookOpenIcon size={38} color={KadoColors.umber} strokeWidth={1.6} />
          </View>
          <Text className="text-light-slate text-2xl font-bold mb-2 text-center">Your binder is empty</Text>
          <Text className="text-slate-text text-sm text-center leading-6 max-w-[260px] mb-7">The journey of a thousand cards begins with a single scan.</Text>
          <Pressable onPress={() => router.push("/")} className="px-7 py-3.5 rounded-2xl bg-umber flex-row items-center gap-2 active:scale-95">
            <ScanIcon size={18} color={KadoColors.midnight} />
            <Text className="text-midnight font-bold text-sm">Start Scanning</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View className="flex-1 items-center justify-center px-6 pt-20">
        <View className="w-20 h-20 rounded-full bg-navy/70 border border-white/10 items-center justify-center mb-5"><SearchIcon size={34} color={KadoColors.slateText} strokeWidth={1.6} /></View>
        <Text className="text-light-slate text-xl font-bold mb-2 text-center">No matches found</Text>
        <Pressable onPress={() => setSearchQuery("")} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 active:scale-95">
          <Text className="text-light-slate font-bold text-sm">Clear Filters</Text>
        </Pressable>
      </View>
    );
  }, [router, cards.length]);

  if (!isAuthLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: KadoColors.midnight }} edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={KadoColors.umber} />
          <Text className="mt-4 text-slate-text text-sm">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignedIn) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: KadoColors.midnight }} edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center px-6 py-8 rounded-[28px] border border-white/10 bg-navy/60">
            <View className="mb-5 h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-midnight/55"><BookOpenIcon size={30} color={KadoColors.umber} /></View>
            <Text className="mt-2 text-center text-2xl font-bold tracking-tight text-light-slate">Join the Hunt</Text>
            <Pressable onPress={() => router.push("/profile")} className="mt-6 rounded-2xl bg-umber px-6 py-3 active:scale-95">
              <Text className="text-sm font-bold text-midnight">Open Hunter Net</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (currentUser === undefined || rawScans === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: KadoColors.midnight }} edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={KadoColors.umber} />
          <Text className="mt-4 text-slate-text text-sm">Syncing Binder...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: KadoColors.midnight }} edges={["top"]}>
      <View className="px-5 pt-6 pb-4">
          <View className="mb-6">
            <View className="bg-navy/40 border border-white/5 rounded-3xl p-6 shadow-soft-lg flex-col gap-4">
                <View className="flex-row justify-between items-start">
                    <View>
                        <Text className="text-slate-text text-xs font-bold uppercase tracking-wider mb-1">Portfolio Value</Text>
                        <Text className="text-4xl font-bold text-light-slate tracking-tight font-mono">{formatUsd(portfolioStats.totalValue)}</Text>
                    </View>
                </View>
                
                <View className="h-[1px] w-full bg-white/5"></View>

                <View className="flex-row items-center gap-6">
                    <View>
                        <Text className="text-slate-text text-[10px] font-bold uppercase tracking-wider mb-1">7D Change</Text>
                        <View className="flex-row items-center gap-1.5">
                            <TrendingUp size={16} color="#4ade80" />
                            <Text className="text-lg font-bold font-mono text-emerald-400">+$124.50</Text>
                        </View>
                    </View>
                    <View className="w-[1px] h-8 bg-white/10"></View>
                    <View>
                        <Text className="text-slate-text text-[10px] font-bold uppercase tracking-wider mb-1">Collection</Text>
                        <Text className="text-lg font-bold font-mono text-white">{cards.length}</Text>
                    </View>
                </View>
            </View>
          </View>
          <View className="mb-4 relative z-20">
              <Pressable className="flex-row items-center justify-between gap-2 w-full px-4 py-3 bg-midnight/50 border border-white/10 rounded-xl shadow-inner active:scale-[0.98]">
                  <View className="flex-row items-center gap-2">
                      <BookOpenIcon size={16} color={KadoColors.umber} />
                      <Text className="text-light-slate font-bold text-sm">All Cards</Text>
                  </View>
                  <ChevronDownIcon size={16} color={KadoColors.slateText} />
              </Pressable>
          </View>

          <View className="flex-row items-center gap-3 mb-4">
              <Pressable className="flex-1 bg-navy border border-white/10 h-[46px] rounded-xl flex-row items-center justify-center gap-2 shadow-sm active:scale-95">
                  <SlidersHorizontalIcon size={18} color={KadoColors.lightSlate} />
                  <Text className="text-sm font-bold text-light-slate">Filter & Sort</Text>
              </Pressable>
              
              <Pressable onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="bg-navy border border-white/10 w-12 h-[46px] rounded-xl flex items-center justify-center active:scale-95">
                  {viewMode === 'grid' ? <ListIcon size={20} color={KadoColors.slateText} /> : <LayoutGrid size={20} color={KadoColors.slateText} />}
              </Pressable>

              <Pressable className="bg-navy border border-white/10 w-12 h-[46px] rounded-xl flex items-center justify-center active:scale-95">
                  <MaximizeIcon size={20} color={KadoColors.slateText} />
              </Pressable>

              <Pressable className="bg-navy border border-white/10 w-12 h-[46px] rounded-xl flex items-center justify-center active:scale-95">
                  <CheckSquareIcon size={20} color={KadoColors.slateText} />
              </Pressable>
          </View>
          
          <View className="relative mb-4 flex-row items-center gap-3">
            <View className="relative flex-1">
                <View className="absolute left-3 top-3.5 z-10">
                    <SearchIcon size={16} color={KadoColors.slateText} />
                </View>
                <TextInput 
                  placeholder="Search binder..." 
                  placeholderTextColor="rgba(136,146,176,0.5)" 
                  className="w-full bg-navy/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-light-slate"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
            </View>
          </View>
      </View>
      <FlatList
        data={filteredCards}
        renderItem={renderCardItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === "grid" ? numColumns : 1}
        key={`${viewMode}-${numColumns}`}
        contentContainerStyle={{ paddingHorizontal: viewMode === "grid" ? GRID_PADDING : 0, paddingTop: 6, paddingBottom: 24, flexGrow: 1 }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={KadoColors.umber} colors={[KadoColors.umber]} />}
      />
    </SafeAreaView>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-slate-text text-[10px] font-bold uppercase tracking-[0.18em] mb-1">{label}</Text>
      <Text className="text-light-slate text-lg font-bold" numberOfLines={1}>{value}</Text>
    </View>
  );
}
