import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const DEVICE_ID_KEY = "kado.deviceId";

function createDeviceId() {
  if (typeof Crypto.randomUUID === "function") {
    return Crypto.randomUUID();
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  if (Platform.OS === "web") {
    try {
      const existing = window.localStorage.getItem(DEVICE_ID_KEY);
      if (existing) return existing;
      const created = createDeviceId();
      window.localStorage.setItem(DEVICE_ID_KEY, created);
      return created;
    } catch {
      return createDeviceId();
    }
  }

  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const created = createDeviceId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  return created;
}
