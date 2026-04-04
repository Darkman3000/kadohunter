import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KadoColors } from "@/constants/theme";
import {
  ChevronRight,
  Scan,
  ShieldAlert,
} from "lucide-react-native";

function renderIcon(Icon: React.ComponentType<any>, props: Record<string, unknown>) {
  return <Icon {...props} />;
}

export function ProfileHistory({
  isDesktop,
  sessionHistory,
}: {
  isDesktop: boolean;
  sessionHistory: Array<{
    _id: string;
    title: string;
    startedAt: number;
    cardCount: number;
    totalValue: number;
  }> | undefined;
}) {
  const router = useRouter();

  return (
    <View className={`${isDesktop ? "px-10" : "px-5"} mt-2`}>
      {sessionHistory === undefined ? (
        <ActivityIndicator color={KadoColors.umber} />
      ) : sessionHistory.length === 0 ? (
        <View className="py-16 items-center bg-navy/40 border border-white/5 rounded-[40px] px-8">
          <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-6">
            {renderIcon(ShieldAlert, { size: 32, color: KadoColors.slateText })}
          </View>
          <Text className="text-white text-xl font-black mb-3">No Sessions Yet</Text>
          <Text className="text-slate-text text-sm text-center leading-6">
            Your past scan sessions and trade history will appear here once you start hunting.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/" as any)}
            className="mt-8 bg-amber-500 px-8 py-3 rounded-2xl shadow-lg shadow-amber-500/20"
          >
            <Text className="text-midnight font-black uppercase tracking-widest">Start Scanning</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-4">
          {sessionHistory.map((session) => (
            <Pressable
              key={session._id}
              className="bg-navy/40 border border-white/5 p-5 rounded-[32px] flex-row items-center gap-4 active:bg-white/5"
            >
              <View className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center border border-white/10">
                {renderIcon(Scan, { size: 24, color: KadoColors.umber })}
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{session.title}</Text>
                <Text className="text-slate-500 text-xs mt-1">
                  {new Date(session.startedAt).toLocaleDateString()} • {session.cardCount} cards
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-emerald-400 font-black text-base">{session.totalValue.toFixed(2)}$</Text>
                {renderIcon(ChevronRight, { size: 18, color: KadoColors.slateText })}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
