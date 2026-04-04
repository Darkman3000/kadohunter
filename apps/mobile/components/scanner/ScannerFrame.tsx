import React from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Defs, LinearGradient, Rect, Stop, Svg } from "react-native-svg";
import { KadoColors } from "@/constants/theme";
import type { AnimatedStyle } from "react-native-reanimated";
import type { ViewStyle } from "react-native";

export function ScannerFrame({
  width,
  height,
  isScanning,
  scanLineAnimatedStyle,
}: {
  width: number;
  height: number;
  isScanning: boolean;
  scanLineAnimatedStyle: AnimatedStyle<ViewStyle>;
}) {
  return (
    <View className="items-center justify-center flex-1">
      <View
        style={{ width, height }}
        className="border border-white/20 rounded-3xl relative overflow-hidden bg-black/15"
      >
        <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-umber rounded-tl-3xl" />
        <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-umber rounded-tr-3xl" />
        <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-umber rounded-bl-3xl" />
        <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-umber rounded-br-3xl" />

        {isScanning && (
          <Animated.View
            className="absolute left-4 right-4"
            style={scanLineAnimatedStyle}
          >
            <View
              style={{
                shadowColor: KadoColors.umber,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 18,
                elevation: 10,
              }}
            >
              <Svg width="100%" height={6}>
                <Defs>
                  <LinearGradient
                    id="scan-line-gradient"
                    x1="0%"
                    y1="50%"
                    x2="100%"
                    y2="50%"
                  >
                    <Stop offset="0%" stopColor="rgba(199,167,123,0)" />
                    <Stop offset="50%" stopColor="rgba(199,167,123,0.95)" />
                    <Stop offset="100%" stopColor="rgba(199,167,123,0)" />
                  </LinearGradient>
                </Defs>
                <Rect
                  x="0"
                  y="1.5"
                  width="100%"
                  height="3"
                  rx="1.5"
                  fill="url(#scan-line-gradient)"
                />
              </Svg>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}