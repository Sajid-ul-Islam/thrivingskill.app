import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TextInput,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLearning } from '../../context/LearningContext';
import { Course } from '../../types';
import { CoursesService } from '../../services/api/coursesService';
import { triggerHaptic } from '../../utils/haptics';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

export const MAX_SYNC_ATTEMPTS = 4;
export const RETRY_DELAYS_MS = [0, 1500, 2500, 4000];

export interface PaymentModalProps {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

/**
 * Authentic WooCommerce & LearnPress Checkout Modal.
 * Matches https://thrivingskill.com/checkout/ 1:1 with Billing Details,
 * SSLCommerz payment options, Order Summary, and instant member sync.
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
  const { userProgress, enrollInCourse, refreshCourses, loadCourseDetail } = useLearning();

  const [activeTab, setActiveTab] = useState<'checkout' | 'sync'>('checkout');

  // Billing Details Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Checkout Execution State
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutWebUrl, setCheckoutWebUrl] = useState<string | null>(null);

  // Sync State & Hygiene
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncAttempt, setSyncAttempt] = useState(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isCancelledRef = useRef<boolean>(false);

  const syncStep = isAuthenticated ? 2 : 1;

  // Hydrate user info if logged in
  useEffect(() => {
    if (visible && user) {
      const parts = (user.displayName || '').trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [visible, user]);

  useEffect(() => {
    isMountedRef.current = true;
    isCancelledRef.current = false;
    return () => {
      isMountedRef.current = false;
      isCancelledRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setIsSyncing(false);
      setIsPlacingOrder(false);
      setCheckoutWebUrl(null);
      setFormErrors({});
      setSyncAttempt(1);
    }
  }, [visible, course?.id]);

  const coursePriceBdt = course?.priceBdt || (course?.price ? Math.round(course.price * 120) : 0);
  const formattedPrice = `৳ ${coursePriceBdt.toLocaleString()}`;

  // Form Validation
  const validateBillingDetails = (): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = isBangla ? 'নামের প্রথম অংশ আবশ্যক' : 'First name is required';
    }
    if (!lastName.trim()) {
      errors.lastName = isBangla ? 'নামের শেষ অংশ আবশ্যক' : 'Last name is required';
    }
    if (!phone.trim()) {
      errors.phone = isBangla ? 'ফোন নম্বর আবশ্যক' : 'Phone is required';
    }
    if (!email.trim() || !email.includes('@')) {
      errors.email = isBangla ? 'সঠিক ইমেল ঠিকানা আবশ্যক' : 'Valid email is required';
    }
    if (!isAuthenticated && !password.trim()) {
      errors.password = isBangla ? 'অ্যাকাউন্টের পাসওয়ার্ড আবশ্যক' : 'Password is required to create your account';
    }
    if (!agreedToTerms) {
      errors.terms = isBangla ? 'শর্তাবলী মেনে নেওয়া আবশ্যক' : 'You must accept the terms and conditions';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Place Order Action: Launches Official SSLCommerz Checkout Flow
  const handlePlaceOrder = async () => {
    if (!course) return;

    if (!validateBillingDetails()) {
      triggerHaptic('error');
      Alert.alert(
        isBangla ? 'আবশ্যক তথ্য অসম্পূর্ণ' : 'Required Fields Missing',
        isBangla
          ? 'অনুগ্রহ করে লাল চিহ্নিত সকল আবশ্যক তথ্য প্রদান করুন ও শর্তাবলী গ্রহণ করুন।'
          : 'Please fill in all required fields and agree to the terms to place your order.'
      );
      return;
    }

    triggerHaptic('medium');
    setIsPlacingOrder(true);

    try {
      // Build pre-filled WooCommerce Checkout URL
      const params = new URLSearchParams({
        'add-to-cart': String(course.id),
        billing_first_name: firstName.trim(),
        billing_last_name: lastName.trim(),
        billing_email: email.trim(),
        billing_phone: phone.trim(),
      });

      if (orderNotes.trim()) {
        params.append('order_comments', orderNotes.trim());
      }

      const fullCheckoutUrl = `https://thrivingskill.com/checkout/?${params.toString()}`;
      setCheckoutWebUrl(fullCheckoutUrl);
    } catch (err: any) {
      Alert.alert(
        isBangla ? 'ত্রুটি' : 'Checkout Error',
        err?.message || (isBangla ? 'অর্ডার প্রক্রিয়া শুরু করা যায়নি।' : 'Could not initiate checkout.')
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

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

      if (!isMountedRef.current || isCancelledRef.current) return;
      setIsSyncing(false);

      if (backendVerified || userProgress[course.id]) {
        enrollInCourse(course.id);
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
          ? 'এই অ্যাকাউন্টে কোর্সটির সক্রিয় অর্ডার বা এনরোলমেন্ট পাওয়া যায়নি। আপনি যদি এইমাত্র অর্ডার সম্পন্ন করে থাকেন, তবে ১ মিনিট পর পুনরায় সিঙ্ক করুন।'
          : 'No active order or enrollment was verified for this course. If you just placed an order, please wait 30–60 seconds for gateway confirmation and retry.'
      );
    } catch {
      if (!isMountedRef.current || isCancelledRef.current) return;
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

  // Handle WebView Checkout URL changes (Detect completion redirect)
  const handleWebViewNavChange = (navState: any) => {
    const url = navState.url || '';
    if (
      url.includes('order-received') ||
      url.includes('thank-you') ||
      url.includes('checkout/success') ||
      url.includes('order-pay') === false && url.includes('/order/')
    ) {
      triggerHaptic('success');
      setCheckoutWebUrl(null);
      if (course) {
        enrollInCourse(course.id);
        onSuccess(course.id);
        onClose();
        Alert.alert(
          isBangla ? 'অর্ডার সফল হয়েছে! 🎉' : 'Order Placed Successfully! 🎉',
          isBangla
            ? 'আপনার কোর্সটি সফলভাবে চালু হয়েছে। এখনই শেখা শুরু করুন!'
            : 'Your payment was confirmed and course access has been activated!'
        );
      }
    }
  };

  if (!course) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            onPress={() => {
              if (checkoutWebUrl) {
                setCheckoutWebUrl(null);
              } else {
                onClose();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Close checkout modal"
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Embedded SSLCommerz Checkout WebView */}
          {checkoutWebUrl ? (
            <View style={styles.webViewContainer}>
              <View style={[styles.webViewHeader, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <Ionicons name="lock-closed" size={16} color="#059669" />
                <Text style={[styles.webViewTitle, { color: colors.text }]} numberOfLines={1}>
                  SSLCommerz Secure Payment
                </Text>
                <TouchableOpacity
                  style={styles.openExternalBtn}
                  onPress={() => Linking.openURL(checkoutWebUrl)}
                >
                  <Ionicons name="open-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <WebView
                source={{ uri: checkoutWebUrl }}
                onNavigationStateChange={handleWebViewNavChange}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webLoading}>
                    <ActivityIndicator size="large" color="#102F53" />
                    <Text style={[styles.webLoadingText, { color: colors.textMuted }]}>
                      Connecting to SSLCommerz Payment Gateway...
                    </Text>
                  </View>
                )}
                style={styles.webView}
              />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {/* Header Badge */}
              <View style={styles.headerRow}>
                <View style={[styles.shieldBadge, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="bag-check-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1, paddingRight: 28 }}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {isBangla ? 'কোর্স অর্ডার ও চেকআউট' : 'Checkout & Place Order'}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    {isBangla ? 'এসএসএলকমার্জ এর মাধ্যমে নিরাপদ পেমেন্ট' : 'Secure payment via SSLCommerz'}
                  </Text>
                </View>
              </View>

              {/* 2-Step Member Access Sync Progress Stepper */}
              <View style={[styles.stepperContainer, { backgroundColor: colors.surfaceSubtle }]}>
                <View style={styles.stepperInfoRow}>
                  <Text style={[styles.stepperLabel, { color: colors.textMuted }]}>
                    {isBangla ? `ধাপ ${syncStep}/২: সদস্য অ্যাক্সেস যাচাই` : `Step ${syncStep} of 2: Member Access Sync`}
                  </Text>
                  <Text style={[styles.stepperPercent, { color: colors.primary }]}>
                    {syncStep === 2 ? '100%' : '50%'}
                  </Text>
                </View>
                <View style={[styles.stepperTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.stepperFill,
                      {
                        width: syncStep === 2 ? '100%' : '50%',
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Mode Toggle Tabs */}
              <View style={[styles.tabSelector, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    activeTab === 'checkout' && [styles.activeTabBtn, { backgroundColor: colors.surface }],
                  ]}
                  onPress={() => setActiveTab('checkout')}
                >
                  <Ionicons
                    name="card-outline"
                    size={16}
                    color={activeTab === 'checkout' ? colors.primary : colors.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.tabBtnText,
                      { color: activeTab === 'checkout' ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {isBangla ? 'অর্ডার প্লেস করুন' : 'Place Order'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    activeTab === 'sync' && [styles.activeTabBtn, { backgroundColor: colors.surface }],
                  ]}
                  onPress={() => setActiveTab('sync')}
                >
                  <Ionicons
                    name="sync-outline"
                    size={16}
                    color={activeTab === 'sync' ? colors.primary : colors.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.tabBtnText,
                      { color: activeTab === 'sync' ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {isBangla ? 'পূর্ববর্তী এনরোলমেন্ট সিঙ্ক' : 'Sync Enrolled Access'}
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'checkout' ? (
                <>
                  {/* Section 1: Billing details */}
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {isBangla ? 'বিলিং তথ্য' : 'Billing details'}
                    </Text>
                  </View>

                  {/* First Name & Last Name */}
                  <View style={styles.nameRow}>
                    <View style={styles.nameCol}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        {isBangla ? 'নামের প্রথম অংশ' : 'First name'} <Text style={styles.requiredAsterisk}>*</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: formErrors.firstName ? '#DC2626' : colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={firstName}
                        onChangeText={(txt) => {
                          setFirstName(txt);
                          if (formErrors.firstName) setFormErrors((p) => ({ ...p, firstName: '' }));
                        }}
                        placeholder="e.g. Tanvir"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    <View style={styles.nameCol}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        {isBangla ? 'নামের শেষ অংশ' : 'Last name'} <Text style={styles.requiredAsterisk}>*</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: formErrors.lastName ? '#DC2626' : colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={lastName}
                        onChangeText={(txt) => {
                          setLastName(txt);
                          if (formErrors.lastName) setFormErrors((p) => ({ ...p, lastName: '' }));
                        }}
                        placeholder="e.g. Ahmed"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>

                  {/* Phone Number */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {isBangla ? 'ফোন নম্বর' : 'Phone'} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: formErrors.phone ? '#DC2626' : colors.border,
                          color: colors.text,
                        },
                      ]}
                      value={phone}
                      onChangeText={(txt) => {
                        setPhone(txt);
                        if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: '' }));
                      }}
                      placeholder="017XXXXXXXX"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>

                  {/* Email address */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {isBangla ? 'ইমেল ঠিকানা' : 'Email address'} <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: formErrors.email ? '#DC2626' : colors.border,
                          color: colors.text,
                        },
                      ]}
                      value={email}
                      onChangeText={(txt) => {
                        setEmail(txt);
                        if (formErrors.email) setFormErrors((p) => ({ ...p, email: '' }));
                      }}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Password (for new student account registration) */}
                  {!isAuthenticated && (
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        {isBangla ? 'পাসওয়ার্ড তৈরি করুন' : 'Password'} <Text style={styles.requiredAsterisk}>*</Text>
                      </Text>
                      <View style={styles.passwordWrapper}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.passwordInput,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: formErrors.password ? '#DC2626' : colors.border,
                              color: colors.text,
                            },
                          ]}
                          value={password}
                          onChangeText={(txt) => {
                            setPassword(txt);
                            if (formErrors.password) setFormErrors((p) => ({ ...p, password: '' }));
                          }}
                          placeholder="Password"
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                          style={styles.eyeToggle}
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Order Notes (optional) */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {isBangla ? 'অতিরিক্ত তথ্য (ঐচ্ছিক)' : 'Order Notes (optional)'}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      value={orderNotes}
                      onChangeText={setOrderNotes}
                      placeholder="Notes about your order, e.g. special notes for delivery."
                      placeholderTextColor={colors.textMuted}
                      multiline={true}
                      numberOfLines={3}
                    />
                  </View>

                  {/* Section 2: Your order */}
                  <View
                    style={[
                      styles.orderSummaryCard,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.orderSummaryTitle, { color: colors.text }]}>
                      {isBangla ? 'আপনার অর্ডার' : 'Your order'}
                    </Text>

                    <View style={styles.orderItemRow}>
                      <Text style={[styles.orderItemName, { color: colors.text }]} numberOfLines={2}>
                        {course.title} × 1
                      </Text>
                      <Text style={[styles.orderItemPrice, { color: colors.text }]}>
                        {formattedPrice}
                      </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.orderSummaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                        {isBangla ? 'সাবটোটাল' : 'Subtotal'}
                      </Text>
                      <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {formattedPrice}
                      </Text>
                    </View>

                    <View style={styles.orderSummaryRow}>
                      <Text style={[styles.totalLabel, { color: colors.text }]}>
                        {isBangla ? 'সর্বমোট' : 'Total'}
                      </Text>
                      <Text style={[styles.totalValue, { color: '#102F53' }]}>
                        {formattedPrice}
                      </Text>
                    </View>
                  </View>

                  {/* Section 3: SSLCommerz Notice */}
                  <View
                    style={[
                      styles.sslCard,
                      { backgroundColor: isDark ? '#1E293B' : '#F3F4F6', borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.sslHeader}>
                      <Text style={[styles.sslTitle, { color: colors.text }]}>SSLCommerz</Text>
                      <View style={styles.sslBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#059669" />
                        <Text style={styles.sslBadgeText}>22+ Payment Options</Text>
                      </View>
                    </View>

                    <Text style={[styles.sslDesc, { color: colors.textMuted }]}>
                      Pay securely by Mobile banking (bKash, Rocket), Credit/Debit card (VISA, mastercard),
                      Internet banking (Bank Asia, Brac) through SSLCommerz. Here SSLCommerz containing 22
                      payment options for you.
                    </Text>

                    {/* Payment Brands Pills */}
                    <View style={styles.badgeChipsRow}>
                      {['bKash', 'Nagad', 'Rocket', 'VISA', 'Mastercard', 'Bank Asia', 'BRAC'].map((b) => (
                        <View
                          key={b}
                          style={[
                            styles.chip,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                          ]}
                        >
                          <Text style={[styles.chipText, { color: colors.text }]}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Privacy Policy */}
                  <Text style={[styles.privacyText, { color: colors.textMuted }]}>
                    Your personal data will be used to process your order, purposes described in our privacy policy.
                  </Text>

                  {/* Terms & Conditions Checkbox */}
                  <TouchableOpacity
                    style={styles.termsRow}
                    activeOpacity={0.8}
                    onPress={() => {
                      setAgreedToTerms(!agreedToTerms);
                      if (formErrors.terms) setFormErrors((p) => ({ ...p, terms: '' }));
                    }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: formErrors.terms ? '#DC2626' : agreedToTerms ? '#102F53' : colors.border,
                          backgroundColor: agreedToTerms ? '#102F53' : colors.surface,
                        },
                      ]}
                    >
                      {agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.termsText, { color: colors.text }]}>
                      I have read and agree to the website terms and conditions <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                  </TouchableOpacity>

                  {/* PLACE ORDER Action Button */}
                  <TouchableOpacity
                    style={[styles.placeOrderBtn, { backgroundColor: '#102F53' }]}
                    onPress={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    activeOpacity={0.88}
                  >
                    {isPlacingOrder ? (
                      <>
                        <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                        <Text style={styles.placeOrderBtnText}>
                          {isBangla ? 'অর্ডার প্রসেস হচ্ছে...' : 'Processing Order...'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="lock-closed" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.placeOrderBtnText}>
                          {isBangla ? 'অর্ডার প্লেস করুন (PLACE ORDER)' : 'PLACE ORDER'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                /* Mode 2: Existing Member Access Sync */
                <>
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

                  <View
                    style={[
                      styles.noticeBox,
                      {
                        backgroundColor: colors.primaryLight,
                        borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(16, 47, 83, 0.18)',
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

                  <TouchableOpacity
                    style={[styles.primaryCheckoutBtn, { backgroundColor: colors.primary }]}
                    onPress={performEnrollmentSync}
                    disabled={isSyncing}
                    activeOpacity={0.88}
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
                </>
              )}

              <View style={styles.guaranteeContainer}>
                <Ionicons name="lock-closed" size={14} color="#059669" style={{ marginRight: 6 }} />
                <Text style={[styles.guaranteeText, { color: colors.textMuted }]}>
                  SSLCommerz Encrypted 256-Bit Bank Grade Payment Security
                </Text>
              </View>
            </ScrollView>
          )}
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
    paddingBottom: 24,
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
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  activeTabBtn: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  nameCol: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#DC2626',
    fontWeight: '700',
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeToggle: {
    position: 'absolute',
    right: 12,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  orderSummaryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 14,
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingRight: 12,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  sslCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  sslHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sslTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sslBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  sslDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  badgeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  privacyText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  placeOrderBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  webViewContainer: {
    flex: 1,
    minHeight: 520,
    borderRadius: 16,
    overflow: 'hidden',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  webViewTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  openExternalBtn: {
    padding: 4,
  },
  webView: {
    flex: 1,
  },
  webLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 10,
  },
  webLoadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  stepperContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  stepperInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepperPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  stepperFill: {
    height: '100%',
    borderRadius: 3,
  },
});
