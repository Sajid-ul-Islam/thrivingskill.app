import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';

interface QuickActionDockProps {
  onOpenCopilot: () => void;
  onOpenAssessment: () => void;
  onOpenWorkshops: () => void;
  onOpenTeamOrMyLearning: () => void;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  onOpenCopilot,
  onOpenAssessment,
  onOpenWorkshops,
  onOpenTeamOrMyLearning,
}) => {
  const { colors, isDark } = useTheme();
  const { activeWorkspace, assessmentResult } = useSaaS();

  const isEnterprise = activeWorkspace.type === 'enterprise';

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
      id: 'copilot',
      label: 'AI Copilot',
      sublabel: 'Smart Prompt',
      icon: 'sparkles',
      badgeText: 'AI',
      color: '#6366F1',
      bgColor: '#EEF2FF',
      onPress: onOpenCopilot,
    },
    {
      id: 'diagnostic',
      label: 'Skill Diagnostic',
      sublabel: assessmentResult ? `${assessmentResult.overallScore}% Score` : '3-min Quiz',
      icon: 'analytics',
      badgeText: assessmentResult ? 'Done' : 'New',
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
      id: 'workspace',
      label: isEnterprise ? 'Team Hub' : 'My Hub',
      sublabel: isEnterprise ? '25 Seats' : 'Progress',
      icon: isEnterprise ? 'business' : 'ribbon',
      color: '#D97706',
      bgColor: '#FEF3C7',
      onPress: onOpenTeamOrMyLearning,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={[
              styles.actionItem,
              {
                backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
            onPress={act.onPress}
            activeOpacity={0.8}
          >
            {act.badgeText && (
              <View
                style={[
                  styles.miniBadge,
                  {
                    backgroundColor:
                      act.id === 'live'
                        ? '#E11D48'
                        : act.id === 'copilot'
                        ? '#6366F1'
                        : '#059669',
                  },
                ]}
              >
                <Text style={styles.miniBadgeText}>{act.badgeText}</Text>
              </View>
            )}

            <View
              style={[
                styles.iconBox,
                { backgroundColor: isDark ? `${act.color}22` : act.bgColor },
              ]}
            >
              <Ionicons name={act.icon as any} size={20} color={act.color} />
            </View>

            <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
              {act.label}
            </Text>
            <Text style={[styles.sublabel, { color: colors.textMuted }]} numberOfLines={1}>
              {act.sublabel}
            </Text>
          </TouchableOpacity>
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
    paddingVertical: 12,
    paddingHorizontal: 6,
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
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  miniBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
