import React from "react";
import { Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import QRCode from "react-native-qrcode-svg";
import { Avatar } from "./Avatar";

export function HunterLicenseCard({
  displayName,
  isPro,
  licenseNumber,
  avatarUrl,
  avatarSeed,
  userId,
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