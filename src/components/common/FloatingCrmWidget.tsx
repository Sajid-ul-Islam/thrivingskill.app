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

const FAB_SIZE = 50;
const DISMISS_TARGET_SIZE = 58;
const SNAP_MARGIN = 8;
const AUTO_TRANSFORM_INTERVAL = 3800; // Auto-cycle between WhatsApp & Messenger every 3.8s

export interface FloatingCrmWidgetProps {
  bottomOffset?: number;
  inquiryType?: CrmInquiryType;
  onOpenFullModal?: () => void;
  isDismissed?: boolean;
  onDismissChange?: (dismissed: boolean) => void;
}

export type CrmChannel = 'whatsapp' | 'messenger';

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
  const [activeChannel, setActiveChannel] = useState<CrmChannel>('whatsapp');
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

  // Animated values
  const animValue = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded
  const flipAnim = useRef(new Animated.Value(0)).current; // 0 = WhatsApp, 1 = Messenger
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const dismissTargetScale = useRef(new Animated.Value(0)).current;

  // Auto-transform cycle timer (WhatsApp <-> Messenger)
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
  }, [bottomOffset, screenWidth, screenHeight, pan]);

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

  // Auto-transform: Alternate between WhatsApp (#25D366) and Messenger (#0084FF)
  // Pauses when user has opened the speed-dial menu, is dragging, or widget is dismissed
  useEffect(() => {
    if (expanded || isDragging || isDismissed) {
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
    }, AUTO_TRANSFORM_INTERVAL);

    return () => {
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
    };
  }, [expanded, isDragging, isDismissed, flipAnim]);

  const toggleExpand = useCallback(() => {
    triggerHaptic('light');
    const toVal = expanded ? 0 : 1;
    Animated.spring(animValue, {
      toValue: toVal,
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  }, [expanded, animValue]);

  const closeMenu = useCallback(() => {
    if (!expanded) return;
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

        // Proximity to bottom dismiss target
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

  // Animations for speed-dial menu
  const menuOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  // Dynamic morphing background color for idle state (WhatsApp Green <-> Messenger Blue)
  const idleBgColor = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#25D366', '#0084FF'],
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
              borderColor: activeChannel === 'whatsapp' ? '#25D366' : '#0084FF',
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.dockedRestoreBtn}
            onPress={restoreBubble}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reopen support chat bubble"
          >
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: activeChannel === 'whatsapp' ? '#25D366' : '#0084FF' },
              ]}
            />
            <Ionicons
              name={activeChannel === 'whatsapp' ? 'logo-whatsapp' : 'logo-facebook'}
              size={17}
              color={activeChannel === 'whatsapp' ? '#25D366' : '#0084FF'}
            />
            <Text style={[styles.dockedRestoreText, { color: colors.text }]}>
              {isBangla ? 'সাপোর্ট' : 'Support'}
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

      {/* Main Draggable Floating CRM Bubble & Multi-Channel Speed-Dial */}
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
          {/* Expanded Options Menu: Shows both WhatsApp and Messenger */}
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
            {/* Header Hint */}
            <View
              style={[
                styles.menuHeader,
                { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)' },
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
                    <Text style={styles.fastReplyPillText}>
                      {isBangla ? 'দ্রুত উত্তর' : 'Instant'}
                    </Text>
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
                <Ionicons name="logo-facebook" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.menuTextCol}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.menuTitle}>Messenger</Text>
                  <View style={styles.fastReplyPill}>
                    <Text style={styles.fastReplyPillText}>
                      {isBangla ? 'মেসেজ করুন' : 'Inbox'}
                    </Text>
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
                  borderColor: isDark ? 'rgba(255, 182, 6, 0.35)' : 'rgba(255, 182, 6, 0.45)',
                },
              ]}
              onPress={handleCall}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`Call Official Helpline (${CRM_CHANNELS.phoneDisplay})`}
            >
              <View style={[styles.menuIconBg, { backgroundColor: '#102F53' }]}>
                <Ionicons name="call" size={17} color="#FFB606" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={[styles.helplineTitle, { color: colors.text }]}>
                  {isBangla ? 'হেল্পলাইনে কল' : 'Call Helpline'}
                </Text>
                <Text style={[styles.helplineSubtitle, { color: colors.textMuted }]}>
                  {CRM_CHANNELS.phoneDisplay}
                </Text>
              </View>
              <Ionicons name="call-outline" size={16} color="#FFB606" />
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

          {/* Interactive Floating Circular FAB */}
          <View
            style={[
              styles.fabRow,
              snappedSide === 'left' ? styles.fabRowLeft : styles.fabRowRight,
            ]}
          >
            <Animated.View
              style={{
                transform: [{ scale: expanded || isDragging ? 1 : pulseAnim }],
                opacity: isDragging || expanded ? 1 : 0.96,
              }}
              {...panResponder.panHandlers}
            >
              {/* Main Circular Button with Dynamic Channel Morphing */}
              <Animated.View
                style={[
                  styles.fabButton,
                  {
                    backgroundColor: idleBgColor,
                    shadowColor: idleBgColor,
                  },
                ]}
              >
                {/* 1. WhatsApp Icon (Morphs out during flip) */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.iconLayer,
                    {
                      opacity: Animated.multiply(
                        flipAnim.interpolate({
                          inputRange: [0, 0.45, 0.55, 1],
                          outputRange: [1, 0, 0, 0],
                        }),
                        animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0],
                        })
                      ),
                      transform: [
                        {
                          rotateY: flipAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg'],
                          }),
                        },
                        {
                          scale: flipAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 0.2, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="logo-whatsapp" size={26} color="#FFFFFF" />
                </Animated.View>

                {/* 2. Messenger Icon (Morphs in during flip) */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.iconLayer,
                    {
                      opacity: Animated.multiply(
                        flipAnim.interpolate({
                          inputRange: [0, 0.45, 0.55, 1],
                          outputRange: [0, 0, 1, 1],
                        }),
                        animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0],
                        })
                      ),
                      transform: [
                        {
                          rotateY: flipAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['180deg', '360deg'],
                          }),
                        },
                        {
                          scale: flipAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, 0.2, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="logo-facebook" size={26} color="#FFFFFF" />
                </Animated.View>

                {/* 3. Close State Overlay (Smoothly slides & fades over button when expanded) */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.closeOverlay,
                    {
                      opacity: animValue,
                      transform: [
                        {
                          rotate: animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-90deg', '0deg'],
                          }),
                        },
                        {
                          scale: animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="close" size={26} color="#FFFFFF" />
                </Animated.View>

                {/* Online Availability Dot */}
                <Animated.View
                  style={[
                    styles.bubbleStatusDot,
                    {
                      opacity: animValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0],
                      }),
                    },
                  ]}
                />
              </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    flexDirection: 'row-reverse',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
    overflow: 'hidden',
  },
  iconLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
  },
  closeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#102F53',
    alignItems: 'center',
    justifyContent: 'center',
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
