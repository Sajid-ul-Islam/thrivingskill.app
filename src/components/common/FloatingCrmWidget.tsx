import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  useWindowDimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
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

const FAB_SIZE = 50;
const DISMISS_TARGET_SIZE = 58;
const SNAP_MARGIN = 8;

export interface FloatingCrmWidgetProps {
  bottomOffset?: number;
  inquiryType?: CrmInquiryType;
  onOpenFullModal?: () => void;
  isDismissed?: boolean;
  onDismissChange?: (dismissed: boolean) => void;
}

export const FloatingCrmWidget: React.FC<FloatingCrmWidgetProps> = ({
  bottomOffset = 84,
  inquiryType = 'general',
  onOpenFullModal,
  isDismissed: controlledDismissed,
  onDismissChange,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverDismiss, setIsOverDismiss] = useState(false);
  const [internalDismissed, setInternalDismissed] = useState(false);
  const [snappedSide, setSnappedSide] = useState<'left' | 'right'>('right');

  const isDismissed = controlledDismissed !== undefined ? controlledDismissed : internalDismissed;

  const setDismissedState = (dismissed: boolean) => {
    setInternalDismissed(dismissed);
    onDismissChange?.(dismissed);
  };

  // Initial positioning at bottom-right
  const defaultX = screenWidth - FAB_SIZE - SNAP_MARGIN;
  const defaultY = screenHeight - bottomOffset - FAB_SIZE;

  const pan = useRef(new Animated.ValueXY({ x: defaultX, y: defaultY })).current;
  const currentPos = useRef({ x: defaultX, y: defaultY });
  const hasUserMovedRef = useRef(false);

  const animValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const dismissTargetScale = useRef(new Animated.Value(0)).current;

  // Track coordinates
  useEffect(() => {
    const id = pan.addListener((val) => {
      currentPos.current = val;
    });
    return () => {
      pan.removeListener(id);
    };
  }, [pan]);

  // Adjust default Y when mini player offset changes (only if user hasn't dragged elsewhere)
  useEffect(() => {
    if (!hasUserMovedRef.current) {
      const targetX = screenWidth - FAB_SIZE - SNAP_MARGIN;
      const targetY = screenHeight - bottomOffset - FAB_SIZE;
      Animated.spring(pan, {
        toValue: { x: targetX, y: targetY },
        friction: 7,
        tension: 40,
        useNativeDriver: false,
      }).start();
      currentPos.current = { x: targetX, y: targetY };
    }
  }, [bottomOffset, screenWidth, screenHeight]);

  // Subtle breathing pulse on the main FAB
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
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
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const closeMenu = () => {
    if (!expanded) return;
    Animated.timing(animValue, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(() => setExpanded(false));
  };

  const handleWhatsApp = async () => {
    triggerHaptic('medium');
    closeMenu();
    showToast({
      message: isBangla ? 'হোয়াটসঅ্যাপ খোলা হচ্ছে...' : 'Launching WhatsApp...',
      type: 'info',
    });
    await openWhatsAppChat(inquiryType, isBangla);
  };

  const handleMessenger = async () => {
    triggerHaptic('medium');
    closeMenu();
    showToast({
      message: isBangla ? 'মেসেঞ্জার খোলা হচ্ছে...' : 'Launching Messenger...',
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

  const restoreBubble = () => {
    setDismissedState(false);
    bubbleScale.setValue(0);
    const targetX = screenWidth - FAB_SIZE - SNAP_MARGIN;
    const targetY = screenHeight - bottomOffset - FAB_SIZE;
    currentPos.current = { x: targetX, y: targetY };
    pan.setValue({ x: targetX, y: targetY });
    setSnappedSide('right');
    hasUserMovedRef.current = false;
    triggerHaptic('success');
    Animated.spring(bubbleScale, {
      toValue: 1,
      friction: 5,
      tension: 45,
      useNativeDriver: false,
    }).start();
  };

  // PanResponder to handle smooth dragging & drop-to-dismiss (Messenger bubble physics)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
        setIsDragging(true);

        // Show bottom dismiss target
        Animated.spring(dismissTargetScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });

        // Calculate proximity to bottom dismiss target
        const currentCenterX = currentPos.current.x + gesture.dx + FAB_SIZE / 2;
        const currentCenterY = currentPos.current.y + gesture.dy + FAB_SIZE / 2;
        const targetCenterX = screenWidth / 2;
        const targetCenterY = screenHeight - Math.max(insets.bottom, 16) - 45;

        const dist = Math.hypot(currentCenterX - targetCenterX, currentCenterY - targetCenterY);
        const isNear = dist < 75;

        setIsOverDismiss(isNear);
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        setIsDragging(false);

        // Hide dismiss target
        Animated.timing(dismissTargetScale, {
          toValue: 0,
          duration: 140,
          useNativeDriver: false,
        }).start();

        // 1. Was it a simple Tap without moving?
        if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
          toggleExpand();
          return;
        }

        hasUserMovedRef.current = true;

        // Auto-close speed dial if open during drag
        if (expanded) {
          closeMenu();
        }

        // 2. Check if dropped onto the Dismiss Target
        const currentCenterX = currentPos.current.x + FAB_SIZE / 2;
        const currentCenterY = currentPos.current.y + FAB_SIZE / 2;
        const targetCenterX = screenWidth / 2;
        const targetCenterY = screenHeight - Math.max(insets.bottom, 16) - 45;
        const dist = Math.hypot(currentCenterX - targetCenterX, currentCenterY - targetCenterY);

        if (dist < 85) {
          // Sucked into dismiss circle
          triggerHaptic('medium');
          Animated.timing(bubbleScale, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
          }).start(() => {
            setDismissedState(true);
          });

          showToast({
            message: isBangla
              ? 'চ্যাট বাবল সরানো হয়েছে। পুনরায় আনতে ট্যাপ করুন।'
              : 'Chat bubble removed. Tap to restore.',
            type: 'info',
            actionLabel: isBangla ? 'পুনরায় আনুন' : 'Restore',
            onAction: restoreBubble,
          });
          return;
        }

        // 3. Snap to nearest side edge (Messenger chat-head physics)
        const isLeft = currentCenterX < screenWidth / 2;
        const targetX = isLeft ? SNAP_MARGIN : screenWidth - FAB_SIZE - SNAP_MARGIN;
        setSnappedSide(isLeft ? 'left' : 'right');

        const minY = insets.top + 50;
        const maxY = screenHeight - insets.bottom - 90;
        const targetY = Math.max(minY, Math.min(maxY, currentPos.current.y));

        triggerHaptic('light');
        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          friction: 6,
          tension: 45,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // Animations
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
      {/* Semi-transparent backdrop when menu is expanded */}
      {expanded && !isDismissed && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Docked Edge Tab when bubble is dismissed (Allows 1-tap restore anytime) */}
      {isDismissed && (
        <View
          style={[
            styles.dockedRestoreTab,
            {
              top: screenHeight - bottomOffset - 40,
              backgroundColor: colors.surfaceCard,
              borderColor: '#25D366',
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.dockedRestoreBtn}
            onPress={restoreBubble}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reopen WhatsApp bubble"
          >
            <View style={styles.onlineDot} />
            <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
            <Text style={[styles.dockedRestoreText, { color: colors.text }]}>
              {isBangla ? 'চ্যাট' : 'Chat'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Dismiss Zone Target (Messenger style circle) */}
      {isDragging && !isDismissed && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dismissTargetContainer,
            {
              left: (screenWidth - DISMISS_TARGET_SIZE) / 2,
              bottom: Math.max(insets.bottom, 16) + 16,
              opacity: dismissTargetScale,
              transform: [
                {
                  scale: isOverDismiss ? 1.25 : dismissTargetScale,
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.dismissTargetCircle,
              {
                backgroundColor: isOverDismiss ? '#E34234' : 'rgba(15, 23, 42, 0.75)',
                borderColor: isOverDismiss ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
              },
            ]}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </View>
          <Text style={[styles.dismissTargetText, { color: isOverDismiss ? '#E34234' : '#FFFFFF' }]}>
            {isBangla ? 'সরাতে এখানে ড্রপ করুন' : 'Drag here to remove'}
          </Text>
        </Animated.View>
      )}

      {/* Main Draggable Floating CRM Bubble & Speed-Dial */}
      {!isDismissed && (
        <Animated.View
          style={[
            styles.draggableWrapper,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale: bubbleScale },
              ],
            },
          ]}
        >
          {/* Expanded Options Menu */}
          <Animated.View
            pointerEvents={expanded ? 'auto' : 'none'}
            style={[
              styles.menuContainer,
              snappedSide === 'left' ? styles.menuAlignLeft : styles.menuAlignRight,
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
                <Text style={styles.menuTitle}>WhatsApp</Text>
                <Text style={styles.menuSubtitle}>{CRM_CHANNELS.phoneDisplay} • Instant reply</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* 2. Messenger */}
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: '#0084FF' }]}
              onPress={handleMessenger}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Chat on Messenger"
            >
              <View style={styles.menuIconBg}>
                <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Messenger</Text>
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

          {/* Interactive Floating Circular FAB + Pill Row */}
          <View
            style={[
              styles.fabRow,
              snappedSide === 'left' ? styles.fabRowLeft : styles.fabRowRight,
            ]}
          >
            {/* Primary Circular Draggable FAB (Messenger chat-head style) */}
            <Animated.View
              style={{
                transform: [{ scale: expanded || isDragging ? 1 : pulseAnim }],
                opacity: isDragging || expanded ? 1 : 0.94,
              }}
              {...panResponder.panHandlers}
            >
              <View
                style={[
                  styles.fabButton,
                  {
                    backgroundColor: expanded ? '#102F53' : '#25D366',
                    shadowColor: expanded ? '#102F53' : '#25D366',
                  },
                ]}
              >
                <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
                  <Ionicons
                    name={expanded ? 'close' : 'logo-whatsapp'}
                    size={expanded ? 24 : 26}
                    color="#FFFFFF"
                  />
                </Animated.View>

                {/* Subtle online availability badge */}
                {!expanded && (
                  <View style={styles.bubbleStatusDot} />
                )}
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      )}
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
  draggableWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
  },
  menuContainer: {
    width: 250,
    marginBottom: 10,
    gap: 8,
    borderRadius: shape.large,
    position: 'absolute',
    bottom: FAB_SIZE + 6,
  },
  menuAlignRight: {
    right: 0,
    alignItems: 'flex-end',
  },
  menuAlignLeft: {
    left: 0,
    alignItems: 'flex-start',
  },
  menuItem: {
    width: '100%',
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
    width: '100%',
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
  fabRowRight: {
    flexDirection: 'row',
  },
  fabRowLeft: {
    flexDirection: 'row-reverse',
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#25D366',
  },
  fabPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fabButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
  },
  bubbleStatusDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
  dismissTargetContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 997,
  },
  dismissTargetCircle: {
    width: DISMISS_TARGET_SIZE,
    height: DISMISS_TARGET_SIZE,
    borderRadius: DISMISS_TARGET_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  dismissTargetText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dockedRestoreTab: {
    position: 'absolute',
    right: 0,
    zIndex: 996,
    borderTopLeftRadius: shape.full,
    borderBottomLeftRadius: shape.full,
    borderWidth: 1.5,
    borderRightWidth: 0,
    elevation: 4,
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  dockedRestoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: MIN_TOUCH_TARGET,
  },
  dockedRestoreText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
