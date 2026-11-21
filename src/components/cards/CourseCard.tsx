import { SpringPressable } from '../common';
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Course } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLearning } from '../../context/LearningContext';
import { useFeedback } from '../../context/FeedbackContext';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
  horizontal?: boolean;
  isBookmarked?: boolean;
  isEnrolled?: boolean;
  progressPercent?: number;
}

const CourseCardComponent: React.FC<CourseCardProps> = ({
  course,
  onPress,
  horizontal = false,
  isBookmarked: propIsBookmarked,
  isEnrolled: propIsEnrolled,
  progressPercent: propProgressPercent,
}) => {
  const { colors } = useTheme();
  const { isBangla } = useLanguage();
  const { isBookmarked: contextIsBookmarked, toggleBookmark, getCourseProgressPercentage, userProgress } = useLearning();
  const { showToast } = useFeedback();

  const [thumbError, setThumbError] = React.useState(false);

  const bookmarked = propIsBookmarked !== undefined ? propIsBookmarked : contextIsBookmarked(course.id);
  const isEnrolled = propIsEnrolled !== undefined ? propIsEnrolled : !!userProgress[course.id];
  const progressPercent = propProgressPercent !== undefined ? propProgressPercent : getCourseProgressPercentage(course.id);

  const handleToggleBookmark = () => {
    const wasBookmarked = bookmarked;
    toggleBookmark(course.id);
    showToast({
      message: wasBookmarked
        ? (isBangla ? `"${course.title}" সংরক্ষিত তালিকা থেকে মুছে ফেলা হয়েছে` : `Removed "${course.title}" from Saved`)
        : (isBangla ? `"${course.title}" আমার লার্নিং-এ সংরক্ষিত হয়েছে` : `Saved "${course.title}" to My Learning`),
      type: wasBookmarked ? 'info' : 'success',
      actionLabel: wasBookmarked ? (isBangla ? 'বাতিল' : 'Undo') : undefined,
      onAction: wasBookmarked ? () => toggleBookmark(course.id) : undefined,
    });
  };

  const bdtPrice = course.priceBdt || (course.price > 0 ? Math.round(course.price * 120) : 0);
  const origBdtPrice = course.originalPriceBdt || (course.originalPrice && course.originalPrice > course.price ? Math.round(course.originalPrice * 120) : 0);
  const isFreeCourse = (!course.price || course.price === 0) && (!course.priceBdt || course.priceBdt === 0);

  if (horizontal) {
    return (
      <View
        style={[
          styles.horizontalCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.border,
            shadowColor: colors.cardShadow,
          },
        ]}
      >
        <SpringPressable
          style={styles.horizontalCardBody}
          onPress={onPress}
          activeScale={0.97}
          accessibilityRole="button"
          accessibilityLabel={`${course.title} by ${course.instructor?.name || "Thriving Skills"}`}
        >
          <View style={[styles.horizontalThumbWrapper, { backgroundColor: colors.surfaceSubtle }]}>
            <Image
              source={thumbError || !course.thumbnail ? require('../../../assets/icon.png') : { uri: course.thumbnail, cache: 'force-cache' }}
              style={styles.horizontalThumb}
              fadeDuration={150}
              onError={() => setThumbError(true)}
            />
            {course.badge && (
              <View style={[styles.horizontalBadgeTag, { backgroundColor: colors.badgeBackground }]}>
                <Text
                  style={[styles.horizontalBadgeText, { color: colors.badgeText }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {course.badge}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.horizontalContent}>
            <Text
              style={[styles.cardTitle, { color: colors.text, lineHeight: isBangla ? 23 : 21 }]}
              numberOfLines={2}
            >
              {course.title}
            </Text>
            <Text style={[styles.instructorName, { color: colors.textMuted }]} numberOfLines={1}>
              {course.instructor?.name || 'Thriving Skills Instructor'}
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
              <Text style={[styles.durationText, { color: colors.textMuted }]} numberOfLines={1}>
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
                {origBdtPrice > bdtPrice && (
                  <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                    ৳ {origBdtPrice.toLocaleString()}
                  </Text>
                )}
                <Text style={[styles.currentPrice, { color: colors.primary }]}>
                  {isFreeCourse ? (isBangla ? 'বিনামূল্যে' : 'Free') : `৳ ${bdtPrice.toLocaleString()}`}
                </Text>
              </View>
            )}
          </View>
        </SpringPressable>

        <SpringPressable
          style={[styles.bookmarkBtn, { backgroundColor: colors.surfaceSubtle }]}
          onPress={handleToggleBookmark}
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
        </SpringPressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      <SpringPressable
        onPress={onPress}
        activeScale={0.97}
        accessibilityRole="button"
        accessibilityLabel={`${course.title} by ${course.instructor?.name || "Thriving Skills"}`}
      >
        <View style={[styles.thumbWrapper, { backgroundColor: colors.surfaceSubtle }]}>
          <Image
            source={thumbError || !course.thumbnail ? require('../../../assets/icon.png') : { uri: course.thumbnail, cache: 'force-cache' }}
            style={styles.thumbnail}
            fadeDuration={150}
            onError={() => setThumbError(true)}
          />
          {course.badge && (
            <View style={[styles.badgeTag, { backgroundColor: colors.badgeBackground }]}>
              <Text
                style={[styles.badgeText, { color: colors.badgeText }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {course.badge}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.categoryTag, { color: colors.secondary }]}>
            {course.level.toUpperCase()}
          </Text>
          <Text
            style={[styles.cardTitle, { color: colors.text, lineHeight: isBangla ? 23 : 21 }]}
            numberOfLines={2}
          >
            {course.title}
          </Text>
          <Text style={[styles.instructorName, { color: colors.textMuted }]} numberOfLines={1}>
            {course.instructor?.name || 'Thriving Skills Instructor'}{course.instructor?.company ? ` • ${course.instructor.company}` : ''}
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
            <Text style={[styles.durationText, { color: colors.textMuted }]} numberOfLines={1}>
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
                {origBdtPrice > bdtPrice && (
                  <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                    ৳ {origBdtPrice.toLocaleString()}
                  </Text>
                )}
                <Text style={[styles.currentPrice, { color: colors.primary }]}>
                  {isFreeCourse ? (isBangla ? 'বিনামূল্যে' : 'Free') : `৳ ${bdtPrice.toLocaleString()}`}
                </Text>
              </View>
              <View style={[styles.certBadge, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="ribbon-outline" size={13} color={colors.primary} />
                <Text style={[styles.certText, { color: colors.textMuted }]} numberOfLines={1}>
                  {isBangla ? 'সনদ' : 'Certificate'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </SpringPressable>

      <SpringPressable
        style={[styles.floatingBookmark, { backgroundColor: 'rgba(0,0,0,0.72)' }]}
        onPress={handleToggleBookmark}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={bookmarked ? "Remove bookmark" : "Save course bookmark"}
      >
        <Ionicons
          name={bookmarked ? 'bookmark' : 'bookmark-outline'}
          size={16}
          color={bookmarked ? '#FFB606' : '#FFFFFF'}
        />
      </SpringPressable>
    </View>
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
  thumbWrapper: {
    position: 'relative',
    height: 160,
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
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
    zIndex: 8,
    maxWidth: '68%',
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
    zIndex: 10,
    elevation: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
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
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  instructorName: {
    fontSize: 12,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 4,
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
    fontVariant: ['tabular-nums'],
  },
  reviewsCount: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  dotSeparator: {
    marginHorizontal: 6,
  },
  durationText: {
    fontSize: 12,
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    flex: 1,
    minWidth: 80,
    gap: 6,
  },
  currentPrice: {
    fontSize: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
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
    lineHeight: 12,
    includeFontPadding: false,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
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
    fontVariant: ['tabular-nums'],
  },
  continueText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Horizontal Card
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  horizontalCardBody: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
  },
  horizontalThumbWrapper: {
    position: 'relative',
    width: 104,
    height: 92,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  horizontalThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  horizontalBadgeTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 8,
    maxWidth: 88,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  horizontalBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  horizontalContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    paddingRight: 32, // Ensures title & text never collide with bookmark button
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    elevation: 3,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const CourseCard = React.memo<CourseCardProps>(CourseCardComponent, (prev, next) => {
  return (
    prev.course.id === next.course.id &&
    prev.horizontal === next.horizontal &&
    prev.isBookmarked === next.isBookmarked &&
    prev.isEnrolled === next.isEnrolled &&
    prev.progressPercent === next.progressPercent &&
    prev.course.title === next.course.title &&
    prev.course.priceBdt === next.course.priceBdt &&
    prev.course.rating === next.course.rating &&
    prev.course.enrolledCount === next.course.enrolledCount &&
    prev.course.thumbnail === next.course.thumbnail
  );
});
