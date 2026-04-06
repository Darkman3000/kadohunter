import React, { useMemo, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { KadoColors } from "@/constants/theme";
import type { RecognitionResult } from "@/services/recognition";
import { getGameLabel } from "@/utils/gameLabels";
import { Sparkles, Check, TrendingUp, TrendingDown, X, Info } from "lucide-react-native";
import { PriceSparkline } from "./PriceSparkline";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface CardDossierProps {
  scanResult: RecognitionResult | null;
  previewUri?: string | null;
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  canSaveToBinder: boolean;
  hasUser: boolean;
  isSignedIn: boolean;
  isAuthLoaded: boolean;
}

export function CardDossier({
  scanResult,
  previewUri,
  isVisible,
  onClose,
  onSave,
  isSaving,
  canSaveToBinder,
  hasUser,
  isSignedIn,
  isAuthLoaded,
}: CardDossierProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Setup Snap points
  const snapPoints = useMemo(() => ["85%"], []);

  // Use historical data if available
  const historyData = useQuery(
    api.prices.getHistoricalData,
    scanResult?.cardId ? { cardId: scanResult.cardId, gameCode: scanResult.game, limit: 30 } : "skip"
  );

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose(); // Cleanup parent state if swiped down manually
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  if (!scanResult) return null;

  const imageUrl = scanResult.imageUrl || previewUri;
  const isUp = historyData && historyData.length >= 2 
    ? historyData[0].price >= historyData[historyData.length - 1].price 
    : true;
  const Emerald = "#10b981";
  const Rose = "#f43f5e";
  const TrendColor = isUp ? Emerald : Rose;
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: KadoColors.midnight, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
      handleIndicatorStyle={{ backgroundColor: KadoColors.slateText }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        
        {/* Header Section */}
        <View className="flex-row items-start gap-5 mb-8">
          <View className="shadow-2xl shadow-umber/10">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: 110, height: 154, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
                contentFit="cover"
              />
            ) : (
              <View style={{ width: 110, height: 154, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" }} />
            )}
          </View>
          
          <View className="flex-1">
            <View className="flex-row flex-wrap gap-2 mb-3">
              <View className="px-2.5 py-1 rounded-full bg-umber/15 border border-umber/20">
                <Text className="text-umber text-[10px] font-bold tracking-widest uppercase">
                  {getGameLabel(scanResult.game)}
                </Text>
              </View>
              <View className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <Text className="text-light-slate text-[10px] font-bold tracking-widest uppercase">
                  {scanResult.rarity}
                </Text>
              </View>
            </View>
            
            <Text className="text-white text-2xl font-black mb-1">{scanResult.name}</Text>
            <Text className="text-slate-text text-sm font-medium mb-3">
              {scanResult.set} {"\u00B7"} {scanResult.number}
            </Text>

            {scanResult.variant && scanResult.variant !== "Standard" && (
              <View className="self-start px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-400/20 mb-2">
                <Text className="text-sky-400 text-[11px] font-bold tracking-wider uppercase">
                  {scanResult.variant} Finish
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Collector Intel / Attributes Section */}
        {(scanResult.lore || scanResult.hp || scanResult.power) && (
          <View className="p-4 rounded-3xl bg-navy border border-white/5 mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Sparkles size={16} color={KadoColors.umber} />
              <Text className="text-umber text-xs font-bold tracking-[0.2em] uppercase">AI Collector Intel</Text>
            </View>
            
            {scanResult.lore && (
              <Text className="text-light-slate text-[15px] leading-6 font-medium italic mb-4">
                "{scanResult.lore}"
              </Text>
            )}

            <View className="flex-row flex-wrap gap-4">
              {scanResult.hp && (
                <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-black/40">
                  <Text className="text-slate-text text-xs uppercase font-bold">HP</Text>
                  <Text className="text-white text-base font-black">{scanResult.hp}</Text>
                </View>
              )}
              {scanResult.power && (
                <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-black/40">
                  <Text className="text-slate-text text-xs uppercase font-bold">PWR</Text>
                  <Text className="text-white text-base font-black">{scanResult.power}</Text>
                </View>
              )}
              {scanResult.attribute && (
                <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-black/40">
                  <Text className="text-slate-text text-xs uppercase font-bold">TYPE</Text>
                  <Text className="text-white text-sm font-black">{scanResult.attribute.toUpperCase()}</Text>
                </View>
              )}
              {scanResult.artist && (
                <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-black/40">
                  <Text className="text-slate-text text-xs uppercase font-bold">ILLUS</Text>
                  <Text className="text-white text-sm font-black">{scanResult.artist}</Text>
                </View>
              )}
            </View>
            
            {scanResult.attacks && scanResult.attacks.length > 0 && (
              <View className="mt-4 border-t border-white/5 pt-4">
                <Text className="text-slate-text text-xs font-bold uppercase mb-3">Attacks & Abilities</Text>
                {scanResult.attacks.map((attack, i) => (
                  <View key={i} className="flex-row items-center justify-between mb-2">
                    <Text className="text-light-slate text-sm font-medium">{attack.name}</Text>
                    <Text className="text-white text-sm font-bold">{attack.damage}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Pricing & Market Section */}
        <View className="p-5 rounded-3xl bg-black/60 border border-white/5 mb-8">
          <View className="flex-row items-start justify-between mb-8">
            <View>
              <Text className="text-slate-text text-xs uppercase font-bold tracking-widest mb-1">Market Value</Text>
              <View className="flex-row items-center gap-3">
                <Text className="text-white text-4xl font-black">
                  ${scanResult.estimatedPriceUsd?.toFixed(2)}
                </Text>
                {historyData && historyData.length > 0 && (
                  <View style={{ backgroundColor: TrendColor + "20" }} className="px-2 py-1 rounded-md flex-row items-center gap-1 mt-1">
                    <TrendIcon size={14} color={TrendColor} />
                    <Text style={{ color: TrendColor }} className="text-xs font-bold">Trend</Text>
                  </View>
                )}
              </View>
              {scanResult.pricePending && (
                <View className="flex-row items-center gap-2 mt-2">
                  <ActivityIndicator size="small" color={KadoColors.slateText} />
                  <Text className="text-slate-text text-xs font-medium">Fetching realtime spreads...</Text>
                </View>
              )}
            </View>
          </View>

          {/* Sparkline Chart */}
          <View className="items-center mb-8">
             <PriceSparkline history={historyData || []} color={TrendColor} />
          </View>

          {/* Action Footer integrated into the sheet */}
          <View className="flex-row gap-3 pt-6 border-t border-white/5">
            <Pressable
              onPress={onClose}
              disabled={isSaving}
              className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 items-center"
            >
              <Text className="text-light-slate font-bold text-sm">Close</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={!canSaveToBinder || isSaving}
              className="flex-1 py-4 rounded-xl bg-umber items-center flex-row justify-center gap-2"
              style={!canSaveToBinder ? { opacity: 0.5 } : {}}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={KadoColors.midnight} />
              ) : !hasUser ? (
                <Sparkles size={18} color={KadoColors.midnight} />
              ) : (
                <Check size={18} color={KadoColors.midnight} />
              )}
              <Text className="text-midnight font-bold text-base">
                {isSaving ? "Saving..." : !hasUser ? "Adding..." : "Add to Binder"}
              </Text>
            </Pressable>
          </View>
        </View>

      </BottomSheetScrollView>
    </BottomSheet>
  );
}
