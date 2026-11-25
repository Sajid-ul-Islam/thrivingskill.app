import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Course } from '../../types';
import { Env } from '../../config/env';
import {
  evaluateCheckoutNavigationRequest,
  getCheckoutOriginWhitelist,
  isCartRedirectUrl,
  isOrderCompletionUrl,
} from '../../services/checkout/checkoutHelpers';
import { triggerHaptic } from '../../utils/haptics';
import { useResponsive } from '../../theme/responsive';
import { paymentModalStyles as styles } from './payment/paymentModal.styles';
import { buildCheckoutAutofillScript } from './payment/injectedCheckoutScript';
import {
  CHECKOUT_AUTOFILL_KEY,
  MAX_SYNC_ATTEMPTS,
  RETRY_DELAYS_MS,
  usePaymentCheckout,
} from './payment/usePaymentCheckout';
import { OrderSummaryCard } from './payment/OrderSummaryCard';
import { BillingDetailsForm } from './payment/BillingDetailsForm';
import { MemberSyncView } from './payment/MemberSyncView';

export { CHECKOUT_AUTOFILL_KEY, MAX_SYNC_ATTEMPTS, RETRY_DELAYS_MS };

export interface PaymentModalProps {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

/**
 * Authentic WooCommerce & LearnPress Checkout Modal.
 * Matches https://thrivingskill.com/checkout/ with Billing Details,
 * SSLCommerz gateway sheet, Order Summary, and instant member sync.
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

  const p = usePaymentCheckout({ visible, course, onClose, onSuccess });
  if (!course) return null;

  const syncStep = p.isAuthenticated ? 2 : 1;
  const { isBundle, priceBdt, subtotalBdt, discountBdt, discountPercent, subCourses } =
    p.resolvedPricing;
  const formattedPrice =
    priceBdt > 0 ? `৳ ${priceBdt.toLocaleString()}` : p.isBangla ? 'ফ্রি' : 'Free';
  const formattedSubtotal = `৳ ${subtotalBdt.toLocaleString()}`;
  const formattedDiscount = `-৳ ${discountBdt.toLocaleString()}`;

  const handleWebViewNavChange = (navState: WebViewNavigation) => {
    const url = navState.url || '';
    p.setCanGoBack(navState.canGoBack);
    if (isOrderCompletionUrl(url, Env.SITE_URL)) {
      p.verifyCheckoutCompletionOnServer(url);
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request.url || '';
    const decision = evaluateCheckoutNavigationRequest(url, Env.SITE_URL);
    if (decision.action === 'block') return false;
    if (decision.action === 'open_external') {
      Linking.canOpenURL(decision.url)
        .then((supported) => {
          if (supported) Linking.openURL(decision.url).catch(() => {});
        })
        .catch(() => {});
      return false;
    }
    if (isCartRedirectUrl(url, Env.SITE_URL)) {
      if (p.cartForwardTimeoutRef.current) clearTimeout(p.cartForwardTimeoutRef.current);
      const targetCheckout = `${Env.SITE_URL}/checkout/`;
      p.cartForwardTimeoutRef.current = setTimeout(() => {
        p.webViewRef.current?.injectJavaScript(`
          window.location.replace(${JSON.stringify(targetCheckout)});
          true;
        `);
      }, 50);
    }
    return true;
  };

  if (p.checkoutWebUrl) {
    const injectedCheckoutJs = buildCheckoutAutofillScript({
      siteUrl: Env.SITE_URL,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      city: p.city,
      address: p.address,
      orderNotes: p.orderNotes,
    });

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={p.handleBackOrExitCheckout}
      >
        <StatusBar style="light" />
        <View style={styles.drawerBackdrop}>
          <TouchableOpacity
            style={styles.drawerBackdropDismiss}
            activeOpacity={1}
            onPress={p.handleBackOrExitCheckout}
            accessibilityRole="button"
            accessibilityLabel="Dismiss checkout sheet"
          />
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
            <View style={styles.drawerHandleRow}>
              <View
                style={[styles.drawerHandle, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }]}
              />
            </View>
            <View
              style={[
                styles.drawerHeader,
                { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' },
              ]}
            >
              <TouchableOpacity
                style={[styles.drawerCloseBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                onPress={p.handleBackOrExitCheckout}
                accessibilityRole="button"
                accessibilityLabel={p.canGoBack ? 'Go back' : 'Cancel checkout'}
              >
                <Ionicons
                  name={p.canGoBack ? 'arrow-back' : 'close'}
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
              <View style={styles.drawerTitleCenter}>
                <Text style={[styles.drawerTitleText, { color: colors.text }]} numberOfLines={1}>
                  {p.isBangla ? 'নিরাপদ চেকআউট' : 'Complete Payment'}
                </Text>
                <View style={styles.drawerSecurityTag}>
                  <Ionicons name="shield-checkmark" size={11} color="#10B981" />
                  <Text style={styles.drawerSecurityTagText}>
                    {p.isBangla ? 'SSL সুরক্ষিত গেটওয়ে' : 'Secure SSL Gateway'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.drawerCloseBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                onPress={() => p.webViewRef.current?.reload()}
                accessibilityRole="button"
                accessibilityLabel="Reload checkout"
              >
                <Ionicons name="reload" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {p.loadProgress < 1 && (
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(8, Math.round(p.loadProgress * 100))}%` },
                  ]}
                />
              </View>
            )}

            <WebView
              ref={p.webViewRef}
              source={{ uri: p.checkoutWebUrl }}
              allowFileAccess={false}
              allowUniversalAccessFromFileURLs={false}
              onNavigationStateChange={handleWebViewNavChange}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              onLoadProgress={(e) => p.setLoadProgress(e.nativeEvent.progress)}
              injectedJavaScript={injectedCheckoutJs}
              onMessage={p.handleWebViewMessage}
              startInLoadingState
              renderLoading={() => (
                <View
                  style={[
                    styles.drawerLoadingState,
                    { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
                  ]}
                >
                  <View style={styles.drawerLoadingIconWrap}>
                    <ActivityIndicator size="large" color="#E34234" />
                  </View>
                  <Text style={[styles.drawerLoadingTitle, { color: colors.text }]}>
                    {p.isBangla ? 'নিরাপদ চেকআউট লোড হচ্ছে...' : 'Connecting to Secure Checkout...'}
                  </Text>
                  <Text style={[styles.drawerLoadingSubtitle, { color: colors.textMuted }]}>
                    {p.isBangla
                      ? 'নিরাপদ পেমেন্ট গেটওয়ে প্রস্তুত হচ্ছে...'
                      : 'Preparing Secure Payment Gateway, please wait...'}
                  </Text>
                </View>
              )}
              style={styles.drawerWebView}
              domStorageEnabled
              javaScriptEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              allowsBackForwardNavigationGestures
              originWhitelist={getCheckoutOriginWhitelist(Env.SITE_URL)}
            />

            {p.isVerifyingPayment && (
              <View
                style={[
                  styles.drawerLoadingState,
                  { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
                ]}
              >
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.drawerLoadingTitle, { color: colors.text }]}>
                  {p.isBangla ? 'এনরোলমেন্ট যাচাই করা হচ্ছে...' : 'Verifying Payment & Enrollment...'}
                </Text>
                <Text style={[styles.drawerLoadingSubtitle, { color: colors.textMuted }]}>
                  {p.isBangla
                    ? 'সার্ভার থেকে নিশ্চিতকরণ পাওয়া মাত্রই কোর্স আনলক হবে।'
                    : 'Waiting for server confirmation before unlocking access.'}
                </Text>
              </View>
            )}
            <View
              style={{
                height: Math.max(insets.bottom, 16),
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              }}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
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
          accessibilityViewIsModal
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
            contentContainerStyle={[styles.scroll, p.isKeyboardVisible && { paddingBottom: 160 }]}
          >
            <View style={styles.headerRow}>
              <View style={[styles.shieldBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="bag-check-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, paddingRight: 28 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {p.isBangla ? 'কোর্স ভর্তি ও চেকআউট' : 'Checkout & Enrollment'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {p.isBangla
                    ? 'বিকাশ, নগদ, কার্ড ও ব্যাংকিং এর মাধ্যমে নিরাপদ পেমেন্ট'
                    : 'Secure payment via Mobile Banking, Cards & Net Banking'}
                </Text>
              </View>
            </View>

            <View style={[styles.stepperContainer, { backgroundColor: colors.surfaceSubtle }]}>
              <View style={styles.stepperInfoRow}>
                <Text style={[styles.stepperLabel, { color: colors.textMuted }]}>
                  {p.isBangla
                    ? `ধাপ ${syncStep}/২: সদস্য অ্যাক্সেস যাচাই`
                    : `Step ${syncStep} of 2: Member Access Sync`}
                </Text>
                <Text style={[styles.stepperPercent, { color: colors.primary }]}>
                  {syncStep === 2 ? '100%' : '50%'}
                </Text>
              </View>
              <View style={[styles.stepperTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.stepperFill,
                    { width: syncStep === 2 ? '100%' : '50%', backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>

            <View
              style={[
                styles.tabSelector,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              {(['checkout', 'sync'] as const).map((tabKey) => {
                const isActive = p.activeTab === tabKey;
                return (
                  <TouchableOpacity
                    key={tabKey}
                    style={[
                      styles.tabBtn,
                      isActive && [styles.activeTabBtn, { backgroundColor: colors.surface }],
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      p.setActiveTab(tabKey);
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Ionicons
                      name={tabKey === 'checkout' ? 'card-outline' : 'sync-outline'}
                      size={16}
                      color={isActive ? colors.primary : colors.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.tabBtnText,
                        { color: isActive ? colors.primary : colors.textMuted },
                      ]}
                    >
                      {tabKey === 'checkout'
                        ? p.isBangla
                          ? 'অর্ডার ও চেকআউট'
                          : 'Order & Checkout'
                        : p.isBangla
                          ? 'পূর্ববর্তী এনরোলমেন্ট সিঙ্ক'
                          : 'Sync Enrolled Access'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {p.activeTab === 'checkout' ? (
              <>
                <OrderSummaryCard
                  course={course}
                  colors={colors}
                  isDark={isDark}
                  isBangla={p.isBangla}
                  isBundle={isBundle}
                  subCourses={subCourses}
                  discountPercent={discountPercent}
                  formattedPrice={formattedPrice}
                  formattedSubtotal={formattedSubtotal}
                  formattedDiscount={formattedDiscount}
                />

                <BillingDetailsForm
                  colors={colors}
                  isBangla={p.isBangla}
                  isAuthenticated={p.isAuthenticated}
                  user={p.user}
                  firstName={p.firstName}
                  lastName={p.lastName}
                  phone={p.phone}
                  city={p.city}
                  address={p.address}
                  email={p.email}
                  orderNotes={p.orderNotes}
                  formErrors={p.formErrors}
                  isEditingDetails={p.isEditingDetails}
                  lastNameRef={p.lastNameRef}
                  phoneRef={p.phoneRef}
                  cityRef={p.cityRef}
                  addressRef={p.addressRef}
                  emailRef={p.emailRef}
                  orderNotesRef={p.orderNotesRef}
                  setFirstName={p.setFirstName}
                  setLastName={p.setLastName}
                  setPhone={p.setPhone}
                  setCity={p.setCity}
                  setAddress={p.setAddress}
                  setEmail={p.setEmail}
                  setOrderNotes={p.setOrderNotes}
                  setIsEditingDetails={p.setIsEditingDetails}
                  clearError={(field) =>
                    p.formErrors[field] && p.setFormErrors((prev) => ({ ...prev, [field]: '' }))
                  }
                />

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
                        {p.isBangla ? 'নিরাপদ পেমেন্ট গেটওয়ে' : 'Secure Payment Gateway'}
                      </Text>
                    </View>
                    <View style={styles.sslBadge}>
                      <Text style={styles.sslBadgeText}>22+ Payment Methods</Text>
                    </View>
                  </View>
                  <Text style={[styles.sslDesc, { color: colors.textMuted }]}>
                    {p.isBangla
                      ? 'বিকাশ, নগদ, রকেট, ভিসা, মাস্টারকার্ড ও সকল ইন্টারনেট ব্যাংকিংয়ের মাধ্যমে তাত্ক্ষণিক স্বয়ংক্রিয় পেমেন্ট।'
                      : 'Pay securely via bKash, Nagad, Rocket, VISA, Mastercard, or Internet Banking.'}
                  </Text>
                  <View style={styles.badgeChipsRow}>
                    {['bKash', 'Nagad', 'Rocket', 'VISA', 'Mastercard', 'Internet Banking'].map(
                      (b) => (
                        <View
                          key={b}
                          style={[
                            styles.chip,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                          ]}
                        >
                          <Text style={[styles.chipText, { color: colors.text }]}>{b}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.termsRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    triggerHaptic('selection');
                    p.setAgreedToTerms(!p.agreedToTerms);
                    if (p.formErrors.terms) p.setFormErrors((prev) => ({ ...prev, terms: '' }));
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: p.agreedToTerms }}
                  accessibilityLabel={
                    p.isBangla
                      ? 'ওয়েবসাইট শর্তাবলী মেনে নিচ্ছি'
                      : 'I agree to the terms and conditions'
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: p.formErrors.terms
                          ? '#DC2626'
                          : p.agreedToTerms
                            ? '#102F53'
                            : colors.border,
                        backgroundColor: p.agreedToTerms ? '#102F53' : colors.surface,
                      },
                    ]}
                  >
                    {p.agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.termsText, { color: colors.text }]}>
                    {p.isBangla
                      ? 'আমি ওয়েবসাইটটির সাধারণ শর্তাবলী ও নীতিমালা মেনে নিচ্ছি'
                      : 'I have read and agree to the website terms and conditions'}{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.placeOrderBtn, { backgroundColor: '#102F53' }]}
                  onPress={p.handleProceedToCheckout}
                  disabled={p.isPlacingOrder}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={
                    p.isBangla ? 'নিরাপদ চেকআউট শুরু করুন' : 'Proceed to Secure Checkout'
                  }
                >
                  {p.isPlacingOrder ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                      <Text style={styles.placeOrderBtnText}>
                        {p.isBangla ? 'অর্ডার প্রস্তুত হচ্ছে...' : 'Preparing Checkout...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="shield-checkmark"
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.placeOrderBtnText}>
                        {p.isBangla
                          ? 'নিরাপদ চেকআউট শুরু করুন (PROCEED)'
                          : 'PROCEED TO SECURE CHECKOUT'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <MemberSyncView
                course={course}
                colors={colors}
                isDark={isDark}
                isBangla={p.isBangla}
                isAuthenticated={p.isAuthenticated}
                user={p.user}
                isSyncing={p.isSyncing}
                syncingLabel={p.t('syncingEnrollment')}
                onSync={p.performEnrollmentSync}
              />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
