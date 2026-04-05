/**
 * DesktopDropdown
 *
 * On desktop (web): renders as an absolutely-positioned panel anchored below the
 * trigger element — like a native <select> or menu.
 * On mobile / tablet: falls back to the familiar bottom-sheet modal.
 */
import React, { useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { KadoColors } from "@/constants/theme";

export interface DropdownOption {
  id: string;
  label: string;
  sub?: string;
}

interface DesktopDropdownProps {
  /** Element that opens the dropdown */
  trigger: React.ReactNode;
  /** Title shown in the sheet header (mobile only) */
  title: string;
  subtitle?: string;
  options: DropdownOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Preferred width of the desktop panel in px. Default 260 */
  panelWidth?: number;
  /** If true the panel opens to the right instead of downward */
  openRight?: boolean;
}

export function DesktopDropdown({
  trigger,
  title,
  subtitle,
  options,
  selectedId,
  onSelect,
  panelWidth = 260,
  openRight = false,
}: DesktopDropdownProps) {
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const triggerRef = useRef<View>(null);
  const isWeb = Platform.OS === "web";

  const handleTriggerPress = () => {
    if (isWeb && triggerRef.current) {
      triggerRef.current.measure((_fx, _fy, w, h, px, py) => {
        setLayout({ x: px, y: py, width: w, height: h });
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  // ── Desktop: floating panel ─────────────────────────────────────────────
  if (isWeb) {
    const panelTop = layout ? layout.y + layout.height + 6 : 0;
    const panelLeft = openRight
      ? layout
        ? layout.x + layout.width + 6
        : 0
      : layout
      ? Math.max(0, layout.x)
      : 0;

    return (
      <View>
        <Pressable ref={triggerRef} onPress={handleTriggerPress}>
          {trigger}
        </Pressable>

        {open && (
          <>
            {/* Invisible overlay to catch outside clicks */}
            <Pressable
              onPress={() => setOpen(false)}
              style={{
                position: "fixed" as any,
                inset: 0,
                zIndex: 1000,
              }}
            />
            {/* Floating panel */}
            <View
              style={{
                position: "fixed" as any,
                top: panelTop,
                left: panelLeft,
                width: panelWidth,
                zIndex: 1001,
                backgroundColor: "#0f1523",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: 14,
                shadowColor: "#000",
                shadowOpacity: 0.5,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 8 },
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{title}</Text>
                {subtitle && (
                  <Text style={{ color: "#64748b", fontSize: 10, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>
                    {subtitle}
                  </Text>
                )}
              </View>
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {options.map((opt) => {
                  const isActive = opt.id === selectedId;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => handleSelect(opt.id)}
                      style={({ hovered }: any) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        backgroundColor: isActive
                          ? "rgba(199,167,123,0.12)"
                          : hovered
                          ? "rgba(255,255,255,0.05)"
                          : "transparent",
                        gap: 10,
                        cursor: "pointer" as any,
                      })}
                    >
                      {/* Active indicator */}
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: isActive ? KadoColors.umber : "transparent",
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: isActive ? KadoColors.umber : "#ccd6f6",
                            fontSize: 13,
                            fontWeight: isActive ? "700" : "500",
                          }}
                        >
                          {opt.label}
                        </Text>
                        {opt.sub && (
                          <Text style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>
                            {opt.sub}
                          </Text>
                        )}
                      </View>
                      {isActive && (
                        <Text style={{ color: KadoColors.umber, fontSize: 16, fontWeight: "700" }}>✓</Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </>
        )}
      </View>
    );
  }

  // ── Mobile: bottom sheet ────────────────────────────────────────────────
  return (
    <>
      <Pressable onPress={handleTriggerPress}>{trigger}</Pressable>
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#0a192f",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              padding: 24,
              paddingBottom: 40,
              maxHeight: "80%",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: 4 }}>{title}</Text>
            {subtitle && (
              <Text style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
                {subtitle}
              </Text>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const isActive = opt.id === selectedId;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => handleSelect(opt.id)}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: isActive ? "rgba(199,167,123,0.4)" : "rgba(255,255,255,0.08)",
                      backgroundColor: isActive ? "rgba(199,167,123,0.1)" : "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Text style={{ color: isActive ? KadoColors.umber : "#ccd6f6", fontWeight: "700", fontSize: 14 }}>
                      {opt.label}
                    </Text>
                    {opt.sub && (
                      <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{opt.sub}</Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => setOpen(false)}
              style={{
                marginTop: 8,
                paddingVertical: 14,
                alignItems: "center",
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <Text style={{ color: "#ccd6f6", fontWeight: "700" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
