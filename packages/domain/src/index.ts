import type { TCG, SubscriptionTier } from '@kado/contracts';

// ── App Identity ────────────────────────────────────────────────────

export const projectName = 'Kado Hunter';
export const bundleId = 'com.kadohunter.app';

// ── Supported Games ─────────────────────────────────────────────────

export const supportedGames: { key: TCG; label: string }[] = [
  { key: 'pokemon', label: 'Pokémon' },
  { key: 'mtg', label: 'Magic: The Gathering' },
  { key: 'yugioh', label: 'Yu-Gi-Oh!' },
  { key: 'onepiece', label: 'One Piece' },
  { key: 'dragonball', label: 'Dragon Ball' },
];

// ── Scan Limits ─────────────────────────────────────────────────────

export const scanLimits: Record<SubscriptionTier, number> = {
  free: 5,
  pro: Infinity,
};

// ── Subscription Plans ──────────────────────────────────────────────

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  label: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    tier: 'free',
    label: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '5 scans per day',
      'Basic collection management',
      'Price estimates',
    ],
  },
  {
    tier: 'pro',
    label: 'Hunter PRO',
    monthlyPrice: 4.99,
    yearlyPrice: 39.99,
    features: [
      'Unlimited scans',
      'Advanced collection analytics',
      'Price history & trends',
      'Multi-currency support',
      'Priority recognition',
      'Export collection data',
    ],
  },
];

// ── Layout ──────────────────────────────────────────────────────────

export type LayoutTier = 'compact' | 'medium' | 'expanded';

export const viewportBreakpoints = {
  mediumMin: 768,
  expandedMin: 1200,
} as const;

export function getLayoutTier(width: number): LayoutTier {
  if (width >= viewportBreakpoints.expandedMin) return 'expanded';
  if (width >= viewportBreakpoints.mediumMin) return 'medium';
  return 'compact';
}

// ── Web Shell Routes (used by apps/web) ─────────────────────────────

export const apiRoutes = {
  health: '/api/health',
  session: '/api/auth/session',
} as const;
