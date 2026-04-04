import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useAuth, useOAuth, useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { KadoColors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { scanLimits } from "@kado/domain";
import type { SubscriptionTier } from "@kado/contracts";
import {
  ChevronRight,
  LogOut,
  Scan,
  ShieldCheck,
} from "lucide-react-native";
import {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Svg,
} from "react-native-svg";
import {
  ProfileDashboard,
  ProfileFriends,
  ProfileWishlist,
  ProfileHistory,
} from "../../components/profile";

type AuthProvider = "google" | "apple";

const PROFILE_TABS = ["Dashboard", "Wishlist", "History", "Friends", "Settings"] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

function formatLicenseNumber(seed: string) {
  const cleaned = seed.replace(/[^a-z0-9]/gi, "").toUpperCase();
  const prefix = (cleaned.slice(0, 3) || "KDO").padEnd(3, "0");
  const suffix = cleaned.slice(-4).padStart(4, "0");
  return `${prefix}-${suffix}`;
}

function renderIcon(Icon: React.ComponentType<any>, props: Record<string, unknown>) {
  return <Icon {...props} />;
}

function LoadingState({ label }: { label: string }) {
  const { isWeb, isDesktop, maxNarrowColumnWidth } = useResponsiveLayout();
  const webColumnStyle =
    isWeb && isDesktop
      ? { width: "100%" as const, maxWidth: maxNarrowColumnWidth, alignSelf: "center" as const }
      : isWeb
        ? { width: "100%" as const, maxWidth: 480, alignSelf: "center" as const }
        : null;
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: KadoColors.midnight }, webColumnStyle]}
      edges={["top"]}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View className="rounded-3xl border border-white/10 bg-navy/60 px-6 py-5">
          <ActivityIndicator size="large" color={KadoColors.umber} />
          <Text className="mt-4 text-center text-sm font-medium text-light-slate">
            {label}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function AuthButton({
  label,
  tone,
  onPress,
  loading,
}: {
  label: string;
  tone: "light" | "dark";
  onPress: () => void;
  loading: boolean;
}) {
  const isLight = tone === "light";

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="h-14 flex-row items-center justify-center rounded-2xl px-4 active:scale-[0.98]"
      style={{
        backgroundColor: isLight ? "#ffffff" : "#05070b",
        borderWidth: 1,
        borderColor: isLight
          ? "rgba(255,255,255,0.16)"
          : "rgba(255,255,255,0.10)",
        opacity: loading ? 0.72 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isLight ? KadoColors.midnight : "#ffffff"}
        />
      ) : (
        <Text
          className="text-sm font-extrabold tracking-tight"
          style={{ color: isLight ? KadoColors.midnight : "#ffffff" }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function SignedOutState({
  activeProvider,
  authError,
  onOAuthPress,
}: {
  activeProvider: AuthProvider | null;
  authError: string | null;
  onOAuthPress: (provider: AuthProvider) => void;
}) {
  const { isWeb, isDesktop, maxNarrowColumnWidth } = useResponsiveLayout();
  const webColumnStyle =
    isWeb && isDesktop
      ? { width: "100%" as const, maxWidth: maxNarrowColumnWidth, alignSelf: "center" as const }
      : isWeb
        ? { width: "100%" as const, maxWidth: 480, alignSelf: "center" as const }
        : null;
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: KadoColors.midnight }, webColumnStyle]}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-5 py-6">
          <View className="overflow-hidden rounded-[32px] border border-white/10 bg-navy/90">
            <View
              className="absolute inset-x-0 top-0 h-1"
              style={{
                backgroundColor: "rgba(199,167,123,0.52)",
                shadowColor: KadoColors.umber,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.45,
                shadowRadius: 14,
              }}
            />

            <View
              pointerEvents="none"
              className="absolute inset-0"
              style={{ opacity: 0.98 }}
            >
              <Svg height="100%" width="100%">
                <Defs>
                  <LinearGradient
                    id="signed-out-auth-bg"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor="#17253f" stopOpacity={1} />
                    <Stop offset="52%" stopColor="#0f1b31" stopOpacity={1} />
                    <Stop offset="100%" stopColor="#0b1120" stopOpacity={1} />
                  </LinearGradient>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  rx="32"
                  fill="url(#signed-out-auth-bg)"
                />
                <Circle cx="80%" cy="16%" r="88" fill="#c7a77b" fillOpacity="0.1" />
                <Circle cx="18%" cy="82%" r="92" fill="#38bdf8" fillOpacity="0.07" />
              </Svg>
            </View>

            <View className="relative z-10 px-6 py-7">
              <View className="items-center">
                <View
                  className="mb-5 h-16 w-16 items-center justify-center rounded-[22px] border"
                  style={{
                    backgroundColor: "rgba(199,167,123,0.12)",
                    borderColor: "rgba(199,167,123,0.28)",
                    shadowColor: KadoColors.umber,
                    shadowOpacity: 0.3,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 7,
                  }}
                >
                  {renderIcon(Scan, {
                    size: 28,
                    color: KadoColors.umber,
                    strokeWidth: 2.1,
                  })}
                </View>

                <Text className="text-center text-[30px] font-bold tracking-tight text-light-slate">
                  Join the Hunt
                </Text>
                <Text className="mt-2 max-w-[280px] text-center text-sm leading-6 text-slate-text">
                  Sign in to sync your binder, lock in your hunter identity, and
                  keep scans available across every device.
                </Text>
              </View>

              <View className="mt-7 overflow-hidden rounded-[28px] border border-white/10 bg-midnight/60 p-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                      Hunter Net
                    </Text>
                    <Text className="mt-1 text-2xl font-black italic tracking-[0.18em] text-white">
                      HUNTER
                    </Text>
                    <View className="mt-1 h-[3px] w-[92px] rounded-full bg-umber" />
                  </View>
                  <View className="h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    {renderIcon(ShieldCheck, {
                      size: 18,
                      color: KadoColors.umber,
                      strokeWidth: 2.1,
                    })}
                  </View>
                </View>

                <View className="mt-5 rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                    What unlocks
                  </Text>
                  <View className="mt-3 gap-2">
                    <Text className="text-sm font-semibold text-light-slate">
                      Sync binder and scan history
                    </Text>
                    <Text className="text-sm font-semibold text-light-slate">
                      Secure your Hunter ID and profile
                    </Text>
                    <Text className="text-sm font-semibold text-light-slate">
                      Access PRO upgrades and future network features
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-6 gap-3">
                <AuthButton
                  label="Continue with Google"
                  tone="light"
                  onPress={() => onOAuthPress("google")}
                  loading={activeProvider === "google"}
                />
                <AuthButton
                  label="Continue with Apple"
                  tone="dark"
                  onPress={() => onOAuthPress("apple")}
                  loading={activeProvider === "apple"}
                />
              </View>

              <Text className="mt-4 text-center text-[11px] leading-5 text-slate-text">
                Secure sign-in powered by Clerk. Your binder and scan quota will
                sync automatically after sign-in.
              </Text>

              {authError ? (
                <Text className="mt-4 text-center text-xs leading-5 text-rose-300">
                  {authError}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { isLoaded: isAuthLoaded, isSignedIn, signOut } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({
    strategy: "oauth_apple",
  });

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthLoaded && isSignedIn ? {} : "skip"
  ) as
    | {
        _id: Id<"users">;
        name?: string;
        tier: SubscriptionTier;
        scansToday: number;
      }
    | null
    | undefined;

  const userStats = useQuery(
    api.users.getUserStats,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  ) as
    | {
        scansToday: number;
        collectionCount: number;
        collectionValue: number;
      }
    | undefined;

  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<AuthProvider | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("Dashboard");
  const [friendQuery, setFriendQuery] = useState("");
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const friends = useQuery(api.friends.getFriends, isSignedIn ? {} : "skip");
  const pendingRequests = useQuery(api.friends.getPendingRequests, isSignedIn ? {} : "skip");
  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectRequest = useMutation(api.friends.rejectFriendRequest);

  const wishlistItems = useQuery(api.wishlists.getWishlist, isSignedIn ? {} : "skip");
  const sessionHistory = useQuery(api.sessions.getSessionHistory, isSignedIn ? {} : "skip");
  const removeFromWishlist = useMutation(api.wishlists.removeFromWishlist);

  const clerkName = user?.firstName ?? user?.username ?? "Kado Hunter";
  const displayName = currentUser?.name ?? clerkName;
  const backendTier = currentUser?.tier ?? "free";
  const isPro = backendTier !== "free";
  const quotaTier = isPro ? "pro" : "free";
  const maxScans = scanLimits[quotaTier];
  const scansToday = currentUser?.scansToday ?? 0;
  const collectionCount = userStats?.collectionCount ?? 0;
  const collectionValue = userStats?.collectionValue ?? 0;
  const licenseNumber = formatLicenseNumber(currentUser?._id ?? user?.id ?? displayName);
  const avatarUrl = user?.imageUrl;
  const avatarSeed = currentUser?._id ?? user?.id ?? displayName;
  const isProfileLoading =
    isSignedIn &&
    (currentUser === undefined || (currentUser !== null && userStats === undefined));

  const handleUpgrade = () => {
    void Haptics.selectionAsync();
    router.push("/subscription");
  };

  const handleSignOut = () => {
    if (isSigningOut) return;

    Alert.alert(
      "Sign Out",
      "You will need to sign in again to access your profile and collection.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setSignOutError(null);
              setIsSigningOut(true);
              try {
                await signOut();
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Unable to sign out right now.";
                setSignOutError(message);
                Alert.alert("Sign out failed", message);
              } finally {
                setIsSigningOut(false);
              }
            })();
          },
        },
      ]
    );
  };

  const handleOAuthPress = async (provider: AuthProvider) => {
    if (activeProvider) return;

    setAuthError(null);
    setActiveProvider(provider);

    try {
      await Haptics.selectionAsync();

      const result =
        provider === "google"
          ? await startGoogleOAuthFlow()
          : await startAppleOAuthFlow();

      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        return;
      }

      const resultType = result.authSessionResult?.type;
      if (resultType === "cancel" || resultType === "dismiss") return;

      throw new Error(
        provider === "google"
          ? "Google sign-in could not be completed right now."
          : "Apple sign-in could not be completed right now."
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start sign-in.";
      setAuthError(message);
      Alert.alert("Sign in failed", message);
    } finally {
      setActiveProvider(null);
    }
  };

  const { isDesktop, maxPageColumnWidth } = useResponsiveLayout();

  if (!isAuthLoaded || !isUserLoaded) {
    return <LoadingState label="Loading hunter profile..." />;
  }

  if (isProfileLoading) {
    return <LoadingState label="Syncing hunter profile..." />;
  }

  if (!isSignedIn) {
    return (
      <SignedOutState
        activeProvider={activeProvider}
        authError={authError}
        onOAuthPress={handleOAuthPress}
      />
    );
  }

  const handleAddFriend = async () => {
    if (!friendQuery.trim()) return;
    setIsAddingFriend(true);
    try {
      await sendRequest({ hunterTag: friendQuery.trim().toUpperCase() });
      setFriendQuery("");
      Alert.alert("Request Sent", `Friend request sent to ${friendQuery}`);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to send request");
    } finally {
      setIsAddingFriend(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: KadoColors.midnight }}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 40,
          width: "100%",
          maxWidth: isDesktop ? maxPageColumnWidth : undefined,
          alignSelf: isDesktop ? "center" : undefined,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-6 pb-4">
          <Text className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400 mb-2">
            Profile
          </Text>
          <Text className="text-3xl font-black text-white">Hunter Identity</Text>
        </View>

        {/* Sub-tab Navigation */}
        <View className={`sticky top-0 z-10 pt-2 pb-6 ${isDesktop ? 'px-10' : 'px-5'}`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {PROFILE_TABS.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab);
                  }}
                  className={`px-6 py-2.5 rounded-full border transition-all mr-3 ${isActive ? 'bg-amber-500 border-amber-500 shadow-md' : 'bg-navy/40 border-white/10'}`}
                >
                  <Text className={`text-xs font-bold ${isActive ? 'text-midnight' : 'text-slate-500'}`}>{tab}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {activeTab === "Dashboard" && (
          <ProfileDashboard
            displayName={displayName}
            isPro={isPro}
            licenseNumber={licenseNumber}
            avatarUrl={avatarUrl}
            avatarSeed={avatarSeed}
            userId={currentUser?._id ?? "anon"}
            scansToday={scansToday}
            maxScans={maxScans}
            collectionCount={collectionCount}
            collectionValue={collectionValue}
            isDesktop={isDesktop}
            onUpgrade={handleUpgrade}
          />
        )}

        {activeTab === "Friends" && (
          <ProfileFriends
            isDesktop={isDesktop}
            friendQuery={friendQuery}
            setFriendQuery={setFriendQuery}
            isAddingFriend={isAddingFriend}
            onAddFriend={handleAddFriend}
            pendingRequests={pendingRequests as any}
            friends={friends as any}
            onAcceptRequest={(id) => acceptRequest({ requestId: id })}
            onRejectRequest={(id) => rejectRequest({ requestId: id })}
          />
        )}

        {activeTab === "Wishlist" && (
          <ProfileWishlist
            isDesktop={isDesktop}
            wishlistItems={wishlistItems as any}
            onRemove={(id) => removeFromWishlist({ wishlistId: id })}
            onNavigateDashboard={() => setActiveTab("Dashboard")}
          />
        )}

        {activeTab === "History" && (
          <ProfileHistory
            isDesktop={isDesktop}
            sessionHistory={sessionHistory as any}
          />
        )}

        {/* Settings View */}
        {activeTab === "Settings" && (
          <View className={`${isDesktop ? 'px-10' : 'px-5'} mt-2`}>
            <Pressable
              onPress={handleSignOut}
              className="rounded-3xl border border-rose-400/10 bg-rose-500/5 px-4 py-4 active:scale-[0.98]"
              disabled={isSigningOut}
            >
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10">
                    {isSigningOut ? (
                      <ActivityIndicator size="small" color="#fb7185" />
                    ) : renderIcon(LogOut, { size: 18, color: "#fb7185", style: { transform: [{ rotate: "180deg" }] } })}
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-bold text-rose-400">Sign Out</Text>
                    <Text className="mt-0.5 text-xs text-slate-text">End this session on this device</Text>
                  </View>
                </View>
                {renderIcon(ChevronRight, { size: 18, color: "#fb7185" })}
              </View>
            </Pressable>

            {signOutError ? (
              <Text className="mt-4 text-xs text-rose-300 text-center">{signOutError}</Text>
            ) : null}

            <View className="mt-12 items-center">
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">KadoHunter Association</Text>
                <Text className="text-slate-700 text-[10px] font-mono mt-2">v0.9.1 Pre-Release</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}