import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { FlashSaleCampaign, isFlashSaleActive } from '../../services/api/companionService';
import { SpringPressable } from '../common/SpringPressable';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET, typography } from '../../theme/typography';

export interface FlashSaleBannerProps {
  sale?: FlashSaleCampaign | null;
  onPress?: (couponCode: string) => void;
}

function formatRemainingCountdown(endTimestampSec: number, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((endTimestampSec * 1000 - nowMs) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

/**
 * Renders a countdown campaign banner ONLY when explicitly enabled by WP Admin
 * with a valid future end timestamp. Automatically hides once expired.
 */
export const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({ sale, onPress }) => {
  const { colors } = useTheme();
  const { isBangla } = useLanguage();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive = isFlashSaleActive(sale, nowMs);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isFlashSaleActive(sale, Date.now())) {
      return;
    }

    timerRef.current = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sale]);

  if (!isActive || !sale || !sale.title) {
    return null;
  }

  const endTimestamp =
    typeof sale.end_timestamp === 'number'
      ? sale.end_timestamp
      : sale.end_time
        ? Math.floor(Date.parse(sale.end_time) / 1000)
        : 0;
  const countdownText = endTimestamp > 0 ? formatRemainingCountdown(endTimestamp, nowMs) : '';

  return (
    <SpringPressable
      style={[styles.bannerCard, { backgroundColor: colors.accent, borderColor: colors.border }]}
      onPress={() => onPress?.(sale.coupon_code)}
      accessibilityRole="button"
      accessibilityLabel={`${sale.title} ${sale.discount_percent ? `${sale.discount_percent}% off` : ''}`}
      activeScale={0.98}
    >
      <View style={styles.leftCol}>
        <View style={styles.topRow}>
          <Ionicons name="flash" size={14} color={colors.onAccent} />
          <Text style={[styles.titleText, { color: colors.onAccent }]} numberOfLines={1}>
            {sale.title}
          </Text>
        </View>
        {sale.coupon_code ? (
          <Text style={[styles.subText, { color: colors.onAccent }]} numberOfLines={1}>
            {isBangla ? `কুপন কোড: ${sale.coupon_code}` : `Use code: ${sale.coupon_code}`}
            {sale.discount_percent > 0 ? ` • ${sale.discount_percent}% OFF` : ''}
          </Text>
        ) : null}
      </View>

      {countdownText ? (
        <View style={[styles.timerPill, { backgroundColor: colors.primary }]}>
          <Ionicons name="time-outline" size={12} color={colors.onPrimary} />
          <Text style={[styles.timerText, { color: colors.onPrimary }]}>{countdownText}</Text>
        </View>
      ) : null}
    </SpringPressable>
  );
};

const styles = StyleSheet.create({
  bannerCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: shape.large,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: MIN_TOUCH_TARGET,
  },
  leftCol: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    flex: 1,
  },
  subText: {
    ...typography.caption,
    opacity: 0.92,
    marginTop: 2,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: shape.full,
    flexShrink: 0,
  },
  timerText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
