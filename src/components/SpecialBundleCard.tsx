import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpecialBundle } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SpecialBundleCardProps {
  bundle: SpecialBundle;
  onPress: () => void;
}

export const SpecialBundleCard: React.FC<SpecialBundleCardProps> = ({ bundle, onPress }) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: bundle.thumbnail }} style={styles.thumbnail} />
        <View style={styles.badgeRow}>
          <View style={styles.bundleBadge}>
            <Ionicons name="cube" size={12} color="#FFFFFF" />
            <Text style={styles.bundleBadgeText}>SPECIAL BUNDLE</Text>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>SAVE 60%</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.banglaTitle, { color: colors.secondary }]}>
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
          {bundle.features.slice(0, 2).map((feat, idx) => (
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
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: colors.text }]}>{bundle.rating}</Text>
              <Text style={[styles.enrolledText, { color: colors.textMuted }]}>
                ({bundle.enrolledCount.toLocaleString()} enrolled)
              </Text>
            </View>
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.origPrice, { color: colors.textLight }]}>
              ৳{bundle.originalPriceBdt.toLocaleString()}
            </Text>
            <Text style={[styles.price, { color: colors.primary }]}>
              ৳{bundle.priceBdt.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
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
    height: 130,
    width: '100%',
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
    justifyContent: 'space-between',
  },
  bundleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  bundleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  },
  statsCol: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
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
