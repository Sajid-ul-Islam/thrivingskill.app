import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  openCallHelpline,
  CrmInquiryType,
} from '../../config/crm';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { MessengerIcon } from './MessengerIcon';

const FAB_SIZE = 52;
const SNAP_MARGIN = 8;
const AUTO_CHANGE_INTERVAL = 3800; // Auto-cycle between WhatsApp & Messenger every 3.8s

export interface FloatingCrmWidgetProps {
  bottomOffset?: number;
  inquiryType?: CrmInquiryType;
  onOpenFullModal?: () => void;
  isDismissed?: boolean;
  onDismissChange?: (dismissed: boolean) => void;
}

export type CrmChannel = 'whatsapp' | 'messenger';

/**
 * Omnipresent Support Chat Widget
 * - Sticks to the left edge of the screen by default while remaining smoothly movable/draggable
 * - Auto-alternates between official WhatsApp (#25D366) and Messenger (#0084FF) icons after some time
 * - 1-Tap ON / 1-Tap OFF toggle (no 'X' needed, button stays as the recognizable chat icon)
 * - Guaranteed instant touch response (onStartShouldSetPanResponder: () => false ensures taps directly hit TouchableOpacity)
 * - Smooth edge-snapping drag support without stealing touch events from taps
 * - Instant access to WhatsApp live chat, Facebook Messenger inbox, and 24/7 hotline helpline
 */
