import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { authModalStyles as styles } from './authModal.styles';

interface Props {
  colors: any;
  isBangla: boolean;
  regFullName: string;
  setRegFullName: (v: string) => void;
  regEmail: string;
  setRegEmail: (v: string) => void;
  regPhone: string;
  setRegPhone: (v: string) => void;
  regPassword: string;
  setRegPassword: (v: string) => void;
  showRegPassword: boolean;
  setShowRegPassword: (v: boolean) => void;
  touched: Record<string, boolean>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  errorMessage: string | null;
  setErrorMessage: (v: string | null) => void;
  setInfoMessage: (v: string | null) => void;
  isRegistering: boolean;
  regNameInputRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  regEmailInputRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  regPhoneInputRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  regPasswordInputRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  scrollToInput: (y: number) => void;
  onSubmitRegister: () => void;
  onSwitchToLogin: () => void;
  onSwitchToSetPassword: () => void;
}

export const AuthRegisterForm: React.FC<Props> = ({
  colors,
  isBangla,
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
  touched,
  setTouched,
  errorMessage,
  setErrorMessage,
  setInfoMessage,
  isRegistering,
  regNameInputRef,
  regEmailInputRef,
  regPhoneInputRef,
  regPasswordInputRef,
  scrollToInput,
  onSubmitRegister,
  onSwitchToLogin,
  onSwitchToSetPassword,
}) => (
  <>
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
        <Ionicons
          name="person-outline"
          size={18}
          color={colors.textMuted}
          style={styles.inputIcon}
        />
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

    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
        {isBangla
          ? 'মোবাইল নম্বর * (কোর্স ভর্তি ও ভেরিফিকেশনে আবশ্যক)'
          : 'Phone Number * (Required for enrollment & verification)'}
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
            borderColor:
              touched.regPassword && regPassword.length < 12 ? colors.danger : colors.border,
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
          ref={regPasswordInputRef}
          style={[styles.input, { color: colors.text }]}
          placeholder={
            isBangla ? 'কমপক্ষে ১২ অক্ষরের পাসওয়ার্ড লিখুন' : 'Enter at least 12 character password'
          }
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
          onSubmitEditing={onSubmitRegister}
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

      <View
        style={[
          styles.siteHintBox,
          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, marginTop: 8 },
        ]}
      >
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

    <TouchableOpacity
      style={[styles.submitButton, { backgroundColor: '#E34234' }]}
      onPress={onSubmitRegister}
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

    <View style={styles.switchRow}>
      <Text style={[styles.switchText, { color: colors.textMuted }]}>
        {isBangla ? 'ইতিমধ্যে অ্যাকাউন্ট রয়েছে?' : 'Already have an account?'}
      </Text>
      <TouchableOpacity
        onPress={() => {
          onSwitchToLogin();
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

    <View style={{ marginTop: 14, alignItems: 'center' }}>
      <TouchableOpacity
        onPress={() => {
          onSwitchToSetPassword();
          setErrorMessage(null);
        }}
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 12, color: colors.textMuted, textDecorationLine: 'underline' }}>
          {isBangla
            ? 'ইমেইল ভেরিফিকেশন বা পাসওয়ার্ড রিসেট লিংক রয়েছে?'
            : 'Have a verification or reset link? Enter here'}
        </Text>
      </TouchableOpacity>
    </View>
  </>
);
