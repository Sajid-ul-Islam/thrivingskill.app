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
  Keyboard,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLearning } from '../../context/LearningContext';
import { Course } from '../../types';
import { CoursesService } from '../../services/api/coursesService';
import { triggerHaptic } from '../../utils/haptics';
import { shape } from '../../theme/shapes';
import { useResponsive } from '../../theme/responsive';
import { getBundleConfig } from '../../data/bundleCoursesMap';

export const MAX_SYNC_ATTEMPTS = 4;
export const RETRY_DELAYS_MS = [0, 1500, 2500, 4000];
export const CHECKOUT_AUTOFILL_KEY = '@thrivingskill_checkout_autofill_v1';

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
  const { isTablet } = useResponsive();
  const { t, isBangla } = useLanguage();
  const { user, isAuthenticated, setAuthModalVisible, updateUserProfile } = useAuth();
  const { userProgress, enrollInCourse, refreshCourses, loadCourseDetail } = useLearning();

  const [activeTab, setActiveTab] = useState<'checkout' | 'sync'>('checkout');

  // Billing Details Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // Checkout Execution State
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutWebUrl, setCheckoutWebUrl] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [loadProgress, setLoadProgress] = useState<number>(0);

  // WebView Ref
  const webViewRef = useRef<any>(null);

  // Focus Chaining Refs for Seamless Form UX
  const lastNameRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const phoneRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const cityRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const addressRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const emailRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const passwordRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const orderNotesRef = useRef<React.ElementRef<typeof TextInput>>(null);

  // Sync State & Hygiene
  const [isSyncing, setIsSyncing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartForwardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isCancelledRef = useRef<boolean>(false);

  const syncStep = isAuthenticated ? 2 : 1;

  // Hydrate user info & autofill cache
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    const hydrateDetails = async () => {
      try {
        const stored = await AsyncStorage.getItem(CHECKOUT_AUTOFILL_KEY);
        const cached = stored ? JSON.parse(stored) : null;

        if (!isMounted) return;

        if (user) {
          const parts = (user.displayName || user.username || '').trim().split(' ');
          setFirstName(cached?.firstName || user.first_name || parts[0] || '');
          setLastName(cached?.lastName || user.last_name || parts.slice(1).join(' ') || (parts[0] ? '' : 'Learner'));
          setEmail(cached?.email || user.email || '');
          setPhone(cached?.phone || user.phone || '');
          setCity(cached?.city || user.city || '');
          setAddress(cached?.address || '');
          setIsEditingDetails(!user.displayName || !user.email || !(cached?.phone || user.phone));
        } else if (cached) {
          setFirstName(cached.firstName || '');
          setLastName(cached.lastName || '');
          setEmail(cached.email || '');
          setPhone(cached.phone || '');
          setCity(cached.city || '');
          setAddress(cached.address || '');
          setIsEditingDetails(false);
        } else {
          setIsEditingDetails(true);
        }
      } catch {
        if (!isMounted) return;
        if (user) {
          const parts = (user.displayName || user.username || '').trim().split(' ');
          setFirstName(user.first_name || parts[0] || '');
          setLastName(user.last_name || parts.slice(1).join(' ') || (parts[0] ? '' : 'Learner'));
          setEmail(user.email || '');
          setPhone(user.phone || '');
          setCity(user.city || '');
        }
      }
    };

    hydrateDetails();
    return () => {
      isMounted = false;
    };
  }, [visible, user]);

  useEffect(() => {
    isMountedRef.current = true;
    isCancelledRef.current = false;
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      isMountedRef.current = false;
      isCancelledRef.current = true;
      showSub.remove();
      hideSub.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (cartForwardTimeoutRef.current) {
        clearTimeout(cartForwardTimeoutRef.current);
        cartForwardTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setIsSyncing(false);
      setIsPlacingOrder(false);
      setCheckoutWebUrl(null);
      setCanGoBack(false);
      setCurrentUrl('');
      setLoadProgress(0);
      setFormErrors({});
    }
  }, [visible, course?.id]);

  const bundleConfig = course ? getBundleConfig(course.id, course.title) : null;
  const isBundle = !!bundleConfig;
  const coursePriceBdt = course?.priceBdt || (course?.price ? Math.round(course.price * 120) : 0);
  const bundleSubtotalBdt = bundleConfig
    ? bundleConfig.subCourses.reduce((acc, c) => acc + c.priceBdt, 0)
    : (course?.originalPriceBdt || coursePriceBdt);
  const bundleDiscountBdt = isBundle ? Math.max(0, bundleSubtotalBdt - coursePriceBdt) : 0;
  const formattedPrice = `৳ ${coursePriceBdt.toLocaleString()}`;
  const formattedSubtotal = `৳ ${bundleSubtotalBdt.toLocaleString()}`;
  const formattedDiscount = `-৳ ${bundleDiscountBdt.toLocaleString()}`;

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
  const handleProceedToCheckout = () => {
    if (!course) return;

    if (!validateBillingDetails()) {
      setIsEditingDetails(true);
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
      // Persist details locally so learner never has to retype across checkouts
      const autofillData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
      };
      AsyncStorage.setItem(CHECKOUT_AUTOFILL_KEY, JSON.stringify(autofillData)).catch(() => {});

      if (isAuthenticated) {
        updateUserProfile({
          phone: phone.trim(),
          city: city.trim(),
        }, true).catch(() => {});
      }

      // Build official WooCommerce Checkout Cart URL
      const fullCheckoutUrl = `https://thrivingskill.com/checkout/?add-to-cart=${course.id}`;
      setCurrentUrl(fullCheckoutUrl);
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

  // Handle message from WebView (Bi-directional field auto-detection & synchronization)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'CHECKOUT_FIELD_AUTO_DETECT') {
        const { field, value } = data;
        if (!value) return;

        if (field === 'billing_phone') setPhone(value);
        if (field === 'billing_city') setCity(value);
        if (field === 'billing_first_name') setFirstName(value);
        if (field === 'billing_last_name') setLastName(value);
        if (field === 'billing_address_1') setAddress(value);

        AsyncStorage.getItem(CHECKOUT_AUTOFILL_KEY).then((res) => {
          const current = res ? JSON.parse(res) : {};
          const fieldMap: Record<string, string> = {
            billing_first_name: 'firstName',
            billing_last_name: 'lastName',
            billing_phone: 'phone',
            billing_email: 'email',
            billing_city: 'city',
            billing_address_1: 'address',
          };
          const mappedKey = fieldMap[field];
          if (mappedKey) {
            current[mappedKey] = value;
            AsyncStorage.setItem(CHECKOUT_AUTOFILL_KEY, JSON.stringify(current)).catch(() => {});
          }
        });

        if (isAuthenticated) {
          if (field === 'billing_phone') {
            updateUserProfile({ phone: value }, true).catch(() => {});
          } else if (field === 'billing_city') {
            updateUserProfile({ city: value }, true).catch(() => {});
          }
        }
      }
    } catch {}
  };

  // Open checkout directly in system web browser (Chrome / Safari)
  const handleOpenInExternalBrowser = () => {
    if (!course) return;
    const url = currentUrl || `https://thrivingskill.com/checkout/?add-to-cart=${course.id}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        isBangla ? 'ত্রুটি' : 'Error',
        isBangla ? 'ব্রাউজার খোলা সম্ভব হয়নি।' : 'Could not open external web browser.'
      );
    });
  };

  // Prompt before exiting active web checkout
  const handleBackOrExitCheckout = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return;
    }

    Alert.alert(
      isBangla ? 'চেকআউট থেকে ফিরে যাবেন?' : 'Leave Checkout?',
      isBangla
        ? 'আপনি কি পেমেন্ট প্রক্রিয়া স্থগিত করে কোর্সে ফিরে যেতে চান? আপনি যেকোনো সময় পুনরায় চেকআউট করতে পারবেন।'
        : 'Do you want to exit the checkout? You can resume or sync your enrollment at any time.',
      [
        {
          text: isBangla ? 'পেমেন্ট চালিয়ে যান' : 'Continue Payment',
          style: 'cancel',
        },
        {
          text: isBangla ? 'কোর্সে ফিরে যান' : 'Return to Course',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('light');
            setCheckoutWebUrl(null);
          },
        },
      ]
    );
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
        if (bundleConfig) {
          bundleConfig.subCourses.forEach((sub) => {
            enrollInCourse(sub.id);
          });
        }
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
  const handleWebViewNavChange = (navState: WebViewNavigation) => {
    const url = navState.url || '';
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(url);

    // Detect Order Completion Redirects
    if (
      url.includes('order-received') ||
      url.includes('thank-you') ||
      url.includes('checkout/success') ||
      (url.includes('key=wc_order_') && !url.includes('order-pay'))
    ) {
      triggerHaptic('success');
      setCheckoutWebUrl(null);
      if (course) {
        enrollInCourse(course.id);
        if (bundleConfig) {
          bundleConfig.subCourses.forEach((sub) => {
            enrollInCourse(sub.id);
          });
        }
        // Background verify with backend
        CoursesService.enrollCourse(course.id).catch(() => {});
        refreshCourses().catch(() => {});

        onClose();
        onSuccess(course.id);

        Alert.alert(
          isBangla ? 'ভর্তি সফল হয়েছে! 🎉' : 'Enrollment Successful! 🎉',
          isBangla
            ? `অভিনন্দন! "${course.title}" কোর্সটিতে আপনার অ্যাক্সেস চালু হয়েছে। এখনই প্রথম লেসন শুরু করুন।`
            : `Congratulations! Your access to "${course.title}" is now active. Let's begin learning!`,
          [
            {
              text: isBangla ? 'লেসন শুরু করুন' : 'Start First Lesson',
              onPress: () => onSuccess(course.id),
            },
          ]
        );
      }
    }
  };

  // Safe Request Interceptor: handles deep links (bKash/Nagad app) and skips /cart/
  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url || '';

    // 1. Intercept custom app schemes (bKash app, Nagad app, etc.)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url).catch(() => {});
        } else if (url.startsWith('intent://')) {
          const fallbackMatch = url.match(/browser_fallback_url=([^;&]+)/);
          if (fallbackMatch && fallbackMatch[1]) {
            const decodedFallback = decodeURIComponent(fallbackMatch[1]);
            // SEC-06: Validate that decodedFallback is an HTTPS URL from trusted payment/site origins
            try {
              const parsedFallback = new URL(decodedFallback);
              const isTrustedHost = [
                'thrivingskill.com',
                'sslcommerz.com',
                'bkash.com',
                'nagad.com.bd',
                'shurjopay.com.bd',
                'aamarpay.com'
              ].some((host) => parsedFallback.hostname === host || parsedFallback.hostname.endsWith(`.${host}`));

              if (parsedFallback.protocol === 'https:' && isTrustedHost) {
                Linking.openURL(decodedFallback).catch(() => {});
              }
            } catch {}
          }
        }
      }).catch(() => {});
      return false;
    }

    // 2. Fast-forward from /cart/ redirect directly to /checkout/
    if (url.includes('thrivingskill.com/cart') && !url.includes('checkout')) {
      if (cartForwardTimeoutRef.current) clearTimeout(cartForwardTimeoutRef.current);
      cartForwardTimeoutRef.current = setTimeout(() => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.location.replace('https://thrivingskill.com/checkout/');
            true;
          `);
        }
      }, 50);
    }

    return true;
  };

  // Smart Autofill and Mobile Styling Injected into WebView
  const injectedCheckoutJs = `
    (function() {
      function runAutofill() {
        try {
          // Auto-skip intermediate cart page
          if (window.location.pathname.includes('/cart')) {
            window.location.replace('https://thrivingskill.com/checkout/');
            return;
          }

          // Pre-populate billing fields on checkout
          if (window.location.pathname.includes('/checkout')) {
            function setField(id, val) {
              if (!val) return;
              var el = document.getElementById(id);
              if (el && (!el.value || el.value.trim() === '')) {
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }

            setField('billing_first_name', ${JSON.stringify(firstName.trim())});
            setField('billing_last_name', ${JSON.stringify(lastName.trim())});
            setField('billing_email', ${JSON.stringify(email.trim())});
            setField('billing_phone', ${JSON.stringify(phone.trim())});
            if (${JSON.stringify(city.trim())}) {
              setField('billing_city', ${JSON.stringify(city.trim())});
            }
            if (${JSON.stringify(address.trim())}) {
              setField('billing_address_1', ${JSON.stringify(address.trim())});
            }

            if (${JSON.stringify(orderNotes.trim())}) {
              setField('order_comments', ${JSON.stringify(orderNotes.trim())});
            }

            var terms = document.getElementById('terms');
            if (terms && !terms.checked) {
              terms.checked = true;
              terms.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Monitor field changes in web checkout to auto-save back to native app
            var fieldsToTrack = ['billing_first_name', 'billing_last_name', 'billing_email', 'billing_phone', 'billing_city', 'billing_address_1'];
            fieldsToTrack.forEach(function(fieldId) {
              var inputEl = document.getElementById(fieldId);
              if (inputEl && !inputEl.dataset.tsWatched) {
                inputEl.dataset.tsWatched = 'true';
                var changeHandler = function() {
                  try {
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'CHECKOUT_FIELD_AUTO_DETECT',
                        field: fieldId,
                        value: inputEl.value
                      }));
                    }
                  } catch(e) {}
                };
                inputEl.addEventListener('change', changeHandler);
                inputEl.addEventListener('blur', changeHandler);
              }
            });

            // Hook WooCommerce AJAX update event
            if (window.jQuery && !window.tsJqueryHooked) {
              window.tsJqueryHooked = true;
              window.jQuery(document.body).on('updated_checkout', function() {
                setTimeout(runAutofill, 80);
              });
            }

            // Remove distracting desktop header/footer and any breadcrumb/links for clean native drawer UX
            var hideSelectors = [
              '#masthead', '.site-header', 'header', '.header-wrap', '.main-header',
              '#top-bar', '.top-bar', '#top-header', '.top-header',
              '.breadcrumb', '.woocommerce-breadcrumb', '.entry-header', '.page-header',
              'footer', '.site-footer', '#colophon'
            ];
            hideSelectors.forEach(function(sel) {
              var els = document.querySelectorAll(sel);
              els.forEach(function(el) { el.style.display = 'none'; });
            });

            // Hide any SSLCommerz promotional links, logos, or external gateway banners
            var sslElements = document.querySelectorAll('a[href*="sslcommerz"], a[href*="sslcommerz.com"], .sslcommerz-logo, #sslcommerz_logo, .payment_method_sslcommerz a, img[src*="sslcommerz"]');
            sslElements.forEach(function(el) {
              el.style.display = 'none';
              if (el.tagName === 'A') {
                el.removeAttribute('href');
              }
            });

            // Inject responsive CSS
            var style = document.getElementById('ts-app-custom-style');
            if (!style) {
              style = document.createElement('style');
              style.id = 'ts-app-custom-style';
              style.innerHTML = \`
                #masthead, .site-header, header, .header-wrap, .main-header, #top-bar, .top-bar, #top-header, .top-header, .breadcrumb, .woocommerce-breadcrumb, .entry-header, .page-header, footer, .site-footer, #colophon { display: none !important; }
                body { padding-top: 6px !important; margin: 0 !important; }
                .woocommerce-NoticeGroup, .woocommerce-error { margin: 10px !important; border-radius: 8px !important; }
                #customer_details { margin-bottom: 20px !important; }
                .woocommerce-checkout-review-order { background: #F8FAFC !important; border-radius: 14px !important; padding: 16px !important; border: 1px solid #E2E8F0 !important; }
                #place_order { background-color: #102F53 !important; color: #FFFFFF !important; font-size: 16px !important; padding: 14px 20px !important; border-radius: 10px !important; width: 100% !important; font-weight: 800 !important; cursor: pointer !important; margin-top: 14px !important; }
                #place_order:hover { background-color: #0b223d !important; }
                a[href*="sslcommerz"], a[href*="sslcommerz.com"], .sslcommerz-logo, #sslcommerz_logo, .payment_method_sslcommerz a, img[src*="sslcommerz"] { display: none !important; pointer-events: none !important; }
              \`;
              document.head.appendChild(style);
            }
          }
        } catch (err) {
          console.error('TS Autofill error:', err);
        }
      }

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        runAutofill();
      } else {
        document.addEventListener('DOMContentLoaded', runAutofill);
      }
      setTimeout(runAutofill, 400);
      setTimeout(runAutofill, 1200);
      setTimeout(runAutofill, 2500);

      // MutationObserver for dynamic WooCommerce checkout re-renders
      try {
        var observer = new MutationObserver(function() {
          var phoneInput = document.getElementById('billing_phone');
          if (phoneInput && !phoneInput.value) {
            runAutofill();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      } catch(e) {}
    })();
    true;
  `;

  if (!course) return null;

  // View Mode 1: Native Bottom Drawer In-App Checkout Sheet
  if (checkoutWebUrl) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={handleBackOrExitCheckout}
      >
        <StatusBar style="light" />
        <View style={styles.drawerBackdrop}>
          {/* Dimmed backdrop area above the drawer - tap to dismiss */}
          <TouchableOpacity
            style={styles.drawerBackdropDismiss}
            activeOpacity={1}
            onPress={handleBackOrExitCheckout}
            accessibilityRole="button"
            accessibilityLabel="Dismiss checkout sheet"
          />

          {/* Bottom Drawer Container */}
          <View
            style={[
              styles.drawerSheet,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                height: isTablet ? '88%' : '92%',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            {/* Tactile Drag Handle */}
            <View style={styles.drawerHandleRow}>
              <View style={[styles.drawerHandle, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }]} />
            </View>

            {/* Native Sheet Header - Clean, No Browser URL / Links */}
            <View style={[styles.drawerHeader, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
              <TouchableOpacity
                style={[styles.drawerCloseBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                onPress={handleBackOrExitCheckout}
                accessibilityRole="button"
                accessibilityLabel={canGoBack ? 'Go back' : 'Cancel checkout'}
              >
                <Ionicons name={canGoBack ? 'arrow-back' : 'close'} size={18} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.drawerTitleCenter}>
                <Text style={[styles.drawerTitleText, { color: colors.text }]} numberOfLines={1}>
                  {isBangla ? 'নিরাপদ চেকআউট' : 'Complete Payment'}
                </Text>
                <View style={styles.drawerSecurityTag}>
                  <Ionicons name="shield-checkmark" size={11} color="#10B981" />
                  <Text style={styles.drawerSecurityTagText}>
                    {isBangla ? 'SSL সুরক্ষিত গেটওয়ে' : 'Secure SSL Gateway'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.drawerCloseBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                onPress={() => webViewRef.current?.reload()}
                accessibilityRole="button"
                accessibilityLabel="Reload checkout"
              >
                <Ionicons name="reload" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Slim Animated Loading Progress Bar */}
            {loadProgress < 1 && (
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(8, Math.round(loadProgress * 100))}%` },
                  ]}
                />
              </View>
            )}

            {/* Embedded Web View inside Native Drawer */}
            <WebView
              ref={webViewRef}
              source={{ uri: checkoutWebUrl }}
              allowFileAccess={false}
              allowUniversalAccessFromFileURLs={false}
              onNavigationStateChange={handleWebViewNavChange}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              onLoadProgress={(syntheticEvent) => {
                setLoadProgress(syntheticEvent.nativeEvent.progress);
              }}
              injectedJavaScript={injectedCheckoutJs}
              onMessage={handleWebViewMessage}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={[styles.drawerLoadingState, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
                  <View style={styles.drawerLoadingIconWrap}>
                    <ActivityIndicator size="large" color="#FFB606" />
                  </View>
                  <Text style={[styles.drawerLoadingTitle, { color: colors.text }]}>
                    {isBangla ? 'নিরাপদ চেকআউট লোড হচ্ছে...' : 'Connecting to Secure Checkout...'}
                  </Text>
                  <Text style={[styles.drawerLoadingSubtitle, { color: colors.textMuted }]}>
                    {isBangla
                      ? 'নিরাপদ পেমেন্ট গেটওয়ে প্রস্তুত হচ্ছে...'
                      : 'Preparing Secure Payment Gateway, please wait...'}
                  </Text>
                </View>
              )}
              style={styles.drawerWebView}
              domStorageEnabled={true}
              javaScriptEnabled={true}
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              allowsBackForwardNavigationGestures={true}
              originWhitelist={['https://*']}
            />

            {/* Bottom Safe Area Padding */}
            <View style={{ height: Math.max(insets.bottom, 16), backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }} />
          </View>
        </View>
      </Modal>
    );
  }

  // View Mode 2: In-App Order Review & Checkout Bottom Sheet
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.backdrop, isTablet && styles.backdropTablet]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.overlayClose}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss checkout dialog"
        />
        <View
          style={[
            styles.modalCard,
            isTablet && styles.modalCardTablet,
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
            accessibilityLabel="Close checkout modal"
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[
              styles.scroll,
              isKeyboardVisible && { paddingBottom: 160 },
            ]}
          >
            {/* Header Badge */}
            <View style={styles.headerRow}>
              <View style={[styles.shieldBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="bag-check-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: 28 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isBangla ? 'কোর্স ভর্তি ও চেকআউট' : 'Checkout & Enrollment'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {isBangla ? 'বিকাশ, নগদ, কার্ড ও ব্যাংকিং এর মাধ্যমে নিরাপদ পেমেন্ট' : 'Secure payment via Mobile Banking, Cards & Net Banking'}
                </Text>
              </View>
            </View>

            {/* Stepper Access Info */}
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
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveTab('checkout');
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'checkout' }}
                accessibilityLabel={isBangla ? 'অর্ডার ও চেকআউট' : 'Order & Checkout'}
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
                  {isBangla ? 'অর্ডার ও চেকআউট' : 'Order & Checkout'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeTab === 'sync' && [styles.activeTabBtn, { backgroundColor: colors.surface }],
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveTab('sync');
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'sync' }}
                accessibilityLabel={isBangla ? 'অ্যাক্সেস সিঙ্ক' : 'Sync Access'}
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
                {/* Section: Your Order Summary (CR-5 & Live Site Aligned) */}
                <View
                  style={[
                    styles.orderSummaryCard,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.orderSummaryTitle, { color: colors.text, marginBottom: 0 }]}>
                      {isBangla ? 'আপনার অর্ডার' : 'Your order'}
                    </Text>
                    {isBundle && (
                      <View style={{ backgroundColor: '#102F53', paddingHorizontal: 8, paddingVertical: 3, borderRadius: shape.full }}>
                        <Text style={{ color: '#FFB606', fontSize: 10, fontWeight: '800' }}>
                          {isBangla ? 'স্পেশাল বান্ডেল (৫টি কোর্স)' : 'SPECIAL BUNDLE (5 COURSES)'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Main Item Row */}
                  <View style={styles.orderItemRow}>
                    <Text style={[styles.orderItemName, { color: colors.text }]} numberOfLines={2}>
                      {course.title} × 1
                    </Text>
                    <Text style={[styles.orderItemPrice, { color: colors.text }]}>
                      {formattedPrice}
                    </Text>
                  </View>

                  {/* Bundle Sub-Courses Breakdown (CR-5) */}
                  {isBundle && bundleConfig && (
                    <View style={{ marginVertical: 8, padding: 10, backgroundColor: colors.surfaceSubtle, borderRadius: shape.medium }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                        {isBangla ? 'বান্ডেলে অন্তর্ভুক্ত ৫টি কোর্স (সবগুলো আনলক হবে):' : 'Included 5 courses in this bundle (all unlock):'}
                      </Text>
                      {bundleConfig.subCourses.map((sub, idx) => (
                        <View key={sub.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2.5 }}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <Text style={{ fontSize: 11, color: colors.text, flex: 1 }} numberOfLines={1}>
                            {idx + 1}. {sub.title}
                          </Text>
                          <Text style={{ fontSize: 10, color: colors.textMuted, textDecorationLine: 'line-through' }}>
                            ৳{sub.priceBdt}
                          </Text>
                        </View>
                      ))}
                      <View style={{ marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>
                          {isBangla ? `বান্ডেল ছাড় (${bundleConfig.discountPercent}% OFF)` : `Bundle Discount Applied (-${bundleConfig.discountPercent}%)`}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>
                          {formattedDiscount}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.orderSummaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                      {isBangla ? 'সাবটোটাল' : 'Subtotal'}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {isBundle ? formattedSubtotal : formattedPrice}
                    </Text>
                  </View>

                  {isBundle && (
                    <View style={styles.orderSummaryRow}>
                      <Text style={[styles.summaryLabel, { color: '#10B981' }]}>
                        {isBangla ? 'বান্ডেল ছাড়' : 'Bundle Discount'}
                      </Text>
                      <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                        {formattedDiscount}
                      </Text>
                    </View>
                  )}

                  <View style={styles.orderSummaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                      {isBangla ? 'ডেলিভারি ফি' : 'Delivery Fee'}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.textMuted }]}>
                      ৳ 0 ({isBangla ? 'ডিজিটাল কন্টেন্ট' : 'Digital Content'})
                    </Text>
                  </View>

                  <View style={styles.orderSummaryRow}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>
                      {isBangla ? 'সর্বমোট' : 'Total'}
                    </Text>
                    <Text style={[styles.totalValue, { color: isDark ? colors.brandGold : '#102F53' }]}>
                      {formattedPrice}
                    </Text>
                  </View>
                </View>

                {/* Section: Learner Details Card (Smooth Auto-Preload) */}
                <View style={[styles.learnerSummaryCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <View style={styles.learnerHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={[styles.learnerAvatarIcon, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="person" size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.learnerTitle, { color: colors.text }]} numberOfLines={1}>
                          {isAuthenticated
                            ? `${firstName} ${lastName}`.trim() || user?.displayName || user?.username
                            : isBangla
                            ? 'অতিথি শিক্ষার্থী'
                            : 'Guest Learner'}
                        </Text>
                        <Text style={[styles.learnerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                          {email || (isBangla ? 'ইমেল তথ্য প্রয়োজন' : 'Email required')} {phone ? `• ${phone}` : ''} {city ? `• ${city}` : ''}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.editDetailsBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setIsEditingDetails(!isEditingDetails);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Edit billing details"
                    >
                      <Ionicons
                        name={isEditingDetails ? 'checkmark-outline' : 'pencil-outline'}
                        size={14}
                        color={colors.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.editDetailsBtnText, { color: colors.primary }]}>
                        {isEditingDetails
                          ? isBangla ? 'ঠিক আছে' : 'Done'
                          : isBangla ? 'পরিবর্তন' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Expandable Form Fields for Editing or Guest Registration */}
                  {isEditingDetails && (
                    <View style={styles.expandedFieldsContainer}>
                      <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 10 }]} />

                      {/* First & Last Name */}
                      <View style={styles.nameRow}>
                        <View style={styles.nameCol}>
                          <Text style={[styles.inputLabel, { color: colors.text }]}>
                            {isBangla ? 'নামের প্রথম অংশ' : 'First name'} <Text style={styles.requiredAsterisk}>*</Text>
                          </Text>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.surface,
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
                            autoCapitalize="words"
                            autoComplete="name-given"
                            textContentType="givenName"
                            returnKeyType="next"
                            onSubmitEditing={() => lastNameRef.current?.focus()}
                            blurOnSubmit={false}
                            accessibilityLabel={isBangla ? 'নামের প্রথম অংশ' : 'First name'}
                          />
                        </View>

                        <View style={styles.nameCol}>
                          <Text style={[styles.inputLabel, { color: colors.text }]}>
                            {isBangla ? 'নামের শেষ অংশ' : 'Last name'} <Text style={styles.requiredAsterisk}>*</Text>
                          </Text>
                          <TextInput
                            ref={lastNameRef}
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.surface,
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
                            autoCapitalize="words"
                            autoComplete="name-family"
                            textContentType="familyName"
                            returnKeyType="next"
                            onSubmitEditing={() => phoneRef.current?.focus()}
                            blurOnSubmit={false}
                            accessibilityLabel={isBangla ? 'নামের শেষ অংশ' : 'Last name'}
                          />
                        </View>
                      </View>

                      {/* Phone Number */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>
                          {isBangla ? 'ফোন নম্বর (পেমেন্ট ও এসএমএস নোটিফিকেশন)' : 'Phone (Payment & SMS confirmation)'} <Text style={styles.requiredAsterisk}>*</Text>
                        </Text>
                        <TextInput
                          ref={phoneRef}
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.surface,
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
                          autoComplete="tel"
                          textContentType="telephoneNumber"
                          returnKeyType="next"
                          onSubmitEditing={() => cityRef.current?.focus()}
                          blurOnSubmit={false}
                          accessibilityLabel={isBangla ? 'ফোন নম্বর' : 'Phone number'}
                        />
                      </View>

                      {/* City / District & Address (Autofilled for native checkout) */}
                      <View style={styles.nameRow}>
                        <View style={styles.nameCol}>
                          <Text style={[styles.inputLabel, { color: colors.text }]}>
                            {isBangla ? 'জেলা / শহর' : 'Town / City'}
                          </Text>
                          <TextInput
                            ref={cityRef}
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                color: colors.text,
                              },
                            ]}
                            value={city}
                            onChangeText={(txt) => setCity(txt)}
                            placeholder="e.g. Dhaka"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="words"
                            autoComplete="postal-address-locality"
                            textContentType="addressCity"
                            returnKeyType="next"
                            onSubmitEditing={() => addressRef.current?.focus()}
                            blurOnSubmit={false}
                            accessibilityLabel={isBangla ? 'জেলা বা শহর' : 'City or Town'}
                          />
                        </View>

                        <View style={styles.nameCol}>
                          <Text style={[styles.inputLabel, { color: colors.text }]}>
                            {isBangla ? 'ঠিকানা (ঐচ্ছিক)' : 'Street Address'}
                          </Text>
                          <TextInput
                            ref={addressRef}
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                color: colors.text,
                              },
                            ]}
                            value={address}
                            onChangeText={(txt) => setAddress(txt)}
                            placeholder="e.g. Dhanmondi, Rd 27"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="words"
                            autoComplete="street-address"
                            textContentType="fullStreetAddress"
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                            blurOnSubmit={false}
                            accessibilityLabel={isBangla ? 'ঠিকানা' : 'Street Address'}
                          />
                        </View>
                      </View>

                      {/* Email address */}
                      <View style={styles.fieldGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>
                          {isBangla ? 'ইমেল ঠিকানা' : 'Email address'} <Text style={styles.requiredAsterisk}>*</Text>
                        </Text>
                        <TextInput
                          ref={emailRef}
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.surface,
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
                          autoCorrect={false}
                          autoComplete="email"
                          textContentType="emailAddress"
                          returnKeyType={!isAuthenticated ? 'next' : 'done'}
                          onSubmitEditing={() => {
                            if (!isAuthenticated) {
                              passwordRef.current?.focus();
                            } else {
                              orderNotesRef.current?.focus();
                            }
                          }}
                          blurOnSubmit={false}
                          accessibilityLabel={isBangla ? 'ইমেল ঠিকানা' : 'Email address'}
                        />
                      </View>

                      {/* Password (for new student account registration) */}
                      {!isAuthenticated && (
                        <View style={styles.fieldGroup}>
                          <Text style={[styles.inputLabel, { color: colors.text }]}>
                            {isBangla ? 'পাসওয়ার্ড তৈরি করুন' : 'Account Password'} <Text style={styles.requiredAsterisk}>*</Text>
                          </Text>
                          <View style={styles.passwordWrapper}>
                            <TextInput
                              ref={passwordRef}
                              style={[
                                styles.input,
                                styles.passwordInput,
                                {
                                  backgroundColor: colors.surface,
                                  borderColor: formErrors.password ? '#DC2626' : colors.border,
                                  color: colors.text,
                                },
                              ]}
                              value={password}
                              onChangeText={(txt) => {
                                setPassword(txt);
                                if (formErrors.password) setFormErrors((p) => ({ ...p, password: '' }));
                              }}
                              placeholder="Create account password"
                              placeholderTextColor={colors.textMuted}
                              secureTextEntry={!showPassword}
                              autoCapitalize="none"
                              autoCorrect={false}
                              autoComplete="new-password"
                              textContentType="newPassword"
                              returnKeyType="next"
                              onSubmitEditing={() => orderNotesRef.current?.focus()}
                              blurOnSubmit={false}
                              accessibilityLabel={isBangla ? 'পাসওয়ার্ড' : 'Password'}
                            />
                            <TouchableOpacity
                              style={styles.eyeToggle}
                              onPress={() => {
                                triggerHaptic('light');
                                setShowPassword(!showPassword);
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                          ref={orderNotesRef}
                          style={[
                            styles.input,
                            styles.textArea,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          value={orderNotes}
                          onChangeText={setOrderNotes}
                          placeholder={isBangla ? 'কোর্স সংক্রান্ত কোনো বিশেষ নির্দেশনা থাকলে লিখুন...' : 'Notes about your order, e.g. special requests'}
                          placeholderTextColor={colors.textMuted}
                          multiline
                          numberOfLines={2}
                          returnKeyType="done"
                          accessibilityLabel={isBangla ? 'অতিরিক্ত তথ্য' : 'Order Notes'}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Section: SSLCommerz Payment Gateway Notice */}
                <View
                  style={[
                    styles.sslCard,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.sslHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="shield-checkmark" size={16} color="#059669" />
                      <Text style={[styles.sslTitle, { color: colors.text }]}>
                        {isBangla ? 'নিরাপদ পেমেন্ট গেটওয়ে' : 'Secure Payment Gateway'}
                      </Text>
                    </View>
                    <View style={styles.sslBadge}>
                      <Text style={styles.sslBadgeText}>22+ Payment Methods</Text>
                    </View>
                  </View>

                  <Text style={[styles.sslDesc, { color: colors.textMuted }]}>
                    {isBangla
                      ? 'বিকাশ, নগদ, রকেট, ভিসা, মাস্টারকার্ড ও সকল ইন্টারনেট ব্যাংকিংয়ের মাধ্যমে তাত্ক্ষণিক স্বয়ংক্রিয় পেমেন্ট।'
                      : 'Pay securely via bKash, Nagad, Rocket, VISA, Mastercard, or Internet Banking.'}
                  </Text>

                  {/* Payment Brands Pills */}
                  <View style={styles.badgeChipsRow}>
                    {['bKash', 'Nagad', 'Rocket', 'VISA', 'Mastercard', 'Internet Banking'].map((b) => (
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

                {/* Terms & Conditions Checkbox */}
                <TouchableOpacity
                  style={styles.termsRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    triggerHaptic('selection');
                    setAgreedToTerms(!agreedToTerms);
                    if (formErrors.terms) setFormErrors((p) => ({ ...p, terms: '' }));
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreedToTerms }}
                  accessibilityLabel={isBangla ? 'ওয়েবসাইট শর্তাবলী মেনে নিচ্ছি' : 'I agree to the terms and conditions'}
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
                    {isBangla
                      ? 'আমি ওয়েবসাইটটির সাধারণ শর্তাবলী ও নীতিমালা মেনে নিচ্ছি'
                      : 'I have read and agree to the website terms and conditions'}{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                </TouchableOpacity>

                {/* PRIMARY CTA: Smooth Proceed to Secure Checkout */}
                <TouchableOpacity
                  style={[
                    styles.placeOrderBtn,
                    {
                      backgroundColor: '#102F53',
                    },
                  ]}
                  onPress={handleProceedToCheckout}
                  disabled={isPlacingOrder}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={isBangla ? 'নিরাপদ চেকআউট শুরু করুন' : 'Proceed to Secure Checkout'}
                >
                  {isPlacingOrder ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                      <Text style={styles.placeOrderBtnText}>
                        {isBangla ? 'অর্ডার প্রস্তুত হচ্ছে...' : 'Preparing Checkout...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.placeOrderBtnText}>
                        {isBangla ? 'নিরাপদ চেকআউট শুরু করুন (PROCEED)' : 'PROCEED TO SECURE CHECKOUT'}
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
                  accessibilityRole="button"
                  accessibilityLabel={
                    isAuthenticated
                      ? isBangla
                        ? 'অ্যাকাউন্ট এনরোলমেন্ট সিঙ্ক করুন'
                        : 'Sync Account Enrollments'
                      : isBangla
                      ? 'থ্রাইভিং স্কিলস অ্যাকাউন্টে সাইন ইন'
                      : 'Sign In to Sync Account'
                  }
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
                {isBangla
                  ? '২৫৬-বিট ব্যাংক গ্রেড নিরাপদ পেমেন্ট এনক্রিপশন'
                  : '256-Bit Bank Grade Secure Payment Encryption'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Native Bottom Drawer Checkout Viewer Styles
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  drawerBackdropDismiss: {
    flex: 1,
  },
  drawerSheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 24,
  },
  drawerHandleRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  drawerHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  drawerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTitleCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  drawerTitleText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  drawerSecurityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  drawerSecurityTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  progressBarTrack: {
    height: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFB606',
  },
  drawerWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  drawerLoadingState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    paddingHorizontal: 24,
  },
  drawerLoadingIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#102F53',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  drawerLoadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  drawerLoadingSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Legacy fullScreen aliases
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullScreenHeader: {
    backgroundColor: '#102F53',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitleCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerSecurityText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  headerHostText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullScreenWebView: {
    flex: 1,
  },
  fullScreenLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinnerBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#102F53',
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  loadingSubtitle: {
    fontSize: 13,
  },

  // Bottom Sheet Modal Styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  backdropTablet: {
    justifyContent: 'center',
    alignItems: 'center',
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
  modalCardTablet: {
    maxWidth: 620,
    width: '92%',
    alignSelf: 'center',
    borderRadius: 28,
    borderBottomWidth: 1,
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
    marginBottom: 16,
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

  // Learner Summary Card
  learnerSummaryCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  learnerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  learnerAvatarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  learnerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  editDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  editDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandedFieldsContainer: {
    marginTop: 4,
  },

  // Input Fields
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  nameCol: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 5,
  },
  requiredAsterisk: {
    color: '#DC2626',
    fontWeight: '700',
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
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
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
    paddingTop: 8,
  },

  // Order Summary Card
  orderSummaryCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  orderSummaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderItemName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    paddingRight: 10,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  summaryLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
  },

  // SSLCommerz Card
  sslCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  sslHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sslTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sslBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sslBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  sslDesc: {
    fontSize: 11.5,
    lineHeight: 17,
    marginBottom: 10,
  },
  badgeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Terms & Conditions
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  // Action Buttons
  placeOrderBtn: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#102F53',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  openBrowserBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  openBrowserBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Member Access Sync View Styles
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
    marginTop: 10,
  },
  guaranteeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepperContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
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
