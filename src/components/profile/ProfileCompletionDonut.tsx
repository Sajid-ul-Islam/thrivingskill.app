import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UserProfile } from '../../services/api/userService';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import { triggerHaptic } from '../../utils/haptics';

interface ProfileCompletionDonutProps {
  user: UserProfile | null | undefined;
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  onPress: () => void;
  style?: ViewStyle;
  isWide?: boolean;
}

export const ProfileCompletionDonut: React.FC<ProfileCompletionDonutProps> = ({
  user,
  colors,
  isDark,
  isBangla,
  onPress,
  style,
  isWide = false,
}) => {
  const completion = calculateProfileCompletion(user);
  const { percentage, strengthLevel, strengthLabel, strengthLabelBn, nextAction, isComplete } = completion;

  // Donut geometry
  const size = isWide ? 66 : 56;
  const strokeWidth = isWide ? 6.5 : 5.5;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(percentage, 2) / 100) * circumference;

  // Dynamic theme colors
  const trackColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 47, 83, 0.08)';
  const gradientStart = isComplete ? '#10B981' : (colors.primary || '#102F53');
  const gradientEnd = isComplete ? '#059669' : '#E34234';

  const strengthBadgeColor = isComplete
    ? '#10B981'
    : strengthLevel === 'advanced'
    ? '#3B82F6'
    : '#E34234';

  const handlePress = () => {
    triggerHaptic('light');
    onPress();
  };

  const currentLabel = isBangla ? strengthLabelBn : strengthLabel;
  const actionText = nextAction
    ? (isBangla ? nextAction.actionTextBn : nextAction.actionText)
    : (isBangla ? 'সম্পূর্ণ প্রোফাইল' : 'Profile Complete');

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isWide ? styles.containerWide : styles.containerCompact,
        {
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : 'rgba(248, 250, 252, 0.95)',
          borderColor: isComplete
            ? 'rgba(16, 185, 129, 0.35)'
            : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)'),
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Profile completion ${percentage} percent, status ${currentLabel}. Tap to edit.`}
    >
      {/* SVG Donut Ring */}
      <View style={[styles.donutWrap, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="profileDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientStart} />
              <Stop offset="100%" stopColor={gradientEnd} />
            </LinearGradient>
          </Defs>
          {/* Background Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#profileDonutGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        </Svg>

        {/* Center Percentage & Status */}
        <View style={styles.centerTextOverlay}>
          <Text
            style={[
              styles.percentageText,
              { color: colors.text, fontSize: isWide ? 15 : 13 },
            ]}
          >
            {`${percentage}%`}
          </Text>
          {isComplete ? (
            <Ionicons name="checkmark-circle" size={11} color="#10B981" style={styles.completeIcon} />
          ) : (
            <Text
              style={[
                styles.strengthSubText,
                { color: colors.textMuted, fontSize: isWide ? 8 : 7 },
              ]}
              numberOfLines={1}
            >
              {isBangla ? 'সক্ষমতা' : 'Strength'}
            </Text>
          )}
        </View>
      </View>

      {/* Extended Information Column (Always on wide, or compact badge on narrow) */}
      {isWide ? (
        <View style={styles.detailsColumn}>
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isBangla ? 'প্রোফাইল সক্ষমতা' : 'Profile Strength'}
            </Text>
            <View style={[styles.levelBadge, { backgroundColor: `${strengthBadgeColor}18` }]}>
              <Ionicons
                name={isComplete ? 'shield-checkmark' : 'sparkles'}
                size={11}
                color={strengthBadgeColor}
              />
              <Text style={[styles.levelBadgeText, { color: strengthBadgeColor }]}>
                {currentLabel}
              </Text>
            </View>
          </View>

          <Text style={[styles.guidanceText, { color: colors.textMuted }]} numberOfLines={2}>
            {isComplete
              ? (isBangla ? 'আপনার প্রোফাইল সম্পূর্ণরূপে সক্রিয় ও যাচাইকৃত।' : 'All profile fields completed & verified.')
              : (isBangla
                  ? 'সার্টিফিকেট ও সম্পূর্ণ ফিচারের জন্য তথ্য পূরণ করুন।'
                  : 'Complete all details for full learning certification.')}
          </Text>

          {!isComplete && (
            <View style={[styles.actionNudgePill, { backgroundColor: 'rgba(227, 66, 52, 0.12)' }]}>
              <Ionicons name="add-circle" size={12} color="#E34234" />
              <Text style={[styles.actionNudgeText, { color: '#E34234' }]} numberOfLines={1}>
                {actionText}
              </Text>
              <Ionicons name="chevron-forward" size={11} color="#E34234" />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.compactLabelWrap}>
          <View style={[styles.compactLevelBadge, { backgroundColor: `${strengthBadgeColor}15` }]}>
            <Text style={[styles.compactLevelText, { color: strengthBadgeColor }]} numberOfLines={1}>
              {currentLabel}
            </Text>
          </View>
          {!isComplete && nextAction && (
            <Text style={[styles.compactNudgeText, { color: '#E34234' }]} numberOfLines={1}>
              {actionText}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  containerCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 84,
    maxWidth: 104,
    minHeight: 88,
  },
  containerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flex: 1,
    maxWidth: 320,
    gap: 12,
  },
  donutWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 18,
  },
  completeIcon: {
    marginTop: 1,
  },
  strengthSubText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  guidanceText: {
    fontSize: 10.5,
    lineHeight: 14,
    marginBottom: 6,
  },
  actionNudgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    gap: 4,
  },
  actionNudgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  compactLabelWrap: {
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  compactLevelBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 2,
  },
  compactLevelText: {
    fontSize: 9,
    fontWeight: '800',
  },
  compactNudgeText: {
    fontSize: 8.5,
    fontWeight: '700',
  },
});
