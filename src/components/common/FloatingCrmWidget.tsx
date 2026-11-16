import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFeedback } from '../../context/FeedbackContext';
import { triggerHaptic } from '../../utils/haptics';
import {
  CRM_CHANNELS,
  openWhatsAppChat,
  openFacebookMessenger,
  CrmInquiryType,
} from '../../config/crm';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

export interface FloatingCrmWidgetProps {
  bottomOffset?: number;
  inquiryType?: CrmInquiryType;
  onOpenFullModal?: () => void;
}

export const FloatingCrmWidget: React.FC<FloatingCrmWidgetProps> = ({
  bottomOffset = 84,
  inquiryType = 'general',
  onOpenFullModal,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const [expanded, setExpanded] = useState(false);

  const animValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subtle breathing pulse on the main FAB to catch the user's eye
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const toggleExpand = () => {
    triggerHaptic('light');
    const toVal = expanded ? 0 : 1;
    Animated.spring(animValue, {
      toValue: toVal,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const closeMenu = () => {
    if (!expanded) return;
    Animated.timing(animValue, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setExpanded(false));
  };

  const handleWhatsApp = async () => {
    triggerHaptic('medium');
    closeMenu();
    showToast({
      message: isBangla ? 'হোয়াটসঅ্যাপ খোলা হচ্ছে...' : 'Launching WhatsApp chat...',
      type: 'info',
    });
    await openWhatsAppChat(inquiryType, isBangla);
  };

  const handleMessenger = async () => {
    triggerHaptic('medium');
    closeMenu();
    showToast({
      message: isBangla ? 'মেসেঞ্জার খোলা হচ্ছে...' : 'Launching Facebook Messenger...',
      type: 'info',
    });
    await openFacebookMessenger();
  };

  const handleMore = () => {
    closeMenu();
    if (onOpenFullModal) {
      onOpenFullModal();
    }
  };

  // Menu items animation interpolation
  const menuOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const rotateIcon = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Semi-transparent backdrop when expanded */}
      {expanded && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      <View
        pointerEvents="box-none"
        style={[styles.container, { bottom: bottomOffset }]}
      >
        {/* Expanded Options Menu */}
        <Animated.View
          pointerEvents={expanded ? 'auto' : 'none'}
          style={[
            styles.menuContainer,
            {
              opacity: menuOpacity,
              transform: [{ translateY: menuTranslateY }],
            },
          ]}
        >
          {/* 1. WhatsApp Live Chat */}
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: '#25D366' }]}
            onPress={handleWhatsApp}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Chat on WhatsApp (01312-100288)"
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>WhatsApp Chat</Text>
              <Text style={styles.menuSubtitle}>{CRM_CHANNELS.phoneDisplay} • Instant reply</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 2. Facebook Messenger */}
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: '#0084FF' }]}
            onPress={handleMessenger}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Chat on Facebook Messenger"
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Facebook Messenger</Text>
              <Text style={styles.menuSubtitle}>@thrivingskills • Active community</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 3. More Options / Full Sheet Trigger */}
          {onOpenFullModal && (
            <TouchableOpacity
              style={[styles.moreItem, { backgroundColor: colors.surfaceSubtle }]}
              onPress={handleMore}
              accessibilityRole="button"
              accessibilityLabel="View full support options"
            >
              <Ionicons name="options-outline" size={15} color={colors.textMuted} />
              <Text style={[styles.moreItemText, { color: colors.textMuted }]}>
                {isBangla ? 'সকল সাপোর্ট ক্যাটাগরি দেখুন' : 'All inquiry topics & FAQs'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Main Floating Trigger Pill/Button */}
        <View style={styles.fabRow}>
          {/* Text Pill Badge */}
          {!expanded && (
            <TouchableOpacity
              style={[
                styles.fabPill,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: isDark ? colors.border : 'rgba(37, 211, 102, 0.4)',
                  shadowColor: colors.cardShadow,
                },
              ]}
              onPress={toggleExpand}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Open live support options"
            >
              <View style={styles.onlineDot} />
              <Text style={[styles.fabPillText, { color: colors.text }]}>
                {isBangla ? 'হোয়াটসঅ্যাপে সাহায্য' : 'Chat / WhatsApp'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Primary Circular FAB */}
          <Animated.View style={{ transform: [{ scale: expanded ? 1 : pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.fabButton,
                {
                  backgroundColor: expanded ? '#102F53' : '#25D366',
                  shadowColor: expanded ? '#102F53' : '#25D366',
                },
              ]}
              onPress={toggleExpand}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Close support menu' : 'Open WhatsApp and Messenger support'}
            >
              <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
                <Ionicons
                  name={expanded ? 'close' : 'logo-whatsapp'}
                  size={expanded ? 24 : 26}
                  color="#FFFFFF"
                />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 998,
  },
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: 250,
    marginBottom: 10,
    gap: 8,
    borderRadius: shape.large,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: shape.large,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  menuIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  menuSubtitle: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: shape.medium,
    gap: 6,
  },
  moreItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: shape.full,
    borderWidth: 1.5,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  fabPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
