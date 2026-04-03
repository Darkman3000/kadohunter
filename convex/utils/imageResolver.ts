/**
 * Resolve a card image URL from external TCG APIs by game and name.
 * Used by both http.ts (recognition endpoint) and imageBackfill.ts.
 */
export async function resolveImageUrl(
    gameCode: string,
    cardName: string
): Promise<string | undefined> {
    try {
        if (gameCode === "pokemon") {
            const resp = await fetch(
                `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(cardName)}"&pageSize=1`
            );
            if (resp.ok) {
                const data = await resp.json();
                return data.data?.[0]?.images?.small;
            }
        } else if (gameCode === "yugioh") {
            const resp = await fetch(
                `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`
            );
            if (resp.ok) {
                const data = await resp.json();
                return data.data?.[0]?.card_images?.[0]?.image_url_small;
            }
        } else if (gameCode === "mtg") {
            const resp = await fetch(
                `https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}&unique=cards&order=released`
            );
            if (resp.ok) {
                const data = await resp.json();
                return data.data?.[0]?.image_uris?.small;
            }
        }
    } catch {
        // Image lookup failed — non-fatal
    }
    return undefined;
}