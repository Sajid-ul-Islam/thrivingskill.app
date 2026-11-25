import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { authModalStyles as styles } from './authModal.styles';

interface Props {
  colors: any;
  username: string;
  setUsername: (v: string) => void;
  errorMessage: string | null;
  setErrorMessage: (v: string | null) => void;
  setInfoMessage: (v: string | null) => void;
  isResetLoading: boolean;
  forgotEmailInputRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  scrollToInput: (y: number) => void;
  onSubmitReset: () => void;
  onBackToLogin: () => void;
}

export const AuthForgotPasswordForm: React.FC<Props> = ({
  colors,
  username,
  setUsername,
  errorMessage,
  setErrorMessage,
  setInfoMessage,
  isResetLoading,
  forgotEmailInputRef,
  scrollToInput,
  onSubmitReset,
  onBackToLogin,
}) => (
  <>
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email or Username</Text>
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
          onSubmitEditing={onSubmitReset}
          autoComplete="email"
          textContentType="username"
        />
      </View>
    </View>

    <TouchableOpacity
      style={[styles.submitButton, { backgroundColor: '#E34234' }]}
      onPress={onSubmitReset}
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
          <Ionicons
            name="mail-unread-outline"
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
        onBackToLogin();
        setErrorMessage(null);
        setInfoMessage(null);
      }}
      accessibilityRole="button"
    >
      <Ionicons name="arrow-back" size={16} color={colors.primary} />
      <Text style={[styles.backToLoginText, { color: colors.primary }]}>Back to Sign In</Text>
    </TouchableOpacity>
  </>
);
