import "../global.css";

import { ClerkLoaded, ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/token-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useEffect, useRef } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMutation } from "convex/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, Text, View, useWindowDimensions, Pressable } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BookOpen, Scan, User, LogOut, BarChart3, ArrowLeftRight, Globe } from "lucide-react-native";
import { api } from "../../../convex/_generated/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { KadoColors } from "@/constants/theme";
import { BREAKPOINTS, getWebSidebarWidth } from "@/constants/breakpoints";
import "react-native-reanimated";
// Lazy-import notifications to avoid crash when native module is missing from dev build
let Notifications: typeof import("expo-notifications") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications") as typeof import("expo-notifications");
} catch {
  console.warn("[KadoHunter] expo-notifications native module not available — push disabled");
}
import Constants from "expo-constants";

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const railW = getWebSidebarWidth(width);
  // Show text labels when there's enough room — XL desktop only
  const showLabels = width >= BREAKPOINTS.LARGE_DESKTOP;
  const expandedW = 200;
  const sidebarW = showLabels ? expandedW : railW;

  const navItems = [
    { icon: BookOpen,        path: "/(tabs)/binder",  label: "Binder" },
    { icon: Globe,           path: "/(tabs)/hunternet", label: "Hunter Net" },
    { icon: Scan,            path: "/(tabs)",          label: "Scan" },
    { icon: ArrowLeftRight,  path: "/(tabs)/trade",   label: "Trade" },
    { icon: User,            path: "/(tabs)/profile", label: "Profile" },
  ];

  return (
    <View
      style={{
        width: sidebarW,
        backgroundColor: "#020617",
        borderRightWidth: 1,
        borderRightColor: "rgba(255,255,255,0.06)",
        paddingTop: 24,
        paddingBottom: 16,
        paddingHorizontal: showLabels ? 12 : 0,
        alignItems: showLabels ? "stretch" : "center",
        gap: showLabels ? 4 : 20,
      }}
    >
      {/* Logo mark */}
      <View
        style={{
          flexDirection: showLabels ? "row" : "column",
          alignItems: "center",
          gap: 10,
          marginBottom: showLabels ? 20 : 12,
          paddingHorizontal: showLabels ? 4 : 0,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            backgroundColor: KadoColors.umber,
            borderRadius: 9,
            flexShrink: 0,
          }}
        />
        {showLabels && (
          <View>
            <Text style={{ color: "#ccd6f6", fontSize: 14, fontWeight: "800", letterSpacing: 0.3 }}>Kado</Text>
            <Text style={{ color: "#475569", fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>Hunter</Text>
          </View>
        )}
      </View>

      {showLabels && (
        <Text
          style={{
            color: "#334155",
            fontSize: 10,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            paddingHorizontal: 6,
            marginBottom: 4,
          }}
        >
          Navigation
        </Text>
      )}

      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path === "/(tabs)" && pathname === "/");
        return (
          <Pressable
            key={item.path}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => router.push(item.path as any)}
            style={({ pressed, hovered }) => ({
              flexDirection: showLabels ? "row" : "column",
              alignItems: "center",
              gap: showLabels ? 10 : 0,
              paddingHorizontal: showLabels ? 10 : 0,
              paddingVertical: showLabels ? 9 : 0,
              width: showLabels ? "100%" : 44,
              height: showLabels ? undefined : 44,
              borderRadius: 10,
              backgroundColor: isActive
                ? "rgba(199, 167, 123, 0.12)"
                : (hovered as boolean) && Platform.OS === "web"
                  ? "rgba(255, 255, 255, 0.05)"
                  : "transparent",
              opacity: pressed ? 0.8 : 1,
              justifyContent: showLabels ? undefined : "center",
              ...(Platform.OS === "web" ? { cursor: "pointer" as const } : {}),
            })}
          >
            {({ hovered }: any) => (
              <>
                <item.icon
                  size={18}
                  color={isActive ? KadoColors.umber : hovered ? "#94a3b8" : KadoColors.slateText}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {showLabels && (
                  <Text
                    style={{
                      color: isActive ? KadoColors.umber : "#94a3b8",
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </Text>
                )}
                {isActive && showLabels && (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: KadoColors.umber,
                    }}
                  />
                )}
              </>
            )}
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      {showLabels && (
        <Text
          style={{
            color: "#334155",
            fontSize: 10,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            paddingHorizontal: 6,
            marginBottom: 4,
          }}
        >
          Account
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => signOut()}
        style={({ hovered, pressed }) => ({
          flexDirection: showLabels ? "row" : "column",
          alignItems: "center",
          gap: showLabels ? 10 : 0,
          paddingHorizontal: showLabels ? 10 : 0,
          paddingVertical: showLabels ? 9 : 0,
          width: showLabels ? "100%" : 44,
          height: showLabels ? undefined : 44,
          borderRadius: 10,
          backgroundColor:
            (hovered as boolean) && Platform.OS === "web" ? "rgba(251, 113, 133, 0.1)" : "transparent",
          opacity: pressed ? 0.8 : 1,
          justifyContent: showLabels ? undefined : "center",
          marginBottom: 8,
          ...(Platform.OS === "web" ? { cursor: "pointer" as const } : {}),
        })}
      >
        <LogOut size={18} color="#64748b" />
        {showLabels && (
          <Text style={{ color: "#64748b", fontSize: 13, fontWeight: "500" }}>Sign out</Text>
        )}
      </Pressable>
    </View>
  );
}

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL as string
);

