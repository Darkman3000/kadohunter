import { Platform, useWindowDimensions } from "react-native";
import { BREAKPOINTS, LAYOUT } from "@/constants/breakpoints";

/**
 * Shared breakpoints for web + native. On web desktop, `width` is the full window — subtract the
 * sidebar so max-width columns center inside the main pane, not under the rail.
 */
export function useResponsiveLayout() {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === "web";
    const isDesktop = isWeb && width >= BREAKPOINTS.DESKTOP;
    const aside = isDesktop ? LAYOUT.SIDEBAR_WIDTH : 0;
    const availableWidth = Math.max(0, width - aside);
    const maxPageColumnWidth = Math.min(1100, availableWidth);
    const maxNarrowColumnWidth = Math.min(480, availableWidth);
    /** Sign-in / hero cards: a bit wider than narrow columns on desktop, still capped to the main pane. */
    const maxAuthPanelWidth = Math.min(520, availableWidth);

    return {
        width,
        isWeb,
        isDesktop,
        availableWidth,
        maxPageColumnWidth,
        maxNarrowColumnWidth,
        maxAuthPanelWidth,
    };
}