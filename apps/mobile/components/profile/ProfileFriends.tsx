import React from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import type { Id } from "../../../../convex/_generated/dataModel";
import { KadoColors } from "@/constants/theme";
import {
  ChevronRight,
  LogOut,
  Plus,
  ShieldCheck,
  User,
} from "lucide-react-native";

function renderIcon(Icon: React.ComponentType<any>, props: Record<string, unknown>) {
  return <Icon {...props} />;
}

export function ProfileFriends({
  isDesktop,
  friendQuery,
  setFriendQuery,
  isAddingFriend,
  onAddFriend,
  pendingRequests,
  friends,
  onAcceptRequest,
  onRejectRequest,
}: {
  isDesktop: boolean;
  friendQuery: string;
  setFriendQuery: (q: string) => void;
  isAddingFriend: boolean;
  onAddFriend: () => void;
  pendingRequests: Array<{ _id: string; name: string; hunterTag: string }> | undefined;
  friends: Array<{ _id: string; name: string; hunterTag: string }> | undefined;
  onAcceptRequest: (requestId: Id<"friendships">) => void;
  onRejectRequest: (requestId: Id<"friendships">) => void;
}) {
  return (
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
          onPress={onAddFriend}
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
          {pendingRequests.map((req) => (
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
                  onPress={() => onRejectRequest(req._id as Id<"friendships">)}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
                >
                  <LogOut size={16} color="#fb7185" style={{ transform: [{ rotate: "180deg" }] }} />
                </Pressable>
                <Pressable
                  onPress={() => onAcceptRequest(req._id as Id<"friendships">)}
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
          {friends.map((friend) => (
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
  );
}