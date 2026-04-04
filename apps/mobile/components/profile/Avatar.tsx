import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Svg,
} from "react-native-svg";

type AvatarTheme = {
  id: string;
  start: string;
  end: string;
  glow: string;
};

export const AVATAR_THEMES: AvatarTheme[] = [
  { id: "dawn", start: "#f97316", end: "#e11d48", glow: "#fb7185" },
  { id: "dusk", start: "#6366f1", end: "#9333ea", glow: "#a78bfa" },
  { id: "mint", start: "#14b8a6", end: "#10b981", glow: "#2dd4bf" },
  { id: "sky", start: "#3b82f6", end: "#06b6d4", glow: "#38bdf8" },
  { id: "gold", start: "#f59e0b", end: "#ca8a04", glow: "#fbbf24" },
];

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickAvatarTheme(seed: string) {
  return AVATAR_THEMES[hashSeed(seed) % AVATAR_THEMES.length];
}

export function getInitial(name: string) {
  const initial = name.trim().charAt(0).toUpperCase();
  return initial || "K";
}

export function Avatar({
  imageUrl,
  name,
  seed,
}: {
  imageUrl?: string | null;
  name: string;
  seed: string;
}) {
  const theme = pickAvatarTheme(seed);
  const initial = getInitial(name);

  return (
    <View
      className="h-14 w-14 overflow-hidden rounded-[18px] border border-white/10 bg-midnight/60 p-1"
      style={{
        shadowColor: theme.glow,
        shadowOpacity: 0.34,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <View className="flex-1 overflow-hidden rounded-[14px]">
        <Svg
          height="100%"
          width="100%"
          style={StyleSheet.absoluteFillObject}
        >
          <Defs>
            <LinearGradient id={`avatar-${theme.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.start} />
              <Stop offset="100%" stopColor={theme.end} />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="14"
            fill={`url(#avatar-${theme.id})`}
          />
          <Circle cx="26%" cy="28%" r="22%" fill="rgba(255,255,255,0.18)" />
          <Circle cx="80%" cy="78%" r="28%" fill="rgba(10,25,47,0.16)" />
        </Svg>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-2xl font-black text-midnight">{initial}</Text>
          </View>
        )}
      </View>
    </View>
  );
}