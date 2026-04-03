import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { 
  Plus, 
  ArrowLeftRight, 
  LayoutGrid, 
  ShoppingBag,
  Zap,
  Info,
  History,
  Trash2,
  ChevronRight
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { api } from "../../../../convex/_generated/api";
import { KadoColors } from "@/constants/theme";
import { FriendPicker } from "../../components/FriendPicker";
import { CardPicker } from "../../components/CardPicker";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type TradeTab = "Desk" | "Flea";

export default function TradeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TradeTab>("Desk");
  
  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={["top"]}>
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

      {activeTab === "Desk" ? <TradeDeskView /> : <FleaMarketView />}
    </SafeAreaView>
  );
}

// ─── Trade Desk View ─────────────────────────────────────────────────────────

function TradeDeskView() {
  const [youValue, setYouValue] = useState(0);
  const [themValue, setThemValue] = useState(0);
  const [isFriendPickerVisible, setIsFriendPickerVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [isBinderPickerVisible, setIsBinderPickerVisible] = useState(false);
  const [yourCards, setYourCards] = useState<any[]>([]);
  const [theirCards, setTheirCards] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const friendCollection = useQuery(
    api.friends.getFriendCollection,
    selectedFriend ? { friendId: selectedFriend._id } : "skip"
  );

  const myBinder = useQuery(api.users.getBinderScans, {});
  const proposeTrade = useMutation(api.trades.proposeTrade);
  const myTrades = useQuery(api.trades.getMyTrades, {});
  const acceptTrade = useMutation(api.trades.acceptTrade);
  const rejectTrade = useMutation(api.trades.rejectTrade);

  const canPropose = selectedFriend && yourCards.length > 0 && theirCards.length > 0;

  const handleProposeTrade = async () => {
    if (!canPropose) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await proposeTrade({
        receiverId: selectedFriend._id,
        proposerCards: yourCards.map((c: any) => ({
          scanId: c._id,
          cardId: c.cardId,
          cardName: c.cardName,
          imageUrl: c.imageUrl,
          estimatedPrice: c.estimatedPrice ?? c.marketPrice,
        })),
        receiverCards: theirCards.map((c: any) => ({
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
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to propose trade");
    }
  };

  const addYourCard = (card: any) => {
    setYourCards([...yourCards, card]);
    setYouValue(prev => prev + (card.marketPrice || 0));
    setIsBinderPickerVisible(false);
  };

  const addTheirCard = (card: any) => {
    setTheirCards([...theirCards, card]);
    setThemValue(prev => prev + (card.marketPrice || 0));
    setIsCardPickerVisibleForThem(false);
  };

  const [isCardPickerVisibleForThem, setIsCardPickerVisibleForThem] = useState(false);

  const diff = youValue - themValue;

  return (
    <View className="flex-1">
      {/* THEM SIDE (Top) */}
      <View className="flex-1 bg-navy/20 border-b border-white/5 justify-center items-center relative">
         <View className="absolute top-4 right-6 items-end">
           <Text className="text-[10px] font-black text-slate-text/40 uppercase tracking-tighter">
             {selectedFriend ? selectedFriend.name.toUpperCase() : "THEM"}
           </Text>
           <Text className="text-xl font-bold text-white/50">{themValue.toFixed(2)} $</Text>
         </View>
         
         <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 flex-row gap-4 h-[160px]">
           {theirCards.length === 0 ? (
             <View className="items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-8 active:scale-95 active:bg-white/5 h-[160px] w-[120px]">
               <Plus size={32} color={KadoColors.slateText} />
             </View>
           ) : (
             theirCards.map((card, i) => (
               <View key={i} className="w-[100px] h-[140px] rounded-2xl overflow-hidden bg-navy border border-white/10">
                 {card.imageUrl && <Image source={{ uri: card.imageUrl }} style={{ width: '100%', height: '100%' }} />}
               </View>
             ))
           )}
         </ScrollView>
      </View>

      {/* MID BAR (The Balancer) */}
      <View className="h-[60px] flex-row items-center justify-center px-6 relative z-10">
         <View className="absolute h-[1px] w-full bg-white/5 left-0" />
         <View className="bg-[#020617] border border-white/10 px-4 py-2 rounded-full flex-row items-center gap-3">
             <View className="w-2 h-2 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
             <Text className={`text-xs font-black ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {diff === 0 ? "0.00" : (diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2))}
             </Text>
             <Text className="text-[10px] font-bold text-white/40 uppercase tracking-widest">DIVIDE</Text>
         </View>
      </View>

      {/* YOU SIDE (Bottom) */}
      <View className="flex-1 bg-navy/40 justify-center items-center relative">
         <View className="absolute bottom-4 left-6">
           <Text className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">YOU</Text>
           <Text className="text-xl font-bold text-white">{youValue.toFixed(2)} $</Text>
         </View>

         <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 flex-row gap-4 h-[160px]">
           {yourCards.length === 0 ? (
             <View className="items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-8 active:scale-95 active:bg-white/5 h-[160px] w-[120px]">
               <Plus size={32} color={KadoColors.slateText} />
             </View>
           ) : (
             yourCards.map((card, i) => (
                <View key={i} className="w-[100px] h-[140px] rounded-2xl overflow-hidden bg-navy border border-white/10">
                  {card.imageUrl && <Image source={{ uri: card.imageUrl }} style={{ width: '100%', height: '100%' }} />}
                </View>
             ))
           )}
         </ScrollView>
      </View>

      {/* Actions */}
      <View className="px-6 py-4 border-t border-white/5 bg-[#020617]">
        <View className="flex-row gap-4 mb-3">
           <Pressable
             onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsBinderPickerVisible(true);
             }}
             className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl items-center"
           >
              <Text className="text-xs font-black text-white uppercase tracking-widest">My Binder</Text>
           </Pressable>
           <Pressable
             onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (!selectedFriend) {
                  setIsFriendPickerVisible(true);
                } else {
                  setIsCardPickerVisibleForThem(true);
                }
             }}
             className={`flex-1 bg-amber-500 py-4 rounded-2xl items-center justify-center active:scale-95 ${!selectedFriend ? 'bg-amber-500/20' : ''}`}
           >
              <Text className="text-midnight font-black text-xs uppercase tracking-widest">{selectedFriend ? "Pick Friend cards" : "Select Friend"}</Text>
           </Pressable>
        </View>
        <View className="flex-row gap-4">
           <Pressable
             onPress={() => setShowHistory(!showHistory)}
             className="flex-1 bg-white/5 border border-white/10 py-3 rounded-2xl items-center flex-row justify-center gap-2"
           >
              <History size={14} color={KadoColors.slateText} />
              <Text className="text-xs font-black text-slate-text uppercase tracking-widest">History</Text>
           </Pressable>
           <Pressable
             onPress={handleProposeTrade}
             disabled={!canPropose}
             className={`flex-1 py-3 rounded-2xl items-center justify-center flex-row gap-2 active:scale-95 ${canPropose ? 'bg-emerald-500' : 'bg-white/5 border border-white/10'}`}
           >
              <ArrowLeftRight size={14} color={canPropose ? KadoColors.midnight : KadoColors.slateText} />
              <Text className={`text-xs font-black uppercase tracking-widest ${canPropose ? 'text-midnight' : 'text-slate-text'}`}>Propose Trade</Text>
           </Pressable>
        </View>
      </View>

      {/* Trade History */}
      {showHistory && myTrades && myTrades.length > 0 && (
        <View className="px-6 py-4 bg-[#020617] border-t border-white/5 max-h-[200px]">
          <ScrollView showsVerticalScrollIndicator={false}>
            {myTrades.map((trade: any) => (
              <View key={trade._id} className="flex-row items-center py-3 border-b border-white/5">
                <View className="flex-1">
                  <Text className="text-white text-xs font-bold">
                    {trade.proposerName} → {trade.receiverName}
                  </Text>
                  <Text className="text-slate-text text-[10px] mt-1">
                    {trade.proposerCards.length} cards ↔ {trade.receiverCards.length} cards
                  </Text>
                </View>
                <View className="items-end">
                  {trade.status === "proposed" && trade.receiverId === trade.receiverId && (
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => acceptTrade({ tradeId: trade._id })}
                        className="bg-emerald-500/20 px-3 py-1 rounded-full"
                      >
                        <Text className="text-emerald-400 text-[10px] font-bold">Accept</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => rejectTrade({ tradeId: trade._id })}
                        className="bg-rose-500/20 px-3 py-1 rounded-full"
                      >
                        <Text className="text-rose-400 text-[10px] font-bold">Reject</Text>
                      </Pressable>
                    </View>
                  )}
                  <View className={`px-3 py-1 rounded-full mt-1 ${
                    trade.status === "proposed" ? "bg-amber-500/20" :
                    trade.status === "accepted" ? "bg-emerald-500/20" :
                    "bg-white/5"
                  }`}>
                    <Text className={`text-[10px] font-black uppercase ${
                      trade.status === "proposed" ? "text-amber-400" :
                      trade.status === "accepted" ? "text-emerald-400" :
                      "text-slate-text"
                    }`}>{trade.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Friend Picker Modal */}
      <FriendPicker 
        isVisible={isFriendPickerVisible}
        onClose={() => setIsFriendPickerVisible(false)}
        onSelect={(friend) => {
          setSelectedFriend(friend);
          setIsFriendPickerVisible(false);
          setIsCardPickerVisibleForThem(true);
        }}
      />

      {/* Binder Picker (Yours) */}
      <CardPicker 
        isVisible={isBinderPickerVisible}
        onClose={() => setIsBinderPickerVisible(false)}
        onSelect={addYourCard}
        title="My Binder"
        cards={myBinder}
      />

      {/* Card Picker (Theirs) */}
      <CardPicker 
        isVisible={isCardPickerVisibleForThem}
        onClose={() => setIsCardPickerVisibleForThem(false)}
        onSelect={addTheirCard}
        title={`${selectedFriend?.name || 'Friend'}'s Binder`}
        cards={friendCollection}
      />
    </View>
  );
}

// ─── Flea Market View ────────────────────────────────────────────────────────

function FleaMarketView() {
  const router = useRouter();
  const deviceId = "default"; // In a real app, this would be a unique device ID
  const activeSession = useQuery(api.sessions.getActiveSession, { deviceId });
  const stagedScans = useQuery(api.users.getStagedScans, { deviceId });
  
  const startSession = useMutation(api.sessions.startSession);
  const endSession = useMutation(api.sessions.endSession);

  const handleStartSession = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startSession({ deviceId, title: `Hunt @ ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` });
    router.push("/(tabs)/" as any); // Go to scanner
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
    <View className="flex-1 px-6">
      <View className="mt-8 mb-10">
        <Text className="text-4xl font-black text-white">Flea Market Sessions</Text>
        <Text className="text-slate-text mt-2 text-sm leading-5">
           Track real-time value during your hunts. Scan piles, calculate totals, and save session history.
        </Text>
      </View>

      {!activeSession ? (
        <Pressable 
          onPress={handleStartSession}
          className="bg-amber-500 flex-row items-center justify-center py-5 rounded-2xl gap-3 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
        >
          <Zap size={20} color={KadoColors.midnight} />
          <Text className="text-midnight text-lg font-black uppercase tracking-widest">Start Live Session</Text>
        </Pressable>
      ) : (
        <View className="bg-navy border border-amber-500/30 p-6 rounded-3xl relative overflow-hidden">
          <View className="absolute right-[-20] top-[-20] opacity-5">
            <Zap size={120} color={KadoColors.umber} />
          </View>
          
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Active Session</Text>
              <Text className="text-white text-xl font-black">{activeSession.title}</Text>
            </View>
            <View className="bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
               <Text className="text-amber-500 text-[10px] font-black uppercase">Live</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-8 mb-8">
            <View>
              <Text className="text-slate-500 text-[10px] font-bold uppercase mb-1">Cards Scanned</Text>
              <Text className="text-white text-2xl font-black">{sessionScans.length}</Text>
            </View>
            <View>
              <Text className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Value</Text>
              <Text className="text-emerald-400 text-2xl font-black">{sessionTotal.toFixed(2)}$</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable 
              onPress={() => router.push("/(tabs)/" as any)}
              className="flex-1 bg-white/5 border border-white/10 py-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xs uppercase">Scan More</Text>
            </Pressable>
            <Pressable 
              onPress={handleEndSession}
              className="flex-1 bg-amber-500 py-4 rounded-xl items-center active:scale-95"
            >
              <Text className="text-midnight font-black text-xs uppercase">End & Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View className="mt-12 flex-1">
        <View className="flex-row items-center justify-between mb-6">
           <Text className="text-lg font-black text-white">{activeSession ? "Session Queue" : "Recent Scans"}</Text>
           <History size={16} color={KadoColors.slateText} />
        </View>

        {stagedScans === undefined ? (
           <ActivityIndicator color={KadoColors.umber} />
        ) : stagedScans.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10 rounded-3xl border-2 border-dashed border-white/5">
             <View className="w-16 h-16 rounded-3xl bg-white/5 items-center justify-center mb-4">
                <ShoppingBag size={24} color={KadoColors.slateText} />
             </View>
             <Text className="text-light-slate text-lg font-bold">Ready to Hunt?</Text>
             <Text className="text-slate-text text-xs mt-2 text-center px-10">
               Your session history is empty. Start scanning at your next card show or shop visit.
             </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
             {stagedScans.map((scan) => (
                <Pressable 
                  key={scan._id}
                  onPress={() => router.push(`/card/${scan._id}?mode=staged` as any)}
                  className="flex-row items-center py-4 border-b border-white/5 active:bg-white/5 px-2"
                >
                   <View className="w-12 h-16 rounded-lg overflow-hidden bg-navy mr-4 border border-white/10">
                      {scan.imageUrl && <Image source={{ uri: scan.imageUrl }} style={{ width: '100%', height: '100%' }} />}
                   </View>
                   <View className="flex-1">
                      <Text className="text-white font-bold" numberOfLines={1}>{scan.cardName}</Text>
                      <Text className="text-slate-text text-[10px] mt-1 uppercase tracking-widest">{scan.gameCode}</Text>
                   </View>
                   <View className="items-end">
                      <Text className="text-white font-black">{scan.marketPrice?.toFixed(2) || '0.00'} $</Text>
                      <ChevronRight size={14} color={KadoColors.slateText} />
                   </View>
                </Pressable>
             ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
