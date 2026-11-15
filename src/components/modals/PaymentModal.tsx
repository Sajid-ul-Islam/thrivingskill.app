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
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLearning } from '../../context/LearningContext';
import { useFeedback } from '../../context/FeedbackContext';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET, typography } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { Course } from '../../types';
import { CoursesService } from '../../services/api/coursesService';
import { Env } from '../../config/env';

export interface PaymentModalProps {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

type ModalViewMode = 'checkout' | 'sync';

/**
 * In-App Seamless Checkout & Enrollment Sheet.
 * Opens official https://thrivingskill.com/checkout/ in a native slide-up sheet,
 * pre-fills user details, supports local bKash/Nagad/SSLCommerz, and automatically
 * detects order completion (/checkout/order-received/) to unlock the course instantly.
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

  const [mode, setMode] = useState<ModalViewMode>('checkout');
  const [canGoBack, setCanGoBack] = useState(false);
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  // Sync state for fallback mode
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [manualOrderId, setManualOrderId] = useState<string>('');

  const syncStep = isSyncing || (isAuthenticated && userProgress[course?.id || '']) ? 2 : isAuthenticated ? 2 : 1;

  const webViewRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanSiteUrl = Env.SITE_URL.replace(/\/+$/, '');
  const bdtPrice = course?.priceBdt || (course?.price ? Math.round(course.price * 120) : 0);
  const checkoutUrl = course ? `${cleanSiteUrl}/cart/?add-to-cart=${course.id}` : cleanSiteUrl;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMode('checkout');
      setCanGoBack(false);
      setIsWebViewLoading(true);
      setIsOrderCompleted(false);
      setCompletedOrderId(null);
      setIsSyncing(false);
      setSyncStatusMsg('');
      setManualOrderId('');
    }
  }, [visible, course?.id]);

  const handleClose = useCallback(() => {
    if (isOrderCompleted) {
      if (course) onSuccess(course.id);
      onClose();
      return;
    }

    if (canGoBack && !isOrderCompleted) {
      Alert.alert(
        isBangla ? 'পেমেন্ট থেকে বের হবেন?' : 'Exit Checkout?',
        isBangla
          ? 'আপনি কি নিশ্চিত যে চেকআউট প্রক্রিয়া বাতিল করতে চান?'
          : 'Are you sure you want to exit? Any unconfirmed payment progress will be cancelled.',
        [
          { text: isBangla ? 'চালিয়ে যান' : 'Stay Here', style: 'cancel' },
          {
            text: isBangla ? 'বের হন' : 'Exit',
            style: 'destructive',
            onPress: () => {
              triggerHaptic('light');
              onClose();
            },
          },
        ]
      );
      return;
    }

    triggerHaptic('light');
    onClose();
  }, [canGoBack, isOrderCompleted, isBangla, course, onSuccess, onClose]);

  // Handle successful order completion
  const handleOrderSuccess = useCallback(
    async (orderId?: string | null) => {
      if (!course || isOrderCompleted) return;
      setIsOrderCompleted(true);
      if (orderId) setCompletedOrderId(orderId);

      triggerHaptic('success');
      showToast({
        message: isBangla
          ? 'পেমেন্ট সফল! কোর্সটি সক্রিয় করা হয়েছে 🎉'
          : 'Payment Successful! Course Unlocked 🎉',
        type: 'success',
      });

      // 1. Immediately activate course locally
      enrollInCourse(course.id);

      // 2. Handshake with backend in background
      CoursesService.enrollCourse(course.id).catch(() => {});
      refreshCourses().catch(() => {});

      // 3. Smooth transition to learning
      timeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        onSuccess(course.id);
        onClose();
      }, 1800);
    },
    [course, isOrderCompleted, isBangla, enrollInCourse, refreshCourses, onSuccess, onClose, showToast]
  );

  // Injected CSS and JavaScript to format the live web checkout as a native component
  const injectedJavaScript = `
    (function() {
      // 1. Clean mobile UI styling: eliminate all website chrome (header, footer, menus, sidebars)
      var css = [
        'header, footer, .site-header, .site-footer, .mobile-menu-wrapper, #toolbar,',
        '.top_site_main, .page-title, .breadcrumb, .widget-area, #header-mini-cart,',
        '.thim-link-login, .menu-right, .footer-bottom, .quick-view-detail, .search-box-wrapper,',
        '#back-to-top, .gallery-slider-wrap, .social-share { display: none !important; }',
        'body, html, #main-content, .site-content { background: #FFFFFF !important; margin: 0 !important; padding: 0 !important; }',
        '.woocommerce, .woocommerce-checkout, .woocommerce-cart, #customer_details { padding: 10px 14px !important; margin: 0 auto !important; max-width: 100% !important; box-shadow: none !important; }',
        'table.shop_table { font-size: 13.5px !important; border-radius: 8px !important; }',
        '.woocommerce-billing-fields h3, .woocommerce-additional-fields h3, h3#order_review_heading { font-size: 16px !important; font-weight: 700 !important; margin-top: 14px !important; margin-bottom: 8px !important; color: #102F53 !important; }',
        '#payment { background: #F8FAFC !important; border-radius: 12px !important; border: 1.5px solid #E2E8F0 !important; padding: 12px !important; margin-top: 12px !important; }',
        '#payment ul.payment_methods { padding: 0 !important; margin: 0 !important; }',
        '#payment ul.payment_methods li { list-style: none !important; padding: 8px 0 !important; border-bottom: 1px solid #EDF2F7 !important; }',
        '#place_order { background-color: #102F53 !important; color: #FFFFFF !important; font-size: 16px !important; padding: 15px 20px !important; border-radius: 12px !important; width: 100% !important; font-weight: 800 !important; border: none !important; margin-top: 14px !important; box-shadow: 0 4px 12px rgba(16, 47, 83, 0.25) !important; cursor: pointer !important; }',
        '.woocommerce-message, .woocommerce-info { border-radius: 8px !important; font-size: 13px !important; padding: 10px 14px !important; }'
      ].join(' ');

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      head.appendChild(style);

      // 2. Auto-forward from /cart/ to /checkout/ if redirected to cart page
      if (window.location.href.indexOf('/cart/') !== -1 && window.location.href.indexOf('/checkout/') === -1) {
        var checkoutBtn = document.querySelector('.checkout-button') || document.querySelector('a[href*="/checkout/"]');
        if (checkoutBtn) {
          checkoutBtn.click();
        } else {
          window.location.href = '${cleanSiteUrl}/checkout/';
        }
      }

      // 3. Auto-fill user profile into billing fields if authenticated
      var userEmail = ${JSON.stringify(user?.email || '')};
      var userName = ${JSON.stringify(user?.displayName || user?.username || '')};
      var nameParts = userName.trim().split(' ');
      var firstName = nameParts[0] || '';
      var lastName = nameParts.slice(1).join(' ') || firstName;

      function autoPopulateBilling() {
        var fName = document.getElementById('billing_first_name');
        if (fName && !fName.value && firstName) {
          fName.value = firstName;
          fName.dispatchEvent(new Event('input', { bubbles: true }));
          fName.dispatchEvent(new Event('change', { bubbles: true }));
        }

        var lName = document.getElementById('billing_last_name');
        if (lName && !lName.value && lastName) {
          lName.value = lastName;
          lName.dispatchEvent(new Event('input', { bubbles: true }));
          lName.dispatchEvent(new Event('change', { bubbles: true }));
        }

        var emailInput = document.getElementById('billing_email');
        if (emailInput && !emailInput.value && userEmail) {
          emailInput.value = userEmail;
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Auto-check terms agreement
        var terms = document.getElementById('terms');
        if (terms && !terms.checked) {
          terms.checked = true;
          terms.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      autoPopulateBilling();
      setTimeout(autoPopulateBilling, 600);
      setTimeout(autoPopulateBilling, 1800);

      // 4. Continuous watcher for order completion
      var interval = setInterval(function() {
        var url = window.location.href;
        var bodyText = document.body ? document.body.innerText : '';

        var isDone = (
          url.indexOf('order-received') !== -1 ||
          url.indexOf('key=wc_order_') !== -1 ||
          url.indexOf('payment-complete') !== -1 ||
          bodyText.indexOf('Thank you. Your order has been received') !== -1 ||
          bodyText.indexOf('Order received') !== -1 ||
          bodyText.indexOf('অর্ডার গ্রহণ করা হয়েছে') !== -1
        );

        if (isDone) {
          clearInterval(interval);
          var orderMatch = url.match(/order-received\\/(\\d+)/) || bodyText.match(/Order number:\\s*<strong>(\\d+)<\\/strong>/i) || bodyText.match(/Order number:\\s*(\\d+)/i);
          var orderId = orderMatch ? orderMatch[1] : null;

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ORDER_COMPLETE',
            orderId: orderId,
            url: url
          }));
        }
      }, 500);
    })();
    true;
  `;

  // Navigation watcher for instant redirect detection
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    const url = (navState.url || '').toLowerCase();

    // Check if user completed checkout
    if (
      url.includes('order-received') ||
      url.includes('key=wc_order_') ||
      url.includes('payment-complete')
    ) {
      const match = url.match(/order-received\/(\d+)/);
      handleOrderSuccess(match ? match[1] : null);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ORDER_COMPLETE') {
        handleOrderSuccess(data.orderId);
      }
    } catch {}
  };

  // Fallback: Perform LearnPress manual order synchronization
  const performManualSync = async () => {
    if (!course) return;
    if (!isAuthenticated || !user?.id) {
      onClose();
      setAuthModalVisible(true);
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(isBangla ? 'অ্যাকাউন্ট ভেরিফিকেশন চলছে...' : 'Verifying account orders...');

    try {
      await refreshCourses();
      let verified = false;

      try {
        const updatedCourse = await loadCourseDetail(course.id);
        if ((updatedCourse as any)?.enrolled || (updatedCourse as any)?.isEnrolled) {
          verified = true;
        }
      } catch {}

      if (!verified) {
        try {
          const res = await CoursesService.enrollCourse(course.id);
          if (res && (res.success || (res as any).code === 'already_enrolled')) {
            verified = true;
          }
        } catch (e: any) {
          const msg = (e?.message || '').toLowerCase();
          if (msg.includes('already') || msg.includes('enrolled')) {
            verified = true;
          }
        }
      }

      setIsSyncing(false);
      setSyncStatusMsg('');

      if (verified || userProgress[course.id]) {
        enrollInCourse(course.id);
        triggerHaptic('success');
        showToast({
          message: isBangla ? 'এনরোলমেন্ট সিঙ্ক সফল হয়েছে! 🎉' : 'Enrollment Confirmed! 🎉',
          type: 'success',
        });
        onSuccess(course.id);
        onClose();
      } else {
        Alert.alert(
          isBangla ? 'অর্ডার মেলেনি' : 'Order Not Detected Yet',
          isBangla
            ? 'আপনার অ্যাকাউন্টে এই কোর্সের কোনো সফল অর্ডার পাওয়া যায়নি। আপনি যদি বিকাশ বা কার্ডে পেমেন্ট করে থাকেন, তবে ১ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।'
            : 'No active order was found yet. If you recently completed payment, server confirmation may take up to 60 seconds.'
        );
      }
    } catch (e) {
      setIsSyncing(false);
      setSyncStatusMsg('');
      Alert.alert(
        isBangla ? 'সংযোগ ত্রুটি' : 'Network Error',
        isBangla ? 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।' : 'Could not reach server. Please try again.'
      );
    }
  };

  if (!course) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header Bar */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surfaceCard,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8),
            },
          ]}
        >
          <View style={styles.headerLeftRow}>
            {canGoBack && mode === 'checkout' && (
              <TouchableOpacity
                style={[styles.headerIconBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => webViewRef.current?.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            )}

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {course.title}
              </Text>
              <View style={styles.headerPriceRow}>
                <Text style={[styles.headerPriceTag, { color: colors.primary }]}>
                  ৳ {bdtPrice.toLocaleString()}
                </Text>
                <Text style={[styles.headerSubtext, { color: colors.textMuted }]}>
                  • {isBangla ? 'লাইফটাইম অ্যাক্সেস' : 'Lifetime Access'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRightRow}>
            {mode === 'checkout' ? (
              <TouchableOpacity
                style={[styles.modeToggleBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => {
                  triggerHaptic('light');
                  setMode('sync');
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to manual sync"
              >
                <Ionicons name="sync-outline" size={14} color={colors.primary} />
                <Text style={[styles.modeToggleText, { color: colors.primary }]}>
                  {isBangla ? 'সিঙ্ক' : 'Sync'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.modeToggleBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => {
                  triggerHaptic('light');
                  setMode('checkout');
                }}
                accessibilityRole="button"
                accessibilityLabel="Return to checkout"
              >
                <Ionicons name="card-outline" size={14} color={colors.primary} />
                <Text style={[styles.modeToggleText, { color: colors.primary }]}>
                  {isBangla ? 'চেকআউট' : 'Checkout'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close checkout sheet"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Trust Strip */}
        <View style={[styles.securityStrip, { backgroundColor: isDark ? '#121212' : '#F1F5F9', borderBottomColor: colors.borderSubtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={[styles.securityStripText, { color: colors.textMuted }]}>
              SSLCommerz • bKash • Nagad • Rocket • Cards (256-bit SSL)
            </Text>
          </View>
        </View>

        {/* MAIN BODY: In-App Checkout WebView OR Manual Sync Mode */}
        {mode === 'checkout' ? (
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              source={{
                uri: checkoutUrl,
                headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
              }}
              style={styles.webView}
              injectedJavaScript={injectedJavaScript}
              onNavigationStateChange={handleNavigationStateChange}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              startInLoadingState={true}
              onLoadStart={() => setIsWebViewLoading(true)}
              onLoadEnd={() => setIsWebViewLoading(false)}
              renderLoading={() => (
                <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingTitle, { color: colors.text }]}>
                    {isBangla ? 'সুরক্ষিত চেকআউট লোড হচ্ছে...' : 'Loading Secure Checkout...'}
                  </Text>
                  <Text style={[styles.loadingSubtitle, { color: colors.textMuted }]}>
                    thrivingskill.com • {isBangla ? 'বিকাশ, নগদ ও কার্ড গেটওয়ে' : 'bKash, Nagad & Card Gateway'}
                  </Text>
                </View>
              )}
            />

            {/* Instant Celebration Overlay on Order Completion */}
            {isOrderCompleted && (
              <View style={[styles.successOverlay, { backgroundColor: colors.background }]}>
                <View style={[styles.successIconCircle, { backgroundColor: '#10B9811A' }]}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                </View>
                <Text style={[typography.h3, styles.successTitle, { color: colors.text }]}>
                  {isBangla ? 'পেমেন্ট সফল ও কোর্স আনলকড! 🎉' : 'Payment Successful! 🎉'}
                </Text>
                <Text style={[typography.body, styles.successMsg, { color: colors.textMuted }]}>
                  {isBangla
                    ? `আপনার "${course.title}" কোর্সটি সক্রিয় করা হয়েছে। এখনই প্রথম লেকচার শুরু হচ্ছে...`
                    : `You now have full lifetime access to "${course.title}". Launching course...`}
                </Text>
                {completedOrderId && (
                  <View style={[styles.orderIdBadge, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.orderIdText, { color: colors.primary }]}>
                      Order #{completedOrderId}
                    </Text>
                  </View>
                )}
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
              </View>
            )}
          </View>
        ) : (
          /* Secondary Fallback: Manual LearnPress Sync Sheet */
          <ScrollView
            contentContainerStyle={[
              styles.syncScroll,
              { paddingBottom: Math.max(insets.bottom, 24) + 16 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.syncHeaderBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sync" size={28} color={colors.primary} />
              <Text style={[styles.syncHeaderTitle, { color: colors.primary }]}>
                {isBangla ? 'অর্ডার ও এনরোলমেন্ট সিঙ্ক' : 'Order & Enrollment Sync'}
              </Text>
              <Text style={[styles.syncHeaderSub, { color: colors.text }]}>
                {isBangla
                  ? 'আপনি যদি পূর্বে ওয়েবসাইট থেকে অর্ডার করে থাকেন, তবে অ্যাকাউন্ট সিঙ্ক করে তাৎক্ষণিকভাবে কোর্সটি চালু করুন।'
                  : 'If you already completed payment on the website or another device, tap below to sync your order.'}
              </Text>
            </View>

            {/* Progressive 2-Step Access Sync Stepper Indicator */}
            <View style={[styles.stepperCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <View style={[styles.stepperTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.stepperFill, { backgroundColor: colors.primary, width: syncStep === 1 ? '50%' : '100%' }]} />
              </View>
              <View style={styles.stepperLabels}>
                <Text style={[styles.stepperLabelText, { color: colors.primary, fontWeight: '700' }]}>
                  {isAuthenticated ? '✓ 1. Signed In' : '1. Sign In'}
                </Text>
                <Text style={[styles.stepperLabelText, { color: syncStep === 2 ? colors.primary : colors.textMuted, fontWeight: syncStep === 2 ? '700' : '500' }]}>
                  2. Order Verification
                </Text>
              </View>
            </View>

            {isAuthenticated ? (
              <View style={[styles.accountInfoCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <Text style={[styles.signedInLabel, { color: colors.textMuted }]}>
                  {isBangla ? 'সাইন ইন করা অ্যাকাউন্ট:' : 'Signed In Account:'}
                </Text>
                <Text style={[styles.signedInEmail, { color: colors.text }]}>
                  {user?.email || user?.username}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.signInPromptCard, { backgroundColor: colors.surfaceCard, borderColor: colors.primary }]}
                onPress={() => {
                  onClose();
                  setAuthModalVisible(true);
                }}
              >
                <Ionicons name="log-in-outline" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.signInPromptTitle, { color: colors.text }]}>
                    {isBangla ? 'সাইন ইন করে সিঙ্ক করুন' : 'Sign In to Sync'}
                  </Text>
                  <Text style={[styles.signInPromptSub, { color: colors.textMuted }]}>
                    {isBangla ? 'অ্যাকাউন্টের সাথে কোর্স লিঙ্ক করতে সাইন ইন প্রয়োজন' : 'Sign in to link verified orders to your profile'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}

            <View style={[styles.orderInputBox, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {isBangla ? 'অর্ডার আইডি / বিকাশ TrxID (ঐচ্ছিক)' : 'Order ID / bKash TrxID (Optional)'}
              </Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                placeholder={isBangla ? 'যেমন: ১২৩৪৫ বা TRX987654' : 'e.g. 12345 or TRX987654'}
                placeholderTextColor={colors.textMuted}
                value={manualOrderId}
                onChangeText={setManualOrderId}
              />
            </View>

            <TouchableOpacity
              style={[styles.syncActionBtn, { backgroundColor: colors.primary }]}
              onPress={performManualSync}
              disabled={isSyncing}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Verify and sync order"
            >
              {isSyncing ? (
                <>
                  <ActivityIndicator size="small" color={colors.onPrimary} style={{ marginRight: 8 }} />
                  <Text style={[styles.syncActionBtnText, { color: colors.onPrimary }]}>
                    {syncStatusMsg || (isBangla ? 'যাচাই করা হচ্ছে...' : 'Verifying Order...')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.onPrimary} style={{ marginRight: 8 }} />
                  <Text style={[styles.syncActionBtnText, { color: colors.onPrimary }]}>
                    {isBangla ? 'এনরোলমেন্ট যাচাই ও চালু করুন' : 'Verify & Activate Course'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 10,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  headerPriceTag: {
    fontSize: 14,
    fontWeight: '900',
  },
  headerSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityStrip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  securityStripText: {
    fontSize: 11,
    fontWeight: '600',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  successOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  successMsg: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  orderIdBadge: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
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
  syncScroll: {
    padding: 20,
    gap: 16,
  },
  syncHeaderBox: {
    padding: 18,
    borderRadius: shape.large,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  syncHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  syncHeaderSub: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  accountInfoCard: {
    padding: 14,
    borderRadius: shape.medium,
    borderWidth: 1,
  },
  signedInLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  signedInEmail: {
    fontSize: 14,
    fontWeight: '700',
  },
  signInPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: shape.medium,
    borderWidth: 1.5,
  },
  signInPromptTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  signInPromptSub: {
    fontSize: 11,
    marginTop: 2,
  },
  orderInputBox: {
    padding: 16,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  syncActionBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  syncActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
