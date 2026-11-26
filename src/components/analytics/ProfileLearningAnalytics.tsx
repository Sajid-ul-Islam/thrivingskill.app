import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Path,
  Line,
} from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeColors } from '../../theme/colors';
import { LearnPressCourseFilter } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

interface WeeklyDayActivity {
  day: string;
  dayBn: string;
  hours: number;
  isToday?: boolean;
}

interface ProfileLearningAnalyticsProps {
  enrolledCount: number;
  inProgressCount: number;
  completedCount: number;
  totalHours: string;
  certificatesCount: number;
  completionRate: number;
  streakDays?: number;
  weeklyActivity?: WeeklyDayActivity[];
  colors: ThemeColors;
  isBangla: boolean;
  onSelectTab?: (tab: LearnPressCourseFilter) => void;
  activeCourseTab?: LearnPressCourseFilter;
}

const DEFAULT_WEEKLY_ACTIVITY: WeeklyDayActivity[] = [
  { day: 'Mon', dayBn: 'সোম', hours: 1.5 },
  { day: 'Tue', dayBn: 'মঙ্গল', hours: 2.0 },
  { day: 'Wed', dayBn: 'বুধ', hours: 0.8 },
  { day: 'Thu', dayBn: 'বৃহঃ', hours: 3.2, isToday: true },
  { day: 'Fri', dayBn: 'শুক্র', hours: 1.8 },
  { day: 'Sat', dayBn: 'শনি', hours: 2.5 },
  { day: 'Sun', dayBn: 'রবি', hours: 1.0 },
];

