import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLearning } from '../../context/LearningContext';
import { useFeedback } from '../../context/FeedbackContext';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { Course } from '../../types';
import { CoursesService } from '../../services/api/coursesService';

export interface PaymentModalProps {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

/**
 * Companion / Reader-App compliant Member Access & Enrollment Sync modal.
 * Does not show prices, external payment links, payment gateways, or client-side unlocks.
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  course,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, isBangla } = useLanguage();
  const { user, isAuthenticated, setAuthModalVisible } = useAuth();
  const { showToast } = useFeedback();
  const { userProgress, enrollInCourse, refreshCourses, loadCourseDetail } = useLearning();

  const [isSyncing, setIsSyncing] = useState(false);
  const syncStep = isSyncing || (isAuthenticated && userProgress[course?.id || '']) ? 2 : isAuthenticated ? 2 : 1;

  useEffect(() => {
    if (visible) {
      setIsSyncing(false);
    }
  }, [visible, course?.id]);

  // Verify real enrollment against WordPress / LearnPress backend
  const performEnrollmentSync = useCallback(async () => {
    if (!course) return;

    if (!isAuthenticated || !user?.id) {
      onClose();
      setAuthModalVisible(true);
      return;
    }

    if (userProgress[course.id]) {
      onSuccess(course.id);
      onClose();
      return;
    }

    setIsSyncing(true);

    try {
      await refreshCourses();

      let backendVerified = false;
      try {
        const updatedCourse = await loadCourseDetail(course.id);
        if ((updatedCourse as any)?.enrolled || (updatedCourse as any)?.isEnrolled) {
          backendVerified = true;
        }
      } catch {
        // Ignore detail fetch glitch and try enrollment handshake below
      }

      if (!backendVerified) {
        try {
          const enrollRes = await CoursesService.enrollCourse(course.id);
          if (enrollRes && (enrollRes.success || (enrollRes as any).code === 'already_enrolled')) {
            backendVerified = true;
          }
        } catch (e: any) {
          const msg = (e?.message || '').toLowerCase();
          if (msg.includes('already') || msg.includes('enrolled')) {
            backendVerified = true;
          }
        }
      }

      setIsSyncing(false);

      if (backendVerified || userProgress[course.id]) {
        enrollInCourse(course.id);
        triggerHaptic('success');
        showToast({ message: 'Enrollment synced & unlocked!', type: 'success' });
        Alert.alert(
          t('syncSuccessTitle'),
          t('syncSuccessMsg'),
          [
            {
              text: isBangla ? 'শেখা শুরু করুন' : 'Start Learning',
              onPress: () => {
                onSuccess(course.id);
                onClose();
              },
            },
          ]
        );
        return;
      }

      Alert.alert(
        isBangla ? 'এনরোলমেন্ট পাওয়া যায়নি' : 'Enrollment Not Found',
        isBangla
          ? 'এই অ্যাকাউন্টে কোর্সটির সক্রিয় এনরোলমেন্ট পাওয়া যায়নি। সঠিক থ্রাইভিং স্কিলস অ্যাকাউন্ট দিয়ে সাইন ইন করেছেন কিনা নিশ্চিত করুন।'
          : 'No active enrollment for this course was found on your signed-in Thriving Skills account. Please verify you are signed in with the right account.'
      );
    } catch {
      setIsSyncing(false);
      Alert.alert(
        isBangla ? 'সংযোগ ত্রুটি' : 'Sync Error',
        isBangla
          ? 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করুন।'
          : 'Could not communicate with Thriving Skills servers. Please check your connection and try again.'
      );
    }
  }, [
    course,
    isAuthenticated,
    user,
    userProgress,
    refreshCourses,
    loadCourseDetail,
    enrollInCourse,
    onSuccess,
    onClose,
    setAuthModalVisible,
    t,
    isBangla,
  ]);

  if (!course) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.overlayClose} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
          accessibilityViewIsModal={true}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close access sync modal"
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Header Badge */}
            <View style={styles.headerRow}>
              <View style={[styles.shieldBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="library-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: 28 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isBangla ? 'সদস্য অ্যাক্সেস ও লাইব্রেরি সিঙ্ক' : 'Member Access & Account Sync'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {isBangla ? 'আপনার থ্রাইভিং স্কিলস অ্যাকাউন্ট থেকে এনরোলমেন্ট সিঙ্ক করুন' : 'Sync enrolled courses with your Thriving Skills account'}
                </Text>
              </View>
            </View>

            {/* Progressive 2-Step Access Sync Indicator */}
            <View style={[styles.stepperCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <View style={[styles.stepperTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.stepperFill, { backgroundColor: colors.primary, width: syncStep === 1 ? '50%' : '100%' }]} />
              </View>
              <View style={styles.stepperLabels}>
                <Text style={[styles.stepperLabelText, { color: colors.primary, fontWeight: '700' }]}>
                  {isAuthenticated ? '✓ 1. Signed In' : '1. Sign In'}
                </Text>
                <Text style={[styles.stepperLabelText, { color: syncStep === 2 ? colors.primary : colors.textMuted, fontWeight: syncStep === 2 ? '700' : '500' }]}>
                  2. Sync Library
                </Text>
              </View>
            </View>

            {/* Course Summary Card */}
            <View
              style={[
                styles.courseSummaryCard,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
                {course.title}
              </Text>
              <Text style={[styles.instructorName, { color: colors.textMuted }]}>
                Mentor: {course.instructor.name}
              </Text>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.accessBadgeRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={[styles.accessStatusText, { color: colors.primary }]}>
                  {isBangla ? 'সক্রিয় সদস্যদের জন্য সংরক্ষিত কোর্স' : 'Available to Enrolled Members'}
                </Text>
              </View>
            </View>

            {/* Companion Info Notice */}
            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: isDark ? colors.primaryLight : '#102F53' + '0C',
                  borderColor: colors.primary + '35',
                },
              ]}
            >
              <View style={styles.noticeHeader}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.noticeTitle, { color: colors.primary }]}>
                  {isBangla ? 'কম্প্যানিয়ন লার্নিং অ্যাক্সেস' : 'Cross-Platform Account Access'}
                </Text>
              </View>
              <Text style={[styles.noticeBody, { color: colors.text }]}>
                {isAuthenticated
                  ? isBangla
                    ? `আপনি বর্তমানে ${user?.email || user?.username} অ্যাকাউন্টে সাইন ইন আছেন। আপনার অ্যাকাউন্টে এই কোর্সের এনরোলমেন্ট থাকলে নিচের বাটনে ট্যাপ করে সিঙ্ক করুন।`
                    : `Signed in as ${user?.email || user?.username}. If your account is enrolled in this course, tap below to sync your latest LearnPress access.`
                  : isBangla
                  ? 'আপনার এনরোল করা কোর্সগুলো আনলক করতে অনুগ্রহ করে আপনার থ্রাইভিং স্কিলস অ্যাকাউন্ট দিয়ে সাইন ইন করুন।'
                  : 'Sign in with your Thriving Skills account to access courses in your enrolled member library.'}
              </Text>
            </View>

            {/* Primary Action: Sign In OR Sync Enrollments */}
            <TouchableOpacity
              style={[styles.primaryCheckoutBtn, { backgroundColor: colors.primary }]}
              onPress={performEnrollmentSync}
              disabled={isSyncing}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={isAuthenticated ? 'Sync account enrollments' : 'Sign in to Thriving Skills'}
            >
              {isSyncing ? (
                <>
                  <ActivityIndicator color={colors.onPrimary} size="small" style={{ marginRight: 8 }} />
                  <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                    {t('syncingEnrollment')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name={isAuthenticated ? 'sync' : 'log-in-outline'}
                    size={20}
                    color={colors.onPrimary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                    {isAuthenticated
                      ? isBangla
                        ? 'অ্যাকাউন্ট এনরোলমেন্ট সিঙ্ক করুন'
                        : 'Sync Account Enrollments'
                      : isBangla
                      ? 'থ্রাইভিং স্কিলস অ্যাকাউন্টে সাইন ইন'
                      : 'Sign In to Sync Account'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.guaranteeContainer}>
              <Ionicons name="lock-closed" size={14} color="#059669" style={{ marginRight: 6 }} />
              <Text style={[styles.guaranteeText, { color: colors.textMuted }]}>
                Encrypted LearnPress Account Synchronization
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  overlayClose: {
    flex: 1,
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  stepperCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  stepperTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  stepperFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepperLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperLabelText: {
    fontSize: 11,
  },
  scroll: {
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  shieldBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  courseSummaryCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  instructorName: {
    fontSize: 12,
    marginTop: 3,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
  },
  accessBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accessStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  noticeBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  primaryCheckoutBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  guaranteeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  guaranteeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
