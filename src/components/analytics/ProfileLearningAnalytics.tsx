import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../theme/colors';

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
  weeklyActivity?: WeeklyDayActivity[];
  colors: ThemeColors;
  isBangla: boolean;
  onSelectTab?: (tab: 'in-progress' | 'graduated' | 'all') => void;
  activeCourseTab?: 'in-progress' | 'graduated' | 'all';
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

  // Maximum hours for weekly bar scaling
  const maxHours = Math.max(...weeklyActivity.map((d) => d.hours), 3.5);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
      {/* Header with Title and Streak Pill */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.titleIconBg, { backgroundColor: colors.brandGoldSubtle || 'rgba(255, 182, 6, 0.15)' }]}>
            <Ionicons name="pie-chart" size={17} color={colors.brandGold || '#FFB606'} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              {isBangla ? 'লার্নিং অ্যানালিটিক্স ও দক্ষতা চার্ট' : 'Learning Analytics & Progress'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {isBangla ? 'আপনার কোর্স সমাপ্তি ও অধ্যয়নের গতিবিধি' : 'Track course completions & study momentum'}
            </Text>
          </View>
        </View>

        <View style={[styles.streakBadge, { backgroundColor: 'rgba(225, 29, 72, 0.1)' }]}>
          <Ionicons name="flame" size={14} color="#E11D48" />
          <Text style={styles.streakText}>
            {isBangla ? '৫ দিন স্ট্রিক' : '5-Day Streak'}
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
                <Stop offset="100%" stopColor={colors.brandGold} />
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
              activeCourseTab === 'in-progress' && { backgroundColor: colors.brandNavySubtle || 'rgba(16,47,83,0.06)' },
            ]}
            onPress={() => onSelectTab && onSelectTab('in-progress')}
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
              activeCourseTab === 'graduated' && { backgroundColor: colors.brandGoldSubtle || 'rgba(255,182,6,0.12)' },
            ]}
            onPress={() => onSelectTab && onSelectTab('graduated')}
          >
            <View style={[styles.legendDot, { backgroundColor: colors.brandGold }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              {isBangla ? 'উত্তীর্ণ কোর্স' : 'Graduated'}:
            </Text>
            <Text style={[styles.legendValue, { color: colors.brandGold, fontWeight: '800' }]}>
              {completedCount}
            </Text>
          </TouchableOpacity>

          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
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

      {/* Weekly Learning Activity Bar Chart */}
      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: colors.text }]}>
            {isBangla ? 'সাপ্তাহিক অধ্যয়নের গতি (Weekly Velocity)' : 'Weekly Learning Rhythm'}
          </Text>
          <Text style={[styles.activitySummary, { color: colors.primary }]}>
            {isBangla ? '১২.৮ ঘণ্টা সম্পন্ন' : '12.8 hrs logged'}
          </Text>
        </View>

        <View style={styles.barsContainer}>
          {weeklyActivity.map((item, index) => {
            const barHeight = Math.max((item.hours / maxHours) * 60, 6);
            const isHighlighted = item.isToday;

            return (
              <View key={index} style={styles.barColumn}>
                <Text style={[styles.barHoursText, { color: isHighlighted ? colors.brandGold : colors.textMuted }]}>
                  {item.hours > 0 ? `${item.hours}h` : '0'}
                </Text>

                <View style={[styles.barTrack, { backgroundColor: colors.borderSubtle || '#E2E8F0' }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        backgroundColor: isHighlighted ? colors.brandGold : colors.brandNavy,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[
                    styles.barDayText,
                    {
                      color: isHighlighted ? colors.brandNavy : colors.textMuted,
                      fontWeight: isHighlighted ? '800' : '500',
                    },
                  ]}
                >
                  {isBangla ? item.dayBn : item.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 4 Interactive KPI Cards at Bottom of Analytics */}
      <View style={styles.kpiRow}>
        <TouchableOpacity
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
            activeCourseTab === 'in-progress' && { borderColor: colors.brandNavy, borderWidth: 1.5 },
          ]}
          onPress={() => onSelectTab && onSelectTab('in-progress')}
        >
          <Ionicons name="book-outline" size={17} color={colors.brandNavy} />
          <Text style={[styles.kpiNumber, { color: colors.brandNavy }]}>{inProgressCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
            {isBangla ? 'চলমান' : 'Enrolled'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.kpiCard,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
            activeCourseTab === 'graduated' && { borderColor: colors.brandGold, borderWidth: 1.5 },
          ]}
          onPress={() => onSelectTab && onSelectTab('graduated')}
        >
          <Ionicons name="school" size={17} color={colors.brandGold} />
          <Text style={[styles.kpiNumber, { color: colors.brandGold }]}>{completedCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
            {isBangla ? 'উত্তীর্ণ' : 'Graduated'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.kpiCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
          <Ionicons name="time-outline" size={17} color="#10B981" />
          <Text style={[styles.kpiNumber, { color: '#10B981' }]}>{totalHours}h</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>
            {isBangla ? 'ঘণ্টা' : 'Hours'}
          </Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
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
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  activitySummary: {
    fontSize: 11,
    fontWeight: '700',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    width: 34,
  },
  barHoursText: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 60,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 10,
    marginTop: 6,
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
