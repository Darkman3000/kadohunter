import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { X, LayoutGrid, ChevronRight } from "lucide-react-native";
import { KadoColors } from "@/constants/theme";
import type { Id } from "../../../convex/_generated/dataModel";

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
}

export function CardPicker({ isVisible, onClose, onSelect, title, cards }: CardPickerProps) {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-midnight h-[80%] rounded-t-[40px] border-t border-white/10 p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="text-white text-2xl font-black">{title}</Text>
              <Text className="text-slate-text text-xs mt-1 uppercase tracking-widest">Select Cards to Trade</Text>
            </View>
            <Pressable 
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10"
            >
              <X size={20} color="white" />
            </Pressable>
          </View>

          {/* List */}
          {cards === undefined ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={KadoColors.umber} />
            </View>
          ) : cards.length === 0 ? (
            <View className="flex-1 items-center justify-center px-10">
              <View className="w-16 h-16 rounded-full bg-white/5 items-center justify-center mb-4">
                <LayoutGrid size={24} color={KadoColors.slateText} />
              </View>
              <Text className="text-white text-lg font-bold">No Cards Available</Text>
              <Text className="text-slate-text text-sm text-center mt-2">
                This binder is currently empty.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap justify-between">
                {cards.map((card) => (
                  <Pressable
                    key={card._id}
                    onPress={() => onSelect(card)}
                    className="w-[48%] bg-white/5 border border-white/5 rounded-3xl mb-4 overflow-hidden active:scale-[0.98]"
                  >
                    <View className="aspect-[0.72] w-full bg-navy relative">
                      {card.imageUrl && (
                        <Image 
                          source={{ uri: card.imageUrl }} 
                          style={{ width: '100%', height: '100%' }} 
                          contentFit="cover"
                        />
                      )}
                      <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-md border border-white/10">
                        <Text className="text-white text-[10px] font-black">{card.marketPrice?.toFixed(2) || '0.00'}$</Text>
                      </View>
                    </View>
                    <View className="p-3">
                      <Text className="text-white font-bold text-xs" numberOfLines={1}>{card.cardName}</Text>
                      <Text className="text-slate-500 text-[9px] uppercase tracking-tighter" numberOfLines={1}>
                        {card.setName || card.gameCode.toUpperCase()}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
