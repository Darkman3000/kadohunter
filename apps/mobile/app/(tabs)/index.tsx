import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/clerk-expo";
import {
  AlertTriangle,
  Camera,
  Check,
  FolderOpen,
  RotateCw,
  Scan,
  Sparkles,
  TrendingUp,
  Upload,
  WifiOff,
  X,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Defs, LinearGradient, Rect, Stop, Svg } from "react-native-svg";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { KadoColors } from "@/constants/theme";
import {
  recognitionService,
  type RecognitionResult,
} from "@/services/recognition";

const FREE_SCAN_LIMIT = 5;
const LOW_CONFIDENCE_THRESHOLD = 0.65;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FRAME_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 300);
const FRAME_HEIGHT = FRAME_WIDTH * 1.25;

const TrendingUpIconLocal = TrendingUp;

const CameraIcon = Camera as React.ComponentType<any>;
const ScanIcon = Scan as React.ComponentType<any>;
const UploadIcon = Upload as React.ComponentType<any>;
const AlertTriangleIcon = AlertTriangle as React.ComponentType<any>;
const WifiOffIcon = WifiOff as React.ComponentType<any>;
const SparklesIcon = Sparkles as React.ComponentType<any>;
const TrendingUpIcon = TrendingUpIconLocal as React.ComponentType<any>;
const CheckIcon = Check as React.ComponentType<any>;
const CloseIcon = X as React.ComponentType<any>;
const HistoryIcon = FolderOpen as React.ComponentType<any>;
const FlipIcon = RotateCw as React.ComponentType<any>;

type Feedback = {
  kind: "success" | "warning" | "error" | "info";
  message: string;
} | null;

type ScanSource = "camera" | "gallery";
type ConvexUser = {
  _id: Id<"users">;
  scansToday?: number;
  tier?: string;
};

const buildCardId = (result: RecognitionResult) => {
  const raw = [result.game, result.name, result.set, result.number]
    .filter(Boolean)
    .join("-");

  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `scan-${Date.now().toString(36)}`;
};

const getGameLabel = (game: RecognitionResult["game"]) => {
  switch (game) {
    case "pokemon":
      return "Pokémon";
    case "yugioh":
      return "Yu-Gi-Oh!";
    case "onepiece":
      return "One Piece";
    case "mtg":
      return "Magic";
    case "dragonball":
      return "Dragon Ball";
    default:
      return "Unknown TCG";
  }
};

const getRecognitionErrorMessage = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = message.toLowerCase();

  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("fetch") ||
    lower.includes("timeout")
  ) {
    return "Could not reach the recognition service. Check your connection and try again.";
  }

  if (
    lower.includes("recognition failed") ||
    lower.includes("invalid") ||
    lower.includes("unavailable")
  ) {
    return "Recognition failed. Try a sharper photo with better lighting.";
  }

  if (!message) {
    return "Could not identify the card. Try again.";
  }

  return message;
};

const getPermissionErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not open the photo library. Try again.";
};

type ScanMode = "Binder" | "Flea" | "Quick";

