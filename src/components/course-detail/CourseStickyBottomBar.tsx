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

  const isPaidCourse = Boolean(
    (course.priceBdt && course.priceBdt > 0) || (course.price && course.price > 0)
  );
  const bdtPrice = course.priceBdt || (course.price > 0 ? Math.round(course.price * 120) : 0);
  const origBdtPrice =
    course.originalPriceBdt ||
    (course.originalPrice && course.originalPrice > course.price
      ? Math.round(course.originalPrice * 120)
      : 0);

  const discountPercent =
    origBdtPrice > bdtPrice && origBdtPrice > 0
      ? Math.round(((origBdtPrice - bdtPrice) / origBdtPrice) * 100)
      : course.originalPrice > course.price && course.originalPrice > 0
        ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
        : 0;

  return (
    <View
      style={[
        styles.bottomEnrollBar,
        {
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.border,
          shadowColor: colors.cardShadow,
          paddingBottom: Math.max(insetsBottom, 14),
        },
      ]}
    >
      <View style={styles.bottomEnrollBarInner}>
        {isAdmin ? (
          <View style={styles.bottomPriceCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="shield-checkmark" size={14} color="#E34234" />
              <Text style={[styles.bottomPriceLabel, { color: '#E34234', fontWeight: '800' }]}>
                {isBangla ? 'মাস্টার অ্যাক্সেস' : 'DEV / ADMIN ACCESS'}
              </Text>
            </View>
            <Text style={[styles.enrolledStatus, { color: colors.textMuted }]}>
              {isBangla ? 'সকল লেকচার আনলক করা হয়েছে' : 'All course videos unlocked'}
            </Text>
          </View>
        ) : !isEnrolled ? (
          <View style={styles.bottomPriceCol}>
            <View style={styles.priceRow}>
              <Text style={[styles.bottomPrice, { color: colors.primary }]} numberOfLines={1}>
                {isPaidCourse
                  ? `৳ ${bdtPrice.toLocaleString()}`
                  : isBangla
                    ? 'বিনামূল্যে'
                    : 'Free Course'}
              </Text>
              {origBdtPrice > bdtPrice && (
                <Text style={[styles.bottomOriginalPrice, { color: colors.textMuted }]}>
                  ৳ {origBdtPrice.toLocaleString()}
                </Text>
              )}
              {discountPercent > 0 && (
                <View style={[styles.discountPill, { backgroundColor: '#E34234' }]}>
                  <Text style={styles.discountPillText}>-{discountPercent}% OFF</Text>
                </View>
              )}
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
                    ? '#E34234'
                    : colors.primary,
              shadowColor: !isEnrolled && isPaidCourse ? '#E34234' : colors.primary,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 4,
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
                  : 'Enroll for Free'
          }
        >
          <Ionicons
            name={isAdmin ? 'play-circle' : isEnrolled ? 'play' : 'flash'}
            size={18}
            color="#FFFFFF"
          />
          <Text
            style={[
              styles.enrollCTAText,
              {
                color: '#FFFFFF',
                fontWeight: '800',
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
    paddingTop: 14,
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
  discountPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'center',
  },
  discountPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
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
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    minWidth: 120,
    maxWidth: '56%',
    flexShrink: 0,
  },
  enrollCTAText: {
    fontSize: 13.5,
  },
});
