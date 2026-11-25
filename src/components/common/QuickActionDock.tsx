import React from 'react';
import { SpringPressable } from './SpringPressable';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useSaaS } from '../../context/SaaSContext';
import { useLanguage } from '../../context/LanguageContext';

export interface QuickActionDockProps {
  onOpenAssessment: () => void;
  onOpenSubscription: () => void;
  onOpenYouTube?: () => void;
  onOpenCorporateModal: () => void;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  onOpenAssessment,
  onOpenSubscription,
  onOpenYouTube,
  onOpenCorporateModal,
}) => {
  const { colors, isDark } = useTheme();
  const { assessmentResult } = useSaaS();
  const { isBangla } = useLanguage();

  const actions: {
    id: string;
    label: string;
    sublabel: string;
    icon: string;
    badgeText?: string;
    badgeBgColor?: string;
    color: string;
    bgColor: string;
    onPress: () => void;
  }[] = [
    {
      id: 'diagnostic',
      label: isBangla ? 'স্কিল টেস্ট' : 'Diagnostic',
      sublabel: assessmentResult
        ? `${assessmentResult.overallScore}% ${isBangla ? 'স্কোর' : 'Score'}`
        : isBangla
          ? '৩-মিনিট টেস্ট'
          : '3-min Quiz',
      icon: 'analytics',
      badgeText: assessmentResult ? (isBangla ? 'সম্পন্ন' : 'DONE') : isBangla ? 'কুইজ' : 'QUIZ',
      badgeBgColor: '#059669',
      color: '#059669',
      bgColor: '#D1FAE5',
      onPress: onOpenAssessment,
    },
    {
      id: 'subscription',
      label: isBangla ? 'অল-অ্যাক্সেস' : 'All-Access',
      sublabel: isBangla ? 'প্রো মেম্বার' : 'Pro Pass',
      icon: 'ribbon',
      badgeText: 'PRO',
      badgeBgColor: '#D97706',
      color: '#D97706',
      bgColor: '#FEF3C7',
      onPress: onOpenSubscription,
    },
    {
      id: 'masterclass',
      label: isBangla ? 'মাস্টারক্লাস' : 'Masterclass',
      sublabel: isBangla ? 'ফ্রি ভিডিও' : 'Free Videos',
      icon: 'logo-youtube',
      badgeText: 'FREE',
      badgeBgColor: '#DC2626',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      onPress: () => onOpenYouTube?.(),
    },
    {
      id: 'corporate',
      label: isBangla ? 'টিম ট্রেনিং' : 'Buy For Team',
      sublabel: isBangla ? 'কর্পোরেট' : 'Corporate',
      icon: 'business',
      badgeText: 'B2B',
      badgeBgColor: '#2563EB',
      color: '#2563EB',
      bgColor: '#DBEAFE',
      onPress: onOpenCorporateModal,
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
            accessibilityRole="button"
            accessibilityLabel={`${act.label}, ${act.sublabel}`}
          >
            <View
              style={[styles.iconBox, { backgroundColor: isDark ? `${act.color}22` : act.bgColor }]}
            >
              <Ionicons name={act.icon as any} size={20} color={act.color} />
            </View>

            <Text
              style={[styles.label, { color: colors.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {act.label}
            </Text>
            <Text
              style={[styles.sublabel, { color: colors.textMuted }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {act.sublabel}
            </Text>

            {act.badgeText && (
              <View style={[styles.miniBadge, { backgroundColor: act.badgeBgColor || act.color }]}>
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
    minHeight: 88,
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
