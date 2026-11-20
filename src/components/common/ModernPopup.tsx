import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { PopupPayload, PopupType } from '../../context/FeedbackContext';
import { shape } from '../../theme/shapes';
import { typography } from '../../theme/typography';
import { triggerHaptic } from '../../utils/haptics';
import { SpringPressable } from './SpringPressable';

interface ModernPopupProps {
  popup: PopupPayload | null;
  onDismiss: () => void;
}

const POPUP_THEME: Record<
  PopupType,
  {
    icon: string;
    iconColor: string;
    iconBg: string;
    primaryBg: string;
    primaryText: string;
  }
> = {
  confirm: {
    icon: 'help-circle-outline',
    iconColor: '#102F53',
    iconBg: 'rgba(16, 47, 83, 0.1)',
    primaryBg: '#102F53',
    primaryText: '#FFFFFF',
  },
  info: {
    icon: 'information-circle-outline',
    iconColor: '#0284C7',
    iconBg: 'rgba(2, 132, 199, 0.1)',
    primaryBg: '#0284C7',
    primaryText: '#FFFFFF',
  },
  warning: {
    icon: 'alert-circle-outline',
    iconColor: '#D97706',
    iconBg: 'rgba(217, 119, 6, 0.12)',
    primaryBg: '#D97706',
    primaryText: '#FFFFFF',
  },
  destructive: {
    icon: 'trash-outline',
    iconColor: '#E34234',
    iconBg: 'rgba(227, 66, 52, 0.12)',
    primaryBg: '#E34234',
    primaryText: '#FFFFFF',
  },
  success: {
    icon: 'checkmark-circle-outline',
    iconColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    primaryBg: '#10B981',
    primaryText: '#FFFFFF',
  },
};

export const ModernPopup: React.FC<ModernPopupProps> = ({ popup, onDismiss }) => {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (popup) {
      setModalVisible(true);
      setIsSubmitting(false);
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 130,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => setModalVisible(false));
    }
  }, [popup, scaleAnim, opacityAnim, modalVisible]);

  // Android Back Handler
  useEffect(() => {
    if (!modalVisible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel();
      return true;
    });
    return () => sub.remove();
  }, [modalVisible]);

  if (!modalVisible && !popup) return null;

  const type: PopupType = popup?.type || (popup?.isDestructive ? 'destructive' : 'confirm');
  const theme = POPUP_THEME[type];

  const handleCancel = () => {
    triggerHaptic('light');
    if (popup?.onCancel) popup.onCancel();
    onDismiss();
  };

  const handleConfirm = async () => {
    if (!popup?.onConfirm) {
      onDismiss();
      return;
    }
    triggerHaptic(type === 'destructive' ? 'error' : 'medium');
    setIsSubmitting(true);
    try {
      await popup.onConfirm();
    } finally {
      setIsSubmitting(false);
      onDismiss();
    }
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <Animated.View
        style={[styles.backdrop, { opacity: opacityAnim }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleCancel}
        />

        <Animated.View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E2E8F0',
              borderWidth: isDark ? 1 : 0,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          accessibilityRole="alertdialog"
          accessibilityViewIsModal={true}
        >
          {/* Header Icon Badge */}
          <View style={[styles.iconWrap, { backgroundColor: theme.iconBg }]}>
            <Ionicons
              name={(popup?.icon || theme.icon) as any}
              size={32}
              color={theme.iconColor}
            />
          </View>

          {/* Title & Description */}
          <Text style={[typography.h4, styles.title, { color: isDark ? colors.text : '#102F53' }]}>
            {popup?.title}
          </Text>
          <Text style={[typography.bodyMedium, styles.message, { color: isDark ? colors.textMuted : '#64748B' }]}>
            {popup?.message}
          </Text>

          {/* Button Actions */}
          <View style={styles.actionsRow}>
            {popup?.secondaryLabel && (
              <SpringPressable
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9',
                    borderColor: isDark ? colors.border : '#E2E8F0',
                  },
                ]}
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel={popup.secondaryLabel}
              >
                <Text style={[styles.cancelText, { color: isDark ? colors.text : '#475569' }]}>
                  {popup.secondaryLabel}
                </Text>
              </SpringPressable>
            )}

            <SpringPressable
              style={[
                styles.confirmBtn,
                { backgroundColor: theme.primaryBg },
                !popup?.secondaryLabel && styles.fullWidthBtn,
              ]}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={popup?.primaryLabel || 'Confirm'}
            >
              <Text style={[styles.confirmText, { color: theme.primaryText }]}>
                {isSubmitting ? '...' : popup?.primaryLabel || 'Confirm'}
              </Text>
            </SpringPressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: shape.largeIncreased,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#102F53',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 18,
  },
  message: {
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: shape.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fullWidthBtn: {
    flex: 1,
    width: '100%',
  },
  confirmText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
