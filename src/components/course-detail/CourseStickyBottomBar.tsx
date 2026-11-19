import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SpringPressable } from '../common/SpringPressable';
import { CircularProgressRing } from '../common/CircularProgressRing';
import { Course } from '../../types';

interface CourseStickyBottomBarProps {
  course: Course;
  isEnrolled: boolean;
  isAdmin: boolean;
  progressPercent: number;
  isCompleted: boolean;
  insetsBottom: number;
  onEnrollOrResume: () => void;
}

export const CourseStickyBottomBar: React.FC<CourseStickyBottomBarProps> = ({
  course,
  isEnrolled,
  isAdmin,
  progressPercent,
  isCompleted,
  insetsBottom,
  onEnrollOrResume,
}) => {
  const { colors } = useTheme();
  const { isBangla } = useLanguage();

  const isPaidCourse = Boolean((course.priceBdt && course.priceBdt > 0) || (course.price && course.price > 0));
  const bdtPrice = course.priceBdt || (course.price > 0 ? Math.round(course.price * 120) : 0);
  const origBdtPrice =
    course.originalPriceBdt ||
    (course.originalPrice && course.originalPrice > course.price ? Math.round(course.originalPrice * 120) : 0);

  return (
    <View
      style={[
        styles.bottomEnrollBar,
        {
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.border,
          shadowColor: colors.cardShadow,
          paddingBottom: Math.max(insetsBottom, 12),
        },
      ]}
    >
      <View style={styles.bottomEnrollBarInner}>
        {isAdmin ? (
          <View style={styles.bottomPriceCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="shield-checkmark" size={14} color="#D97706" />
              <Text style={[styles.bottomPriceLabel, { color: '#D97706', fontWeight: '800' }]}>
                {isBangla ? 'অ্যাডমিন অ্যাক্সেস' : 'ADMIN ACCESS'}
              </Text>
            </View>
            <Text style={[styles.enrolledStatus, { color: colors.textMuted }]}>
              {isBangla ? 'সকল লেকচার আনলক করা হয়েছে' : 'All course videos unlocked'}
            </Text>
          </View>
        ) : !isEnrolled ? (
          <View style={styles.bottomPriceCol}>
            <View style={styles.priceRow}>
              {origBdtPrice > bdtPrice && (
                <Text style={[styles.bottomOriginalPrice, { color: colors.textMuted }]}>
                  ৳ {origBdtPrice.toLocaleString()}
                </Text>
              )}
              <Text style={[styles.bottomPrice, { color: colors.primary }]} numberOfLines={1}>
                {isPaidCourse
                  ? `৳ ${bdtPrice.toLocaleString()}`
                  : isBangla
                  ? 'বিনামূল্যে'
                  : 'Free Course'}
              </Text>
            </View>
            <Text
              style={[styles.bottomPriceLabel, { color: colors.textMuted }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {isBangla ? 'লাইফটাইম অ্যাক্সেস • সার্টিফিকেট' : 'Lifetime Access • Certificate'}
            </Text>
          </View>
        ) : (
          <View style={styles.bottomPriceCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CircularProgressRing
                progress={progressPercent}
                size={34}
                strokeWidth={3.5}
                progressColor={colors.primary}
                trackColor={colors.surfaceSubtle}
                textSize={9}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.bottomPriceLabel, { color: colors.primary, fontWeight: '700' }]}
                  numberOfLines={1}
                >
                  {isBangla ? `এনরোল্ড (${progressPercent}%)` : `Enrolled (${progressPercent}%)`}
                </Text>
                <Text style={[styles.enrolledStatus, { color: colors.textMuted }]}>
                  {isCompleted
                    ? isBangla
                      ? 'সম্পন্ন 🎓'
                      : 'Completed 🎓'
                    : isBangla
                    ? 'চলমান ⏳'
                    : 'In Progress ⏳'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <SpringPressable
          activeScale={0.96}
          style={[
            styles.enrollCTAButton,
            {
              backgroundColor: isAdmin
                ? '#102F53'
                : isEnrolled
                ? colors.primary
                : isPaidCourse
                ? colors.accent
                : colors.primary,
            },
          ]}
          onPress={onEnrollOrResume}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={
            isEnrolled
              ? isBangla
                ? 'লেসনে যান'
                : 'Resume Course'
              : isPaidCourse
              ? isBangla
                ? 'এখনই ভর্তি হন'
                : 'Enroll Now'
              : isBangla
              ? 'বিনামূল্যে ভর্তি হন'
              : 'Enroll for Free'}
        >
          <Ionicons
            name={isAdmin ? 'play-circle' : isEnrolled ? 'play' : isPaidCourse ? 'card-outline' : 'flash'}
            size={18}
            color={isAdmin ? '#FFFFFF' : !isEnrolled && isPaidCourse ? colors.onAccent : colors.onPrimary}
          />
          <Text
            style={[
              styles.enrollCTAText,
              {
                color: isAdmin ? '#FFFFFF' : !isEnrolled && isPaidCourse ? colors.onAccent : colors.onPrimary,
                fontWeight: !isEnrolled && isPaidCourse ? '800' : '700',
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isAdmin
              ? isBangla
                ? 'কোর্স ভিডিও দেখুন'
                : 'Play Course (Admin)'
              : isEnrolled
              ? isBangla
                ? 'লেসনে যান'
                : 'Resume Course'
              : isPaidCourse
              ? isBangla
                ? 'এখনই ভর্তি হন'
                : 'Enroll Now'
              : isBangla
              ? 'বিনামূল্যে ভর্তি হন'
              : 'Enroll for Free'}
          </Text>
        </SpringPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomEnrollBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    elevation: 8,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  bottomEnrollBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bottomPriceCol: {
    flex: 1,
    minWidth: 0,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bottomOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  bottomPrice: {
    fontSize: 19,
    fontWeight: '800',
  },
  bottomPriceLabel: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  enrolledStatus: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  enrollCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
    maxWidth: '56%',
    flexShrink: 1,
  },
  enrollCTAText: {
    fontSize: 13.5,
  },
});
