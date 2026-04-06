import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  Crown,
  Zap,
  Check,
  Scan,
  BarChart3,
  Download,
  Globe,
  Sparkles,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { KadoColors } from "@/constants/theme";
import { subscriptionPlans } from "@kado/domain";
import { api } from "../../../convex/_generated/api";

const CloseIcon = X as React.ComponentType<any>;
const CrownIcon = Crown as React.ComponentType<any>;
const ZapIcon = Zap as React.ComponentType<any>;
const CheckIcon = Check as React.ComponentType<any>;

type PlanInterval = "monthly" | "yearly";
type FeatureGroup = {
  title: string;
  icon: React.ComponentType<any>;
  items: Array<{ label: string; desc: string }>;
};

const proPlan = subscriptionPlans.find((p) => p.tier === "pro");

const PRO_SECTIONS: FeatureGroup[] = [
  {
    title: "Personalization & Identity",
    icon: CrownIcon,
    items: [
      {
        label: "Exclusive PRO Themes & Identity",
        desc: "Give your hunter profile a more premium look and presence.",
      },
      {
        label: "Verified Hunter Status",
        desc: "Stand out with a clearer collector identity inside the app.",
      },
    ],
  },
  {
    title: "Collection Power Tools",
    icon: Scan as React.ComponentType<any>,
    items: [
      {
        label: "Unlimited Scans",
        desc: "No daily limits when adding cards to your binder.",
      },
      {
        label: "Advanced Binder Management",
        desc: "Deeper filtering, sorting, and richer collection workflows.",
      },
      {
        label: "Priority Recognition",
        desc: "Faster and more accurate identification during scans.",
      },
    ],
  },
  {
    title: "Portfolio Intelligence",
    icon: BarChart3 as React.ComponentType<any>,
    items: [
      {
        label: "Price History",
        desc: "Track historical card movement and market direction over time.",
      },
      {
        label: "Advanced Analytics",
        desc: "See collection value, trends, and portfolio signals at a glance.",
      },
      {
        label: "Multi-Currency Tracking",
        desc: "View your collection in the currency that matches your market.",
      },
    ],
  },
  {
    title: "Export & Sharing",
    icon: Download as React.ComponentType<any>,
    items: [
      {
        label: "Export Data",
        desc: "Take your collection out to CSV and keep offline records.",
      },
      {
        label: "Shareable Collection Views",
        desc: "Present your best finds with richer profile and portfolio surfaces.",
      },
    ],
  },
  {
    title: "Community & Perks",
    icon: Sparkles as React.ComponentType<any>,
    items: [
      {
        label: "Hunter Network Perks",
        desc: "More premium social presence as network features expand.",
      },
      {
        label: "Early Access Upgrades",
        desc: "Get new collector tools first as the app grows beyond v1.",
      },
    ],
  },
];

type ComparisonCell =
  | { kind: "text"; value: string }
  | { kind: "check" }
  | { kind: "x" };

