import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { Review } from '../../types';
import { getSafeImageSource } from '../../utils/imageUtils';

interface CourseReviewsSectionProps {
  reviews: Review[];
  isEnrolled: boolean;
  onOpenWriteReview: () => void;
}

const ReviewAvatar: React.FC<{
  uri?: string;
  name?: string;
  primaryColor: string;
}> = ({ uri, name, primaryColor }) => {
  const [error, setError] = React.useState(false);
  const initial = (name || 'L').charAt(0).toUpperCase();

  React.useEffect(() => {
    setError(false);
  }, [uri]);

  if (!uri || error) {
    return (
      <View
        style={[
          styles.reviewAvatar,
          styles.avatarInitialsCircle,
          { backgroundColor: primaryColor },
        ]}
      >
        <Text style={styles.avatarInitialsText}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={getSafeImageSource(uri)}
      style={styles.reviewAvatar}
      onError={() => setError(true)}
      {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
    />
  );
};

export const CourseReviewsSection: React.FC<CourseReviewsSectionProps> = ({
  reviews,
  isEnrolled,
  onOpenWriteReview,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  const handleWriteReviewPress = () => {
    if (!isEnrolled) {
      triggerHaptic('error');
      Alert.alert(
        isBangla ? 'এনরোলমেন্ট আবশ্যক' : 'Enrolled Learners Only',
        isBangla
          ? 'শুধুমাত্র এই কোর্সে সক্রিয়ভাবে এনরোল করা শিক্ষার্থীরা রিভিউ ও রেটিং প্রদান করতে পারবেন।'
          : 'Only learners enrolled in this course can rate and review it. Please enroll to share your feedback.'
      );
      return;
    }
    triggerHaptic('light');
    onOpenWriteReview();
  };

  return (
    <View style={styles.reviewsTab}>
      {/* Write a Review Button (Gated to Enrolled Learners only per CR-6) */}
      <TouchableOpacity
        style={[
          styles.writeReviewCTA,
          {
            backgroundColor: isEnrolled
              ? colors.primaryLight
              : isDark
                ? colors.surfaceSubtle
                : '#F1F5F9',
            borderColor: isEnrolled ? colors.primary : colors.border,
          },
        ]}
        onPress={handleWriteReviewPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={
          isEnrolled
            ? isBangla
              ? 'কোর্সের রিভিউ ও রেটিং দিন'
              : 'Rate & Write a Review'
            : isBangla
              ? 'রিভিউ দিতে কোর্সে এনরোল করুন'
              : 'Enroll to Leave a Review'
        }
      >
        <Ionicons
          name={isEnrolled ? 'star' : 'lock-closed'}
          size={16}
          color={isEnrolled ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.writeReviewCTAText,
            { color: isEnrolled ? colors.primary : colors.textMuted },
          ]}
        >
          {isEnrolled
            ? isBangla
              ? 'আপনার মূল্যবান রিভিউ ও রেটিং দিন ★'
              : 'Rate & Write a Review ★'
            : isBangla
              ? 'রিভিউ দিতে কোর্সে এনরোল করুন (লকড)'
              : 'Enroll in Course to Leave a Review (Locked)'}
        </Text>
      </TouchableOpacity>

      {reviews.length === 0 ? (
        <Text style={[styles.noReviews, { color: colors.textMuted }]}>
          {isBangla ? 'এখনও কোনো রিভিউ যুক্ত হয়নি।' : 'No reviews yet for this cohort.'}
        </Text>
      ) : (
        reviews.map((rev) => (
          <View
            key={rev.id}
            style={[
              styles.reviewCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.reviewTop}>
              <ReviewAvatar
                uri={rev.userAvatar}
                name={rev.userName}
                primaryColor={colors.primary}
              />
              <View style={styles.reviewMeta}>
                <Text
                  style={[styles.reviewUser, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {rev.userName}
                </Text>
                {rev.userRole ? (
                  <Text
                    style={[styles.reviewRole, { color: colors.textMuted }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {rev.userRole}
                  </Text>
                ) : null}
              </View>
              <View style={styles.ratingStars}>
                <Ionicons name="star" size={14} color={colors.starColor} />
                <Text style={[styles.ratingValText, { color: colors.text }]}>{rev.rating}</Text>
              </View>
            </View>
            <Text
              style={[styles.reviewComment, { color: colors.text, lineHeight: isBangla ? 22 : 19 }]}
            >
              {rev.comment}
            </Text>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  reviewsTab: {
    paddingTop: 8,
  },
  writeReviewCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  writeReviewCTAText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noReviews: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 13,
  },
  reviewCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarInitialsCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  reviewMeta: {
    flex: 1,
    minWidth: 0,
  },
  reviewUser: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  reviewRole: {
    fontSize: 11,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
  },
});
