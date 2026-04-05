import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { X, User, ChevronRight } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { KadoColors } from "@/constants/theme";
import type { Id } from "../../../convex/_generated/dataModel";
import type { SubscriptionTier } from "@kado/contracts";
import { DesktopDialog } from "./DesktopDialog";

export interface PickableFriend {
  _id: Id<"users">;
  name?: string;
  hunterTag?: string;
  tier: SubscriptionTier;
}

interface FriendPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (friend: PickableFriend) => void;
}

export function FriendPicker({ isVisible, onClose, onSelect }: FriendPickerProps) {
  const friends = useQuery(api.friends.getFriends);
  const isWeb = Platform.OS === "web";

  return (
    <DesktopDialog visible={isVisible} onClose={onClose} maxWidth={480} maxHeight={560}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.07)",
        }}
      >
        <View>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Select Friend</Text>
          <Text
            style={{
              color: "#64748b",
              fontSize: 11,
              marginTop: 2,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Their binder access
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          style={({ hovered }: any) => ({
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: hovered && isWeb ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            ...(isWeb ? { cursor: "pointer" as any } : {}),
          })}
        >
          <X size={16} color="#94a3b8" />
        </Pressable>
      </View>

      {/* Body */}
      <View style={{ padding: 16 }}>
        {friends === undefined ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={KadoColors.umber} />
          </View>
        ) : friends.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center", paddingHorizontal: 24 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.05)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <User size={22} color={KadoColors.slateText} />
            </View>
            <Text style={{ color: "#ccd6f6", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
              No Friends Yet
            </Text>
            <Text
              style={{
                color: "#64748b",
                fontSize: 13,
                textAlign: "center",
                marginTop: 6,
                lineHeight: 20,
              }}
            >
              Add friends using their Hunter Tag in the Profile tab to enable trading.
            </Text>
          </View>
        ) : (
          friends.map((friend) => (
            <Pressable
              key={friend._id}
              onPress={() => onSelect(friend)}
              style={({ hovered }: any) => ({
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                marginBottom: 6,
                backgroundColor:
                  hovered && isWeb ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
                ...(isWeb ? { cursor: "pointer" as any } : {}),
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "rgba(199,167,123,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(199,167,123,0.3)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <User size={20} color={KadoColors.umber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ccd6f6", fontWeight: "700", fontSize: 14 }}>
                  {friend.name}
                </Text>
                <Text style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace", marginTop: 1 }}>
                  {friend.hunterTag}
                </Text>
              </View>
              <ChevronRight size={16} color="#475569" />
            </Pressable>
          ))
        )}
      </View>
    </DesktopDialog>
  );
}
