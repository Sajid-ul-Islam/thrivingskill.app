import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { triggerHaptic } from '../../../utils/haptics';
import { authModalStyles as styles } from './authModal.styles';

interface Props {
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  registeredSuccessEmail: string;
  registeredSuccessUsername: string;
  regEmail: string;
  requiresEmailOtp: boolean;
  regOtpCode: string;
  setRegOtpCode: (v: string) => void;
  isVerifyingEmailOtp: boolean;
  errorMessage: string | null;
  setErrorMessage: (v: string | null) => void;
  onVerifyEmailOtp: () => void;
  onOpenMailApp: () => void;
  onProceedToSignIn: () => void;
  onSwitchToSetPassword: () => void;
  onClose: () => void;
}

export const AuthRegisterSuccessView: React.FC<Props> = ({
  colors,
  isDark,
  isBangla,
  registeredSuccessEmail,
  registeredSuccessUsername,
  regEmail,
  requiresEmailOtp,
  regOtpCode,
  setRegOtpCode,
  isVerifyingEmailOtp,
  errorMessage,
  setErrorMessage,
  onVerifyEmailOtp,
  onOpenMailApp,
  onProceedToSignIn,
  onSwitchToSetPassword,
  onClose,
}) => (
  <View style={styles.registerSuccessContainer}>
    <View style={styles.successIconOuterRing}>
      <View
        style={[
          styles.successIconCircle,
          { backgroundColor: isDark ? 'rgba(16, 47, 83, 0.4)' : '#F0FDF4' },
        ]}
      >
        <Ionicons name="mail-open" size={42} color="#102F53" />
        <View style={styles.successMiniBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        </View>
      </View>
    </View>

    <Text style={[styles.successTitle, { color: colors.text }]}>
      {isBangla ? 'রেজিস্ট্রেশন সফল হয়েছে!' : 'Registration Successful!'}
    </Text>

    <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
      {isBangla
        ? 'আপনার অ্যাকাউন্টের একটি কনফার্মেশন ও অ্যাক্টিভেশন ইমেইল পাঠানো হয়েছে।'
        : 'A confirmation & activation email has been sent to your registered address.'}
    </Text>

    <View
      style={[
        styles.emailNoticeBox,
        {
          backgroundColor: isDark ? 'rgba(227, 66, 52, 0.08)' : '#FFF1F2',
          borderColor: 'rgba(227, 66, 52, 0.3)',
        },
      ]}
    >
      <View style={styles.emailNoticeRow}>
        <Ionicons name="mail" size={16} color="#E34234" />
        <Text style={[styles.emailNoticeLabel, { color: colors.textMuted }]}>
          {isBangla ? 'নিবন্ধিত ইমেইল ঠিকানা:' : 'Registered Email Address:'}
        </Text>
      </View>
      <Text
        style={[styles.registeredEmailHighlight, { color: colors.text }]}
        numberOfLines={1}
        selectable
      >
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

    <View
      style={[
        styles.guidanceCard,
        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.guidanceHeading, { color: colors.text }]}>
        {isBangla ? 'পরবর্তী করণীয় ৩টি সহজ ধাপ:' : 'What to do next:'}
      </Text>

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

    <View style={styles.successActionsContainer}>
      {requiresEmailOtp && (
        <View
          style={[
            styles.guidanceCard,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.guidanceHeading, { color: colors.text }]}>
            {isBangla
              ? '৬-ডিজিটের ইমেইল ভেরিফিকেশন কোড লিখুন'
              : 'Enter 6-Digit Email Verification Code'}
          </Text>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border, marginBottom: 8 },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="123456"
              placeholderTextColor={colors.textLight}
              value={regOtpCode}
              onChangeText={(val) => {
                setRegOtpCode(val.replace(/\D/g, '').slice(0, 6));
                if (errorMessage) setErrorMessage(null);
              }}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={onVerifyEmailOtp}
            />
          </View>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: '#102F53' }]}
            onPress={onVerifyEmailOtp}
            disabled={isVerifyingEmailOtp}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={
              isBangla ? 'কোড ভেরিফাই ও অ্যাকাউন্ট সক্রিয় করুন' : 'Verify Code & Activate Account'
            }
          >
            {isVerifyingEmailOtp ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                {isBangla ? 'কোড ভেরিফাই ও অ্যাকাউন্ট সক্রিয় করুন' : 'Verify Code & Activate Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: '#E34234' }]}
        onPress={onOpenMailApp}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={isBangla ? 'ইমেইল অ্যাপ খুলুন' : 'Open Email App'}
      >
        <Ionicons name="mail-open" size={18} color="#FFFFFF" />
        <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
          {isBangla ? 'ইমেইল অ্যাপ খুলুন' : 'Open Email App'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryActionButton,
          { borderColor: colors.border, backgroundColor: colors.surfaceCard },
        ]}
        onPress={onProceedToSignIn}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={isBangla ? 'পাসওয়ার্ড দিয়ে সাইন ইন করুন' : 'Proceed to Sign In'}
      >
        <Ionicons name="log-in-outline" size={18} color={colors.primary} />
        <Text style={[styles.secondaryActionText, { color: colors.primary }]}>
          {isBangla ? 'পাসওয়ার্ড দিয়ে সাইন ইন করুন' : 'Proceed to Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.keyEntryLink}
        onPress={() => {
          triggerHaptic('selection');
          onSwitchToSetPassword();
        }}
        accessibilityRole="button"
      >
        <Text style={[styles.keyEntryLinkText, { color: colors.textMuted }]}>
          {isBangla
            ? 'ইমেইল লিংক কপি করেছেন? এখানে পেস্ট করুন'
            : 'Have a link from email? Enter key here'}
        </Text>
      </TouchableOpacity>

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
);
