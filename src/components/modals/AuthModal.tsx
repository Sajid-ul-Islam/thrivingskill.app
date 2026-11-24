import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
  Linking,
  LayoutAnimation,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { triggerHaptic } from '../../utils/haptics';
import { Env } from '../../config/env';
import { AuthService } from '../../services/api/authService';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { useResponsive } from '../../theme/responsive';

/**
 * CR-04: Official Native LearnPress JWT Authentication Modal for Thriving Skills.
 * Powers direct JWT token generation (/learnpress/v1/token), registration (/learnpress/v1/token/register),
 * and native WordPress password recovery matching https://thrivingskill.com directly.
 */

/**
 * Parses WordPress password reset / account verification links.
 * Handles both web URLs:
 * https://thrivingskill.com/login/?action=rp&key=XYZ&login=USERNAME
 * and custom app scheme:
 * thrivingskill://reset-password?key=XYZ&login=USERNAME
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

  // Fallback regex matching
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

export type AuthMode = 'login' | 'register' | 'forgot_password' | 'set_password' | 'register_webview' | 'register_success';

export interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  initialResetKey?: string;
  initialResetLogin?: string;
  dismissible?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode,
  initialResetKey,
  initialResetLogin,
  dismissible,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const { showToast } = useFeedback();
  const {
    isAuthenticated,
    isGuest,
    login,
    register,
    confirmPasswordReset,
    isLoading,
    setAuthModalVisible,
  } = useAuth();

  const isDismissible = dismissible !== undefined ? dismissible : isAuthenticated;

  const [mode, setMode] = useState<AuthMode>(initialMode || 'login');
  const [regStep, setRegStep] = useState<1 | 2>(initialMode === 'set_password' ? 2 : 1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 4-Field Direct Registration State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Registration Success & Email Notification State
  const [registeredSuccessEmail, setRegisteredSuccessEmail] = useState('');
  const [registeredSuccessUsername, setRegisteredSuccessUsername] = useState('');
  const [isAutoLoggedInAfterReg, setIsAutoLoggedInAfterReg] = useState(false);

  // Set Password State (For email verification & password setup)
  const [resetLogin, setResetLogin] = useState(initialResetLogin || '');
  const [resetKey, setResetKey] = useState(initialResetKey || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [pastedLink, setPastedLink] = useState('');

  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const usernameInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const passwordInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const forgotEmailInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const regNameInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const regEmailInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const regPhoneInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const regPasswordInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const resetLoginInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const resetKeyInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const newPasswordInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const confirmPasswordInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initial props
  useEffect(() => {
    if (initialMode) setMode(initialMode);
    if (initialResetKey) setResetKey(initialResetKey);
    if (initialResetLogin) setResetLogin(initialResetLogin);
  }, [initialMode, initialResetKey, initialResetLogin, visible]);

  useEffect(() => {
    if (mode === 'set_password') {
      setRegStep(2);
    } else if (mode === 'register' || mode === 'register_webview') {
      setRegStep(1);
    }
  }, [mode]);

  // Deep link listener for password reset / verification email links
  useEffect(() => {
    const handleIncomingUrl = (incomingUrl?: string | null) => {
      if (!incomingUrl) return;
      const parsed = parseResetPasswordUrl(incomingUrl);
      if (parsed) {
        setResetKey(parsed.key);
        setResetLogin(parsed.login);
        setMode('set_password');
        setErrorMessage(null);
        setInfoMessage(`Verification link detected for @${parsed.login}. Please set your password below.`);
        setAuthModalVisible(true);
        triggerHaptic('success');
      }
    };

    Linking.getInitialURL().then(handleIncomingUrl);
    const sub = Linking.addEventListener('url', (e) => handleIncomingUrl(e.url));
    return () => sub.remove();
  }, []);

  // Keyboard avoidance listeners
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const scrollToInput = (yOffset: number) => {
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 100);
  };

  // Password strength meter aligned with WordPress pwsL10n and official site policy (at least 12 characters)
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return null;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (pass.length >= 16) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (pass.length < 12) {
      return {
        label: `Weak (${pass.length}/12 chars - at least 12 required)`,
        color: '#E34234',
        pct: Math.min(Math.round((pass.length / 12) * 60), 60),
        isValid: false,
      };
    }
    if (score <= 3) {
      return { label: 'Medium', color: isDark ? '#34D399' : '#059669', pct: 80, isValid: true };
    }
    return { label: 'Strong', color: isDark ? '#34D399' : '#047857', pct: 100, isValid: true };
  };

  const handlePasteVerificationLink = (text: string) => {
    setPastedLink(text);
    const parsed = parseResetPasswordUrl(text);
    if (parsed) {
      setResetKey(parsed.key);
      setResetLogin(parsed.login);
      setMode('set_password');
      setErrorMessage(null);
      setInfoMessage(`Verified link for @${parsed.login}! Enter your new password below.`);
      triggerHaptic('success');
    }
  };

  const handleLogin = async () => {
    setTouched({ username: true, password: true });
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username/email and password.');
      triggerHaptic('warning');
      return;
    }

    setErrorMessage(null);
    try {
      await login(username.trim(), password);
      showToast({ message: 'Signed in successfully!', type: 'success' });
      setUsername('');
      setPassword('');
      setTouched({});
      onClose();
    } catch (err: any) {
      const code = String(err?.code || err?.data?.code || '');
      const message = String(err?.message || '');

      if (code.includes('invalid_username')) {
        setErrorMessage('Username or email is not registered. Please check spelling or create an account.');
      } else if (code.includes('incorrect_password')) {
        setErrorMessage("Incorrect password. Please try again or tap 'Forgot Password' below.");
      } else if (code.includes('empty_username')) {
        setErrorMessage('Please enter your username or email address.');
      } else {
        setErrorMessage(message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  const generateUsernameFromEmail = (emailStr: string): string => {
    const raw = emailStr.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const base = raw.length >= 3 ? raw : `student${raw}`;
    const rand = Math.floor(100 + Math.random() * 900);
    return `${base}${rand}`;
  };

  const handleOpenMailApp = async () => {
    triggerHaptic('selection');
    try {
      const mailUrl = Platform.OS === 'ios' ? 'message://' : 'mailto:';
      const supported = await Linking.canOpenURL(mailUrl).catch(() => false);
      if (supported) {
        await Linking.openURL(mailUrl);
      } else {
        await Linking.openURL('mailto:');
      }
    } catch {
      showToast({
        message: isBangla
          ? 'অনুগ্রহ করে আপনার ডিভাইসের ইমেইল অ্যাপ ওপেন করুন।'
          : 'Please open your email application to check incoming mail.',
        type: 'info',
      });
    }
  };

  const handleRegister = async () => {
    const trimmedName = regFullName.trim();
    const trimmedEmail = regEmail.trim().toLowerCase();
    const trimmedPhone = regPhone.trim().replace(/[\s\-()]/g, '');
    const trimmedPassword = regPassword;

    setTouched((p) => ({
      ...p,
      regFullName: true,
      regEmail: true,
      regPhone: true,
      regPassword: true,
    }));

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage(isBangla ? 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।' : 'Please enter your full name.');
      triggerHaptic('warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage(isBangla ? 'সঠিক ইমেইল এড্রেস প্রদান করুন।' : 'Please enter a valid email address.');
      triggerHaptic('warning');
      return;
    }

    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (!trimmedPhone || phoneDigits.length < 10) {
      setErrorMessage(
        isBangla
          ? 'কোর্স ভর্তি ও ভেরিফিকেশনে সঠিক মোবাইল নম্বর প্রদান আবশ্যক (যেমন: 017xxxxxxxx)।'
          : 'Please enter a valid mobile number required for enrollment & support (e.g. 017xxxxxxxx).'
      );
      triggerHaptic('warning');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 12) {
      setErrorMessage(
        isBangla
          ? 'পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে (অফিসিয়াল প্ল্যাটফর্মের নিয়ম)।'
          : 'Password must be at least 12 characters long per official site rules.'
      );
      triggerHaptic('warning');
      return;
    }

    setErrorMessage(null);
    setIsRegistering(true);

    const autoUsername = generateUsernameFromEmail(trimmedEmail);

    try {
      const regRes = await register(autoUsername, trimmedEmail, trimmedPassword, trimmedPhone, trimmedName);
      setRegisteredSuccessEmail(trimmedEmail);
      setRegisteredSuccessUsername(autoUsername);
      setIsAutoLoggedInAfterReg(Boolean(regRes && typeof regRes === 'object' && 'autoLoggedIn' in regRes && regRes.autoLoggedIn));
      setMode('register_success');
      triggerHaptic('success');
      showToast({
        message: isBangla
          ? '🎉 রেজিস্ট্রেশন সম্পন্ন হয়েছে! নিশ্চিতকরণ ইমেইল পাঠানো হয়েছে।'
          : '🎉 Registration completed! Confirmation email sent.',
        type: 'success',
      });
      setRegFullName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setTouched({});
    } catch (err: any) {
      triggerHaptic('error');
      const code = String(err?.code || err?.data?.code || '');
      const msg = String(err?.message || '');

      if (code.includes('email-exists') || msg.toLowerCase().includes('already registered')) {
        setUsername(trimmedEmail);
        setErrorMessage(
          isBangla
            ? 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে সাইন ইন করুন।'
            : 'An account with this email is already registered. Please sign in.'
        );
      } else if (code.includes('invalid-email') || msg.toLowerCase().includes('valid email')) {
        setErrorMessage(
          isBangla ? 'অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন।' : 'Please provide a valid email address.'
        );
      } else if (code.includes('username-exists') || msg.toLowerCase().includes('username already')) {
        try {
          const retryUsername = `${autoUsername}${Math.floor(10 + Math.random() * 90)}`;
          const retryRes = await register(retryUsername, trimmedEmail, trimmedPassword, trimmedPhone, trimmedName);
          setRegisteredSuccessEmail(trimmedEmail);
          setRegisteredSuccessUsername(retryUsername);
          setIsAutoLoggedInAfterReg(Boolean(retryRes && typeof retryRes === 'object' && 'autoLoggedIn' in retryRes && retryRes.autoLoggedIn));
          setMode('register_success');
          showToast({
            message: isBangla ? '🎉 রেজিস্ট্রেশন সম্পন্ন হয়েছে! ইমেইল চেক করুন।' : '🎉 Registration completed! Check your email.',
            type: 'success',
          });
          triggerHaptic('success');
          setRegFullName('');
          setRegEmail('');
          setRegPhone('');
          setRegPassword('');
          setTouched({});
          return;
        } catch (retryErr: any) {
          setErrorMessage(retryErr?.message || (isBangla ? 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।' : 'Registration failed. Please try again.'));
        }
      } else {
        setErrorMessage(msg || (isBangla ? 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।' : 'Registration could not be completed. Please try again.'));
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResetPassword = async () => {
    const userLogin = username.trim();
    if (!userLogin) {
      setErrorMessage('Please enter your username or email address.');
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsResetLoading(true);

    try {
      const res = await AuthService.resetPassword(userLogin);
      if (res?.code === 'success' || !res?.code) {
        const successMsg =
          'A link to set/reset your password has been emailed to you. When you tap the link, it will open directly in this app!';
        setInfoMessage(successMsg);
        Alert.alert('Verification Link Sent 📧', successMsg);
      } else {
        setInfoMessage(res.message || 'Password reset request submitted successfully.');
      }
    } catch (err: any) {
      const code = String(err?.code || err?.data?.code || '');
      const msg = String(err?.message || '');

      if (code.includes('error_not_user') || msg.includes('error_not_user') || msg.includes('Invalid username or email')) {
        const notFoundMsg = 'No account found with this username or email address.';
        setErrorMessage(notFoundMsg);
        Alert.alert('User Not Found', notFoundMsg);
      } else {
        setErrorMessage(msg || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!resetLogin.trim()) {
      setErrorMessage('Username is required. Please check your verification email.');
      triggerHaptic('warning');
      return;
    }
    if (!resetKey.trim()) {
      setErrorMessage('Security key is required. Please paste your email link.');
      triggerHaptic('warning');
      return;
    }
    if (newPassword.length < 12) {
      setErrorMessage('The password should be at least twelve characters long as required by the website.');
      triggerHaptic('warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      triggerHaptic('warning');
      return;
    }

    setErrorMessage(null);
    setIsSettingPassword(true);
    try {
      await confirmPasswordReset(resetLogin.trim(), resetKey.trim(), newPassword);
      showToast({
        message: 'Password set successfully! Welcome to Thriving Skills 🎉',
        type: 'success',
      });
      triggerHaptic('success');
      setNewPassword('');
      setConfirmPassword('');
      setResetLogin('');
      setResetKey('');
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to set password. This verification link may be invalid or expired.'
      );
      triggerHaptic('error');
    } finally {
      setIsSettingPassword(false);
    }
  };

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

        {mode === 'register_webview' ? (
          /* Official In-App Registration WebView */
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
                <Text style={[styles.webViewTitle, { color: colors.text }]}>Official Registration</Text>
                <Text style={[styles.webViewSubtitle, { color: colors.textMuted }]}>
                  thrivingskill.com • No phone required
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setMode('register')}
                style={[styles.closeButtonCompact, { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' }]}
                accessibilityRole="button"
                accessibilityLabel="Close registration webview"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <WebView
              source={{ uri: `${Env.SITE_URL}/register/` }}
              style={styles.webView}
              originWhitelist={['https://*']}
              allowFileAccess={false}
              allowUniversalAccessFromFileURLs={false}
              onShouldStartLoadWithRequest={(request) => {
                const url = (request.url || '').toLowerCase();
                // Restrict embedded auth webview navigation strictly to authorized Thriving Skills domains
                return (
                  url.startsWith('https://thrivingskill.com') ||
                  url.startsWith('https://www.thrivingskill.com') ||
                  url.startsWith('https://staging.thrivingskill.com') ||
                  (Env.SITE_URL ? url.startsWith(Env.SITE_URL.toLowerCase()) : false) ||
                  url.startsWith('about:blank')
                );
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
                    setMode('set_password');
                    setInfoMessage(
                      'Registration submitted! Please check your email for the verification link. Tap it to set your password and finish setup.'
                    );
                    triggerHaptic('success');
                  }
                } catch {}
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
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
                paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 20) + 12,
                maxHeight: isKeyboardVisible ? '98%' : '92%',
              },
            ]}
            accessibilityViewIsModal={true}
          >
            {/* Drag Handle */}
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

            {/* Top Control Bar: Language Switcher Pill & Optional Close Button */}
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
                  style={[styles.closeButtonInline, { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' }]}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[
                styles.scrollContent,
                isKeyboardVisible && { paddingBottom: Math.max(keyboardHeight, 140) },
              ]}
              style={styles.scrollView}
            >
              {/* Authentic Brand Header - Persistent across keyboard to eliminate layout collapse */}
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
                    marginTop: isKeyboardVisible ? 2 : 0,
                    marginBottom: isKeyboardVisible ? 8 : 6,
                  },
                ]}
              >
                {mode === 'login'
                  ? (isBangla ? 'স্বাগতম, প্রফেশনাল' : 'Welcome Back, Professional')
                  : mode === 'register'
                  ? (isBangla ? 'ফ্রি অ্যাকাউন্ট তৈরি করুন' : 'Create Your Free Account')
                  : mode === 'register_success'
                  ? (isBangla ? 'রেজিস্ট্রেশন সম্পন্ন হয়েছে!' : 'Registration Successful!')
                  : mode === 'set_password'
                  ? (isBangla ? 'পাসওয়ার্ড সেট করুন' : 'Set Your Account Password')
                  : (isBangla ? 'পাসওয়ার্ড রিসেট' : 'Reset Your Password')}
              </Text>
              {!isKeyboardVisible && (
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {mode === 'login'
                    ? (isBangla ? 'আপনার কোর্স, সার্টিফিকেট এবং লার্নিং ট্র্যাক এক্সেস করতে সাইন ইন করুন।' : 'Sign in to access your masterclasses, certificates, and learning track.')
                    : mode === 'register'
                    ? (isBangla ? 'নাম, ইমেইল, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে সহজে যুক্ত হোন।' : 'Fast 4-field registration. Join learners and professionals across Bangladesh.')
                    : mode === 'register_success'
                    ? (isBangla ? 'আপনার অ্যাকাউন্টের একটি নিশ্চিতকরণ ইমেইল পাঠানো হয়েছে।' : 'A confirmation & activation email has been sent to your registered address.')
                    : mode === 'set_password'
                    ? (isBangla ? 'ভেরিফিকেশন লিংক থেকে পাসওয়ার্ড সেট করুন।' : 'Enter your email link details to set your new password.')
                    : (isBangla ? 'আপনার ইমেইল বা ইউজারনেম লিখুন।' : 'Enter your username or email address and we will email you a password setup link.')}
                </Text>
              )}

              {/* Progressive 2-Step Registration Flow Bar (Only when setting password from email link) */}
              {mode === 'set_password' && (
                <View style={styles.regStepBar}>
                  <View style={styles.regStepMeta}>
                    <Text style={[styles.regStepLabel, { color: colors.primary }]} numberOfLines={1} ellipsizeMode="tail">
                      Step {regStep} of 2: {regStep === 1 ? 'Official Registration' : 'Set Password'}
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

              {/* Mode Switch Tabs: Email Login vs Register */}
              {(mode === 'login' || mode === 'register') && (
                <View
                  style={[
                    styles.tabSwitch,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    accessibilityRole="tab"
                    accessibilityState={{ selected: mode === 'login' }}
                    style={[
                      styles.tabSwitchItem,
                      mode === 'login' && [styles.tabSwitchActive, { backgroundColor: colors.surfaceCard }],
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setMode('login');
                      setTouched({});
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.tabSwitchText,
                        { color: mode === 'login' ? colors.text : colors.textMuted },
                        mode === 'login' && { fontWeight: '700' },
                      ]}
                    >
                      {isBangla ? 'সাইন ইন' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="tab"
                    accessibilityState={{ selected: mode === 'register' }}
                    style={[
                      styles.tabSwitchItem,
                      mode === 'register' && [styles.tabSwitchActive, { backgroundColor: colors.surfaceCard }],
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setMode('register');
                      setTouched({});
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.tabSwitchText,
                        { color: mode === 'register' ? colors.text : colors.textMuted },
                        mode === 'register' && { fontWeight: '700' },
                      ]}
                    >
                      {isBangla ? 'রেজিস্ট্রেশন' : 'Register'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Error Notification */}
              {errorMessage ? (
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}
                >
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Info / Success Notification */}
              {infoMessage ? (
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
                  <Ionicons name="checkmark-circle" size={18} color={isDark ? '#34D399' : '#047857'} />
                  <Text style={[styles.infoText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                    {infoMessage}
                  </Text>
                </View>
              ) : null}

              {/* Form Content Rendering */}
              <View style={{ width: '100%' }}>
                {mode === 'forgot_password' ? (
                  <>
                    {/* Forgot Password Request */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        Email or Username
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={forgotEmailInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="e.g. user@thrivingskill.com or username"
                          placeholderTextColor={colors.textMuted + '80'}
                          value={username}
                          onChangeText={(t) => {
                            setUsername(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(20)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          returnKeyType="done"
                          onSubmitEditing={handleResetPassword}
                          autoComplete="email"
                          textContentType="username"
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: '#E34234' }]}
                      onPress={handleResetPassword}
                      disabled={isResetLoading}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityLabel="Send Password Reset Link"
                    >
                      {isResetLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                            Send Verification Link
                          </Text>
                          <Ionicons name="mail-unread-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backToLoginBtn}
                      onPress={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setInfoMessage(null);
                      }}
                      accessibilityRole="button"
                    >
                      <Ionicons name="arrow-back" size={16} color={colors.primary} />
                      <Text style={[styles.backToLoginText, { color: colors.primary }]}>
                        Back to Sign In
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : mode === 'set_password' ? (
                  /* Set New Password Form (from Email Link or Link Paste) */
                  <>
                    <View style={styles.noticeCard}>
                      <Ionicons name="key-outline" size={20} color={colors.primary} />
                      <Text style={[styles.noticeCardText, { color: colors.text }]}>
                        Enter the username and verification key from your email to set your new password.
                      </Text>
                    </View>

                    {/* Quick Paste Link Box */}
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
                        <Ionicons name="link-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Paste https://thrivingskill.com/login/?action=rp..."
                          placeholderTextColor={colors.textLight}
                          value={pastedLink}
                          onChangeText={handlePasteVerificationLink}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    {/* Username Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Username *</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={resetLoginInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="e.g. username"
                          placeholderTextColor={colors.textLight}
                          value={resetLogin}
                          onChangeText={(t) => {
                            setResetLogin(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(30)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => resetKeyInputRef.current?.focus()}
                        />
                      </View>
                    </View>

                    {/* Security Key Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>One-Time Security Key *</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={resetKeyInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Security key from link (e.g. XYZ123...)"
                          placeholderTextColor={colors.textLight}
                          value={resetKey}
                          onChangeText={(t) => {
                            setResetKey(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(80)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => newPasswordInputRef.current?.focus()}
                        />
                      </View>
                    </View>

                    {/* New Password Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>New Password * (Min 12 Characters)</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={newPasswordInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Enter new password"
                          placeholderTextColor={colors.textLight}
                          value={newPassword}
                          onChangeText={(t) => {
                            setNewPassword(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(140)}
                          onBlur={() => setTouched((p) => ({ ...p, newPassword: true }))}
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          returnKeyType="next"
                          onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword(!showNewPassword)}
                          style={styles.eyeButton}
                          accessibilityRole="button"
                        >
                          <Ionicons
                            name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                      {newPassword.length > 0 && (
                        <View style={styles.strengthWrap}>
                          {(() => {
                            const passwordStrength = getPasswordStrength(newPassword);
                            if (!passwordStrength) return null;
                            return (
                              <>
                                <View style={[styles.strengthTrack, { backgroundColor: colors.surfaceSubtle }]}>
                                  <View
                                    style={[
                                      styles.strengthFill,
                                      { backgroundColor: passwordStrength.color, width: `${passwordStrength.pct}%` },
                                    ]}
                                  />
                                </View>
                                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                  {passwordStrength.label}
                                </Text>
                              </>
                            );
                          })()}
                        </View>
                      )}
                      {touched.newPassword && newPassword.length > 0 && newPassword.length < 12 && (
                        <Text style={[styles.inlineFieldError, { color: colors.danger }]}>
                          The password should be at least 12 characters long.
                        </Text>
                      )}

                      {/* Official Password Hint from thrivingskill.com / WordPress */}
                      <View style={[styles.siteHintBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                        <Ionicons name="information-circle" size={16} color={colors.primary} style={{ marginTop: 1 }} />
                        <Text style={[styles.siteHintText, { color: colors.textMuted }]}>
                          <Text style={{ fontWeight: '700', color: colors.text }}>Hint: </Text>
                          The password should be at least twelve characters long. To make it stronger, use upper and lower case letters, numbers, and symbols like ! " ? $ % ^ & ).
                        </Text>
                      </View>
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Confirm New Password *</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={confirmPasswordInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Re-enter new password"
                          placeholderTextColor={colors.textLight}
                          value={confirmPassword}
                          onChangeText={(t) => {
                            setConfirmPassword(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(200)}
                          onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          returnKeyType="done"
                          onSubmitEditing={handleSetNewPassword}
                        />
                      </View>
                      {touched.confirmPassword && confirmPassword.length > 0 && newPassword !== confirmPassword && (
                        <Text style={[styles.inlineFieldError, { color: colors.danger }]}>
                          Passwords do not match.
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: '#E34234' }]}
                      onPress={handleSetNewPassword}
                      disabled={isSettingPassword}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                    >
                      {isSettingPassword ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                            Save Password & Sign In
                          </Text>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backToLoginBtn}
                      onPress={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setInfoMessage(null);
                      }}
                      accessibilityRole="button"
                    >
                      <Ionicons name="arrow-back" size={16} color={colors.primary} />
                      <Text style={[styles.backToLoginText, { color: colors.primary }]}>
                        Back to Sign In
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : mode === 'register' ? (
                  /* 4-Field Direct In-App Fast Registration (Name + Email + Phone + Password) */
                  <>
                    {/* Full Name Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        {isBangla ? 'আপনার নাম *' : 'Full Name *'}
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: touched.regFullName && !regFullName.trim() ? colors.danger : colors.border,
                          },
                        ]}
                      >
                        <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={regNameInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder={isBangla ? 'যেমন: সাজিদ ইসলাম' : 'e.g. Sajid Islam'}
                          placeholderTextColor={colors.textLight}
                          value={regFullName}
                          onChangeText={(t) => {
                            setRegFullName(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(20)}
                          onBlur={() => setTouched((p) => ({ ...p, regFullName: true }))}
                          autoCapitalize="words"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => regEmailInputRef.current?.focus()}
                        />
                      </View>
                      {touched.regFullName && !regFullName.trim() && (
                        <Text style={[styles.inlineFieldError, { color: colors.danger }]}>
                          {isBangla ? 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।' : 'Please enter your full name.'}
                        </Text>
                      )}
                    </View>

                    {/* Email Address Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        {isBangla ? 'ইমেইল এড্রেস *' : 'Email Address *'}
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: touched.regEmail && !regEmail.trim() ? colors.danger : colors.border,
                          },
                        ]}
                      >
                        <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={regEmailInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="student@example.com"
                          placeholderTextColor={colors.textLight}
                          value={regEmail}
                          onChangeText={(t) => {
                            setRegEmail(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(80)}
                          onBlur={() => setTouched((p) => ({ ...p, regEmail: true }))}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => regPhoneInputRef.current?.focus()}
                        />
                      </View>
                      {touched.regEmail && !regEmail.trim() && (
                        <Text style={[styles.inlineFieldError, { color: colors.danger }]}>
                          {isBangla ? 'সঠিক ইমেইল এড্রেস লিখুন।' : 'Please enter a valid email address.'}
                        </Text>
                      )}
                    </View>

                    {/* Phone Number Input (Mandatory per client requirement for course enrollment) */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        {isBangla ? 'মোবাইল নম্বর * (কোর্স ভর্তি ও ভেরিফিকেশনে আবশ্যক)' : 'Phone Number * (Required for enrollment & verification)'}
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: touched.regPhone && !regPhone.trim() ? colors.danger : colors.border,
                          },
                        ]}
                      >
                        <Ionicons name="call-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={regPhoneInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="017xxxxxxxx"
                          placeholderTextColor={colors.textLight}
                          value={regPhone}
                          onChangeText={(t) => {
                            setRegPhone(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(140)}
                          onBlur={() => setTouched((p) => ({ ...p, regPhone: true }))}
                          keyboardType="phone-pad"
                          returnKeyType="next"
                          onSubmitEditing={() => regPasswordInputRef.current?.focus()}
                        />
                      </View>
                      {touched.regPhone && (!regPhone.trim() || regPhone.replace(/\D/g, '').length < 10) && (
                        <Text style={[styles.inlineFieldError, { color: colors.danger }]}>
                          {isBangla
                            ? 'কোর্স ভর্তি ও ভেরিফিকেশনে সঠিক মোবাইল নম্বর প্রদান আবশ্যক (যেমন: 017xxxxxxxx)।'
                            : 'Please enter a valid mobile number (e.g. 017xxxxxxxx).'}
                        </Text>
                      )}
                    </View>

                    {/* Password Input - Min 12 Characters per official platform rules */}
                    <View style={styles.inputGroup}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                          {isBangla ? 'পাসওয়ার্ড * (কমপক্ষে ১২ অক্ষর)' : 'Password * (Min 12 characters)'}
                        </Text>
                        {regPassword.length > 0 && (
                          <Text
                            style={[
                              styles.charCountPill,
                              { color: regPassword.length >= 12 ? '#10B981' : colors.textMuted },
                            ]}
                          >
                            {regPassword.length}/12 {regPassword.length >= 12 ? '✓' : ''}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: touched.regPassword && regPassword.length < 12 ? colors.danger : colors.border,
                          },
                        ]}
                      >
                        <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={regPasswordInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder={isBangla ? 'কমপক্ষে ১২ অক্ষরের পাসওয়ার্ড লিখুন' : 'Enter at least 12 character password'}
                          placeholderTextColor={colors.textLight}
                          value={regPassword}
                          onChangeText={(t) => {
                            setRegPassword(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(200)}
                          onBlur={() => setTouched((p) => ({ ...p, regPassword: true }))}
                          secureTextEntry={!showRegPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={handleRegister}
                        />
                        <TouchableOpacity
                          onPress={() => setShowRegPassword(!showRegPassword)}
                          style={styles.eyeButton}
                          accessibilityRole="button"
                          accessibilityLabel={showRegPassword ? 'Hide password' : 'Show password'}
                        >
                          <Ionicons
                            name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Character Count Progress Bar */}
                      {regPassword.length > 0 && (
                        <View style={[styles.charCountTrack, { backgroundColor: colors.surfaceSubtle }]}>
                          <View
                            style={[
                              styles.charCountFill,
                              {
                                width: `${Math.min(100, (regPassword.length / 12) * 100)}%`,
                                backgroundColor: regPassword.length >= 12 ? '#10B981' : '#E34234',
                              },
                            ]}
                          />
                        </View>
                      )}

                      {touched.regPassword && regPassword.length > 0 && regPassword.length < 12 && (
                        <Text style={[styles.inlineFieldError, { color: colors.danger }]}>
                          {isBangla
                            ? `পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে (বর্তমানে ${regPassword.length}/১২)।`
                            : `Password must be at least 12 characters long (currently ${regPassword.length}/12).`}
                        </Text>
                      )}

                      {/* Official Password Rule Card from thrivingskill.com */}
                      <View style={[styles.siteHintBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, marginTop: 8 }]}>
                        <Ionicons name="shield-checkmark" size={15} color="#E34234" style={{ marginTop: 1 }} />
                        <Text style={[styles.siteHintText, { color: colors.textMuted }]}>
                          <Text style={{ fontWeight: '700', color: colors.text }}>
                            {isBangla ? 'পাসওয়ার্ড নিয়ম: ' : 'Password Rule: '}
                          </Text>
                          {isBangla
                            ? 'পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে। আরও শক্তিশালী করতে বড় ও ছোট হাতের অক্ষর, সংখ্যা এবং চিহ্ন (! " ? $ % ^ &) ব্যবহার করুন।'
                            : 'The password must be at least twelve (12) characters long. To make it stronger, use uppercase, lowercase, numbers, and symbols like ! " ? $ % ^ & ).'}
                        </Text>
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: '#E34234' }]}
                      onPress={handleRegister}
                      disabled={isRegistering}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityLabel={isBangla ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
                    >
                      {isRegistering ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                            {isBangla ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
                          </Text>
                          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Switch to Login Link */}
                    <View style={styles.switchRow}>
                      <Text style={[styles.switchText, { color: colors.textMuted }]}>
                        {isBangla ? 'ইতিমধ্যে অ্যাকাউন্ট রয়েছে?' : 'Already have an account?'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setMode('login');
                          setErrorMessage(null);
                          setInfoMessage(null);
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.switchActionText, { color: colors.primary }]}>
                          {isBangla ? ' সাইন ইন করুন' : ' Sign In'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Secondary Link for existing users with email reset/verification link */}
                    <View style={{ marginTop: 14, alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          setMode('set_password');
                          setErrorMessage(null);
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={{ fontSize: 12, color: colors.textMuted, textDecorationLine: 'underline' }}>
                          {isBangla ? 'ইমেইল ভেরিফিকেশন বা পাসওয়ার্ড রিসেট লিংক রয়েছে?' : 'Have a verification or reset link? Enter here'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : mode === 'register_success' ? (
                  /* Registration Success & Email Notification Confirmation Screen */
                  <View style={styles.registerSuccessContainer}>
                    {/* Visual Success & Mail Badge */}
                    <View style={styles.successIconOuterRing}>
                      <View style={[styles.successIconCircle, { backgroundColor: isDark ? 'rgba(16, 47, 83, 0.4)' : '#F0FDF4' }]}>
                        <Ionicons name="mail-open" size={42} color="#102F53" />
                        <View style={styles.successMiniBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        </View>
                      </View>
                    </View>

                    {/* Prominent Header Text */}
                    <Text style={[styles.successTitle, { color: colors.text }]}>
                      {isBangla ? 'রেজিস্ট্রেশন সফল হয়েছে!' : 'Registration Successful!'}
                    </Text>

                    <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
                      {isBangla
                        ? 'আপনার অ্যাকাউন্টের একটি কনফার্মেশন ও অ্যাক্টিভেশন ইমেইল পাঠানো হয়েছে।'
                        : 'A confirmation & activation email has been sent to your registered address.'}
                    </Text>

                    {/* Email Card Highlight */}
                    <View style={[styles.emailNoticeBox, { backgroundColor: isDark ? 'rgba(227, 66, 52, 0.08)' : '#FFF1F2', borderColor: 'rgba(227, 66, 52, 0.3)' }]}>
                      <View style={styles.emailNoticeRow}>
                        <Ionicons name="mail" size={16} color="#E34234" />
                        <Text style={[styles.emailNoticeLabel, { color: colors.textMuted }]}>
                          {isBangla ? 'নিবন্ধিত ইমেইল ঠিকানা:' : 'Registered Email Address:'}
                        </Text>
                      </View>
                      <Text style={[styles.registeredEmailHighlight, { color: colors.text }]} numberOfLines={1} selectable>
                        {registeredSuccessEmail || regEmail || 'your email'}
                      </Text>
                      {registeredSuccessUsername ? (
                        <View style={styles.usernameRow}>
                          <Text style={[styles.usernameLabel, { color: colors.textMuted }]}>
                            {isBangla ? 'ইউজারনেম:' : 'Username:'}
                          </Text>
                          <Text style={[styles.usernameValue, { color: colors.text }]} selectable>
                            @{registeredSuccessUsername}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Step-by-Step Guidance Box */}
                    <View style={[styles.guidanceCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                      <Text style={[styles.guidanceHeading, { color: colors.text }]}>
                        {isBangla ? 'পরবর্তী করণীয় ৩টি সহজ ধাপ:' : 'What to do next:'}
                      </Text>

                      {/* Step 1: Check Inbox */}
                      <View style={styles.guidanceStepRow}>
                        <View style={[styles.guidanceStepBadge, { backgroundColor: 'rgba(227, 66, 52, 0.12)' }]}>
                          <Ionicons name="mail-unread" size={14} color="#E34234" />
                        </View>
                        <View style={styles.guidanceStepContent}>
                          <Text style={[styles.guidanceStepTitle, { color: colors.text }]}>
                            {isBangla ? '১. ইনবক্স চেক করুন' : '1. Check Your Inbox'}
                          </Text>
                          <Text style={[styles.guidanceStepBody, { color: colors.textMuted }]}>
                            {isBangla
                              ? 'থ্রাইভিং স্কিলস (Thriving Skills) থেকে পাঠানো স্বাগতম ও নিশ্চিতকরণ ইমেইলটি ওপেন করুন।'
                              : 'Open the welcome & confirmation email sent to your inbox from Thriving Skills.'}
                          </Text>
                        </View>
                      </View>

                      {/* Step 2: Spam / Junk Warning */}
                      <View style={styles.guidanceStepRow}>
                        <View style={[styles.guidanceStepBadge, { backgroundColor: 'rgba(16, 47, 83, 0.12)' }]}>
                          <Ionicons name="file-tray-full-outline" size={14} color="#102F53" />
                        </View>
                        <View style={styles.guidanceStepContent}>
                          <Text style={[styles.guidanceStepTitle, { color: colors.text }]}>
                            {isBangla ? '২. স্প্যাম / প্রোমোশনস ফোল্ডার দেখুন' : '2. Check Spam / Promotions Folder'}
                          </Text>
                          <Text style={[styles.guidanceStepBody, { color: colors.textMuted }]}>
                            {isBangla
                              ? 'ইনবক্সে তাৎক্ষণিক না পেলে Spam বা Promotions ফোল্ডার দেখুন এবং "Not Spam" মার্ক করুন।'
                              : 'If not in your primary inbox, check your Spam, Junk, or Promotions tab.'}
                          </Text>
                        </View>
                      </View>

                      {/* Step 3: Link activation */}
                      <View style={styles.guidanceStepRow}>
                        <View style={[styles.guidanceStepBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                          <Ionicons name="key-outline" size={14} color="#10B981" />
                        </View>
                        <View style={styles.guidanceStepContent}>
                          <Text style={[styles.guidanceStepTitle, { color: colors.text }]}>
                            {isBangla ? '৩. লিংক ট্যাপ অথবা সাইন ইন' : '3. Tap Link or Sign In'}
                          </Text>
                          <Text style={[styles.guidanceStepBody, { color: colors.textMuted }]}>
                            {isBangla
                              ? 'ইমেইলে থাকা লিংকে ট্যাপ করলে সরাসরি অ্যাপে আপনার পাসওয়ার্ড নিশ্চিত হবে, অথবা নিচে সরাসরি সাইন ইন করুন।'
                              : 'Tapping the link in your email will open directly in this app to finalize access.'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.successActionsContainer}>
                      {/* Open Mail App */}
                      <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: '#E34234' }]}
                        onPress={handleOpenMailApp}
                        activeOpacity={0.88}
                        accessibilityRole="button"
                        accessibilityLabel={isBangla ? 'ইমেইল অ্যাপ খুলুন' : 'Open Email App'}
                      >
                        <Ionicons name="mail-open" size={18} color="#FFFFFF" />
                        <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                          {isBangla ? 'ইমেইল অ্যাপ খুলুন' : 'Open Email App'}
                        </Text>
                      </TouchableOpacity>

                      {/* Proceed to Sign In */}
                      <TouchableOpacity
                        style={[styles.secondaryActionButton, { borderColor: colors.border, backgroundColor: colors.surfaceCard }]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setUsername(registeredSuccessEmail || regEmail);
                          setMode('login');
                          setErrorMessage(null);
                          setInfoMessage(
                            isBangla
                              ? 'আপনার ইমেইল ও পাসওয়ার্ড দিয়ে সাইন ইন করুন।'
                              : 'Sign in with your email and password to access your account.'
                          );
                        }}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={isBangla ? 'পাসওয়ার্ড দিয়ে সাইন ইন করুন' : 'Proceed to Sign In'}
                      >
                        <Ionicons name="log-in-outline" size={18} color={colors.primary} />
                        <Text style={[styles.secondaryActionText, { color: colors.primary }]}>
                          {isBangla ? 'পাসওয়ার্ড দিয়ে সাইন ইন করুন' : 'Proceed to Sign In'}
                        </Text>
                      </TouchableOpacity>

                      {/* Link to Set Password with key */}
                      <TouchableOpacity
                        style={styles.keyEntryLink}
                        onPress={() => {
                          triggerHaptic('selection');
                          setResetLogin(registeredSuccessUsername || registeredSuccessEmail);
                          setMode('set_password');
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.keyEntryLinkText, { color: colors.textMuted }]}>
                          {isBangla ? 'ইমেইল লিংক কপি করেছেন? এখানে পেস্ট করুন' : 'Have a link from email? Enter key here'}
                        </Text>
                      </TouchableOpacity>

                      {/* Dismiss / Browse */}
                      <TouchableOpacity
                        style={styles.textDismissButton}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel={isBangla ? 'বন্ধ করুন' : 'Close and Browse'}
                      >
                        <Text style={[styles.textDismissText, { color: colors.textMuted }]}>
                          {isBangla ? 'পরে ভেরিফাই করব, বন্ধ করুন' : 'Verify Later, Continue Browsing'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* Login Form */
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        Email or Username
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: touched.username && !username.trim() ? colors.danger : colors.border,
                          },
                        ]}
                      >
                        <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          ref={usernameInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="e.g. user@thrivingskill.com or username"
                          placeholderTextColor={colors.textLight}
                          value={username}
                          onChangeText={(t) => {
                            setUsername(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(40)}
                          onBlur={() => setTouched((p) => ({ ...p, username: true }))}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          returnKeyType="next"
                          onSubmitEditing={() => passwordInputRef.current?.focus()}
                          autoComplete="email"
                          textContentType="username"
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Password</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: touched.password && !password ? colors.danger : colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="lock-closed-outline"
                          size={18}
                          color={colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={passwordInputRef}
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Enter your password"
                          placeholderTextColor={colors.textLight}
                          value={password}
                          onChangeText={(t) => {
                            setPassword(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          onFocus={() => scrollToInput(100)}
                          onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                          autoComplete="current-password"
                          textContentType="password"
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeButton}
                          accessibilityRole="button"
                          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Forgot Password & Verification Link Links */}
                    <View style={styles.loginActionsRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setMode('set_password');
                          setErrorMessage(null);
                          setInfoMessage(null);
                        }}
                        style={styles.forgotPasswordTouch}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                          Have a verification link?
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setMode('forgot_password');
                          setErrorMessage(null);
                          setInfoMessage(null);
                        }}
                        style={styles.forgotPasswordTouch}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: '#E34234' }]}
                      onPress={handleLogin}
                      disabled={isLoading}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                            Sign In with Credentials
                          </Text>
                          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
                Protected by TLS encryption. Connected to {Env.SITE_URL.replace(/^https?:\/\//, '')} official LMS.
              </Text>
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 13, 24, 0.75)',
    justifyContent: 'flex-end',
  },
  backdropTablet: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outsideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
    flexShrink: 1,
  },
  modalCardTablet: {
    maxWidth: 580,
    width: '92%',
    alignSelf: 'center',
    borderRadius: 28,
    borderBottomWidth: 1,
  },
  webViewCard: {
    height: '92%',
    maxHeight: '92%',
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  webViewCardTablet: {
    maxWidth: 760,
    width: '92%',
    height: '85%',
    maxHeight: '85%',
    alignSelf: 'center',
    borderRadius: 28,
    borderBottomWidth: 1,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  webViewSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButtonCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  webViewLoadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    width: '100%',
    flexShrink: 1,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(227, 66, 52, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(227, 66, 52, 0.35)',
    borderRadius: 16,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  langBtn: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  langBtnActive: {
    borderRadius: 8,
  },
  langText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: 'rgba(150, 150, 150, 0.85)',
  },
  langTextActive: {
    fontWeight: '800',
    color: '#E34234',
  },
  langDivider: {
    fontSize: 10,
    color: 'rgba(150, 150, 150, 0.3)',
    marginHorizontal: 1,
  },
  closeButtonInline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  brandRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 2,
    marginBottom: 10,
  },
  brandLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#E34234',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  brandLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandTitleText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  brandSubtitleText: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: -1,
  },
  charCountPill: {
    fontSize: 11,
    fontWeight: '700',
  },
  charCountTrack: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    marginTop: 5,
    marginBottom: 4,
    overflow: 'hidden',
  },
  charCountFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  brandIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#102F53',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  brandBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  tabSwitch: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    marginBottom: 16,
  },
  tabSwitchItem: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabSwitchActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabSwitchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    marginBottom: 14,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(227, 66, 52, 0.08)',
    borderWidth: 1,
    borderColor: '#E34234',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  noticeCardText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    flex: 1,
  },
  regGuideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    width: '100%',
  },
  regGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  regGuideTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  regGuideDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  stepsContainer: {
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepItemText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  alreadyReceivedCard: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
    gap: 8,
  },
  alreadyReceivedLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  enterKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  enterKeyBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  eyeButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  regStepBar: {
    width: '100%',
    marginBottom: 14,
  },
  regStepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  regStepLabel: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  regStepHint: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
  },
  regStepTrack: {
    height: 5,
    borderRadius: shape.extraSmall,
    overflow: 'hidden',
  },
  regStepFill: {
    height: '100%',
    borderRadius: shape.extraSmall,
  },
  siteHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
    gap: 8,
  },
  siteHintText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  inlineFieldError: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  strengthWrap: {
    marginTop: 6,
    gap: 4,
  },
  strengthTrack: {
    height: 4,
    borderRadius: shape.extraSmall,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: shape.extraSmall,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 12,
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loginActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    marginTop: -4,
    gap: 8,
  },
  forgotPasswordTouch: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
  },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 8,
    marginBottom: 10,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 6,
    gap: 4,
  },
  switchText: {
    fontSize: 13,
  },
  switchActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Registration Success Screen Styles
  registerSuccessContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  successIconOuterRing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 47, 83, 0.15)',
  },
  successMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  emailNoticeBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
  },
  emailNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  emailNoticeLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  registeredEmailHighlight: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  usernameLabel: {
    fontSize: 12,
  },
  usernameValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  guidanceCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  guidanceHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  guidanceStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guidanceStepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  guidanceStepContent: {
    flex: 1,
  },
  guidanceStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  guidanceStepBody: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  successActionsContainer: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  keyEntryLink: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEntryLinkText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  textDismissButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textDismissText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
