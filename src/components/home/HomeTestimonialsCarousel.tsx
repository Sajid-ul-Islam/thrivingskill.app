import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { StudentTestimonialItem } from '../../services/api/brandingService';
import { typography } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface HomeTestimonialsCarouselProps {
  testimonials: StudentTestimonialItem[];
}

const CARD_WIDTH = 290;
const CARD_GAP = 14;

export const HomeTestimonialsCarousel: React.FC<HomeTestimonialsCarouselProps> = ({
  testimonials,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const flatRef = useRef<FlatList<StudentTestimonialItem> | null>(null);

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.badgeRow}>
            <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle" size={11} color="#10B981" />
              <Text style={[styles.badgeText, { color: '#059669' }]}>
                {isBangla ? 'ভেরিফায়েড রিভিউ' : 'VERIFIED REVIEWS'}
              </Text>
            </View>
          </View>
          <Text style={[typography.h3, { color: colors.text }]}>
            {isBangla ? 'কেন মানুষ থ্রাইভিং স্কিলস বেছে নেয়' : 'Why People Choose Thriving Skills'}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            {isBangla
              ? 'হাজারো প্রফেশনাল ও শিক্ষার্থীদের ক্যারিয়ার গড়ার গল্প'
              : 'Real impact stories from working professionals across Bangladesh'}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={testimonials}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        renderItem={({ item }) => {
          const role = isBangla && item.roleBn ? item.roleBn : item.role;
          const quote = isBangla && item.quoteBn ? item.quoteBn : item.quote;
          const initials = (item.name || 'Student')
            .split(' ')
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={14} color="#FFB606" />
                  ))}
                </View>
                <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.textMuted} />
              </View>

              <Text
                style={[typography.bodySmall, styles.quoteText, { color: colors.text }]}
                numberOfLines={4}
              >
                "{quote}"
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.authorRow}>
                <View
                  style={[
                    styles.avatarCircle,
                    {
                      backgroundColor: isDark ? 'rgba(16, 47, 83, 0.4)' : '#E8EEF5',
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                    {initials || 'TS'}
                  </Text>
                </View>

                <View style={styles.authorTextWrap}>
                  <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.authorRole, { color: colors.textMuted }]} numberOfLines={1}>
                    {role}
                  </Text>
                  {item.company && (
                    <Text style={[styles.authorCompany, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.company}
                    </Text>
                  )}
                </View>
              </View>
            </View>
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
  },
  titleWrap: {
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: shape.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: shape.large,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    minHeight: 76,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
  },
  authorTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '800',
  },
  authorRole: {
    fontSize: 11,
    fontWeight: '600',
  },
  authorCompany: {
    fontSize: 10,
    fontWeight: '400',
  },
});
