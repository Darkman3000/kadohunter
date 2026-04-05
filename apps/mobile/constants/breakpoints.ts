import { Platform } from "react-native";

/** Web layout breakpoints (viewport width in px). */
export const BREAKPOINTS = {
    TABLET: 480,
    /** Sidebar + bottom tabs hidden; desktop shell */
    DESKTOP: 768,
    /** Wider rail, more columns, roomier max content width */
    LARGE_DESKTOP: 1200,
    /** Ultra-wide: cap content so lines stay readable */
    XL_DESKTOP: 1536,
} as const;

/** Web rail in `app/_layout.tsx` — narrow vs wide desktop. */
export const LAYOUT = {
    SIDEBAR_WIDTH: 64,
    SIDEBAR_WIDTH_WIDE: 80,
} as const;

/** Sidebar width for layout math (binder grid, max columns). Native → 0. */
export function getWebSidebarWidth(windowWidth: number): number {
    if (Platform.OS !== "web" || windowWidth < BREAKPOINTS.DESKTOP) {
        return 0;
    }
    return windowWidth >= BREAKPOINTS.LARGE_DESKTOP ? LAYOUT.SIDEBAR_WIDTH_WIDE : LAYOUT.SIDEBAR_WIDTH;
}