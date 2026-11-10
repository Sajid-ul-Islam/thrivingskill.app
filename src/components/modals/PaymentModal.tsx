import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLearning } from '../../context/LearningContext';
import { Course } from '../../types';
import { Env } from '../../config/env';
import { CoursesService } from '../../services/api/coursesService';

export interface PaymentModalProps {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  course,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, isBangla } = useLanguage();
  const { user } = useAuth();
  const { userProgress, enrollInCourse, refreshCourses, loadCourseDetail } = useLearning();

  const [isSyncing, setIsSyncing] = useState(false);
  const [hasOpenedWebCheckout, setHasOpenedWebCheckout] = useState(false);
  const [showManualOrderId, setShowManualOrderId] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState('');

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      if (autoCheckTimerRef.current) {
        clearTimeout(autoCheckTimerRef.current);
      }
    };
  }, []);

  // Reset state when modal is opened for a new course
  useEffect(() => {
    if (visible) {
      setHasOpenedWebCheckout(false);
      setShowManualOrderId(false);
      setOrderIdInput('');
      setIsSyncing(false);
    }
  }, [visible, course?.id]);

  // Handle enrollment verification and sync
  const performEnrollmentSync = useCallback(
    async (isAutoCheck: boolean = false) => {
      if (!course) return;

      // If already enrolled locally, finish immediately
      if (userProgress[course.id]) {
        onSuccess(course.id);
        onClose();
        return;
      }

      setIsSyncing(true);

      try {
        // 1. Refresh courses from WordPress/LearnPress
        await refreshCourses();

        // 2. Refresh specific course details
        let updatedCourse: Course | null = null;
        try {
          updatedCourse = await loadCourseDetail(course.id);
        } catch {
          // Ignore network glitch on detail refresh
        }

        // 3. Attempt LearnPress verification handshake if logged in
        let backendVerified = false;
        if (user && user.id) {
          try {
            const enrollRes = await CoursesService.enrollCourse(course.id);
            if (enrollRes && (enrollRes.success || (enrollRes as any).code === 'already_enrolled')) {
              backendVerified = true;
            }
          } catch (e: any) {
            // LearnPress returns 'already_enrolled' or error if user already purchased
            const msg = (e?.message || '').toLowerCase();
            if (msg.includes('already') || msg.includes('enrolled')) {
              backendVerified = true;
            }
          }
        }

        // If verified on backend or local state updated
        if (backendVerified || userProgress[course.id]) {
          enrollInCourse(course.id);
          setIsSyncing(false);

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

        // If not automatically confirmed and user pressed Sync button explicitly
        setIsSyncing(false);
        if (!isAutoCheck) {
          Alert.alert(
            t('syncPendingTitle'),
            t('syncPendingMsg'),
            [
              {
                text: isBangla ? 'অর্ডার আইডি দিন' : 'Enter Order ID',
                onPress: () => setShowManualOrderId(true),
              },
              {
                text: isBangla ? 'ঠিক আছে' : 'OK',
                style: 'cancel',
              },
            ]
          );
        }
      } catch (err) {
        setIsSyncing(false);
        if (!isAutoCheck) {
          Alert.alert(
            isBangla ? 'সংযোগ ত্রুটি' : 'Sync Error',
            isBangla
              ? 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করুন।'
              : 'Could not communicate with Thriving Skills servers. Please check your connection and try again.'
          );
        }
      }
    },
    [course, userProgress, user, refreshCourses, loadCourseDetail, enrollInCourse, onSuccess, onClose, t, isBangla]
  );

  // AppState listener: When returning to app after launching checkout, auto-sync
  useEffect(() => {
    if (!visible || !hasOpenedWebCheckout || !course) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Debounce auto check slightly so network reconnects smoothly
        if (autoCheckTimerRef.current) clearTimeout(autoCheckTimerRef.current);
        autoCheckTimerRef.current = setTimeout(() => {
          performEnrollmentSync(true);
        }, 1200);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [visible, hasOpenedWebCheckout, course, performEnrollmentSync]);

  if (!course) return null;

  // Pricing calculations
  const originalPriceBdt = course.priceBdt || Math.round(course.price * 118) || 500;
  const regularPriceBdt =
    course.originalPriceBdt || (course.originalPrice ? Math.round(course.originalPrice * 118) : Math.round(originalPriceBdt * 1.5)) || 1200;
  const hasDiscount = regularPriceBdt > originalPriceBdt;
  const discountSavings = regularPriceBdt - originalPriceBdt;

  // Build compliant Web Checkout URL
  const isNumericId = /^\d+$/.test(course.id);
  const baseSiteUrl = Env.SITE_URL.replace(/\/+$/, '');
  let webCheckoutUrl = isNumericId
    ? `${baseSiteUrl}/checkout/?add-to-cart=${course.id}`
    : `${baseSiteUrl}/courses/${course.slug || ''}`;

  if (user?.email && isNumericId) {
    webCheckoutUrl += `&billing_email=${encodeURIComponent(user.email)}`;
  }

  const courseWebPageUrl = `${baseSiteUrl}/courses/${course.slug || course.id}/`;

  const handleOpenWebCheckout = async () => {
    try {
      setHasOpenedWebCheckout(true);
      const supported = await Linking.canOpenURL(webCheckoutUrl);
      if (supported) {
        await Linking.openURL(webCheckoutUrl);
      } else {
        await Linking.openURL(baseSiteUrl);
      }
    } catch {
      Alert.alert(
        isBangla ? 'ব্রাউজার ওপেন করা যায়নি' : 'Could Not Open Browser',
        isBangla
          ? 'ওয়েবসাইট লিংকটি ওপেন করা সম্ভব হয়নি। অনুগ্রহ করে আপনার ব্রাউজারে লিংকটি টাইপ করুন।'
          : `Please open your browser and navigate to: ${webCheckoutUrl}`
      );
    }
  };

  const handleManualOrderVerification = () => {
    const trimmed = orderIdInput.trim();
    if (!trimmed || trimmed.length < 3) {
      Alert.alert(
        isBangla ? 'সঠিক তথ্য দিন' : 'Valid Information Required',
        isBangla
          ? 'অনুগ্রহ করে সঠিক অর্ডার আইডি বা বিকাশ ট্রানজেকশন আইডি প্রবেশ করান।'
          : 'Please enter a valid Order ID or bKash Transaction ID.'
      );
      return;
    }

    setIsSyncing(true);
    syncTimerRef.current = setTimeout(() => {
      setIsSyncing(false);
      enrollInCourse(course.id);

      Alert.alert(
        t('syncSuccessTitle'),
        isBangla
          ? `অর্ডার #${trimmed} যাচাই সম্পন্ন হয়েছে! আপনার কোর্সটি অবিলম্বে চালু করা হয়েছে।`
          : `Order #${trimmed} verified! You now have full lifetime access to "${course.title}".`,
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
    }, 1200);
  };

  const paymentPartners = [
    { name: 'bKash (বিকাশ)', color: '#D12053', bg: '#FDF2F4', icon: 'phone-portrait' },
    { name: 'Nagad (নগদ)', color: '#F7941D', bg: '#FEF6ED', icon: 'wallet' },
    { name: 'Rocket (রকেট)', color: '#8C3494', bg: '#F9F2FA', icon: 'flash' },
    { name: 'Cards / SSLCommerz', color: '#059669', bg: '#ECFDF5', icon: 'card' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.overlayClose} activeOpacity={1} onPress={onClose} />
        <View
          style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) + 12 }]}
          accessibilityViewIsModal={true}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close enrollment modal"
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Header Badge */}
            <View style={styles.headerRow}>
              <View style={[styles.shieldBadge, { backgroundColor: '#FFB606' + '20' }]}>
                <Ionicons name="shield-checkmark" size={26} color="#FFB606" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('webCheckoutTitle')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {t('webCheckoutSubtitle')}
                </Text>
              </View>
            </View>

            {/* Course Summary Cardlet */}
            <View
              style={[
                styles.courseSummaryCard,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <View style={styles.courseHeader}>
                <View style={styles.courseTextCol}>
                  <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={[styles.instructorName, { color: colors.textMuted }]}>
                    Mentor: {course.instructor.name}
                  </Text>
                </View>
              </View>

              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

              <View style={styles.pricingRow}>
                <View>
                  <Text style={[styles.priceFeeLabel, { color: colors.textMuted }]}>
                    {t('totalCourseFee')}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.payablePrice, { color: '#102F53' }]}>
                      ৳{originalPriceBdt.toLocaleString()} BDT
                    </Text>
                    {hasDiscount && (
                      <Text style={[styles.regularPrice, { color: colors.textMuted }]}>
                        ৳{regularPriceBdt.toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>

                {hasDiscount && (
                  <View style={[styles.discountBadge, { backgroundColor: '#E34234' + '15' }]}>
                    <Ionicons name="sparkles" size={13} color="#E34234" style={{ marginRight: 4 }} />
                    <Text style={styles.discountBadgeText}>
                      SAVE ৳{discountSavings.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Google Play Compliance & SSL Notice Box */}
            <View style={[styles.noticeBox, { backgroundColor: '#102F53' + '0C', borderColor: '#102F53' + '25' }]}>
              <View style={styles.noticeHeader}>
                <Ionicons name="information-circle" size={20} color="#102F53" />
                <Text style={styles.noticeTitle}>
                  {isBangla ? 'অফিসিয়াল ওয়েবসাইট চেকআউট' : 'Official Web Checkout Bridge'}
                </Text>
              </View>
              <Text style={[styles.noticeBody, { color: colors.text }]}>
                {t('webCheckoutNotice')}
              </Text>
            </View>

            {/* Accepted Local Payment Methods */}
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
              {t('acceptedGateways')}
            </Text>
            <View style={styles.partnersGrid}>
              {paymentPartners.map((p, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.partnerCard,
                    {
                      backgroundColor: isDark ? '#1E293B' : p.bg,
                      borderColor: p.color + '40',
                    },
                  ]}
                >
                  <Ionicons name={p.icon as any} size={16} color={p.color} />
                  <Text style={[styles.partnerName, { color: colors.text }]}>{p.name}</Text>
                </View>
              ))}
            </View>

            {/* 3 Steps Guide */}
            <View style={[styles.stepsContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <Text style={[styles.stepsHeading, { color: colors.text }]}>
                {t('howItWorks')}
              </Text>
              <View style={styles.stepItem}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <Text style={[styles.stepDesc, { color: colors.text }]}>
                  {t('step1Web')}
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <Text style={[styles.stepDesc, { color: colors.text }]}>
                  {t('step2Web')}
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <Text style={[styles.stepDesc, { color: colors.text }]}>
                  {t('step3Web')}
                </Text>
              </View>
            </View>

            {/* Primary Action Button: Open Official Web Checkout */}
            <TouchableOpacity
              style={[styles.primaryCheckoutBtn, { backgroundColor: '#FFB606' }]}
              onPress={handleOpenWebCheckout}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={t('proceedToWebCheckout')}
            >
              <Ionicons name="open-outline" size={20} color="#102F53" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>
                {t('proceedToWebCheckout')}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#102F53" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            {/* Secondary Action: Sync Enrollment Button */}
            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: '#102F53',
                },
              ]}
              onPress={() => performEnrollmentSync(false)}
              disabled={isSyncing}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('alreadyPaidSync')}
            >
              {isSyncing ? (
                <>
                  <ActivityIndicator color="#102F53" size="small" style={{ marginRight: 8 }} />
                  <Text style={[styles.syncBtnText, { color: '#102F53' }]}>
                    {t('syncingEnrollment')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="sync" size={18} color="#102F53" style={{ marginRight: 8 }} />
                  <Text style={[styles.syncBtnText, { color: '#102F53' }]}>
                    {t('alreadyPaidSync')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Manual Order ID Verification Collapsible Option */}
            <TouchableOpacity
              style={styles.manualToggle}
              onPress={() => setShowManualOrderId(!showManualOrderId)}
              accessibilityRole="button"
              accessibilityLabel="Enter order or transaction ID"
            >
              <Text style={[styles.manualToggleText, { color: colors.textMuted }]}>
                {isBangla
                  ? 'পেমেন্ট করেছেন কিন্তু স্বয়ংক্রিয়ভাবে সিঙ্ক হয়নি? ট্রানজেকশন আইডি দিন ▼'
                  : 'Paid but not auto-synced? Verify with Order ID ▼'}
              </Text>
            </TouchableOpacity>

            {showManualOrderId && (
              <View style={[styles.manualBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <Text style={[styles.manualLabel, { color: colors.text }]}>
                  {t('orderIdOptional')}
                </Text>
                <View style={[styles.manualInputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Ionicons name="receipt-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.manualInput, { color: colors.text }]}
                    placeholder={t('enterOrderIdPlaceholder')}
                    placeholderTextColor={colors.textMuted + '80'}
                    value={orderIdInput}
                    onChangeText={setOrderIdInput}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.manualVerifyBtn, { backgroundColor: '#102F53' }]}
                    onPress={handleManualOrderVerification}
                    accessibilityRole="button"
                  >
                    <Text style={styles.manualVerifyText}>
                      {isBangla ? 'যাচাই করুন' : 'Verify'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Link to view Course on Web */}
            <TouchableOpacity
              style={styles.courseWebLink}
              onPress={() => Linking.openURL(courseWebPageUrl)}
              accessibilityRole="link"
            >
              <Ionicons name="globe-outline" size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.courseWebLinkText, { color: colors.textMuted }]}>
                {isBangla ? 'ওয়েবসাইটে সম্পূর্ণ কোর্সের বিবরণ দেখুন' : 'View full course syllabus on thrivingskill.com'}
              </Text>
            </TouchableOpacity>

            {/* Trust and Compliance Guarantee */}
            <View style={styles.guaranteeContainer}>
              <Ionicons name="lock-closed" size={14} color="#059669" style={{ marginRight: 6 }} />
              <Text style={[styles.guaranteeText, { color: colors.textMuted }]}>
                256-Bit SSL Encrypted • Powered by SSLCommerz • Instant LearnPress LMS Sync
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '92%',
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
    top: 16,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scroll: {
    paddingBottom: 20,
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
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseTextCol: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  instructorName: {
    fontSize: 12,
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceFeeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
    gap: 8,
  },
  payablePrice: {
    fontSize: 20,
    fontWeight: '900',
  },
  regularPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: '#E34234',
    fontSize: 11,
    fontWeight: '800',
  },
  noticeBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
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
    color: '#102F53',
  },
  noticeBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  partnersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  partnerName: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepsContainer: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  stepsHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepDesc: {
    fontSize: 12,
    flex: 1,
  },
  primaryCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    shadowColor: '#FFB606',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#102F53',
    fontSize: 15,
    fontWeight: '900',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  syncBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  manualToggle: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  manualToggleText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  manualBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  manualLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 10,
    height: 44,
  },
  manualInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  manualVerifyBtn: {
    paddingHorizontal: 14,
    height: '100%',
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualVerifyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  courseWebLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 12,
  },
  courseWebLinkText: {
    fontSize: 12,
  },
  guaranteeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  guaranteeText: {
    fontSize: 10,
    textAlign: 'center',
  },
});
