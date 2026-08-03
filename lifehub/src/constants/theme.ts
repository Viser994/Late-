// ─── Design Tokens ────────────────────────────────────────────────────────────
// Single source of truth for all colors, typography, spacing, and shadows.

export const palette = {
  // Brand
  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo200: '#C7D2FE',
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',

  // Accent – warm amber for urgency
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',

  // Success
  green50: '#F0FDF4',
  green100: '#DCFCE7',
  green400: '#4ADE80',
  green500: '#22C55E',
  green600: '#16A34A',

  // Danger
  red50: '#FFF1F2',
  red100: '#FFE4E6',
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',

  // Neutral
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray150: '#EAECF0',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',

  // Dark mode surfaces
  dark900: '#0D0F14',
  dark800: '#151821',
  dark700: '#1C2030',
  dark600: '#232840',
  dark500: '#2B3050',
} as const;

export const lightTheme = {
  // Backgrounds
  background: palette.gray50,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceMuted: palette.gray100,
  cardBorder: palette.gray200,

  // Text
  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textInverse: palette.white,

  // Brand
  primary: palette.indigo500,
  primaryLight: palette.indigo100,
  primaryDark: palette.indigo700,

  // Semantic
  urgent: palette.red500,
  urgentLight: palette.red50,
  warning: palette.amber500,
  warningLight: palette.amber50,
  success: palette.green500,
  successLight: palette.green50,

  // Tab bar
  tabBar: palette.white,
  tabBarBorder: palette.gray200,
  tabBarActive: palette.indigo500,
  tabBarInactive: palette.gray400,

  // Misc
  divider: palette.gray150,
  overlay: 'rgba(0,0,0,0.4)',
  shadow: 'rgba(0,0,0,0.08)',
} as const;

export const darkTheme = {
  // Backgrounds
  background: palette.dark900,
  surface: palette.dark800,
  surfaceElevated: palette.dark700,
  surfaceMuted: palette.dark600,
  cardBorder: palette.dark500,

  // Text
  textPrimary: palette.gray50,
  textSecondary: palette.gray400,
  textTertiary: palette.gray600,
  textInverse: palette.gray900,

  // Brand
  primary: palette.indigo400,
  primaryLight: 'rgba(99,102,241,0.15)',
  primaryDark: palette.indigo600,

  // Semantic
  urgent: palette.red400,
  urgentLight: 'rgba(239,68,68,0.12)',
  warning: palette.amber400,
  warningLight: 'rgba(245,158,11,0.12)',
  success: palette.green400,
  successLight: 'rgba(34,197,94,0.12)',

  // Tab bar
  tabBar: palette.dark800,
  tabBarBorder: palette.dark600,
  tabBarActive: palette.indigo400,
  tabBarInactive: palette.gray600,

  // Misc
  divider: palette.dark600,
  overlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.3)',
} as const;

export type AppTheme = typeof lightTheme;

export const typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Weights (React Native uses string weights)
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Category metadata ────────────────────────────────────────────────────────

export const CATEGORY_META: Record<
  string,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  identity: { label: 'Identity', icon: 'card-account-details', color: '#6366F1', bgColor: '#EEF2FF' },
  insurance: { label: 'Insurance', icon: 'shield-check', color: '#10B981', bgColor: '#ECFDF5' },
  warranty: { label: 'Warranty', icon: 'tools', color: '#F59E0B', bgColor: '#FFFBEB' },
  medical: { label: 'Medical', icon: 'hospital-box', color: '#EF4444', bgColor: '#FFF1F2' },
  finance: { label: 'Finance', icon: 'bank', color: '#8B5CF6', bgColor: '#F5F3FF' },
  travel: { label: 'Travel', icon: 'airplane', color: '#3B82F6', bgColor: '#EFF6FF' },
  receipt: { label: 'Receipt', icon: 'receipt', color: '#EC4899', bgColor: '#FDF2F8' },
  other: { label: 'Other', icon: 'folder', color: '#6B7280', bgColor: '#F9FAFB' },
};

export const REMINDER_TYPE_META: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  task: { label: 'Task', icon: 'checkbox-marked-circle-outline', color: '#6366F1' },
  bill: { label: 'Bill', icon: 'credit-card-outline', color: '#F59E0B' },
  appointment: { label: 'Appointment', icon: 'calendar-clock', color: '#3B82F6' },
  renewal: { label: 'Renewal', icon: 'refresh-circle', color: '#10B981' },
  custom: { label: 'Reminder', icon: 'bell-outline', color: '#8B5CF6' },
};
