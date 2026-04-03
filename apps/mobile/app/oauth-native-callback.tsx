/**
 * OAuth Native Callback
 *
 * Clerk's useOAuth() redirects here after the provider (Google/Apple) completes.
 * On web, Clerk appends session tokens as URL params. This route catches
 * the redirect, lets Clerk's built-in handler process the tokens, and
 * navigates the user back into the app.
 *
 * On native (iOS/Android), the deep-link scheme handles this automatically,
 * so this file only matters for Expo Web.
 */
import { useEffect } from "react";
import { ActivityIndicator, View, Text, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { KadoColors } from "@/constants/theme";

export default function OAuthNativeCallback() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Give Clerk a moment to process the OAuth tokens from the URL
    const timer = setTimeout(() => {
      if (isSignedIn) {
        router.replace("/(tabs)/profile");
      } else {
        // Auth failed or was cancelled — send back to profile (sign-in view)
        router.replace("/(tabs)/profile");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, router]);

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: KadoColors.midnight,
          alignItems: "center",
          justifyContent: "center",
        },
        Platform.OS === "web"
          ? { width: "100%", maxWidth: 480, alignSelf: "center" as const }
          : null,
      ]}
    >
      <ActivityIndicator size="large" color={KadoColors.umber} />
      <Text
        style={{
          color: KadoColors.lightSlate,
          marginTop: 16,
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        Completing sign-in…
      </Text>
    </View>
  );
}
