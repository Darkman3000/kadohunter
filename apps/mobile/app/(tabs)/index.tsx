import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useAuth } from "@clerk/clerk-expo";
import {
  FolderOpen,
  RotateCw,
  Scan,
  Upload,
  WifiOff,
  AlertTriangle,
  Sparkles,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAction, useMutation, useQuery } from "convex/react";
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from "react-native-reanimated";
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { KadoColors } from "@/constants/theme";
import { BREAKPOINTS } from "@/constants/breakpoints";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { getOrCreateDeviceId } from "@/lib/device-id";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import {
  recognitionService,
  type RecognitionResult,
} from "@/services/recognition";
import { ScanResultCard, ScannerFrame, ScanModeSelector, type ScanMode, DesktopDropzone } from "../../components/scanner";
import { scanLimits } from "@kado/domain";

const FREE_SCAN_LIMIT = scanLimits.free;
const LOW_CONFIDENCE_THRESHOLD = 0.65;

const ScanIcon = Scan as React.ComponentType<any>;
const UploadIcon = Upload as React.ComponentType<any>;
const AlertTriangleIcon = AlertTriangle as React.ComponentType<any>;
const WifiOffIcon = WifiOff as React.ComponentType<any>;
const SparklesIcon = Sparkles as React.ComponentType<any>;
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

