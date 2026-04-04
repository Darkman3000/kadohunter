import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { KadoColors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  BarChart3,
  TrendingUp,
  Zap,
  ShieldAlert,
  ChevronRight,
  Info,
  User,
} from "lucide-react-native";

function renderIcon(Icon: React.ComponentType<any>, props: Record<string, unknown>) {
  return <Icon {...props} />;
}

const HUNTER_NET_TABS = ["Pulse", "Market", "Arbitrage", "News"] as const;
type HunterNetTab = (typeof HUNTER_NET_TABS)[number];

function MarketCardRow({ card, toggleWishlist, router }: any) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        router.push(
          `/card/market?cardId=${encodeURIComponent(card.cardId)}&gameCode=${card.gameCode}` as any,
        );
      }}
      className="flex-row items-center py-4 active:bg-white/5 border-b border-white/5"
    >
      <View className="w-[72px] h-[100px] rounded-lg overflow-hidden bg-[#0a192f] border border-white/5 mr-4">
        {card.imageUrl && <Image source={{ uri: card.imageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />}
      </View>
      <View className="flex-1 justify-center">
        <Text className="text-base font-bold text-white mb-1" numberOfLines={1}>{card.cardName}</Text>
        <Text className="text-xs text-slate-400" numberOfLines={1}>{card.setName || card.gameCode.toUpperCase()}</Text>
        <View className="flex-row items-center gap-3 mt-2">
            <Text className="text-lg font-black text-white">{Math.round(card.marketPrice)} <Text className="text-sm text-slate-text">$</Text></Text>
            <View className={`px-2 py-0.5 rounded-md ${card.changePercent >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                <Text className={`text-[10px] font-bold ${card.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {card.changePercent >= 0 ? "+" : ""}{card.changePercent}%
                </Text>
            </View>
        </View>
      </View>
      <View className="items-end gap-3 pl-4">
        <Pressable
           onPress={async (e) => {
             e.stopPropagation();
             void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
             await toggleWishlist({
                cardId: card.cardId,
                gameCode: card.gameCode,
                cardName: card.cardName,
                setName: card.setName,
                imageUrl: card.imageUrl
             });
           }}
           className="p-3 rounded-2xl bg-white/5 active:bg-white/10"
        >
            {renderIcon(Zap, { size: 18, color: KadoColors.slateText })}
        </Pressable>
      </View>
    </Pressable>
  );
}

function MarketTab({ dashboardCards, tickerData, lastUpdatedLabel, isFeedRefreshing, feedConfig }: any) {
    const toggleWishlist = useMutation(api.wishlists.toggleWishlistItem);
    const router = useRouter();

    return (
      <View>
        {/* Ticker Bar */}
        {tickerData && tickerData.length > 0 && (
          <View className="bg-[#020617] border-y border-white/5 py-2.5 mb-6">
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

        <View className={`px-5`}>
            <View className="flex-row items-center gap-2 mb-8">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <Text className="text-sm text-slate-400">
                Live Global Index • {lastUpdatedLabel}
              </Text>
              {(isFeedRefreshing || feedConfig?.status === "refreshing") && (
                <ActivityIndicator size="small" color={KadoColors.umber} />
              )}
            </View>

            {/* Card List */}
            {dashboardCards === undefined ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color={KadoColors.umber} />
              </View>
            ) : dashboardCards.length === 0 ? (
              <View className="py-12 items-center bg-navy/40 rounded-3xl border border-white/10">
                <Text className="text-light-slate text-base font-bold">No Market Data Yet</Text>
              </View>
            ) : (
              <View className="gap-0">
                {dashboardCards.map((card: any) => (
                    <MarketCardRow key={`${card.cardId}-${card.gameCode}`} card={card} toggleWishlist={toggleWishlist} router={router} />
                ))}
              </View>
            )}
        </View>
      </View>
    );
}

export default function HunterNetScreen() {
  const router = useRouter();
  const { isDesktop, maxPageColumnWidth } = useResponsiveLayout();

  const [activeTab, setActiveTab] = useState<HunterNetTab>("Pulse");
  const [isFeedRefreshing, setIsFeedRefreshing] = useState(false);

  const dashboardCards = useQuery(api.prices.getMarketDashboard, { limit: 20 });
  const tickerData = useQuery(api.prices.getMarketTicker, {});
  const feedConfig = useQuery(api.prices.getMarketFeedConfig, {});
  const fetchMarketFeed = useAction(api.prices.fetchMarketFeed);
  
  const sharedSessions = useQuery(api.sessions.getSharedSessions, {});

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
          width: "100%",
          maxWidth: isDesktop ? maxPageColumnWidth : undefined,
          alignSelf: isDesktop ? "center" : undefined,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className={`${isDesktop ? "px-10" : "px-5"} pt-6 mb-6`}>
          <Text className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400 mb-2">
            Hunter Net
          </Text>
          <Text className="text-3xl font-black text-white">
            Global Intelligence
          </Text>
        </View>

        {/* Navigation Pills */}
        <View className={`sticky top-0 z-10 pt-2 pb-6 ${isDesktop ? 'px-10' : 'px-5'}`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {HUNTER_NET_TABS.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab);
                  }}
                  className={`px-6 py-2.5 rounded-full border transition-all mr-3 ${isActive ? 'bg-amber-500 border-amber-500 shadow-md' : 'bg-navy/40 border-white/10'}`}
                >
                  <Text className={`text-xs font-bold ${isActive ? 'text-midnight' : 'text-slate-500'}`}>{tab}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Pulse View */}
        {activeTab === "Pulse" && (
          <View className={`${isDesktop ? "px-10" : "px-5"} mt-2`}>
              <View style={isDesktop ? { flexDirection: 'row', gap: 20 } : {}}>
                  <Pressable style={isDesktop ? { flex: 1.5 } : {}} className="flex-row items-center gap-4 p-5 border border-amber-500/20 rounded-2xl relative overflow-hidden bg-amber-500/5 active:scale-[0.98] mb-4">
                      <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></View>
                      <View className="flex-1">
                          <Text className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.25em] mb-1">Daily Brief</Text>
                          <Text className="text-sm text-slate-300 font-medium" numberOfLines={1}>3 high-value matches detected in your network.</Text>
                      </View>
                      <View className="p-2 bg-amber-500/20 rounded-xl">
                          {renderIcon(ChevronRight, { size: 20, color: "#f59e0b" })}
                      </View>
                  </Pressable>
              </View>

              {/* Shared Sessions (Judging Flow) */}
              {sharedSessions && sharedSessions.length > 0 && (
                <View className="mb-8">
                  <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] mb-4">Community Signals</Text>
                  {sharedSessions.map((session: any) => (
                    <View key={session._id} className="bg-navy/40 border border-white/10 p-6 rounded-[32px] mb-4 shadow-soft-lg">
                      <View className="flex-row items-center justify-between mb-6 border-b border-white/5 pb-6">
                        <View className="flex-row items-center gap-4">
                          <View className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 items-center justify-center">
                            <User size={22} color={KadoColors.umber} />
                          </View>
                          <View>
                            <Text className="text-base font-bold text-white mb-0.5">{session.ownerName.toUpperCase()}</Text>
                            <Text className="text-xs text-slate-400">{session.ownerTag} • SHARED HUNT</Text>
                          </View>
                        </View>
                        <View className="bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full">
                           <Text className="text-blue-400 text-[10px] font-bold uppercase">{session.cardCount} CARDS</Text>
                        </View>
                      </View>

                      <Text className="text-base text-white mb-6 leading-relaxed font-medium">Shared a new flea market session: "{session.title}". Total estimated value: {session.totalValue.toFixed(2)}$</Text>

                      <View className="flex-row items-center justify-between pt-6 border-t border-white/5">
                        <View className="flex-row items-center gap-4">
                          <Pressable className="bg-white/5 px-6 py-3 rounded-2xl active:bg-white/10">
                            <Text className="text-white text-xs font-bold">View Session</Text>
                          </Pressable>
                        </View>
                        <Pressable 
                          className="bg-amber-500 px-8 py-3 rounded-2xl active:scale-95 shadow-xl shadow-amber-500/30"
                          onPress={() => {
                            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert("Judging Coming Soon", "The ability to judge and comment on sessions is arriving in v1.1!");
                          }}
                        >
                          <Text className="text-midnight text-xs font-black uppercase tracking-widest">Judge Hunt</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={isDesktop ? { width: '100%', maxWidth: 800 } : {}} className="bg-navy/40 border border-white/10 p-6 rounded-[32px] mb-6 shadow-soft-lg">
                  <View className="flex-row items-center justify-between mb-6 border-b border-white/5 pb-6">
                      <View className="flex-row items-center gap-4">
                          <View className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 items-center justify-center shadow-lg">
                              {renderIcon(Zap, { size: 22, color: "#3b82f6" })}
                          </View>
                          <View>
                              <Text className="text-base font-bold text-white mb-0.5">MATCH_ALERT</Text>
                              <Text className="text-xs text-slate-400">2m ago • COMMUNITY</Text>
                          </View>
                      </View>
                      <View className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                          <Text className="text-emerald-400 text-[10px] font-bold uppercase">95 SCORE</Text>
                      </View>
                  </View>

                  <Text className="text-base text-white mb-6 leading-relaxed font-medium">Network identifies "Black Lotus" (Unlimited) for your base set dupes. Estimated EV match: +$12.50.</Text>

                  <View className="flex-row gap-6 mb-6">
                      <View className="rounded-2xl overflow-hidden border border-white/10 w-40 h-56 shadow-2xl bg-[#020617] px-2 py-2 items-center justify-center">
                          <Image 
                            source={{ uri: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg?1614638838' }} 
                            style={{ width: '100%', height: '100%', borderRadius: 12 }} 
                            contentFit="contain" 
                          />
                      </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-6 border-t border-white/5">
                     <View className="flex-row items-center gap-8">
                        <Pressable className="flex-row items-center gap-2.5">
                            {renderIcon(Info, { size: 20, color: KadoColors.slateText })}
                            <Text className="text-sm font-bold text-slate-400">Details</Text>
                        </Pressable>
                     </View>
                     <Pressable className="bg-amber-500 px-8 py-3 rounded-2xl active:scale-95 shadow-xl shadow-amber-500/30">
                          <Text className="text-midnight text-xs font-black uppercase tracking-widest">Review Match</Text>
                     </Pressable>
                  </View>
              </View>

              <View className="py-12 items-center opacity-40">
                  <Text className="text-xs text-slate-500 font-black uppercase tracking-[0.4em]">End of Signal</Text>
              </View>
          </View>
        )}

        {/* Market View */}
        {activeTab === "Market" && (
          <MarketTab 
            dashboardCards={dashboardCards}
            tickerData={tickerData}
            lastUpdatedLabel={lastUpdatedLabel}
            isFeedRefreshing={isFeedRefreshing}
            feedConfig={feedConfig}
          />
        )}

        {/* Arbitrage & News Placeholders */}
        {(activeTab === "Arbitrage" || activeTab === "News") && (
          <View className={`${isDesktop ? "px-10" : "px-5"} py-16 items-center`}>
            <View className="bg-navy/40 border border-white/10 rounded-3xl p-8 items-center w-full">
              {renderIcon(ShieldAlert, { size: 36, color: KadoColors.slateText })}
              <Text className="text-light-slate text-lg font-bold mt-4">{activeTab}</Text>
              <Text className="text-slate-text text-sm mt-2 text-center">
                {activeTab === "Arbitrage" 
                  ? "Cross-platform price comparison engine arriving in v2." 
                  : "Latest TCG news, set releases, and ban list updates arriving in v2."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
