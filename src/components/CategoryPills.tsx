import React, { useRef, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../data/mockData';
import { Category, CategoryId } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface CategoryPillsProps {
  selectedId: CategoryId;
  onSelect: (id: CategoryId) => void;
  categories?: Category[];
  autoScroll?: boolean;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedId,
  onSelect,
  categories,
  autoScroll = true,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const list: Category[] = categories && categories.length > 0 ? categories : CATEGORIES;

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPosRef = useRef<number>(0);
  const contentWidthRef = useRef<number>(0);
  const containerWidthRef = useRef<number>(0);
  const isUserInteractingRef = useRef<boolean>(false);
  const scrollDirectionRef = useRef<'right' | 'left'>('right');
  const pauseCounterRef = useRef<number>(0);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoScroll) return;

    // Smooth, slow auto-scroll ticker running at ~33 FPS
    const interval = setInterval(() => {
      if (isUserInteractingRef.current) return;

      const maxScroll = Math.max(0, contentWidthRef.current - containerWidthRef.current);
      if (maxScroll <= 5) return;

      // Handle gentle pauses at edges
      if (pauseCounterRef.current > 0) {
        pauseCounterRef.current -= 1;
        return;
      }

      const step = 0.55; // Gentle, elegant gliding speed (approx 18px per second)

      if (scrollDirectionRef.current === 'right') {
        scrollPosRef.current += step;
        if (scrollPosRef.current >= maxScroll) {
          scrollPosRef.current = maxScroll;
          scrollDirectionRef.current = 'left';
          pauseCounterRef.current = 50; // Pause for ~1.5 seconds at the right edge
        }
      } else {
        scrollPosRef.current -= step;
        if (scrollPosRef.current <= 0) {
          scrollPosRef.current = 0;
          scrollDirectionRef.current = 'right';
          pauseCounterRef.current = 50; // Pause for ~1.5 seconds at the left edge
        }
      }

      scrollViewRef.current?.scrollTo({
        x: scrollPosRef.current,
        animated: false,
      });
    }, 30);

    return () => {
      clearInterval(interval);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [autoScroll]);

  const handleScrollBeginDrag = () => {
    isUserInteractingRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleScrollEndDrag = () => {
    // Graceful delay before auto-scrolling resumes
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 2800);
  };

  const handleMomentumScrollEnd = (e: any) => {
    scrollPosRef.current = e.nativeEvent.contentOffset.x;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 2800);
  };

  const handleScroll = (e: any) => {
    if (isUserInteractingRef.current) {
      scrollPosRef.current = e.nativeEvent.contentOffset.x;
    }
  };

  const handlePressCategory = (catId: CategoryId) => {
    isUserInteractingRef.current = true;
    onSelect(catId);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 3500);
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      scrollEventThrottle={16}
      onScroll={handleScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width;
      }}
      onContentSizeChange={(w) => {
        contentWidthRef.current = w;
      }}
    >
      {list.map((cat) => {
        const isSelected = selectedId === cat.id;
        const displayName = isBangla && cat.banglaName ? cat.banglaName : cat.name;

        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : isDark
                  ? colors.surfaceCard
                  : '#FFFFFF',
                borderColor: isSelected ? colors.primary : colors.border,
              },
              isSelected && [styles.selectedPillShadow, { shadowColor: colors.primary }],
            ]}
            onPress={() => handlePressCategory(cat.id)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={cat.icon as any}
              size={15}
              color={isSelected ? '#FFFFFF' : colors.primary}
              style={styles.icon}
            />
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? '#FFFFFF' : colors.text,
                  fontWeight: isSelected ? '700' : '600',
                },
              ]}
            >
              {displayName}
            </Text>
            {cat.id !== 'all' && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : colors.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: isSelected ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  {cat.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectedPillShadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
