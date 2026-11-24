import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  Animated,
  Easing,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { shape } from '../../theme/shapes';
import { useResponsive } from '../../theme/responsive';
import { SpringPressable } from '../common/SpringPressable';

export interface BrandSplashScreenProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
  onDismiss?: () => void;
  onExitComplete?: () => void;
  isLoading?: boolean;
}

const SPLASH_POSTER_IMAGE = require('../../../assets/splash-poster.jpg');
const BRAND_LOGO_IMAGE = require('../../../assets/icon.png');

export const BrandSplashScreen: React.FC<BrandSplashScreenProps> = ({
  onGetStarted,
  onSignIn,
  onDismiss,
  onExitComplete,
  isLoading = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isBangla, setLanguage } = useLanguage();
  const { isTablet, isLandscape, width, height } = useResponsive();
  const isExitingRef = useRef(false);

  // Exit transition animators (smooth cinematic dissolve)
  const exitFadeAnim = useRef(new Animated.Value(1)).current;
  const exitScaleAnim = useRef(new Animated.Value(1)).current;

  // Choreographed entrance animators
  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const heroScaleAnim = useRef(new Animated.Value(0.96)).current;
  const topBarAnim = useRef(new Animated.Value(0)).current;
  const bottomDockAnim = useRef(new Animated.Value(0)).current;

  // Inviting arrow nudge on primary CTA
  const arrowNudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Choreographed Entrance Animation
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
      // Top floating bar
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(topBarAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Bottom action dock
      Animated.sequence([
        Animated.delay(350),
        Animated.spring(bottomDockAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 2. Inviting rhythmic arrow nudge
    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(arrowNudge, {
          toValue: 5,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(arrowNudge, {
          toValue: 0,
          duration: 280,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    arrowLoop.start();

    // 3. Graceful 5s Auto-advance timer: initiates transition if untouched
    const autoAdvanceTimer = setTimeout(() => {
      if (!isExitingRef.current && !isLoading) {
        handleGetStarted();
      }
    }, 5000);

    return () => {
      arrowLoop.stop();
      clearTimeout(autoAdvanceTimer);
    };
  }, [isLoading]);

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

  const handleLanguageToggle = (lang: 'en' | 'bn') => {
    triggerHaptic('selection');
    setLanguage(lang);
  };

  const handleOpenWebsite = () => {
    triggerHaptic('light');
    Linking.openURL('https://www.thrivingskill.com').catch(() => {});
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

      {/* Ambient Lighting Accents */}
      <View style={styles.topAmbientGold} pointerEvents="none" />
      <View style={styles.midAmbientNavy} pointerEvents="none" />

      {/* Main Responsive Mobile Poster Frame */}
      <View
        style={[
          styles.mobileFrame,
          {
            paddingTop: Math.max(insets.top, 10),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {/* 1. TOP FLOATING CONTROLS */}
        <Animated.View
          style={[
            styles.topBar,
            {
              opacity: topBarAnim,
              transform: [
                {
                  translateY: topBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Subtle Brand Pill */}
          <View style={styles.brandPill}>
            <View style={styles.logoWrap}>
              <Image
                source={BRAND_LOGO_IMAGE}
                style={styles.brandIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandPillText}>
              Thriving<Text style={{ color: '#FFB606' }}>Skills</Text>
            </Text>
          </View>

          {/* Right Controls: Language Switcher & Quick Skip */}
          <View style={styles.topBarRight}>
            <View style={styles.langPill}>
              <TouchableOpacity
                onPress={() => handleLanguageToggle('en')}
                activeOpacity={0.7}
                style={[styles.langBtn, !isBangla && styles.langBtnActive]}
                accessibilityRole="button"
                accessibilityLabel="Switch to English"
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 4 }}
              >
                <Text style={[styles.langText, !isBangla && styles.langTextActive]}>ENG</Text>
              </TouchableOpacity>

              <Text style={styles.langDivider}>|</Text>

              <TouchableOpacity
                onPress={() => handleLanguageToggle('bn')}
                activeOpacity={0.7}
                style={[styles.langBtn, isBangla && styles.langBtnActive]}
                accessibilityRole="button"
                accessibilityLabel="Switch to Bengali"
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 6 }}
              >
                <Text style={[styles.langText, isBangla && styles.langTextActive]}>বাংলা</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => triggerSmoothExit(onDismiss || onGetStarted)}
              activeOpacity={0.7}
              style={styles.skipBtn}
              accessibilityRole="button"
              accessibilityLabel="Skip splash screen"
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="flash" size={13} color="#FFB606" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 2. AUTHENTIC HERO POSTER CANVAS */}
        <Animated.View
          style={[
            styles.posterSection,
            {
              opacity: heroFadeAnim,
              transform: [{ scale: heroScaleAnim }],
            },
          ]}
        >
          <Image
            source={SPLASH_POSTER_IMAGE}
            style={styles.posterImage}
            resizeMode="contain"
          />

          {/* Subtle Lower Fade to blend smoothly into the interactive action dock */}
          <LinearGradient
            colors={['transparent', 'rgba(15, 25, 44, 0.45)', 'rgba(15, 25, 44, 0.95)', '#0F192C']}
            locations={[0.55, 0.75, 0.9, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </Animated.View>

        {/* 3. INTERACTIVE FLOATING ACTION DOCK */}
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
          {/* Primary CTA: Get Started Now */}
          <SpringPressable
            onPress={handleGetStarted}
            style={styles.primaryCtaBtn}
            activeScale={0.96}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'এখনই শুরু করুন' : 'Get Started Now'}
          >
            <Text style={styles.primaryCtaText}>
              {isBangla ? 'এখনই শুরু করুন' : 'Get Started Now'}
            </Text>
            <Animated.View style={{ transform: [{ translateX: arrowNudge }] }}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </Animated.View>
          </SpringPressable>

          {/* Secondary CTA: Sign In */}
          <TouchableOpacity
            onPress={handleSignIn}
            activeOpacity={0.8}
            style={styles.secondaryCtaBtn}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'ইতিমধ্যেই অ্যাকাউন্ট আছে? সাইন ইন করুন' : 'Already have an account? Sign In'}
          >
            <Text style={styles.secondaryCtaText}>
              {isBangla ? 'ইতিমধ্যেই অ্যাকাউন্ট আছে? সাইন ইন করুন' : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Official Website Link */}
          <TouchableOpacity
            onPress={handleOpenWebsite}
            activeOpacity={0.7}
            style={styles.websiteLinkRow}
            accessibilityRole="link"
            accessibilityLabel="Visit official website at thrivingskill.com"
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          >
            <Ionicons name="globe-outline" size={13} color="#FFB606" />
            <Text style={styles.websiteLinkText}>www.thrivingskill.com</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F192C', // Official Dark Surface
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  topAmbientGold: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 182, 6, 0.14)',
    filter: Platform.OS === 'web' ? 'blur(64px)' : undefined,
  },
  midAmbientNavy: {
    position: 'absolute',
    bottom: '20%',
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(16, 47, 83, 0.5)',
    filter: Platform.OS === 'web' ? 'blur(60px)' : undefined,
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0F192C',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    zIndex: 30,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 47, 83, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.3)',
  },
  logoWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  brandPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 47, 83, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  langBtn: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  langBtnActive: {
    borderRadius: 10,
  },
  langText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  langTextActive: {
    fontWeight: '800',
    color: '#FFB606',
  },
  langDivider: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 1,
  },
  skipBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 47, 83, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterSection: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  bottomDock: {
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: 'center',
    zIndex: 30,
    gap: 8,
  },
  primaryCtaBtn: {
    width: '100%',
    minHeight: 50,
    backgroundColor: '#E34234', // Brand Crimson / Coral Red
    borderRadius: shape.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E34234',
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryCtaBtn: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryCtaText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12.5,
    fontWeight: '600',
  },
  websiteLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  websiteLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.4,
  },
});
