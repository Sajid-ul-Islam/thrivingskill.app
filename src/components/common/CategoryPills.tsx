import React, { useRef, useCallback, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category, CategoryId } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface CategoryPillsProps {
  selectedId: CategoryId;
  onSelect: (id: CategoryId) => void;
  categories?: Category[];
  autoScroll?: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Courses', banglaName: 'সব কোর্স', icon: 'grid', count: 0, color: '#059669', slug: 'all' },
];

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedId,
  onSelect,
  categories,
  autoScroll = false, // User-controlled scrolling preferred by default to avoid cognitive distraction
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const list: Category[] = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const pillLayoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const containerWidthRef = useRef<number>(0);

  const { scrollViewRef, scrollProps, pauseTemporarily, isReduceMotion } = useAutoScroll({
    enabled: autoScroll,
    speed: 0.55,
    pauseAtEdgeMs: 1500,
    resumeDelayMs: 2800,
  });

  // Smoothly center the selected pill in the viewport when tapped
  const centerPill = useCallback(
    (catId: CategoryId) => {
      const layout = pillLayoutsRef.current[catId];
      if (layout && containerWidthRef.current > 0 && scrollViewRef.current) {
        const targetX = Math.max(0, layout.x - containerWidthRef.current / 2 + layout.width / 2);
        scrollViewRef.current.scrollTo({ x: targetX, animated: !isReduceMotion });
      }
    },
    [isReduceMotion, scrollViewRef]
  );

  useEffect(() => {
    centerPill(selectedId);
  }, [selectedId, centerPill]);

  const handlePressCategory = (catId: CategoryId) => {
    triggerHaptic('selection');
    pauseTemporarily(3500);
    onSelect(catId);
    centerPill(catId);
  };

  const handleScrollViewLayout = (e: LayoutChangeEvent) => {
    containerWidthRef.current = e.nativeEvent.layout.width;
    scrollProps.onLayout(e);
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityRole="tablist"
      {...scrollProps}
      onLayout={handleScrollViewLayout}
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
            onLayout={(e) => {
              pillLayoutsRef.current[cat.id] = {
                x: e.nativeEvent.layout.x,
                width: e.nativeEvent.layout.width,
              };
            }}
            onPress={() => handlePressCategory(cat.id)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${displayName}, ${cat.count ? `${cat.count} courses` : ''}`}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Ionicons
              name={(cat.icon as any) || 'book-outline'}
              size={15}
              color={isSelected ? colors.onPrimary : colors.primary}
              style={styles.icon}
            />
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? colors.onPrimary : colors.text,
                  fontWeight: isSelected ? '700' : '600',
                },
              ]}
            >
              {displayName}
            </Text>
            {cat.id !== 'all' && typeof cat.count === 'number' && cat.count > 0 && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(15, 23, 42, 0.16)'
                        : 'rgba(255, 255, 255, 0.22)'
                      : colors.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: isSelected ? colors.onPrimary : colors.textMuted },
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
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    borderWidth: 1,
  },
  selectedPillShadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: shape.full,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
