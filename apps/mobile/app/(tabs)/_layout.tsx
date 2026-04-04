import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import { Scan, BookOpen, Globe, User, BarChart3, ArrowLeftRight } from "lucide-react-native";
import { KadoColors } from "@/constants/theme";
import { BREAKPOINTS } from "@/constants/breakpoints";

const ScanIcon = Scan as React.ComponentType<any>;
const BookOpenIcon = BookOpen as React.ComponentType<any>;
const GlobeIcon = Globe as React.ComponentType<any>;
const UserIcon = User as React.ComponentType<any>;
const ArrowsIcon = ArrowLeftRight as React.ComponentType<any>;

function RailIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {focused ? (
        <View
          style={{
            position: "absolute",
            top: -10,
            width: 24,
            height: 2,
            borderRadius: 999,
            backgroundColor: KadoColors.umber,
          }}
        />
      ) : null}
      {children}
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= BREAKPOINTS.DESKTOP;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1, minWidth: 0 },
        // Hide bottom tabs on desktop web — sidebar handles navigation there
        tabBarStyle: isDesktop
          ? { display: "none" }
          : {
              backgroundColor: KadoColors.midnight,
              borderTopColor: "rgba(255,255,255,0.1)",
              borderTopWidth: 1,
              height: 74,
              paddingBottom: 10,
              paddingTop: 10,
            },
        tabBarActiveTintColor: KadoColors.umber,
        tabBarInactiveTintColor: KadoColors.slateText,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="binder"
        options={{
          title: "Binder",
          tabBarIcon: ({ color, focused }) => (
            <RailIcon focused={focused}>
              <BookOpenIcon
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </RailIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="hunternet"
        options={{
          title: "Hunter Net",
          tabBarIcon: ({ color, focused }) => (
            <RailIcon focused={focused}>
              <GlobeIcon
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </RailIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Scan",
          tabBarLabel: () => null,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? KadoColors.umber : KadoColors.navy,
                borderColor: "rgba(255,255,255,0.12)",
                borderWidth: 1,
                width: 56,
                height: 56,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                marginTop: -22,
                shadowColor: focused ? KadoColors.umber : "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: focused ? 0.28 : 0.16,
                shadowRadius: focused ? 16 : 12,
                elevation: focused ? 10 : 6,
              }}
            >
              <ScanIcon
                size={22}
                color={focused ? KadoColors.midnight : KadoColors.lightSlate}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: "Trade",
          tabBarIcon: ({ color, focused }) => (
            <RailIcon focused={focused}>
              <ArrowsIcon
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </RailIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <RailIcon focused={focused}>
              <UserIcon
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </RailIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="market"
        options={{ href: null }}
      />
    </Tabs>
  );
}
