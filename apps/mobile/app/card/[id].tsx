import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  Gamepad2,
  Minus,
  Trash2,
  X,
  TrendingDown,
  TrendingUp,
  Star,
  ExternalLink,
  Plus as PlusIconLucide,
  Minus as MinusIconLucide,
  Heart,
  Plus,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { Svg, Path, Defs, LinearGradient, Stop, Circle, Polyline, Text as SvgText } from "react-native-svg";
import { KadoColors } from "@/constants/theme";
import { BREAKPOINTS } from "@/constants/breakpoints";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import type { Card, CardCondition, TCG } from "@kado/contracts";
import { supportedGames } from "@kado/domain";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

const CloseIcon = X as React.ComponentType<any>;
const StarIcon = Star as React.ComponentType<any>;
const MinusIcon = MinusIconLucide as React.ComponentType<any>;
const PlusIconStyled = PlusIconLucide as React.ComponentType<any>;
const PlusIcon = PlusIconLucide as React.ComponentType<any>;
const HeartIcon = Heart as React.ComponentType<any>;

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 3,
});

function formatUsd(value: number) {
  let formatted = USD_FORMATTER.format(value).replace("$", "");
  // Ensure we don't end up with comma for thousands dropping the dot for fractions if it's .000
  // But standard usage in mock was 26.643 $ and 18.111 $
  return formatted.trim() + " $";
}

// Mock Price History Data for the Graph
const MOCK_PRICE_HISTORY = {
  tcgplayer: [24, 25, 24.5, 26, 25.5, 27, 26.643],
  cardmarket: [18, 19, 18.2, 18.8, 18.4, 18.9, 18.111],
  ebay: [21, 22, 21.5, 22.5, 21.8, 23, 22.219],
};

