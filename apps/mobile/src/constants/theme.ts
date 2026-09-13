import '@/global.css';

import { Platform } from 'react-native';

export const AstuColors = {
  // Main UI Brand Color: Radiant Light Blue (Sky / Azure)
  primary: '#0ea5e9',
  primaryContainer: '#e0f2fe',
  primaryFixed: '#bae6fd',
  primaryFixedDim: '#38bdf8',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#0369a1',
  onPrimaryFixed: '#0c4a6e',
  onPrimaryFixedVariant: '#0284c7',

  // Major & Minor Accents: Rich Reddish Brown (Terracotta / Cordovan)
  accentReddishBrown: '#8b3224',
  accentReddishBrownDark: '#6e2518',
  accentReddishBrownLight: '#a83f2e',
  accentRustSienna: '#c25e42',
  accentAmberRust: '#d97757',

  // Surfaces & Backgrounds
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceBright: '#ffffff',
  surfaceDim: '#e2e8f0',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f9ff',
  surfaceContainer: '#e0f2fe',
  surfaceContainerHigh: '#f1f5f9',
  surfaceContainerHighest: '#e2e8f0',
  surfaceVariant: '#f1f5f9',

  // Typography & Content
  onSurface: '#0f172a',
  onSurfaceVariant: '#475569',
  onBackground: '#0f172a',

  // Borders & Outlines
  outline: '#94a3b8',
  outlineVariant: '#e2e8f0',
  secondary: '#8b3224',
  secondaryContainer: '#fdf2f0',
  secondaryFixed: '#fce8e4',
  secondaryFixedDim: '#f5cfc7',
  onSecondary: '#ffffff',

  // Badges & Actions
  tertiary: '#c25e42',
  tertiaryContainer: '#faebe6',
  onTertiaryFixed: '#5c2014',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',

  // Status
  statusPlaced: '#8b3224',
  statusPaid: '#0284c7',
  statusError: '#ba1a1a',
} as const;

// Backward compatibility alias
export const MatifColors = AstuColors;

// Brand Colors for ASTU Garment: Light Blue brand + Reddish Brown accents
export const LogoColors = {
  // Main UI brand color: Light Blue
  lightBlue: '#0ea5e9',
  lightBlueGlow: '#38bdf8',
  lightBlueDeep: '#0284c7',
  lightBlueDark: '#0369a1',
  softIceBlueTint: '#e0f2fe',

  // Major accent: Reddish Brown
  reddishBrown: '#8b3224',
  reddishBrownDark: '#6e2518',
  reddishBrownLight: '#a83f2e',
  softTerracottaTint: '#fdf2f0',

  // Minor accent: Warm Rust / Sienna
  rustSienna: '#c25e42',
  amberRust: '#d97757',

  // Structural Neutrals
  deepCharcoal: '#0f172a',
  white: '#ffffff',
  cardBorder: '#e2e8f0',

  // Semantic mappings for compatibility with existing UI components
  goldenOrange: '#0ea5e9',        // Primary Light Blue
  sharpRedOrange: '#8b3224',      // Major Reddish Brown accent
  softCreamTint: '#e0f2fe',       // Soft Light Blue Container Tint
} as const;

export const Colors = {
  light: {
    text: AstuColors.onSurface,
    background: AstuColors.background,
    backgroundElement: AstuColors.surfaceContainerLow,
    backgroundSelected: AstuColors.primaryFixed,
    textSecondary: AstuColors.onSurfaceVariant,
    primary: AstuColors.primary,
  },
  dark: {
    text: AstuColors.onSurface,
    background: AstuColors.background,
    backgroundElement: AstuColors.surfaceContainerLow,
    backgroundSelected: AstuColors.primaryFixed,
    textSecondary: AstuColors.onSurfaceVariant,
    primary: AstuColors.primary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  garamond: {
    regular: 'EBGaramond_400Regular',
    medium: 'EBGaramond_500Medium',
    semiBold: 'EBGaramond_600SemiBold',
    bold: 'EBGaramond_700Bold',
  },
  hanken: {
    regular: 'HankenGrotesk_400Regular',
    medium: 'HankenGrotesk_500Medium',
    semiBold: 'HankenGrotesk_600SemiBold',
    bold: 'HankenGrotesk_700Bold',
  },
  mono: Platform.select({ default: 'monospace' }),
  sans: Platform.select({ default: 'normal' }),
  serif: Platform.select({ default: 'serif' }),
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

