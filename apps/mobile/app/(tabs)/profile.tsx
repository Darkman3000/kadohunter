import React, { useState } from "react";
import { 
  ActivityIndicator, 
  Alert, 
  Platform, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  useWindowDimensions, 
  TextInput 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useAuth, useOAuth, useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { KadoColors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { FriendPicker } from "../../components/FriendPicker";
import { scanLimits } from "@kado/domain";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolate,
  Extrapolate
} from "react-native-reanimated";
import { 
  Gesture, 
  GestureDetector, 
  GestureHandlerRootView 
} from "react-native-gesture-handler";
import QRCode from "react-native-qrcode-svg";
import {
  ChevronRight,
  Crown,
  LogOut,
  Scan,
  ShieldCheck,
  Wallet,
  Zap,
  Info,
  ExternalLink,
  ShieldAlert,
  Plus,
  User,
  LayoutGrid,
  ArrowUpRight,
} from "lucide-react-native";
import {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Svg,
} from "react-native-svg";

type BackendTier = "free" | "pro_monthly" | "pro_annual";
type AuthProvider = "google" | "apple";

const PROFILE_TABS = ["Dashboard", "Wishlist", "History", "Friends", "Settings"] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

type AvatarTheme = {
  id: string;
  start: string;
  end: string;
  glow: string;
};

const AVATAR_THEMES: AvatarTheme[] = [
  { id: "dawn", start: "#f97316", end: "#e11d48", glow: "#fb7185" },
  { id: "dusk", start: "#6366f1", end: "#9333ea", glow: "#a78bfa" },
  { id: "mint", start: "#14b8a6", end: "#10b981", glow: "#2dd4bf" },
  { id: "sky", start: "#3b82f6", end: "#06b6d4", glow: "#38bdf8" },
  { id: "gold", start: "#f59e0b", end: "#ca8a04", glow: "#fbbf24" },
];

const QR_PATTERN = [
  [1, 1, 1, 1, 0, 1, 1],
  [1, 0, 0, 1, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 1, 0, 0, 1, 0, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [1, 0, 1, 0, 0, 1, 1],
  [1, 1, 1, 0, 1, 0, 1],
];

const cornerStyle = {
  position: "absolute" as const,
  width: 14,
  height: 14,
  borderColor: "rgba(255,255,255,0.78)",
  zIndex: 20,
};

function hashSeed(seed: string) {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function pickAvatarTheme(seed: string) {
  return AVATAR_THEMES[hashSeed(seed) % AVATAR_THEMES.length];
}

function getInitial(name: string) {
  const initial = name.trim().charAt(0).toUpperCase();
  return initial || "K";
}

function formatLicenseNumber(seed: string) {
  const cleaned = seed.replace(/[^a-z0-9]/gi, "").toUpperCase();
  const prefix = (cleaned.slice(0, 3) || "KDO").padEnd(3, "0");
  const suffix = cleaned.slice(-4).padStart(4, "0");
  return `${prefix}-${suffix}`;
}

function formatCurrency(amount: number) {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

function renderIcon(Icon: React.ComponentType<any>, props: Record<string, unknown>) {
  return <Icon {...props} />;
}

function HunterLicenseCard({ 
  displayName, 
  isPro, 
  licenseNumber, 
  avatarUrl, 
  avatarSeed,
  userId
}: { 
  displayName: string; 
  isPro: boolean; 
  licenseNumber: string; 
  avatarUrl?: string | null; 
  avatarSeed: string;
  userId: string;
}) {
  const rotateY = useSharedValue(0);
  const isFlipped = useSharedValue(false);

  const flipGesture = Gesture.Tap().onEnd(() => {
    isFlipped.value = !isFlipped.value;
    rotateY.value = withSpring(isFlipped.value ? 180 : 0, {
      damping: 12,
      stiffness: 90,
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotateY.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      backfaceVisibility: "hidden",
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotateY.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      backfaceVisibility: "hidden",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  return (
    <GestureDetector gesture={flipGesture}>
      <View className="relative w-full aspect-[1.58] mx-auto mb-8 cursor-pointer mt-4" style={{ maxWidth: 340 }}>
        {/* Front Side */}
        <Animated.View style={[frontAnimatedStyle]} className="absolute inset-0 w-full h-full rounded-[14px] overflow-hidden bg-[#151515] border border-[#333] shadow-2xl flex-col shadow-black/50">
           {/* Corner Markers */}
           <View className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-white/80 rounded-tl-[2px] z-20" />
           <View className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-white/80 rounded-tr-[2px] z-20" />
           <View className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-white/80 rounded-bl-[2px] z-20" />
           <View className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-white/80 rounded-br-[2px] z-20" />

           <View className="relative z-20 flex-col h-full p-6">
              {/* Top Row: HUNTER Branding */}
              <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-col relative pt-1">
                      <Text className="text-[34px] font-black text-white tracking-[0.18em] leading-none italic drop-shadow-xl">HUNTER</Text>
                      <View className="h-[2px] w-[95%] bg-blue-500 mt-1 shadow-sm opacity-80"></View>
                      <Text className="text-[6px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-2 ml-1">KADO HUNTER ASSOCIATION</Text>
                  </View>
                  <View className="relative w-8 h-8 items-center justify-center">
                      <View className="w-5 h-5 bg-amber-500/90 border border-amber-600 shadow-xl" style={{ transform: [{ rotate: '45deg' }] }}></View>
                      <View className="absolute w-3.5 h-3.5 bg-[#151515]" style={{ transform: [{ rotate: '45deg' }] }}></View>
                  </View>
              </View>

              {/* Middle Section: Holographic Chip & QR */}
              <View className="flex-row items-center justify-between mb-2">
                  {/* Holographic Chip */}
                  <View className="w-14 h-10 bg-amber-500/20 rounded-[4px] border border-amber-500/30 relative overflow-hidden shadow-inner">
                      <View className="absolute top-1/2 left-0 w-full h-[1px] bg-black/30" />
                      <View className="absolute left-1/3 top-0 h-full w-[1px] bg-black/30" />
                      <View className="absolute left-[66%] top-0 h-full w-[1px] bg-black/30" />
                      <View className="absolute inset-x-2 top-2 bottom-2 border border-white/5 rounded-sm" />
                  </View>
                  
                  {/* QR Core */}
                  <View className="w-[68px] h-[68px] bg-white/[0.03] rounded-lg border border-white/10 p-[6px] items-center justify-center shadow-2xl backdrop-blur-md">
                      <QRCode value={`https://kado.gg/u/${userId}`} size={54} color="rgba(255,255,255,0.85)" backgroundColor="transparent" />
                  </View>
              </View>

              {/* Bottom Identity Block */}
              <View className="flex-row items-end mt-auto gap-4">
                  <View className="relative">
                      <View className="w-[52px] h-[52px] bg-black/80 rounded-lg border border-white/20 p-[2px] shadow-2xl overflow-hidden">
                          <Avatar imageUrl={avatarUrl} name={displayName} seed={avatarSeed} />
                      </View>
                  </View>
                  <View className="pb-1 flex-1">
                      <Text className="text-[5px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">IDENTITY VERIFIED</Text>
                      <Text className="text-xl font-black text-white leading-none tracking-tight uppercase" numberOfLines={1}>{displayName}</Text>
                      <View className="flex-row items-center gap-2 mt-2">
                          <View className={`px-2 py-0.5 rounded-[4px] border ${isPro ? 'bg-amber-500/10 border-amber-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                              <Text className={`text-[7px] font-black uppercase tracking-widest ${isPro ? 'text-amber-400' : 'text-blue-400'}`}>
                                  {isPro ? '★ SINGLE STAR' : 'PROVISIONAL'}
                              </Text>
                          </View>
                          <Text className="text-[8px] font-mono font-bold text-slate-500 tracking-wider">{licenseNumber}</Text>
                      </View>
                  </View>
              </View>
           </View>
        </Animated.View>

        {/* Back Side */}
        <Animated.View style={[backAnimatedStyle]} className="absolute inset-0 w-full h-full rounded-[14px] overflow-hidden bg-[#111] border border-[#333] flex flex-col shadow-2xl">
           <View className="w-full h-10 bg-[#000] border-b border-[#222] mt-5 relative overflow-hidden"></View>
           
           <View className="flex-1 flex-col p-5 gap-3">
               <View>
                   <Text className="text-[8px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Hunter Association</Text>
                   <Text className="text-[7px] text-slate-400 leading-relaxed font-mono">This license grants the holder access to restricted areas and trading platforms.</Text>
               </View>
               <View className="flex-1 justify-center border-t border-b border-[#222] py-2 my-1">
                   {/* Fake Socials Link Tree for Prototype Parity */}
                   <View className="flex-row items-center gap-2 p-1.5 rounded-md bg-white/5 mb-2">
                       <View className="w-6 h-6 bg-[#222] rounded flex items-center justify-center"><Text className="text-blue-500 font-bold text-[10px]">T</Text></View>
                       <Text className="text-[10px] font-mono text-slate-300">@{displayName}</Text>
                   </View>
               </View>
               <View>
                   <Text className="text-[7px] text-slate-600 font-mono">Property of the Hunter Association.</Text>
               </View>
           </View>
           
           <View className="w-full py-3 bg-blue-600/10 border-t border-blue-500/20 items-center justify-center">
               <Text className="text-blue-400 text-[10px] font-bold uppercase">Share Identity</Text>
           </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

function Avatar({
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

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 items-center">
      <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-midnight/60">
        {icon}
      </View>
      <Text className="text-xl font-bold text-light-slate">{value}</Text>
      <Text className="mt-1 text-[10px] font-medium text-slate-text">{label}</Text>
    </View>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: KadoColors.midnight },
        Platform.OS === "web"
          ? { width: "100%", maxWidth: 480, alignSelf: "center" }
          : null,
      ]}
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
  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: KadoColors.midnight },
        Platform.OS === "web"
          ? { width: "100%", maxWidth: 480, alignSelf: "center" }
          : null,
      ]}
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

      <FriendPicker 
        isVisible={isFriendPickerVisible}
        onClose={() => setIsFriendPickerVisible(false)}
        onSelect={async (friend) => {
          if (!sessionToShare) return;
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await shareSession({ sessionId: sessionToShare._id, friendIds: [friend._id] });
          setIsFriendPickerVisible(false);
          Alert.alert("Success", `Session shared with ${friend.name}!`);
        }}
      />
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
        tier: BackendTier;
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
  const [activeProvider, setActiveProvider] = useState<AuthProvider | null>(
    null
  );
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("Dashboard");
  const [friendQuery, setFriendQuery] = useState("");
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isFriendPickerVisible, setIsFriendPickerVisible] = useState(false);
  const [sessionToShare, setSessionToShare] = useState<any>(null);

  const friends = useQuery(api.friends.getFriends, isSignedIn ? {} : "skip");
  const pendingRequests = useQuery(api.friends.getPendingRequests, isSignedIn ? {} : "skip");
  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectRequest = useMutation(api.friends.rejectFriendRequest);

  // New hooks for Wishlist and History
  const wishlistItems = useQuery(api.wishlists.getWishlist, isSignedIn ? {} : "skip");
  const sessionHistory = useQuery(api.sessions.getSessionHistory, isSignedIn ? {} : "skip");
  const removeFromWishlist = useMutation(api.wishlists.removeFromWishlist);
  const startSession = useMutation(api.sessions.startSession);
  const shareSession = useMutation(api.sessions.shareSession);

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
    if (isSigningOut) {
      return;
    }

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
    if (activeProvider) {
      return;
    }

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
      if (resultType === "cancel" || resultType === "dismiss") {
        return;
      }

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

  const { isDesktop } = useResponsiveLayout();

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
        contentContainerStyle={{ paddingBottom: 40, alignSelf: isDesktop ? 'center' : 'auto', width: isDesktop ? 1100 : '100%' }}
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

        {/* Dashboard Content */}
        {activeTab === "Dashboard" && (
          <View style={isDesktop ? { flexDirection: 'row', gap: 40, paddingHorizontal: 20 } : {}}>
            <View style={isDesktop ? { width: 420 } : {}}>
              <GestureHandlerRootView>
                <HunterLicenseCard 
                  displayName={displayName}
                  isPro={isPro}
                  licenseNumber={licenseNumber}
                  avatarUrl={avatarUrl}
                  avatarSeed={avatarSeed}
                  userId={currentUser?._id ?? "anon"}
                />
              </GestureHandlerRootView>
            </View>
            
            <View style={isDesktop ? { flex: 1, paddingTop: 16 } : {}}>
              {!isPro && (
                <Pressable 
                  onPress={handleUpgrade}
                  className={`${isDesktop ? 'mb-6' : 'mx-5 mt-2'} overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 active:scale-[0.98]`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-6">
                      <View className="flex-row items-center gap-2 mb-2">
                        {renderIcon(Zap, { size: 16, color: "#f59e0b", fill: "#f59e0b" })}
                        <Text className="text-amber-500 text-[11px] font-black uppercase tracking-[0.2em]">Collector Grade</Text>
                      </View>
                      <Text className="text-light-slate text-xl font-bold">Try Hunter Net PRO</Text>
                      <Text className="text-slate-text text-sm mt-2 leading-6">Get unlimited daily scans, 7-day price history, and cloud backup for your binder.</Text>
                    </View>
                    {renderIcon(ChevronRight, { size: 24, color: KadoColors.slateText })}
                  </View>
                </Pressable>
              )}

              <View className={`${isDesktop ? 'mb-6' : 'mx-5 mt-5'} rounded-3xl border border-white/10 bg-navy/40 p-6`}>
                <View className="flex-row">
                  <StatTile
                    icon={renderIcon(Scan, { size: 20, color: KadoColors.umber })}
                    value={`${scansToday}/${maxScans === Infinity ? "\u221E" : maxScans}`}
                    label="Scans Today"
                  />
                  <View className="mx-4 w-px bg-white/10" />
                  <StatTile
                    icon={renderIcon(Wallet, { size: 20, color: KadoColors.umber })}
                    value={collectionCount.toString()}
                    label="Collection"
                  />
                  <View className="mx-4 w-px bg-white/10" />
                  <StatTile
                    icon={renderIcon(Crown, { size: 20, color: KadoColors.umber })}
                    value={formatCurrency(collectionValue)}
                    label="Value"
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Friends View */}
        {activeTab === "Friends" && (
          <View className={`${isDesktop ? 'px-10' : 'px-5'} mt-2`}>
            {/* Add Friend Input */}
            <View className="bg-navy/40 border border-white/10 p-5 rounded-3xl mb-8 flex-row gap-3 items-center">
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-text uppercase tracking-widest ml-3 mb-2">Hunter Tag Lookup</Text>
                <TextInput
                  placeholder="e.g. KDO-XXXX"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={friendQuery}
                  onChangeText={setFriendQuery}
                  autoCapitalize="characters"
                  className="bg-midnight/60 border border-white/5 rounded-2xl h-14 px-5 text-white font-bold"
                />
              </View>
              <Pressable 
                onPress={handleAddFriend}
                disabled={isAddingFriend || !friendQuery.trim()}
                className={`w-14 h-14 rounded-2xl items-center justify-center bg-amber-500 shadow-lg shadow-amber-500/20 active:scale-95 ${(!friendQuery.trim() || isAddingFriend) ? 'opacity-50' : ''}`}
              >
                {isAddingFriend ? <ActivityIndicator size="small" color="#050e1c" /> : <Plus size={24} color="#050e1c" />}
              </Pressable>
            </View>

            {/* Pending Requests */}
            {pendingRequests && pendingRequests.length > 0 && (
              <View className="mb-8">
                <Text className="text-lg font-black text-white mb-4">Pending Incoming</Text>
                {pendingRequests.map((req: any) => (
                  <View key={req._id} className="bg-navy/40 border border-white/10 p-5 rounded-3xl flex-row items-center gap-4 mb-3">
                    <View className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 items-center justify-center">
                      <Text className="text-amber-500 font-black">{(req.name || "K").charAt(0)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold">{req.name}</Text>
                      <Text className="text-xs text-slate-500 tracking-widest uppercase">{req.hunterTag}</Text>
                    </View>
                    <View className="flex-row gap-2">
                       <Pressable 
                         onPress={() => rejectRequest({ requestId: req._id as Id<"friendships"> })}
                         className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
                       >
                         <LogOut size={16} color="#fb7185" style={{ transform: [{ rotate: "180deg" }] }} />
                       </Pressable>
                       <Pressable 
                         onPress={() => acceptRequest({ requestId: req._id as Id<"friendships"> })}
                         className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                       >
                         <ShieldCheck size={16} color="#34d399" />
                       </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* My Friends */}
            <Text className="text-lg font-black text-white mb-4">Connections</Text>
            {friends === undefined ? (
              <ActivityIndicator color={KadoColors.umber} />
            ) : friends.length === 0 ? (
              <View className="py-12 items-center bg-navy/40 rounded-[32px] border border-white/5 border-dashed">
                {renderIcon(User, { size: 40, color: KadoColors.slateText })}
                <Text className="text-light-slate text-base font-bold mt-4">Isolated Hunter</Text>
                <Text className="text-slate-text text-sm mt-1 text-center px-10">Add friends to judge flea market sessions and enable direct trades.</Text>
              </View>
            ) : (
              <View className="gap-3">
                {friends.map((friend: any) => (
                  <Pressable 
                    key={friend._id}
                    className="bg-navy/40 border border-white/5 p-5 rounded-[32px] flex-row items-center gap-4 active:bg-white/5"
                  >
                    <View className="w-14 h-14 rounded-[20px] bg-sky-500/10 border border-sky-500/20 items-center justify-center">
                      <Text className="text-sky-400 font-black text-xl">{friend.name.charAt(0)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base">{friend.name}</Text>
                      <Text className="text-xs text-slate-500 tracking-widest uppercase">{friend.hunterTag}</Text>
                    </View>
                    <ChevronRight size={20} color={KadoColors.slateText} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Wishlist View */}
        {activeTab === "Wishlist" && (
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
                  onPress={() => setActiveTab("Dashboard")}
                  className="mt-8 bg-white/5 px-8 py-3 rounded-2xl border border-white/10"
                >
                  <Text className="text-white font-bold">Start Exploring</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-4">
                {wishlistItems.map((item: any) => (
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
                        await removeFromWishlist({ wishlistId: item._id });
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
        )}

        {/* History View */}
        {activeTab === "History" && (
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
                {sessionHistory.map((session: any) => (
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
