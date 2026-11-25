import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { HomeFeatureCardItem } from '../../services/api/brandingService';
import { SpringPressable } from '../common/SpringPressable';
import { typography } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { triggerHaptic } from '../../utils/haptics';
import { getSafeImageSource } from '../../utils/imageUtils';

interface HomeFeatureGridProps {
  features: HomeFeatureCardItem[];
  onSelectFeature: (feature: HomeFeatureCardItem) => void;
}

export const HomeFeatureGrid: React.FC<HomeFeatureGridProps> = ({ features, onSelectFeature }) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  if (!features || features.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleWrap}>
          <Text style={[typography.h3, { color: colors.text }]}>
            {isBangla ? 'শিখুন এবং গড়ুন নিজের ক্যারিয়ার' : 'Learn & Build Your Career'}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            {isBangla
              ? 'দক্ষতা অর্জনের মাধ্যমে নিজেকে এক ধাপ এগিয়ে রাখুন'
              : 'Stay one step ahead with industry-accredited professional paths'}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {features.map((item) => {
          const title = isBangla ? item.titleBn : item.title;
          const subtitle = isBangla ? item.subtitleBn : item.subtitle;
          const badge = isBangla ? item.badgeBn : item.badge;

          return (
            <SpringPressable
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#0A1C33',
                  borderColor: isDark ? colors.border : 'rgba(255, 255, 255, 0.1)',
                },
              ]}
              activeScale={0.97}
              haptic="selection"
              onPress={() => {
                triggerHaptic('light');
                onSelectFeature(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${title}, ${subtitle}`}
            >
              <ImageBackground
                source={getSafeImageSource(item.imageUrl)}
                style={styles.imageBackground}
                imageStyle={styles.backgroundImageStyle}
                resizeMode="cover"
                {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
              >
                <LinearGradient
                  colors={['rgba(16, 47, 83, 0.35)', 'rgba(10, 28, 51, 0.85)', '#0A1C33']}
                  style={styles.gradientOverlay}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                    <View style={styles.arrowIconWrap}>
                      <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {subtitle}
                    </Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </SpringPressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  titleWrap: {
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    minWidth: 150,
    height: 154,
    borderRadius: shape.large,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#0A1C33',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(10, 28, 51, 0.12)',
      },
    }),
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    borderRadius: shape.large,
  },
  gradientOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePill: {
    backgroundColor: 'rgba(255, 182, 6, 0.95)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: shape.full,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#102F53',
    letterSpacing: 0.5,
  },
  arrowIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
    lineHeight: 14,
  },
});
