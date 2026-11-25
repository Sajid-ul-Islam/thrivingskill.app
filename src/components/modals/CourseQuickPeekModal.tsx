import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Course } from '../../types';
import { getSafeImageSource, getInstructorAvatarSource } from '../../utils/imageUtils';
import { SpringPressable } from '../common/SpringPressable';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

export interface CourseQuickPeekModalProps {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onNavigateToCourse: (courseId: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (courseId: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CourseQuickPeekModal: React.FC<CourseQuickPeekModalProps> = ({
  visible,
  course,
  onClose,
  onNavigateToCourse,
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  if (!course) return null;

  const fallbackIcon = require('../../../assets/icon.png');
  const safeSource = getSafeImageSource(course.thumbnail, fallbackIcon);
  const imageSource =
    typeof safeSource === 'object' && safeSource !== null && 'uri' in safeSource
      ? { ...safeSource, cache: 'force-cache' as const }
      : safeSource;

  const bdtPrice = course.priceBdt || (course.price > 0 ? Math.round(course.price * 120) : 0);
  const origBdtPrice =
    course.originalPriceBdt ||
    (course.originalPrice && course.originalPrice > course.price
      ? Math.round(course.originalPrice * 120)
      : 0);
  const isFree =
    (!course.price || course.price === 0) && (!course.priceBdt || course.priceBdt === 0);

  const handleEnrollPress = () => {
    triggerHaptic('medium');
    onClose();
    onNavigateToCourse(course.id);
  };

  const handleBookmarkPress = () => {
    triggerHaptic('selection');
    onToggleBookmark?.(course.id);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'প্রিভিউ বন্ধ করুন' : 'Close preview'}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E2E8F0',
            },
          ]}
          accessibilityRole="dialog"
          accessibilityLabel={`${course.title} quick preview`}
        >
          {/* Top Grab Handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* 4:3 Course Media Banner */}
            <View style={[styles.mediaWrapper, { backgroundColor: colors.surfaceSubtle }]}>
              <Image
                source={imageSource}
                style={styles.mediaImage}
                fadeDuration={150}
                {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
              />

              {/* Badges on Banner */}
              <View style={styles.mediaBadgeRow}>
                {course.badge && (
                  <View style={[styles.badgeTag, { backgroundColor: colors.badgeBackground }]}>
                    <Text style={[styles.badgeText, { color: colors.badgeText }]}>
                      {course.badge}
                    </Text>
                  </View>
                )}
                <View style={[styles.levelTag, { backgroundColor: 'rgba(15, 23, 42, 0.82)' }]}>
                  <Text style={styles.levelText}>{course.level || 'All Levels'}</Text>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={isBangla ? 'বন্ধ করুন' : 'Close'}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Course Information Header */}
            <View style={styles.infoSection}>
              {course.category && (
                <View style={[styles.categoryPill, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.categoryText, { color: colors.primary }]}>
                    {course.category.toUpperCase()}
                  </Text>
                </View>
              )}

              <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text>

              {/* Instructor Row */}
              <View style={styles.instructorRow}>
                <Image
                  source={getInstructorAvatarSource(
                    course.instructor?.name,
                    course.instructor?.avatar
                  )}
                  style={[styles.instructorAvatar, { borderWidth: 1, borderColor: colors.border }]}
                  {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
                />
                <View style={styles.instructorTextCol}>
                  <View style={styles.instructorNameRow}>
                    <Text style={[styles.instructorName, { color: colors.text }]} numberOfLines={1}>
                      {course.instructor?.name || 'Thriving Skills Bangladesh'}
                    </Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#059669"
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                  <Text style={[styles.instructorRole, { color: colors.textMuted }]}>
                    {isBangla ? 'প্রশিক্ষক ও বিশেষজ্ঞ' : 'Lead Instructor & Industry Mentor'}
                  </Text>
                </View>
              </View>

              {/* Key Metrics Quick Deck */}
              <View
                style={[
                  styles.metricsGrid,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
              >
                {typeof course.rating === 'number' && course.rating > 0 && (
                  <>
                    <View style={styles.metricItem}>
                      <Ionicons name="star" size={16} color="#FFB606" />
                      <Text style={[styles.metricVal, { color: colors.text }]}>
                        {course.rating.toFixed(1)}
                      </Text>
                      {typeof course.reviewsCount === 'number' && course.reviewsCount > 0 ? (
                        <Text style={[styles.metricLbl, { color: colors.textMuted }]}>
                          {course.reviewsCount} {isBangla ? 'রিভিউ' : 'Ratings'}
                        </Text>
                      ) : (
                        <Text style={[styles.metricLbl, { color: colors.textMuted }]}>
                          {isBangla ? 'রেটিং' : 'Rating'}
                        </Text>
                      )}
                    </View>

                    <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                  </>
                )}

                <View style={styles.metricItem}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={[styles.metricVal, { color: colors.text }]}>
                    {course.durationHours ? `${course.durationHours}h` : '3.5h'}
                  </Text>
                  <Text style={[styles.metricLbl, { color: colors.textMuted }]}>
                    {isBangla ? 'সময়কাল' : 'Duration'}
                  </Text>
                </View>

                <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

                <View style={styles.metricItem}>
                  <Ionicons name="book-outline" size={16} color="#059669" />
                  <Text style={[styles.metricVal, { color: colors.text }]}>
                    {course.lecturesCount || 8}
                  </Text>
                  <Text style={[styles.metricLbl, { color: colors.textMuted }]}>
                    {isBangla ? 'পাঠ' : 'Lectures'}
                  </Text>
                </View>

                <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

                <View style={styles.metricItem}>
                  <Ionicons name="ribbon-outline" size={16} color="#E34234" />
                  <Text style={[styles.metricVal, { color: colors.text }]}>
                    {isBangla ? 'সার্টিফিকেট' : 'Cert.'}
                  </Text>
                  <Text style={[styles.metricLbl, { color: colors.textMuted }]}>
                    {isBangla ? 'যাচাইকৃত' : 'Verified'}
                  </Text>
                </View>
              </View>

              {/* Price & Offer Summary */}
              <View style={styles.priceRow}>
                <View style={styles.priceInfoCol}>
                  <Text style={[styles.priceLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'কোর্স ফি:' : 'Course Fee:'}
                  </Text>
                  <View style={styles.priceDigitsRow}>
                    {isFree ? (
                      <Text style={styles.freeText}>{isBangla ? 'সম্পূর্ণ ফ্রি' : '100% FREE'}</Text>
                    ) : (
                      <>
                        <Text style={[styles.currentPrice, { color: colors.primary }]}>
                          ৳{bdtPrice.toLocaleString()}
                        </Text>
                        {origBdtPrice > bdtPrice && (
                          <Text style={[styles.origPrice, { color: colors.textMuted }]}>
                            ৳{origBdtPrice.toLocaleString()}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </View>

                {origBdtPrice > bdtPrice && !isFree && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>
                      {Math.round(((origBdtPrice - bdtPrice) / origBdtPrice) * 100)}% OFF
                    </Text>
                  </View>
                )}
              </View>

              {/* Highlights & Objectives */}
              <View style={styles.highlightsBox}>
                <Text style={[styles.highlightsHeading, { color: colors.text }]}>
                  {isBangla ? 'কোর্সের মূল বিষয়বস্তু:' : 'What You Will Master:'}
                </Text>
                <View style={styles.bulletRow}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={18}
                    color="#059669"
                    style={{ marginTop: 1 }}
                  />
                  <Text style={[styles.bulletText, { color: colors.textMuted }]}>
                    {course.subtitle ||
                      (isBangla
                        ? 'প্র্যাকটিক্যাল কেস স্টাডি ও বাস্তব প্রজেক্টভিত্তিক অভিজ্ঞতা'
                        : 'Hands-on practical workflows with real-world industry case studies')}
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={18}
                    color="#059669"
                    style={{ marginTop: 1 }}
                  />
                  <Text style={[styles.bulletText, { color: colors.textMuted }]}>
                    {isBangla
                      ? 'আজীবন অ্যাক্সেস, মোবাইল ফ্রেন্ডলি প্লেয়ার ও অফলাইন রিভিশন'
                      : 'Lifetime curriculum access with mobile background audio & HD streaming'}
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={18}
                    color="#059669"
                    style={{ marginTop: 1 }}
                  />
                  <Text style={[styles.bulletText, { color: colors.textMuted }]}>
                    {isBangla
                      ? 'কোর্স শেষে ভেরিফায়েড শেয়ারযোগ্য ডিজিটাল সার্টিফিকেট'
                      : 'Official Thriving Skills verified certificate upon lesson completion'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Bottom Dock */}
          <View
            style={[
              styles.footerDock,
              {
                backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                borderTopColor: colors.border,
              },
            ]}
          >
            {onToggleBookmark && (
              <SpringPressable
                onPress={handleBookmarkPress}
                style={[
                  styles.bookmarkActionBtn,
                  {
                    backgroundColor: isBookmarked
                      ? `${colors.primary}18`
                      : isDark
                        ? colors.surfaceSubtle
                        : '#F1F5F9',
                    borderColor: isBookmarked ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={isBookmarked ? 'Remove saved course' : 'Save course bookmark'}
              >
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isBookmarked ? colors.primary : colors.text}
                />
              </SpringPressable>
            )}

            <SpringPressable
              onPress={handleEnrollPress}
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              activeScale={0.97}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'কোর্সটি দেখুন' : 'View full course'}
            >
              <Text style={[styles.primaryActionText, { color: colors.onPrimary }]}>
                {isBangla ? 'সম্পূর্ণ কোর্স দেখুন ও শুরু করুন' : 'View Course & Enroll'}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.onPrimary}
                style={{ marginLeft: 8 }}
              />
            </SpringPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mediaWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaBadgeRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  levelTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  infoSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 25,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  instructorInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  instructorTextCol: {
    flex: 1,
  },
  instructorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  instructorRole: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  metricLbl: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  priceDigitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: '900',
  },
  origPrice: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  freeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  saveBadge: {
    backgroundColor: 'rgba(227, 66, 52, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(227, 66, 52, 0.25)',
  },
  saveBadgeText: {
    color: '#E34234',
    fontSize: 12,
    fontWeight: '800',
  },
  highlightsBox: {
    borderRadius: 14,
    paddingVertical: 6,
  },
  highlightsHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  footerDock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    gap: 12,
  },
  bookmarkActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    minHeight: MIN_TOUCH_TARGET,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
