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
  secondary: '#FFB606', // Thriving Skills Golden Amber
  secondaryLight: '#FFFBEB',
  accent: '#E34234', // Secondary / Accent Red (CTA, badges, alerts, discounts)
  accentLight: '#FEE2E2',
  brandNavy: '#102F53',
  brandRed: '#E34234',
  brandGold: '#FFB606',
  brandGoldLight: '#FEF3C7',
  brandGoldSubtle: 'rgba(255, 182, 6, 0.12)',
  brandNavySubtle: 'rgba(16, 47, 83, 0.08)',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.16)',
  onSuccess: '#FFFFFF',
  background: '#FFFFFF', // Light mode base background
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF', // Card background
  surfaceSubtle: '#F5F7FA',
  surfaceElevated: '#F5F7FA', // Elevated surface
  border: '#E2E8F0', // Border
  borderSubtle: '#F1F5F9',
  text: '#102F53', // Primary Text in Deep Royal Blue
  textMuted: '#64748B', // Secondary Text
  textLight: '#94A3B8',
  textInverse: '#FFFFFF',
  onPrimary: '#FFFFFF', // Pure White on Deep Royal Blue
  onSecondary: '#102F53',
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
  primary: '#FFFFFF', // Crisp Pure White for interactive primary actions on dark navy
  primaryDark: '#F1F5F9', // Elevated white surface
  primaryLight: 'rgba(255, 255, 255, 0.12)', // Clean frosted white container fill
  primaryGradientStart: '#102F53',
  primaryGradientEnd: '#E34234',
  secondary: '#FFFFFF', // Crisp White secondary action
  secondaryLight: 'rgba(255, 255, 255, 0.12)', // Frosted white fill
  accent: '#E34234', // Accent red (consistent brand identity)
  accentLight: '#450A0A',
  brandNavy: '#102F53', // Primary brand #102F53 consistent across themes
  brandRed: '#E34234', // Accent red #E34234 consistent across themes
  brandGold: '#FFFFFF',
  brandGoldLight: '#1C2E46',
  brandGoldSubtle: 'rgba(255, 255, 255, 0.12)',
  brandNavySubtle: 'rgba(255, 255, 255, 0.12)',
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.16)',
  onSuccess: '#0B1420',
  background: '#0B1420', // Deep Navy base background (no pure black #000000)
  surface: '#162538', // Layered Navy Card Surface
  surfaceCard: '#162538', // Card background
  surfaceSubtle: '#1C2E46', // Layered subtle navy fill
  surfaceElevated: '#24364B', // Elevated surface
  border: '#34465A', // Border
  borderSubtle: '#1F3147', // Subtle layered border
  text: '#F1F5F9', // Primary Text (White/slate for important content & contrast)
  textMuted: '#A8B5C5', // Secondary Text
  textLight: '#8295AB',
  textInverse: '#0B1420',
  onPrimary: '#102F53', // Brand Deep Navy text on vibrant Pure White (15.6:1 WCAG AAA)
  onSecondary: '#102F53',
  onAccent: '#FFFFFF',
  onDanger: '#0B1420',
  onGold: '#102F53',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  badgeBackground: '#1E3147', // Layered navy badge container
  badgeText: '#FFFFFF', // Clean white badge text on dark navy
  starColor: '#FFB606',
  tabBarBg: '#0B1420', // Deep Navy Navigation Bar
  tabBarBorder: '#1F3147',
  tabActive: '#FFFFFF', // Crisp White active tab state in dark mode
  tabInactive: '#A8B5C5',
};

export type ThemeColors = typeof lightColors;