export const FloatingCrmWidget: React.FC<FloatingCrmWidgetProps> = ({
  bottomOffset = 84,
  inquiryType = 'general',
  onOpenFullModal,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [expanded, setExpanded] = useState(false);
  const [activeChannel, setActiveChannel] = useState<CrmChannel>('whatsapp');
  const [isDragging, setIsDragging] = useState(false);
  // Sticks to right edge by default per mobile UX best practices
  const [snappedSide, setSnappedSide] = useState<'left' | 'right'>('right');

  // Initial positioning: sticking to the right edge of screen
  const defaultX = screenWidth - FAB_SIZE - SNAP_MARGIN;
  const defaultY = screenHeight - bottomOffset - FAB_SIZE;

  const pan = useRef(new Animated.ValueXY({ x: defaultX, y: defaultY })).current;
  const currentPos = useRef({ x: defaultX, y: defaultY });
  const hasUserMovedRef = useRef(false);

  // Animated values
  const animValue = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded
  const flipAnim = useRef(new Animated.Value(0)).current; // 0 = WhatsApp, 1 = Messenger
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Auto-change timer ref (WhatsApp <-> Messenger)
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track coordinates
  useEffect(() => {
    const id = pan.addListener((val) => {
      currentPos.current = val;
    });
    return () => {
      pan.removeListener(id);
    };
  }, [pan]);

  // Adjust default position when mini player or bottom offset changes (only if user hasn't moved it)
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
  }, [bottomOffset, screenHeight, screenWidth, pan]);

  // Subtle breathing pulse on the FAB when idle
  useEffect(() => {
    if (expanded || isDragging) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1300,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [expanded, isDragging, pulseAnim]);

  // Auto-change: Alternate between WhatsApp (#25D366) and Messenger (#0084FF) every 3.8s
  // Pauses when user has opened the menu or is dragging
  useEffect(() => {
    if (expanded || isDragging) {
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
      return;
    }

    cycleTimerRef.current = setInterval(() => {
      setActiveChannel((prev) => {
        const next: CrmChannel = prev === 'whatsapp' ? 'messenger' : 'whatsapp';
        Animated.timing(flipAnim, {
          toValue: next === 'messenger' ? 1 : 0,
          duration: 480,
          useNativeDriver: false,
        }).start();
        return next;
      });
    }, AUTO_CHANGE_INTERVAL);

    return () => {
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
    };
  }, [expanded, isDragging, flipAnim]);

  // 1-Tap ON / OFF Toggle (no 'X' needed)
  const toggleExpand = useCallback(() => {
    triggerHaptic('light');
    if (expanded) {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start(() => setExpanded(false));
    } else {
      setExpanded(true);
      Animated.spring(animValue, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: false,
      }).start();
    }
  }, [expanded, animValue]);

  const closeMenu = useCallback(() => {
    if (!expanded) return;
    triggerHaptic('selection');
    Animated.timing(animValue, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(() => setExpanded(false));
  }, [expanded, animValue]);

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

  const handleCall = async () => {
    triggerHaptic('medium');
    closeMenu();
    showToast({
      message: isBangla ? 'হেল্পলাইনে কল করা হচ্ছে...' : 'Calling helpline...',
      type: 'info',
    });
    await openCallHelpline();
  };

  const handleMore = () => {
    closeMenu();
    if (onOpenFullModal) {
      onOpenFullModal();
    }
  };

  // PanResponder tuned for movable drag while keeping 100% reliable tap response:
  // onStartShouldSetPanResponder is FALSE so taps directly fire TouchableOpacity.onPress
  // onMoveShouldSetPanResponder activates when user drags > 10 pixels
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10;
      },
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        return Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
        setIsDragging(true);
      },
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setIsDragging(false);
        hasUserMovedRef.current = true;

        // Auto-close menu if open while dragging
        if (expanded) {
          closeMenu();
        }

        // Snap to nearest edge (left or right)
        const currentCenterX = currentPos.current.x + FAB_SIZE / 2;
        const isLeft = currentCenterX < screenWidth / 2;
        const targetX = isLeft ? SNAP_MARGIN : screenWidth - FAB_SIZE - SNAP_MARGIN;
        setSnappedSide(isLeft ? 'left' : 'right');

        const minY = insets.top + 50;
        const maxY = screenHeight - insets.bottom - 90;
        const targetY = Math.max(minY, Math.min(maxY, currentPos.current.y));

        triggerHaptic('light');
        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          friction: 7,
          tension: 45,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        setIsDragging(false);
      },
    })
  ).current;

  // Animations for speed-dial menu
  const menuOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const menuScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  // Dynamic background color that smoothly morphs between WhatsApp Green and Messenger Blue
  const buttonBgColor = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#25D366', '#0084FF'],
  });

  return (
    <>
      {/* Semi-transparent backdrop when menu is expanded */}
      {expanded && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Main Movable Floating Support Widget */}
      <Animated.View
        style={[
          styles.draggableWrapper,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
      >
        {/* Expanded Options Menu: WhatsApp, Messenger & 24/7 Helpline */}
        <Animated.View
          pointerEvents={expanded ? 'auto' : 'none'}
          style={[
            styles.menuContainer,
            snappedSide === 'left' ? styles.menuAlignLeft : styles.menuAlignRight,
            {
              opacity: menuOpacity,
              transform: [{ translateY: menuTranslateY }, { scale: menuScale }],
            },
          ]}
        >
          {/* Header Hint */}
          <View
            style={[
              styles.menuHeader,
              { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.96)' : 'rgba(255, 255, 255, 0.96)' },
            ]}
          >
            <View style={styles.onlineStatusBadge}>
              <View style={styles.pulseDot} />
              <Text style={[styles.menuHeaderText, { color: colors.text }]}>
                {isBangla ? '২৪/৭ লাইভ সাপোর্ট' : '24/7 Live Support'}
              </Text>
            </View>
            <Text style={[styles.menuHeaderSubtext, { color: colors.textMuted }]}>
              {isBangla ? 'পছন্দের মাধ্যমে যুক্ত হোন' : 'Select preferred channel'}
            </Text>
          </View>

          {/* 1. WhatsApp Live Chat */}
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: '#25D366' }]}
            onPress={handleWhatsApp}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`Chat on WhatsApp (${CRM_CHANNELS.phoneDisplay})`}
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.menuTextCol}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.menuTitle}>WhatsApp</Text>
                <View style={styles.fastReplyPill}>
                  <Text style={styles.fastReplyPillText}>{isBangla ? 'দ্রুত উত্তর' : 'Instant'}</Text>
                </View>
              </View>
              <Text style={styles.menuSubtitle}>{CRM_CHANNELS.phoneDisplay}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
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
              <MessengerIcon size={22} color="#FFFFFF" />
            </View>
            <View style={styles.menuTextCol}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.menuTitle}>Messenger</Text>
                <View style={styles.fastReplyPill}>
                  <Text style={styles.fastReplyPillText}>{isBangla ? 'মেসেজ করুন' : 'Inbox'}</Text>
                </View>
              </View>
              <Text style={styles.menuSubtitle}>@thrivingskills</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 3. Direct Phone Call Helpline */}
          <TouchableOpacity
            style={[
              styles.helplineItem,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(16, 47, 83, 0.22)',
              },
            ]}
            onPress={handleCall}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`Call Official Helpline (${CRM_CHANNELS.phoneDisplay})`}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#102F53' }]}>
              <Ionicons name="call" size={17} color="#FFFFFF" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={[styles.helplineTitle, { color: colors.text }]}>
                {isBangla ? 'হেল্পলাইনে কল' : 'Call Helpline'}
              </Text>
              <Text style={[styles.helplineSubtitle, { color: colors.textMuted }]}>
                {CRM_CHANNELS.phoneDisplay}
              </Text>
            </View>
            <Ionicons name="call-outline" size={16} color={colors.primary} />
          </TouchableOpacity>

          {/* 4. More Options / Full Support Sheet Trigger */}
          {onOpenFullModal && (
            <TouchableOpacity
              style={[styles.moreItem, { backgroundColor: colors.surfaceSubtle }]}
              onPress={handleMore}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View full support options and FAQs"
            >
              <Ionicons name="help-circle-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.moreItemText, { color: colors.textMuted }]}>
                {isBangla ? 'সকল প্রশ্ন ও সাপোর্ট ক্যাটাগরি' : 'All topics & FAQs'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Floating Circular FAB - Sticks to left edge by default, movable, 1-Tap ON / 1-Tap OFF */}
        <View
          style={[styles.fabRow, snappedSide === 'left' ? styles.fabRowLeft : styles.fabRowRight]}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={{
              transform: [{ scale: expanded || isDragging ? 1 : pulseAnim }],
            }}
          >
            <TouchableOpacity
              onPress={toggleExpand}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={
                expanded
                  ? isBangla
                    ? 'সাপোর্ট অপশন বন্ধ করুন'
                    : 'Close support options'
                  : isBangla
                    ? 'সাপোর্ট চ্যাট খুলুন'
                    : 'Open support chat'
              }
            >
              <Animated.View
                style={[
                  styles.fabButton,
                  {
                    backgroundColor: buttonBgColor,
                    shadowColor: buttonBgColor,
                  },
                ]}
              >
                {/* 1. WhatsApp Icon Layer */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.iconLayer,
                    {
                      opacity: flipAnim.interpolate({
                        inputRange: [0, 0.45, 0.55, 1],
                        outputRange: [1, 0, 0, 0],
                      }),
                      transform: [
                        {
                          scale: flipAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 0.3, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="logo-whatsapp" size={26} color="#FFFFFF" />
                </Animated.View>

                {/* 2. Messenger Icon Layer */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.iconLayer,
                    {
                      opacity: flipAnim.interpolate({
                        inputRange: [0, 0.45, 0.55, 1],
                        outputRange: [0, 0, 1, 1],
                      }),
                      transform: [
                        {
                          scale: flipAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, 0.3, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <MessengerIcon size={26} color="#FFFFFF" />
                </Animated.View>

                {/* Online Availability Dot Indicator */}
                <View style={styles.bubbleStatusDot} />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 998,
  },
  draggableWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
  },
  menuContainer: {
    width: 260,
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
  menuHeader: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: shape.medium,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  onlineStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  menuHeaderText: {
    fontSize: 12,
    fontWeight: '800',
  },
  menuHeaderSubtext: {
    fontSize: 10,
    marginTop: 2,
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
    minHeight: MIN_TOUCH_TARGET,
  },
  helplineItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: shape.large,
    borderWidth: 1.2,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: MIN_TOUCH_TARGET,
  },
  helplineTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  helplineSubtitle: {
    fontSize: 10.5,
    marginTop: 1,
  },
  menuIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    minWidth: 0,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fastReplyPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: shape.full,
  },
  fastReplyPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuSubtitle: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.92)',
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
    minHeight: 38,
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
    flexDirection: 'row',
  },
  fabButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.32,
    shadowRadius: 6,
  },
  iconLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
  },
  bubbleStatusDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
});