export const unstable_settings = {
  anchor: "(tabs)",
};

function InitUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const storeUser = useMutation(api.users.storeUser);
  const syncedUserId = useRef<string | null>(null);
  const registerPushToken = useMutation(api.users.registerPushToken);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === "web" || !Notifications) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    return token;
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    if (syncedUserId.current === user.id) {
      return;
    }

    let isCancelled = false;

    void storeUser({
      tokenIdentifier: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: user.fullName || undefined,
    }).then(async () => {
      // After storing user, register push token
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await registerPushToken({ pushToken: token });
      }
    })
      .then(() => {
        if (!isCancelled) {
          syncedUserId.current = user.id;
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error("Failed to sync Clerk user to Convex", error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, storeUser, user]);

  return null;
}

/** Prime the Clerk JWT template named `convex` on web so Convex websocket auth wins the race less often. */
function WebConvexTokenWarmup() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  useEffect(() => {
    if (Platform.OS !== "web" || !isLoaded || !isSignedIn || !getToken) return;
    void getToken({ template: "convex", skipCache: true }).catch(() => {});
  }, [isLoaded, isSignedIn, getToken]);
  return null;
}

export default function RootLayout() {
  const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= BREAKPOINTS.DESKTOP;

  if (!clerkKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables"
    );
  }

  return (
    <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <InitUser />
          <WebConvexTokenWarmup />
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider style={{ backgroundColor: "#020617" }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#020617",
                  flexDirection: isDesktop ? "row" : "column",
                  // On mobile web, center the phone-width pane horizontally
                  justifyContent: isWeb && !isDesktop ? "center" : undefined,
                  alignItems: isWeb && !isDesktop ? "center" : undefined,
                }}
              >
                {isDesktop && <Sidebar />}
                <View
                  style={[
                    {
                      overflow: "hidden",
                      backgroundColor: "#0a192f",
                      // Let the main pane shrink beside the sidebar (RN Web flex default min-width:auto overflows)
                      minWidth: 0,
                      flex: 1,
                    },
                    // Mobile web: fixed phone-like column, centered
                    isWeb && !isDesktop && {
                      width: "100%",
                      maxWidth: 480,
                      flex: 1,
                      alignSelf: "center",
                      borderLeftWidth: 1,
                      borderRightWidth: 1,
                      borderColor: "rgba(255,255,255,0.05)",
                      shadowColor: "#000",
                      shadowOpacity: 0.5,
                      shadowRadius: 20,
                    },
                    // Desktop: fill remaining space beside sidebar
                    isDesktop && {
                      borderLeftWidth: 1,
                      borderLeftColor: "rgba(255,255,255,0.05)",
                    },
                  ]}
                >
                  <ErrorBoundary>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: {
                          backgroundColor: "#0a192f",
                          flex: 1,
                          minWidth: 0,
                        },
                      }}
                    >
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="oauth-native-callback" />
                      <Stack.Screen
                        name="card/[id]"
                        options={{ presentation: "modal" }}
                      />
                      <Stack.Screen
                        name="subscription"
                        options={{ presentation: "modal" }}
                      />
                    </Stack>
                    <StatusBar style="light" />
                  </ErrorBoundary>
                </View>
              </View>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </ConvexProviderWithClerk>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
