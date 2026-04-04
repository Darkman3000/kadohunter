import React from "react";
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

export type ScanMode = "Binder" | "Flea" | "Quick";

const MODES: readonly ScanMode[] = ["Binder", "Flea", "Quick"];

export function ScanModeSelector({
  scanMode,
  onModeChange,
}: {
  scanMode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
}) {
  return (
    <View className="items-center pb-8">
      <View className="flex-row bg-black/60 rounded-full p-1 border border-white/10">
        {MODES.map((mode) => (
          <Pressable
            key={mode}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onModeChange(mode);
            }}
            className={`px-6 py-2 rounded-full ${scanMode === mode ? 'bg-amber-500' : ''}`}
          >
            <Text className={`text-[10px] font-black uppercase tracking-widest ${scanMode === mode ? 'text-midnight' : 'text-white/60'}`}>
              {mode}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}