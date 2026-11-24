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
import { SpringPressable } from '../common/SpringPressable';

export interface BrandSplashScreenProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

const SPLASH_HERO_IMAGE = require('../../../assets/splash-hero.jpg');
const BRAND_LOGO_IMAGE = require('../../../assets/icon.png');

export const BrandSplashScreen: React.FC<BrandSplashScreenProps> = ({
  onGetStarted,
  onSignIn,
  onDismiss,
  isLoading = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isBangla, setLanguage } = useLanguage();
  const isExitingRef = useRef(false);

  // Exit transition animators (smooth cinematic dissolve)
  const exitFadeAnim = useRef(new Animated.Value(1)).current;
  const exitScaleAnim = useRef(new Animated.Value(1)).current;

  // Choreographed entrance animators
  const headerAnim = useRef(new Animated.Value(0)).current;
  const heroImageFade = useRef(new Animated.Value(0)).current;
  const heroImageScale = useRef(new Animated.Value(0.97)).current;
  const nodeLeftAnim = useRef(new Animated.Value(0)).current;
  const nodeRightAnim = useRef(new Animated.Value(0)).current;
  const mottoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const pillarsAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  // Continuous organic physics animations (sinusoidal floating nodes)
  const floatLeft = useRef(new Animated.Value(0)).current;
  const floatRight = useRef(new Animated.Value(0)).current;
  const pulseDot = useRef(new Animated.Value(0.6)).current;
  const arrowNudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Staggered Choreographed Entrance (Smooth 60fps cascade)
    Animated.parallel([
      // Header: immediate soft fade in from top
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Hero Image: gentle scale and fade in
      Animated.timing(heroImageFade, {
        toValue: 1,
        duration: 650,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(heroImageScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      // Floating Left Badge
      Animated.sequence([
        Animated.delay(180),
        Animated.spring(nodeLeftAnim, {
          toValue: 1,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
      ]),
      // Floating Right Badge
      Animated.sequence([
        Animated.delay(260),
        Animated.spring(nodeRightAnim, {
          toValue: 1,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
      ]),
      // Motto Badge
      Animated.sequence([
        Animated.delay(320),
        Animated.timing(mottoAnim, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Main Headline & Subtitle
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 4 Pillars Deck
      Animated.sequence([
        Animated.delay(500),
        Animated.spring(pillarsAnim, {
          toValue: 1,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      // Footer Action Buttons
      Animated.sequence([
        Animated.delay(620),
        Animated.timing(footerAnim, {
          toValue: 1,
          duration: 540,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 2. Organic Asymmetrical Floating Nodes (independent non-lockstep periods)
    const floatLeftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatLeft, {
          toValue: -4,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatLeft, {
          toValue: 4,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const floatRightLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatRight, {
          toValue: 4,
          duration: 3100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatRight, {
          toValue: -4,
          duration: 3100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle breathing pulse for gold dot
    const pulseDotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseDot, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseDot, {
          toValue: 0.45,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle rhythmic inviting arrow nudge on primary CTA
    const arrowNudgeLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(arrowNudge, {
          toValue: 4,
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

    floatLeftLoop.start();
    floatRightLoop.start();
    pulseDotLoop.start();
    arrowNudgeLoop.start();

    return () => {
      floatLeftLoop.stop();
      floatRightLoop.stop();
      pulseDotLoop.stop();
      arrowNudgeLoop.stop();
    };
  }, []);

  const triggerSmoothExit = (callback?: () => void) => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    Animated.parallel([
      Animated.timing(exitFadeAnim, {
        toValue: 0,
        duration: 360,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(exitScaleAnim, {
        toValue: 1.025,
        duration: 360,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
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
      style={[
        styles.outerContainer,
        {
          opacity: exitFadeAnim,
          transform: [{ scale: exitScaleAnim }],
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Top Ambient Glows */}
      <View style={styles.topAmbientGold} pointerEvents="none" />
      <View style={styles.midAmbientNavy} pointerEvents="none" />

      {/* Main Responsive Mobile Frame */}
      <View
        style={[
          styles.mobileFrame,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {/* 1. TOP BRAND HEADER */}
        <Animated.View
          style={[
            styles.topBar,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Authentic Brand Logo & Wordmark */}
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              <Image
                source={BRAND_LOGO_IMAGE}
                style={styles.brandIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandTitleCol}>
              <Text style={styles.brandTitle}>
                Thriving<Text style={{ color: '#FFB606' }}>Skills</Text>
              </Text>
              <Text style={styles.brandSubtitle}>
                {isBangla ? 'স্কিলস ফর ফিউচার' : 'Skills For Future'}
              </Text>
            </View>
          </View>

          {/* Right Controls: Language Switcher & Indicator */}
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

            <View style={styles.powerIconPill}>
              <Ionicons name="flash" size={13} color="#FFB606" />
            </View>
          </View>
        </Animated.View>

        {/* 2. HERO VISUAL SECTION WITH PHOTOGRAPH & FLOATING NODES */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: heroImageFade,
              transform: [{ scale: heroImageScale }],
            },
          ]}
        >
          {/* Hero Photograph */}
          <Image
            source={SPLASH_HERO_IMAGE}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Seamless Deep Navy Vignette Overlays */}
          <LinearGradient
            colors={['rgba(16, 47, 83, 0.95)', 'rgba(16, 47, 83, 0.35)', 'rgba(15, 25, 44, 0.78)', '#0F192C']}
            locations={[0, 0.35, 0.75, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Floating Node 1: Certified with Sinusoidal Float & Soft Glow */}
          <Animated.View
            style={[
              styles.floatingNodeLeft,
              {
                opacity: nodeLeftAnim,
                transform: [
                  {
                    translateY: Animated.add(
                      nodeLeftAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [14, 0],
                      }),
                      floatLeft
                    ),
                  },
                ],
              },
            ]}
          >
            <View style={styles.nodeIconWrapGold}>
              <Ionicons name="school" size={13} color="#FFB606" />
            </View>
            <Text style={styles.nodeText}>
              {isBangla ? 'সার্টিফাইড' : 'Certified'}
            </Text>
          </Animated.View>

          {/* Floating Node 2: Career Boost with Sinusoidal Float & Soft Glow */}
          <Animated.View
            style={[
              styles.floatingNodeRight,
              {
                opacity: nodeRightAnim,
                transform: [
                  {
                    translateY: Animated.add(
                      nodeRightAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [14, 0],
                      }),
                      floatRight
                    ),
                  },
                ],
              },
            ]}
          >
            <View style={styles.nodeIconWrapCoral}>
              <Ionicons name="trending-up" size={13} color="#E34234" />
            </View>
            <Text style={styles.nodeText}>
              {isBangla ? 'ক্যারিয়ার বুস্ট' : 'Career Boost'}
            </Text>
          </Animated.View>

          {/* Hero Typography & National Motto */}
          <View style={styles.heroTypographyWrap}>
            {/* Tag Badge */}
            <Animated.View
              style={[
                styles.mottoBadge,
                {
                  opacity: mottoAnim,
                  transform: [
                    {
                      translateY: mottoAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Animated.View style={[styles.glowingDot, { opacity: pulseDot }]} />
              <Text style={styles.mottoBadgeText}>
                {isBangla ? 'প্রতিদিনের দক্ষতা অর্জন' : 'EMPOWERING EVERYDAY LEARNERS'}
              </Text>
            </Animated.View>

            {/* Main Headline & Subtitle */}
            <Animated.View
              style={{
                opacity: titleAnim,
                transform: [
                  {
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              }}
            >
              <Text style={styles.mainTitle}>
                {isBangla ? 'মানুষের ক্ষমতায়ন' : 'EMPOWERING PEOPLE'}
              </Text>

              <View style={styles.subHeadingRow}>
                <View style={styles.goldUnderline} />
                <Text style={styles.subHeadingText}>
                  {isBangla ? 'জাতির দক্ষতা বিনির্মাণে' : 'BUILDING A SKILLED NATION'}
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* 3. CORE SIGNATURE PILLARS (Glass Grid with Staggered Slide-In) */}
        <Animated.View
          style={[
            styles.pillarsSection,
            {
              opacity: pillarsAnim,
              transform: [
                {
                  translateY: pillarsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.pillarsCard}>
            {/* Pillar 1: Expert-Led Courses */}
            <View style={styles.pillarCol}>
              <View style={styles.pillarIconWrap}>
                <Ionicons name="videocam-outline" size={18} color="#FFB606" />
              </View>
              <Text style={styles.pillarTitle}>
                {isBangla ? 'এক্সপার্টদের\nকোর্স' : 'Expert-Led\nCourses'}
              </Text>
            </View>

            {/* Pillar 2: Practical Skills */}
            <View style={styles.pillarCol}>
              <View style={styles.pillarIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#FFB606" />
              </View>
              <Text style={styles.pillarTitle}>
                {isBangla ? 'ব্যবহারিক\nদক্ষতা' : 'Practical\nSkills'}
              </Text>
            </View>

            {/* Pillar 3: Career Growth */}
            <View style={styles.pillarCol}>
              <View style={styles.pillarIconWrap}>
                <Ionicons name="people-outline" size={18} color="#FFB606" />
              </View>
              <Text style={styles.pillarTitle}>
                {isBangla ? 'ক্যারিয়ার\nগ্রোথ' : 'Career\nGrowth'}
              </Text>
            </View>

            {/* Pillar 4: Learn Anytime */}
            <View style={styles.pillarCol}>
              <View style={styles.pillarIconWrap}>
                <Ionicons name="time-outline" size={18} color="#FFB606" />
              </View>
              <Text style={styles.pillarTitle}>
                {isBangla ? 'যেকোনো সময়\nশিক্ষা' : 'Learn\nAnytime'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 4. ACTION FOOTER (Smooth Fade & Slide-In) */}
        <Animated.View
          style={[
            styles.footerSection,
            {
              opacity: footerAnim,
              transform: [
                {
                  translateY: footerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
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
            accessibilityLabel="Get Started Now"
          >
            <Text style={styles.primaryCtaText}>
              {isBangla ? 'এখনই শুরু করুন' : 'Get Started Now'}
            </Text>
            <Animated.View style={{ transform: [{ translateX: arrowNudge }] }}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </Animated.View>
          </SpringPressable>

          {/* Secondary CTA: Already have an account? Sign In */}
          <TouchableOpacity
            onPress={handleSignIn}
            activeOpacity={0.8}
            style={styles.secondaryCtaBtn}
            accessibilityRole="button"
            accessibilityLabel="Sign In to Existing Account"
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

          {/* App Version Tag */}
          <Text style={styles.versionTag}>
            App Version 4.0.2.3
          </Text>

          {/* Home Indicator Bar */}
          <View style={styles.homeIndicatorBar} />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#102F53', // Brand Deep Navy
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
    backgroundColor: 'rgba(255, 182, 6, 0.16)', // Sunshine Gold Glow
    filter: Platform.OS === 'web' ? 'blur(64px)' : undefined,
  },
  midAmbientNavy: {
    position: 'absolute',
    top: '35%',
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(16, 47, 83, 0.45)', // Deep Navy Ambient
    filter: Platform.OS === 'web' ? 'blur(60px)' : undefined,
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F192C', // Official Dark Surface
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    zIndex: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logoWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#FFB606', // Sunshine Gold Border
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB606',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  brandIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.2,
    marginTop: -1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  powerIconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 182, 6, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
    borderRadius: shape.large,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6,
    minHeight: 280,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  floatingNodeLeft: {
    position: 'absolute',
    top: '22%',
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 47, 83, 0.94)',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.55)',
    shadowColor: '#FFB606',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  nodeIconWrapGold: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 182, 6, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingNodeRight: {
    position: 'absolute',
    top: '16%',
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 47, 83, 0.94)',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(227, 66, 52, 0.55)',
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  nodeIconWrapCoral: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(227, 66, 52, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTypographyWrap: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  mottoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 182, 6, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.45)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    marginBottom: 6,
  },
  glowingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFB606',
    marginRight: 6,
  },
  mottoBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFB606',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textTransform: 'uppercase',
    lineHeight: 28,
  },
  subHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  goldUnderline: {
    width: 28,
    height: 2.5,
    backgroundColor: '#FFB606',
    borderRadius: 2,
  },
  subHeadingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFB606',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  pillarsSection: {
    marginVertical: 10,
    zIndex: 10,
  },
  pillarsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.85)', // Dark Surface #1E293B
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.25)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  pillarIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 182, 6, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pillarTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    lineHeight: 13,
  },
  footerSection: {
    gap: 9,
    alignItems: 'center',
    zIndex: 10,
    paddingTop: 2,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E34234', // Brand Coral
    borderRadius: shape.medium,
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryCtaBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 6, 0.3)',
    borderRadius: shape.medium,
    paddingVertical: 11,
    paddingHorizontal: 16,
    width: '100%',
  },
  secondaryCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.1,
  },
  websiteLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    paddingVertical: 2,
  },
  websiteLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFB606',
    letterSpacing: 0.4,
  },
  versionTag: {
    fontSize: 9.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  homeIndicatorBar: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 6,
  },
});
