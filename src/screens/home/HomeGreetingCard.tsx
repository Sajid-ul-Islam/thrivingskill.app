import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Platform, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { SpringPressable, CircularProgressRing } from '../../components';
import { triggerHaptic } from '../../utils/haptics';
import { getSafeImageSource } from '../../utils/imageUtils';
import { RootTab } from '../../types';
import { homeStyles as styles } from './homeStyles';

interface HomeGreetingCardProps {
  colors: any;
  isDark: boolean;
  isTablet: boolean;
  isBangla: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  user: any;
  avatarError: boolean;
  setAvatarError: (err: boolean) => void;
  setAuthModalVisible: (v: boolean) => void;
  subscriptionTier: string;
  streakDays: number;
  dailyMinutesSpent: number;
  dailyTargetMinutes: number;
  currentGoalPercent: number;
  isGoalAchieved: boolean;
  greetingInfo: { salutation: string; icon: any; iconColor: string };
  learnerDisplayName: string;
  greetingSubtitleText: string;
  onNavigateTab: (tab: RootTab) => void;
}

export const HomeGreetingCard: React.FC<HomeGreetingCardProps> = ({
  colors,
  isDark,
  isTablet,
  isBangla,
  isAuthenticated,
  isGuest,
  user,
  avatarError,
  setAvatarError,
  setAuthModalVisible,
  subscriptionTier,
  streakDays,
  dailyMinutesSpent,
  dailyTargetMinutes,
  currentGoalPercent,
  isGoalAchieved,
  greetingInfo,
  learnerDisplayName,
  greetingSubtitleText,
  onNavigateTab,
}) => {
  const handleProfileOrAuthPress = () => {
    triggerHaptic('light');
    if (isGuest && !isAuthenticated) {
      setAuthModalVisible(true);
    } else {
      onNavigateTab('Profile');
    }
  };

  const renderAvatar = () => (
    <SpringPressable
      style={styles.avatarWrap}
      onPress={handleProfileOrAuthPress}
      accessibilityRole="button"
      accessibilityLabel={isBangla ? 'প্রোফাইল ওপেন করুন' : 'Open profile'}
      haptic="light"
      activeScale={0.92}
    >
      {user?.avatar && !avatarError ? (
        <Image
          source={getSafeImageSource(user.avatar)}
          style={styles.learnerAvatar}
          onError={() => setAvatarError(true)}
          {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
        />
      ) : (
        <View
          style={[
            styles.learnerAvatar,
            styles.avatarInitialsCircle,
            { backgroundColor: colors.primary, borderColor: colors.primaryLight },
          ]}
        >
          <Text style={styles.avatarInitialsText}>
            {(user?.name || user?.username || (isAuthenticated ? 'Student' : 'Learner'))
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.avatarOnlineDot,
          {
            backgroundColor: isAuthenticated ? colors.success : colors.accent,
            borderColor: isDark ? colors.surfaceCard : '#FFFFFF',
          },
        ]}
      />
    </SpringPressable>
  );

  const renderProBadge = () =>
    subscriptionTier === 'pro' || subscriptionTier === 'enterprise' ? (
      <View
        style={[
          styles.proBadge,
          { backgroundColor: isDark ? 'rgba(227, 66, 52, 0.16)' : '#FEE2E2' },
        ]}
      >
        <Ionicons name="star" size={10} color="#E34234" />
        <Text style={[styles.proBadgeText, { color: '#E34234' }]}>
          {subscriptionTier.toUpperCase()}
        </Text>
      </View>
    ) : null;

  const showGoalAlert = (title: string) => {
    triggerHaptic('light');
    Alert.alert(
      title,
      `${isBangla ? '• টানা স্ট্রিক' : '• Streak'}: ${streakDays} ${isBangla ? 'দিন' : 'Days'} 🔥\n` +
        `${isBangla ? '• আজকের স্টাডি' : '• Today'}: ${dailyMinutesSpent}m / ${dailyTargetMinutes}m (${currentGoalPercent}% ${isBangla ? 'সম্পন্ন' : 'completed'})\n\n` +
        (isGoalAchieved
          ? isBangla
            ? 'অভিনন্দন! আজকের লক্ষ্য অর্জিত হয়েছে 🎉'
            : "Awesome! You hit today's learning goal 🎉"
          : isBangla
            ? `আর মাত্র ${Math.max(0, dailyTargetMinutes - dailyMinutesSpent)} মিনিট স্টাডি করলেই আজকের লক্ষ্য সম্পন্ন!`
            : `Only ${Math.max(0, dailyTargetMinutes - dailyMinutesSpent)} minutes left to complete today's goal!`),
      [
        {
          text: isBangla ? 'মাই হাব দেখুন' : 'View My Hub',
          onPress: () => onNavigateTab('MyLearning'),
        },
        { text: isBangla ? 'ঠিক আছে' : 'Got it', style: 'cancel' },
      ]
    );
  };

  return (
    <View
      style={[
        styles.greetingCard,
        { backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF', borderColor: colors.border },
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ['rgba(99, 102, 241, 0.12)', 'rgba(16, 185, 129, 0.04)', 'transparent']
            : ['rgba(99, 102, 241, 0.06)', 'rgba(16, 185, 129, 0.03)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {isTablet ? (
        <View style={styles.tabletDashboardContainer}>
          <View style={styles.tabletProfileCol}>
            {renderAvatar()}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.tabletProfileTextCol}
              onPress={handleProfileOrAuthPress}
              accessibilityRole="button"
              accessibilityLabel={`${greetingInfo.salutation}, ${learnerDisplayName}`}
            >
              <View style={styles.salutationRow}>
                <Ionicons name={greetingInfo.icon} size={14} color={greetingInfo.iconColor} />
                <Text style={[styles.salutationText, { color: colors.textMuted }]}>
                  {greetingInfo.salutation}
                </Text>
                {renderProBadge()}
              </View>
              <Text style={[styles.tabletGreetingTitle, { color: colors.text }]} numberOfLines={1}>
                {learnerDisplayName} 👋
              </Text>
              <Text
                style={[styles.tabletGreetingSubtitle, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {greetingSubtitleText}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.tabletDivider, { backgroundColor: colors.border }]} />

          <SpringPressable
            style={[
              styles.tabletWidgetPill,
              {
                backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              showGoalAlert(isBangla ? 'দৈনিক লার্নিং মোমেন্টাম 🔥' : 'Learning Momentum 🔥')
            }
            accessibilityRole="button"
            accessibilityLabel={
              isBangla
                ? `দৈনিক স্ট্রিক ${streakDays} দিন, আজকের স্টাডি ${dailyMinutesSpent} মিনিট`
                : `Daily streak ${streakDays} days, today study ${dailyMinutesSpent} minutes`
            }
            haptic="selection"
            activeScale={0.95}
          >
            <View style={styles.tabletWidgetIconCircle}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.tabletWidgetTitle, { color: '#F97316' }]} numberOfLines={1}>
                {streakDays} {isBangla ? 'দিন স্ট্রিক' : 'Days Streak'}
              </Text>
              <Text style={[styles.tabletWidgetSub, { color: colors.textMuted }]} numberOfLines={1}>
                {dailyMinutesSpent}m {isBangla ? 'আজকের স্টাডি' : 'studied today'}
              </Text>
            </View>
          </SpringPressable>

          <View style={[styles.tabletDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={[
              styles.tabletWidgetPill,
              {
                backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.85}
            onPress={() =>
              showGoalAlert(isBangla ? 'দৈনিক লক্ষ্য ও মোমেন্টাম 🎯' : 'Daily Study Goal 🎯')
            }
            accessibilityRole="button"
            accessibilityLabel={`Daily Goal: ${dailyMinutesSpent} of ${dailyTargetMinutes} minutes completed`}
          >
            <CircularProgressRing
              progress={currentGoalPercent}
              size={36}
              strokeWidth={3.5}
              trackColor={isDark ? colors.border : '#E2E8F0'}
              progressColor={isGoalAchieved ? colors.success : colors.accent}
              showText={false}
              centerContent={
                <Text
                  style={[
                    styles.radialCenterIcon,
                    {
                      color: isGoalAchieved ? colors.success : colors.accent,
                      fontSize: 10,
                    },
                  ]}
                >
                  {isGoalAchieved ? '✓' : '⚡'}
                </Text>
              }
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.tabletWidgetTitle, { color: colors.text }]} numberOfLines={1}>
                {dailyMinutesSpent}/{dailyTargetMinutes}m ({currentGoalPercent}%)
              </Text>
              <Text style={[styles.tabletWidgetSub, { color: colors.textMuted }]} numberOfLines={1}>
                {isBangla ? 'দৈনিক লক্ষ্য' : 'Daily Goal'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.greetingTopRow}>
            {renderAvatar()}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.greetingTextCol}
              onPress={handleProfileOrAuthPress}
              accessibilityRole="button"
              accessibilityLabel={`${greetingInfo.salutation}, ${learnerDisplayName}`}
            >
              <View style={styles.salutationRow}>
                <Ionicons name={greetingInfo.icon} size={13} color={greetingInfo.iconColor} />
                <Text style={[styles.salutationText, { color: colors.textMuted }]}>
                  {greetingInfo.salutation}
                </Text>
                {renderProBadge()}
              </View>
              <Text style={[styles.greetingTitle, { color: colors.text }]} numberOfLines={1}>
                {learnerDisplayName} 👋
              </Text>
            </TouchableOpacity>

            <SpringPressable
              style={[
                styles.momentumCapsule,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              onPress={() =>
                showGoalAlert(
                  isBangla ? 'দৈনিক লার্নিং মোমেন্টাম ও লক্ষ্য 🎯' : 'Learning Momentum & Goal 🎯'
                )
              }
              accessibilityRole="button"
              accessibilityLabel={
                isBangla
                  ? `দৈনিক স্ট্রিক ${streakDays} দিন, আজকের স্টাডি ${dailyMinutesSpent} মিনিট`
                  : `Daily streak ${streakDays} days, today study ${dailyMinutesSpent} minutes`
              }
              haptic="selection"
              activeScale={0.94}
            >
              <View style={styles.momentumItem}>
                <Text style={styles.flameEmoji}>🔥</Text>
                <Text style={[styles.momentumValue, { color: '#F97316' }]}>{streakDays}d</Text>
              </View>
              <View style={[styles.momentumDivider, { backgroundColor: colors.border }]} />
              <View style={styles.momentumItem}>
                <CircularProgressRing
                  progress={currentGoalPercent}
                  size={20}
                  strokeWidth={2.4}
                  trackColor={isDark ? colors.border : '#E2E8F0'}
                  progressColor={isGoalAchieved ? colors.success : colors.accent}
                  showText={false}
                  centerContent={
                    <Text
                      style={[
                        styles.radialCenterIcon,
                        {
                          color: isGoalAchieved ? colors.success : colors.accent,
                          fontSize: 7.5,
                        },
                      ]}
                    >
                      {isGoalAchieved ? '✓' : '⚡'}
                    </Text>
                  }
                />
                <Text style={[styles.momentumValue, { color: colors.primary }]}>
                  {dailyMinutesSpent}m
                </Text>
              </View>
            </SpringPressable>
          </View>

          <View style={styles.greetingBottomRow}>
            <Text style={[styles.greetingSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {greetingSubtitleText}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};
