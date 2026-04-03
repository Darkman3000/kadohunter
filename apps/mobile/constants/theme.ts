import { Platform } from "react-native";

export const KadoColors = {
  midnight: "#0a192f",
  navy: "#112240",
  umber: "#c7a77b",
  umberDark: "#b3956d",
  lightSlate: "#ccd6f6",
  slateText: "#8892b0",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
} as const;

export const Colors = {
  light: {
    text: KadoColors.lightSlate,
    background: KadoColors.midnight,
    tint: KadoColors.umber,
    icon: KadoColors.slateText,
    tabIconDefault: KadoColors.slateText,
    tabIconSelected: KadoColors.umber,
  },
  dark: {
    text: KadoColors.lightSlate,
    background: KadoColors.midnight,
    tint: KadoColors.umber,
    icon: KadoColors.slateText,
    tabIconDefault: KadoColors.slateText,
    tabIconSelected: KadoColors.umber,
  },
};

export const Fonts = Platform.select({
  ios: { sans: "system-ui", serif: "ui-serif", rounded: "ui-rounded", mono: "ui-monospace" },
  default: { sans: "normal", serif: "serif", rounded: "normal", mono: "monospace" },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
