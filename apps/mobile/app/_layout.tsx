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
import { Platform, View, useWindowDimensions, Pressable } from "react-native";
import { BookOpen, Scan, User, LogOut, BarChart3, ArrowLeftRight, Globe } from "lucide-react-native";
import { api } from "../../../convex/_generated/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { KadoColors } from "@/constants/theme";
import { BREAKPOINTS, getWebSidebarWidth } from "@/constants/breakpoints";
import "react-native-reanimated";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const railW = getWebSidebarWidth(width);
  const wideRail = railW >= 72;
  const hit = wideRail ? 48 : 44;
  const iconSz = wideRail ? 24 : 22;

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
        width: railW,
        backgroundColor: "#020617",
        borderRightWidth: 1,
        borderRightColor: "rgba(255,255,255,0.05)",
        alignItems: "center",
        paddingTop: wideRail ? 28 : 32,
        gap: wideRail ? 20 : 24,
      }}
    >
      <View
        style={{
          width: wideRail ? 36 : 32,
          height: wideRail ? 36 : 32,
          backgroundColor: KadoColors.umber,
          borderRadius: wideRail ? 10 : 8,
          marginBottom: wideRail ? 12 : 16,
        }}
      />

      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path === "/(tabs)" && pathname === "/");
        return (
          <Pressable
            key={item.path}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => router.push(item.path as any)}
            // @ts-expect-error RN Web: native tooltip
            title={Platform.OS === "web" ? item.label : undefined}
            style={({ pressed, hovered }) => ({
              width: hit,
              height: hit,
              borderRadius: 12,
              backgroundColor: isActive
                ? "rgba(199, 167, 123, 0.12)"
                : hovered && Platform.OS === "web"
                  ? "rgba(255, 255, 255, 0.06)"
                  : "transparent",
              opacity: pressed ? 0.85 : 1,
              alignItems: "center",
              justifyContent: "center",
              ...(Platform.OS === "web" ? { cursor: "pointer" as const } : {}),
            })}
          >
            <item.icon
              size={iconSz}
              color={isActive ? KadoColors.umber : KadoColors.slateText}
              strokeWidth={isActive ? 2.5 : 2}
            />
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        // @ts-expect-error RN Web: native tooltip
        title={Platform.OS === "web" ? "Sign out" : undefined}
        onPress={() => signOut()}
        style={({ hovered, pressed }) => ({
          width: hit,
          height: hit,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: wideRail ? 20 : 24,
          borderRadius: 12,
          backgroundColor:
            hovered && Platform.OS === "web" ? "rgba(251, 113, 133, 0.12)" : "transparent",
          opacity: pressed ? 0.85 : 1,
          ...(Platform.OS === "web" ? { cursor: "pointer" as const } : {}),
        })}
      >
        <LogOut size={wideRail ? 22 : 20} color={KadoColors.slateText} />
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
    if (Platform.OS === "web") return null;

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
        </ConvexProviderWithClerk>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
