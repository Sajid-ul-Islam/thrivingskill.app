import { Platform, TextStyle } from 'react-native';

/**
 * System-native font families (maximum 2 font stacks: primary sans + monospace).
 * Ensures crisp legibility, native rendering, and zero custom-font loading FOUT.
 */
export const fontFamily = {
  sans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }) as string,
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string,
} as const;

/**
 * Strict Heading & Body Typography Scale (H1 through H6 + semantic body/UI styles).
 * Designed to establish clear visual hierarchy from screen titles down to captions.
 */
export const typography = {
  h1: {
    fontFamily: fontFamily.sans,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  } as TextStyle,
  h2: {
    fontFamily: fontFamily.sans,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.35,
  } as TextStyle,
  h3: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  } as TextStyle,
  h4: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.1,
  } as TextStyle,
  h5: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  } as TextStyle,
  h6: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  } as TextStyle,
  bodyMedium: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  } as TextStyle,
  bodySmall: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  } as TextStyle,
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  } as TextStyle,
  overline: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  } as TextStyle,
  button: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  } as TextStyle,
} as const;

/**
 * Accessibility minimum interactive touch target size (44x44 points/dp per Apple HIG & WCAG).
 */
export const MIN_TOUCH_TARGET = 44;

export const TOUCH_HIT_SLOP = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const;

export type TypographyKey = keyof typeof typography;
