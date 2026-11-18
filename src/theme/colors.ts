/**
 * Thriving Skills Color Palette — Official Design Rule
 *
 * The color system is built to convey professionalism, trust, and action-driven learning.
 *
 * Primary Colors:
 * • Deep Royal Blue (Primary Brand Color) — #102F53
 *   Usage: App bar headers, primary buttons, major card backgrounds, main branding elements, and primary text headers.
 * • Secondary / Accent Red — #E34234
 *   Usage: Call-to-action (CTA) highlights, notification badges, active states, important alerts, and discount tags.
 * • Pure White — #FFFFFF
 *   Usage: Card backgrounds, container surfaces in dark modes, body text on dark headers, and negative space separation.
 *
 * Enforcement: Use these brand tokens exclusively in component code. Do not hardcode bare hex values,
 * and do not treat other alternate brand hues as replacements for the three primary palette colors.
 */

export const lightColors = {
  primary: '#102F53', // Deep Royal Blue (Primary Brand Color)
  primaryDark: '#0A1C33',
  primaryLight: '#E8EEF5',
  primaryGradientStart: '#102F53',
  primaryGradientEnd: '#1D4476',
  secondary: '#1D4476', // Deep Royal Blue Light
  secondaryLight: '#EFF6FF',
  accent: '#E34234', // Secondary / Accent Red (CTA, badges, alerts, discounts)
  accentLight: '#FEE2E2',
  brandNavy: '#102F53',
  brandRed: '#E34234',
  brandGold: '#FFB606', // Thriving Skills Golden Amber
  brandGoldLight: '#FEF3C7',
  brandGoldSubtle: 'rgba(255, 182, 6, 0.12)',
  brandNavySubtle: 'rgba(16, 47, 83, 0.08)',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.16)',
  onSuccess: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF', // Pure White surface
  surfaceCard: '#FFFFFF', // Pure White card
  surfaceSubtle: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  text: '#102F53', // Primary Text Headers in Deep Royal Blue
  textMuted: '#475569',
  textLight: '#64748B',
  textInverse: '#FFFFFF',
  onPrimary: '#FFFFFF', // Pure White on Deep Royal Blue
  onSecondary: '#FFFFFF',
  onAccent: '#FFFFFF', // Pure White on Accent Red
  onDanger: '#FFFFFF',
  onGold: '#102F53',
  cardShadow: 'rgba(16, 47, 83, 0.08)',
  badgeBackground: '#E8EEF5',
  badgeText: '#102F53',
  starColor: '#FFB606',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabActive: '#102F53',
  tabInactive: '#64748B',
};

export const darkColors = {
  primary: '#38BDF8', // Cyan/Sky highlight on charcoal navy
  primaryDark: '#102F53',
  primaryLight: '#1E2430',
  primaryGradientStart: '#102F53',
  primaryGradientEnd: '#E34234',
  secondary: '#60A5FA', // Slate blue
  secondaryLight: '#22252E',
  accent: '#FF5A4B', // Brand Red Light for dark mode
  accentLight: '#450A0A',
  brandNavy: '#102F53',
  brandRed: '#E34234',
  brandGold: '#FFB606',
  brandGoldLight: '#78350F',
  brandGoldSubtle: 'rgba(255, 182, 6, 0.20)',
  brandNavySubtle: 'rgba(56, 189, 248, 0.15)',
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.16)',
  onSuccess: '#0F172A',
  background: '#121214', // Rich Charcoal Base
  surface: '#18181B', // Dark Charcoal Surface
  surfaceCard: '#1F1F23', // Charcoal Card Surface
  surfaceSubtle: '#27272D', // Subtle Charcoal Fill
  surfaceElevated: '#2E2E36', // Elevated Charcoal Modal/Dropdown
  border: '#2E2E36', // Clean Charcoal Border
  borderSubtle: '#24242A', // Subtle Charcoal Divider
  text: '#F8FAFC',
  textMuted: '#CBD5E1',
  textLight: '#94A3B8',
  textInverse: '#0F172A',
  onPrimary: '#0F172A',
  onSecondary: '#0F172A',
  onAccent: '#0F172A',
  onDanger: '#0F172A',
  onGold: '#102F53',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  badgeBackground: '#282830', // Charcoal Badge Background
  badgeText: '#93C5FD',
  starColor: '#FFB606',
  tabBarBg: '#141416', // Charcoal Navigation Bar
  tabBarBorder: '#24242A',
  tabActive: '#38BDF8',
  tabInactive: '#94A3B8',
};

export type ThemeColors = typeof lightColors;