export default function ScannerScreen() {
  const router = useRouter();
  const { viewMode, scanId, sessionId } = useLocalSearchParams();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthLoaded && isSignedIn ? {} : "skip"
  ) as
    | ConvexUser
    | null
    | undefined;
  const stagedCard = useQuery(api.users.getStagedScanById,
    viewMode === "staged" ? { stagedId: scanId as Id<"stagedScans"> } : "skip"
  );

  const activeSession = useQuery(api.sessions.getActiveSession, { deviceId: "default" });

  const logScanAttempt = useMutation(api.users.logScanAttempt);
  const saveScanToCollection = useMutation(api.users.saveScanToCollection);

  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanSource, setScanSource] = useState<ScanSource | null>(null);
  const [scanResult, setScanResult] = useState<RecognitionResult | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("Binder");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const saveToStaged = useMutation(api.users.saveToStaged);
  const scanLineOffset = useSharedValue(FRAME_HEIGHT * 0.16);

  const scansToday = currentUser?.scansToday ?? 0;
  const isFreeTier = (currentUser?.tier ?? "free") === "free";
  const scanCountLabel = isFreeTier
    ? `${scansToday}/${FREE_SCAN_LIMIT}`
    : `${scansToday}`;
  const canSaveToBinder = Boolean(isSignedIn && currentUser?._id) && !isSaving;

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = setTimeout(() => {
      setFeedback(null);
    }, feedback.kind === "error" ? 5000 : 3200);

    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (isScanning) {
      scanLineOffset.value = 0;
      scanLineOffset.value = withRepeat(
        withTiming(FRAME_HEIGHT - 8, {
          duration: 1450,
          easing: Easing.inOut(Easing.linear),
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(scanLineOffset);
      scanLineOffset.value = FRAME_HEIGHT * 0.16;
    }

    return () => cancelAnimation(scanLineOffset);
  }, [isScanning, scanLineOffset]);

  const scanLineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineOffset.value }],
  }));

  const showFeedback = useCallback(
    (kind: NonNullable<Feedback>["kind"], message: string) => {
      setFeedback({ kind, message });
    },
    []
  );

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      Alert.alert(
        "Open Settings",
        "Enable camera or photo library access in your device settings."
      );
    });
  }, []);

  const handlePermissionRequest = useCallback(async () => {
    if (permission?.canAskAgain) {
      const response = await requestPermission();
      if (!response.granted && !response.canAskAgain) {
        handleOpenSettings();
      }
      return;
    }

    handleOpenSettings();
  }, [handleOpenSettings, permission?.canAskAgain, requestPermission]);

  const runRecognition = useCallback(
    async (base64: string, source: ScanSource) => {
      if (isScanning || isSaving) {
        return;
      }

      setScanSource(source);
      setScanResult(null);
      setFeedback(null);
      setIsScanning(true);

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const result = await recognitionService.identify(base64);
        setScanResult(result);

        if (result.confidence < LOW_CONFIDENCE_THRESHOLD) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          showFeedback(
            "warning",
            "Low confidence. Verify the card details before saving."
          );
        } else {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          showFeedback("success", `${result.name} identified.`);
        }
      } catch (error) {
        const message = getRecognitionErrorMessage(error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showFeedback("error", message);
        Alert.alert("Recognition failed", message);
      } finally {
        setIsScanning(false);
        setScanSource(null);
      }
    },
    [isSaving, isScanning, showFeedback]
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isScanning || isSaving) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        throw new Error("Camera capture did not include image data.");
      }

      await runRecognition(photo.base64, "camera");
    } catch (error) {
      const message = getRecognitionErrorMessage(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFeedback("error", message);
      Alert.alert("Capture failed", message);
    }
  }, [isSaving, isScanning, runRecognition, showFeedback]);

  const handleUpload = useCallback(async () => {
    if (isScanning || isSaving) {
      return;
    }

    try {
      const libraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!libraryPermission.granted) {
        const message =
          libraryPermission.canAskAgain === false
            ? "Allow photo library access in Settings to upload a card photo."
            : "Photo library access is required to upload a card photo.";

        showFeedback("warning", message);

        Alert.alert("Photo library access required", message, [
          { text: "Cancel", style: "cancel" },
          {
            text: libraryPermission.canAskAgain === false ? "Open Settings" : "Allow",
            onPress: libraryPermission.canAskAgain === false ? handleOpenSettings : handleUpload,
          },
        ]);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.85,
        allowsEditing: false,
      });

      if (result.canceled) {
        return;
      }

      const base64 = result.assets?.[0]?.base64;
      if (!base64) {
        throw new Error("Selected image could not be read.");
      }

      await runRecognition(base64, "gallery");
    } catch (error) {
      const message = getPermissionErrorMessage(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFeedback("error", message);
      Alert.alert("Upload failed", message);
    }
  }, [
    handleOpenSettings,
    handlePermissionRequest,
    isSaving,
    isScanning,
    runRecognition,
    showFeedback,
  ]);

  const handleDismissResult = useCallback(() => {
    setScanResult(null);
    setFeedback(null);
  }, []);

  const handleSaveResult = useCallback(async () => {
    if (!scanResult || isSaving) {
      return;
    }

    if (isAuthLoaded && !isSignedIn) {
      showFeedback("info", "Sign in to save cards to your binder.");
      router.push("/profile");
      return;
    }

    if (!currentUser?._id) {
      showFeedback("info", "Your account is still syncing. Try again in a moment.");
      return;
    }

    setIsSaving(true);

    try {
      const cardId = buildCardId(scanResult);

      if (scanMode === "Binder") {
        const allowed = await logScanAttempt({ userId: currentUser._id });
        if (!allowed) {
          showFeedback("warning", "Free scan limit reached. Upgrade to keep scanning.");
          router.push("/subscription");
          return;
        }

        await saveScanToCollection({
          userId: currentUser._id,
          gameCode: scanResult.game,
          cardId,
          cardName: scanResult.name,
          setName: scanResult.set,
          rarity: scanResult.rarity,
          number: scanResult.number,
          condition: "NM",
          foil: false,
          finish: "Normal",
          marketTrend: "stable",
          estimatedPrice: scanResult.estimatedPriceUsd,
          imageUrl: scanResult.imageUrl ?? undefined,
        });
        showFeedback("success", `${scanResult.name} added to your binder.`);
      } else if (scanMode === "Flea") {
          const stagedId = await saveToStaged({
            userId: currentUser._id,
            deviceId: "default",
            sessionId: activeSession?._id,
            gameCode: scanResult.game,
            cardId,
            cardName: scanResult.name,
            setName: scanResult.set,
            imageUrl: scanResult.imageUrl ?? undefined,
            rarity: scanResult.rarity,
            marketPrice: scanResult.estimatedPriceUsd,
          });
        showFeedback("success", "Card added to Flea Session.");
        router.push(`/card/${stagedId}?mode=staged`);
      } else {
        // Quick mode - just view
        router.push(`/card/market?cardId=${encodeURIComponent(cardId)}&gameCode=${scanResult.game}&mode=market`);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanResult(null);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not save the card. Check your connection and try again.";

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFeedback("error", message);
      Alert.alert("Save failed", message);
    } finally {
      setIsSaving(false);
    }
  }, [
    currentUser?._id,
    isAuthLoaded,
    isSaving,
    isSignedIn,
    logScanAttempt,
    router,
    saveScanToCollection,
    saveToStaged,
    scanMode,
    scanResult,
    showFeedback,
  ]);

  if (!permission) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: KadoColors.midnight }}
        edges={["top"]}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={KadoColors.umber} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: KadoColors.midnight }}
        edges={["top"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full max-w-[320px] items-center">
            <View className="w-16 h-16 rounded-full bg-navy border border-white/10 items-center justify-center mb-6">
              <ScanIcon
                size={28}
                style={{ color: KadoColors.umber }}
                strokeWidth={1.8}
              />
            </View>
            <Text className="text-light-slate text-[28px] font-bold mb-2 text-center tracking-tight">
              {permission.canAskAgain ? "Camera Access Required" : "Camera Access Denied"}
            </Text>
            <Text className="text-slate-text text-base text-center mb-7 leading-6 max-w-[260px]">
              Enable camera permissions to scan cards instantly.
              {"\n"}
              You can still upload a photo instead.
            </Text>
            <Pressable
              onPress={handleUpload}
              className="w-full max-w-[220px] flex-row items-center justify-center gap-2 px-6 py-3 bg-navy border border-white/10 rounded-xl active:scale-95"
            >
              <UploadIcon size={18} style={{ color: KadoColors.lightSlate }} />
              <Text className="text-light-slate font-bold text-sm">
                Upload Photo
              </Text>
            </Pressable>
            <Pressable
              onPress={handlePermissionRequest}
              className="mt-4 px-4 py-2 active:scale-95"
            >
              <Text className="text-slate-text text-sm font-semibold">
                {permission.canAskAgain ? "Grant Permission" : "Open Settings"}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: KadoColors.midnight }}
      edges={["top"]}
    >
      <View className="flex-1 bg-midnight">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          mode="picture"
        >
          <View className="absolute inset-0 bg-midnight/10" />

          <View className="flex-1 justify-between">
            <View className="flex-row justify-between items-start px-6 pt-6">
              <View className="px-5 py-2.5 rounded-full bg-black/60 border border-umber/30">
                <Text className="text-umber text-[11px] font-bold tracking-[0.22em] uppercase">
                  Collection Mode
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Pressable className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 items-center justify-center active:scale-95">
                  <HistoryIcon size={18} color={KadoColors.lightSlate} />
                </Pressable>
                <Pressable className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 items-center justify-center active:scale-95">
                  <FlipIcon size={18} color={KadoColors.lightSlate} />
                </Pressable>
              </View>
            </View>

            {feedback && (
              <View className="absolute top-20 left-4 right-4 z-20">
                <View
                  className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
                    feedback.kind === "error"
                      ? "border-rose-400/30 bg-rose-500/15"
                      : feedback.kind === "warning"
                        ? "border-amber-400/30 bg-amber-500/15"
                        : feedback.kind === "info"
                          ? "border-sky-400/30 bg-sky-500/15"
                        : "border-emerald-400/30 bg-emerald-500/15"
                  }`}
                >
                  {feedback.kind === "error" ? (
                    <WifiOffIcon size={18} style={{ color: "#fda4af" }} />
                  ) : feedback.kind === "warning" ? (
                    <AlertTriangleIcon size={18} style={{ color: "#fbbf24" }} />
                  ) : feedback.kind === "info" ? (
                    <SparklesIcon size={18} style={{ color: "#7dd3fc" }} />
                  ) : (
                    <SparklesIcon size={18} style={{ color: "#34d399" }} />
                  )}
                  <Text className="flex-1 text-light-slate text-sm font-medium">
                    {feedback.message}
                  </Text>
                </View>
              </View>
            )}

            {(isScanning || isSaving) && (
              <View className="absolute bottom-28 left-4 right-4 z-20">
                <View className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-navy/85 px-4 py-3">
                  <ActivityIndicator size="small" color={KadoColors.umber} />
                  <View className="flex-1">
                    <Text className="text-light-slate text-sm font-bold">
                      {isSaving ? "Saving scan..." : "Analyzing card..."}
                    </Text>
                    <Text className="text-slate-text text-xs mt-0.5">
                      {scanSource === "gallery"
                        ? "Reviewing the uploaded photo."
                        : "Hold steady while the camera capture is processed."}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View className="items-center justify-center flex-1">
              <View
                style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
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

            {/* ── Mode Selector ── */}
            <View className="items-center pb-8">
              <View className="flex-row bg-black/60 rounded-full p-1 border border-white/10">
                {(["Binder", "Flea", "Quick"] as const).map((mode) => (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setScanMode(mode);
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

            <View className="flex-row items-center justify-between px-10 pb-12">
              <Pressable
                onPress={handleUpload}
                className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 items-center justify-center active:scale-95"
              >
                <View className="items-center">
                  <Text className="text-[10px] font-black tracking-tighter text-umber">BULK</Text>
                  <Text className="text-[8px] font-bold text-white/40">OFF</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={handleCapture}
                disabled={isScanning || isSaving}
                className="w-20 h-20 rounded-full border-[6px] border-white/20 bg-black/15 items-center justify-center active:scale-95"
              >
                <View
                  >
                  {(isScanning || isSaving) && (
                    <ActivityIndicator size="small" color={KadoColors.umber} />
                  )}
                </View>
              </Pressable>

              <View className="w-12 h-12 items-center justify-center">
                <View className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                   <Text className="text-[10px] font-bold text-slate-text">{scanCountLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        </CameraView>

        {scanResult && (
          <Animated.View
            entering={FadeInDown.duration(220)}
            exiting={FadeOutDown.duration(180)}
            className="absolute inset-x-0 bottom-6 px-4"
          >
            <View
              className="rounded-3xl border border-white/10 overflow-hidden"
              style={{
                backgroundColor: "rgba(15, 27, 49, 0.9)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.3,
                shadowRadius: 28,
                elevation: 16,
              }}
            >
              <Pressable
                onPress={handleDismissResult}
                disabled={isSaving}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/35 border border-white/10 items-center justify-center active:scale-95"
              >
                <CloseIcon size={16} style={{ color: KadoColors.lightSlate }} />
              </Pressable>

              <View className="p-5">
                <View className="flex-row gap-4">
                  {scanResult.imageUrl ? (
                    <Image
                      source={{ uri: scanResult.imageUrl }}
                      style={{ width: 84, height: 116, borderRadius: 12 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-[84px] h-[116px] rounded-xl bg-midnight/50 items-center justify-center">
                      <CameraIcon
                        size={24}
                        style={{ color: KadoColors.slateText }}
                        strokeWidth={1.5}
                      />
                    </View>
                  )}

                  <View className="flex-1 justify-center">
                    <View className="flex-row flex-wrap gap-2 mb-2">
                      <View className="px-2.5 py-1 rounded-full bg-umber/15 border border-umber/20">
                        <Text className="text-umber text-[10px] font-bold tracking-widest uppercase">
                          {getGameLabel(scanResult.game)}
                        </Text>
                      </View>
                      <View className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                        <Text className="text-light-slate text-[10px] font-bold tracking-widest uppercase">
                          {scanResult.rarity}
                        </Text>
                      </View>
                      <View className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                        <Text className="text-slate-text text-[10px] font-bold tracking-widest uppercase">
                          {scanResult.providerUsed}
                        </Text>
                      </View>
                    </View>

                    <Text
                      className="text-light-slate text-lg font-bold mb-1"
                      numberOfLines={2}
                    >
                      {scanResult.name}
                    </Text>
                    <Text className="text-slate-text text-xs mb-2">
                      {scanResult.set} {"\u00B7"} {scanResult.number}
                    </Text>

                    <View className="flex-row items-center gap-2">
                      <Text className="text-light-slate text-2xl font-bold">
                        ${scanResult.estimatedPriceUsd.toFixed(2)}
                      </Text>
                      <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10">
                        <TrendingUpIcon size={12} style={{ color: "#10b981" }} />
                        <Text className="text-[10px] font-bold text-emerald-400">
                          Market
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="mt-4 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-slate-text text-[10px] font-bold tracking-[0.24em] uppercase">
                      Confidence
                    </Text>
                    <Text
                      className={`text-[10px] font-bold uppercase tracking-[0.24em] ${
                        scanResult.confidence < LOW_CONFIDENCE_THRESHOLD
                          ? "text-amber-400"
                          : "text-light-slate"
                      }`}
                    >
                      {(scanResult.confidence * 100).toFixed(0)}% match
                    </Text>
                  </View>

                  <View className="h-2 rounded-full bg-midnight/60 overflow-hidden flex-row">
                    <View
                      className="h-full rounded-full bg-umber"
                      style={{ width: `${Math.max(8, scanResult.confidence * 100)}%` }}
                    />
                  </View>

                  {scanResult.confidence < LOW_CONFIDENCE_THRESHOLD && (
                    <View className="flex-row items-center gap-2 mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2">
                      <AlertTriangleIcon size={14} style={{ color: "#fbbf24" }} />
                      <Text className="flex-1 text-amber-100 text-xs">
                        Low confidence. Verify the card details before saving.
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={handleDismissResult}
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 items-center active:scale-95"
                  >
                    <Text className="text-light-slate font-bold text-sm">
                      Dismiss
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveResult}
                    disabled={!canSaveToBinder}
                    className="flex-1 py-3 rounded-xl bg-umber items-center flex-row justify-center gap-2 active:scale-95"
                    style={!canSaveToBinder ? { opacity: 0.6 } : undefined}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color={KadoColors.midnight} />
                    ) : !currentUser?._id ? (
                      <SparklesIcon
                        size={16}
                        style={{ color: KadoColors.midnight }}
                      />
                    ) : (
                      <CheckIcon size={16} style={{ color: KadoColors.midnight }} />
                    )}
                    <Text className="text-midnight font-bold text-sm">
                      {isSaving
                        ? "Saving..."
                        : isAuthLoaded && !isSignedIn
                          ? "Sign In to Save"
                        : !currentUser?._id
                          ? "Syncing Account..."
                          : "Add to Binder"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
