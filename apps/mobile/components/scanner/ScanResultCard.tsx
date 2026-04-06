import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { KadoColors } from "@/constants/theme";
import type { RecognitionResult } from "@/services/recognition";
import { getGameLabel } from "@/utils/gameLabels";
import {
  AlertTriangle,
  Camera,
  Check,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react-native";

const LOW_CONFIDENCE_THRESHOLD = 0.65;

const CameraIcon = Camera as React.ComponentType<any>;
const AlertTriangleIcon = AlertTriangle as React.ComponentType<any>;
const SparklesIcon = Sparkles as React.ComponentType<any>;
const TrendingUpIcon = TrendingUp as React.ComponentType<any>;
const CheckIcon = Check as React.ComponentType<any>;
const CloseIcon = X as React.ComponentType<any>;

export function ScanResultCard({
  scanResult,
  isSaving,
  canSaveToBinder,
  isSignedIn,
  isAuthLoaded,
  hasUser,
  onDismiss,
  onSave,
}: {
  scanResult: RecognitionResult;
  isSaving: boolean;
  canSaveToBinder: boolean;
  isSignedIn: boolean;
  isAuthLoaded: boolean;
  hasUser: boolean;
  onDismiss: () => void;
  onSave: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      className="absolute inset-x-0 bottom-6 px-4"
    >
      <View
        className="rounded-3xl border border-white/10 overflow-hidden"
        style={{
          backgroundColor: "rgba(15, 27, 49, 0.9)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.3,
          shadowRadius: 28,
          elevation: 16,
        }}
      >
        <Pressable
          onPress={onDismiss}
          disabled={isSaving}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/35 border border-white/10 items-center justify-center active:scale-95"
        >
          <CloseIcon size={16} style={{ color: KadoColors.lightSlate }} />
        </Pressable>

        <View className="p-5">
          <View className="flex-row gap-4">
            {scanResult.imageUrl ? (
              <Image
                source={{ uri: scanResult.imageUrl }}
                style={{ width: 84, height: 116, borderRadius: 12 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-[84px] h-[116px] rounded-xl bg-midnight/50 items-center justify-center">
                <CameraIcon
                  size={24}
                  style={{ color: KadoColors.slateText }}
                  strokeWidth={1.5}
                />
              </View>
            )}

            <View className="flex-1 justify-center">
              <View className="flex-row flex-wrap gap-2 mb-2">
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
                {scanResult.variant && scanResult.variant !== "Standard" && (
                  <View className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-400/20">
                    <Text className="text-sky-400 text-[10px] font-bold tracking-widest uppercase">
                      {scanResult.variant}
                    </Text>
                  </View>
                )}
                {scanResult.finish && scanResult.finish !== "Normal" && (
                  <View className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20">
                    <Text className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
                      {scanResult.finish}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                className="text-light-slate text-lg font-bold mb-1"
                numberOfLines={2}
              >
                {scanResult.name}
              </Text>
              <Text className="text-slate-text text-xs mb-2">
                {scanResult.set} {"\u00B7"} {scanResult.number}
              </Text>

              <View className="flex-row items-center gap-2">
                {scanResult.pricePending ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color={KadoColors.slateText} />
                    <Text className="text-slate-text text-[13px] font-medium">Fetching price...</Text>
                  </View>
                ) : (
                  <>
                    <Text className="text-light-slate text-2xl font-bold">
                      ${scanResult.estimatedPriceUsd.toFixed(2)}
                    </Text>
                    <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10">
                      <TrendingUpIcon size={12} style={{ color: "#10b981" }} />
                      <Text className="text-[10px] font-bold text-emerald-400">
                        Market
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          <View className="mt-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-text text-[10px] font-bold tracking-[0.24em] uppercase">
                Confidence
              </Text>
              <Text
                className={`text-[10px] font-bold uppercase tracking-[0.24em] ${
                  scanResult.confidence < LOW_CONFIDENCE_THRESHOLD
                    ? "text-amber-400"
                    : "text-light-slate"
                }`}
              >
                {(scanResult.confidence * 100).toFixed(0)}% match
              </Text>
            </View>

            <View className="h-2 rounded-full bg-midnight/60 overflow-hidden flex-row">
              <View
                className="h-full rounded-full bg-umber"
                style={{ width: `${Math.max(8, scanResult.confidence * 100)}%` }}
              />
            </View>

            {scanResult.confidence < LOW_CONFIDENCE_THRESHOLD && (
              <View className="flex-row items-center gap-2 mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2">
                <AlertTriangleIcon size={14} style={{ color: "#fbbf24" }} />
                <Text className="flex-1 text-amber-100 text-xs">
                  Low confidence. Verify the card details before saving.
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onDismiss}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 items-center active:scale-95"
            >
              <Text className="text-light-slate font-bold text-sm">
                Dismiss
              </Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={!canSaveToBinder}
              className="flex-1 py-3 rounded-xl bg-umber items-center flex-row justify-center gap-2 active:scale-95"
              style={!canSaveToBinder ? { opacity: 0.6 } : undefined}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={KadoColors.midnight} />
              ) : !hasUser ? (
                <SparklesIcon
                  size={16}
                  style={{ color: KadoColors.midnight }}
                />
              ) : (
                <CheckIcon size={16} style={{ color: KadoColors.midnight }} />
              )}
              <Text className="text-midnight font-bold text-sm">
                {isSaving
                  ? "Saving..."
                  : isAuthLoaded && !isSignedIn
                    ? "Sign In to Save"
                  : !hasUser
                    ? "Syncing Account..."
                    : "Add to Binder"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}