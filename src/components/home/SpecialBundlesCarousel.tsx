import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SpecialBundlePosterItem } from '../../services/api/brandingService';
import { SpringPressable } from '../common/SpringPressable';
import { typography } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { triggerHaptic } from '../../utils/haptics';
import { getSafeImageSource } from '../../utils/imageUtils';

interface SpecialBundlesCarouselProps {
  bundles: SpecialBundlePosterItem[];
  onSelectBundle: (bundle: SpecialBundlePosterItem) => void;
  onViewAllBundles?: () => void;
}

const CARD_WIDTH = 250;
const CARD_GAP = 14;

export const SpecialBundlesCarousel: React.FC<SpecialBundlesCarouselProps> = ({
  bundles,
  onSelectBundle,
  onViewAllBundles,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const flatRef = useRef<FlatList<SpecialBundlePosterItem> | null>(null);

  if (!bundles || bundles.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.titleWithBadge}>
            <Text style={[typography.h3, { color: colors.text }]}>
              {isBangla ? 'স্পেশাল বান্ডেল কোর্স' : 'Special Career Bundles'}
            </Text>
            <View style={[styles.superDealBadge, { backgroundColor: '#E34234' }]}>
              <Text style={styles.superDealText}>-40% OFF</Text>
            </View>
          </View>
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            {isBangla
              ? 'ক্যারিয়ার গ্রোথের জন্য বিশেষভাবে সাজানো বান্ডেল কোর্সসমূহ'
              : 'Multi-course career tracks curated with executive masterclasses'}
          </Text>
        </View>

        {onViewAllBundles && (
          <SpringPressable
            onPress={() => {
              triggerHaptic('light');
              onViewAllBundles();
            }}
            style={styles.viewAllBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'সব বান্ডেল দেখুন' : 'View all bundles'}
          >
            <Text style={[typography.caption, { color: colors.primary }]}>
              {isBangla ? 'সব দেখুন →' : 'See all →'}
            </Text>
          </SpringPressable>
        )}
      </View>

      <FlatList
        ref={flatRef}
        data={bundles}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        renderItem={({ item }) => {
          const title = isBangla ? item.titleBn : item.title;

          return (
            <SpringPressable
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
              activeScale={0.96}
              haptic="selection"
              onPress={() => {
                triggerHaptic('light');
                onSelectBundle(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${title}, Price ${item.currency}${item.price}`}
            >
              {/* Poster Image */}
              <View style={styles.posterContainer}>
                <Image
                  source={getSafeImageSource(item.posterUrl)}
                  style={styles.posterImage}
                  resizeMode="cover"
                  {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
                />
                {/* Discount Badge */}
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>-{item.discountPercent}%</Text>
                </View>
                {/* Course Count Tag */}
                <View style={styles.courseCountTag}>
                  <Ionicons name="layers-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.courseCountText}>
                    {item.coursesCount} {isBangla ? 'কোর্স অন্তর্ভুক্ত' : 'Courses Track'}
                  </Text>
                </View>
              </View>

              {/* Details Content */}
              <View style={styles.contentWrap}>
                <View style={styles.ratingRow}>
                  <View style={styles.starsContainer}>
                    <Ionicons name="star" size={13} color="#FFB606" />
                    <Text style={styles.ratingNumber}>{item.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={[styles.enrolledText, { color: colors.textMuted }]}>
                    • {item.enrolledCount}+ {isBangla ? 'শিক্ষার্থী' : 'Learners'}
                  </Text>
                </View>

                <Text
                  style={[typography.bodyMedium, styles.bundleTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {title}
                </Text>

                <View style={styles.pricingRow}>
                  <View style={styles.priceColumn}>
                    <Text style={[styles.currentPrice, { color: colors.text }]}>
                      {item.currency}{item.price.toLocaleString()}
                    </Text>
                    {item.regularPrice > item.price && (
                      <Text style={[styles.regularPrice, { color: colors.textMuted }]}>
                        {item.currency}{item.regularPrice.toLocaleString()}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.ctaPill,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.ctaPillText, { color: colors.onPrimary }]}>
                      {isBangla ? 'কোর্সসমূহ দেখুন' : 'Explore'}
                    </Text>
                    <Ionicons name="chevron-forward" size={12} color={colors.onPrimary} />
                  </View>
                </View>
              </View>
            </SpringPressable>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    gap: 4,
    marginRight: 8,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  superDealBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: shape.full,
  },
  superDealText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: shape.large,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#102F53',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 8px rgba(16, 47, 83, 0.08)',
      },
    }),
  },
  posterContainer: {
    width: '100%',
    height: 135,
    backgroundColor: '#0A1C33',
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E34234',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: shape.full,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  courseCountTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(16, 47, 83, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: shape.full,
  },
  courseCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contentWrap: {
    padding: 12,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFB606',
  },
  enrolledText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bundleTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceColumn: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  regularPrice: {
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: shape.full,
  },
  ctaPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
