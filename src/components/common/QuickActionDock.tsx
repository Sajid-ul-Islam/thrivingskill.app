import React from 'react';
import { SpringPressable } from './SpringPressable';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSaaS } from '../../context/SaaSContext';

interface QuickActionDockProps {
  onOpenCourses: () => void;
  onOpenAssessment: () => void;
  onOpenWorkshops: () => void;
  onOpenMyLearning: () => void;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  onOpenCourses,
  onOpenAssessment,
  onOpenWorkshops,
  onOpenMyLearning,
}) => {
  const { colors, isDark } = useTheme();
  const { assessmentResult } = useSaaS();

  const actions: {
    id: string;
    label: string;
    sublabel: string;
    icon: string;
    badgeText?: string;
    color: string;
    bgColor: string;
    onPress: () => void;
  }[] = [
    {
      id: 'courses',
      label: 'Explore',
      sublabel: 'All Courses',
      icon: 'compass',
      badgeText: 'New',
      color: '#6366F1',
      bgColor: '#EEF2FF',
      onPress: onOpenCourses,
    },
    {
      id: 'diagnostic',
      label: 'Diagnostic',
      sublabel: assessmentResult ? `${assessmentResult.overallScore}% Score` : '3-min Quiz',
      icon: 'analytics',
      badgeText: assessmentResult ? 'Done' : 'Quiz',
      color: '#059669',
      bgColor: '#D1FAE5',
      onPress: onOpenAssessment,
    },
    {
      id: 'live',
      label: 'Live Events',
      sublabel: 'Workshops',
      icon: 'videocam',
      badgeText: 'Live',
      color: '#E11D48',
      bgColor: '#FFE4E6',
      onPress: onOpenWorkshops,
    },
    {
      id: 'learning',
      label: 'My Learning',
      sublabel: 'My Hub',
      icon: 'book',
      color: '#D97706',
      bgColor: '#FEF3C7',
      onPress: onOpenMyLearning,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.map((act) => (
          <SpringPressable
            key={act.id}
            style={[
              styles.actionItem,
              {
                backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
            onPress={act.onPress}
            activeScale={0.94}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: isDark ? `${act.color}22` : act.bgColor },
              ]}
            >
              <Ionicons name={act.icon as any} size={20} color={act.color} />
            </View>

            <Text style={[styles.label, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {act.label}
            </Text>
            <Text style={[styles.sublabel, { color: colors.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {act.sublabel}
            </Text>

            {act.badgeText && (
              <View
                style={[
                  styles.miniBadge,
                  {
                    backgroundColor:
                      act.id === 'live'
                        ? '#DC2626'
                        : act.id === 'courses'
                        ? '#4F46E5'
                        : '#047857',
                  },
                ]}
              >
                <Text style={styles.miniBadgeText}>{act.badgeText}</Text>
              </View>
            )}
          </SpringPressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  actionItem: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  miniBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    elevation: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    lineHeight: 10,
    includeFontPadding: false,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
