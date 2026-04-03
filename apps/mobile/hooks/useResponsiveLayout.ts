import { Platform, useWindowDimensions } from "react-native";
import { BREAKPOINTS } from "@/constants/breakpoints";

export function useResponsiveLayout() {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === "web";
    const isDesktop = isWeb && width >= BREAKPOINTS.DESKTOP;

    return { width, isWeb, isDesktop };
}