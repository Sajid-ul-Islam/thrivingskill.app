import React, { useState, useRef, useEffect } from 'react';
import { SpringPressable } from './SpringPressable';
import {
  View,
  Text,
  Image,
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { shape } from '../../theme/shapes';

export interface CarouselSlide {
  id: string;
  badge: string;
  badgeIcon: string;
  title: string;
  subtitle: string;
  ctaText: string;
  gradientColors: [string, string, ...string[]];
  actionType: 'summit' | 'course' | 'trailer' | 'subscription' | 'bundle';
  targetId?: string;
  imageUrl?: string;
  linkUrl?: string;
}

interface HeroCarouselProps {
  slides?: CarouselSlide[];
  onSelectSlide: (slide: CarouselSlide) => void;
  onOpenSubscription?: () => void;
}

const SLIDES: CarouselSlide[] = [
  {
    id: 'summit-2026',
    badge: 'FLAGSHIP CONFERENCE 2026',
    badgeIcon: 'calendar',
    title: 'Bangladesh Skills Summit 2026',
    subtitle: 'Decoding 4IR employability, AI workforce transformation, & leadership.',
    ctaText: 'Reserve Summit Pass →',
    gradientColors: ['#102F53', '#1D4476', '#102F53'],
    actionType: 'summit',
    targetId: 'summit-2026',
  },
  {
    id: 'ai-masterclass',
    badge: 'EXECUTIVE MASTERCLASS',
    badgeIcon: 'sparkles',
    title: 'Generative AI & Prompt Engineering',
    subtitle: '10x office productivity with ChatGPT, Claude & automated workflow models.',
    ctaText: 'Watch Video Trailer →',
    gradientColors: ['#102F53', '#1D4476', '#E34234'],
    actionType: 'trailer',
    targetId: 'course-ai-productivity',
  },
  {
    id: 'excel-modeling',
    badge: 'INDUSTRY ACCREDITED',
    badgeIcon: 'ribbon',
    title: 'Advanced Excel & Financial Modeling',
    subtitle: 'Build dynamic C-suite KPI cockpits & automate financial valuations.',
    ctaText: 'Explore Course →',
    gradientColors: ['#102F53', '#0A1C33', '#102F53'],
    actionType: 'course',
    targetId: 'course-excel-dashboards',
  },
];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  slides: propSlides,
  onSelectSlide,
}) => {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.max(280, screenWidth - 32);
  const slides = propSlides && propSlides.length > 0 ? propSlides : SLIDES;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isReduceMotion, setIsReduceMotion] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Observe accessibility reduced motion setting
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (mounted) setIsReduceMotion(Boolean(reduce));
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (reduce) => {
      if (mounted) setIsReduceMotion(Boolean(reduce));
    });

    return () => {
      mounted = false;
      if (sub && typeof sub.remove === 'function') sub.remove();
    };
  }, []);

  const startAutoScroll = () => {
    stopAutoScroll();
    if (isReduceMotion || isManualPaused || slides.length <= 1) return; // Suppress auto movement if user requested reduced motion, manually paused, or single slide
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % slides.length;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * (cardWidth + 12),
          animated: true,
        });
        return nextIndex;
      });
    }, 6000);
  };

  const stopAutoScroll = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const toggleManualPause = () => {
    setIsManualPaused((prev) => {
      const next = !prev;
      if (next) {
        stopAutoScroll();
      } else {
        startAutoScroll();
      }
      return next;
    });
  };

  const handleUserTouchStart = () => {
    stopAutoScroll();
  };

  const handleUserTouchEnd = () => {
    if (isManualPaused) return;
    // Generous 7-second cooldown after user touch before gently resuming
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      startAutoScroll();
    }, 7000);
  };

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [isReduceMotion, isManualPaused, slides.length]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const denom = cardWidth + 12;
    const index = denom > 0 ? Math.round(offsetX / denom) : 0;
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActiveIndex(index);
    }
  };

  const renderItem = ({ item }: { item: CarouselSlide }) => {
    const hasImage = Boolean(item.imageUrl && !imageErrors[item.id]);

    return (
      <SpringPressable onPress={() => onSelectSlide(item)} activeScale={0.98} style={[styles.slideCard, { width: cardWidth }]}>
        {/* Remote Server Banner Image with onError fallback */}
        {hasImage && (
          <Image
            source={{ uri: item.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))}
          />
        )}

        <LinearGradient
          colors={
            hasImage
              ? ['rgba(16, 47, 83, 0.75)', 'rgba(15, 23, 42, 0.94)']
              : item.gradientColors
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Subtle Background Glow Circles */}
          <View style={styles.glowCircleOne} />
          <View style={styles.glowCircleTwo} />

          {/* Top Badge Row */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name={item.badgeIcon as any} size={11} color="#FBBF24" />
              <Text style={styles.badgeText} numberOfLines={1} ellipsizeMode="tail">
                {item.badge}
              </Text>
            </View>

            <View style={styles.verifiedChip}>
              <Ionicons name="checkmark-circle" size={12} color="#34D399" />
              <Text style={styles.verifiedChipText}>Official</Text>
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>

          {/* CTA Row */}
          <View style={styles.ctaRow}>
            <View style={styles.ctaBtn}>
              <Text style={styles.ctaText}>{item.ctaText}</Text>
            </View>
            <View style={styles.slideCounterGroup}>
              <TouchableOpacity
                onPress={toggleManualPause}
                style={styles.pauseBtn}
                accessibilityRole="button"
                accessibilityLabel={isManualPaused ? 'Play slide carousel' : 'Pause slide carousel'}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={isManualPaused ? 'play' : 'pause'}
                  size={11}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <Text style={styles.slideCounter}>
                {activeIndex + 1}/{slides.length}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SpringPressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={handleUserTouchStart}
        onTouchEnd={handleUserTouchEnd}
        onScrollBeginDrag={handleUserTouchStart}
        onScrollEndDrag={handleUserTouchEnd}
        contentContainerStyle={styles.listContent}
        snapToInterval={cardWidth + 12}
        decelerationRate="fast"
      />

      {/* Pagination Dots */}
      <View style={styles.paginationRow}>
        {slides.map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                isActive
                  ? [styles.activeDot, { backgroundColor: colors.primary }]
                  : [styles.inactiveDot, { backgroundColor: colors.border }],
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  slideCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  gradient: {
    padding: 18,
    minHeight: 180,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircleOne: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  glowCircleTwo: {
    position: 'absolute',
    bottom: -50,
    left: '35%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 1,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexShrink: 0,
  },
  verifiedChipText: {
    color: '#E5E7EB',
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  ctaBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaText: {
    color: '#102F53',
    fontSize: 12,
    fontWeight: '800',
  },
  slideCounterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: shape.full,
  },
  pauseBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  slideCounter: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
  },
  inactiveDot: {
    width: 6,
  },
});
