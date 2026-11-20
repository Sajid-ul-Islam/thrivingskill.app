import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { useResponsive } from '../../theme/responsive';

interface ProfileChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  colors: any;
  isBangla: boolean;
  currentPass: string;
  setCurrentPass: (val: string) => void;
  newPass: string;
  setNewPass: (val: string) => void;
  confirmPass: string;
  setConfirmPass: (val: string) => void;
  showCurrentPass: boolean;
  setShowCurrentPass: (val: boolean) => void;
  showNewPass: boolean;
  setShowNewPass: (val: boolean) => void;
  showConfirmPass: boolean;
  setShowConfirmPass: (val: boolean) => void;
  handleChangePassword: () => void;
  isChangingPass: boolean;
}

export const ProfileChangePasswordModal: React.FC<ProfileChangePasswordModalProps> = ({
  visible,
  onClose,
  colors,
  isBangla,
  currentPass,
  setCurrentPass,
  newPass,
  setNewPass,
  confirmPass,
  setConfirmPass,
  showCurrentPass,
  setShowCurrentPass,
  showNewPass,
  setShowNewPass,
  showConfirmPass,
  setShowConfirmPass,
  handleChangePassword,
  isChangingPass,
}) => {
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const modalNewPassRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const modalConfirmPassRef = useRef<React.ElementRef<typeof TextInput>>(null);

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={[
          styles.modalBackdrop,
          isTablet && styles.modalBackdropTablet,
          {
            paddingTop: Math.max(16, insets.top),
            paddingBottom: Math.max(16, insets.bottom),
          },
        ]}
      >
        <View
          style={[
            styles.modalCard,
            isTablet && styles.modalCardTablet,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border, maxHeight: '90%' },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isBangla ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {isBangla ? 'আপনার অ্যাকাউন্টের নিরাপত্তা আপডেট করুন' : 'Update your account credentials'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel={isBangla ? 'পাসওয়ার্ড উইন্ডো বন্ধ করুন' : 'Close change password modal'}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {isBangla ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                </Text>
                <View
                  style={[
                    styles.passwordInputRow,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInputFlex, { color: colors.text }]}
                    value={currentPass}
                    onChangeText={setCurrentPass}
                    secureTextEntry={!showCurrentPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => modalNewPassRef.current?.focus()}
                    blurOnSubmit={false}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={isBangla ? 'বর্তমান পাসওয়ার্ড' : 'Current password'}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      setShowCurrentPass(!showCurrentPass);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={showCurrentPass ? 'Hide current password' : 'Show current password'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showCurrentPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {isBangla ? 'নতুন পাসওয়ার্ড * (কমপক্ষে ১২ অক্ষর)' : 'New Password * (Min 12 Chars)'}
                </Text>
                <View
                  style={[
                    styles.passwordInputRow,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: newPass.length > 0 && newPass.length < 12 ? colors.danger : colors.border,
                    },
                  ]}
                >
                  <TextInput
                    ref={modalNewPassRef}
                    style={[styles.passwordInputFlex, { color: colors.text }]}
                    value={newPass}
                    onChangeText={setNewPass}
                    secureTextEntry={!showNewPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    onSubmitEditing={() => modalConfirmPassRef.current?.focus()}
                    blurOnSubmit={false}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={isBangla ? 'নতুন পাসওয়ার্ড' : 'New password'}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      setShowNewPass(!showNewPass);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={showNewPass ? 'Hide new password' : 'Show new password'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showNewPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {newPass.length > 0 && newPass.length < 12 && (
                  <Text style={{ fontSize: 11, color: colors.danger, marginTop: 4, fontWeight: '600' }}>
                    {isBangla
                      ? 'পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।'
                      : 'Password should be at least 12 characters long.'}
                  </Text>
                )}
                {/* Official Password Hint from thrivingskill.com / WordPress */}
                <View
                  style={[
                    styles.siteHintBox,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, marginTop: 8 },
                  ]}
                >
                  <Ionicons name="information-circle" size={16} color={colors.primary} style={{ marginTop: 1 }} />
                  <Text style={[styles.siteHintText, { color: colors.textMuted }]}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>Hint: </Text>
                    The password should be at least twelve characters long. To make it stronger, use upper and lower case
                    letters, numbers, and symbols like ! " ? $ % ^ & ).
                  </Text>
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {isBangla ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                </Text>
                <View
                  style={[
                    styles.passwordInputRow,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor:
                        confirmPass.length > 0 && confirmPass !== newPass ? colors.danger : colors.border,
                    },
                  ]}
                >
                  <TextInput
                    ref={modalConfirmPassRef}
                    style={[styles.passwordInputFlex, { color: colors.text }]}
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    secureTextEntry={!showConfirmPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={isBangla ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm new password'}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      setShowConfirmPass(!showConfirmPass);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {confirmPass.length > 0 && confirmPass !== newPass && (
                  <Text style={{ fontSize: 11, color: colors.danger, marginTop: 4, fontWeight: '600' }}>
                    {isBangla ? 'পাসওয়ার্ড মেলেনি।' : 'Passwords do not match.'}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={isBangla ? 'বাতিল' : 'Cancel'}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isChangingPass ? 0.7 : 1 }]}
                onPress={handleChangePassword}
                disabled={isChangingPass}
                accessibilityRole="button"
                accessibilityLabel={isBangla ? 'পাসওয়ার্ড আপডেট' : 'Update Password'}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.onPrimary} />
                <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>
                  {isChangingPass
                    ? isBangla
                      ? 'আপডেট হচ্ছে...'
                      : 'Updating...'
                    : isBangla
                    ? 'পাসওয়ার্ড আপডেট'
                    : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropTablet: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  modalCardTablet: {
    maxWidth: 560,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 24,
    borderBottomWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  modalCloseBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  passwordInputFlex: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  eyeToggleBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
