import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../theme/colors';
import { LearnPressCourseFilter } from '../../types';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

export interface LearnPressCourseStats {
  enrolledCount: number;
  inProgressCount: number;
  finishedCount: number;
  passedCount: number;
  failedCount: number;
}

interface LearnPressStatsGridProps {
  stats: LearnPressCourseStats;
  activeFilter: LearnPressCourseFilter;
  onSelectFilter: (filter: LearnPressCourseFilter) => void;
  colors: ThemeColors;
  isBangla: boolean;
  isDark: boolean;
}

interface StatCardConfig {
  id: string;
  filter: LearnPressCourseFilter;
  titleEn: string;
  titleBn: string;
  count: number;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  lightBg: string;
  darkBg: string;
}

export const LearnPressStatsGrid: React.FC<LearnPressStatsGridProps> = ({
  stats,
  activeFilter,
  onSelectFilter,
  colors,
  isBangla,
  isDark,
}) => {
  const cards: StatCardConfig[] = [
    {
      id: 'enrolled',
      filter: 'all',
      titleEn: 'Enrolled Course',
      titleBn: 'এনরোল্ড কোর্স',
      count: stats.enrolledCount,
      iconName: 'book-outline',
      color: '#0D9488', // Teal
      lightBg: 'rgba(13, 148, 136, 0.12)',
      darkBg: 'rgba(13, 148, 136, 0.22)',
    },
    {
      id: 'inprogress',
      filter: 'in-progress',
      titleEn: 'Inprogress Course',
      titleBn: 'চলমান কোর্স',
      count: stats.inProgressCount,
      iconName: 'time-outline',
      color: '#9333EA', // Purple
      lightBg: 'rgba(147, 51, 234, 0.12)',
      darkBg: 'rgba(147, 51, 234, 0.22)',
    },
    {
      id: 'finished',
      filter: 'finished',
      titleEn: 'Finished Course',
      titleBn: 'সম্পন্ন কোর্স',
      count: stats.finishedCount,
      iconName: 'ribbon-outline',
      color: '#4F46E5', // Indigo
      lightBg: 'rgba(79, 70, 229, 0.12)',
      darkBg: 'rgba(79, 70, 229, 0.22)',
    },
    {
      id: 'passed',
      filter: 'passed',
      titleEn: 'Passed Course',
      titleBn: 'উত্তীর্ণ কোর্স',
      count: stats.passedCount,
      iconName: 'checkmark-circle-outline',
      color: '#16A34A', // Green
      lightBg: 'rgba(22, 163, 74, 0.12)',
      darkBg: 'rgba(22, 163, 74, 0.22)',
    },
    {
      id: 'failed',
      filter: 'failed',
      titleEn: 'Failed Course',
      titleBn: 'অনুত্তীর্ণ কোর্স',
      count: stats.failedCount,
      iconName: 'close-circle-outline',
      color: '#EF4444', // Red/Coral
      lightBg: 'rgba(239, 68, 68, 0.12)',
      darkBg: 'rgba(239, 68, 68, 0.22)',
    },
  ];

  const tabs: { id: LearnPressCourseFilter; labelEn: string; labelBn: string }[] = [
    { id: 'all', labelEn: 'All', labelBn: 'সকল' },
    { id: 'in-progress', labelEn: 'In Progress', labelBn: 'চলমান' },
    { id: 'finished', labelEn: 'Finished', labelBn: 'সম্পন্ন' },
    { id: 'passed', labelEn: 'Passed', labelBn: 'উত্তীর্ণ' },
    { id: 'failed', labelEn: 'Failed', labelBn: 'অনুত্তীর্ণ' },
  ];

  const handleCardPress = (filter: LearnPressCourseFilter) => {
    triggerHaptic('selection');
    onSelectFilter(filter);
  };

  return (
    <View style={styles.container}>
      {/* 5 Authentic LearnPress KPI Stat Cards */}
      <View style={styles.grid}>
        {cards.map((card) => {
          const isCardSelected = activeFilter === card.filter;
          const bgIconColor = isDark ? card.darkBg : card.lightBg;

          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: isCardSelected ? card.color : colors.border,
                  borderWidth: isCardSelected ? 2 : 1,
                },
              ]}
              onPress={() => handleCardPress(card.filter)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${isBangla ? card.titleBn : card.titleEn}: ${card.count}`}
              accessibilityState={{ selected: isCardSelected }}
            >
              <View style={[styles.iconCircle, { backgroundColor: bgIconColor }]}>
                <Ionicons name={card.iconName} size={22} color={card.color} />
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: colors.text },
                    isCardSelected && { fontWeight: '700' },
                  ]}
                  numberOfLines={2}
                >
                  {isBangla ? card.titleBn : card.titleEn}
                </Text>
                <Text style={[styles.cardCount, { color: colors.text }]}>
                  {card.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 5 Filter Tabs Underneath Matching Live Website */}
      <View style={[styles.tabBarWrapper, { borderBottomColor: colors.borderSubtle }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
          accessibilityRole="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            const activeColor = isDark ? colors.brandGold : colors.primary;

            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  isActive && {
                    borderBottomColor: activeColor,
                    borderBottomWidth: 3,
                  },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  onSelectFilter(tab.id);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${isBangla ? tab.labelBn : tab.labelEn} tab`}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? (isDark ? '#FFFFFF' : colors.primary) : colors.textMuted,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {isBangla ? tab.labelBn : tab.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: MIN_TOUCH_TARGET,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  cardCount: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
  },
  tabBarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 15,
  },
});
