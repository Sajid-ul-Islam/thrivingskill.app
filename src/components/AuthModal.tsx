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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'phone' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const {
    login,
    loginWithGoogle,
    loginWithFacebook,
    loginWithPhone,
    sendPhoneOtp,
    register,
    continueAsGuest,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  // Phone OTP States (CR-04)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneFullName, setPhoneFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // 60-Second Resend Timer Effect
  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    const rawDigits = phoneNumber.replace(/[^0-9]/g, '');
    if (rawDigits.length < 10) {
      setErrorMessage('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).');
      return;
    }
    const fullPhone = rawDigits.startsWith('880')
      ? `+${rawDigits}`
      : rawDigits.startsWith('0')
      ? `+88${rawDigits}`
      : `+880${rawDigits}`;

    setErrorMessage(null);
    setInfoMessage(null);
    setIsSendingOtp(true);
    try {
      const res = await sendPhoneOtp(fullPhone);
      setIsOtpSent(true);
      setResendTimer(60);
      setInfoMessage(res.message || `Code sent to ${fullPhone}! (Sandbox test code: 123456)`);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to send OTP SMS. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }
    const rawDigits = phoneNumber.replace(/[^0-9]/g, '');
    const fullPhone = rawDigits.startsWith('880')
      ? `+${rawDigits}`
      : rawDigits.startsWith('0')
      ? `+88${rawDigits}`
      : `+880${rawDigits}`;

    setErrorMessage(null);
    setIsVerifyingOtp(true);
    try {
      await loginWithPhone(fullPhone, otpCode.trim(), phoneFullName.trim() || undefined);
      setPhoneNumber('');
      setOtpCode('');
      setIsOtpSent(false);
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Invalid or expired OTP code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    setErrorMessage(null);
    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setErrorMessage('Please provide your full name.');
          return;
        }
        await register(name.trim().toLowerCase().replace(/\s+/g, '_'), username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      setUsername('');
      setPassword('');
      setName('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleGoogleAuth = async () => {
    setSocialLoading('google');
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in could not be completed.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookAuth = async () => {
    setSocialLoading('facebook');
    setErrorMessage(null);
    try {
      await loginWithFacebook();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Facebook sign-in could not be completed.');
    } finally {
      setSocialLoading(null);
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
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Drag Handle */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            onPress={onClose}
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
              {mode === 'login' ? 'Welcome Back, Professional' : 'Create Your Free Account'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {mode === 'login'
                ? 'Sign in to access your masterclasses, certificates, and learning track.'
                : 'Join 50,000+ executives and learners across Bangladesh.'}
            </Text>

            {/* Social Login Options */}
            <View style={styles.socialButtonsContainer}>
              {/* Google Button */}
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  styles.googleButton,
                  {
                    backgroundColor: isDark ? '#1A2333' : '#FFFFFF',
                    borderColor: isDark ? '#2E3D59' : '#E2E8F0',
                  },
                ]}
                onPress={handleGoogleAuth}
                disabled={!!socialLoading || isLoading}
                activeOpacity={0.8}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator size="small" color="#EA4335" />
                ) : (
                  <>
                    <View style={styles.socialIconCircle}>
                      <Ionicons name="logo-google" size={18} color="#EA4335" />
                    </View>
                    <Text style={[styles.socialButtonText, { color: colors.text }]}>
                      {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Facebook Button */}
              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                onPress={handleFacebookAuth}
                disabled={!!socialLoading || isLoading}
                activeOpacity={0.85}
              >
                {socialLoading === 'facebook' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <View style={[styles.socialIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Ionicons name="logo-facebook" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>
                      {mode === 'login' ? 'Continue with Facebook' : 'Sign up with Facebook'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Or Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                or use {mode === 'login' ? 'email credentials' : 'direct sign up'}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Mode Switch Tabs: Email / Mobile OTP / Register */}
            <View style={[styles.tabSwitch, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.tabSwitchItem,
                  mode === 'login' && [styles.tabSwitchActive, { backgroundColor: colors.surfaceCard }],
                ]}
                onPress={() => {
                  setMode('login');
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
                style={[
                  styles.tabSwitchItem,
                  mode === 'phone' && [styles.tabSwitchActive, { backgroundColor: colors.surfaceCard }],
                ]}
                onPress={() => {
                  setMode('phone');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="call" size={13} color={mode === 'phone' ? colors.primary : colors.textMuted} />
                  <Text
                    style={[
                      styles.tabSwitchText,
                      { color: mode === 'phone' ? colors.text : colors.textMuted },
                      mode === 'phone' && { fontWeight: '700' },
                    ]}
                  >
                    Mobile OTP
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabSwitchItem,
                  mode === 'register' && [styles.tabSwitchActive, { backgroundColor: colors.surfaceCard }],
                ]}
                onPress={() => {
                  setMode('register');
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

            {/* Error Notification */}
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Info / Success Notification */}
            {infoMessage ? (
              <View style={[styles.infoBox, { backgroundColor: '#10B98115', borderColor: '#10B981' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={[styles.infoText, { color: '#10B981' }]}>{infoMessage}</Text>
              </View>
            ) : null}

            {/* Mode: Phone OTP Flow (CR-04) */}
            {mode === 'phone' ? (
              <View style={{ width: '100%' }}>
                {!isOtpSent ? (
                  /* Step 1: Phone number entry */
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Full Name (Optional)</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="e.g. Sajid Ul Islam"
                          placeholderTextColor={colors.textMuted + '80'}
                          value={phoneFullName}
                          onChangeText={setPhoneFullName}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                        Bangladeshi Mobile Number (মোবাইল নম্বর)
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <View style={styles.countryCodeBadge}>
                          <Text style={styles.flagEmoji}>🇧🇩</Text>
                          <Text style={[styles.countryCodeText, { color: colors.text }]}>+880</Text>
                        </View>
                        <TextInput
                          style={[styles.input, { color: colors.text, paddingLeft: 8 }]}
                          placeholder="17XXXXXXXX"
                          placeholderTextColor={colors.textMuted + '80'}
                          value={phoneNumber}
                          onChangeText={(t) => {
                            setPhoneNumber(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          keyboardType="phone-pad"
                          maxLength={11}
                        />
                      </View>
                    </View>

                    {/* Sandbox note */}
                    <View style={[styles.sandboxBox, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
                      <Ionicons name="flash" size={14} color="#6366F1" />
                      <Text style={[styles.sandboxText, { color: colors.text }]}>
                        Sandbox Demo: Test OTP code is <Text style={{ fontWeight: '800', color: '#6366F1' }}>123456</Text>
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: colors.primary }]}
                      onPress={handleSendOtp}
                      disabled={isSendingOtp}
                      activeOpacity={0.88}
                    >
                      {isSendingOtp ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="chatbox-ellipses" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.submitButtonText}>Send 6-Digit OTP SMS</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  /* Step 2: 6-Digit OTP Verification Screen */
                  <>
                    <View style={styles.otpHeaderBox}>
                      <Text style={[styles.otpPromptTitle, { color: colors.text }]}>
                        Enter 6-Digit Verification Code
                      </Text>
                      <Text style={[styles.otpPromptSubtitle, { color: colors.textMuted }]}>
                        Sent to {phoneNumber.startsWith('0') ? `+88${phoneNumber}` : `+880${phoneNumber}`}
                      </Text>
                      <TouchableOpacity onPress={() => setIsOtpSent(false)} style={styles.changePhoneBtn}>
                        <Text style={[styles.changePhoneText, { color: colors.primary }]}>Change Number</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                      <View
                        style={[
                          styles.otpInputWrapper,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.primary },
                        ]}
                      >
                        <TextInput
                          style={[styles.otpInput, { color: colors.text }]}
                          placeholder="123456"
                          placeholderTextColor={colors.textMuted + '60'}
                          value={otpCode}
                          onChangeText={(t) => {
                            setOtpCode(t);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          keyboardType="number-pad"
                          maxLength={6}
                          autoFocus
                        />
                      </View>
                    </View>

                    {/* Quick Test code filler button */}
                    <TouchableOpacity
                      style={styles.quickFillBtn}
                      onPress={() => setOtpCode('123456')}
                    >
                      <Ionicons name="key" size={13} color="#6366F1" />
                      <Text style={styles.quickFillText}>Auto-fill Sandbox OTP: 123456</Text>
                    </TouchableOpacity>

                    {/* Resend OTP row with 60s countdown */}
                    <View style={styles.resendRow}>
                      {resendTimer > 0 ? (
                        <Text style={[styles.resendTimerText, { color: colors.textMuted }]}>
                          Resend code in {resendTimer < 10 ? `0${resendTimer}` : resendTimer}s
                        </Text>
                      ) : (
                        <TouchableOpacity onPress={handleSendOtp} disabled={isSendingOtp}>
                          <Text style={[styles.resendActionText, { color: colors.primary }]}>
                            Resend OTP SMS
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, { backgroundColor: colors.primary }]}
                      onPress={handleVerifyOtp}
                      disabled={isVerifyingOtp}
                      activeOpacity={0.88}
                    >
                      {isVerifyingOtp ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.submitButtonText}>Verify & Sign In</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              /* Email / Password Form (Sign In & Register) */
              <View style={{ width: '100%' }}>
                {mode === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Full Name</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                      ]}
                    >
                      <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="e.g. Sajid Ul Islam"
                        placeholderTextColor={colors.textMuted + '80'}
                        value={name}
                        onChangeText={(t) => {
                          setName(t);
                          if (errorMessage) setErrorMessage(null);
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Email / Username Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                    {mode === 'login' ? 'Email or Username' : 'Email Address'}
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
                      placeholder={mode === 'login' ? 'e.g. user@thrivingskill.com' : 'e.g. name@domain.com'}
                      placeholderTextColor={colors.textMuted + '80'}
                      value={username}
                      onChangeText={(t) => {
                        setUsername(t);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Password</Text>
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
                      style={[styles.input, { color: colors.text }]}
                      placeholder={mode === 'login' ? 'Enter your password' : 'Create a secure password'}
                      placeholderTextColor={colors.textMuted + '80'}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.accent },
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading || !!socialLoading}
                  activeOpacity={0.88}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {mode === 'login' ? 'Sign In with Credentials' : 'Create Free Account'}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Guest Action */}
            <TouchableOpacity
              style={[
                styles.guestButton,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={handleGuest}
              activeOpacity={0.75}
            >
              <Ionicons name="compass-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
              <Text style={[styles.guestButtonText, { color: colors.text }]}>Explore as Guest</Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              Protected by TLS encryption. Connected to thrivingskill.com official LMS.
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
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
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
  socialButtonsContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  socialButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  googleButton: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialIconCircle: {
    marginRight: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '500',
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
    padding: 6,
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
