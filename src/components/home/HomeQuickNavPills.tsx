import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SpringPressable } from '../common/SpringPressable';
import { typography } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { triggerHaptic } from '../../utils/haptics';

export interface QuickNavItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  labelBn: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
}

interface HomeQuickNavPillsProps {
  onOpenCareerTrack?: () => void;
  onOpenThriveGen: () => void;
  onOpenBundles: () => void;
  onOpenBlog: () => void;
  onOpenSubscription: () => void;
  onOpenWorkshops: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
}

export const HomeQuickNavPills: React.FC<HomeQuickNavPillsProps> = ({
  onOpenCareerTrack,
  onOpenThriveGen,
  onOpenBundles,
  onOpenBlog,
  onOpenSubscription,
  onOpenWorkshops,
  onOpenAbout,
  onOpenContact,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  const navItems: QuickNavItem[] = [
    {
      id: 'career-track',
      icon: 'school',
      label: 'Career Track',
      labelBn: 'ক্যারিয়ার ট্র্যাক',
      badge: 'PRO',
      badgeColor: '#E34234',
      onPress: onOpenCareerTrack || onOpenBundles,
    },
    {
      id: 'thrive-gen',
      icon: 'school',
      label: 'Thrive Gen',
      labelBn: 'থ্রাইভ জেন',
      badge: 'YOUTH',
      badgeColor: '#E34234',
      onPress: onOpenThriveGen,
    },
    {
      id: 'bundles',
      icon: 'layers',
      label: 'Career Bundles',
      labelBn: 'কোর্স বান্ডেল',
      badge: '-40%',
      badgeColor: '#E34234',
      onPress: onOpenBundles,
    },
    {
      id: 'blog',
      icon: 'newspaper',
      label: 'Insights & Blog',
      labelBn: 'ইনসাইটস ও ব্লগ',
      onPress: onOpenBlog,
    },
    {
      id: 'subscription',
      icon: 'diamond',
      label: 'Unlimited Pro',
      labelBn: 'সাবস্ক্রিপশন',
      onPress: onOpenSubscription,
    },
    {
      id: 'workshops',
      icon: 'videocam',
      label: 'Masterclass',
      labelBn: 'মাস্টারক্লাস',
      onPress: onOpenWorkshops,
    },
    {
      id: 'about',
      icon: 'information-circle',
      label: 'About & MoUs',
      labelBn: 'পরিচিতি ও চুক্তি',
      onPress: onOpenAbout,
    },
    {
      id: 'contact',
      icon: 'chatbubbles',
      label: 'Support Hub',
      labelBn: 'সাপোর্ট হাব',
      onPress: onOpenContact,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {navItems.map((item) => (
          <SpringPressable
            key={item.id}
            style={[
              styles.pill,
              {
                backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
            activeScale={0.94}
            haptic="light"
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            onPress={() => {
              triggerHaptic('light');
              item.onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? item.labelBn : item.label}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isDark ? 'rgba(16, 47, 83, 0.4)' : '#E8EEF5',
                },
              ]}
            >
              <Ionicons name={item.icon} size={14} color={colors.primary} />
            </View>

            <Text style={[styles.pillText, { color: colors.text }]}>
              {isBangla ? item.labelBn : item.label}
            </Text>

            {item.badge && (
              <View style={[styles.badge, { backgroundColor: item.badgeColor || colors.primary }]}>
                <Text
                  style={[
                    styles.badgeText,
                    { color: item.badgeColor ? '#FFFFFF' : colors.onPrimary },
                  ]}
                >
                  {item.badge}
                </Text>
              </View>
            )}
          </SpringPressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 7,
    minHeight: 38,
    borderRadius: shape.full,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#102F53',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(16, 47, 83, 0.05)',
      },
    }),
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: shape.full,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
