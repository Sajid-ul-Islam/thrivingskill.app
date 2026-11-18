import { useWindowDimensions, StyleSheet, ViewStyle } from 'react-native';

export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
  maxContentWidth: 1100,
  maxHeroWidth: 880,
  maxModalWidth: 580,
  maxTabBarWidth: 640,
} as const;

export interface ResponsiveInfo {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  isDesktop: boolean;
  /** Suggested column count for main lists/catalog (1 for mobile, 2 for tablet portrait, 3 for tablet landscape) */
  numColumns: number;
  /** Suggested 2-column grid for tablets (1 for mobile, 2 for tablet in any orientation) */
  gridColumns2: number;
  /** Content max width constraint to prevent unreadable ultra-wide stretches */
  contentMaxWidth: number;
  /** Helper style to center and clamp main content containers on tablet */
  containerClampStyle: ViewStyle;
  /** Helper style for modal dialog cards on tablet (centered card dialog) vs mobile (bottom sheet) */
  modalCardResponsiveStyle: ViewStyle;
  /** Calculate exact column item width given container padding and column gap */
  getColumnWidth: (columns: number, gap?: number, horizontalPadding?: number) => number;
}

/**
 * Universal responsive layout hook for phones, tablets (portrait/landscape), and desktop views.
 * Adheres to Miller's, Hick's, and Fitts's Laws by clamping unbounded wide layouts,
 * chunking large catalogs into multi-column grids, and centering primary action dialogs.
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isTablet = width >= BREAKPOINTS.tablet || Math.min(width, height) >= 600;
  const isDesktop = width >= BREAKPOINTS.desktop;

  const numColumns = isTablet ? (isLandscape ? 3 : 2) : 1;
  const gridColumns2 = isTablet ? 2 : 1;
  const contentMaxWidth = BREAKPOINTS.maxContentWidth;

  const containerClampStyle: ViewStyle = isTablet
    ? {
        maxWidth: contentMaxWidth,
        width: '100%',
        alignSelf: 'center',
      }
    : {
        width: '100%',
      };

  const modalCardResponsiveStyle: ViewStyle = isTablet
    ? {
        maxWidth: BREAKPOINTS.maxModalWidth,
        width: '90%',
        alignSelf: 'center',
        borderRadius: 24,
        overflow: 'hidden',
      }
    : {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      };

  const getColumnWidth = (columns: number, gap = 16, horizontalPadding = 16): number => {
    const effectiveWidth = isTablet ? Math.min(width, contentMaxWidth) : width;
    const availableWidth = effectiveWidth - horizontalPadding * 2 - gap * (columns - 1);
    return Math.floor(availableWidth / columns);
  };

  return {
    width,
    height,
    isTablet,
    isLandscape,
    isDesktop,
    numColumns,
    gridColumns2,
    contentMaxWidth,
    containerClampStyle,
    modalCardResponsiveStyle,
    getColumnWidth,
  };
}