export default function ScannerScreen() {
  const router = useRouter();
  const { width: winW } = useWindowDimensions();
  const { isDesktop, isLargeDesktop, availableWidth } = useResponsiveLayout();
  const { frameWidth, frameHeight } = useMemo(() => {
    const isDesktopWeb = Platform.OS === "web" && isLargeDesktop;
    const base = isDesktopWeb ? availableWidth : winW;
    const fw = Math.min(base * (isDesktopWeb ? 0.42 : 0.72), isDesktopWeb ? 480 : 300);
    const fh = fw * 1.25;
    return { frameWidth: fw, frameHeight: fh };
  }, [winW, availableWidth, isLargeDesktop]);
  const { viewMode, scanId, sessionId } = useLocalSearchParams();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [deviceId, setDeviceId] = useState<string | null>(null);
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

  const activeSession = useQuery(
    api.sessions.getActiveSession,
    deviceId ? { deviceId } : "skip"
  );

  const logScanAttempt = useMutation(api.users.logScanAttempt);
  const saveScanToCollection = useMutation(api.users.saveScanToCollection);
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const getStorageUrl = useMutation(api.images.getStorageUrl);

  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedBoxes, setDetectedBoxes] = useState<Array<{ box_2d: number[] }>>([])
  const [awaitingSelection, setAwaitingSelection] = useState(false);
  const pendingBase64Ref = useRef<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [scanSource, setScanSource] = useState<ScanSource | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<RecognitionResult | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("Binder");
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [useDesktopWebcam, setUseDesktopWebcam] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fetchUrlAsBase64 = useAction(api.images.fetchUrlAsBase64);
  const saveToStaged = useMutation(api.users.saveToStaged);
  const scanLineOffset = useSharedValue(frameHeight * 0.16);

  const scansToday = currentUser?.scansToday ?? 0;
  const isFreeTier = (currentUser?.tier ?? "free") === "free";
  const scanCountLabel = isFreeTier
    ? `${scansToday}/${FREE_SCAN_LIMIT}`
    : `${scansToday}`;
  const canSaveToBinder = Boolean(isSignedIn && currentUser?._id) && !isSaving;

  useEffect(() => {
    let cancelled = false;
    void getOrCreateDeviceId().then((id) => {
      if (!cancelled) setDeviceId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;

    const timeout = setTimeout(() => {
      setFeedback(null);
    }, feedback.kind === "error" ? 5000 : 3200);

    return () => clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    if (!isScanning) {
      scanLineOffset.value = frameHeight * 0.16;
    }
  }, [frameHeight, isScanning, scanLineOffset]);

  useEffect(() => {
    if (isScanning) {
      scanLineOffset.value = 0;
      scanLineOffset.value = withRepeat(
        withTiming(frameHeight - 8, {
          duration: 1450,
          easing: Easing.inOut(Easing.linear),
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(scanLineOffset);
      scanLineOffset.value = frameHeight * 0.16;
    }

    return () => cancelAnimation(scanLineOffset);
  }, [isScanning, frameHeight, scanLineOffset]);

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
      Linking.openURL("app-settings:").catch(() => {
        Alert.alert(
          "Open Settings Manually",
          "Go to your phone Settings → Apps → Kado Hunter → Permissions → Camera → Allow."
        );
      });
    });
  }, []);

  const [isWebCameraRequested, setIsWebCameraRequested] = useState(false);

  const handlePermissionRequest = useCallback(async () => {
    if (Platform.OS === "web") {
      setIsWebCameraRequested(true);
      return;
    }

    if (permission?.canAskAgain) {
      const response = await requestPermission();
      if (!response.granted && !response.canAskAgain) {
        handleOpenSettings();
      }
      return;
    }
    handleOpenSettings();
  }, [handleOpenSettings, permission?.canAskAgain, requestPermission]);

  /** Run identification on an already-isolated base64 image. */
  const runIdentify = useCallback(
    async (base64: string) => {
      setIsScanning(true);
      try {
        const result = await recognitionService.identify(base64);
        setScanResult(result);

        if (result.confidence < LOW_CONFIDENCE_THRESHOLD) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          showFeedback("warning", "Low confidence. Verify the card details before saving.");
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showFeedback("success", `${result.name} identified.`);
        }
      } catch (error) {
        const message = getRecognitionErrorMessage(error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showFeedback("error", message);
        Alert.alert("Recognition failed", message);
        setPreviewUri(null);
      } finally {
        setIsScanning(false);
        setScanSource(null);
        setAwaitingSelection(false);
      }
    },
    [showFeedback]
  );

  const runRecognition = useCallback(
    async (base64: string, source: ScanSource) => {
      if (isScanning || isSaving || isDetecting) return;

      setDetectedBoxes([]);
      setAwaitingSelection(false);
      setScanSource(source);
      setScanResult(null);
      setFeedback(null);
      pendingBase64Ref.current = base64;

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const geminiProvider = recognitionService as any;
        if (geminiProvider.detectEdges) {
          // Step 1: Run fast edge detection first
          setIsDetecting(true);
          showFeedback("info", "Scanning for cards...");
          let boxes: Array<{ box_2d: number[] }> = [];
          try {
            boxes = await geminiProvider.detectEdges(base64);
          } catch (e: any) {
            console.warn("Edge detection failed:", e);
          }
          setIsDetecting(false);

          if (boxes && boxes.length > 0) {
            setDetectedBoxes(boxes);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          // Step 2: If multiple cards detected, pause and let user pick
          if (boxes.length > 1) {
            setAwaitingSelection(true);
            showFeedback("info", `${boxes.length} cards detected — tap one to scan.`);
            return; // Stop here. User will tap a box to continue.
          }
        }

        // Single card (or no detection available) — scan immediately
        setIsScanning(true);
        // Fire detection visual in parallel for single-card lock-on effect
        const result = await recognitionService.identify(base64);
        setScanResult(result);

        if (result.confidence < LOW_CONFIDENCE_THRESHOLD) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          showFeedback("warning", "Low confidence. Verify the card details before saving.");
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showFeedback("success", `${result.name} identified.`);
        }
      } catch (error) {
        const message = getRecognitionErrorMessage(error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showFeedback("error", message);
        Alert.alert("Recognition failed", message);
        setPreviewUri(null);
      } finally {
        setIsScanning(false);
        setIsDetecting(false);
        setScanSource(null);
      }
    },
    [isSaving, isScanning, isDetecting, showFeedback, runIdentify]
  );

  /** User tapped a detected bounding box — crop and scan that region. */
  const handleBoxTap = useCallback(
    async (box: { box_2d: number[] }) => {
      if (isScanning || !previewUri || !pendingBase64Ref.current) return;

      const [ymin, xmin, ymax, xmax] = box.box_2d;

      try {
        setAwaitingSelection(false);
        showFeedback("info", "Cropping and scanning...");
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Highlight only the tapped box
        setDetectedBoxes([box]);

        // Gemini returns [ymin, xmin, ymax, xmax] in 0-1000 range
        const originX = xmin / 1000;
        const originY = ymin / 1000;
        const cropWidth = (xmax - xmin) / 1000;
        const cropHeight = (ymax - ymin) / 1000;

        // Use imageNaturalSize for accurate pixel mapping if available, otherwise fallback to 640
        const imgW = imageNaturalSize?.width ?? 640;
        const imgH = imageNaturalSize?.height ?? (imgW * 1.4);

        const cropped = await manipulateAsync(
          previewUri,
          [
            {
              crop: {
                originX: Math.round(originX * imgW),
                originY: Math.round(originY * imgH),
                width: Math.round(cropWidth * imgW),
                height: Math.round(cropHeight * imgH),
              },
            },
            { resize: { width: 640 } },
          ],
          { compress: 0.7, format: SaveFormat.JPEG, base64: true }
        );

        if (!cropped.base64) {
          throw new Error("Failed to crop the selected card.");
        }

        // Update preview so the result sheet shows the cropped card thumbnail
        setPreviewUri(cropped.uri);
        await runIdentify(cropped.base64);
      } catch (error) {
        const message = getRecognitionErrorMessage(error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showFeedback("error", message);
      }
    },
    [isScanning, previewUri, showFeedback, runIdentify]
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isScanning || isSaving) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
        quality: 1,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        throw new Error("Camera capture did not generate an image URI.");
      }

      setPreviewUri(photo.uri);
      setScanResult(null);
      setFeedback(null);

      const compressed = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { compress: 0.6, format: SaveFormat.JPEG, base64: true }
      );

      if (!compressed.base64) {
        throw new Error("Failed to compress image.");
      }

      await runRecognition(compressed.base64, "camera");
    } catch (error) {
      const message = getRecognitionErrorMessage(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFeedback("error", message);
      Alert.alert("Capture failed", message);
      setPreviewUri(null);
    }
  }, [isSaving, isScanning, runRecognition, showFeedback]);

  const handleUpload = useCallback(async () => {
    if (isScanning || isSaving) return;

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
        base64: false,
        quality: 1,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const uri = result.assets[0].uri;
      setPreviewUri(uri);
      setScanResult(null);
      setFeedback(null);

      const compressed = await manipulateAsync(
        uri,
        [{ resize: { width: 640 } }],
        { compress: 0.6, format: SaveFormat.JPEG, base64: true }
      );

      if (!compressed.base64) {
        throw new Error("Selected image could not be read or compressed.");
      }

      await runRecognition(compressed.base64, "gallery");
    } catch (error) {
      const message = getPermissionErrorMessage(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFeedback("error", message);
      Alert.alert("Upload failed", message);
      setPreviewUri(null);
    }
  }, [
    handleOpenSettings,
    isSaving,
    isScanning,
    runRecognition,
    showFeedback,
  ]);

  const handleDesktopFileOrUrl = useCallback(async (fileOrBase64: File | string, method: "drop" | "upload" | "paste") => {
    if (isScanning || isSaving) return;

    setScanResult(null);
    setFeedback(null);
    
    try {
      if (typeof fileOrBase64 === "string" && !fileOrBase64.startsWith("http")) { // Directly passed base64 bytes
        await runRecognition(fileOrBase64, method === "paste" ? "gallery" : "camera");
        return;
      }
      
      if (typeof fileOrBase64 === "string" && fileOrBase64.startsWith("http")) { // URL proxy paste
         setIsScanning(true);
         const base64Data = await fetchUrlAsBase64({ url: fileOrBase64 });
         setPreviewUri(`data:image/jpeg;base64,${base64Data}`);
         await runRecognition(base64Data, "gallery");
         return;
      }
      
      const file = fileOrBase64 as File;
      const reader = new FileReader();

      reader.onload = async () => {
        const raw = reader.result as string;
        setPreviewUri(raw); 

        const compressed = await manipulateAsync(
          raw,
          [{ resize: { width: 640 } }],
          { compress: 0.6, format: SaveFormat.JPEG, base64: true }
        );

        if (!compressed.base64) {
          throw new Error("Selected image could not be read or compressed.");
        }

        await runRecognition(compressed.base64, "gallery");
      };
      
      reader.onerror = () => {
        setIsScanning(false);
        showFeedback("error", "Error reading dropped file");
      }

      reader.readAsDataURL(file);
    } catch (err: unknown) {
       setIsScanning(false);
       let errMsg = "Could not process image";
       if (err instanceof Error) errMsg = err.message;
       showFeedback("error", errMsg);
    }
  }, [isScanning, isSaving, fetchUrlAsBase64, runRecognition, showFeedback]);

  // Global Paste Interceptor for Web Desktop
  useEffect(() => {
    if (Platform.OS !== "web" || !isLargeDesktop) return;

    const handlePasteEvent = async (e: any) => {
      // e defaults to any type to avoid native TS compilation errors involving ClipboardEvent
      const clipboardEvent = e as Event & { clipboardData?: { files: FileList, getData: (format: string) => string } };
      
      // Ignore if user is typing into an input
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      
      if (isScanning) return;
      
      // Case A: Image File inside clipboard
      const files = Array.from(clipboardEvent.clipboardData?.files ?? []);
      const imageFile = files.find(f => f.type.startsWith("image/"));
      
      if (imageFile) {
        handleDesktopFileOrUrl(imageFile, "paste");
        return;
      }

      // Case B: HTTP string inside clipboard
      const pastedText = clipboardEvent.clipboardData?.getData("text/plain")?.trim();
      if (pastedText && (pastedText.startsWith("http://") || pastedText.startsWith("https://"))) {
        
        // Show scanning state instantly for networking operation
        setIsScanning(true);
        handleDesktopFileOrUrl(pastedText, "paste");
      }
    };
    
    document.addEventListener("paste", handlePasteEvent);
    return () => {
      document.removeEventListener("paste", handlePasteEvent);
    };
  }, [isLargeDesktop, isScanning, handleDesktopFileOrUrl]);

  const handleDismissResult = useCallback(() => {
    setScanResult(null);
    setPreviewUri(null);
    setFeedback(null);
  }, []);

  const handleSaveResult = useCallback(async () => {
    if (!scanResult || isSaving) return;

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

      // Upload local photo to Convex Storage to get a persistent URL
      let resolvedImageUrl: string | undefined = scanResult.imageUrl;
      if (!resolvedImageUrl && previewUri && previewUri.startsWith("file")) {
        try {
          const uploadUrl = await generateUploadUrl();
          const photoRes = await fetch(previewUri);
          const blob = await photoRes.blob();
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": blob.type || "image/jpeg" },
            body: blob,
          });
          const { storageId } = await uploadRes.json();
          const permanentUrl = await getStorageUrl({ storageId });
          if (permanentUrl) resolvedImageUrl = permanentUrl;
        } catch (uploadErr) {
          console.warn("Failed to upload photo to storage:", uploadErr);
          // Non-fatal — continue saving without image
        }
      }

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
          foil: scanResult.finish !== "Normal",
          finish: scanResult.finish ?? "Normal",
          marketTrend: "stable",
          estimatedPrice: scanResult.estimatedPriceUsd,
          imageUrl: resolvedImageUrl ?? undefined,
        });
        showFeedback("success", `${scanResult.name} added to your binder.`);
      } else if (scanMode === "Flea") {
          const resolvedDeviceId = deviceId ?? (await getOrCreateDeviceId());
          if (!deviceId) setDeviceId(resolvedDeviceId);
          const stagedId = await saveToStaged({
            userId: currentUser._id,
            deviceId: resolvedDeviceId,
            sessionId: activeSession?._id,
            gameCode: scanResult.game,
            cardId,
            cardName: scanResult.name,
            setName: scanResult.set,
            imageUrl: resolvedImageUrl ?? undefined,
            rarity: scanResult.rarity,
            marketPrice: scanResult.estimatedPriceUsd,
          });
        showFeedback("success", "Card added to Flea Session.");
        router.push(`/card/${stagedId}?mode=staged`);
      } else {
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
    deviceId,
    activeSession?._id,
  ]);

  // Subscribe to real price via Convex reactivity if the scan result is pending pricing
  const realPriceData = useQuery(
    api.prices.getLatestPrice,
    scanResult?.cardId && scanResult?.pricePending
      ? { cardId: scanResult.cardId, gameCode: scanResult.game }
      : "skip"
  );

  useEffect(() => {
    // When the real price arrives, update the scanResult state
    if (realPriceData && scanResult && scanResult.pricePending) {
      setScanResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          estimatedPriceUsd: realPriceData.marketPrice,
          pricePending: false, // Stop polling
          imageUrl: realPriceData.imageUrl || prev.imageUrl, // Also take image if we found a better one
        };
      });
    }
  }, [realPriceData, scanResult]);

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

  // On web, if the user clicked the button, bypass the guard and let CameraView mount
  if (!permission.granted && !(Platform.OS === "web" && isWebCameraRequested)) {
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
              className="w-full max-w-[220px] flex-row items-center justify-center gap-2 px-6 py-3 mt-3 rounded-xl active:scale-95"
              style={{ backgroundColor: KadoColors.umber }}
            >
              <Text className="text-midnight font-bold text-sm">
                {permission.canAskAgain ? "Grant Camera Access" : "Open Settings"}
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
      {isLargeDesktop && (
        <View
          style={{
            paddingHorizontal: 40,
            paddingTop: 20,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
          }}
        >
          <Text style={{ color: "#475569", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
            Scanner
          </Text>
          <Text style={{ color: "#ccd6f6", fontSize: 22, fontWeight: "800" }}>Scan Card</Text>
        </View>
      )}
      <View style={{ flex: 1, flexDirection: isLargeDesktop ? "row" : "column" }}>
        {/* Camera pane / Desktop Dropzone branch */}
        <View style={{ flex: 1, position: "relative" }}>
        {isLargeDesktop && !useDesktopWebcam ? (
          <View className="flex-1 flex-col justify-between">
            <View className="flex-row justify-between items-start px-6 pt-6 absolute w-full top-0 z-10">
               <View className="px-5 py-2.5 rounded-full bg-black/60 border border-umber/30 backdrop-blur-md">
                <Text className="text-umber text-[11px] font-bold tracking-[0.22em] uppercase">
                  Scanner Interface
                </Text>
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
                  {/* ... reusing feedback component ... */}
                  <Text className="flex-1 text-light-slate text-sm font-medium">
                    {feedback.message}
                  </Text>
                </View>
              </View>
            )}

            <DesktopDropzone 
              isScanning={isScanning}
              onImageCaptured={handleDesktopFileOrUrl}
              onToggleWebcam={() => setUseDesktopWebcam(true)}
            />
            
            {/* Desktop drops scan mode below the dropzone */}
            <View className="mb-8">
              <ScanModeSelector
                scanMode={scanMode}
                onModeChange={setScanMode}
              />
            </View>
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={cameraFacing}
            mode="picture"
          >
            {previewUri ? (
              <View
                className="absolute inset-0 bg-black items-center justify-center"
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  setContainerSize({ width, height });
                }}
              >
                 <Image
                   source={{ uri: previewUri }}
                   style={{ width: '100%', height: '100%', opacity: isDetecting ? 0.6 : 0.88 }}
                   contentFit="contain"
                   transition={300}
                   onLoad={(e) => {
                     const { width, height } = (e as any).source ?? {};
                     if (width && height) setImageNaturalSize({ width, height });
                   }}
                 />
                 <View className="absolute inset-0 bg-midnight/30" />

                 {isDetecting && (
                   <View className="absolute inset-0 items-center justify-center">
                     <View className="bg-black/75 rounded-2xl px-6 py-4 items-center gap-3 border border-emerald-500/30">
                       <ActivityIndicator size="small" color="#34d399" />
                       <Text className="text-emerald-300 text-xs font-bold tracking-widest uppercase">Scanning for cards...</Text>
                     </View>
                   </View>
                 )}

                 {!isDetecting && detectedBoxes.map((box, idx) => {
                    const [ymin, xmin, ymax, xmax] = box.box_2d;

                    // Compute letterbox offsets for contentFit="contain"
                    let offsetX = 0, offsetY = 0, scaleW = 1, scaleH = 1;
                    if (containerSize && imageNaturalSize) {
                      const cW = containerSize.width;
                      const cH = containerSize.height;
                      const iW = imageNaturalSize.width;
                      const iH = imageNaturalSize.height;
                      const scale = Math.min(cW / iW, cH / iH);
                      const renderedW = iW * scale;
                      const renderedH = iH * scale;
                      offsetX = (cW - renderedW) / 2;
                      offsetY = (cH - renderedH) / 2;
                      scaleW = renderedW;
                      scaleH = renderedH;
                    } else {
                      scaleW = containerSize?.width ?? 300;
                      scaleH = containerSize?.height ?? 600;
                    }

                    const top = offsetY + (ymin / 1000) * scaleH;
                    const left = offsetX + (xmin / 1000) * scaleW;
                    const width = ((xmax - xmin) / 1000) * scaleW;
                    const height = ((ymax - ymin) / 1000) * scaleH;

                    return (
                      <Pressable
                        key={idx}
                        onPress={() => awaitingSelection && handleBoxTap(box)}
                        style={{ position: 'absolute', top, left, width, height, zIndex: 30 }}
                      >
                        <Animated.View
                          entering={SlideInDown.springify().delay(idx * 120)}
                          style={{
                             flex: 1,
                             borderWidth: awaitingSelection ? 2.5 : 2,
                             borderColor: awaitingSelection ? '#6ee7b7' : '#34d399',
                             backgroundColor: awaitingSelection ? 'rgba(52, 211, 153, 0.18)' : 'rgba(52, 211, 153, 0.08)',
                             borderRadius: 8,
                             shadowColor: '#34d399',
                             shadowOpacity: 0.9,
                             shadowRadius: 12,
                             shadowOffset: { width: 0, height: 0 }
                          }}
                        >
                           <View className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                           <View className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                           <View className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                           <View className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                           {awaitingSelection && (
                             <View className="absolute inset-0 items-center justify-center">
                               <View className="bg-black/70 px-2 py-1 rounded-full border border-emerald-400/50">
                                 <Text className="text-emerald-300 text-[9px] font-bold tracking-widest uppercase">TAP TO SCAN</Text>
                               </View>
                             </View>
                           )}
                        </Animated.View>
                      </Pressable>
                    );
                 })}
              </View>
            ) : (
              <View className="absolute inset-0 bg-midnight/10" />
            )}

            <View className="flex-1 justify-between">
            <View className="flex-row justify-between items-start px-6 pt-6">
              <View className="px-5 py-2.5 rounded-full bg-black/60 border border-umber/30">
                <Text className="text-umber text-[11px] font-bold tracking-[0.22em] uppercase">
                  Collection Mode
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Pressable onPress={handleUpload} disabled={isScanning || isSaving} className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 items-center justify-center active:scale-95">
                  <HistoryIcon size={18} color={KadoColors.lightSlate} />
                </Pressable>
                <Pressable onPress={() => setCameraFacing(prev => prev === "back" ? "front" : "back")} disabled={isScanning || isSaving} className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 items-center justify-center active:scale-95">
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

            <ScannerFrame
              width={frameWidth}
              height={frameHeight}
              isScanning={isScanning}
              scanLineAnimatedStyle={scanLineAnimatedStyle}
            />

            <ScanModeSelector
              scanMode={scanMode}
              onModeChange={setScanMode}
            />

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
                <View>
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
        )}

        </View>

        {(scanResult || previewUri) && !isLargeDesktop && (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 50, elevation: 5 }}>
            <AnimatedPressable
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              onPress={handleDismissResult}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)' }}
            />
            <Animated.View entering={SlideInDown.duration(250)} exiting={SlideOutDown} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <ScanResultCard
                  scanResult={scanResult}
                  previewUri={previewUri}
                  isSaving={isSaving}
                  canSaveToBinder={canSaveToBinder}
                  isSignedIn={isSignedIn ?? false}
                  isAuthLoaded={isAuthLoaded}
                  hasUser={Boolean(currentUser?._id)}
                  onDismiss={handleDismissResult}
                  onSave={handleSaveResult}
                />
              </Pressable>
            </Animated.View>
          </View>
        )}

        {/* Desktop: result panel shown in a right sidebar */}
        {isLargeDesktop && (scanResult || previewUri) && (
          <View
            style={{
              width: 360,
              borderLeftWidth: 1,
              borderLeftColor: "rgba(255,255,255,0.07)",
              backgroundColor: "#0a0f1c",
            }}
          >
            <ScanResultCard
              scanResult={scanResult}
              previewUri={previewUri}
              isSaving={isSaving}
              canSaveToBinder={canSaveToBinder}
              isSignedIn={isSignedIn ?? false}
              isAuthLoaded={isAuthLoaded}
              hasUser={Boolean(currentUser?._id)}
              onDismiss={handleDismissResult}
              onSave={handleSaveResult}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// (Removed SlideUpView in favor of inline Animated views)