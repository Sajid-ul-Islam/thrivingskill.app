import React, { useState } from 'react';
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
} from 'react-native';
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

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedback();
  const {
    login,
            register,
    continueAsGuest,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameError =
    mode === 'register' && touched.name && name.trim().length < 2
      ? 'Please enter your full name (at least 2 characters).'
      : null;
  const phoneError =
    mode === 'register' &&
    touched.regPhone &&
    regPhone.trim().length > 0 &&
    regPhone.replace(/\D/g, '').length < 10
      ? 'Please enter a valid 11-digit mobile number (e.g. 01712345678).'
      : null;
  const usernameError =
    touched.username &&
    username.trim().length > 0 &&
    mode === 'register' &&
    !emailRegex.test(username.trim())
      ? 'Please enter a valid email address.'
      : touched.username && username.trim().length === 0
      ? mode === 'login'
        ? 'Email or username is required.'
        : 'Email address is required.'
      : null;
  const passwordError =
    touched.password && password.length > 0 && mode === 'register' && password.length < 6
      ? 'Password must be at least 6 characters.'
      : touched.password && password.length === 0
      ? 'Password is required.'
      : null;

  const passwordStrength =
    password.length === 0
      ? null
      : password.length < 6
      ? { label: 'Too short (min 6 chars)', color: colors.danger, pct: 25 }
      : password.length < 10
      ? { label: 'Good password', color: colors.brandGold, pct: 65 }
      : { label: 'Strong password', color: isDark ? '#34D399' : '#047857', pct: 100 };

  const handleNextRegisterStep = () => {
    setTouched((prev) => ({ ...prev, name: true, regPhone: true }));
    if (name.trim().length < 2) {
      setErrorMessage('Please provide your full name.');
      triggerHaptic('warning');
      return;
    }
    if (regPhone.trim().length > 0 && regPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid phone number or leave it blank.');
      triggerHaptic('warning');
      return;
    }
    setErrorMessage(null);
    triggerHaptic('selection');
    setRegStep(2);
  };

  const handleLogin = async () => {
    setTouched({ name: true, regPhone: true, username: true, password: true });
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username/email and password.');
      triggerHaptic('warning');
      return;
    }
    if (mode === 'register' && !emailRegex.test(username.trim())) {
      setErrorMessage('Please enter a valid email address.');
      triggerHaptic('warning');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      triggerHaptic('warning');
      return;
    }

    setErrorMessage(null);
    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setErrorMessage('Please provide your full name.');
          return;
        }
        const asciiSlug = name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        const generatedUser = `${asciiSlug || 'learner'}_${Math.floor(Math.random() * 9000 + 1000)}`;
        await register(generatedUser, username.trim(), password, regPhone.trim() || undefined);
        showToast({ message: 'Account created! Welcome to Thriving Skills.', type: 'success' });
      } else {
        await login(username.trim(), password);
        showToast({ message: 'Signed in successfully!', type: 'success' });
      }
      setUsername('');
      setPassword('');
      setName('');
      setRegPhone('');
      setRegStep(1);
      setTouched({});
      onClose();
    } catch (err: any) {
      const code = String(err?.code || err?.data?.code || '');
      const message = String(err?.message || '');

      if (code.includes('invalid_username')) {
        setErrorMessage('Username or email is not registered. Please check your spelling or create an account.');
      } else if (code.includes('incorrect_password')) {
        setErrorMessage("Incorrect password. Please try again or tap 'Forgot Password' below.");
      } else if (code.includes('empty_username')) {
        setErrorMessage('Please enter your username or email address.');
      } else if (
        message.includes('Phone Number is required field') ||
        message.includes('registration-custom-required-field') ||
        code.includes('phone')
      ) {
        setErrorMessage(
          'WordPress requires a phone number for registration. Please enter your mobile number in the Phone Number field above or contact support.'
        );
      } else if (code.includes('username_exists')) {
        setErrorMessage('This username is already registered. Please choose another username or sign in.');
      } else if (code.includes('email_exists')) {
        setErrorMessage('An account with this email already exists. Please sign in or reset your password.');
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
        const successMsg = 'A link to reset your password has been emailed to you.';
        setInfoMessage(successMsg);
        Alert.alert('Reset Link Sent 📧', successMsg);
      } else {
        setInfoMessage(res.message || 'Password reset request submitted successfully.');
      }
    } catch (err: any) {
      const code = String(err?.code || err?.data?.code || '');
      const msg = String(err?.message || '');

      if (code.includes('error_not_user') || msg.includes('error_not_user') || msg.includes('Invalid username or email')) {
        const notFoundMsg = 'User not found. No account is registered with this username or email.';
        setErrorMessage(notFoundMsg);
        Alert.alert('User Not Found', notFoundMsg);
      } else if (code.includes('error_santize_login') || msg.includes('Enter a username')) {
        setErrorMessage('Enter a valid username or email address.');
      } else {
        setErrorMessage(msg || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.outsideOverlay} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) + 12 }]} accessibilityViewIsModal={true}>
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Brand Logo & Pill */}
            <View style={styles.brandContainer}>
              <View style={[styles.brandIconWrap, { backgroundColor: '#102F53' }]}>
                <Ionicons name="school" size={26} color="#FFB606" />
              </View>
              <Text style={[styles.brandBadgeText, { color: colors.text }]}>
                THRIVING <Text style={{ color: colors.accent }}>SKILLS</Text>
              </Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              {mode === 'login'
                ? 'Welcome Back, Professional'
                : mode === 'register'
                ? 'Create Your Free Account'
                : 'Reset Your Password'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {mode === 'login'
                ? 'Sign in to access your masterclasses, certificates, and learning track.'
                : mode === 'register'
                ? 'Join 50,000+ executives and learners across Bangladesh.'
                : 'Enter your username or email address and we will email you a link to reset your password.'}
            </Text>

            {/* Mode Switch Tabs: Email / Mobile OTP / Register */}
            {mode !== 'forgot_password' && (
              <View style={[styles.tabSwitch, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === 'login' }}
                  style={[
                    styles.tabSwitchItem,
                    mode === 'login' && [styles.tabSwitchActive, { backgroundColor: colors.surfaceCard }],
                  ]}
                  onPress={() => {
                    setMode('login');
                    setRegStep(1);
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
                    setRegStep(1);
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

            {/* Progressive Disclosure Step Indicator for Registration */}
            {mode === 'register' && (
              <View style={styles.regStepBar}>
                <View style={styles.regStepMeta}>
                  <Text style={[styles.regStepLabel, { color: colors.primary }]}>
                    Step {regStep} of 2: {regStep === 1 ? 'Your Details' : 'Account Security'}
                  </Text>
                  <Text style={[styles.regStepHint, { color: colors.textMuted }]}>
                    {regStep === 1 ? '50%' : '100%'}
                  </Text>
                </View>
                <View style={[styles.regStepTrack, { backgroundColor: colors.surfaceSubtle }]}>
                  <View
                    style={[
                      styles.regStepFill,
                      { backgroundColor: colors.primary, width: regStep === 1 ? '50%' : '100%' },
                    ]}
                  />
                </View>
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

            {/* Form Section */}
            <View style={{ width: '100%' }}>
              {mode === 'forgot_password' ? (
                <>
                  {/* Email / Username Input for Reset */}
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
                        style={[styles.input, { color: colors.text }]}
                        placeholder="e.g. user@thrivingskill.com or username"
                        placeholderTextColor={colors.textMuted + '80'}
                        value={username}
                        onChangeText={(t) => {
                          setUsername(t);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="username"
                      />
                    </View>
                  </View>

                  {/* Send Reset Link Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: colors.primary },
                    ]}
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
                          Send Password Reset Link
                        </Text>
                        <Ionicons name="mail-unread-outline" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Back to Sign In */}
                  <TouchableOpacity
                    style={styles.backToLoginBtn}
                    onPress={() => {
                      setMode('login');
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Back to Sign In"
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.primary} />
                    <Text style={[styles.backToLoginText, { color: colors.primary }]}>
                      Back to Sign In
                    </Text>
                  </TouchableOpacity>
                </>
              ) : mode === 'register' && regStep === 1 ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Full Name *</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: nameError ? colors.danger : colors.border,
                        },
                      ]}
                    >
                      <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="e.g. Sajid Ul Islam"
                        placeholderTextColor={colors.textLight}
                        value={name}
                        onChangeText={(t) => {
                          setName(t);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                        autoComplete="name"
                        textContentType="name"
                      />
                    </View>
                    {nameError ? (
                      <Text style={[styles.inlineFieldError, { color: colors.danger }]}>{nameError}</Text>
                    ) : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Phone Number (মোবাইল নম্বর)</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: phoneError ? colors.danger : colors.border,
                        },
                      ]}
                    >
                      <Ionicons name="call-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="e.g. 01712345678"
                        placeholderTextColor={colors.textLight}
                        value={regPhone}
                        onChangeText={(t) => {
                          setRegPhone(t);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, regPhone: true }))}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                      />
                    </View>
                    {phoneError ? (
                      <Text style={[styles.inlineFieldError, { color: colors.danger }]}>{phoneError}</Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleNextRegisterStep}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="Continue to credentials"
                  >
                    <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
                      Continue to Credentials
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {mode === 'register' && regStep === 2 && (
                    <TouchableOpacity
                      style={[styles.backStepBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                      onPress={() => {
                        setRegStep(1);
                        setErrorMessage(null);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Back to personal details"
                    >
                      <Ionicons name="arrow-back" size={16} color={colors.text} />
                      <Text style={[styles.backStepBtnText, { color: colors.text }]} numberOfLines={1}>
                        {name.trim() ? `Name: ${name.trim()} (Edit)` : 'Back to Step 1'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Email / Username Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                      {mode === 'login' ? 'Email or Username' : 'Email Address *'}
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: usernameError ? colors.danger : colors.border,
                        },
                      ]}
                    >
                      <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder={mode === 'login' ? 'e.g. user@thrivingskill.com' : 'e.g. name@domain.com'}
                        placeholderTextColor={colors.textLight}
                        value={username}
                        onChangeText={(t) => {
                          setUsername(t);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, username: true }))}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="username"
                      />
                    </View>
                    {usernameError ? (
                      <Text style={[styles.inlineFieldError, { color: colors.danger }]}>{usernameError}</Text>
                    ) : null}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                      {mode === 'login' ? 'Password' : 'Password *'}
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: passwordError ? colors.danger : colors.border,
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
                        style={[styles.input, { color: colors.text }]}
                        placeholder={mode === 'login' ? 'Enter your password' : 'Min 6 characters'}
                        placeholderTextColor={colors.textLight}
                        value={password}
                        onChangeText={(t) => {
                          setPassword(t);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        textContentType={mode === 'login' ? 'password' : 'newPassword'}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                    {passwordError ? (
                      <Text style={[styles.inlineFieldError, { color: colors.danger }]}>{passwordError}</Text>
                    ) : null}
                    {mode === 'register' && passwordStrength ? (
                      <View style={styles.strengthWrap}>
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
                      </View>
                    ) : null}
                  </View>

                  {/* Forgot Password Touchable Option */}
                  {mode === 'login' && (
                    <View style={styles.forgotPasswordContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          setMode('forgot_password');
                          setErrorMessage(null);
                          setInfoMessage(null);
                        }}
                        style={styles.forgotPasswordTouch}
                        accessibilityRole="button"
                        accessibilityLabel="Forgot Password?"
                      >
                        <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: colors.primary },
                    ]}
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
                          {mode === 'login' ? 'Sign In with Credentials' : 'Create Free Account'}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Guest Action */}
            {mode !== 'forgot_password' && (
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
    flex: 1,
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
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
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 12,
    borderRadius: shape.small,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  backStepBtnText: {
    fontSize: 13,
    fontWeight: '600',
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
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 8,
    marginTop: -4,
  },
  forgotPasswordTouch: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
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
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(150, 150, 150, 0.25)',
    gap: 5,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sandboxBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  sandboxText: {
    fontSize: 12,
  },
  otpHeaderBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  otpPromptTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  otpPromptSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  changePhoneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changePhoneText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  otpInputWrapper: {
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  otpInput: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
    width: '100%',
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginBottom: 8,
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    textDecorationLine: 'underline',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  resendTimerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resendActionText: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
