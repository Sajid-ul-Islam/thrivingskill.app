import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, TextInput, Alert, Keyboard, Linking, Platform } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useFeedback } from '../../../context/FeedbackContext';
import { triggerHaptic } from '../../../utils/haptics';
import { AuthService } from '../../../services/api/authService';
import { AuthMode, generateUsernameFromEmail } from './authHelpers';

export function useAuthModalState({
  visible,
  onClose,
  initialMode,
  initialResetKey,
  initialResetLogin,
  initialInfoMessage,
  parseResetPasswordUrl,
}: {
  visible: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  initialResetKey?: string;
  initialResetLogin?: string;
  initialInfoMessage?: string | null;
  parseResetPasswordUrl: (url: string) => { key: string; login: string } | null;
}) {
  const { isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const {
    login,
    register,
    verifyRegistrationOtp,
    confirmPasswordReset,
    isLoading,
    setAuthModalVisible,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode || 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [registeredSuccessEmail, setRegisteredSuccessEmail] = useState('');
  const [registeredSuccessUsername, setRegisteredSuccessUsername] = useState('');
  const [requiresEmailOtp, setRequiresEmailOtp] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);

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

  useEffect(() => {
    if (initialMode) setMode(initialMode);
    if (initialResetKey) setResetKey(initialResetKey);
    if (initialResetLogin) setResetLogin(initialResetLogin);
    if (visible && initialInfoMessage) {
      setErrorMessage(null);
      setInfoMessage(initialInfoMessage);
    }
  }, [initialMode, initialResetKey, initialResetLogin, initialInfoMessage, visible]);

  useEffect(() => {
    const handleIncomingUrl = (incomingUrl?: string | null) => {
      if (!incomingUrl) return;
      const parsed = parseResetPasswordUrl(incomingUrl);
      if (parsed) {
        setResetKey(parsed.key);
        setResetLogin(parsed.login);
        setMode('set_password');
        setErrorMessage(null);
        setInfoMessage(
          `Verification link detected for @${parsed.login}. Please set your password below.`
        );
        setAuthModalVisible(true);
        triggerHaptic('success');
      }
    };

    Linking.getInitialURL().then(handleIncomingUrl);
    const sub = Linking.addEventListener('url', (e) => handleIncomingUrl(e.url));
    return () => sub.remove();
  }, [parseResetPasswordUrl, setAuthModalVisible]);

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
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 100);
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
      setInfoMessage(null);
      setUsername('');
      setPassword('');
      setTouched({});
      onClose();
    } catch (err: any) {
      const code = String(err?.code || err?.data?.code || '');
      const message = String(err?.message || '');

      if (code.includes('invalid_username')) {
        setErrorMessage(
          'Username or email is not registered. Please check spelling or create an account.'
        );
      } else if (code.includes('incorrect_password')) {
        setErrorMessage("Incorrect password. Please try again or tap 'Forgot Password' below.");
      } else if (code.includes('empty_username')) {
        setErrorMessage('Please enter your username or email address.');
      } else {
        setErrorMessage(message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  const handleOpenMailApp = async () => {
    triggerHaptic('selection');
    try {
      const mailUrl = Platform.OS === 'ios' ? 'message://' : 'mailto:';
      const supported = await Linking.canOpenURL(mailUrl).catch(() => false);
      await Linking.openURL(supported ? mailUrl : 'mailto:');
    } catch {
      showToast({
        message: isBangla
          ? 'অনুগ্রহ করে আপনার ডিভাইসের ইমেইল অ্যাপ ওপেন করুন।'
          : 'Please open your email application to check incoming mail.',
        type: 'info',
      });
    }
  };

  const commitRegistrationSuccess = (
    regRes: any,
    trimmedEmail: string,
    assignedUsername: string
  ) => {
    const needsOtp = Boolean(
      regRes &&
      typeof regRes === 'object' &&
      'requiresVerification' in regRes &&
      regRes.requiresVerification
    );
    setRegisteredSuccessEmail(trimmedEmail);
    setRegisteredSuccessUsername(assignedUsername);
    setRequiresEmailOtp(needsOtp);
    setRegOtpCode('');
    setMode('register_success');
    triggerHaptic('success');
    showToast({
      message: isBangla
        ? needsOtp
          ? 'ইমেইলে ৬-ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।'
          : '🎉 রেজিস্ট্রেশন সম্পন্ন হয়েছে! নিশ্চিতকরণ ইমেইল পাঠানো হয়েছে।'
        : needsOtp
          ? 'Check your inbox for the 6-digit verification code.'
          : '🎉 Registration completed! Confirmation email sent.',
      type: 'success',
    });
    setRegFullName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setTouched({});
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

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage(
        isBangla ? 'সঠিক ইমেইল এড্রেস প্রদান করুন।' : 'Please enter a valid email address.'
      );
      triggerHaptic('warning');
      return;
    }

    if (!trimmedPhone || trimmedPhone.replace(/\D/g, '').length < 10) {
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
      const regRes = await register(
        autoUsername,
        trimmedEmail,
        trimmedPassword,
        trimmedPhone,
        trimmedName
      );
      commitRegistrationSuccess(regRes, trimmedEmail, autoUsername);
    } catch (err: any) {
      triggerHaptic('error');
      const code = String(err?.code || err?.data?.code || '');
      const msg = String(err?.message || '');

      if (code.includes('invalid-email') || msg.toLowerCase().includes('valid email')) {
        setErrorMessage(
          isBangla ? 'অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন।' : 'Please provide a valid email address.'
        );
      } else if (
        code.includes('username-exists') ||
        msg.toLowerCase().includes('username already')
      ) {
        try {
          const retryUsername = `${autoUsername}${Math.floor(10 + Math.random() * 90)}`;
          const retryRes = await register(
            retryUsername,
            trimmedEmail,
            trimmedPassword,
            trimmedPhone,
            trimmedName
          );
          commitRegistrationSuccess(retryRes, trimmedEmail, retryUsername);
          return;
        } catch (retryErr: any) {
          setErrorMessage(
            retryErr?.message ||
              (isBangla ? 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।' : 'Registration failed. Please try again.')
          );
        }
      } else {
        setErrorMessage(
          msg ||
            (isBangla
              ? 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।'
              : 'Registration could not be completed. Please try again.')
        );
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
      if (
        code.includes('error_not_user') ||
        msg.includes('error_not_user') ||
        msg.includes('Invalid username or email')
      ) {
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
      setErrorMessage(
        'The password should be at least twelve characters long as required by the website.'
      );
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

  const handleVerifyEmailOtp = async () => {
    const cleanOtp = regOtpCode.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage(
        isBangla
          ? 'ইমেইলে পাঠানো সঠিক ৬-ডিজিটের কোডটি লিখুন।'
          : 'Please enter the 6-digit verification code sent to your email.'
      );
      triggerHaptic('warning');
      return;
    }

    setErrorMessage(null);
    setIsVerifyingEmailOtp(true);
    try {
      await verifyRegistrationOtp(registeredSuccessEmail, cleanOtp);
      triggerHaptic('success');
      showToast({
        message: isBangla ? 'অ্যাকাউন্ট ভেরিফাই ও সক্রিয় হয়েছে!' : 'Account verified and activated!',
        type: 'success',
      });
      setRegOtpCode('');
      setRequiresEmailOtp(false);
      onClose();
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMessage(
        err?.message ||
          (isBangla
            ? 'ভেরিফিকেশন কোডটি সঠিক নয় বা মেয়াদ শেষ হয়েছে।'
            : 'Verification code is invalid or expired. Please try again.')
      );
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  return {
    mode,
    setMode,
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    touched,
    setTouched,
    errorMessage,
    setErrorMessage,
    infoMessage,
    setInfoMessage,
    isResetLoading,
    isKeyboardVisible,
    keyboardHeight,
    regFullName,
    setRegFullName,
    regEmail,
    setRegEmail,
    regPhone,
    setRegPhone,
    regPassword,
    setRegPassword,
    showRegPassword,
    setShowRegPassword,
    isRegistering,
    registeredSuccessEmail,
    registeredSuccessUsername,
    requiresEmailOtp,
    regOtpCode,
    setRegOtpCode,
    isVerifyingEmailOtp,
    resetLogin,
    setResetLogin,
    resetKey,
    setResetKey,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    setShowNewPassword,
    isSettingPassword,
    pastedLink,
    scrollViewRef,
    usernameInputRef,
    passwordInputRef,
    forgotEmailInputRef,
    regNameInputRef,
    regEmailInputRef,
    regPhoneInputRef,
    regPasswordInputRef,
    resetLoginInputRef,
    resetKeyInputRef,
    newPasswordInputRef,
    confirmPasswordInputRef,
    scrollToInput,
    handlePasteVerificationLink,
    handleLogin,
    handleOpenMailApp,
    handleRegister,
    handleResetPassword,
    handleSetNewPassword,
    handleVerifyEmailOtp,
    isLoading,
  };
}
