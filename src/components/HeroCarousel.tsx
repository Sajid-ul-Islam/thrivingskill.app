import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

export interface CarouselSlide {
  id: string;
  badge: string;
  badgeIcon: string;
  title: string;
  subtitle: string;
  ctaText: string;
  gradientColors: [string, string, ...string[]];
  actionType: 'summit' | 'course' | 'trailer' | 'subscription';
  targetId?: string;
}

interface HeroCarouselProps {
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
    gradientColors: ['#1E1B4B', '#312E81', '#4338CA'],
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
    gradientColors: ['#3B0764', '#581C87', '#7E22CE'],
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
    gradientColors: ['#064E3B', '#047857', '#059669'],
    actionType: 'course',
    targetId: 'course-excel-dashboards',
  },
];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  onSelectSlide,
}) => {
  const { colors, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoScroll = () => {
    stopAutoScroll();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % SLIDES.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000);
  };

  const stopAutoScroll = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const renderItem = ({ item }: { item: CarouselSlide }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onSelectSlide(item)}
        style={[styles.slideCard, { width: CARD_WIDTH }]}
      >
        <LinearGradient
          colors={item.gradientColors}
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
              <Text style={styles.badgeText}>{item.badge}</Text>
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
            <Text style={styles.slideCounter}>
              {activeIndex + 1}/{SLIDES.length}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={stopAutoScroll}
        onTouchEnd={startAutoScroll}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      />

      {/* Pagination Dots */}
      <View style={styles.paginationRow}>
        {SLIDES.map((_, i) => {
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
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
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
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  slideCounter: {
    color: 'rgba(255, 255, 255, 0.6)',
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
