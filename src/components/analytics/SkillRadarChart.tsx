import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Polygon,
  Line,
  Circle,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { ThemeColors } from '../../theme/colors';
import { triggerHaptic } from '../../utils/haptics';

export interface SkillDomainData {
  domain: string;
  domainBn?: string;
  score: number;
  maxScore?: number;
}

interface SkillRadarChartProps {
  data: SkillDomainData[];
  size?: number;
  colors: ThemeColors;
  isBangla?: boolean;
  onSelectDomain?: (item: SkillDomainData) => void;
}

const DOMAIN_SHORT_NAMES: Record<string, { en: string; bn: string }> = {
  'Generative AI & Tech': { en: 'AI & Tech', bn: 'এআই ও প্রযুক্তি' },
  'Financial Strategy': { en: 'Finance', bn: 'ফাইন্যান্স' },
  'Data Analytics & BI': { en: 'Data & BI', bn: 'ডাটা ও বিআই' },
  'People Analytics & HR': { en: 'People & HR', bn: 'এইচআর ও পিপল' },
  'Executive Communication': { en: 'Leadership', bn: 'কমিউনিকেশন' },
};

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  data,
  size = 280,
  colors,
  isBangla = false,
  onSelectDomain,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (!data || data.length === 0) return null;

  const count = data.length;
  const center = size / 2;
  const maxRadius = (size - 76) / 2;
  const levels = [0.33, 0.66, 1.0];

  // Helper for polar coordinates (-90 deg offset so first vertex points UP)
  const getCoordinates = (index: number, radiusRatio: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const r = radiusRatio * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Build grid web polygons
  const gridPolygons = levels.map((lvl) => {
    return Array.from({ length: count })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, lvl);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  // Build data points polygon
  const dataPoints = data.map((d, i) => {
    const scoreRatio = Math.max(0.12, Math.min(d.score / (d.maxScore || 100), 1.0));
    return getCoordinates(i, scoreRatio);
  });

  const dataPolygonString = dataPoints
    .map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');

  const activeDomain = data[selectedIndex] || data[0];
  const shortInfo = DOMAIN_SHORT_NAMES[activeDomain.domain] || {
    en: activeDomain.domain,
    bn: activeDomain.domain,
  };

  const getScoreTier = (score: number) => {
    if (score >= 85)
      return { label: isBangla ? 'উন্নত (Advanced)' : 'Advanced Mastery', color: colors.success };
    if (score >= 60)
      return {
        label: isBangla ? 'দক্ষ (Proficient)' : 'Proficient',
        color: colors.primary,
      };
    return {
      label: isBangla ? 'উন্নতি প্রয়োজন (Growth Area)' : 'Growth Priority',
      color: colors.accent,
    };
  };

  const tier = getScoreTier(activeDomain.score);

  return (
    <View style={styles.container}>
      {/* Interactive Active Competency Callout Banner */}
      <View
        style={[
          styles.activeCalloutCard,
          { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
        ]}
      >
        <View style={styles.calloutHeaderRow}>
          <View style={styles.calloutTitleWrap}>
            <Text style={[styles.calloutDomainTitle, { color: colors.text }]}>
              {isBangla ? shortInfo.bn : shortInfo.en}
            </Text>
            <Text style={[styles.calloutTierText, { color: tier.color }]}>{tier.label}</Text>
          </View>
          <View
            style={[
              styles.calloutScorePill,
              { backgroundColor: colors.surfaceCard, borderColor: colors.borderSubtle },
            ]}
          >
            <Text style={[styles.calloutScoreValue, { color: colors.primary }]}>
              {activeDomain.score}%
            </Text>
          </View>
        </View>
        <Text style={[styles.calloutHint, { color: colors.textMuted }]}>
          {isBangla
            ? 'যেকোনো ডোমেইনে ট্যাপ করে বিস্তারিত স্কোর ও নির্দেশনা দেখুন'
            : 'Tap any axis vertex to inspect competency focus'}
        </Text>
      </View>

      {/* SVG Spider / Radar Chart */}
      <View style={styles.svgWrap}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="radarFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.38} />
              <Stop offset="70%" stopColor={colors.accent} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.08} />
            </LinearGradient>
          </Defs>

          {/* Concentric Guide Grid Webs */}
          {gridPolygons.map((ptsString, idx) => (
            <Polygon
              key={`grid-${idx}`}
              points={ptsString}
              stroke={colors.borderSubtle || '#E2E8F0'}
              strokeWidth={idx === gridPolygons.length - 1 ? 1.5 : 1}
              strokeDasharray={idx < gridPolygons.length - 1 ? '3 3' : undefined}
              fill="transparent"
            />
          ))}

          {/* Spoke Lines from Center to Vertices */}
          {Array.from({ length: count }).map((_, i) => {
            const outer = getCoordinates(i, 1.0);
            return (
              <Line
                key={`spoke-${i}`}
                x1={center}
                y1={center}
                x2={outer.x}
                y2={outer.y}
                stroke={colors.borderSubtle || '#E2E8F0'}
                strokeWidth={1}
              />
            );
          })}

          {/* Competency Fill Polygon */}
          <Polygon
            points={dataPolygonString}
            fill="url(#radarFillGradient)"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Vertex Data Points */}
          {dataPoints.map((pt, i) => {
            const isSelected = i === selectedIndex;
            return (
              <G key={`point-${i}`}>
                {isSelected && (
                  <Circle cx={pt.x} cy={pt.y} r={9} fill={colors.accent} fillOpacity={0.24} />
                )}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 5.5 : 4}
                  fill={isSelected ? colors.accent : colors.primary}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              </G>
            );
          })}

          {/* Axis Labels outside perimeter */}
          {data.map((d, i) => {
            const labelCoord = getCoordinates(i, 1.25);
            const short = DOMAIN_SHORT_NAMES[d.domain] || { en: d.domain, bn: d.domain };
            const labelText = isBangla ? short.bn : short.en;
            const isSelected = i === selectedIndex;

            return (
              <SvgText
                key={`label-${i}`}
                x={labelCoord.x}
                y={labelCoord.y + 4}
                textAnchor="middle"
                fontSize={isSelected ? '10.5' : '9.5'}
                fontWeight={isSelected ? '800' : '600'}
                fill={isSelected ? colors.accent : colors.textMuted}
              >
                {labelText}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Axis Selector Pill Buttons for Easy Mobile Touch (>= 44x44 dp) */}
      <View style={styles.domainPillsRow}>
        {data.map((d, i) => {
          const isSelected = i === selectedIndex;
          const short = DOMAIN_SHORT_NAMES[d.domain] || { en: d.domain, bn: d.domain };
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.domainPill,
                {
                  backgroundColor: isSelected ? colors.primaryLight : colors.surfaceSubtle,
                  borderColor: isSelected ? colors.accent : colors.borderSubtle,
                },
              ]}
              onPress={() => {
                triggerHaptic('selection');
                setSelectedIndex(i);
                onSelectDomain?.(d);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${d.domain}: ${d.score}%`}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.domainPillText,
                  {
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? '800' : '500',
                  },
                ]}
              >
                {isBangla ? short.bn : short.en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  activeCalloutCard: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  calloutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calloutTitleWrap: {
    flex: 1,
  },
  calloutDomainTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  calloutTierText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  calloutScorePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  calloutScoreValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  calloutHint: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500',
  },
  svgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  domainPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  domainPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainPillText: {
    fontSize: 11,
  },
});
