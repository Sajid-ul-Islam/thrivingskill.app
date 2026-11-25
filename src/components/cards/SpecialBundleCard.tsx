import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SpringPressable } from '../common';
import { SpecialBundle } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { shape } from '../../theme/shapes';
import { getSafeImageSource } from '../../utils/imageUtils';

interface SpecialBundleCardProps {
  bundle: SpecialBundle;
  onPress: () => void;
}

export const SpecialBundleCard: React.FC<SpecialBundleCardProps> = ({ bundle, onPress }) => {
  const { colors } = useTheme();

  return (
    <SpringPressable
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
      ]}
      onPress={onPress}
      activeScale={0.97}
      accessibilityRole="button"
      accessibilityLabel={`Special bundle: ${bundle.title}`}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={getSafeImageSource(bundle.thumbnail)}
          style={styles.thumbnail}
          {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
        />
        <View style={styles.badgeRow}>
          <View style={styles.bundleBadge}>
            <Ionicons name="cube" size={12} color="#FFFFFF" />
            <Text style={styles.bundleBadgeText}>CAREER TRACK</Text>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>MULTI-COURSE</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.banglaTitle, { color: colors.secondary }]} numberOfLines={1}>
          {bundle.banglaTitle}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {bundle.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
          {bundle.subtitle}
        </Text>

        {/* Feature Pills */}
        <View style={styles.featuresList}>
          {(bundle.features || []).slice(0, 2).map((feat, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textMuted }]} numberOfLines={1}>
                {feat}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer Meta & Price */}
        <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.statsCol}>
            {(typeof bundle.rating === 'number' && bundle.rating > 0) ||
            (typeof bundle.enrolledCount === 'number' && bundle.enrolledCount > 0) ? (
              <View style={styles.ratingRow}>
                {typeof bundle.rating === 'number' && bundle.rating > 0 && (
                  <>
                    <Ionicons name="star" size={13} color={colors.starColor} />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{bundle.rating}</Text>
                  </>
                )}
                {typeof bundle.enrolledCount === 'number' && bundle.enrolledCount > 0 && (
                  <Text style={[styles.enrolledText, { color: colors.textMuted }]}>
                    ({bundle.enrolledCount.toLocaleString()} enrolled)
                  </Text>
                )}
              </View>
            ) : null}
          </View>

          <View style={styles.priceCol}>
            {bundle.originalPriceBdt &&
            bundle.priceBdt &&
            bundle.originalPriceBdt > bundle.priceBdt ? (
              <Text style={[styles.origPrice, { color: colors.textMuted }]}>
                ৳ {bundle.originalPriceBdt.toLocaleString()}
              </Text>
            ) : null}
            <Text style={[styles.price, { color: colors.primary }]}>
              ৳ {(bundle.priceBdt || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </SpringPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: shape.large,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bundleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E34234',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: shape.extraSmall,
    gap: 4,
    flexShrink: 0,
  },
  bundleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: '#E34234',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: shape.extraSmall,
    flexShrink: 0,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  cardContent: {
    padding: 14,
  },
  banglaTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  featuresList: {
    gap: 4,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  statsCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  enrolledText: {
    fontSize: 11,
  },
  priceCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  origPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
  },
});
