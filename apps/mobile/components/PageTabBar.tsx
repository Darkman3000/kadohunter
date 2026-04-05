/**
 * PageTabBar — shared tab strip component.
 *
 * Desktop: horizontal underline tabs (native app feel, full width).
 * Mobile:  horizontal scrollable pill tabs (existing behaviour).
 */
import React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { KadoColors } from "@/constants/theme";

interface PageTabBarProps {
  tabs: readonly string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDesktop: boolean;
}

export function PageTabBar({ tabs, activeTab, onTabChange, isDesktop }: PageTabBarProps) {
  const isWeb = Platform.OS === "web";

  if (isDesktop) {
    return (
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.07)",
          marginBottom: 24,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Pressable
              key={tab}
              onPress={() => onTabChange(tab)}
              style={({ hovered }: any) => ({
                paddingHorizontal: 20,
                paddingVertical: 12,
                position: "relative",
                borderBottomWidth: 2,
                borderBottomColor: isActive ? KadoColors.umber : "transparent",
                marginBottom: -1,
                backgroundColor:
                  hovered && isWeb && !isActive
                    ? "rgba(255,255,255,0.03)"
                    : "transparent",
                ...(isWeb ? { cursor: "pointer" as any } : {}),
              })}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? KadoColors.umber : "#64748b",
                  letterSpacing: 0.2,
                }}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  // Mobile: scrollable pills
  return (
    <View style={{ paddingBottom: 20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Pressable
              key={tab}
              onPress={() => onTabChange(tab)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 9,
                borderRadius: 99,
                borderWidth: 1,
                backgroundColor: isActive ? "#f59e0b" : "rgba(10,25,47,0.6)",
                borderColor: isActive ? "#f59e0b" : "rgba(255,255,255,0.1)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: isActive ? "#020617" : "#64748b",
                }}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
