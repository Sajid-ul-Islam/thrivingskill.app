import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { SpringPressable } from './SpringPressable';

export type AdaptiveStateMode = 'loading' | 'empty' | 'offline' | 'error';

interface StateViewProps {
  mode: AdaptiveStateMode;
  title?: string;
  message?: string;
  icon?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

const DEFAULT_META: Record<
  AdaptiveStateMode,
  { icon: string; title: string; message: string }
> = {
  loading: {
    icon: 'hourglass-outline',
    title: 'Loading content…',
    message: 'Preparing your masterclasses and progress.',
  },
  empty: {
    icon: 'folder-open-outline',
    title: 'Nothing here yet',
    message: 'Try adjusting your filters or explore the catalog.',
  },
  offline: {
    icon: 'cloud-offline-outline',
    title: 'You are offline',
    message: 'Check your internet connection and tap Retry to sync fresh content.',
  },
  error: {
    icon: 'alert-circle-outline',
    title: 'Something went wrong',
    message: 'We could not load this content right now. Please try again.',
  },
};

/**
 * Unified Adaptive State View accounting for loading, empty, offline, and error states.
 * Guarantees WCAG AA contrast, clear typography hierarchy, and >=44dp touch targets.
 */
export const StateView: React.FC<StateViewProps> = ({
  mode,
  title,
  message,
  icon,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}) => {
  const { colors } = useTheme();
  const defaults = DEFAULT_META[mode];
  const resolvedTitle = title || defaults.title;
  const resolvedMessage = message || defaults.message;
  const resolvedIcon = icon || defaults.icon;

  const iconTint =
    mode === 'error'
      ? colors.danger
      : mode === 'offline'
      ? colors.brandGold
      : colors.primary;

  const iconBg =
    mode === 'error'
      ? colors.dangerLight
      : mode === 'offline'
      ? colors.brandGoldSubtle
      : colors.primaryLight;

  return (
    <View
      style={[
        styles.container,
        compact ? styles.compactPadding : styles.regularPadding,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole={mode === 'error' || mode === 'offline' ? 'alert' : undefined}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        {mode === 'loading' ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Ionicons name={resolvedIcon as any} size={30} color={iconTint} />
        )}
      </View>

      <Text style={[typography.h4, styles.title, { color: colors.text }]}>
        {resolvedTitle}
      </Text>

      <Text style={[typography.bodySmall, styles.message, { color: colors.textMuted }]}>
        {resolvedMessage}
      </Text>

      {(primaryActionLabel && onPrimaryAction) || (secondaryActionLabel && onSecondaryAction) ? (
        <View style={styles.actionsRow}>
          {primaryActionLabel && onPrimaryAction ? (
            <SpringPressable
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={onPrimaryAction}
              accessibilityRole="button"
              accessibilityLabel={primaryActionLabel}
            >
              <Text style={[typography.button, { color: colors.onPrimary }]}>
                {primaryActionLabel}
              </Text>
            </SpringPressable>
          ) : null}

          {secondaryActionLabel && onSecondaryAction ? (
            <SpringPressable
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={onSecondaryAction}
              accessibilityRole="button"
              accessibilityLabel={secondaryActionLabel}
            >
              <Text style={[typography.button, { color: colors.text }]}>
                {secondaryActionLabel}
              </Text>
            </SpringPressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: shape.large,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  regularPadding: {
    paddingVertical: 32,
    paddingHorizontal: 22,
  },
  compactPadding: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtn: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 120,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: shape.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
