import type { TCG } from "@kado/contracts";
import { KadoColors } from "@/constants/theme";

export interface GameTone {
    border: string;
    background: string;
    text: string;
}

const GAME_TONES: Record<string, GameTone> = {
    pokemon:    { border: "rgba(245, 158, 11, 0.35)", background: "rgba(245, 158, 11, 0.16)", text: "#fbbf24" },
    mtg:        { border: "rgba(249, 115, 22, 0.35)", background: "rgba(249, 115, 22, 0.16)", text: "#fb923c" },
    yugioh:     { border: "rgba(168, 85, 247, 0.35)", background: "rgba(168, 85, 247, 0.16)", text: "#c084fc" },
    onepiece:   { border: "rgba(56, 189, 248, 0.35)", background: "rgba(56, 189, 248, 0.16)", text: "#67e8f9" },
    dragonball: { border: "rgba(244, 114, 182, 0.35)", background: "rgba(244, 114, 182, 0.16)", text: "#f9a8d4" },
};

const DEFAULT_TONE: GameTone = {
    border: "rgba(255, 255, 255, 0.12)",
    background: "rgba(255, 255, 255, 0.08)",
    text: KadoColors.lightSlate,
};

export function getGameTone(game?: TCG | string): GameTone {
    if (!game) return DEFAULT_TONE;
    return GAME_TONES[game] ?? DEFAULT_TONE;
}

export function getRarityBorderColor(rarity: string): string {
    const value = rarity.toLowerCase();
    if (value.includes("secret") || value.includes("illustration") || value.includes("hyper")) return "rgba(245, 158, 11, 0.82)";
    if (value.includes("ultra")) return "rgba(168, 85, 247, 0.82)";
    if (value.includes("rare") || value.includes("holo")) return "rgba(96, 165, 250, 0.82)";
    return "rgba(255, 255, 255, 0.12)";
}