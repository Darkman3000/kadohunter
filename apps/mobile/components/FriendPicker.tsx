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
import { X, User, ChevronRight } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { KadoColors } from "@/constants/theme";

interface FriendPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (friend: any) => void;
}

export function FriendPicker({ isVisible, onClose, onSelect }: FriendPickerProps) {
  const friends = useQuery(api.friends.getFriends);

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
              <Text className="text-white text-2xl font-black">Select Friend</Text>
              <Text className="text-slate-text text-xs mt-1 uppercase tracking-widest">Their Binder Access</Text>
            </View>
            <Pressable 
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10"
            >
              <X size={20} color="white" />
            </Pressable>
          </View>

          {/* List */}
          {friends === undefined ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={KadoColors.umber} />
            </View>
          ) : friends.length === 0 ? (
            <View className="flex-1 items-center justify-center px-10">
              <View className="w-16 h-16 rounded-full bg-white/5 items-center justify-center mb-4">
                <User size={24} color={KadoColors.slateText} />
              </View>
              <Text className="text-white text-lg font-bold">No Friends Yet</Text>
              <Text className="text-slate-text text-sm text-center mt-2">
                Add friends using their Hunter Tag in the Profile tab to enable trading.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {friends.map((friend: any) => (
                <Pressable
                  key={friend._id}
                  onPress={() => onSelect(friend)}
                  className="flex-row items-center p-4 bg-white/5 border border-white/5 rounded-3xl mb-4 active:bg-white/10"
                >
                  <View className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mr-4">
                    <User size={24} color={KadoColors.umber} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">{friend.name}</Text>
                    <Text className="text-slate-500 text-xs font-mono">{friend.hunterTag}</Text>
                  </View>
                  <ChevronRight size={18} color={KadoColors.slateText} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
