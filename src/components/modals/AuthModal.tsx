import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  LayoutAnimation,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../utils/haptics';
import { Env } from '../../config/env';
import { useResponsive } from '../../theme/responsive';
import { AuthMode, getPasswordStrength } from './auth/authHelpers';
import { authModalStyles as styles } from './auth/authModal.styles';
import { useAuthModalState } from './auth/useAuthModalState';
import { AuthForgotPasswordForm } from './auth/AuthForgotPasswordForm';
import { AuthRegisterForm } from './auth/AuthRegisterForm';
import { AuthRegisterSuccessView } from './auth/AuthRegisterSuccessView';
import { AuthLoginForm } from './auth/AuthLoginForm';

export type { AuthMode };

/**
 * Parses WordPress password reset / account verification links.
 */
export function parseResetPasswordUrl(url: string): { key: string; login: string } | null {
  if (!url) return null;
  try {
    let cleanUrl = url.trim().replace(/^thrivingskill:\/\//i, `${Env.SITE_URL}/`);
    if (cleanUrl.startsWith('/')) {
      cleanUrl = `${Env.SITE_URL}${cleanUrl}`;
    }
    const parsed = new URL(cleanUrl);
    const key = parsed.searchParams.get('key') || parsed.searchParams.get('rp_key');
    const login =
      parsed.searchParams.get('login') ||
      parsed.searchParams.get('user_login') ||
      parsed.searchParams.get('rp_login');
    if (key && login) {
      return { key: key.trim(), login: login.trim() };
    }
  } catch {}

  const keyMatch = url.match(/[?&](?:rp_)?key=([^&#\s]+)/i);
  const loginMatch = url.match(/[?&](?:user_|rp_)?login=([^&#\s]+)/i);
  if (keyMatch && loginMatch) {
    return {
      key: decodeURIComponent(keyMatch[1]).trim(),
      login: decodeURIComponent(loginMatch[1]).trim(),
    };
  }
  return null;
}

export interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  initialResetKey?: string;
  initialResetLogin?: string;
  initialInfoMessage?: string | null;
  dismissible?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode,
  initialResetKey,
  initialResetLogin,
  initialInfoMessage,
  dismissible,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const { isAuthenticated } = useAuth();

  const isDismissible = dismissible !== undefined ? dismissible : isAuthenticated;
  const [regStep, setRegStep] = useState<1 | 2>(initialMode === 'set_password' ? 2 : 1);

  const state = useAuthModalState({
    visible,
    onClose,
    initialMode,
    initialResetKey,
    initialResetLogin,
    initialInfoMessage,
    parseResetPasswordUrl,
  });

  useEffect(() => {
    if (state.mode === 'set_password') {
      setRegStep(2);
    } else if (state.mode === 'register' || state.mode === 'register_webview') {
      setRegStep(1);
    }
  }, [state.mode]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={() => {
        if (isDismissible) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.backdrop, isTablet && styles.backdropTablet]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.outsideOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            if (isDismissible) onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        />

        {state.mode === 'register_webview' ? (
          <View
            style={[
              styles.modalCard,
              styles.webViewCard,
              isTablet && styles.webViewCardTablet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.webViewHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.webViewTitle, { color: colors.text }]}>
                  Official Registration
                </Text>
                <Text style={[styles.webViewSubtitle, { color: colors.textMuted }]}>
                  thrivingskill.com • No phone required
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => state.setMode('register')}
                style={[
                  styles.closeButtonCompact,
                  { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close registration webview"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <WebView
              source={{ uri: `${Env.SITE_URL}/register/` }}
              style={[styles.webView, { backgroundColor: colors.background }]}
              originWhitelist={['https://*']}
              allowFileAccess={false}
              allowUniversalAccessFromFileURLs={false}
              onShouldStartLoadWithRequest={(request) => {
                const url = (request.url || '').toLowerCase();
                if (url.startsWith('about:blank')) return true;
                const activeOrigin = (Env.SITE_URL || 'https://thrivingskill.com').toLowerCase();
                if (url.startsWith(activeOrigin)) return true;
                if (
                  Env.currentEnvironment === 'production' &&
                  url.startsWith('https://www.thrivingskill.com')
                ) {
                  return true;
                }
                return false;
              }}
              injectedJavaScript={`
                (function() {
                  var css = 'header, footer, .site-header, .site-footer, .mobile-menu-wrapper, .top_site_main, #toolbar, .page-title, .breadcrumb, .widget-area { display: none !important; } body, html, #main-content { background: #FFFFFF !important; margin: 0 !important; padding: 0 !important; } .thim-login-container, .thim-register { padding: 14px !important; margin: 0 auto !important; max-width: 100% !important; box-shadow: none !important; }';
                  var head = document.head || document.getElementsByTagName('head')[0];
                  var style = document.createElement('style');
                  style.type = 'text/css';
                  style.appendChild(document.createTextNode(css));
                  head.appendChild(style);

                  var checkTimer = setInterval(function() {
                    var text = document.body ? document.body.innerText : '';
                    if (text.indexOf('Registration complete') !== -1 || window.location.href.indexOf('checkemail=registered') !== -1) {
                      clearInterval(checkTimer);
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REGISTER_COMPLETE' }));
                    }
                  }, 600);
                })();
                true;
              `}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'REGISTER_COMPLETE') {
                    state.setMode('set_password');
                    state.setInfoMessage(
                      'Registration submitted! Please check your email for the verification link. Tap it to set your password and finish setup.'
                    );
                    triggerHaptic('success');
                  }
                } catch {}
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={[styles.webViewLoading, { backgroundColor: colors.background }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.webViewLoadingText, { color: colors.textMuted }]}>
                    Connecting to Thriving Skills registration...
                  </Text>
                </View>
              )}
            />
          </View>
        ) : (
          <View
            style={[
              styles.modalCard,
              isTablet && styles.modalCardTablet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                paddingBottom: state.isKeyboardVisible ? 12 : Math.max(insets.bottom, 20) + 12,
                maxHeight: state.isKeyboardVisible ? '98%' : '92%',
              },
            ]}
            accessibilityViewIsModal={true}
          >
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

            <View style={styles.topControlRow}>
              <View style={styles.langPill}>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection');
                    setLanguage('en');
                  }}
                  activeOpacity={0.7}
                  style={[styles.langBtn, !isBangla && styles.langBtnActive]}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to English"
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 4 }}
                >
                  <Text style={[styles.langText, !isBangla && styles.langTextActive]}>ENG</Text>
                </TouchableOpacity>
                <Text style={styles.langDivider}>|</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection');
                    setLanguage('bn');
                  }}
                  activeOpacity={0.7}
                  style={[styles.langBtn, isBangla && styles.langBtnActive]}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to Bengali"
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 6 }}
                >
                  <Text style={[styles.langText, isBangla && styles.langTextActive]}>বাংলা</Text>
                </TouchableOpacity>
              </View>

              {isDismissible && (
                <TouchableOpacity
                  style={[
                    styles.closeButtonInline,
                    { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' },
                  ]}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              ref={state.scrollViewRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[
                styles.scrollContent,
                state.isKeyboardVisible && { paddingBottom: Math.max(state.keyboardHeight, 140) },
              ]}
              style={styles.scrollView}
            >
              <View style={styles.brandRowHeader}>
                <View style={styles.brandLogoBox}>
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={styles.brandLogoImg}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.brandTitleCol}>
                  <Text style={[styles.brandTitleText, { color: colors.text }]}>
                    Thriving<Text style={{ color: '#E34234' }}>Skills</Text>
                  </Text>
                  <Text style={[styles.brandSubtitleText, { color: colors.textMuted }]}>
                    {isBangla ? 'স্কিলস ফর ফিউচার' : 'Skills For Future'}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                    marginTop: state.isKeyboardVisible ? 2 : 0,
                    marginBottom: state.isKeyboardVisible ? 8 : 6,
                  },
                ]}
              >
                {state.mode === 'login'
                  ? isBangla
                    ? 'স্বাগতম, প্রফেশনাল'
                    : 'Welcome Back, Professional'
                  : state.mode === 'register'
                    ? isBangla
                      ? 'ফ্রি অ্যাকাউন্ট তৈরি করুন'
                      : 'Create Your Free Account'
                    : state.mode === 'register_success'
                      ? isBangla
                        ? 'রেজিস্ট্রেশন সম্পন্ন হয়েছে!'
                        : 'Registration Successful!'
                      : state.mode === 'set_password'
                        ? isBangla
                          ? 'পাসওয়ার্ড সেট করুন'
                          : 'Set Your Account Password'
                        : isBangla
                          ? 'পাসওয়ার্ড রিসেট'
                          : 'Reset Your Password'}
              </Text>
              {!state.isKeyboardVisible && (
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {state.mode === 'login'
                    ? isBangla
                      ? 'আপনার কোর্স, সার্টিফিকেট এবং লার্নিং ট্র্যাক এক্সেস করতে সাইন ইন করুন।'
                      : 'Sign in to access your masterclasses, certificates, and learning track.'
                    : state.mode === 'register'
                      ? isBangla
                        ? 'নাম, ইমেইল, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে সহজে যুক্ত হোন।'
                        : 'Fast 4-field registration. Join learners and professionals across Bangladesh.'
                      : state.mode === 'register_success'
                        ? isBangla
                          ? 'আপনার অ্যাকাউন্টের একটি নিশ্চিতকরণ ইমেইল পাঠানো হয়েছে।'
                          : 'A confirmation & activation email has been sent to your registered address.'
                        : state.mode === 'set_password'
                          ? isBangla
                            ? 'ভেরিফিকেশন লিংক থেকে পাসওয়ার্ড সেট করুন।'
                            : 'Enter your email link details to set your new password.'
                          : isBangla
                            ? 'আপনার ইমেইল বা ইউজারনেম লিখুন।'
                            : 'Enter your username or email address and we will email you a password setup link.'}
                </Text>
              )}

              {state.mode === 'set_password' && (
                <View style={styles.regStepBar}>
                  <View style={styles.regStepMeta}>
                    <Text
                      style={[styles.regStepLabel, { color: colors.primary }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Step {regStep} of 2:{' '}
                      {regStep === 1 ? 'Official Registration' : 'Set Password'}
                    </Text>
                    <Text style={[styles.regStepHint, { color: colors.textMuted }]}>
                      {regStep === 1 ? 'Step 1 of 2' : 'Final Step'}
                    </Text>
                  </View>
                  <View style={[styles.regStepTrack, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.regStepFill,
                        {
                          width: regStep === 1 ? '50%' : '100%',
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {(state.mode === 'login' || state.mode === 'register') && (
                <View
                  style={[
                    styles.tabSwitch,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    accessibilityRole="tab"
                    accessibilityState={{ selected: state.mode === 'login' }}
                    style={[
                      styles.tabSwitchItem,
                      state.mode === 'login' && [
                        styles.tabSwitchActive,
                        { backgroundColor: colors.surfaceCard },
                      ],
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      state.setMode('login');
                      state.setTouched({});
                      state.setErrorMessage(null);
                      state.setInfoMessage(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.tabSwitchText,
                        { color: state.mode === 'login' ? colors.text : colors.textMuted },
                        state.mode === 'login' && { fontWeight: '700' },
                      ]}
                    >
                      {isBangla ? 'সাইন ইন' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="tab"
                    accessibilityState={{ selected: state.mode === 'register' }}
                    style={[
                      styles.tabSwitchItem,
                      state.mode === 'register' && [
                        styles.tabSwitchActive,
                        { backgroundColor: colors.surfaceCard },
                      ],
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      state.setMode('register');
                      state.setTouched({});
                      state.setErrorMessage(null);
                      state.setInfoMessage(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.tabSwitchText,
                        { color: state.mode === 'register' ? colors.text : colors.textMuted },
                        state.mode === 'register' && { fontWeight: '700' },
                      ]}
                    >
                      {isBangla ? 'রেজিস্ট্রেশন' : 'Register'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {state.errorMessage ? (
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.errorBox,
                    { backgroundColor: colors.danger + '15', borderColor: colors.danger },
                  ]}
                >
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {state.errorMessage}
                  </Text>
                </View>
              ) : null}

              {state.infoMessage ? (
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.infoBox,
                    {
                      backgroundColor: isDark ? 'rgba(52, 211, 153, 0.14)' : '#ECFDF5',
                      borderColor: isDark ? '#34D399' : '#047857',
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={isDark ? '#34D399' : '#047857'}
                  />
                  <Text style={[styles.infoText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                    {state.infoMessage}
                  </Text>
                </View>
              ) : null}

              <View style={{ width: '100%' }}>
                {state.mode === 'forgot_password' ? (
                  <AuthForgotPasswordForm
                    colors={colors}
                    username={state.username}
                    setUsername={state.setUsername}
                    errorMessage={state.errorMessage}
                    setErrorMessage={state.setErrorMessage}
                    setInfoMessage={state.setInfoMessage}
                    isResetLoading={state.isResetLoading}
                    forgotEmailInputRef={state.forgotEmailInputRef}
                    scrollToInput={state.scrollToInput}
                    onSubmitReset={state.handleResetPassword}
                    onBackToLogin={() => state.setMode('login')}
                  />
                ) : state.mode === 'set_password' ? (
                  <>
                    <View style={styles.noticeCard}>
                      <Ionicons name="key-outline" size={20} color={colors.primary} />
                      <Text style={[styles.noticeCardText, { color: colors.text }]}>
                        Enter the username and verification key from your email to set your new
                        password.
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        Paste Email Link (Auto-fills Username & Key)
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name="link-outline"
                          size={18}
                          color={colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Paste https://thrivingskill.com/login/?action=rp..."
                          placeholderTextColor={colors.textLight}
                          value={state.pastedLink}
                          onChangeText={state.handlePasteVerificationLink}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        Username *
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={state.resetLoginInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="e.g. username"
                          placeholderTextColor={colors.textLight}
                          value={state.resetLogin}
                          onChangeText={(t) => {
                            state.setResetLogin(t);
                            if (state.errorMessage) state.setErrorMessage(null);
                          }}
                          onFocus={() => state.scrollToInput(30)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => state.resetKeyInputRef.current?.focus()}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        One-Time Security Key *
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={18}
                          color={colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={state.resetKeyInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Security key from link (e.g. XYZ123...)"
                          placeholderTextColor={colors.textLight}
                          value={state.resetKey}
                          onChangeText={(t) => {
                            state.setResetKey(t);
                            if (state.errorMessage) state.setErrorMessage(null);
                          }}
                          onFocus={() => state.scrollToInput(80)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => state.newPasswordInputRef.current?.focus()}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        New Password * (Min 12 Characters)
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name="lock-closed-outline"
                          size={18}
                          color={colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={state.newPasswordInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Enter new password"
                          placeholderTextColor={colors.textLight}
                          value={state.newPassword}
                          onChangeText={(t) => {
                            state.setNewPassword(t);
                            if (state.errorMessage) state.setErrorMessage(null);
                          }}
                          onFocus={() => state.scrollToInput(140)}
                          onBlur={() => state.setTouched((p) => ({ ...p, newPassword: true }))}
                          secureTextEntry={!state.showNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          returnKeyType="next"
                          onSubmitEditing={() => state.confirmPasswordInputRef.current?.focus()}
                        />
                        <TouchableOpacity
                          onPress={() => state.setShowNewPassword(!state.showNewPassword)}
                          style={styles.eyeButton}
                          accessibilityRole="button"
                        >
                          <Ionicons
                            name={state.showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                      {state.newPassword.length > 0 && (
                        <View style={styles.strengthWrap}>
                          {(() => {
                            const passwordStrength = getPasswordStrength(state.newPassword, isDark);
                            if (!passwordStrength) return null;
                            return (
                              <>
                                <View
                                  style={[
                                    styles.strengthTrack,
                                    { backgroundColor: colors.surfaceSubtle },
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.strengthFill,
                                      {
                                        backgroundColor: passwordStrength.color,
                                        width: `${passwordStrength.pct}%`,
                                      },
                                    ]}
                                  />
                                </View>
                                <Text
                                  style={[styles.strengthLabel, { color: passwordStrength.color }]}
                                >
                                  {passwordStrength.label}
                                </Text>
                              </>
                            );
                          })()}
                        </View>
                      )}
                      {state.touched.newPassword &&
                        state.newPassword.length > 0 &&
                        state.newPassword.length < 12 && (
                          <Text style={[styles.inlineFieldError, { color: colors.danger }]}>
                            The password should be at least 12 characters long.
                          </Text>
                        )}
                      <View
                        style={[
                          styles.siteHintBox,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name="information-circle"
                          size={16}
                          color={colors.primary}
                          style={{ marginTop: 1 }}
                        />
                        <Text style={[styles.siteHintText, { color: colors.textMuted }]}>
                          <Text style={{ fontWeight: '700', color: colors.text }}>Hint: </Text>
                          The password should be at least twelve characters long. To make it
                          stronger, use upper and lower case letters, numbers, and symbols like ! "
                          ? $ % ^ & ).
                        </Text>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        Confirm New Password *
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name="lock-closed-outline"
                          size={18}
                          color={colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={state.confirmPasswordInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Re-enter new password"
                          placeholderTextColor={colors.textLight}
                          value={state.confirmPassword}
                          onChangeText={(t) => {
                            state.setConfirmPassword(t);
                            if (state.errorMessage) state.setErrorMessage(null);
                          }}
                          onFocus={() => state.scrollToInput(200)}
                          onBlur={() => state.setTouched((p) => ({ ...p, confirmPassword: true }))}
                          secureTextEntry={!state.showNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          returnKeyType="done"
                          onSubmitEditing={state.handleSetNewPassword}
                        />
                      </View>
                      {state.touched.confirmPassword &&
                        state.confirmPassword.length > 0 &&
                        state.newPassword !== state.confirmPassword && (
                          <Text style={[styles.inlineFieldError, { color: colors.danger }]}>
                            Passwords do not match.
                          </Text>
                        )}
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: '#E34234' }]}
                      onPress={state.handleSetNewPassword}
                      disabled={state.isSettingPassword}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                    >
                      {state.isSettingPassword ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                            Save Password & Sign In
                          </Text>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color="#FFFFFF"
                            style={{ marginLeft: 6 }}
                          />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backToLoginBtn}
                      onPress={() => {
                        state.setMode('login');
                        state.setErrorMessage(null);
                        state.setInfoMessage(null);
                      }}
                      accessibilityRole="button"
                    >
                      <Ionicons name="arrow-back" size={16} color={colors.primary} />
                      <Text style={[styles.backToLoginText, { color: colors.primary }]}>
                        Back to Sign In
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : state.mode === 'register' ? (
                  <AuthRegisterForm
                    colors={colors}
                    isBangla={isBangla}
                    regFullName={state.regFullName}
                    setRegFullName={state.setRegFullName}
                    regEmail={state.regEmail}
                    setRegEmail={state.setRegEmail}
                    regPhone={state.regPhone}
                    setRegPhone={state.setRegPhone}
                    regPassword={state.regPassword}
                    setRegPassword={state.setRegPassword}
                    showRegPassword={state.showRegPassword}
                    setShowRegPassword={state.setShowRegPassword}
                    touched={state.touched}
                    setTouched={state.setTouched}
                    errorMessage={state.errorMessage}
                    setErrorMessage={state.setErrorMessage}
                    setInfoMessage={state.setInfoMessage}
                    isRegistering={state.isRegistering}
                    regNameInputRef={state.regNameInputRef}
                    regEmailInputRef={state.regEmailInputRef}
                    regPhoneInputRef={state.regPhoneInputRef}
                    regPasswordInputRef={state.regPasswordInputRef}
                    scrollToInput={state.scrollToInput}
                    onSubmitRegister={state.handleRegister}
                    onSwitchToLogin={() => state.setMode('login')}
                    onSwitchToSetPassword={() => state.setMode('set_password')}
                  />
                ) : state.mode === 'register_success' ? (
                  <AuthRegisterSuccessView
                    colors={colors}
                    isDark={isDark}
                    isBangla={isBangla}
                    registeredSuccessEmail={state.registeredSuccessEmail}
                    registeredSuccessUsername={state.registeredSuccessUsername}
                    regEmail={state.regEmail}
                    requiresEmailOtp={state.requiresEmailOtp}
                    regOtpCode={state.regOtpCode}
                    setRegOtpCode={state.setRegOtpCode}
                    isVerifyingEmailOtp={state.isVerifyingEmailOtp}
                    errorMessage={state.errorMessage}
                    setErrorMessage={state.setErrorMessage}
                    onVerifyEmailOtp={state.handleVerifyEmailOtp}
                    onOpenMailApp={state.handleOpenMailApp}
                    onProceedToSignIn={() => {
                      triggerHaptic('selection');
                      state.setUsername(state.registeredSuccessEmail || state.regEmail);
                      state.setMode('login');
                      state.setErrorMessage(null);
                      state.setInfoMessage(
                        isBangla
                          ? 'আপনার ইমেইল ও পাসওয়ার্ড দিয়ে সাইন ইন করুন।'
                          : 'Sign in with your email and password to access your account.'
                      );
                    }}
                    onSwitchToSetPassword={() => {
                      state.setResetLogin(
                        state.registeredSuccessUsername || state.registeredSuccessEmail
                      );
                      state.setMode('set_password');
                    }}
                    onClose={onClose}
                  />
                ) : (
                  <AuthLoginForm
                    colors={colors}
                    username={state.username}
                    setUsername={state.setUsername}
                    password={state.password}
                    setPassword={state.setPassword}
                    showPassword={state.showPassword}
                    setShowPassword={state.setShowPassword}
                    touched={state.touched}
                    setTouched={state.setTouched}
                    errorMessage={state.errorMessage}
                    setErrorMessage={state.setErrorMessage}
                    setInfoMessage={state.setInfoMessage}
                    isLoading={state.isLoading}
                    usernameInputRef={state.usernameInputRef}
                    passwordInputRef={state.passwordInputRef}
                    scrollToInput={state.scrollToInput}
                    onLogin={state.handleLogin}
                    onOpenSetPassword={() => state.setMode('set_password')}
                    onOpenForgotPassword={() => state.setMode('forgot_password')}
                  />
                )}
              </View>

              <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
                Protected by TLS encryption. Connected to {Env.SITE_URL.replace(/^https?:\/\//, '')}{' '}
                official LMS.
              </Text>
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};
