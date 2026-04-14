import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useAuth, useClerk, useUser } from "@clerk/clerk-expo";
import {
  ArrowUp,
  ArrowDown,
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
  Trash2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import type { Card } from "@kado/contracts";
import { KadoColors } from "@/constants/theme";
import { BREAKPOINTS, getWebSidebarWidth } from "@/constants/breakpoints";
import { getGameLabel } from "@/utils/gameLabels";
import { getGameTone, getRarityBorderColor } from "@/utils/gameStyles";
import { api } from "../../../../convex/_generated/api";
import { DesktopDropdown } from "@/components/DesktopDropdown";

const ArrowUpIcon = ArrowUp as React.ComponentType<any>;
const ArrowDownIcon = ArrowDown as React.ComponentType<any>;
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
const Trash2Icon = Trash2 as React.ComponentType<any>;

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

const GRID_PADDING = 16;
const CARD_GAP = 12;

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

type SortBy = "name" | "price" | "dateAdded" | "rarity" | "set" | "number";
type SortDirection = "asc" | "desc";

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
    tags: scan.tags ?? [],
    quantity: scan.quantity ?? 1,
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
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [linkWaitExpired, setLinkWaitExpired] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const storeUserMutation = useMutation(api.users.storeUser);
  const deleteMutation = useMutation(api.users.deleteFromCollection);
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

  const gameFilterOptions = useMemo(() => {
    const codes = [...new Set(cards.map((c) => c.game).filter(Boolean))] as string[];
    return codes.sort();
  }, [cards]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    cards.forEach(c => c.tags?.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [cards]);

  const filteredCards = useMemo(() => {
    let result = [...cards];
    if (activeTab !== "All") {
      result = result.filter((c) => c.game === activeTab);
    }
    if (activeTagFilter) {
      result = result.filter(c => c.tags?.includes(activeTagFilter));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.set.toLowerCase().includes(q) || c.rarity.toLowerCase().includes(q));
    }
    result.sort((left, right) => {
      let valA: any = left[sortBy as keyof Card];
      let valB: any = right[sortBy as keyof Card];
      
      if (sortBy === "dateAdded") {
         valA = new Date(left.dateAdded).getTime();
         valB = new Date(right.dateAdded).getTime();
      } else if (sortBy === "price") {
         valA = left.price;
         valB = right.price;
      } else {
         valA = String(valA || "").toLowerCase();
         valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [cards, searchQuery, sortBy, sortDirection, activeTab, activeTagFilter]);

  const exportBinderCsv = useCallback(async () => {
    if (filteredCards.length === 0) {
      Alert.alert("Nothing to export", "Add cards or adjust filters first.");
      return;
    }
    const header = "Name,Set,Number,Rarity,Price USD,Condition,Finish,Game\n";
    const rows = filteredCards.map((c) =>
      [c.name, c.set, c.number, c.rarity, String(c.price), c.condition ?? "", c.finish ?? "", c.game]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = header + rows.join("\n");
    if (Platform.OS === "web") {
      try {
        await navigator.clipboard.writeText(csv);
        Alert.alert("Copied", "Binder CSV copied to your clipboard.");
      } catch {
        Alert.alert("Export", "Could not copy automatically. Select the text from a desktop browser with clipboard permission.");
      }
    } else {
      try {
        await Share.share({ message: csv, title: "My Kado Binder" });
      } catch {
        Alert.alert("Export", "Sharing is not available on this device.");
      }
    }
  }, [filteredCards]);

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

  const handleCardInteract = useCallback((card: Card) => {
    if (isSelectionMode) {
      const newSet = new Set(selectedIds);
      if (newSet.has(card.id)) newSet.delete(card.id);
      else newSet.add(card.id);
      setSelectedIds(newSet);
    } else {
      router.push(`/card/${card.id}`);
    }
  }, [isSelectionMode, selectedIds, router]);

  const handleCardLongPress = useCallback((card: Card) => {
    if (!isSelectionMode) {
      if (Platform.OS !== "web" && Platform.OS !== "windows" && Platform.OS !== "macos" && typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      setIsSelectionMode(true);
      setSelectedIds(new Set([card.id]));
    }
  }, [isSelectionMode]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const confirm = Platform.OS === "web" 
      ? window.confirm(`Delete ${selectedIds.size} cards from your binder?`) 
      : await new Promise(resolve => Alert.alert("Delete Cards", `Delete ${selectedIds.size} cards from your binder?`, [ { text: "Cancel", onPress: () => resolve(false), style: "cancel" }, { text: "Delete", onPress: () => resolve(true), style: "destructive" } ]));
    
    if (!confirm) return;
    
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteMutation({ scanId: id as any })));
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      if (Platform.OS === "web") alert("Failed to delete some cards.");
      else Alert.alert("Error", "Failed to delete some cards.");
    }
  }, [selectedIds, deleteMutation]);

  const renderCardItem = useCallback(({ item, index }: { item: Card; index: number }) => {
    const isLeftEdge = index % numColumns === 0;
    const isNew = Date.now() - new Date(item.dateAdded).getTime() < 1000 * 60 * 60 * 24;

    const condition = item.condition || "NM";
    const finish = item.finish || "Normal";
    const isFoil = finish !== "Normal";

    const conditionColor =
      condition === "NM" ? "#34d399"
      : condition === "LP" ? "#a7f3d0"
      : condition === "MP" ? "#fbbf24"
      : "#fb7185";

    const isSelected = selectedIds.has(item.id);
    const isDimmed = isSelectionMode && !isSelected;

    if (viewMode === "list") {
      return (
        <Pressable
          onPress={() => handleCardInteract(item)}
          onLongPress={() => handleCardLongPress(item)}
          style={{
            flexDirection: "row", alignItems: "center", gap: 12,
            marginHorizontal: 16, marginBottom: 8,
            backgroundColor: isSelected ? "rgba(199,167,123,0.1)" : "rgba(17,24,39,0.7)",
            borderWidth: 1, borderColor: isSelected ? "rgba(199,167,123,0.5)" : "rgba(255,255,255,0.07)",
            borderRadius: 14, padding: 10,
            opacity: isDimmed ? 0.4 : 1,
          }}
        >
          {isSelectionMode && (
            <View style={{ marginRight: 4 }}>
              {isSelected ? <CheckSquareIcon size={18} color="#c7a77b" /> : <View style={{ width: 16, height: 16, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", borderRadius: 4, margin: 1 }} />}
            </View>
          )}
          {/* Sleeve thumbnail */}
          <View style={{
            width: 44, height: 62, borderRadius: 6, overflow: "hidden",
            backgroundColor: "#0a0f1c",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
          }}>
            <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            {/* Gloss specular on sleeve */}
            <View style={{
              position: "absolute", top: 0, left: 0,
              width: "60%", height: "40%",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderTopLeftRadius: 6,
            }} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: "#ccd6f6", fontWeight: "700", fontSize: 13 }} numberOfLines={1}>{item.name}</Text>
              {isFoil && <ZapIcon size={11} color="#fbbf24" fill="#fbbf24" />}
            </View>
            <Text style={{ color: "#64748b", fontSize: 11, marginTop: 1 }} numberOfLines={1}>{item.set}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: "#c7a77b", fontWeight: "700", fontSize: 13 }}>{formatUsd(item.price)}</Text>
            <Text style={{ color: conditionColor, fontSize: 10, fontWeight: "600", marginTop: 2 }}>{condition}</Text>
          </View>
        </Pressable>
      );
    }

    // ── Grid: Binder Pocket ──────────────────────────────────────────────────
    return (
      <Pressable
        onPress={() => handleCardInteract(item)}
        onLongPress={() => handleCardLongPress(item)}
        style={{ width: cardWidth, marginLeft: isLeftEdge ? 0 : CARD_GAP, marginBottom: CARD_GAP, opacity: isDimmed ? 0.4 : 1 }}
      >
        {({ pressed }: any) => (
          <View style={{
            // The pocket itself — sunken, stitched feel
            backgroundColor: isSelected ? "rgba(199,167,123,0.05)" : "rgba(5,8,18,0.85)",
            borderRadius: 8,
            padding: 3,
            borderWidth: 1,
            borderColor: isSelected ? "rgba(199,167,123,0.5)" : "rgba(255,255,255,0.06)",
            // Inset shadow via layered border trick
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
            elevation: 4,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          }}>
            {/* Card image inside sleeve */}
            <View style={{
              aspectRatio: 5 / 7,
              borderRadius: 5,
              overflow: "hidden",
              backgroundColor: "#060b17",
            }}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0d1529" }}>
                  <Text style={{ color: "#3d4f6e", fontSize: cardWidth * 0.28, fontWeight: "800" }}>
                    {item.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </Text>
                </View>
              )}

              {/* Plastic sleeve gloss overlay */}
              <View
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 5,
                  // diagonal gloss streak
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.09)",
                }}
              />
              {/* Top-left specular highlight */}
              <View style={{
                position: "absolute", top: 0, left: 0,
                width: "55%", height: "35%",
                borderTopLeftRadius: 5,
                backgroundColor: "rgba(255,255,255,0.04)",
              }} />

              {/* NEW badge */}
              {isNew && (
                <View style={{
                  position: "absolute", top: 4, right: 4,
                  backgroundColor: "#c7a77b", borderRadius: 4,
                  paddingHorizontal: 4, paddingVertical: 1,
                }}>
                  <Text style={{ color: "#060b17", fontSize: 7, fontWeight: "800", letterSpacing: 0.5 }}>NEW</Text>
                </View>
              )}

              {/* Foil lightning bolt */}
              {isFoil && (
                <View style={{ position: "absolute", top: 4, left: 4 }}>
                  <ZapIcon size={10} color="#fbbf24" fill="#fbbf24" />
                </View>
              )}

              {/* Condition dot — bottom right */}
              <View style={{
                position: "absolute", bottom: 4, right: 4,
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: conditionColor,
                shadowColor: conditionColor,
                shadowOpacity: 0.8,
                shadowRadius: 3,
                elevation: 2,
              }} />

              {/* Selection Overlay */}
              {isSelectionMode && (
                 <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isSelected ? "rgba(199,167,123,0.15)" : "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" }}>
                   {isSelected && <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#c7a77b", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 4 }}><CheckSquareIcon size={16} color="#060b17" /></View>}
                 </View>
              )}
            </View>

            {/* Label below card — like a penciled name on sleeve */}
            <View style={{ paddingHorizontal: 2, paddingTop: 4, paddingBottom: 1 }}>
              <Text style={{ color: "#a8b2d8", fontSize: 9, fontWeight: "700", letterSpacing: 0.2 }} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 1 }}>
                <Text style={{ color: "#3d4f6e", fontSize: 8, fontWeight: "600", flex: 1, marginRight: 4 }} numberOfLines={1}>
                  {item.set}
                </Text>
                <Text style={{ color: "#c7a77b", fontSize: 9, fontWeight: "700" }}>
                  {formatUsd(item.price)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </Pressable>
    );
  }, [handleCardInteract, handleCardLongPress, viewMode, cardWidth, numColumns, isSelectionMode, selectedIds]);

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
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, maxWidth: 1320, width: "100%", alignSelf: "center", zIndex: 1 }}>
          <View style={{ marginBottom: 20 }}>
            {/* Embossed inside-cover nameplate */}
            <View style={{
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}>
              {/* Gold accent top stripe */}
              <View style={{ height: 3, backgroundColor: "#c7a77b", opacity: 0.8 }} />

              <View style={{
                backgroundColor: "rgba(6,10,20,0.92)",
                padding: 18,
                gap: 12,
              }}>
                <View>
                  <Text style={{ color: "#3d4f6e", fontSize: 9, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 4 }}>
                    Portfolio Value
                  </Text>
                  <Text style={{ color: "#e2e8f0", fontSize: 32, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: -0.5 }}>
                    {formatUsd(portfolioStats.totalValue)}
                  </Text>
                </View>

                <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.04)" }} />

                <View style={{ flexDirection: "row" }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: "#3d4f6e", fontSize: 9, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 4 }}>
                      7D Change
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <TrendingUp size={13} color="#4ade80" />
                      <Text style={{ color: "#4ade80", fontSize: 14, fontWeight: "700" }}>+$124.50</Text>
                    </View>
                  </View>
                  <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.04)" }} />
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <Text style={{ color: "#3d4f6e", fontSize: 9, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 4 }}>
                      Cards
                    </Text>
                    <Text style={{ color: "#ccd6f6", fontSize: 14, fontWeight: "700" }}>{cards.length}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {cards.length === 0 && (
            <View style={{
              marginBottom: 20,
              backgroundColor: "#171b2d",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
              borderRadius: 16,
              overflow: "hidden",
              minHeight: isDesktop ? 220 : undefined,
              flexDirection: isDesktop ? "row" : "column",
            }}>
              {/* Illustration */}
              <View style={{
                alignItems: "center", justifyContent: "center",
                paddingTop: isDesktop ? 24 : 24,
                paddingHorizontal: isDesktop ? 0 : 0,
                width: isDesktop ? 260 : "100%",
                minHeight: isDesktop ? undefined : 160,
              }}>
                <Image
                  source={require("../../assets/images/nano_banana_cards.png")}
                  style={{ width: isDesktop ? 260 : 200, height: isDesktop ? 200 : 155 }}
                  contentFit="contain"
                />
              </View>
              {/* Text */}
              <View style={{
                flex: 1,
                paddingVertical: isDesktop ? 36 : 20,
                paddingHorizontal: isDesktop ? 28 : 20,
                justifyContent: "center",
              }}>
                <Text style={{ fontSize: isDesktop ? 22 : 18, fontWeight: "700", color: "#fff", marginBottom: 6 }}>
                  Add cards{" "}
                  <Text style={{ fontWeight: "400", color: "#a8b2d8" }}>to organize and track your TCG collection</Text>
                </Text>
                <Text style={{ color: "#64748b", fontSize: 13, lineHeight: 22, marginBottom: 18 }}>
                  Upload photos or scan your cards to add them to your binder.
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  <Pressable
                    onPress={() => router.push("/")}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, backgroundColor: "#c7a77b", minHeight: 44 }}
                  >
                    <MaximizeIcon size={15} color="#020617" />
                    <Text style={{ color: "#020617", fontWeight: "700", fontSize: 13 }}>Scan or upload</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Alert.alert("Import collection", "Bulk import from spreadsheets is on the roadmap.")}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 11, minHeight: 44 }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Import collection</Text>
                    <ChevronDownIcon size={13} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* ── Toolbar row ── */}
          {isDesktop ? (
            // Desktop: single row
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <DesktopDropdown
                title="Collection"
                subtitle="Show cards from one game or all"
                selectedId={activeTab}
                onSelect={(id) => setActiveTab(id)}
                panelWidth={260}
                options={[
                  { id: "All", label: "All cards", sub: "Every game in your binder" },
                  ...gameFilterOptions.map((code) => ({ id: code, label: getGameLabel(code) })),
                ]}
                trigger={
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 44, backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                    <BookOpenIcon size={14} color={KadoColors.slateText} />
                    <Text style={{ color: "#ccd6f6", fontSize: 13, fontWeight: "600" }}>{activeTab === "All" ? "All Cards" : getGameLabel(activeTab)}</Text>
                    <ChevronDownIcon size={13} color={KadoColors.slateText} />
                  </View>
                }
              />
              {allTags.length > 0 && (
                <DesktopDropdown
                  title="Filter by Tag"
                  selectedId={activeTagFilter || "all_tags"}
                  onSelect={(id) => setActiveTagFilter(id === "all_tags" ? null : id)}
                  panelWidth={180}
                  options={[
                    { id: "all_tags", label: "All Tags" },
                    ...allTags.map(tag => ({ id: tag, label: tag }))
                  ]}
                  trigger={
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 44, backgroundColor: activeTagFilter ? "rgba(59,130,246,0.2)" : "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: activeTagFilter ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                      <Filter size={14} color={activeTagFilter ? "#93c5fd" : KadoColors.slateText} />
                      <Text style={{ color: activeTagFilter ? "#bfdbfe" : "#ccd6f6", fontSize: 13, fontWeight: "600" }}>{activeTagFilter || "Tags"}</Text>
                      <ChevronDownIcon size={13} color={activeTagFilter ? "#93c5fd" : KadoColors.slateText} />
                    </View>
                  }
                />
              )}
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                <DesktopDropdown
                  title="Sort by"
                  selectedId={sortBy}
                  onSelect={(id) => setSortBy(id as SortBy)}
                  panelWidth={220}
                  options={[
                    { id: "dateAdded", label: "Date added" },
                    { id: "name", label: "Name" },
                    { id: "price", label: "Price" },
                    { id: "rarity", label: "Rarity" },
                    { id: "set", label: "Set" },
                    { id: "number", label: "Card Number" },
                  ]}
                  trigger={
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 42 }}>
                      <SlidersHorizontalIcon size={14} color={KadoColors.slateText} />
                      <Text style={{ color: "#ccd6f6", fontSize: 13, fontWeight: "600" }}>
                        {{ dateAdded: "Date added", name: "Name", price: "Price", rarity: "Rarity", set: "Set", number: "Number" }[sortBy]}
                      </Text>
                      <ChevronDownIcon size={13} color={KadoColors.slateText} />
                    </View>
                  }
                />
                <View style={{ width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.08)" }} />
                <Pressable 
                  onPress={() => setSortDirection(d => d === "asc" ? "desc" : "asc")}
                  style={{ paddingHorizontal: 12, height: 42, justifyContent: "center" }}
                >
                  {sortDirection === "asc" ? <ArrowUpIcon size={16} color={KadoColors.slateText} /> : <ArrowDownIcon size={16} color={KadoColors.slateText} />}
                </Pressable>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", position: "relative" }}>
                <View style={{ position: "absolute", left: 10, zIndex: 1 }}><SearchIcon size={14} color={KadoColors.slateText} /></View>
                <TextInput placeholder="Search binder…" placeholderTextColor="rgba(136,146,176,0.4)" style={{ flex: 1, height: 44, backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10, paddingLeft: 32, paddingRight: 12, fontSize: 13, color: "#ccd6f6" }} value={searchQuery} onChangeText={setSearchQuery} />
              </View>
              <View style={{ flexDirection: "row", backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10, height: 44, overflow: "hidden" }}>
                {(["list", "grid"] as const).map((mode) => (
                  <Pressable key={mode} onPress={() => setViewMode(mode)} style={{ width: 44, height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: viewMode === mode ? "rgba(255,255,255,0.1)" : "transparent" }}>
                    {mode === "list" ? <ListIcon size={15} color={viewMode === mode ? "#ccd6f6" : KadoColors.slateText} /> : <LayoutGrid size={15} color={viewMode === mode ? "#ccd6f6" : KadoColors.slateText} />}
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => void exportBinderCsv()} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                <ExternalLinkIcon size={15} color={KadoColors.slateText} />
              </Pressable>
            </View>
          ) : (
            // Mobile: two rows — filters + view toggle on top, search full-width below
            <View style={{ gap: 8, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <DesktopDropdown
                  title="Collection"
                  subtitle="Show cards from one game or all"
                  selectedId={activeTab}
                  onSelect={(id) => setActiveTab(id)}
                  panelWidth={240}
                  options={[
                    { id: "All", label: "All cards", sub: "Every game in your binder" },
                    ...gameFilterOptions.map((code) => ({ id: code, label: getGameLabel(code) })),
                  ]}
                  trigger={
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 44, backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                      <BookOpenIcon size={13} color={KadoColors.slateText} />
                      <Text style={{ color: "#ccd6f6", fontSize: 12, fontWeight: "600" }} numberOfLines={1}>{activeTab === "All" ? "All" : getGameLabel(activeTab)}</Text>
                      <ChevronDownIcon size={12} color={KadoColors.slateText} />
                    </View>
                  }
                />
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                  <DesktopDropdown
                    title="Sort by"
                    selectedId={sortBy}
                    onSelect={(id) => setSortBy(id as SortBy)}
                    panelWidth={200}
                    options={[
                      { id: "dateAdded", label: "Date added" },
                      { id: "name", label: "Name" },
                      { id: "price", label: "Price" },
                      { id: "rarity", label: "Rarity" },
                      { id: "set", label: "Set" },
                      { id: "number", label: "Card Number" },
                    ]}
                    trigger={
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 42 }}>
                        <SlidersHorizontalIcon size={13} color={KadoColors.slateText} />
                        <Text style={{ color: "#ccd6f6", fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                          {{ dateAdded: "Date", name: "Name", price: "Price", rarity: "Rarity", set: "Set", number: "Number" }[sortBy]}
                        </Text>
                        <ChevronDownIcon size={12} color={KadoColors.slateText} />
                      </View>
                    }
                  />
                  <View style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.08)" }} />
                  <Pressable 
                    onPress={() => setSortDirection(d => d === "asc" ? "desc" : "asc")}
                    style={{ paddingHorizontal: 10, height: 42, justifyContent: "center" }}
                  >
                    {sortDirection === "asc" ? <ArrowUpIcon size={14} color={KadoColors.slateText} /> : <ArrowDownIcon size={14} color={KadoColors.slateText} />}
                  </Pressable>
                </View>
                {allTags.length > 0 && (
                  <DesktopDropdown
                    title="Filter by Tag"
                    selectedId={activeTagFilter || "all_tags"}
                    onSelect={(id) => setActiveTagFilter(id === "all_tags" ? null : id)}
                    panelWidth={160}
                    options={[
                      { id: "all_tags", label: "All Tags" },
                      ...allTags.map(tag => ({ id: tag, label: tag }))
                    ]}
                    trigger={
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 44, backgroundColor: activeTagFilter ? "rgba(59,130,246,0.2)" : "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: activeTagFilter ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                        <Filter size={13} color={activeTagFilter ? "#93c5fd" : KadoColors.slateText} />
                        <Text style={{ color: activeTagFilter ? "#bfdbfe" : "#ccd6f6", fontSize: 12, fontWeight: "600" }} numberOfLines={1}>{activeTagFilter || "Tags"}</Text>
                        <ChevronDownIcon size={12} color={activeTagFilter ? "#93c5fd" : KadoColors.slateText} />
                      </View>
                    }
                  />
                )}
                <View style={{ flex: 1 }} />
                {/* View toggle */}
                <View style={{ flexDirection: "row", backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10, height: 44, overflow: "hidden" }}>
                  {(["list", "grid"] as const).map((mode) => (
                    <Pressable key={mode} onPress={() => setViewMode(mode)} style={{ width: 44, height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: viewMode === mode ? "rgba(255,255,255,0.1)" : "transparent" }}>
                      {mode === "list" ? <ListIcon size={15} color={viewMode === mode ? "#ccd6f6" : KadoColors.slateText} /> : <LayoutGrid size={15} color={viewMode === mode ? "#ccd6f6" : KadoColors.slateText} />}
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={() => void exportBinderCsv()} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10 }}>
                  <ExternalLinkIcon size={15} color={KadoColors.slateText} />
                </Pressable>
              </View>
              {/* Search — full width row */}
              <View style={{ flexDirection: "row", alignItems: "center", position: "relative" }}>
                <View style={{ position: "absolute", left: 10, zIndex: 1 }}><SearchIcon size={14} color={KadoColors.slateText} /></View>
                <TextInput placeholder="Search binder…" placeholderTextColor="rgba(136,146,176,0.4)" style={{ flex: 1, height: 44, backgroundColor: "rgba(10,15,28,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 10, paddingLeft: 32, paddingRight: 12, fontSize: 13, color: "#ccd6f6" }} value={searchQuery} onChangeText={setSearchQuery} />
              </View>
            </View>
          )}
      </View>
      {/* ── Binder Page ─────────────────────────────────────────────────────── */}
      <View style={{ flex: 1, width: "100%", maxWidth: 1320, alignSelf: "center", flexDirection: "row" }}>

        {/* Ring holes — only visible on desktop where we have space */}
        {isDesktop && (
          <View style={{ width: 20, alignItems: "center", justifyContent: "space-evenly", paddingVertical: 32 }}>
            {[0,1,2,3].map((i) => (
              <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.6)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", shadowColor: "#000", shadowOpacity: 0.8, shadowRadius: 3, elevation: 2 }} />
            ))}
          </View>
        )}

        {/* Page surface */}
        <View style={{ flex: 1, backgroundColor: "rgba(8,12,24,0.9)", borderLeftWidth: isDesktop ? 1 : 0, borderRightWidth: isDesktop ? 1 : 0, borderColor: "rgba(255,255,255,0.04)" }}>
          <FlatList
            data={filteredCards}
            renderItem={renderCardItem}
            keyExtractor={(item) => item.id}
            numColumns={viewMode === "grid" ? numColumns : 1}
            key={`${viewMode}-${numColumns}`}
            contentContainerStyle={{ paddingHorizontal: viewMode === "grid" ? GRID_PADDING : 0, paddingTop: 12, paddingBottom: 100, flexGrow: 1 }}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={KadoColors.umber} colors={[KadoColors.umber]} />}
          />
        </View>

        {/* Ring holes — right side, desktop only */}
        {isDesktop && (
          <View style={{ width: 20, alignItems: "center", justifyContent: "space-evenly", paddingVertical: 32 }}>
            {[0,1,2,3].map((i) => (
              <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(0,0,0,0.6)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", shadowColor: "#000", shadowOpacity: 0.8, shadowRadius: 3, elevation: 2 }} />
            ))}
          </View>
        )}
      </View>

      {/* ── Selection Action Bar ─────────────────────────────────────────────── */}
      {isSelectionMode && (
        <View style={{
          position: "absolute", bottom: Platform.OS === "web" ? 32 : 100, left: 0, right: 0,
          alignItems: "center", zIndex: 100
        }}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 12,
            backgroundColor: "rgba(10,15,28,0.95)",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
            borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
            shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5, shadowRadius: 16, elevation: 12
          }}>
            <Pressable onPress={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: "#a8b2d8", fontWeight: "600", fontSize: 13 }}>Cancel</Text>
            </Pressable>
            <View style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.15)" }} />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{selectedIds.size} Selected</Text>
            <View style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.15)" }} />
            <Pressable 
              onPress={() => {
                if (selectedIds.size === filteredCards.length) setSelectedIds(new Set());
                else setSelectedIds(new Set(filteredCards.map(c => c.id)));
              }} 
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <Text style={{ color: "#ccd6f6", fontWeight: "600", fontSize: 13 }}>
                {selectedIds.size === filteredCards.length ? "Deselect All" : "Select All"}
              </Text>
            </Pressable>
            <Pressable 
              onPress={() => void handleBulkDelete()}
              style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(251,113,133,0.15)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(251,113,133,0.3)", flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Trash2Icon size={14} color="#fb7185" />
              <Text style={{ color: "#fb7185", fontWeight: "700", fontSize: 13 }}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}

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
