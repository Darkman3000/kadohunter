import type { TCG } from "@kado/contracts";

export const GAME_LABELS: Record<string, string> = {
    pokemon: "Pokémon",
    yugioh: "Yu-Gi-Oh!",
    onepiece: "One Piece",
    mtg: "Magic",
    dragonball: "Dragon Ball",
};

export function getGameLabel(game?: TCG | string): string {
    if (!game) return "Unknown TCG";
    return GAME_LABELS[game] ?? "Unknown TCG";
}