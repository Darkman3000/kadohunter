import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  Plus,
  ArrowLeftRight,
  LayoutGrid,
  ShoppingBag,
  Zap,
  History,
  ChevronRight,
} from "lucide-react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { KadoColors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { FriendPicker, type PickableFriend } from "../../components/FriendPicker";
import { CardPicker, type PickableCard } from "../../components/CardPicker";
import Animated, { SlideInDown } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TradeTab = "Desk" | "Flea";

export default function TradeScreen() {
  const [activeTab, setActiveTab] = useState<TradeTab>("Desk");
  const { isDesktop, maxPageColumnWidth, availableWidth } = useResponsiveLayout();

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={["top"]}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: isDesktop ? maxPageColumnWidth : undefined,
          alignSelf: isDesktop ? "center" : undefined,
        }}
      >
        {/* ── Top Toggle ── */}
        <View className="items-center py-4">
          <View className="flex-row bg-[#020617] rounded-full p-1 border border-white/5">
            <Pressable 
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab("Desk");
              }}
              className={`flex-row items-center gap-2 px-6 py-2 rounded-full ${activeTab === 'Desk' ? 'bg-amber-500' : ''}`}
            >
              <LayoutGrid size={14} color={activeTab === 'Desk' ? KadoColors.midnight : KadoColors.slateText} />
              <Text className={`text-xs font-black uppercase tracking-widest ${activeTab === 'Desk' ? 'text-midnight' : 'text-slate-text'}`}>Desk</Text>
            </Pressable>
            <Pressable 
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab("Flea");
              }}
              className={`flex-row items-center gap-2 px-6 py-2 rounded-full ${activeTab === 'Flea' ? 'bg-amber-500' : ''}`}
            >
              <ShoppingBag size={14} color={activeTab === 'Flea' ? KadoColors.midnight : KadoColors.slateText} />
              <Text className={`text-xs font-black uppercase tracking-widest ${activeTab === 'Flea' ? 'text-midnight' : 'text-slate-text'}`}>Flea</Text>
            </Pressable>
          </View>
        </View>

        {activeTab === "Desk" ? (
          <TradeDeskView availableWidth={availableWidth} isDesktop={isDesktop} />
        ) : (
          <FleaMarketView isDesktop={isDesktop} availableWidth={availableWidth} />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Trade Desk View ─────────────────────────────────────────────────────────

function TradeSlot({
  card,
  onAdd,
  onRemoveCard,
  size,
}: {
  card?: PickableCard;
  onAdd: () => void;
  onRemoveCard?: () => void;
  size: number;
}) {
  const h = Math.round(size * 1.4);
  const handlePress = () => {
    if (card && onRemoveCard) {
      Alert.alert(card.cardName, "Remove this card from the trade?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRemoveCard();
          },
        },
      ]);
    } else {
      onAdd();
    }
  };
  return card ? (
    <Pressable
      onPress={handlePress}
      style={{ width: size, height: h, borderRadius: 16, overflow: "hidden", backgroundColor: "#0a0f1c", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
      className="active:opacity-80"
    >
      {card.imageUrl ? (
        <Image source={{ uri: card.imageUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0f1c" }}>
          <Text style={{ color: "#94a3b8", fontSize: 10, fontWeight: "700", textAlign: "center", padding: 4 }} numberOfLines={3}>
            {card.cardName}
          </Text>
        </View>
      )}
    </Pressable>
  ) : (
    <Pressable
      onPress={handlePress}
      style={{ width: size, height: h, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}
      className="active:bg-white/5"
    >
      <Plus size={20} color="#475569" strokeWidth={1.5} />
    </Pressable>
  );
}

function TradeDeskView({ availableWidth, isDesktop }: { availableWidth: number; isDesktop: boolean }) {
  const { isSignedIn } = useAuth();
  const openTheirBinderAfterFriendPick = useRef(false);

  const [youValue, setYouValue] = useState(0);
  const [themValue, setThemValue] = useState(0);
  const [isFriendPickerVisible, setIsFriendPickerVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<PickableFriend | null>(null);
  const [isBinderPickerVisible, setIsBinderPickerVisible] = useState(false);
  const [yourCards, setYourCards] = useState<PickableCard[]>([]);
  const [theirCards, setTheirCards] = useState<PickableCard[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCardPickerVisibleForThem, setIsCardPickerVisibleForThem] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser, isSignedIn ? {} : "skip");

  const friendCollection = useQuery(
    api.friends.getFriendCollection,
    selectedFriend ? { friendId: selectedFriend._id } : "skip"
  );

  const myBinder = useQuery(api.users.getBinderScans, {});
  const proposeTrade = useMutation(api.trades.proposeTrade);
  const myTrades = useQuery(api.trades.getMyTrades, isSignedIn ? {} : "skip");
  const acceptTrade = useMutation(api.trades.acceptTrade);
  const rejectTrade = useMutation(api.trades.rejectTrade);
  const cancelTrade = useMutation(api.trades.cancelTrade);

  const canPropose = selectedFriend !== null && yourCards.length > 0 && theirCards.length > 0;
  const diff = youValue - themValue;

  const handleProposeTrade = async () => {
    if (!canPropose || !selectedFriend) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await proposeTrade({
        receiverId: selectedFriend._id,
        proposerCards: yourCards.map((c) => ({
          scanId: c._id,
          cardId: c.cardId,
          cardName: c.cardName,
          imageUrl: c.imageUrl,
          estimatedPrice: c.estimatedPrice ?? c.marketPrice,
        })),
        receiverCards: theirCards.map((c) => ({
          scanId: c._id,
          cardId: c.cardId,
          cardName: c.cardName,
          imageUrl: c.imageUrl,
          estimatedPrice: c.estimatedPrice ?? c.marketPrice,
        })),
      });
      Alert.alert("Trade Proposed!", `Your trade offer has been sent to ${selectedFriend.name}.`);
      setYourCards([]);
      setTheirCards([]);
      setYouValue(0);
      setThemValue(0);
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to propose trade");
    }
  };

  const priceOf = (c: PickableCard) => c.estimatedPrice ?? c.marketPrice ?? 0;

  const addYourCard = (card: PickableCard) => {
    if (yourCards.some((c) => c._id === card._id)) {
      Alert.alert("Already added", "This card is already on your side of the trade.");
      return;
    }
    setYourCards((prev) => [...prev, card]);
    setYouValue((prev) => prev + priceOf(card));
    setIsBinderPickerVisible(false);
  };

  const addTheirCard = (card: PickableCard) => {
    if (theirCards.some((c) => c._id === card._id)) {
      Alert.alert("Already added", "This card is already on their side of the trade.");
      return;
    }
    setTheirCards((prev) => [...prev, card]);
    setThemValue((prev) => prev + priceOf(card));
    setIsCardPickerVisibleForThem(false);
  };

  const removeYourCardById = useCallback((scanId: Id<"savedScans">) => {
    const card = yourCards.find((c) => c._id === scanId);
    if (!card) return;
    setYourCards((prev) => prev.filter((c) => c._id !== scanId));
    setYouValue((v) => v - priceOf(card));
  }, [yourCards]);

  const removeTheirCardById = useCallback((scanId: Id<"savedScans">) => {
    const card = theirCards.find((c) => c._id === scanId);
    if (!card) return;
    setTheirCards((prev) => prev.filter((c) => c._id !== scanId));
    setThemValue((v) => v - priceOf(card));
  }, [theirCards]);

  const openFriendPicker = (openTheirBinderAfter: boolean) => {
    openTheirBinderAfterFriendPick.current = openTheirBinderAfter;
    setIsFriendPickerVisible(true);
  };

  const onFriendSelected = (f: PickableFriend) => {
    setSelectedFriend(f);
    setIsFriendPickerVisible(false);
    if (openTheirBinderAfterFriendPick.current) {
      openTheirBinderAfterFriendPick.current = false;
      setIsCardPickerVisibleForThem(true);
    }
  };

  const openTheirCardPicker = () => {
    if (!selectedFriend) {
      openFriendPicker(true);
      return;
    }
    setIsCardPickerVisibleForThem(true);
  };

  const handleAcceptTrade = async (tradeId: Id<"trades">) => {
    try {
      await acceptTrade({ tradeId });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Trade accepted", "Card ownership has been updated.");
    } catch (e: unknown) {
      Alert.alert("Could not accept", e instanceof Error ? e.message : "Try again.");
    }
  };

  const handleRejectTrade = async (tradeId: Id<"trades">) => {
    try {
      await rejectTrade({ tradeId });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: unknown) {
      Alert.alert("Could not reject", e instanceof Error ? e.message : "Try again.");
    }
  };

  const handleCancelTrade = (tradeId: Id<"trades">) => {
    Alert.alert("Cancel trade offer?", "Your friend will no longer see this proposal.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel offer",
        style: "destructive",
        onPress: () => {
          void cancelTrade({ tradeId })
            .then(() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            })
            .catch((e: unknown) => {
              Alert.alert("Could not cancel", e instanceof Error ? e.message : "Try again.");
            });
        },
      },
    ]);
  };

  // Card slot sizing: responsive based on available width
  const isTablet = availableWidth >= 600;
  const cardSlotSize = isDesktop
    ? Math.min(90, Math.floor((availableWidth / 2 - 120) / 3))
    : isTablet
    ? Math.min(80, Math.floor((availableWidth - 160) / 6))
    : Math.min(76, Math.floor((availableWidth - 80) / 3));

  const minSlots = isDesktop || isTablet ? 6 : 4;
  const yourSlotCount = Math.min(12, Math.max(minSlots, yourCards.length + 1));
  const theirSlotCount = Math.min(12, Math.max(minSlots, theirCards.length + 1));

  const tradeList = myTrades ?? [];
  const thumbLeftPct =
    youValue + themValue <= 0
      ? 50
      : Math.min(92, Math.max(8, (youValue / (youValue + themValue)) * 100));

  const fairValueBadge = (
    <View
      style={{
        backgroundColor: "#0b0e17",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 9, fontWeight: "900", color: "#f59e0b", letterSpacing: 2, marginBottom: 4, textTransform: "uppercase" }}>
        ÷ FAIR VALUE
      </Text>
      <Text style={{ fontSize: 24, fontWeight: "900", color: "#fff" }}>
        {diff === 0 ? "0.00" : diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} $
      </Text>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fde047" }} />
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399" }} />
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#38bdf8" }} />
      </View>
    </View>
  );

  const valueMeter = (
    <View style={{ width: "100%", height: 44, borderRadius: 14, backgroundColor: "#0b0e17", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", overflow: "hidden", justifyContent: "center" }}>
      <View style={{ position: "absolute", top: 12, left: 14, right: 14, height: 4, borderRadius: 4, flexDirection: "row", overflow: "hidden" }}>
        <View style={{ flex: 0.45, backgroundColor: "#ef4444" }} />
        <View style={{ width: 3, backgroundColor: "#0b0e17" }} />
        <View style={{ flex: 0.55, backgroundColor: "#10b981" }} />
      </View>
      <View
        style={{
          position: "absolute",
          top: 9,
          left: `${thumbLeftPct}%`,
          marginLeft: -7,
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: "#fde047",
          borderWidth: 3,
          borderColor: "#0b0e17",
        }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 20 }}>
        <Text style={{ fontSize: 9, fontWeight: "900", color: "#ef4444", letterSpacing: 1, textTransform: "uppercase" }}>Under</Text>
        <Text style={{ fontSize: 9, fontWeight: "900", color: "#84cc16", letterSpacing: 1, textTransform: "uppercase" }}>Fair</Text>
        <Text style={{ fontSize: 9, fontWeight: "900", color: "#38bdf8", letterSpacing: 1, textTransform: "uppercase" }}>Over ↑</Text>
      </View>
    </View>
  );

  const renderCardSlots = (cards: PickableCard[], count: number, isTheir: boolean) =>
    Array.from({ length: count }).map((_, i) => {
      const c = cards[i];
      return (
        <TradeSlot
          key={c?._id ?? `empty-${isTheir ? "t" : "y"}-${i}`}
          card={c}
          size={cardSlotSize}
          onAdd={() => (isTheir ? openTheirCardPicker() : setIsBinderPickerVisible(true))}
          onRemoveCard={
            c ? () => (isTheir ? removeTheirCardById(c._id) : removeYourCardById(c._id)) : undefined
          }
        />
      );
    });

  const historyPanel =
    showHistory && tradeList.length === 0 ? (
      <View style={{ marginHorizontal: isDesktop || isTablet ? 24 : 16, marginTop: 16, backgroundColor: "#020617", borderRadius: 16, padding: 20, alignItems: "center" }}>
        <Text style={{ color: "#8892b0", fontSize: 14, textAlign: "center" }}>No trades yet. Propose a trade to see it here.</Text>
      </View>
    ) : showHistory ? (
      <View style={{ marginHorizontal: isDesktop || isTablet ? 24 : 16, marginTop: 16, backgroundColor: "#020617", borderRadius: 16, padding: 16 }}>
        {tradeList.map((trade) => {
          const uid = currentUser?._id;
          const isReceiver = uid !== undefined && trade.receiverId === uid;
          const isProposer = uid !== undefined && trade.proposerId === uid;
          const pending = trade.status === "proposed";
          return (
            <View
              key={trade._id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.05)",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <View style={{ flex: 1, minWidth: 160 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                  {trade.proposerName} → {trade.receiverName}
                </Text>
                <Text style={{ color: "#8892b0", fontSize: 10, marginTop: 2 }}>
                  {trade.proposerCards.length} cards ↔ {trade.receiverCards.length} cards
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {trade.status === "proposed" && <Text style={{ color: "#f59e0b", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Pending</Text>}
                {trade.status === "accepted" && <Text style={{ color: "#4ade80", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Accepted</Text>}
                {trade.status === "rejected" && <Text style={{ color: "#fb7185", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Rejected</Text>}
                {trade.status === "cancelled" && <Text style={{ color: "#94a3b8", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Cancelled</Text>}
                {pending && isReceiver && (
                  <>
                    <Pressable
                      onPress={() => void handleAcceptTrade(trade._id)}
                      style={{ backgroundColor: "#059669", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                    >
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleRejectTrade(trade._id)}
                      style={{ backgroundColor: "rgba(251,113,133,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                    >
                      <Text style={{ color: "#fb7185", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Reject</Text>
                    </Pressable>
                  </>
                )}
                {pending && isProposer && (
                  <Pressable
                    onPress={() => handleCancelTrade(trade._id)}
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                  >
                    <Text style={{ color: "#cbd5e1", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Cancel</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </View>
    ) : null;

  // ── DESKTOP: side-by-side panes ───────────────────────────────────────────
  if (isDesktop || isTablet) {
    return (
      <View style={{ flex: 1, flexDirection: "column" }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {/* Two-pane trade area */}
          <View style={{ flexDirection: "row", flex: 1, paddingHorizontal: 24, paddingTop: 8, gap: 16 }}>

            {/* THEM pane */}
            <View style={{ flex: 1, backgroundColor: "rgba(10,15,28,0.6)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 20, padding: 20, gap: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, fontWeight: "900", color: "#8892b0", textTransform: "uppercase", letterSpacing: 2 }}>THEM</Text>
                {selectedFriend ? (
                  <Pressable onPress={() => openFriendPicker(false)}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#f59e0b" }}>{selectedFriend.name}</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => openFriendPicker(true)}
                    style={{ backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "900", color: "#f59e0b", textTransform: "uppercase", letterSpacing: 1 }}>Select Friend</Text>
                  </Pressable>
                )}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {renderCardSlots(theirCards, theirSlotCount, true)}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#8892b0", textTransform: "uppercase", letterSpacing: 1 }}>Value</Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}>${themValue.toFixed(2)}</Text>
              </View>
            </View>

            {/* Center: Fair Value + meter */}
            <View style={{ width: 140, alignItems: "center", justifyContent: "center", gap: 16 }}>
              {fairValueBadge}
              <View style={{ width: 1, flex: 1, maxHeight: 60, backgroundColor: "rgba(255,255,255,0.06)" }} />
              <ArrowLeftRight size={20} color="#475569" />
              <View style={{ width: 1, flex: 1, maxHeight: 60, backgroundColor: "rgba(255,255,255,0.06)" }} />
              {valueMeter}
            </View>

            {/* YOU pane */}
            <View style={{ flex: 1, backgroundColor: "rgba(10,15,28,0.6)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 20, padding: 20, gap: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, fontWeight: "900", color: "#8892b0", textTransform: "uppercase", letterSpacing: 2 }}>YOU</Text>
                <Pressable
                  onPress={() => setIsBinderPickerVisible(true)}
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "900", color: "#ccd6f6", textTransform: "uppercase", letterSpacing: 1 }}>My Binder</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {renderCardSlots(yourCards, yourSlotCount, false)}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#8892b0", textTransform: "uppercase", letterSpacing: 1 }}>Value</Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}>${youValue.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {historyPanel}
        </ScrollView>

        {/* Footer actions */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, backgroundColor: "#0f1523", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => setIsBinderPickerVisible(true)}
              style={{ flex: 1, backgroundColor: "#222736", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
              className="active:bg-[#2c3345]"
            >
              <Text style={{ fontSize: 10, fontWeight: "900", color: "#ccd6f6", textTransform: "uppercase", letterSpacing: 3 }}>My Binder</Text>
            </Pressable>
            <Pressable
              onPress={() => (!selectedFriend ? openFriendPicker(true) : openTheirCardPicker())}
              style={{ flex: 1, backgroundColor: "#f59e0b", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
              className="active:scale-95"
            >
              <Text style={{ fontSize: 10, fontWeight: "900", color: "#1e1302", textTransform: "uppercase", letterSpacing: 3 }}>
                {selectedFriend ? "Pick Friend Cards" : "Select Friend"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleProposeTrade}
              disabled={!canPropose}
              style={{ flex: 1, backgroundColor: canPropose ? "#ea580c" : "#f59e0b", paddingVertical: 14, borderRadius: 12, alignItems: "center", opacity: canPropose ? 1 : 0.7 }}
              className="active:scale-95"
            >
              <Text style={{ fontSize: 10, fontWeight: "900", color: canPropose ? "#fff" : "#7c2d12", textTransform: "uppercase", letterSpacing: 3 }}>Propose Trade</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowHistory(!showHistory)}
              style={{ width: 48, backgroundColor: "#222736", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              className="active:bg-[#2c3345]"
            >
              <History size={16} color="#8892b0" />
            </Pressable>
          </View>
        </View>

        <FriendPicker isVisible={isFriendPickerVisible} onClose={() => setIsFriendPickerVisible(false)} onSelect={onFriendSelected} />
        <CardPicker
          isVisible={isBinderPickerVisible}
          onClose={() => setIsBinderPickerVisible(false)}
          onSelect={addYourCard}
          title="My Binder"
          cards={myBinder}
          excludeScanIds={yourCards.map((c) => c._id)}
        />
        <CardPicker
          isVisible={isCardPickerVisibleForThem}
          onClose={() => setIsCardPickerVisibleForThem(false)}
          onSelect={addTheirCard}
          title={`${selectedFriend?.name || "Friend"}'s Binder`}
          cards={friendCollection}
          excludeScanIds={theirCards.map((c) => c._id)}
        />
      </View>
    );
  }

  // ── MOBILE: stacked single-column ────────────────────────────────────────
  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* THEM section */}
        <View style={{ backgroundColor: "rgba(10,15,28,0.6)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 20, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "900", color: "#8892b0", textTransform: "uppercase", letterSpacing: 2 }}>THEM</Text>
            <Pressable
              onPress={() => (!selectedFriend ? openFriendPicker(true) : openTheirCardPicker())}
              style={{ backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
            >
              <Text style={{ fontSize: 11, fontWeight: "900", color: "#f59e0b", textTransform: "uppercase", letterSpacing: 1 }}>
                {selectedFriend ? selectedFriend.name : "Select Friend"}
              </Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {renderCardSlots(theirCards, theirSlotCount, true)}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>${themValue.toFixed(2)}</Text>
          </View>
        </View>

        {/* Fair value bar */}
        <View style={{ alignItems: "center", gap: 8 }}>
          {fairValueBadge}
          {valueMeter}
        </View>

        {/* YOU section */}
        <View style={{ backgroundColor: "rgba(10,15,28,0.6)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 20, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "900", color: "#8892b0", textTransform: "uppercase", letterSpacing: 2 }}>YOU</Text>
            <Pressable
              onPress={() => setIsBinderPickerVisible(true)}
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
            >
              <Text style={{ fontSize: 11, fontWeight: "900", color: "#ccd6f6", textTransform: "uppercase", letterSpacing: 1 }}>My Binder</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {renderCardSlots(yourCards, yourSlotCount, false)}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>${youValue.toFixed(2)}</Text>
          </View>
        </View>

        {historyPanel}
      </ScrollView>

      {/* Footer */}
      <View style={{ padding: 16, backgroundColor: "#0f1523", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => setIsBinderPickerVisible(true)}
            style={{ flex: 1, backgroundColor: "#222736", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ fontSize: 10, fontWeight: "900", color: "#ccd6f6", textTransform: "uppercase", letterSpacing: 2 }}>My Binder</Text>
          </Pressable>
          <Pressable
            onPress={() => (!selectedFriend ? openFriendPicker(true) : openTheirCardPicker())}
            style={{ flex: 1, backgroundColor: "#f59e0b", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ fontSize: 10, fontWeight: "900", color: "#1e1302", textTransform: "uppercase", letterSpacing: 2 }}>
              {selectedFriend ? "Pick Cards" : "Select Friend"}
            </Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => setShowHistory(!showHistory)}
            style={{ width: 48, backgroundColor: "#222736", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 12, alignItems: "center", justifyContent: "center", height: 48 }}
          >
            <History size={16} color="#8892b0" />
          </Pressable>
          <Pressable
            onPress={() => (selectedFriend ? openFriendPicker(false) : openFriendPicker(true))}
            style={{ width: 48, backgroundColor: "#222736", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 12, alignItems: "center", justifyContent: "center", height: 48 }}
          >
            <Text style={{ fontSize: 9, fontWeight: "900", color: "#8892b0", textTransform: "uppercase" }}>Friend</Text>
          </Pressable>
          <Pressable
            onPress={handleProposeTrade}
            disabled={!canPropose}
            style={{ flex: 1, backgroundColor: canPropose ? "#ea580c" : "#f59e0b", paddingVertical: 14, borderRadius: 12, alignItems: "center", opacity: canPropose ? 1 : 0.7 }}
          >
            <Text style={{ fontSize: 10, fontWeight: "900", color: canPropose ? "#fff" : "#7c2d12", textTransform: "uppercase", letterSpacing: 3 }}>Propose Trade</Text>
          </Pressable>
        </View>
      </View>

      <FriendPicker isVisible={isFriendPickerVisible} onClose={() => setIsFriendPickerVisible(false)} onSelect={onFriendSelected} />
      <CardPicker
        isVisible={isBinderPickerVisible}
        onClose={() => setIsBinderPickerVisible(false)}
        onSelect={addYourCard}
        title="My Binder"
        cards={myBinder}
        excludeScanIds={yourCards.map((c) => c._id)}
      />
      <CardPicker
        isVisible={isCardPickerVisibleForThem}
        onClose={() => setIsCardPickerVisibleForThem(false)}
        onSelect={addTheirCard}
        title={`${selectedFriend?.name || "Friend"}'s Binder`}
        cards={friendCollection}
        excludeScanIds={theirCards.map((c) => c._id)}
      />
    </View>
  );
}

// ─── Flea Market View ────────────────────────────────────────────────────────

function FleaMarketView({ isDesktop, availableWidth }: { isDesktop: boolean; availableWidth: number }) {
  const router = useRouter();
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const activeSession = useQuery(
    api.sessions.getActiveSession,
    deviceId ? { deviceId } : "skip"
  );
  const stagedScans = useQuery(
    api.users.getStagedScans,
    deviceId ? { deviceId } : {}
  );
  const sessionHistory = useQuery(api.sessions.getSessionHistory, {});

  const startSession = useMutation(api.sessions.startSession);
  const endSession = useMutation(api.sessions.endSession);

  React.useEffect(() => {
    let cancelled = false;
    void getOrCreateDeviceId().then((id) => {
      if (!cancelled) setDeviceId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartSession = async () => {
    if (!deviceId) {
      Alert.alert("Device initializing", "Please wait a second and try again.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startSession({ deviceId, title: `Hunt @ ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` });
    router.push("/(tabs)/" as any);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await endSession({ sessionId: activeSession._id });
    Alert.alert("Session Saved", "Your hunt has been archived to your History.");
  };

  const sessionScans = stagedScans?.filter(s => s.sessionId === activeSession?._id) || [];
  const sessionTotal = sessionScans.reduce((sum, s) => sum + (s.marketPrice ?? 0), 0);

  return (
    <>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, flexDirection: isDesktop ? "row" : "column", padding: isDesktop ? 24 : 16, gap: isDesktop ? 24 : 16, alignItems: isDesktop ? "flex-start" : undefined }}>
        
        {/* Left column on desktop: header + session control */}
        <View style={{ flex: isDesktop ? 0 : undefined, width: isDesktop ? 360 : undefined, gap: 16 }}>
          <View>
            <Text style={{ fontSize: isDesktop ? 28 : 32, fontWeight: "900", color: "#fff", lineHeight: isDesktop ? 34 : 40 }}>Flea Market{"\n"}Sessions</Text>
            <Text style={{ color: "#8892b0", marginTop: 8, fontSize: 14, lineHeight: 22 }}>
              Track real-time value during your hunts. Scan piles, calculate totals, and save session history.
            </Text>
          </View>

          {!activeSession ? (
            <Pressable 
              onPress={handleStartSession}
              style={{ backgroundColor: "#f59e0b", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 16, gap: 10 }}
              className="active:scale-[0.98]"
            >
              <Zap size={20} color={KadoColors.midnight} />
              <Text style={{ color: KadoColors.midnight, fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 4 }}>Start Live Session</Text>
            </Pressable>
          ) : (
            <View style={{ backgroundColor: "#0a192f", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", padding: 20, borderRadius: 24, gap: 16, overflow: "hidden" }}>
              <View style={{ position: "absolute", right: -20, top: -20, opacity: 0.05 }}>
                <Zap size={120} color={KadoColors.umber} />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View>
                  <Text style={{ color: "#f59e0b", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 3, marginBottom: 4 }}>Active Session</Text>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>{activeSession.title}</Text>
                </View>
                <View style={{ backgroundColor: "rgba(245,158,11,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" }}>
                  <Text style={{ color: "#f59e0b", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Live</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 24 }}>
                <View>
                  <Text style={{ color: "#64748b", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 }}>Scanned</Text>
                  <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>{sessionScans.length}</Text>
                </View>
                <View>
                  <Text style={{ color: "#64748b", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 }}>Total Value</Text>
                  <Text style={{ color: "#4ade80", fontSize: 22, fontWeight: "900" }}>${sessionTotal.toFixed(2)}</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => router.push("/(tabs)/" as any)}
                  style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12, textTransform: "uppercase" }}>Scan More</Text>
                </Pressable>
                <Pressable
                  onPress={handleEndSession}
                  style={{ flex: 1, backgroundColor: "#f59e0b", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
                  className="active:scale-95"
                >
                  <Text style={{ color: KadoColors.midnight, fontWeight: "900", fontSize: 12, textTransform: "uppercase" }}>End & Save</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Right column on desktop / full width on mobile: scan history */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}>
              {activeSession ? "Session Queue" : "Recent Scans"}
            </Text>
            <Pressable
              onPress={() => setShowSessionHistory(true)}
              accessibilityRole="button"
              accessibilityLabel="Session history"
              style={{ padding: 8 }}
            >
              <History size={16} color={KadoColors.slateText} />
            </Pressable>
          </View>

          {stagedScans === undefined ? (
            <ActivityIndicator color={KadoColors.umber} />
          ) : stagedScans.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40, borderRadius: 20, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.06)" }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <ShoppingBag size={24} color={KadoColors.slateText} />
              </View>
              <Text style={{ color: "#ccd6f6", fontSize: 16, fontWeight: "700" }}>Ready to Hunt?</Text>
              <Text style={{ color: "#8892b0", fontSize: 12, marginTop: 6, textAlign: "center", paddingHorizontal: 32 }}>
                Your session history is empty. Start scanning at your next card show or shop visit.
              </Text>
            </View>
          ) : (
            stagedScans.map((scan) => (
              <Pressable 
                key={scan._id}
                onPress={() => router.push(`/card/${scan._id}?mode=staged` as any)}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}
                className="active:bg-white/5 px-2"
              >
                <View style={{ width: 44, height: 60, borderRadius: 8, overflow: "hidden", backgroundColor: "#0a192f", marginRight: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
                  {scan.imageUrl && <Image source={{ uri: scan.imageUrl }} style={{ width: "100%", height: "100%" }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }} numberOfLines={1}>{scan.cardName}</Text>
                  <Text style={{ color: "#8892b0", fontSize: 10, marginTop: 3, textTransform: "uppercase", letterSpacing: 2 }}>{scan.gameCode}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>${scan.marketPrice?.toFixed(2) || "0.00"}</Text>
                  <ChevronRight size={14} color={KadoColors.slateText} />
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </ScrollView>

    <Modal visible={showSessionHistory} animationType="fade" transparent onRequestClose={() => setShowSessionHistory(false)}>
      <Pressable
        className="flex-1 bg-black/80 justify-end"
        onPress={() => setShowSessionHistory(false)}
      >
        <AnimatedPressable
          entering={SlideInDown.duration(250)}
          onPress={(e) => e.stopPropagation()}
          className="bg-midnight rounded-t-[32px] border-t border-white/10 p-6 pb-10 max-h-[80%]"
        >
          <Text className="text-white text-xl font-black mb-1">Session history</Text>
          <Text className="text-slate-text text-xs mb-4 uppercase tracking-widest">Completed flea market hunts</Text>
          {sessionHistory === undefined ? (
            <ActivityIndicator color={KadoColors.umber} />
          ) : sessionHistory.length === 0 ? (
            <Text className="text-slate-text text-sm py-8 text-center">No completed sessions yet. End a live session to save it here.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {sessionHistory.map((s) => (
                <View
                  key={s._id}
                  className="py-4 border-b border-white/5"
                >
                  <Text className="text-white font-bold text-base" numberOfLines={2}>{s.title ?? "Session"}</Text>
                  <Text className="text-slate-text text-xs mt-1">
                    {s.completedAt ? new Date(s.completedAt).toLocaleString() : ""}
                  </Text>
                  <View className="flex-row gap-6 mt-2">
                    <Text className="text-slate-text text-xs">
                      <Text className="text-white font-bold">{s.cardCount}</Text> cards
                    </Text>
                    <Text className="text-emerald-400 text-xs font-black">${s.totalValue.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          <Pressable
            onPress={() => setShowSessionHistory(false)}
            className="mt-4 py-3 items-center rounded-xl bg-white/5 border border-white/10"
          >
            <Text className="text-light-slate font-bold">Close</Text>
          </Pressable>
        </AnimatedPressable>
      </Pressable>
    </Modal>
    </>
  );
}
