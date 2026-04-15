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
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { KadoColors } from "@/constants/theme";
import { BREAKPOINTS } from "@/constants/breakpoints";

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

// ── Singleton registry: only one dropdown open at a time ──────────────────
const _closers = new Set<() => void>();
function registerDropdown(close: () => void) {
  _closers.add(close);
  return () => { _closers.delete(close); };
}
function closeAllOthers(except: () => void) {
  _closers.forEach((fn) => { if (fn !== except) fn(); });
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
  const { width: windowWidth } = useWindowDimensions();
  const useFloatingPanel = isWeb && windowWidth >= BREAKPOINTS.DESKTOP;

  const closeThis = React.useCallback(() => setOpen(false), []);

  // Register/unregister this instance
  React.useEffect(() => {
    const unregister = registerDropdown(closeThis);
    return unregister;
  }, [closeThis]);

  const handleTriggerPress = () => {
    if (useFloatingPanel && triggerRef.current) {
      triggerRef.current.measure((_fx, _fy, w, h, px, py) => {
        const scrollY =
          typeof window !== "undefined" ? window.scrollY ?? 0 : 0;
        setLayout({ x: px, y: py + scrollY, width: w, height: h });
        closeAllOthers(closeThis);
        setOpen(true);
      });
    } else {
      closeAllOthers(closeThis);
      setOpen(true);
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  // ── Desktop web only: floating panel ────────────────────────────────────
  if (useFloatingPanel) {
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
            {/* Dark scrim — covers only the content BELOW the toolbar */}
            <Pressable
              onPress={() => setOpen(false)}
              style={{
                position: "fixed" as any,
                top: layout ? layout.y + layout.height : 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9998,
                backgroundColor: "rgba(0,0,0,0.45)",
              }}
            />
            {/* Floating panel */}
            <View
              style={{
                position: "fixed" as any,
                top: panelTop,
                left: panelLeft,
                width: panelWidth,
                zIndex: 9999,
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
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}
          onPress={() => setOpen(false)}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(150)}
            style={{
              backgroundColor: "#0a192f",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              paddingBottom: 40,
              maxHeight: "80%",
            }}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={{ padding: 24 }}>
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
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}
