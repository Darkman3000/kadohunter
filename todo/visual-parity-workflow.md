# Visual Parity Workflow

> The official process for rebuilding the mobile app to match the prototype UI.
> This workflow is the source of truth for how screens are ported from the prototype to the production mobile app.

## Prerequisites

- The prototype source code lives at `todo/remix_prototype/`
- The reference directory at `reference/` is read-only porting reference
- The mobile app lives at `apps/mobile/`
- Node.js is installed

## Workflow Steps

### Step 1: Start the Prototype

1. Open a terminal in `todo/remix_prototype/`
2. Run `npm install` (first time only)
3. Run `npm run dev`
4. The prototype should be running at `http://localhost:5173` (Vite default)

### Step 2: Start the Mobile App

1. Open a second terminal in `apps/mobile/`
2. Run `npx expo start --web --clear`
3. The mobile app renders at `http://localhost:8081`

### Step 3: Screenshot the Prototype (Screen by Screen)

For each screen in the prototype:

1. Navigate to the screen in the prototype browser tab
2. Resize the browser window to **mobile viewport** (≈ 390×844 or use Chrome DevTools device mode)
3. Take a full-page screenshot and save it to the artifacts directory
4. Name the screenshot descriptively: `prototype_[screen]_[state].png`
   - Examples: `prototype_binder_grid.png`, `prototype_profile_signed_in.png`, `prototype_scanner_idle.png`
5. Also capture any interactive states:
   - Hover/active states on buttons
   - Modal/overlay states
   - Loading/empty states
   - Dark mode specifics

### Step 4: Audit the Prototype Source Code

For each screen:

1. Open the corresponding prototype component (e.g., `components/BinderView.tsx`, `components/ProfileView.tsx`)
2. Document the exact DOM structure, class names, and layout hierarchy
3. Identify all interactive behaviors:
   - Tab switching
   - Search filtering
   - Sort controls
   - View mode toggles (grid/list)
   - Card interactions (tap, long-press)
   - Pull-to-refresh
   - Infinite scroll
   - Modal triggers
   - Navigation transitions

### Step 5: Rebuild in React Native

For each screen, translate the prototype into production React Native code:

1. **Structure first**: Map each `div` to `View`, each `p`/`h1` to `Text`, each `img` to `Image`
2. **Styling second**: Translate Tailwind classes to NativeWind equivalents
3. **Behavior third**: Wire up all interactive behaviors with proper state management
4. **Data fourth**: Connect to the actual Convex backend queries/mutations

### Step 6: Side-by-Side Comparison (Ralph Loop)

After rebuilding each screen:

1. Open both the prototype and mobile app side by side
2. Compare pixel-by-pixel against the reference screenshots
3. Check every interactive behavior matches
4. Document any intentional deviations (e.g., native platform conventions)
5. Fix discrepancies before moving to the next screen

### Step 7: Record the Verification

1. Take a screenshot of the rebuilt mobile screen
2. Save as `mobile_[screen]_[state].png`
3. Create a side-by-side comparison artifact
4. Update `progress.md` with completion status

## Screen Inventory

The following screens must achieve 100% visual and behavioral parity:

| Screen | Prototype Component | Mobile File | Status |
|--------|-------------------|-------------|--------|
| Binder (Grid) | `BinderView.tsx` | `binder.tsx` | structural done, behavior pending |
| Binder (List) | `BinderView.tsx` | `binder.tsx` | structural done, behavior pending |
| Profile (Signed Out) | `ProfileView.tsx` | `profile.tsx` | structural done, behavior pending |
| Profile (Signed In) | `ProfileView.tsx` | `profile.tsx` | structural done, behavior pending |
| Profile (Identity/Settings) | `ProfileView.tsx` | `profile.tsx` | not started |
| Profile (Pulse Feed) | `ProfileView.tsx` | `profile.tsx` | structural done, behavior pending |
| Profile (Network/Friends) | `ProfileView.tsx` | `profile.tsx` | not started |
| Scanner | `App.tsx` | `index.tsx` | not audited |
| Card Detail Modal | `App.tsx` | `card/[id].tsx` | not audited |

## Definition of "100% Parity"

A screen is at 100% parity when:

1. **Visual**: Layout, spacing, colors, typography, icons, and borders match the prototype screenshot
2. **Behavioral**: All interactive elements (tabs, toggles, search, sort, modals) work identically
3. **Responsive**: The viewport constraint and mobile framing match the prototype
4. **Data Shape**: The UI can accept and display the same data structures as the prototype
5. **Transitions**: Animations, transitions, and micro-interactions match

## What Is NOT Required for Parity

- Backend data does not need to be real (mock data is acceptable)
- OAuth providers do not need to be functional on web (native-only is fine)
- Camera/scan functionality is platform-dependent and can differ
- Web-only features (localStorage, navigator.share) can use RN equivalents
