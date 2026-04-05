import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth, useClerk, useUser } from "@clerk/clerk-expo";
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
  Upload,
  ExternalLink,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import type { Card } from "@kado/contracts";
import { KadoColors } from "@/constants/theme";
import { BREAKPOINTS, getWebSidebarWidth } from "@/constants/breakpoints";
import { getGameLabel } from "@/utils/gameLabels";
import { getGameTone, getRarityBorderColor } from "@/utils/gameStyles";
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
const UploadIcon = Upload as React.ComponentType<any>;
const ExternalLinkIcon = ExternalLink as React.ComponentType<any>;

const GRID_PADDING = 16;
const CARD_GAP = 12;

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

function useGridLayout() {
  const { isDesktop, availableWidth: rawAvailableWidth } = useResponsiveLayout();
  
  const availableWidth = isDesktop ? rawAvailableWidth - 32 : rawAvailableWidth;
  let numColumns = 3;
  if (isDesktop) {
    if (availableWidth >= 1080) numColumns = 6;
    else if (availableWidth >= 820) numColumns = 5;
    else numColumns = 4;
  }
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

// getGameLabel, getGameTone, getRarityBorderColor imported from @/utils

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
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("dateAdded");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [linkWaitExpired, setLinkWaitExpired] = useState(false);

  const storeUserMutation = useMutation(api.users.storeUser);
  const currentUser = useQuery(api.users.getCurrentUser, isAuthLoaded && isSignedIn ? {} : "skip");
  const rawScans = useQuery(api.users.getUserCollection, currentUser?._id ? { userId: currentUser._id } : "skip");

  useEffect(() => {
    if (currentUser !== null) {
      setLinkWaitExpired(false);
      return;
    }
    if (currentUser === undefined) {
      return;
    }
    const t = setTimeout(() => setLinkWaitExpired(true), 12000);
    return () => clearTimeout(t);
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded || !isSignedIn || !user?.id) return;
    if (currentUser !== null || currentUser === undefined) return;
    void storeUserMutation({
      tokenIdentifier: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: user.fullName || undefined,
    }).catch((err: unknown) => {
      console.error("Binder storeUser", err);
    });
  }, [isAuthLoaded, isUserLoaded, isSignedIn, user?.id, currentUser, storeUserMutation]);

  const { numColumns, cardWidth, cardHeight, isDesktop } = useGridLayout();

  const cards = useMemo<Card[]>(() => {
    if (!currentUser?._id) return [];
    if (rawScans === undefined) return [];
    return Array.isArray(rawScans) ? rawScans.map(mapScanToCard) : [];
  }, [currentUser?._id, rawScans]);

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
    if (!currentUser?._id || cards.length === 0) {
      return null;
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
  }, [cards.length, currentUser?._id]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: KadoColors.midnight }} edges={["top"]}>
      {isSignedIn && (currentUser === undefined || currentUser === null) ? (
        <View className="mx-5 mt-2 px-3 py-2.5 rounded-xl bg-amber-500/12 border border-amber-500/25">
          {currentUser === undefined ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color={KadoColors.umber} />
              <Text className="text-amber-100/90 text-xs flex-1 leading-5">
                Loading your hunter profile…
              </Text>
            </View>
          ) : !linkWaitExpired ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color={KadoColors.umber} />
              <Text className="text-amber-100/90 text-xs flex-1 leading-5">
                Linking your account to the game server…
              </Text>
            </View>
          ) : (
            <View>
              <Text className="text-amber-100/90 text-xs leading-5 mb-3">
                Could not verify your session with the backend. In Clerk, create a JWT template named{" "}
                <Text className="font-mono text-white">convex</Text>, ensure Convex auth is configured, clear site data for
                localhost if needed, then sign out and sign in again.
              </Text>
              <View className="flex-row gap-2 w-full">
                <Pressable
                  onPress={() => onRetry()}
                  className="flex-1 min-h-[40px] px-3 rounded-lg bg-white/10 border border-white/15 items-center justify-center active:opacity-80"
                >
                  <Text className="text-light-slate text-xs font-bold">Retry</Text>
                </Pressable>
                <Pressable
                  onPress={() => void signOut().then(() => router.push("/profile"))}
                  className="flex-1 min-h-[40px] px-3 rounded-lg bg-umber items-center justify-center active:opacity-90"
                >
                  <Text className="text-midnight text-xs font-bold">Sign out</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ) : null}
      <View className="px-5 pt-6 pb-4 max-w-[1320px] w-full self-center">
          <View className="mb-6">
            <View className="bg-navy/40 border border-white/5 rounded-2xl p-6 shadow-soft-lg flex-col gap-4 overflow-hidden">
                <View>
                    <Text className="text-slate-text text-[10px] font-bold uppercase tracking-wider mb-1">Portfolio Value</Text>
                    <Text className="text-3xl font-bold text-white tracking-tight font-mono">{formatUsd(portfolioStats.totalValue)}</Text>
                </View>

                <View className="h-px self-stretch bg-white/5" />

                <View className="flex-row items-stretch">
                    <View className="flex-1 min-w-0 pr-3">
                        <Text className="text-slate-text text-[10px] font-bold uppercase tracking-wider mb-1">7D Change</Text>
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                            <TrendingUp size={14} color="#4ade80" />
                            <Text className="text-sm font-bold font-mono text-emerald-400">+$124.50</Text>
                        </View>
                    </View>
                    <View className="flex-1 min-w-0 pl-3">
                        <Text className="text-slate-text text-[10px] font-bold uppercase tracking-wider mb-1">Collection</Text>
                        <Text className="text-sm font-bold font-mono text-white">{cards.length}</Text>
                    </View>
                </View>
            </View>
          </View>

          {cards.length === 0 && (
            <View className="mb-6 bg-[#171b2d] border border-white/5 rounded-2xl flex-row items-stretch overflow-hidden min-h-[220px]">
                {/* Left Side: Illustration */}
                <View className="w-[340px] items-center justify-center pt-8 pl-8 overflow-hidden bg-gradient-to-r from-transparent to-[#131623]">
                    <Image source={require("../../assets/images/nano_banana_cards.png")} style={{width: 320, height: 210, transform: [{translateY: 10}, {translateX: -10}]}} contentFit="contain" />
                </View>
                {/* Right Side: Content */}
                <View className="flex-1 py-10 px-8 justify-center">
                    <Text className="text-2xl font-bold text-white mb-2 tracking-tight">
                        Add cards <Text className="font-normal text-light-slate">to organize and track your TCG collection</Text>
                    </Text>
                    <Text className="text-slate-text text-sm leading-6 mb-5 max-w-[500px]">
                        Upload photos or scan your cards to add them to your binder and start tracking value.
                    </Text>
                    <View className="flex-col items-start gap-3 mt-1">
                        <Pressable onPress={() => router.push("/")} className="px-5 py-2.5 rounded-xl bg-[#c7a77b] flex-row items-center justify-center gap-2 active:scale-95 shadow-lg shadow-black/20">
                            <MaximizeIcon size={16} color="#020617" />
                            <UploadIcon size={16} color="#020617" />
                            <Text className="text-[#020617] font-bold text-sm">Scan or uload</Text>
                        </Pressable>
                        <Pressable className="flex-row items-center gap-1 opacity-90 pl-1">
                            <Text className="text-white font-medium text-[13px] tracking-wide">Import collection</Text>
                            <ChevronDownIcon size={14} color="#ffffff" />
                        </Pressable>
                    </View>
                </View>
            </View>
          )}

          <View className="mb-4">
              <Pressable className="flex-row items-center justify-between w-full px-4 py-3 bg-navy/20 border border-white/5 rounded-xl shadow-inner active:scale-[0.98]">
                  <View className="flex-row items-center gap-2">
                      <BookOpenIcon size={16} color={KadoColors.slateText} />
                      <Text className="text-white font-bold text-sm">All Cards</Text>
                  </View>
                  <ChevronDownIcon size={16} color={KadoColors.slateText} />
              </Pressable>
          </View>

          <View className="flex-row items-center gap-3 mb-4">
              <View className="flex-1 relative flex-row items-center">
                  <View className="absolute left-3 z-10">
                      <SearchIcon size={16} color={KadoColors.slateText} />
                  </View>
                  <TextInput 
                    placeholder="Search binder..." 
                    placeholderTextColor="rgba(136,146,176,0.5)" 
                    className="flex-1 bg-navy/40 border border-white/5 rounded-xl py-3 pl-10 pr-[120px] text-sm text-light-slate h-[46px]"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <View className="absolute right-2 z-10">
                      <Pressable className="flex-row items-center gap-2 px-3 py-1.5 rounded-lg active:bg-white/10">
                          <SlidersHorizontalIcon size={14} color={KadoColors.lightSlate} />
                          <Text className="text-sm font-bold text-light-slate">Filter & Sort</Text>
                      </Pressable>
                  </View>
              </View>
              
              <View className="flex-row items-center bg-navy/40 border border-white/5 rounded-xl p-1 h-[46px]">
                  <Pressable onPress={() => setViewMode('list')} className={`w-10 h-full rounded-lg items-center justify-center ${viewMode === 'list' ? 'bg-white/10' : ''}`}>
                      <ListIcon size={18} color={viewMode === 'list' ? KadoColors.lightSlate : KadoColors.slateText} />
                  </Pressable>
                  <Pressable onPress={() => setViewMode('grid')} className={`w-10 h-full rounded-lg items-center justify-center ${viewMode === 'grid' ? 'bg-white/10' : ''}`}>
                      <BookOpenIcon size={18} color={viewMode === 'grid' ? KadoColors.lightSlate : KadoColors.slateText} />
                  </Pressable>
              </View>

              <Pressable className="bg-navy/40 border border-white/5 w-[46px] h-[46px] rounded-xl items-center justify-center active:scale-95">
                  <ExternalLinkIcon size={18} color={KadoColors.slateText} />
              </Pressable>
          </View>
      </View>
      <View className="flex-1 w-full max-w-[1320px] self-center">
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
      </View>
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
