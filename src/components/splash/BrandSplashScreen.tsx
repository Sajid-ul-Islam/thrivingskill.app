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
  isLoading?: boolean;
}

const SPLASH_HERO_IMAGE = require('../../../assets/splash-hero.jpg');

export const BrandSplashScreen: React.FC<BrandSplashScreenProps> = ({
  onGetStarted,
  onSignIn,
  isLoading = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isBangla, setLanguage } = useLanguage();

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  // Floating nodes slow breathing animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for tech badges
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [fadeAnim, slideAnim, scaleAnim, pulseAnim]);

  const handleLanguageToggle = (lang: 'en' | 'bn') => {
    triggerHaptic('selection');
    setLanguage(lang);
  };

  const handleOpenWebsite = () => {
    triggerHaptic('light');
    Linking.openURL('https://www.thrivingskill.com').catch(() => {});
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="light" />

      {/* Top Ambient Light Glows */}
      <View style={styles.topAmbientCyan} pointerEvents="none" />
      <View style={styles.midAmbientBlue} pointerEvents="none" />

      {/* Main Responsive Mobile Frame */}
      <View style={[styles.mobileFrame, { paddingTop: Math.max(insets.top, 10), paddingBottom: Math.max(insets.bottom, 12) }]}>
        
        {/* TOP BAR: Clock & Language Toggle */}
        <View style={styles.topBar}>
          <Text style={styles.topBarClock}>9:41</Text>

          <View style={styles.topBarRight}>
            {/* Language Pill Toggle */}
            <View style={styles.langPill}>
              <TouchableOpacity
                onPress={() => handleLanguageToggle('en')}
                activeOpacity={0.7}
                style={[styles.langBtn, !isBangla && styles.langBtnActive]}
                accessibilityRole="button"
                accessibilityLabel="Switch to English"
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
              >
                <Text style={[styles.langText, isBangla && styles.langTextActive]}>বাংলা</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Energy / Power Indicator */}
            <View style={styles.powerIconPill}>
              <Ionicons name="flash" size={13} color="#00e5ff" />
            </View>
          </View>
        </View>

        {/* HERO SECTION WITH IMAGE & FLOATING NODES */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
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
            colors={['rgba(4, 25, 53, 0.95)', 'rgba(4, 25, 53, 0.4)', 'rgba(4, 25, 53, 0.75)', '#041935']}
            locations={[0, 0.35, 0.75, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Floating Tech Node 1: Certified */}
          <Animated.View
            style={[
              styles.floatingNodeLeft,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.nodeIconWrapCyan}>
              <Ionicons name="school" size={13} color="#00e5ff" />
            </View>
            <Text style={styles.nodeText}>
              {isBangla ? 'সার্টিফাইড' : 'Certified'}
            </Text>
          </Animated.View>

          {/* Floating Tech Node 2: Career Boost */}
          <Animated.View
            style={[
              styles.floatingNodeRight,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.nodeIconWrapSky}>
              <Ionicons name="trending-up" size={13} color="#38bdf8" />
            </View>
            <Text style={styles.nodeText}>
              {isBangla ? 'ক্যারিয়ার বুস্ট' : 'Career Boost'}
            </Text>
          </Animated.View>

          {/* Hero Typography & National Motto */}
          <View style={styles.heroTypographyWrap}>
            {/* Tag Badge */}
            <View style={styles.mottoBadge}>
              <View style={styles.glowingDot} />
              <Text style={styles.mottoBadgeText}>
                {isBangla ? 'প্রতিদিনের দক্ষতা অর্জন' : 'EMPOWERING EVERYDAY LEARNERS'}
              </Text>
            </View>

            {/* Main Headline */}
            <Text style={styles.mainTitle}>
              {isBangla ? 'মানুষের ক্ষমতায়ন' : 'EMPOWERING PEOPLE'}
            </Text>

            {/* Cyan Line & Subtitle */}
            <View style={styles.subHeadingRow}>
              <View style={styles.cyanUnderline} />
              <Text style={styles.subHeadingText}>
                {isBangla ? 'জাতির দক্ষতা বিনির্মাণে' : 'BUILDING A SKILLED NATION'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* CORE PILLARS SECTION (4 Glass Grid Items) */}
        <Animated.View
          style={[
            styles.pillarsSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.pillarsCard}>
            {/* Pillar 1: Expert-Led Courses */}
            <View style={styles.pillarCol}>
              <View style={styles.pillarIconWrap}>
                <Ionicons name="videocam-outline" size={18} color="#00e5ff" />
              </View>
              <Text style={styles.pillarTitle}>
                {isBangla ? 'এক্সপার্টদের\nকোর্স' : 'Expert-Led\nCourses'}
              </Text>
            </View>

            {/* Pillar 2: Practical Skills */}
            <View style={styles.pillarCol}>
              <View style={styles.pillarIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#00e5ff" />
              </View>
              <Text style={styles.pillarTitle}>
                {isBangla ? 'ব্যবহারিক\nদক্ষতা' : 'Practical\nSkills'}
              </Text>
            </View>

            {/* Pillar 3: Career Growth */}
            <View style={styles.pillarCol}>
              <View style={styles.pillarIconWrap}>
                <Ionicons name="people-outline" size={18} color="#00e5ff" />
              </View>
              <Text style={styles.pillarTitle}>
                {isBangla ? 'ক্যারিয়ার\nগ্রোথ' : 'Career\nGrowth'}
              </Text>
            </View>

            {/* Pillar 4: Learn Anytime */}
            <View style={styles.pillarCol}>
              <View style={styles.pillarIconWrap}>
                <Ionicons name="time-outline" size={18} color="#00e5ff" />
              </View>
              <Text style={styles.pillarTitle}>
                {isBangla ? 'যেকোনো সময়\nশিক্ষা' : 'Learn\nAnytime'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ACTION FOOTER */}
        <Animated.View
          style={[
            styles.footerSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Primary CTA: Get Started Now */}
          <SpringPressable
            onPress={() => {
              triggerHaptic('medium');
              onGetStarted?.();
            }}
            style={styles.primaryCtaBtn}
            activeScale={0.97}
            accessibilityRole="button"
            accessibilityLabel="Get Started Now"
          >
            <Text style={styles.primaryCtaText}>
              {isBangla ? 'এখনই শুরু করুন' : 'Get Started Now'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </SpringPressable>

          {/* Secondary CTA: Already have an account? Sign In */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              onSignIn?.();
            }}
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
          >
            <Ionicons name="globe-outline" size={13} color="rgba(0, 210, 255, 0.85)" />
            <Text style={styles.websiteLinkText}>www.thrivingskill.com</Text>
          </TouchableOpacity>

          {/* App Version Tag */}
          <Text style={styles.versionTag}>
            App Version 4.0.2.3
          </Text>

          {/* iOS / Mobile Home Indicator Bar */}
          <View style={styles.homeIndicatorBar} />
        </Animated.View>

      </View>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#041935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topAmbientCyan: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0, 210, 255, 0.16)',
    filter: Platform.OS === 'web' ? 'blur(64px)' : undefined,
  },
  midAmbientBlue: {
    position: 'absolute',
    top: '35%',
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(14, 67, 140, 0.22)',
    filter: Platform.OS === 'web' ? 'blur(60px)' : undefined,
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#041935',
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
  topBarClock: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
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
    color: '#00d2ff',
  },
  langDivider: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 1,
  },
  powerIconPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(2, 24, 56, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.45)',
    shadowColor: '#00d2ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  nodeIconWrapCyan: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 210, 255, 0.2)',
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
    backgroundColor: 'rgba(2, 24, 56, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  nodeIconWrapSky: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#E0F2FE',
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
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.35)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    marginBottom: 6,
  },
  glowingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00e5ff',
    marginRight: 6,
  },
  mottoBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#00e5ff',
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
  cyanUnderline: {
    width: 28,
    height: 2.5,
    backgroundColor: '#00e5ff',
    borderRadius: 2,
  },
  subHeadingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00e5ff',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  pillarsSection: {
    marginVertical: 10,
    zIndex: 10,
  },
  pillarsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: shape.large,
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
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.25)',
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
    backgroundColor: '#E34234',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: shape.medium,
    paddingVertical: 11,
    paddingHorizontal: 16,
    width: '100%',
  },
  secondaryCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
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
    fontWeight: '600',
    color: 'rgba(0, 210, 255, 0.85)',
    letterSpacing: 0.4,
  },
  versionTag: {
    fontSize: 9.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
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
