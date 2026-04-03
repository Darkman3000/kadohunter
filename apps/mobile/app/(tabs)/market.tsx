import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { KadoColors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  BarChart3,
  TrendingUp,
  Zap,
  Heart,
  ShieldAlert,
} from "lucide-react-native";

function renderIcon(Icon: React.ComponentType<any>, props: Record<string, unknown>) {
  return <Icon {...props} />;
}

const MARKET_SUB_TABS = ["Dashboard", "Analytics", "Arbitrage", "Wishlist"] as const;
type MarketSubTab = (typeof MARKET_SUB_TABS)[number];

export default function MarketScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsiveLayout();

  const [marketSubTab, setMarketSubTab] = useState<MarketSubTab>("Dashboard");
  const [isFeedRefreshing, setIsFeedRefreshing] = useState(false);

  const dashboardCards = useQuery(api.prices.getMarketDashboard, { limit: 20 });
  const tickerData = useQuery(api.prices.getMarketTicker, {});
  const feedConfig = useQuery(api.prices.getMarketFeedConfig, {});
  const fetchMarketFeed = useAction(api.prices.fetchMarketFeed);

  // Auto-refresh: trigger fetchMarketFeed if data is stale (>1h)
  useEffect(() => {
    const shouldRefresh =
      !feedConfig ||
      Date.now() - (feedConfig?.lastRefreshedAt ?? 0) > 60 * 60 * 1000;

    if (shouldRefresh && !isFeedRefreshing && feedConfig?.status !== "refreshing") {
      setIsFeedRefreshing(true);
      fetchMarketFeed({})
        .then(() => setIsFeedRefreshing(false))
        .catch(() => setIsFeedRefreshing(false));
    }
  }, [feedConfig]);

  const lastUpdatedLabel = feedConfig?.lastRefreshedAt
    ? `Updated ${Math.round((Date.now() - feedConfig.lastRefreshedAt) / 60000)}m ago`
    : "Syncing...";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: KadoColors.midnight }}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 40,
          alignSelf: isDesktop ? "center" : "auto",
          width: isDesktop ? 1100 : "100%",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Scrolling Ticker Bar ── */}
        {tickerData && tickerData.length > 0 && (
          <View className="bg-[#020617] border-b border-white/5 py-2.5 mb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 24 }}
            >
              {[...tickerData, ...tickerData].map((item, i) => (
                <View key={`ticker-${i}`} className="flex-row items-center gap-2">
                  <Text className="text-[11px] font-bold text-white/70 uppercase">
                    {item.cardName}
                  </Text>
                  <Text
                    className={`text-[11px] font-bold ${item.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {item.changePercent >= 0 ? "+" : ""}
                    {item.changePercent}%
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Header ── */}
        <View className={`${isDesktop ? "px-10" : "px-5"} pt-4 mb-6`}>
          <Text className="text-3xl font-black text-white mb-2">
            Market Intelligence
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <Text className="text-sm text-slate-400">
              Live Global Index • {lastUpdatedLabel}
            </Text>
            {(isFeedRefreshing || feedConfig?.status === "refreshing") && (
              <ActivityIndicator size="small" color={KadoColors.umber} />
            )}
          </View>
        </View>

        {/* ── Navigation Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className={`${isDesktop ? "px-10" : "px-5"} mb-6`}
        >
          {MARKET_SUB_TABS.map((tab) => {
            const isActive = tab === marketSubTab;
            const tabIcon =
              tab === "Dashboard"
                ? BarChart3
                : tab === "Analytics"
                  ? TrendingUp
                  : tab === "Arbitrage"
                    ? Zap
                    : Heart;

            return (
              <Pressable
                key={tab}
                onPress={() => setMarketSubTab(tab)}
                className={`flex-row items-center gap-2 px-5 py-2.5 rounded-full mr-3 border ${isActive ? "bg-amber-500/90 border-amber-500" : "bg-transparent border-white/10"}`}
              >
                {renderIcon(tabIcon, {
                  size: 14,
                  color: isActive ? KadoColors.midnight : KadoColors.slateText,
                })}
                <Text
                  className={`text-xs font-bold ${isActive ? "text-midnight" : "text-slate-text"}`}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Dashboard Content ── */}
        {marketSubTab === "Dashboard" && (
          <View className={`${isDesktop ? "px-10" : "px-5"}`}>
            {/* Loading */}
            {dashboardCards === undefined && (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color={KadoColors.umber} />
                <Text className="text-slate-text text-sm mt-4">
                  Loading market data...
                </Text>
              </View>
            )}

            {/* Empty */}
            {dashboardCards?.length === 0 && (
              <View className="py-12 items-center bg-navy/40 rounded-3xl border border-white/10">
                {renderIcon(BarChart3, { size: 40, color: KadoColors.slateText })}
                <Text className="text-light-slate text-base font-bold mt-4">
                  No Market Data Yet
                </Text>
                <Text className="text-slate-text text-sm mt-2 text-center px-8">
                  Market data is being synced from TCGplayer and YGOProDeck.
                </Text>
                <Pressable
                  onPress={() => {
                    setIsFeedRefreshing(true);
                    fetchMarketFeed({}).finally(() =>
                      setIsFeedRefreshing(false),
                    );
                  }}
                  className="mt-6 bg-amber-500 px-8 py-3 rounded-2xl active:scale-95"
                >
                  <Text className="text-midnight text-xs font-black uppercase tracking-widest">
                    Sync Now
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Card List */}
            {dashboardCards && dashboardCards.length > 0 && (
              <View className="gap-0">
                {dashboardCards.map((card) => (
                  <Pressable
                    key={`${card.cardId}-${card.gameCode}`}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      router.push(
                        `/card/market?cardId=${encodeURIComponent(card.cardId)}&gameCode=${card.gameCode}` as any,
                      );
                    }}
                    className="flex-row items-center py-4 active:bg-white/5 border-b border-white/5"
                  >
                    {/* Thumbnail */}
                    <View className="w-[72px] h-[100px] rounded-lg overflow-hidden bg-[#0a192f] border border-white/5 mr-4">
                      {card.imageUrl ? (
                        <Image
                          source={{ uri: card.imageUrl }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          {renderIcon(BarChart3, {
                            size: 20,
                            color: KadoColors.slateText,
                          })}
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View className="flex-1 justify-center">
                      <Text
                        className="text-base font-bold text-white mb-1"
                        numberOfLines={1}
                      >
                        {card.cardName}
                      </Text>
                      <Text className="text-xs text-slate-400" numberOfLines={1}>
                        {card.setName || card.gameCode.toUpperCase()}
                      </Text>
                      <Text className="text-lg font-black text-white mt-2">
                        {Math.round(card.marketPrice)}{" "}
                        <Text className="text-sm text-slate-text">$</Text>
                      </Text>
                    </View>

                    {/* Change */}
                    <View className="items-end pl-4">
                      <Text
                        className={`text-sm font-bold ${card.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {card.changePercent >= 0 ? "+" : ""}
                        {card.changePercent}%
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Latest Intelligence */}
            {dashboardCards && dashboardCards.length > 0 && (
              <View className="mt-10 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-black text-white">
                    Latest Intelligence
                  </Text>
                  <Pressable>
                    <Text className="text-sm font-bold text-amber-500">
                      View All
                    </Text>
                  </Pressable>
                </View>
                <View className="bg-navy/40 border border-white/10 rounded-2xl p-5">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 items-center justify-center">
                      {renderIcon(Zap, { size: 18, color: "#f59e0b" })}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-white">
                        Intelligence feed connecting...
                      </Text>
                      <Text className="text-xs text-slate-400 mt-1">
                        News and analysis from TCG sources coming soon
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Coming Soon Tabs ── */}
        {marketSubTab !== "Dashboard" && (
          <View className={`${isDesktop ? "px-10" : "px-5"} py-16 items-center`}>
            <View className="bg-navy/40 border border-white/10 rounded-3xl p-8 items-center w-full">
              {renderIcon(ShieldAlert, { size: 36, color: KadoColors.slateText })}
              <Text className="text-light-slate text-lg font-bold mt-4">
                {marketSubTab}
              </Text>
              <Text className="text-slate-text text-sm mt-2 text-center">
                {marketSubTab === "Analytics"
                  ? "Advanced market analytics and trend detection arriving in v2."
                  : marketSubTab === "Arbitrage"
                    ? "Cross-platform price comparison engine arriving in v2."
                    : "Track your wishlist cards and get alerts when prices drop."}
              </Text>
              <View className="mt-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                <Text className="text-[10px] font-bold text-slate-text uppercase tracking-widest">
                  Coming Soon
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
