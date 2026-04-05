/**
 * DesktopDialog — adaptive modal wrapper.
 *
 * Desktop web  → centered, fixed-size card dialog (like a native dialog box).
 * Mobile/tablet → familiar bottom-sheet slide-up.
 */
import React from "react";
import { Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface DesktopDialogProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max width of the desktop dialog panel. Default 560. */
  maxWidth?: number;
  /** Max height of the desktop dialog panel. Default 640. */
  maxHeight?: number;
}

export function DesktopDialog({
  visible,
  onClose,
  children,
  maxWidth = 560,
  maxHeight = 640,
}: DesktopDialogProps) {
  const { isDesktop } = useResponsiveLayout();
  const isWebDesktop = Platform.OS === "web" && isDesktop;

  if (isWebDesktop) {
    if (!visible) return null;
    return (
      <View
        style={{
          position: "fixed" as any,
          inset: 0,
          zIndex: 9000,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Backdrop */}
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        />
        {/* Dialog panel */}
        <View
          style={{
            position: "relative",
            width: "100%",
            maxWidth,
            maxHeight,
            backgroundColor: "#0f1523",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            shadowColor: "#000",
            shadowOpacity: 0.6,
            shadowRadius: 40,
            shadowOffset: { width: 0, height: 16 },
            overflow: "hidden",
          }}
        >
          <ScrollView
            style={{ maxHeight }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Mobile: bottom sheet
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#0a192f",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            maxHeight: "85%",
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
