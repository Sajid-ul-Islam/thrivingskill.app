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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { triggerHaptic } from '../../utils/haptics';
import { Env } from '../../config/env';
import { AuthService } from '../../services/api/authService';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

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
    const cleanUrl = url.trim().replace(/^thrivingskill:\/\//i, 'https://thrivingskill.com/');
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

export type AuthMode = 'login' | 'register' | 'forgot_password' | 'set_password' | 'register_webview';

export interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  initialResetKey?: string;
  initialResetLogin?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode,
  initialResetKey,
  initialResetLogin,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedback();
  const {
    login,
    confirmPasswordReset,
    continueAsGuest,
    isLoading,
    setAuthModalVisible,
  } = useAuth();

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
  const resetLoginInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const resetKeyInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const newPasswordInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const confirmPasswordInputRef = useRef<React.ElementRef<typeof TextInput>>(null);

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
    };
  }, []);

  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 100);
  };

  // Password strength meter aligned with WordPress pwsL10n (Very weak, Weak, Medium, Strong)
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return null;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (pass.length < 6) {
      return { label: 'Very weak (min 6 chars)', color: colors.danger, pct: 25, isValid: false };
    }
    if (score <= 2) {
      return { label: 'Weak', color: colors.brandGold, pct: 50, isValid: true };
    }
    if (score <= 4) {
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
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
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

  const handleGuest = () => {
    continueAsGuest();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.outsideOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
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
                style={[styles.closeButtonCompact, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                accessibilityRole="button"
                accessibilityLabel="Close registration webview"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <WebView
              source={{ uri: `${Env.SITE_URL}/register/` }}
              style={styles.webView}
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

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>

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
              {/* Brand Logo & Pill */}
              {!isKeyboardVisible && (
                <View style={styles.brandContainer}>
                  <View style={[styles.brandIconWrap, { backgroundColor: '#102F53' }]}>
                    <Ionicons name="school" size={26} color="#FFB606" />
                  </View>
                  <Text style={[styles.brandBadgeText, { color: colors.text }]}>
                    THRIVING <Text style={{ color: colors.accent }}>SKILLS</Text>
                  </Text>
                </View>
              )}

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
                  ? 'Welcome Back, Professional'
                  : mode === 'register'
                  ? 'Create Your Free Account'
                  : mode === 'set_password'
                  ? 'Set Your Account Password'
                  : 'Reset Your Password'}
              </Text>
              {!isKeyboardVisible && (
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {mode === 'login'
                    ? 'Sign in to access your masterclasses, certificates, and learning track.'
                    : mode === 'register'
                    ? 'No phone number required. Join 50,000+ professionals across Bangladesh.'
                    : mode === 'set_password'
                    ? 'Choose a secure password for your account (minimum 6 characters).'
                    : 'Enter your username or email address and we will email you a password setup link.'}
                </Text>
              )}

              {/* Progressive 2-Step Registration Flow Bar */}
              {(mode === 'register' || mode === 'set_password') && (
                <View style={styles.regStepBar}>
                  <View style={styles.regStepMeta}>
                    <Text style={[styles.regStepLabel, { color: colors.primary }]}>
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
                      Email Login
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
                      Register
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
                      style={[styles.submitButton, { backgroundColor: colors.primary }]}
                      onPress={handleResetPassword}
                      disabled={isResetLoading}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityLabel="Send Password Reset Link"
                    >
                      {isResetLoading ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <>
                          <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
                            Send Verification Link
                          </Text>
                          <Ionicons name="mail-unread-outline" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
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
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>New Password * (Min 6 Characters)</Text>
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
                      {touched.newPassword && newPassword.length > 0 && newPassword.length < 6 && (
                        <Text style={[styles.inlineFieldError, { color: colors.danger }]}>
                          Password must be at least 6 characters.
                        </Text>
                      )}
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
                      style={[styles.submitButton, { backgroundColor: colors.primary }]}
                      onPress={handleSetNewPassword}
                      disabled={isSettingPassword}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                    >
                      {isSettingPassword ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <>
                          <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
                            Save Password & Sign In
                          </Text>
                          <Ionicons name="checkmark-circle-outline" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
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
                  /* Official Registration Guidance & In-App Web Trigger */
                  <>
                    <View style={[styles.regGuideCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                      <View style={styles.regGuideHeader}>
                        <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                        <Text style={[styles.regGuideTitle, { color: colors.text }]}>
                          Official Account Registration
                        </Text>
                      </View>
                      <Text style={[styles.regGuideDesc, { color: colors.textMuted }]}>
                        No mobile phone number needed. Just choose a username & email. Thriving Skills will email you a secure link to set your password.
                      </Text>

                      <View style={styles.stepsContainer}>
                        <View style={styles.stepRow}>
                          <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.stepNumberText}>1</Text>
                          </View>
                          <Text style={[styles.stepItemText, { color: colors.text }]}>
                            Submit your Username & Email.
                          </Text>
                        </View>

                        <View style={styles.stepRow}>
                          <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.stepNumberText}>2</Text>
                          </View>
                          <Text style={[styles.stepItemText, { color: colors.text }]}>
                            Check inbox for the verification email.
                          </Text>
                        </View>

                        <View style={styles.stepRow}>
                          <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.stepNumberText}>3</Text>
                          </View>
                          <Text style={[styles.stepItemText, { color: colors.text }]}>
                            Tap link to open app & set your password!
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: colors.primary }]}
                      onPress={() => setMode('register_webview')}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityLabel="Open Official Registration Form"
                    >
                      <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
                        Open Official Registration Form
                      </Text>
                      <Ionicons name="open-outline" size={18} color={colors.onPrimary} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    {/* Quick Link to Set Password if user already received email */}
                    <View style={styles.alreadyReceivedCard}>
                      <Text style={[styles.alreadyReceivedLabel, { color: colors.textMuted }]}>
                        Already registered and have your verification link?
                      </Text>
                      <TouchableOpacity
                        style={[styles.enterKeyBtn, { borderColor: colors.primary }]}
                        onPress={() => {
                          setMode('set_password');
                          setErrorMessage(null);
                        }}
                        accessibilityRole="button"
                      >
                        <Ionicons name="key-outline" size={16} color={colors.primary} />
                        <Text style={[styles.enterKeyBtnText, { color: colors.primary }]}>
                          Enter Link / Set Password →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
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
                      style={[styles.submitButton, { backgroundColor: colors.primary }]}
                      onPress={handleLogin}
                      disabled={isLoading}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                    >
                      {isLoading ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <>
                          <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
                            Sign In with Credentials
                          </Text>
                          <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Guest Action */}
              {mode !== 'forgot_password' && mode !== 'set_password' && (
                <TouchableOpacity
                  style={[
                    styles.guestButton,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                  onPress={handleGuest}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                >
                  <Ionicons name="compass-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
                  <Text style={[styles.guestButtonText, { color: colors.text }]}>Explore as Guest</Text>
                </TouchableOpacity>
              )}

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
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
    flexShrink: 1,
  },
  webViewCard: {
    height: '92%',
    maxHeight: '92%',
    paddingHorizontal: 0,
    paddingTop: 8,
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
    marginBottom: 14,
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
    backgroundColor: 'rgba(255, 182, 6, 0.12)',
    borderWidth: 1,
    borderColor: '#FFB606',
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
    marginBottom: 12,
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
    paddingHorizontal: 14,
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
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  regStepLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  regStepHint: {
    fontSize: 12,
    fontWeight: '600',
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
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    marginTop: -4,
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
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 16,
  },
});