// Feature comparison for free vs pro
const COMPARISON = [
  { feature: "Daily Scans", free: { kind: "text", value: "5" }, pro: { kind: "text", value: "Unlimited" } },
  { feature: "Collection Management", free: { kind: "text", value: "Basic" }, pro: { kind: "text", value: "Advanced" } },
  { feature: "Price Estimates", free: { kind: "check" }, pro: { kind: "check" } },
  { feature: "Price History", free: { kind: "x" }, pro: { kind: "check" } },
  { feature: "Multi-Currency", free: { kind: "x" }, pro: { kind: "check" } },
  { feature: "Export Data", free: { kind: "x" }, pro: { kind: "check" } },
  { feature: "Priority Recognition", free: { kind: "x" }, pro: { kind: "check" } },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanInterval>("yearly");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const setSubscriptionTier = useMutation(api.users.setSubscriptionTier);

  const monthlyPrice = proPlan?.monthlyPrice ?? 4.99;
  const yearlyPrice = proPlan?.yearlyPrice ?? 39.99;
  const savingsPercent = Math.round(
    ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
  );

  const handleSubscribe = async () => {
    if (isSubscribing) return;
    const planLabel =
      selectedPlan === "monthly"
        ? `$${monthlyPrice.toFixed(2)}/month`
        : `$${yearlyPrice.toFixed(2)}/year`;
    setIsSubscribing(true);
    try {
      await setSubscriptionTier({
        tier: "pro",
        billingCycle: selectedPlan === "monthly" ? "monthly" : "annual",
      });
      Alert.alert("Hunter PRO unlocked", `Your plan is now active at ${planLabel}.`, [
        {
          text: "Continue",
          onPress: () => router.replace("/(tabs)/profile"),
        },
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Direct tier changes are disabled")) {
        Alert.alert(
          "Checkout required",
          "Billing webhook mode is enabled. Complete payment through your checkout provider to activate PRO automatically."
        );
        return;
      }
      Alert.alert(
        "Subscription failed",
        error instanceof Error ? error.message : "Could not activate PRO right now."
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: KadoColors.midnight },
        Platform.OS === "web"
          ? { width: "100%", maxWidth: 480, alignSelf: "center" }
          : null,
      ]}
      edges={["top", "bottom"]}
    >
      <Pressable
        onPress={() => router.back()}
        className="absolute right-4 top-4 z-20 h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 active:scale-95"
      >
        <CloseIcon size={18} color={KadoColors.lightSlate} />
      </Pressable>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 172 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-5 pb-4 pt-6">
          <View className="relative items-center justify-center mb-4">
            <View
              pointerEvents="none"
              className="absolute w-28 h-28 rounded-full"
              style={{
                backgroundColor: "rgba(199,167,123,0.18)",
                shadowColor: KadoColors.umber,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.65,
                shadowRadius: 28,
                elevation: 18,
              }}
            />
            <View
              pointerEvents="none"
              className="absolute w-20 h-20 rounded-full"
              style={{ backgroundColor: "rgba(199,167,123,0.12)" }}
            />
            <View
              className="w-16 h-16 rounded-[22px] items-center justify-center border"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderColor: "rgba(199,167,123,0.35)",
                shadowColor: KadoColors.umber,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.45,
                shadowRadius: 18,
                elevation: 14,
              }}
            >
              <CrownIcon
                size={30}
                color={KadoColors.umber}
                fill={KadoColors.umber}
              />
            </View>
          </View>

          <Text className="text-light-slate text-[26px] font-bold text-center mb-1 tracking-tight">
            Unlock <Text style={{ color: KadoColors.umber }}>PRO</Text>
          </Text>
          <Text className="text-slate-text text-sm text-center max-w-[280px] leading-5">
            Advanced market intelligence and unlimited card tracking.
          </Text>
        </View>

        <View
          className="mx-4 overflow-hidden rounded-[28px] border px-4 py-3"
          style={{
            backgroundColor: "rgba(8, 18, 33, 0.68)",
            borderColor: "rgba(255,255,255,0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.25,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          {PRO_SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <View
                key={section.title}
                className={`${idx < PRO_SECTIONS.length - 1 ? "border-b border-white/5 pb-4" : ""} ${
                  idx > 0 ? "pt-4" : ""
                }`}
              >
                <View className="mb-2 flex-row items-center gap-2">
                  <Icon size={15} color={KadoColors.umber} />
                  <Text className="text-[10px] font-bold uppercase tracking-[0.24em] text-light-slate">
                    {section.title}
                  </Text>
                </View>

                <View className="ml-2 border-l border-white/10 pl-3">
                  {section.items.map((item, itemIndex) => (
                    <View
                      key={item.label}
                      className={`${itemIndex < section.items.length - 1 ? "pb-2.5" : ""}`}
                    >
                      <Text className="text-sm font-bold tracking-tight text-light-slate">
                        {item.label}
                      </Text>
                      <Text className="mt-0.5 text-xs leading-4 text-slate-text">
                        {item.desc}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* Comparison Table */}
        <View className="px-5 pt-6">
          <Text className="text-light-slate text-sm font-bold mb-3 uppercase tracking-wider">
            Free vs PRO
          </Text>
          <View
            className="rounded-[28px] border overflow-hidden"
            style={{
              backgroundColor: "rgba(10, 19, 35, 0.72)",
              borderColor: "rgba(255,255,255,0.08)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.22,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            {/* Header Row */}
            <View className="flex-row border-b border-white/10 px-4 py-3">
              <Text className="flex-1 text-slate-text text-[10px] font-bold uppercase tracking-wider">
                Feature
              </Text>
              <Text className="w-16 text-center text-slate-text text-[10px] font-bold uppercase tracking-wider">
                Free
              </Text>
              <Text className="w-16 text-center text-umber text-[10px] font-bold uppercase tracking-wider">
                PRO
              </Text>
            </View>

            {/* Rows */}
            {COMPARISON.map((row, idx) => (
              <View
                key={idx}
                className={`flex-row items-center px-4 py-2.5 ${
                  idx < COMPARISON.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <Text className="flex-1 text-light-slate text-xs leading-4">
                  {row.feature}
                </Text>
                <View className="w-16 items-center justify-center">
                  {row.free.kind === "text" ? (
                    <Text className="text-slate-text text-xs font-semibold">
                      {row.free.value}
                    </Text>
                  ) : row.free.kind === "check" ? (
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center"
                      style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
                    >
                      <CheckIcon
                        size={14}
                        color="#4ade80"
                        strokeWidth={2.75}
                      />
                    </View>
                  ) : (
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center"
                      style={{ backgroundColor: "rgba(248,113,113,0.12)" }}
                    >
                      <CloseIcon
                        size={14}
                        color="#f87171"
                        strokeWidth={2.75}
                      />
                    </View>
                  )}
                </View>
                <View className="w-16 items-center justify-center">
                  {row.pro.kind === "text" ? (
                    <Text className="text-umber text-xs font-bold">
                      {row.pro.value}
                    </Text>
                  ) : row.pro.kind === "check" ? (
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center"
                      style={{ backgroundColor: "rgba(34,197,94,0.12)" }}
                    >
                      <CheckIcon
                        size={14}
                        color="#4ade80"
                        strokeWidth={2.75}
                      />
                    </View>
                  ) : (
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center"
                      style={{ backgroundColor: "rgba(248,113,113,0.12)" }}
                    >
                      <CloseIcon
                        size={14}
                        color="#f87171"
                        strokeWidth={2.75}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom: Plan Selector & CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4"
        style={{
          backgroundColor: "rgba(10, 19, 35, 0.96)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.55,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        {/* Plan Selector */}
        <View className="flex-row gap-3 mb-4">
          {/* Monthly */}
          <Pressable
            onPress={() => setSelectedPlan("monthly")}
            className={`flex-1 py-3 px-3 rounded-2xl border items-center justify-center active:scale-95 ${
              selectedPlan === "monthly"
                ? "border-umber/50"
                : "bg-transparent border-white/10 opacity-70"
            }`}
            style={
              selectedPlan === "monthly"
                ? {
                    backgroundColor: "rgba(12, 27, 47, 0.9)",
                    shadowColor: KadoColors.umber,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 4,
                  }
                : { backgroundColor: "rgba(255,255,255,0.02)" }
            }
          >
            <Text className="text-light-slate text-base font-bold tracking-tight">
              ${monthlyPrice.toFixed(2)}
            </Text>
            <Text className="text-slate-text text-[10px] font-bold uppercase tracking-wider mt-0.5">
              Monthly
            </Text>
          </Pressable>

          {/* Annual */}
          <Pressable
            onPress={() => setSelectedPlan("yearly")}
            className={`flex-1 py-3 px-3 rounded-2xl border items-center justify-center relative overflow-hidden active:scale-95 ${
              selectedPlan === "yearly"
                ? "border-umber"
                : "bg-transparent border-white/10 opacity-70"
            }`}
            style={
              selectedPlan === "yearly"
                ? {
                    backgroundColor: "rgba(199,167,123,0.10)",
                    shadowColor: KadoColors.umber,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.18,
                    shadowRadius: 14,
                    elevation: 6,
                  }
                : { backgroundColor: "rgba(255,255,255,0.02)" }
            }
          >
            {/* Save Badge */}
            <View
              className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-xl"
              style={{
                backgroundColor: KadoColors.umber,
                shadowColor: KadoColors.umber,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Text className="text-midnight text-[8px] font-extrabold tracking-wide">
                SAVE {savingsPercent}%
              </Text>
            </View>

            <Text className="text-light-slate text-base font-bold tracking-tight">
              ${yearlyPrice.toFixed(2)}
            </Text>
            <Text
              className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
              style={{ color: KadoColors.umber }}
            >
              Yearly
            </Text>
          </Pressable>
        </View>

        {/* Subscribe Button */}
        <Pressable
          onPress={() => void handleSubscribe()}
          className="py-4 rounded-2xl items-center justify-center flex-row gap-2 active:scale-[0.98] border border-white/10"
          style={{
            backgroundColor: KadoColors.umber,
            shadowColor: KadoColors.umber,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.28,
            shadowRadius: 18,
            elevation: 10,
            opacity: isSubscribing ? 0.7 : 1,
          }}
          disabled={isSubscribing}
        >
          <Text className="text-midnight font-extrabold text-base tracking-tight">
            {isSubscribing ? "Activating PRO..." : "Unlock Pro Access"}
          </Text>
          <ZapIcon
            size={18}
            color={KadoColors.midnight}
            fill={KadoColors.midnight}
          />
        </Pressable>

        <Text className="text-slate-text text-[10px] text-center mt-2">
          Recurring billing. Cancel anytime.
        </Text>
      </View>
    </SafeAreaView>
  );
}
