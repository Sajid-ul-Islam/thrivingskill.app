import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  horizontal?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress, horizontal = false }) => {
  const { colors } = useTheme();
  const { isBookmarked, toggleBookmark, getCourseProgressPercentage, userProgress } = useLearning();

  const bookmarked = isBookmarked(course.id);
  const isEnrolled = !!userProgress[course.id];
  const progressPercent = getCourseProgressPercentage(course.id);

  const displayPrice = course.priceBdt ? `৳${course.priceBdt.toLocaleString()}` : `$${course.price.toFixed(2)}`;
  const displayOrigPrice = course.originalPriceBdt ? `৳${course.originalPriceBdt.toLocaleString()}` : `$${course.originalPrice.toFixed(2)}`;

  const discountPercent =
    course.originalPriceBdt && course.priceBdt && course.originalPriceBdt > course.priceBdt
      ? Math.round(((course.originalPriceBdt - course.priceBdt) / course.originalPriceBdt) * 100)
      : course.originalPrice && course.price && course.originalPrice > course.price
      ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
      : 0;

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[
          styles.horizontalCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.border,
            shadowColor: colors.cardShadow,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${course.title} by ${course.instructor.name}`}
      >
        <Image source={{ uri: course.thumbnail }} style={styles.horizontalThumb} />
        {course.badge && (
          <View style={[styles.badgeTag, { backgroundColor: colors.badgeBackground }]}>
            <Text style={[styles.badgeText, { color: colors.badgeText }]}>{course.badge}</Text>
          </View>
        )}
        <View style={styles.horizontalContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {course.title}
          </Text>
          <Text style={[styles.instructorName, { color: colors.textMuted }]} numberOfLines={1}>
            {course.instructor.name}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color={colors.starColor} />
              <Text style={[styles.ratingNumber, { color: colors.text }]}>{course.rating}</Text>
              <Text style={[styles.reviewsCount, { color: colors.textMuted }]}>
                ({course.reviewsCount})
              </Text>
            </View>
            <Text style={[styles.dotSeparator, { color: colors.textMuted }]}>•</Text>
            <Text style={[styles.durationText, { color: colors.textMuted }]}>
              {course.durationHours}h • {course.level}
            </Text>
          </View>

          {isEnrolled ? (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSubtle }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: colors.primary, width: `${progressPercent}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressLabel, { color: colors.primary }]}>
                {progressPercent}% Complete
              </Text>
            </View>
          ) : (
            <View style={styles.priceRow}>
              <Text style={[styles.currentPrice, { color: colors.primary }]}>
                {displayPrice}
              </Text>
              <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                {displayOrigPrice}
              </Text>
              {discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.bookmarkBtn, { backgroundColor: colors.surfaceSubtle }]}
          onPress={() => toggleBookmark(course.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={bookmarked ? "Remove bookmark" : "Save course bookmark"}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={bookmarked ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

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
      accessibilityRole="button"
      accessibilityLabel={`${course.title} by ${course.instructor.name}`}
    >
      <View style={styles.thumbWrapper}>
        <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
        {course.badge && (
          <View style={[styles.badgeTag, { backgroundColor: colors.badgeBackground }]}>
            <Text style={[styles.badgeText, { color: colors.badgeText }]}>{course.badge}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.floatingBookmark, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
          onPress={() => toggleBookmark(course.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={bookmarked ? "Remove bookmark" : "Save course bookmark"}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={bookmarked ? colors.primary : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.categoryTag, { color: colors.secondary }]}>
          {course.level.toUpperCase()}
        </Text>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={[styles.instructorName, { color: colors.textMuted }]} numberOfLines={1}>
          {course.instructor.name} • {course.instructor.company}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color={colors.starColor} />
            <Text style={[styles.ratingNumber, { color: colors.text }]}>{course.rating}</Text>
            <Text style={[styles.reviewsCount, { color: colors.textMuted }]}>
              ({course.reviewsCount})
            </Text>
          </View>
          <Text style={[styles.dotSeparator, { color: colors.textMuted }]}>•</Text>
          <Text style={[styles.durationText, { color: colors.textMuted }]}>
            {course.durationHours}h ({course.lecturesCount} lectures)
          </Text>
        </View>

        {isEnrolled ? (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSubtle }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: colors.primary, width: `${progressPercent}%` },
                ]}
              />
            </View>
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: colors.primary }]}>
                {progressPercent}% Complete
              </Text>
              <Text style={[styles.continueText, { color: colors.primary }]}>Resume →</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cardFooter}>
            <View style={styles.priceRow}>
              <Text style={[styles.currentPrice, { color: colors.primary }]}>
                {displayPrice}
              </Text>
              <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                {displayOrigPrice}
              </Text>
              {discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
                </View>
              )}
            </View>
            <View style={[styles.certBadge, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="ribbon-outline" size={13} color={colors.primary} />
              <Text style={[styles.certText, { color: colors.textMuted }]}>Certificate</Text>
            </View>
          </View>
        )}
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  thumbWrapper: {
    position: 'relative',
    height: 160,
    width: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  floatingBookmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 14,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  instructorName: {
    fontSize: 12,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewsCount: {
    fontSize: 12,
  },
  dotSeparator: {
    marginHorizontal: 6,
  },
  durationText: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentPrice: {
    fontSize: 17,
    fontWeight: '900',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#E34234',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'center',
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  certText: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  continueText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Horizontal Card
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    padding: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  horizontalThumb: {
    width: 100,
    height: 90,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  horizontalContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
