// ── KadoHunter Color Palette ────────────────────────────────────────

export const kadoColors = {
  midnight: '#0a192f',
  navy: '#112240',
  umber: '#c7a77b',
  umberDark: '#b3956d',
  lightSlate: '#ccd6f6',
  slateText: '#8892b0',
  white: '#e6f1ff',
  black: '#020c1b',
  success: '#64ffda',
  warning: '#f5a623',
  error: '#ff6b6b',
} as const;

// ── Legacy Palette (used by apps/web shell) ─────────────────────────

export const palette = {
  canvas: kadoColors.midnight,
  surface: kadoColors.navy,
  panel: '#1a2d4d',
  panelStrong: '#233554',
  ink: kadoColors.white,
  muted: kadoColors.slateText,
  accent: kadoColors.umber,
  accentSoft: 'rgba(199, 167, 123, 0.15)',
  success: kadoColors.success,
  warning: kadoColors.warning,
  border: 'rgba(204, 214, 246, 0.1)',
  shadow: 'rgba(2, 12, 27, 0.7)',
} as const;

// ── Spacing ─────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ── Border Radii ────────────────────────────────────────────────────

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

// ── Fonts ───────────────────────────────────────────────────────────

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
