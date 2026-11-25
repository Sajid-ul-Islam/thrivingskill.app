import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Keyboard, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useLearning } from '../../../context/LearningContext';
import { Course } from '../../../types';
import { CoursesService } from '../../../services/api/coursesService';
import { Env } from '../../../config/env';
import {
  ServerProductData,
  isTrustedCheckoutOrigin,
  parseWooOrderFromUrl,
  resolveServerCheckoutPricingAndBundle,
} from '../../../services/checkout/checkoutHelpers';
import { triggerHaptic } from '../../../utils/haptics';

export const CHECKOUT_AUTOFILL_KEY = '@thrivingskill_checkout_autofill_v1';
export const MAX_SYNC_ATTEMPTS = 4;
export const RETRY_DELAYS_MS = [0, 1500, 2500, 4000];

export function usePaymentCheckout({
  visible,
  course,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}) {
  const { t, isBangla } = useLanguage();
  const { user, isAuthenticated, setAuthModalVisible, updateUserProfile } = useAuth();
  const { courses, confirmServerEnrollments, refreshCourses } = useLearning();

  const [activeTab, setActiveTab] = useState<'checkout' | 'sync'>('checkout');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [serverProductData, setServerProductData] = useState<ServerProductData | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutWebUrl, setCheckoutWebUrl] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const webViewRef = useRef<any>(null);
  const hasCompletedPurchaseRef = useRef(false);
  const isVerifyingCheckoutRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartForwardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isCancelledRef = useRef(false);

  const lastNameRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const phoneRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const cityRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const addressRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const emailRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const orderNotesRef = useRef<React.ElementRef<typeof TextInput>>(null);

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
          setLastName(
            cached?.lastName ||
              user.last_name ||
              parts.slice(1).join(' ') ||
              (parts[0] ? '' : 'Learner')
          );
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
        if (isMounted && user) {
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
    if (!visible) return;
    setIsSyncing(false);
    setIsVerifyingPayment(false);
    setIsPlacingOrder(false);
    setCheckoutWebUrl(null);
    setCanGoBack(false);
    setLoadProgress(0);
    setFormErrors({});
    setAgreedToTerms(false);
    setServerProductData(null);
    hasCompletedPurchaseRef.current = false;
    isVerifyingCheckoutRef.current = false;

    if (!course?.id) return;
    let active = true;
    CoursesService.getWooCommerceProductPricing(course.id)
      .then((product) => {
        if (active && product) setServerProductData(product);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [visible, course?.id]);

  const resolvedPricing = course
    ? resolveServerCheckoutPricingAndBundle(course, serverProductData, courses)
    : {
        isBundle: false,
        priceBdt: 0,
        subtotalBdt: 0,
        discountBdt: 0,
        discountPercent: 0,
        subCourses: [],
      };

  const validateBillingDetails = (): boolean => {
    const errors: Record<string, string> = {};
    if (!firstName.trim())
      errors.firstName = isBangla ? 'নামের প্রথম অংশ আবশ্যক' : 'First name is required';
    if (!lastName.trim())
      errors.lastName = isBangla ? 'নামের শেষ অংশ আবশ্যক' : 'Last name is required';
    if (!phone.trim()) errors.phone = isBangla ? 'ফোন নম্বর আবশ্যক' : 'Phone is required';
    if (!email.trim() || !email.includes('@')) {
      errors.email = isBangla ? 'সঠিক ইমেল ঠিকানা আবশ্যক' : 'Valid email is required';
    }
    if (!agreedToTerms) {
      errors.terms = isBangla
        ? 'শর্তাবলী মেনে নেওয়া আবশ্যক'
        : 'You must accept the terms and conditions';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToCheckout = () => {
    if (!course) return;
    if (!isAuthenticated) {
      onClose();
      setAuthModalVisible(true);
      return;
    }
    if (resolvedPricing.priceBdt === 0) {
      performEnrollmentSync();
      return;
    }
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
    hasCompletedPurchaseRef.current = false;
    try {
      AsyncStorage.setItem(
        CHECKOUT_AUTOFILL_KEY,
        JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim(),
        })
      ).catch(() => {});

      updateUserProfile({ phone: phone.trim(), city: city.trim() }, true).catch(() => {});
      setCheckoutWebUrl(`${Env.SITE_URL}/checkout/?add-to-cart=${course.id}`);
    } catch (err: any) {
      Alert.alert(
        isBangla ? 'ত্রুটি' : 'Checkout Error',
        err?.message || (isBangla ? 'অর্ডার প্রক্রিয়া শুরু করা যায়নি।' : 'Could not initiate checkout.')
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleWebViewMessage = (event: any) => {
    const messageOriginUrl = event?.nativeEvent?.url;
    if (!isTrustedCheckoutOrigin(messageOriginUrl, Env.SITE_URL)) return;

    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type !== 'CHECKOUT_FIELD_AUTO_DETECT') return;
      const { field, value } = data;
      if (!value || typeof value !== 'string') return;

      if (field === 'billing_phone') setPhone(value);
      if (field === 'billing_city') setCity(value);
      if (field === 'billing_first_name') setFirstName(value);
      if (field === 'billing_last_name') setLastName(value);
      if (field === 'billing_address_1') setAddress(value);

      AsyncStorage.getItem(CHECKOUT_AUTOFILL_KEY)
        .then((res) => {
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
        })
        .catch(() => {});

      if (isAuthenticated && (field === 'billing_phone' || field === 'billing_city')) {
        updateUserProfile(
          field === 'billing_phone' ? { phone: value } : { city: value },
          true
        ).catch(() => {});
      }
    } catch {}
  };

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
        { text: isBangla ? 'পেমেন্ট চালিয়ে যান' : 'Continue Payment', style: 'cancel' },
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

  const verifyCheckoutCompletionOnServer = useCallback(
    async (redirectUrl: string) => {
      if (!course || hasCompletedPurchaseRef.current || isVerifyingCheckoutRef.current) return;
      isVerifyingCheckoutRef.current = true;
      setIsVerifyingPayment(true);
      try {
        const orderInfo = parseWooOrderFromUrl(redirectUrl, Env.SITE_URL);
        const pollDelaysMs = RETRY_DELAYS_MS.slice(0, MAX_SYNC_ATTEMPTS);
        let verification = await CoursesService.verifyServerEnrollment(course.id, orderInfo);

        for (let attempt = 1; attempt < pollDelaysMs.length; attempt++) {
          if (!isMountedRef.current || isCancelledRef.current) return;
          if (
            verification.enrolled ||
            verification.reason === 'payment_failed' ||
            verification.reason === 'payment_cancelled' ||
            verification.reason === 'unauthenticated'
          ) {
            break;
          }

          await new Promise<void>((resolve) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              timeoutRef.current = null;
              resolve();
            }, pollDelaysMs[attempt]);
          });

          if (!isMountedRef.current || isCancelledRef.current) return;
          verification = await CoursesService.verifyServerEnrollment(course.id, orderInfo);
        }

        if (!isMountedRef.current || isCancelledRef.current) return;

        if (verification.enrolled) {
          hasCompletedPurchaseRef.current = true;
          confirmServerEnrollments(
            verification.enrolledCourseIds.length > 0 ? verification.enrolledCourseIds : [course.id]
          );
          refreshCourses().catch(() => {});
          triggerHaptic('success');
          setCheckoutWebUrl(null);
          onClose();
          onSuccess(course.id);
          Alert.alert(
            isBangla ? 'ভর্তি সফল হয়েছে! 🎉' : 'Enrollment Successful! 🎉',
            isBangla
              ? `অভিনন্দন! "${course.title}" কোর্সটিতে আপনার অ্যাক্সেস চালু হয়েছে। এখনই প্রথম লেসন শুরু করুন।`
              : `Congratulations! Your access to "${course.title}" is now active. Let's begin learning!`,
            [{ text: isBangla ? 'ঠিক আছে' : 'Got it' }]
          );
          return;
        }

        setCheckoutWebUrl(null);
        triggerHaptic('error');
        if (
          verification.reason === 'payment_failed' ||
          verification.reason === 'payment_cancelled'
        ) {
          Alert.alert(
            isBangla ? 'পেমেন্ট সম্পন্ন হয়নি' : 'Payment Not Completed',
            isBangla
              ? 'পেমেন্ট বাতিল বা ব্যর্থ হওয়ায় কোর্সটি আনলক করা হয়নি। আপনি যেকোনো সময় পুনরায় চেষ্টা করতে পারেন।'
              : 'Your payment was cancelled or failed, so the course remains locked. You can retry checkout at any time.'
          );
          return;
        }

        setActiveTab('sync');
        Alert.alert(
          isBangla ? 'পেমেন্ট নিশ্চিতকরণ মুলতুবি আছে' : 'Payment Confirmation Pending',
          isBangla
            ? 'সার্ভারে পেমেন্ট ও এনরোলমেন্ট এখনো নিশ্চিত হয়নি। পেমেন্ট সম্পন্ন হলে নিচের "অ্যাকাউন্ট এনরোলমেন্ট সিঙ্ক করুন" বাটনে ট্যাপ করুন।'
            : 'The server has not confirmed your enrollment yet. Once your payment completes, tap "Sync Account Enrollments" below to verify and unlock access.'
        );
      } catch {
        if (!isMountedRef.current || isCancelledRef.current) return;
        setCheckoutWebUrl(null);
        setActiveTab('sync');
        Alert.alert(
          isBangla ? 'যাচাই করা যায়নি' : 'Verification Unavailable',
          isBangla
            ? 'সার্ভারের সাথে এনরোলমেন্ট যাচাই করা যায়নি। অনুগ্রহ করে সিঙ্ক ট্যাব থেকে পুনরায় চেষ্টা করুন।'
            : 'Could not verify your enrollment with the server right now. Please tap "Sync Account Enrollments" to check your status.'
        );
      } finally {
        isVerifyingCheckoutRef.current = false;
        if (isMountedRef.current) setIsVerifyingPayment(false);
      }
    },
    [confirmServerEnrollments, course, isBangla, onClose, onSuccess, refreshCourses]
  );

  // Short background auto-poll when slow SSLCommerz webhook lands user on the sync tab
  useEffect(() => {
    if (
      !visible ||
      activeTab !== 'sync' ||
      !course ||
      !isAuthenticated ||
      hasCompletedPurchaseRef.current
    ) {
      return;
    }
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const runAutoPoll = async () => {
      for (let attempt = 1; attempt < MAX_SYNC_ATTEMPTS; attempt++) {
        const delayMs = RETRY_DELAYS_MS[attempt] ?? 3000;
        await new Promise<void>((resolve) => {
          pollTimer = setTimeout(() => {
            pollTimer = null;
            resolve();
          }, delayMs);
        });
        if (
          cancelled ||
          !isMountedRef.current ||
          isCancelledRef.current ||
          hasCompletedPurchaseRef.current
        ) {
          return;
        }
        try {
          const check = await CoursesService.verifyServerEnrollment(course.id);
          if (
            check.enrolled &&
            !cancelled &&
            isMountedRef.current &&
            !hasCompletedPurchaseRef.current
          ) {
            hasCompletedPurchaseRef.current = true;
            confirmServerEnrollments(
              check.enrolledCourseIds.length > 0 ? check.enrolledCourseIds : [course.id]
            );
            refreshCourses().catch(() => {});
            triggerHaptic('success');
            onClose();
            onSuccess(course.id);
            return;
          }
        } catch {
          // Continue remaining poll attempts silently
        }
      }
    };

    runAutoPoll();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [
    visible,
    activeTab,
    course,
    isAuthenticated,
    confirmServerEnrollments,
    refreshCourses,
    onClose,
    onSuccess,
  ]);

  const performEnrollmentSync = useCallback(async () => {
    if (!course) return;
    if (!isAuthenticated || !user?.id) {
      onClose();
      setAuthModalVisible(true);
      return;
    }

    setIsSyncing(true);
    try {
      const verification = await CoursesService.verifyServerEnrollment(course.id);
      let isServerEnrolled = verification.enrolled;
      let confirmedIds =
        verification.enrolledCourseIds.length > 0 ? verification.enrolledCourseIds : [course.id];

      if (!isServerEnrolled && resolvedPricing.priceBdt === 0) {
        try {
          const enrollRes = await CoursesService.enrollCourse(course.id);
          if (enrollRes?.success) {
            isServerEnrolled = true;
            confirmedIds = [course.id];
          }
        } catch {
          isServerEnrolled = false;
        }
      }

      if (!isMountedRef.current || isCancelledRef.current) return;
      setIsSyncing(false);

      if (isServerEnrolled) {
        confirmServerEnrollments(confirmedIds);
        refreshCourses().catch(() => {});
        Alert.alert(t('syncSuccessTitle'), t('syncSuccessMsg'), [
          {
            text: isBangla ? 'শেখা শুরু করুন' : 'Start Learning',
            onPress: () => {
              if (!hasCompletedPurchaseRef.current) {
                hasCompletedPurchaseRef.current = true;
                onSuccess(course.id);
              }
              onClose();
            },
          },
        ]);
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
    resolvedPricing.priceBdt,
    isAuthenticated,
    user,
    refreshCourses,
    confirmServerEnrollments,
    onSuccess,
    onClose,
    setAuthModalVisible,
    t,
    isBangla,
  ]);

  return {
    user,
    isAuthenticated,
    t,
    isBangla,
    activeTab,
    setActiveTab,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    email,
    setEmail,
    city,
    setCity,
    address,
    setAddress,
    orderNotes,
    setOrderNotes,
    agreedToTerms,
    setAgreedToTerms,
    formErrors,
    setFormErrors,
    isKeyboardVisible,
    isEditingDetails,
    setIsEditingDetails,
    isPlacingOrder,
    checkoutWebUrl,
    setCheckoutWebUrl,
    canGoBack,
    setCanGoBack,
    loadProgress,
    setLoadProgress,
    isSyncing,
    isVerifyingPayment,
    webViewRef,
    cartForwardTimeoutRef,
    lastNameRef,
    phoneRef,
    cityRef,
    addressRef,
    emailRef,
    orderNotesRef,
    resolvedPricing,
    handleProceedToCheckout,
    handleWebViewMessage,
    handleBackOrExitCheckout,
    verifyCheckoutCompletionOnServer,
    performEnrollmentSync,
  };
}