export const ProfileLearningAnalytics: React.FC<ProfileLearningAnalyticsProps> = ({
  enrolledCount,
  inProgressCount,
  completedCount,
  totalHours,
  certificatesCount,
  completionRate,
  streakDays = 5,
  weeklyActivity = DEFAULT_WEEKLY_ACTIVITY,
  colors,
  isBangla,
  onSelectTab,
  activeCourseTab = 'in-progress',
}) => {
  // SVG Donut calculation
  const size = 110;
  const strokeWidth = 10;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const validRate = Math.min(Math.max(completionRate, 0), 100);
  const strokeDashoffset = circumference - (circumference * validRate) / 100;

  const { width: windowWidth } = useWindowDimensions();
  const todayIdx = weeklyActivity.findIndex((d) => d.isToday);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    todayIdx >= 0 ? todayIdx : weeklyActivity.length - 1
  );

  // Maximum hours for weekly scaling
  const maxHours = Math.max(...weeklyActivity.map((d) => d.hours), 3.5);
  const totalWeeklyHours = weeklyActivity.reduce((acc, d) => acc + d.hours, 0).toFixed(1);

  // Dynamic dimensions for responsive smooth area chart
  const chartWidth = Math.max(windowWidth - 64, 280);
  const chartHeight = 100;
  const padLeft = 16;
  const padRight = 16;
  const padTop = 14;
  const padBottom = 16;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const points = weeklyActivity.map((d, i) => {
    const x = padLeft + (i / Math.max(weeklyActivity.length - 1, 1)) * plotW;
    const y = padTop + plotH - (Math.max(d.hours, 0) / maxHours) * plotH;
    return { x, y, ...d };
  });

  // Catmull-Rom cubic bezier for ultra-smooth area curves
  const buildSplinePath = (pts: typeof points) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = buildSplinePath(points);
  const areaBottomY = padTop + plotH;
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${areaBottomY.toFixed(1)} L ${points[0].x.toFixed(1)} ${areaBottomY.toFixed(1)} Z`
      : '';

  const activeDay = weeklyActivity[selectedDayIndex] || weeklyActivity[0];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
      ]}
    >
      {/* Header with Title and Streak Pill */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.titleIconBg, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="pie-chart" size={17} color={colors.primary} />
          </View>
          <View style={styles.titleTextWrap}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {isBangla ? 'লার্নিং অ্যানালিটিক্স ও দক্ষতা চার্ট' : 'Learning Analytics & Progress'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
              {isBangla
                ? 'আপনার কোর্স সমাপ্তি ও অধ্যয়নের গতিবিধি'
                : 'Track course completions & study momentum'}
            </Text>
          </View>
        </View>

        <View style={[styles.streakBadge, { backgroundColor: 'rgba(225, 29, 72, 0.1)' }]}>
          <Ionicons name="flame" size={14} color="#E11D48" />
          <Text style={styles.streakText}>
            {streakDays > 0
              ? isBangla
                ? `${streakDays} দিন স্ট্রিক`
                : `${streakDays}-Day Streak`
              : isBangla
                ? 'স্ট্রিক শুরু'
                : 'New Streak'}
          </Text>
        </View>
      </View>

      {/* Main Chart Section: Donut + Legend */}
      <View style={[styles.chartBody, { borderBottomColor: colors.borderSubtle }]}>
        {/* Circular Donut Gauge */}
        <View style={styles.donutWrapper}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.brandNavy} />
                <Stop offset="100%" stopColor={colors.accent} />
              </LinearGradient>
            </Defs>
            {/* Background Circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.borderSubtle || '#E2E8F0'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Arc */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="url(#donutGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              rotation="-90"
              origin={`${center}, ${center}`}
            />
            {/* Center Text */}
            <SvgText
              x={center}
              y={center - 3}
              textAnchor="middle"
              fontSize="20"
              fontWeight="800"
              fill={colors.text}
            >
              {`${validRate}%`}
            </SvgText>
            <SvgText
              x={center}
              y={center + 15}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill={colors.textMuted}
            >
              {isBangla ? 'সমাপ্তি হার' : 'Mastery'}
            </SvgText>
          </Svg>
        </View>

        {/* Legend / Metrics Summary */}
        <View style={styles.legendContainer}>
          <TouchableOpacity
            style={[
              styles.legendRow,
              activeCourseTab === 'in-progress' && {
                backgroundColor: colors.brandNavySubtle || 'rgba(16,47,83,0.06)',
              },
            ]}
            onPress={() => onSelectTab && onSelectTab('in-progress')}
            accessibilityRole="button"
            accessibilityLabel={
              isBangla
                ? `চলমান কোর্স: ${inProgressCount}`
                : `In Progress courses: ${inProgressCount}`
            }
          >
            <View style={[styles.legendDot, { backgroundColor: colors.brandNavy }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              {isBangla ? 'চলমান কোর্স' : 'In Progress'}:
            </Text>
            <Text style={[styles.legendValue, { color: colors.text }]}>{inProgressCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.legendRow,
              (activeCourseTab === 'passed' || activeCourseTab === 'finished') && {
                backgroundColor: colors.successLight,
              },
            ]}
            onPress={() => onSelectTab && onSelectTab('passed')}
            accessibilityRole="button"
            accessibilityLabel={
              isBangla ? `উত্তীর্ণ কোর্স: ${completedCount}` : `Passed courses: ${completedCount}`
            }
          >
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              {isBangla ? 'উত্তীর্ণ কোর্স' : 'Passed / Finished'}:
            </Text>
            <Text style={[styles.legendValue, { color: colors.success, fontWeight: '800' }]}>
              {completedCount}
            </Text>
          </TouchableOpacity>

          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              {isBangla ? 'লার্নিং সময়' : 'Total Hours'}:
            </Text>
            <Text style={[styles.legendValue, { color: colors.text }]}>{totalHours}h</Text>
          </View>

          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              {isBangla ? 'সার্টিফিকেট' : 'Certificates'}:
            </Text>
            <Text style={[styles.legendValue, { color: colors.accent }]}>{certificatesCount}</Text>
          </View>
        </View>
      </View>

      {/* Weekly Learning Activity Smooth Area Chart */}
      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
              {isBangla ? 'সাপ্তাহিক অধ্যয়নের গতি (Weekly Velocity)' : 'Weekly Study Velocity'}
            </Text>
            <Text style={[styles.activitySubtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {isBangla
                ? `${totalWeeklyHours} ঘণ্টা সম্পন্ন • লক্ষ্যমাত্রার শীর্ষে`
                : `${totalWeeklyHours} hrs logged • Consistent momentum`}
            </Text>
          </View>

          {/* Interactive Floating Tooltip Callout */}
          <View
            style={[
              styles.activeTooltipPill,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
            ]}
          >
            <View
              style={[
                styles.tooltipDot,
                { backgroundColor: activeDay.hours >= 2.0 ? colors.accent : colors.primary },
              ]}
            />
            <Text style={[styles.tooltipText, { color: colors.text }]}>
              {isBangla ? activeDay.dayBn : activeDay.day}:{' '}
              <Text style={{ fontWeight: '800', color: colors.primary }}>{activeDay.hours}h</Text>
            </Text>
          </View>
        </View>

        {/* Smooth SVG Area Chart */}
        <View style={styles.areaChartWrap}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.35} />
                <Stop offset="80%" stopColor={colors.primary} stopOpacity={0.05} />
                <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.0} />
              </LinearGradient>
            </Defs>

            {/* Subtle Horizontal Reference Grid Lines (0h, 1.5h, 3h) */}
            {[0, 0.5, 1].map((ratio, gIdx) => {
              const gridY = padTop + plotH * (1 - ratio);
              return (
                <Line
                  key={gIdx}
                  x1={padLeft}
                  y1={gridY}
                  x2={chartWidth - padRight}
                  y2={gridY}
                  stroke={colors.borderSubtle || '#E2E8F0'}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area Fill */}
            {areaPath ? <Path d={areaPath} fill="url(#areaGradient)" /> : null}

            {/* Top Spline Stroke */}
            {linePath ? (
              <Path
                d={linePath}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Data Point Vertices */}
            {points.map((pt, idx) => {
              const isSelected = idx === selectedDayIndex;
              const isToday = pt.isToday;
              return (
                <G key={idx}>
                  {isSelected && (
                    <Circle cx={pt.x} cy={pt.y} r={9} fill={colors.accent} fillOpacity={0.22} />
                  )}
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 5.5 : 3.5}
                    fill={
                      isToday ? colors.accent : isSelected ? colors.primary : colors.surfaceCard
                    }
                    stroke={isSelected ? colors.accent : colors.primary}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                </G>
              );
            })}
          </Svg>

          {/* Interactive Day Touch Target Row (Finger tap: >= 44x44 dp) */}
          <View style={styles.daysTouchRow}>
            {weeklyActivity.map((item, idx) => {
              const isSelected = idx === selectedDayIndex;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayPillBtn,
                    isSelected && {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.accent,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedDayIndex(idx);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.day}: ${item.hours} hours logged`}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      {
                        color: isSelected ? colors.primary : colors.textMuted,
                        fontWeight: isSelected || item.isToday ? '800' : '600',
                      },
                    ]}
                  >
                    {isBangla ? item.dayBn : item.day}
                  </Text>
                  {item.isToday && (
                    <View style={[styles.todayIndicatorDot, { backgroundColor: colors.accent }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* 4 Interactive KPI Cards at Bottom of Analytics */}
      <View style={styles.kpiRow}>
        <TouchableOpacity
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
            activeCourseTab === 'in-progress' && {
              borderColor: colors.primary,
              borderWidth: 1.5,
            },
          ]}
          onPress={() => onSelectTab && onSelectTab('in-progress')}
          accessibilityRole="button"
          accessibilityLabel={
            isBangla
              ? `চলমান কোর্স ফিল্টার: ${inProgressCount}`
              : `Filter in-progress courses: ${inProgressCount}`
          }
        >
          <Ionicons name="book-outline" size={17} color={colors.primary} />
          <Text style={[styles.kpiNumber, { color: colors.primary }]}>{inProgressCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
            {isBangla ? 'চলমান' : 'Enrolled'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
            (activeCourseTab === 'passed' || activeCourseTab === 'finished') && {
              borderColor: colors.success,
              borderWidth: 1.5,
            },
          ]}
          onPress={() => onSelectTab && onSelectTab('passed')}
          accessibilityRole="button"
          accessibilityLabel={
            isBangla
              ? `উত্তীর্ণ কোর্স ফিল্টার: ${completedCount}`
              : `Filter completed courses: ${completedCount}`
          }
        >
          <Ionicons name="school" size={17} color={colors.success} />
          <Text style={[styles.kpiNumber, { color: colors.success }]}>{completedCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
            {isBangla ? 'উত্তীর্ণ' : 'Passed'}
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
          ]}
        >
          <Ionicons name="time-outline" size={17} color={colors.primary} />
          <Text style={[styles.kpiNumber, { color: colors.primary }]}>{totalHours}h</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
            {isBangla ? 'ঘণ্টা' : 'Hours'}
          </Text>
        </View>

        <View
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
          ]}
        >
          <Ionicons name="ribbon-outline" size={17} color={colors.accent} />
          <Text style={[styles.kpiNumber, { color: colors.accent }]}>{certificatesCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
            {isBangla ? 'সনদপত্র' : 'Certificates'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#102F53',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  titleIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
    marginTop: 2,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
    marginLeft: 3,
  },
  chartBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  donutWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    flex: 1,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  activitySection: {
    marginBottom: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activitySubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  activeTooltipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    flexShrink: 0,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  areaChartWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  daysTouchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  dayPillBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    minHeight: 36,
  },
  dayPillText: {
    fontSize: 11,
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  kpiNumber: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
});
