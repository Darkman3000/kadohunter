import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { X, LayoutGrid } from "lucide-react-native";
import { KadoColors } from "@/constants/theme";
import type { Id } from "../../../convex/_generated/dataModel";
import { DesktopDialog } from "./DesktopDialog";

export interface PickableCard {
  _id: Id<"savedScans">;
  cardId: string;
  cardName: string;
  setName?: string;
  gameCode: string;
  imageUrl?: string;
  marketPrice?: number;
  estimatedPrice?: number;
}

interface CardPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (card: PickableCard) => void;
  title: string;
  cards: PickableCard[] | undefined;
  /** Scan IDs already on the trade desk — hide from picker */
  excludeScanIds?: Id<"savedScans">[];
}

export function CardPicker({
  isVisible,
  onClose,
  onSelect,
  title,
  cards,
  excludeScanIds,
}: CardPickerProps) {
  const exclude = new Set(excludeScanIds ?? []);
  const visibleCards = cards?.filter((c) => !exclude.has(c._id)) ?? [];
  const isWeb = Platform.OS === "web";

  return (
    <DesktopDialog visible={isVisible} onClose={onClose} maxWidth={600} maxHeight={680}>
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
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>{title}</Text>
          <Text
            style={{
              color: "#64748b",
              fontSize: 11,
              marginTop: 2,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Select a card to add to the trade
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
        {cards === undefined ? (
          <View style={{ paddingVertical: 48, alignItems: "center" }}>
            <ActivityIndicator color={KadoColors.umber} />
          </View>
        ) : visibleCards.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: "center", paddingHorizontal: 24 }}>
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
              <LayoutGrid size={22} color={KadoColors.slateText} />
            </View>
            <Text style={{ color: "#ccd6f6", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
              {cards.length > 0 ? "All cards already added" : "No Cards Available"}
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
              {cards.length > 0
                ? "Remove a card from the trade to swap it for another."
                : "This binder is currently empty."}
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {visibleCards.map((card) => (
              <Pressable
                key={card._id}
                onPress={() => onSelect(card)}
                style={({ hovered }: any) => ({
                  width: "48%",
                  backgroundColor: hovered && isWeb ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: hovered && isWeb ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  overflow: "hidden",
                  ...(isWeb ? { cursor: "pointer" as any } : {}),
                })}
              >
                <View style={{ aspectRatio: 0.72, width: "100%", backgroundColor: "#0a0f1c", position: "relative" }}>
                  {card.imageUrl && (
                    <Image
                      source={{ uri: card.imageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  )}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.7)",
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>
                      ${(card.estimatedPrice ?? card.marketPrice ?? 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={{ padding: 10 }}>
                  <Text style={{ color: "#ccd6f6", fontWeight: "700", fontSize: 12 }} numberOfLines={1}>
                    {card.cardName}
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 10, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }} numberOfLines={1}>
                    {card.setName || card.gameCode.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </DesktopDialog>
  );
}
