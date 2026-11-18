import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UserProfile } from '../../services/api/userService';
import { Env } from '../../config/env';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { useResponsive } from '../../theme/responsive';

interface ProfileDeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  colors: any;
  isBangla: boolean;
  deletePass: string;
  setDeletePass: (val: string) => void;
  deleteError: string;
  setDeleteError: (val: string) => void;
  isDeletingAccount: boolean;
  onConfirmDelete: () => void;
  insetsBottom: number;
  t: (key: any, fallback?: string) => string;
}

export const ProfileDeleteAccountModal: React.FC<ProfileDeleteAccountModalProps> = ({
  visible,
  onClose,
  user,
  colors,
  isBangla,
  deletePass,
  setDeletePass,
  deleteError,
  setDeleteError,
  isDeletingAccount,
  onConfirmDelete,
  insetsBottom,
  t,
}) => {
  const { isTablet } = useResponsive();
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent={true}
      animationType="slide"
      onRequestClose={() => {
        if (!isDeletingAccount) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={[styles.modalBackdrop, isTablet && styles.modalBackdropTablet]}
      >
        <View
          style={[
            styles.modalCard,
            isTablet && styles.modalCardTablet,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
              paddingBottom: Math.max(insetsBottom, 20) + 12,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <Text style={[styles.modalTitle, { color: colors.danger }]}>
                {t('deleteAccountConfirmTitle')}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                {user?.email || user?.username}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => !isDeletingAccount && onClose()}
              style={styles.modalCloseBtn}
              disabled={isDeletingAccount}
              accessibilityRole="button"
              accessibilityLabel="Close account deletion modal"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 12, lineHeight: 18, color: colors.textMuted, marginBottom: 14 }}>
            {t('deleteAccountConfirmMsg')}
          </Text>

          <View>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {isBangla ? 'নিশ্চিত করতে বর্তমান পাসওয়ার্ড দিন' : 'Enter Current Password to Confirm'}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  color: colors.text,
                  borderColor: deleteError ? colors.danger : colors.border,
                },
              ]}
              value={deletePass}
              onChangeText={(txt) => {
                setDeletePass(txt);
                if (deleteError) setDeleteError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="current-password"
              textContentType="password"
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              editable={!isDeletingAccount}
            />
          </View>

          {!!deleteError && (
            <Text style={{ fontSize: 12, color: colors.danger, marginTop: 8, fontWeight: '600' }}>
              {deleteError}
            </Text>
          )}

          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isDeletingAccount}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'বাতিল' : 'Cancel'}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                {isBangla ? 'বাতিল' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.danger, opacity: isDeletingAccount ? 0.7 : 1 }]}
              onPress={onConfirmDelete}
              disabled={isDeletingAccount}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'স্থায়ীভাবে মুছুন' : 'Permanently Delete'}
            >
              {isDeletingAccount ? (
                <ActivityIndicator size="small" color={colors.onDanger} />
              ) : (
                <Ionicons name="trash-outline" size={16} color={colors.onDanger} />
              )}
              <Text style={[styles.saveBtnText, { color: colors.onDanger }]}>
                {isDeletingAccount
                  ? isBangla
                    ? 'মুছে ফেলা হচ্ছে...'
                    : 'Deleting...'
                  : isBangla
                  ? 'স্থায়ীভাবে মুছুন'
                  : 'Permanently Delete'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{ marginTop: 14, alignItems: 'center' }}
            onPress={() => Linking.openURL(Env.ACCOUNT_DELETION_URL).catch(() => {})}
            disabled={isDeletingAccount}
            accessibilityRole="button"
            accessibilityLabel="Open web data deletion request page"
          >
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>
              {t('dataDeletionRequestWeb')} →
            </Text>
          </TouchableOpacity>
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
    maxHeight: '85%',
  },
  modalCardTablet: {
    maxWidth: 540,
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
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
