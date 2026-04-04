import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import type { Id } from "../../../../convex/_generated/dataModel";
import { KadoColors } from "@/constants/theme";
import { LogOut, Zap } from "lucide-react-native";

function renderIcon(Icon: React.ComponentType<any>, props: Record<string, unknown>) {
  return <Icon {...props} />;
}

export function ProfileWishlist({
  isDesktop,
  wishlistItems,
  onRemove,
  onNavigateDashboard,
}: {
  isDesktop: boolean;
  wishlistItems: Array<{
    _id: Id<"wishlists">;
    cardName: string;
    gameCode: string;
    setName?: string;
    imageUrl?: string;
    currentPrice?: number;
    targetPrice?: number;
  }> | undefined;
  onRemove: (wishlistId: Id<"wishlists">) => Promise<unknown>;
  onNavigateDashboard: () => void;
}) {
  return (
    <View className={`${isDesktop ? "px-10" : "px-5"} mt-2`}>
      {wishlistItems === undefined ? (
        <ActivityIndicator color={KadoColors.umber} />
      ) : wishlistItems.length === 0 ? (
        <View className="py-16 items-center bg-navy/40 border border-white/5 rounded-[40px] px-8">
          <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-6">
            {renderIcon(Zap, { size: 32, color: KadoColors.slateText })}
          </View>
          <Text className="text-white text-xl font-black mb-3">Empty Wishlist</Text>
          <Text className="text-slate-text text-sm text-center leading-6">
            Add cards from the scanner or market to track price targets and receive buy alerts.
          </Text>
          <Pressable
            onPress={onNavigateDashboard}
            className="mt-8 bg-white/5 px-8 py-3 rounded-2xl border border-white/10"
          >
            <Text className="text-white font-bold">Start Exploring</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-4">
          {wishlistItems.map((item) => (
            <View
              key={item._id}
              className="bg-navy/40 border border-white/5 p-4 rounded-3xl flex-row items-center gap-4"
            >
              <View className="w-16 h-22 rounded-xl overflow-hidden bg-[#020617] border border-white/10">
                {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} />}
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold" numberOfLines={1}>{item.cardName}</Text>
                <Text className="text-slate-text text-[10px] mt-1 uppercase tracking-widest">{item.setName || item.gameCode.toUpperCase()}</Text>
                <View className="flex-row items-center gap-3 mt-2">
                  <View>
                    <Text className="text-[10px] text-slate-500 font-bold uppercase">Current</Text>
                    <Text className="text-white font-black">{item.currentPrice ? `${item.currentPrice.toFixed(2)}$` : 'N/A'}</Text>
                  </View>
                  {item.targetPrice && (
                    <View className="pl-3 border-l border-white/10">
                      <Text className="text-[10px] text-amber-500 font-bold uppercase">Target</Text>
                      <Text className="text-amber-500 font-black">{item.targetPrice.toFixed(2)}$</Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable
                onPress={async () => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  await onRemove(item._id);
                }}
                className="p-3 rounded-2xl bg-white/5 active:bg-rose-500/10"
              >
                {renderIcon(LogOut, { size: 18, color: "rgba(255,255,255,0.4)", style: { transform: [{ rotate: '90deg' }] } })}
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}