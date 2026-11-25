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

interface PopupThemeConfig {
  icon: string;
  iconColor: string;
  iconBg: string;
  primaryBg: string;
  primaryText: string;
}

export const POPUP_THEME: Record<
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
    iconColor: '#102F53',
    iconBg: 'rgba(16, 47, 83, 0.08)',
    primaryBg: '#102F53',
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

const getPopupTheme = (type: PopupType, colors: any, isDark: boolean): PopupThemeConfig => {
  switch (type) {
    case 'confirm':
      return {
        icon: 'help-circle-outline',
        iconColor: isDark ? colors.primary : colors.brandNavy,
        iconBg: isDark ? 'rgba(255, 182, 6, 0.16)' : 'rgba(16, 47, 83, 0.08)',
        primaryBg: colors.primary,
        primaryText: colors.onPrimary,
      };
    case 'info':
      return {
        icon: 'information-circle-outline',
        iconColor: isDark ? colors.primary : colors.brandNavy,
        iconBg: isDark ? 'rgba(255, 182, 6, 0.16)' : 'rgba(16, 47, 83, 0.08)',
        primaryBg: colors.primary,
        primaryText: colors.onPrimary,
      };
    case 'warning':
      return {
        icon: 'alert-circle-outline',
        iconColor: isDark ? '#FBBF24' : '#D97706',
        iconBg: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(217, 119, 6, 0.12)',
        primaryBg: '#F59E0B',
        primaryText: isDark ? '#102F53' : '#FFFFFF',
      };
    case 'destructive':
      return {
        icon: 'trash-outline',
        iconColor: isDark ? '#F87171' : colors.accent,
        iconBg: isDark ? 'rgba(227, 66, 52, 0.18)' : 'rgba(227, 66, 52, 0.12)',
        primaryBg: colors.accent,
        primaryText: '#FFFFFF',
      };
    case 'success':
      return {
        icon: 'checkmark-circle-outline',
        iconColor: isDark ? '#34D399' : colors.success,
        iconBg: isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(16, 185, 129, 0.12)',
        primaryBg: colors.success,
        primaryText: isDark ? '#0B1420' : '#FFFFFF',
      };
  }
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
  const theme = getPopupTheme(type, colors, isDark);

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
    const confirmFn = popup.onConfirm;
    // Dismiss popup dialog first so native modal teardown does not conflict with state transitions
    onDismiss();
    try {
      await confirmFn();
    } catch (err) {
      console.warn('[ModernPopup] Confirm handler error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleCancel}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
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
              borderColor: isDark ? colors.border : 'rgba(16, 47, 83, 0.08)',
              borderWidth: 1,
              shadowColor: isDark ? '#000000' : colors.primary,
              shadowOpacity: isDark ? 0.45 : 0.12,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          accessibilityRole="alertdialog"
          accessibilityViewIsModal={true}
        >
          {/* Top-Right Dismiss Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close popup"
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Header Icon Badge */}
          <View style={[styles.iconWrap, { backgroundColor: theme.iconBg }]}>
            <Ionicons name={(popup?.icon || theme.icon) as any} size={32} color={theme.iconColor} />
          </View>

          {/* Title & Description */}
          <Text
            style={[
              typography.h3,
              styles.title,
              { color: isDark ? colors.text : colors.brandNavy },
            ]}
          >
            {popup?.title}
          </Text>
          <Text style={[typography.bodyMedium, styles.message, { color: colors.textMuted }]}>
            {popup?.message}
          </Text>

          {/* Button Actions */}
          <View style={styles.actionsRow}>
            {popup?.secondaryLabel && (
              <SpringPressable
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel={popup.secondaryLabel}
              >
                <Text
                  style={[styles.cancelText, { color: isDark ? colors.text : colors.textMuted }]}
                >
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
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: shape.extraLarge,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 8,
    fontSize: 18.5,
    letterSpacing: -0.3,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontSize: 14,
    maxWidth: '92%',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontWeight: '700',
    fontSize: 14.5,
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
    fontWeight: '800',
    fontSize: 14.5,
  },
});
