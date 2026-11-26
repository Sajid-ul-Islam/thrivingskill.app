import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { APP_VERSION } from '../../config/appVersion';
import { triggerHaptic } from '../../utils/haptics';
import { DeveloperOptionsModal } from '../modals/DeveloperOptionsModal';

export interface BrandSplashScreenProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
  onDismiss?: () => void;
  onExitComplete?: () => void;
  isLoading?: boolean;
}

const SPLASH_POSTER_IMAGE = require('../../../assets/splash-poster.jpg');

export const BrandSplashScreen: React.FC<BrandSplashScreenProps> = ({
  onGetStarted,
  onSignIn,
  onDismiss,
  onExitComplete,
  isLoading = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isBangla } = useLanguage();
  const isExitingRef = useRef(false);

  // Exit transition animators (smooth cinematic dissolve)
  const exitFadeAnim = useRef(new Animated.Value(1)).current;
  const exitScaleAnim = useRef(new Animated.Value(1)).current;

  // Choreographed entrance animators
  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const heroScaleAnim = useRef(new Animated.Value(0.96)).current;
  const bottomDockAnim = useRef(new Animated.Value(0)).current;

  const [devModalVisible, setDevModalVisible] = useState(false);

  useEffect(() => {
    // Choreographed Entrance Animation
    Animated.parallel([
      // Poster hero: gentle scale and fade in
      Animated.timing(heroFadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(heroScaleAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      // Bottom action dock: springs up smoothly
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(bottomDockAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const triggerSmoothExit = (callback?: () => void) => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    callback?.();

    Animated.parallel([
      Animated.timing(exitFadeAnim, {
        toValue: 0,
        duration: 380,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(exitScaleAnim, {
        toValue: 1.025,
        duration: 380,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onExitComplete?.();
    });
  };

  const handleGetStarted = () => {
    triggerHaptic('medium');
    triggerSmoothExit(onGetStarted);
  };

  const handleSignIn = () => {
    triggerHaptic('light');
    triggerSmoothExit(onSignIn);
  };

  const handleVersionTap = () => {
    if (!__DEV__) return;
    triggerHaptic('selection');
    setDevModalVisible(true);
  };

  return (
    <Animated.View
      pointerEvents={isExitingRef.current ? 'none' : 'auto'}
      style={[
        styles.outerContainer,
        {
          opacity: exitFadeAnim,
          transform: [{ scale: exitScaleAnim }],
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Main Responsive Mobile Frame */}
      <View style={styles.mobileFrame}>
        {/* Poster Image Container - Padded below system status bar / notch so brand logo is 100% visible */}
        <View style={[styles.imageContainer, { paddingTop: insets.top }]}>
          <Animated.Image
            source={SPLASH_POSTER_IMAGE}
            style={[
              styles.posterImage,
              {
                opacity: heroFadeAnim,
                transform: [{ scale: heroScaleAnim }],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Foreground Content Overlay */}
        <View
          style={[
            styles.contentOverlay,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Top spacer allowing full poster graphics, trio & text to remain 100% visible */}
          <View style={styles.topSpacer} />

          {/* Interactive Floating Action Dock */}
          <Animated.View
            style={[
              styles.bottomDock,
              {
                opacity: bottomDockAnim,
                transform: [
                  {
                    translateY: bottomDockAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Primary CTA: Get Started - 1:1 Match with Create Account Button */}
            <TouchableOpacity
              onPress={handleGetStarted}
              style={[styles.primaryCtaBtn, { backgroundColor: '#E34234' }]}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'এখনই শুরু করুন' : 'Get Started'}
            >
              <Text style={[styles.primaryCtaText, { color: '#FFFFFF' }]}>
                {isBangla ? 'এখনই শুরু করুন' : 'Get Started'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            {/* Secondary CTA: Sign In */}
            <TouchableOpacity
              onPress={handleSignIn}
              activeOpacity={0.8}
              style={styles.secondaryCtaBtn}
              accessibilityRole="button"
              accessibilityLabel={
                isBangla ? 'ইতিমধ্যেই অ্যাকাউন্ট আছে? সাইন ইন করুন' : 'Already have an account? Sign In'
              }
            >
              <Text style={styles.secondaryCtaText}>
                {isBangla
                  ? 'ইতিমধ্যেই অ্যাকাউন্ট আছে? সাইন ইন করুন'
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleVersionTap}
              activeOpacity={0.75}
              style={styles.versionTouch}
              accessibilityRole="button"
              accessibilityLabel="App Version"
              hitSlop={{ top: 12, bottom: 14, left: 24, right: 24 }}
            >
              <Text style={styles.versionText}>
                v{APP_VERSION} {__DEV__ ? '• [DEV]' : ''}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Developer Options Modal (Dev builds only) */}
      {__DEV__ && (
        <DeveloperOptionsModal
          visible={devModalVisible}
          onClose={() => setDevModalVisible(false)}
          onDirectBypass={() => triggerSmoothExit(onDismiss || onGetStarted)}
          onResetToStandardMode={() => {
            setDevModalVisible(false);
          }}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#012B55',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#012B55',
  },
  imageContainer: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  topSpacer: {
    flex: 1,
  },
  bottomDock: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E34234',
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryCtaBtn: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryCtaText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  versionTouch: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
