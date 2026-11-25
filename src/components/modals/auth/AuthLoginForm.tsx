import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { authModalStyles as styles } from './authModal.styles';

interface Props {
  colors: any;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  touched: Record<string, boolean>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  errorMessage: string | null;
  setErrorMessage: (v: string | null) => void;
  setInfoMessage: (v: string | null) => void;
  isLoading: boolean;
  usernameInputRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  passwordInputRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  scrollToInput: (y: number) => void;
  onLogin: () => void;
  onOpenSetPassword: () => void;
  onOpenForgotPassword: () => void;
}

export const AuthLoginForm: React.FC<Props> = ({
  colors,
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
  setInfoMessage,
  isLoading,
  usernameInputRef,
  passwordInputRef,
  scrollToInput,
  onLogin,
  onOpenSetPassword,
  onOpenForgotPassword,
}) => (
  <>
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email or Username</Text>
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
          onSubmitEditing={onLogin}
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

    <View style={styles.loginActionsRow}>
      <TouchableOpacity
        onPress={() => {
          onOpenSetPassword();
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
          onOpenForgotPassword();
          setErrorMessage(null);
          setInfoMessage(null);
        }}
        style={styles.forgotPasswordTouch}
        accessibilityRole="button"
      >
        <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={[styles.submitButton, { backgroundColor: '#E34234' }]}
      onPress={onLogin}
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
);
