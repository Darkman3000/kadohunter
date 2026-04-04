import React from "react";
import { Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  ChevronRight,
  Crown,
  Scan,
  Wallet,
  Zap,
} from "lucide-react-native";
import { KadoColors } from "@/constants/theme";
import { HunterLicenseCard } from "./HunterLicenseCard";

function renderIcon(Icon: React.ComponentType<any>, props: Record<string, unknown>) {
  return <Icon {...props} />;
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 items-center">
      <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-midnight/60">
        {icon}
      </View>
      <Text className="text-xl font-bold text-light-slate">{value}</Text>
      <Text className="mt-1 text-[10px] font-medium text-slate-text">{label}</Text>
    </View>
  );
}

function formatCurrency(amount: number) {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

export function ProfileDashboard({
  displayName,
  isPro,
  licenseNumber,
  avatarUrl,
  avatarSeed,
  userId,
  scansToday,
  maxScans,
  collectionCount,
  collectionValue,
  isDesktop,
  onUpgrade,
}: {
  displayName: string;
  isPro: boolean;
  licenseNumber: string;
  avatarUrl?: string | null;
  avatarSeed: string;
  userId: string;
  scansToday: number;
  maxScans: number;
  collectionCount: number;
  collectionValue: number;
  isDesktop: boolean;
  onUpgrade: () => void;
}) {
  return (
    <View style={isDesktop ? { flexDirection: 'row', gap: 40, paddingHorizontal: 20 } : {}}>
      <View style={isDesktop ? { width: 420 } : {}}>
        <GestureHandlerRootView>
          <HunterLicenseCard
            displayName={displayName}
            isPro={isPro}
            licenseNumber={licenseNumber}
            avatarUrl={avatarUrl}
            avatarSeed={avatarSeed}
            userId={userId}
          />
        </GestureHandlerRootView>
      </View>

      <View style={isDesktop ? { flex: 1, paddingTop: 16 } : {}}>
        {!isPro && (
          <Pressable
            onPress={onUpgrade}
            className={`${isDesktop ? 'mb-6' : 'mx-5 mt-2'} overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 active:scale-[0.98]`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-6">
                <View className="flex-row items-center gap-2 mb-2">
                  {renderIcon(Zap, { size: 16, color: "#f59e0b", fill: "#f59e0b" })}
                  <Text className="text-amber-500 text-[11px] font-black uppercase tracking-[0.2em]">Collector Grade</Text>
                </View>
                <Text className="text-light-slate text-xl font-bold">Try Hunter Net PRO</Text>
                <Text className="text-slate-text text-sm mt-2 leading-6">Get unlimited daily scans, 7-day price history, and cloud backup for your binder.</Text>
              </View>
              {renderIcon(ChevronRight, { size: 24, color: KadoColors.slateText })}
            </View>
          </Pressable>
        )}

        <View className={`${isDesktop ? 'mb-6' : 'mx-5 mt-5'} rounded-3xl border border-white/10 bg-navy/40 p-6`}>
          <View className="flex-row">
            <StatTile
              icon={renderIcon(Scan, { size: 20, color: KadoColors.umber })}
              value={`${scansToday}/${maxScans === Infinity ? "\u221E" : maxScans}`}
              label="Scans Today"
            />
            <View className="mx-4 w-px bg-white/10" />
            <StatTile
              icon={renderIcon(Wallet, { size: 20, color: KadoColors.umber })}
              value={collectionCount.toString()}
              label="Collection"
            />
            <View className="mx-4 w-px bg-white/10" />
            <StatTile
              icon={renderIcon(Crown, { size: 20, color: KadoColors.umber })}
              value={formatCurrency(collectionValue)}
              label="Value"
            />
          </View>
        </View>
      </View>
    </View>
  );
}