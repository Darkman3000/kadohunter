import { Platform, useWindowDimensions } from "react-native";
import { BREAKPOINTS, getWebSidebarWidth } from "@/constants/breakpoints";

/**
 * Shared breakpoints for web + native. On web desktop, `width` is the full window — subtract the
 * sidebar so max-width columns center inside the main pane, not under the rail.
 */
export function useResponsiveLayout() {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === "web";
    const isDesktop = isWeb && width >= BREAKPOINTS.DESKTOP;
    const isLargeDesktop = isWeb && width >= BREAKPOINTS.LARGE_DESKTOP;
    const sidebarWidth = getWebSidebarWidth(width);
    const availableWidth = Math.max(0, width - sidebarWidth);
    /** Readable line length on wide monitors; grows on large desktop */
    const maxPageWidthCap = isLargeDesktop ? 1320 : 1100;
    const maxPageColumnWidth = Math.min(maxPageWidthCap, availableWidth);
    const maxNarrowColumnWidth = Math.min(480, availableWidth);
    /** Sign-in / hero cards: a bit wider than narrow columns on desktop, still capped to the main pane. */
    const maxAuthPanelWidth = Math.min(isLargeDesktop ? 560 : 520, availableWidth);

    return {
        width,
        isWeb,
        isDesktop,
        isLargeDesktop,
        sidebarWidth,
        availableWidth,
        maxPageColumnWidth,
        maxNarrowColumnWidth,
        maxAuthPanelWidth,
    };
}