function PriceGraph({ width, height, data }: { width: number; height: number; data: any[] }) {
  if (!data || data.length < 2) {
    return (
      <View style={{ width, height, alignSelf: "center", marginVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
         <Text className="text-slate-text text-xs italic">Building price history...</Text>
      </View>
    );
  }

  // Calculate scales
  const maxPrice = Math.max(...data.map(d => d.price)) * 1.1;
  const minPrice = Math.max(0, Math.min(...data.map(d => d.price)) * 0.9);
  const diff = maxPrice - minPrice || 1;

  const points = data
    .slice()
    .reverse()
    .map((v, i) => {
      const x = (i * width) / (data.length - 1);
      const y = height - ((v.price - minPrice) * height) / diff;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={{ width, height, alignSelf: "center", marginVertical: 24 }}>
      <Svg width={width} height={height}>
         {/* Grid Lines with Y-Axis Labels */}
         {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
           const yVal = height - (p * height) - (p === 1 ? -6 : p === 0 ? 6 : 0); // Slight padding adjust for top/bottom
           // Highest grid line at p=1 (price=maxPrice), Lowest at p=0 (price=minPrice)
           const priceLabel = Math.round(minPrice + (diff * p)).toString();
           
           return (
             <React.Fragment key={i}>
                <Path 
                  d={`M 30 ${yVal} L ${width} ${yVal}`} 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeWidth="1" 
                />
                <SvgText 
                  x="0" 
                  y={yVal + 3} 
                  fill="#8892b0" 
                  fontSize="10"
                >
                  {priceLabel}
                </SvgText>
             </React.Fragment>
           );
         })}
         
         {/* Polyline mapped with a 30px left margin for the text */}
         <Polyline 
           points={data.slice().reverse().map((v, i) => {
              const xPos = 30 + (i * (width - 30)) / (Math.max(1, data.length - 1));
              const yPos = height - ((v.price - minPrice) * height) / diff;
              return `${xPos},${yPos}`;
           }).join(" ")} 
           fill="none" 
           stroke="#2563eb" 
           strokeWidth="2.5" 
         />
         
         {/* Dots for points if few */}
         {data.length < 15 && data.slice().reverse().map((v, i) => {
            const xPos = 30 + (i * (width - 30)) / (Math.max(1, data.length - 1));
            const yPos = height - ((v.price - minPrice) * height) / diff;
            return <Circle key={i} cx={xPos} cy={yPos} r="3" fill="#2563eb" />;
         })}
      </Svg>
    </View>
  );
}

export default function CardDetailScreen() {
  const router = useRouter();
  const { id, cardId, gameCode, mode } = useLocalSearchParams<{ 
    id: string; 
    cardId?: string; 
    gameCode?: string; 
    mode?: 'binder' | 'market' | 'staged';
  }>();
  const { width: windowWidth } = useWindowDimensions();
  const { maxPageColumnWidth } = useResponsiveLayout();
  const isDesktop = windowWidth >= BREAKPOINTS.DESKTOP;
  const detailColumnMaxWidth = Math.min(960, maxPageColumnWidth);
  
  const scanId = id as string;
  const viewMode = mode || (scanId === "market" ? "market" : "binder");

  // Multi-source data fetching
  const binderCard = useQuery(api.users.getCardById, 
    viewMode === "binder" ? { scanId: scanId as Id<"savedScans"> } : "skip"
  );
  
  const marketCard = useQuery(api.prices.getCardByExternalId,
    viewMode === "market" && cardId && gameCode 
      ? { cardId, gameCode: gameCode as any } 
      : "skip"
  );

  const stagedCard = useQuery(api.users.getStagedScanById,
    viewMode === "staged" ? { stagedId: scanId as Id<"stagedScans"> } : "skip"
  );

  const rawCard = binderCard || marketCard || stagedCard;

  const displayCard = useMemo(() => {
    if (!rawCard) return null;
    
    let name = "";
    let set = "";
    let img = "";
    let rare = "RARE";
    let num = "N/A";
    let price = 0;
    
    if (binderCard) {
      const card = binderCard as any;
      name = card.cardName;
      set = card.setName || "";
      img = card.imageUrl || "";
      rare = card.rarity || "RARE";
      num = card.number || "N/A";
    } else if (stagedCard) {
      const card = stagedCard as any;
      name = card.cardName;
      set = card.setName || "";
      img = card.imageUrl || "";
      rare = card.rarity || "RARE";
      num = "N/A";
    } else if (marketCard) {
      const card = marketCard as any;
      name = card.cardName;
      set = card.setName || "";
      img = card.imageUrl || "";
      rare = card.rarity || "RARE";
      price = card.marketPrice || 0;
    }

    return { name, set, img, rare, num, price };
  }, [binderCard, marketCard, stagedCard]);

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const updateCardQuantity = useMutation(api.users.updateCardQuantity);
  const toggleFavoriteMut = useMutation(api.users.toggleFavorite);

  // Sync internal state when card loads
  useEffect(() => {
    if (binderCard) {
      setQuantity((binderCard as any).quantity ?? 1);
      setIsFavorite((binderCard as any).isFavorite ?? false);
    } else {
      setQuantity(1);
    }
  }, [binderCard]);

  const latestPrice = useQuery(
    api.prices.getLatestPrice,
    rawCard ? { cardId: (rawCard as any).cardId, gameCode: (rawCard as any).gameCode } : "skip"
  );

  const historicalData = useQuery(
    api.prices.getHistoricalData,
    rawCard ? { cardId: (rawCard as any).cardId, gameCode: (rawCard as any).gameCode, limit: 30 } : "skip"
  );

  const priceChangeStr = useMemo(() => {
    if (!historicalData || historicalData.length < 2 || !latestPrice) return "+0.0%";
    const oldest = historicalData[historicalData.length - 1].price;
    if (oldest <= 0) return "+0.0%";
    const pct = ((latestPrice.marketPrice - oldest) / oldest) * 100;
    return pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
  }, [historicalData, latestPrice]);

  const syncPrice = useAction(api.prices.syncPrice);
  const toggleWishlist = useMutation(api.wishlists.toggleWishlistItem);
  const isOnWishlist = useQuery(
    api.wishlists.isOnWishlist,
    rawCard ? { cardId: (rawCard as any).cardId, gameCode: (rawCard as any).gameCode } : "skip"
  );

  useEffect(() => {
    if (rawCard && (!latestPrice || latestPrice.isStale)) {
        setIsSyncing(true);
        syncPrice({ cardId: (rawCard as any).cardId, gameCode: (rawCard as any).gameCode, cardName: (rawCard as any).cardName || "Unknown" })
            .finally(() => setIsSyncing(false));
    }
  }, [(rawCard as any)?.cardId, latestPrice === null]);

  if (rawCard === undefined || !displayCard) {
    return (
      <View className="flex-1 bg-midnight items-center justify-center">
        <ActivityIndicator color={KadoColors.umber} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: KadoColors.midnight }} edges={["top", "bottom"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View
          style={{
            width: isDesktop ? detailColumnMaxWidth : "100%",
            alignSelf: "center",
            paddingHorizontal: isDesktop ? 40 : 20,
            paddingTop: 20,
          }}
        >
          
          {/* Header Row */}
          <View className="flex-row items-start justify-between mb-8">
            <View className="flex-row gap-6">
              <View 
                className="rounded-xl overflow-hidden bg-black border border-white/5"
                style={{ width: isDesktop ? 160 : 120, aspectRatio: 0.72 }}
              >
                <Image source={{ uri: displayCard.img }} style={{ width: '100%', height: '100%', borderRadius: 12 }} contentFit="cover" />
                <View className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60">
                   <Text className="text-white text-[10px] font-bold">x{quantity}</Text>
                </View>
              </View>

              <View className="justify-center">
                <Text className="text-umber text-[11px] font-bold uppercase tracking-widest mb-1">{displayCard.rare}</Text>
                <Text className="text-white text-3xl font-black mb-1">{displayCard.name}</Text>
                <Text className="text-slate-text text-sm">{displayCard.set} • {displayCard.num}</Text>
                
                <Pressable
                  onPress={() => {
                    setIsFavorite(!isFavorite);
                    if (viewMode === "binder" && scanId) {
                      toggleFavoriteMut({ scanId: scanId as any });
                    }
                  }}
                  className={`flex-row items-center gap-2 px-6 py-2.5 rounded-full mt-4 border ${isFavorite ? 'bg-umber/10 border-umber/30' : 'bg-white/5 border-white/10'}`}
                >
                  <StarIcon size={14} color={isFavorite ? KadoColors.umber : KadoColors.slateText} fill={isFavorite ? KadoColors.umber : 'transparent'} />
                  <Text className={`text-xs font-bold ${isFavorite ? 'text-umber' : 'text-slate-text'}`}>
                    {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <Pressable 
                onPress={async () => {
                  if (!rawCard) return;
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  await toggleWishlist({
                    cardId: (rawCard as any).cardId,
                    gameCode: (rawCard as any).gameCode,
                    cardName: (rawCard as any).cardName,
                    setName: (rawCard as any).setName,
                    imageUrl: (rawCard as any).imageUrl,
                  });
                }}
                className={`w-10 h-10 rounded-full items-center justify-center border ${isOnWishlist ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/10'}`}
              >
                <HeartIcon 
                  size={18} 
                  color={isOnWishlist ? "#fb7185" : KadoColors.lightSlate} 
                  fill={isOnWishlist ? "#fb7185" : "transparent"} 
                />
              </Pressable>

              <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10">
                <CloseIcon size={18} color={KadoColors.lightSlate} />
              </Pressable>
            </View>
          </View>

          <View className="flex-row justify-end mb-4">
             <View className="flex-row items-center gap-2">
                 {isSyncing && <ActivityIndicator size="small" color={KadoColors.umber} className="mr-2" />}
                 {['1W', '1M', '3M', 'All'].map(t => (
                   <View key={t} className={`px-2 py-1 rounded-full ${t === '3M' ? 'bg-[#D6A65E] border-none' : 'bg-white/5 border border-white/10'}`}>
                      <Text className={`text-[10px] font-bold ${t === '3M' ? 'text-black' : 'text-slate-text'}`}>{t}</Text>
                   </View>
                 ))}
                 <View className="px-2 py-1 rounded-full bg-white/5 border border-white/10 items-center justify-center flex-row gap-1">
                    <Text className="text-[10px] font-bold text-slate-text">All</Text>
                    <BookOpenIcon color={KadoColors.slateText} size={10} />
                 </View>
             </View>
          </View>

          <PriceGraph
            width={
              isDesktop
                ? Math.min(detailColumnMaxWidth - 80, 1040)
                : windowWidth - 40
            }
            height={isDesktop ? 220 : 200}
            data={historicalData ?? []}
          />

          <View className="flex-row items-center justify-center gap-6 mb-10">
             <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <Text className="text-[10px] font-bold text-slate-text">{latestPrice?.source || 'Primary Source'}</Text>
             </View>
             {latestPrice?.updatedAt && (
                <Text className="text-[10px] text-slate-text/60">
                  Updated: {new Date(latestPrice.updatedAt).toLocaleDateString()}
                </Text>
             )}
          </View>

          {/* Pricing Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10">
             <MarketCard
               platform={latestPrice?.source || "TCGplayer"}
               price={latestPrice?.marketPrice || displayCard.price || 0}
               change={priceChangeStr}
               listings={12}
               active
             />
             <MarketCard platform="Cardmarket" price={(latestPrice?.marketPrice || displayCard.price || 0) * 0.9} change="N/A" listings={8} />
             <MarketCard platform="eBay" price={(latestPrice?.marketPrice || displayCard.price || 0) * 1.05} change="N/A" listings={24} />
          </ScrollView>

          {/* Tags */}
          <View className="mb-10">
            <View className="flex-row items-center justify-between mb-4">
               <View className="flex-row items-center gap-2">
                  <BookOpenIcon color={KadoColors.slateText} size={14} />
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-white/60">TAGS</Text>
               </View>
               <Pressable className="w-6 h-6 rounded-md bg-white/5 border border-white/10 items-center justify-center">
                  <PlusIcon size={12} color={KadoColors.slateText} />
               </Pressable>
            </View>
            <View className="flex-row gap-2">
                <View className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex-row items-center gap-2">
                   <Text className="text-xs font-bold text-blue-400">Grail</Text>
                   <CloseIcon size={10} color="#60a5fa" />
                </View>
                <View className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex-row items-center gap-2">
                   <Text className="text-xs font-bold text-blue-400">Vault</Text>
                   <CloseIcon size={10} color="#60a5fa" />
                </View>
            </View>
          </View>

          {/* Inventory */}
          <View className="mb-10">
             <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xs font-bold text-white/60">Inventory <Text className="text-white">Total: 1</Text></Text>
                <Text className="text-xs font-black text-emerald-400">26.643 $</Text>
             </View>

             <View className="p-4 rounded-2xl bg-white/5 border border-white/5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                   <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 items-center justify-center">
                      <Text className="text-xs font-black text-emerald-400">NM</Text>
                   </View>
                   <View>
                      <Text className="text-sm font-bold text-white">Normal</Text>
                      <Text className="text-[10px] text-slate-text">Added: 29.3.2026</Text>
                   </View>
                </View>

                <View className="flex-row items-center gap-4">
                   <Pressable onPress={() => {
                      const newQty = Math.max(1, quantity - 1);
                      setQuantity(newQty);
                      if (viewMode === "binder" && scanId) {
                        updateCardQuantity({ scanId: scanId as any, quantity: newQty });
                      }
                   }} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center">
                      <MinusIcon size={14} color="white" />
                   </Pressable>
                   <Text className="text-sm font-bold text-white">{quantity}</Text>
                   <Pressable onPress={() => {
                      const newQty = quantity + 1;
                      setQuantity(newQty);
                      if (viewMode === "binder" && scanId) {
                        updateCardQuantity({ scanId: scanId as any, quantity: newQty });
                      }
                   }} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center">
                      <PlusIconStyled size={14} color="white" />
                   </Pressable>
                </View>
             </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MarketCard({ platform, price, change, listings, active = false }: { platform: string, price: number, change: string, listings: number, active?: boolean }) {
  const isUp = change.startsWith('+');
  
  return (
    <View 
      className={`mr-4 p-5 rounded-2xl border ${active ? 'bg-blue-600/10 border-blue-500/40' : 'bg-white/5 border-white/5 opacity-40'}`}
      style={{ width: 180 }}
    >
      <View className="flex-row items-center gap-2 mb-3">
         <View className={`w-1.5 h-1.5 rounded-full ${platform === 'TCGplayer' ? 'bg-blue-600' : platform === 'Cardmarket' ? 'bg-amber-400' : 'bg-rose-500'}`} />
         <Text className="text-[11px] font-bold text-slate-text">{platform}</Text>
      </View>
      
      <Text className="text-2xl font-black text-white mb-0.5">{formatUsd(price)}</Text>
      <View className="flex-row items-center gap-1.5 mb-2">
         <Text className={`text-[11px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>{change}</Text>
         <View className="px-1.5 py-0.5 rounded bg-white/10">
            <Text className="text-[8px] font-black text-white/60">PRO</Text>
         </View>
      </View>
      
      <Text className="text-[10px] text-slate-text mb-4">{listings} listings</Text>
      
      <Pressable className={`py-2 rounded-lg items-center justify-center ${active ? 'bg-blue-600' : 'bg-white/10'}`}>
         <Text className="text-[10px] font-bold text-white">Buy on {platform}</Text>
      </Pressable>
    </View>
  )
}

function BookOpenIcon({ color, size }: { color: string, size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </Svg>
  );
}
