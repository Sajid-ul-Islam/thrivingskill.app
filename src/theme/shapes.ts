/**
 * Material Design 3 Shape Tokens
 * Reference: https://m3.material.io/styles/shape/overview
 */
export const shape = {
  none: 0,
  extraSmall: 4,      // 4dp: micro badges, progress bars, indicator tracks
  small: 8,           // 8dp: small buttons, chips, text inputs, small badges
  medium: 12,         // 12dp: compact cards, container boxes, list items
  large: 16,          // 16dp: standard cards, modal containers, hero items
  largeIncreased: 20, // 20dp: large hero cards, banners
  extraLarge: 28,     // 28dp: dialogs, bottom sheets, floating action sheets
  full: 9999,         // Pill / Capsule / Circle: M3 active tab indicator, pill buttons, circular avatars
} as const;

export type ShapeTokens = typeof shape;
export type ShapeKey = keyof typeof shape;
