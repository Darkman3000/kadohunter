# KadoHunter Scanner Overhaul — "The Snap"

## 🧠 Reasoning Chain

### Phase 1: Planning & Constraints

**The problem**: Our scan-to-result pipeline takes ~4 seconds and shows nothing but a spinner. MonPrice shows results in under 1 second. Your prototype shows a gorgeous glassmorphism card dossier with price charts and marketplace tabs — none of which exists in our code yet.

**Dependencies (execution order)**:
1. Image compression must happen BEFORE we change the API call → payload reduction
2. Backend enrichment must happen BEFORE we build UI for it → Gemini prompt expansion
3. Skeleton preview must ship WITH the backend changes → user sees improvement immediately
4. Bottom-sheet dossier is the final layer → depends on richer data being available

**Current pipeline (what we're replacing)**:
```
[Tap Shutter] → takePictureAsync(quality: 0.5) → 300KB base64
→ POST /api/recognize → Gemini 2.5 Flash (~1.5s) → wait for image URL (~2s race)
→ fire-and-forget syncPriceInternal → return {name, set, rarity, number, variant, finish}
→ ScanResultCard appears (FadeInDown) → price shows "Fetching..."
```

**Target pipeline**:
```
[Tap Shutter] → freeze camera, show preview thumbnail INSTANTLY (<100ms)
→ expo-image-manipulator resize to 640px → ~50KB base64
→ POST /api/recognize → Gemini returns ENRICHED payload (~1.5s)
→ skeleton fills in progressively (name first, then stats, then price)
→ tap/swipe → full Card Dossier bottom sheet with chart & marketplace
```

### Phase 2: Hypothesis & Risk

| Hypothesis | Confidence | Risk |
|---|---|---|
| Image resize to 640px will preserve Gemini accuracy | **SURE** — Gemini handles low-res well, TCG text is large | None |
| Expanding the Gemini prompt won't add latency | **SURE** — same model call, more output tokens is ~50ms | None |
| `expo-image-manipulator` works cross-platform | **SURE** — Expo SDK module, battle-tested | Need to install |
| We can build a bottom sheet without `@gorhom/bottom-sheet` | **POSSIBLE** — reanimated PanGestureHandler works | More code, less polished |
| Gemini can accurately return HP/attacks/lore | **POSSIBLE** — good for popular cards, may hallucinate on obscure ones | Show with "AI" badge |

**Decision**: Use `@gorhom/bottom-sheet` — it's 1 dependency vs rewriting gesture + animation logic. It integrates with `react-native-reanimated` which we already have.

### Phase 3: Grounding Against Prototype Video

Your prototype shows these specific UI patterns I'm incorporating:

1. **Glassmorphism scan result card** — semi-transparent dark blue with border glow ✅ (we already have the `rgba(15, 27, 49, 0.9)` card)
2. **Price chart with marketplace toggle** — `TCGPlayer | Cardmarket | eBay` pill buttons ✅ (we have the price data from JustTCG — `lowPrice`, `midPrice`, `highPrice`, `history[]`)
3. **Variant condition selector** — NM / LP / MP dropdown ✅ (JustTCG returns variants by condition)
4. **"Add to Collection" gold CTA** — prominent action button ✅ (already have the umber "Add to Binder" button)
5. **Card stats inline** — HP, attacks, type weaknesses — from the card detail overlay

### Phase 3.5: Devil's Advocate

**"Why not use ML Kit for pre-OCR to get the card name before Gemini?"**
- Expo doesn't support ML Kit natively
- `react-native-mlkit-ocr` exists but is unmaintained (last update 2023)
- Building an Expo Module for ML Kit is 2-3 days of native dev per platform
- Gemini responds in 1.5s which is fast enough — the bottleneck is UPLOAD, not inference
- **Verdict: Skip ML Kit. Fix the upload size instead. Ship in hours, not weeks.**

**"What if Gemini hallucinates the lore/stats?"**
- Popular cards: very accurate (Pikachu, Charizard, Luffy, Nami)
- Obscure cards: may invent attacks or lore
- Mitigation: label as "AI Intel" with a subtle sparkle icon — users expect this from AI tools
- Long-term: cross-reference stats with a local JSON database of known cards

---

## Proposed Changes

### 🔧 Phase 1: The Snap (Speed)

> [!IMPORTANT]
> This alone cuts perceived scan time from ~4s to ~1s. Ship this first.

#### [MODIFY] [index.tsx](file:///D:/myprojects/KadoHunterApp/apps/mobile/app/(tabs)/index.tsx)

1. **After `takePictureAsync`**: Immediately set a `previewUri` state with the local `file://` photo URI. This makes the `ScanResultCard` appear instantly in skeleton mode with the user's actual captured photo.

2. **Image compression**: Before converting to base64, run through `expo-image-manipulator`:
   ```typescript
   import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

   const compressed = await manipulateAsync(
     photo.uri,
     [{ resize: { width: 640 } }],  // max 640px wide
     { compress: 0.6, format: SaveFormat.JPEG, base64: true }
   );
   // compressed.base64 is ~40-60KB vs current ~300KB
   ```

3. **State machine change**:
   - New state: `previewUri: string | null` — set immediately on capture
   - `isScanning` becomes the "recognizing" phase (after preview is shown)
   - `ScanResultCard` renders in skeleton mode when `previewUri` is set but `scanResult` is null

#### [MODIFY] [ScanResultCard.tsx](file:///D:/myprojects/KadoHunterApp/apps/mobile/components/scanner/ScanResultCard.tsx)

Add a **skeleton preview mode**:
- New prop: `previewUri?: string` — local photo URI
- When `scanResult` is null but `previewUri` exists:
  - Show the preview photo in the image slot (left side)
  - Show 3 animated pulsing skeleton bars where name/set/price would be
  - Show a subtle "Identifying..." label with the KadoHunter gold shimmer
- When `scanResult` arrives: crossfade from skeleton to real data

---

### 🧬 Phase 2: Rich Intel (Gemini Prompt Expansion)

> [!TIP]
> Zero extra API calls. Same Gemini request, richer response. This is our unique edge over MonPrice.

#### [MODIFY] [http.ts](file:///D:/myprojects/KadoHunterApp/convex/http.ts) — Recognition endpoint

Expand the Gemini prompt to return additional fields in the **same** call:

```typescript
// NEW fields added to the prompt:
{
  // ... existing: name, set, rarity, number, variant, finish, game, confidence

  // Game Stats (context-dependent)
  hp: "NUMBER or null",           // Pokémon HP
  attacks: [{                     // Pokémon/DB attacks
    name: "STRING",
    damage: "STRING",
    energyCost: "STRING"
  }],
  power: "NUMBER or null",        // One Piece power
  cost: "NUMBER or null",         // One Piece cost
  attribute: "STRING or null",    // One Piece attribute (STR/DEX/INT)

  // Collector Intel
  lore: "STRING",                 // One compelling sentence about why this card matters
  artist: "STRING or null",       // Card artist name
  notableDetail: "STRING or null" // "Tournament promo only" / "Alt art by HYOGONOSUKE"
}
```

The prompt instruction will say:
> "For `lore`, write ONE punchy sentence a collector would find interesting — not a generic Pokédex entry. Focus on market significance, art uniqueness, or competitive relevance."

#### [MODIFY] [types.ts](file:///D:/myprojects/KadoHunterApp/apps/mobile/services/recognition/types.ts)

Add new optional fields to `RecognitionResult`:
```typescript
export interface RecognitionResult {
  // ... existing fields ...
  hp?: number;
  attacks?: { name: string; damage: string; energyCost: string }[];
  power?: number;
  cost?: number;
  attribute?: string;
  lore?: string;
  artist?: string;
  notableDetail?: string;
}
```

#### [MODIFY] [gemini.ts](file:///D:/myprojects/KadoHunterApp/apps/mobile/services/recognition/gemini.ts)

Forward the new fields from the API response (hp, attacks, power, cost, lore, artist, notableDetail).

---

### 🎴 Phase 3: Card Dossier (Bottom Sheet)

> [!IMPORTANT]
> This is the "wow" feature. Inspired directly by your prototype video — the glassmorphism overlay with price chart and marketplace breakdown.

#### Install dependency

```bash
npx expo install @gorhom/bottom-sheet
```

#### [NEW] [CardDossier.tsx](file:///D:/myprojects/KadoHunterApp/apps/mobile/components/scanner/CardDossier.tsx)

A swipeable bottom sheet with three visual sections:

**Header (always visible when expanded):**
- Large card image (from `imageUrl` or `previewUri` fallback)
- Card name, set, number in premium typography
- Variant + Finish + Rarity badges (reuse existing pill components)
- Confidence bar

**Body — Collector Intel:**
- `lore` in italic with a ✨ sparkle icon prefix
- `notableDetail` / `artist` in a subtle callout box
- Game stats rendered as a mini card:
  - Pokémon: HP bar + attack list with energy costs
  - One Piece: Power/Cost/Attribute in a horizontal stat row

**Body — Market:**
- **Price hero**: Large `$XX.XX` with market trend indicator (↑ green / ↓ red)
- **Marketplace spread row**: `Low $X | Mid $X | High $X` — data already exists from JustTCG (`lowPrice`, `midPrice`, `highPrice`)
- **Price sparkline**: A simple SVG line chart using the `history[]` array from JustTCG (30-90 day data we already fetch and store in `priceHistory` table)
- **Source badge**: "via TCGPlayer" / "via JustTCG" / "via OPTCG"

**Footer:**
- "Dismiss" + "Add to Binder" buttons (same as current `ScanResultCard`)

#### [MODIFY] [ScanResultCard.tsx](file:///D:/myprojects/KadoHunterApp/apps/mobile/components/scanner/ScanResultCard.tsx)

- Add a "⬆ Details" swipe hint at the bottom
- Tapping the card OR swiping up opens `CardDossier`
- The result card becomes the "collapsed" preview; the dossier is the "expanded" view

#### [NEW] [PriceSparkline.tsx](file:///D:/myprojects/KadoHunterApp/apps/mobile/components/scanner/PriceSparkline.tsx)

A lightweight SVG sparkline component:
- Input: `history: { timestamp: number; price: number }[]`
- Renders a smooth bezier curve on a dark background
- Shows min/max labels at the extremes
- No external charting library — just `react-native-svg` (already in Expo)

---

## Execution Order

| Step | Phase | Files | Est. Time |
|------|-------|-------|-----------|
| 1 | Setup | Install `expo-image-manipulator`, `@gorhom/bottom-sheet` | 2 min |
| 2 | Phase 1 | `index.tsx` — preview state + image compression | 15 min |
| 3 | Phase 1 | `ScanResultCard.tsx` — skeleton mode | 15 min |
| 4 | Phase 2 | `http.ts` — expand Gemini prompt | 10 min |
| 5 | Phase 2 | `types.ts` + `gemini.ts` — forward new fields | 5 min |
| 6 | Phase 3 | `CardDossier.tsx` — full bottom sheet | 30 min |
| 7 | Phase 3 | `PriceSparkline.tsx` — SVG chart | 15 min |
| 8 | Phase 3 | Wire dossier into `ScanResultCard` + `index.tsx` | 10 min |
| 9 | Verify | Test scan pipeline end-to-end | 10 min |

**Total: ~2 hours of execution**

---

## What Makes This Uniquely Ours (Not MonPrice)

| MonPrice | KadoHunter (After This) |
|---|---|
| Black background, flat text dump | Glassmorphism panels, premium bento aesthetics |
| Separate OCR → Match → Price calls | Single Gemini call returns EVERYTHING |
| No collector context | AI-generated lore + artist + notable details |
| Basic price number | Full marketplace spread (Low/Mid/High) + sparkline chart |
| Native-only (Kotlin) | Cross-platform (Expo) — also works on web |
| No card stats | Inline HP/attacks/power rendered as mini stat cards |

---

## Open Questions

> [!IMPORTANT]
> **Scope confirmation**: I recommend shipping all 3 phases together since they're deeply connected. Phase 1 needs the skeleton, Phase 2 fills it in, Phase 3 shows the expanded view. Agree?

> [!WARNING]
> **`@gorhom/bottom-sheet`**: This is the one new dependency. It's the most popular bottom sheet for React Native (4.5M downloads/month) and works with Reanimated. Alternative: build with raw Reanimated `PanGestureHandler` — more code, same result. Your call.

> [!NOTE]
> **Price sparkline**: I'll build this with `react-native-svg` which is already part of Expo. No new charting library needed. The data (`history[]`) already exists in our `priceHistory` table from JustTCG.
