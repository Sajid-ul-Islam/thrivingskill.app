import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Linking, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLearning } from '../context/LearningContext';
import { useFeedback } from '../context/FeedbackContext';
import { Header } from '../components/Header';
import { LiveWorkshopCard } from '../components/LiveWorkshopCard';
import { SummitCard } from '../components/SummitCard';
import { StateView, CourseCardSkeleton } from '../components/common';
import { triggerHaptic } from '../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../theme/typography';
import { shape } from '../theme/shapes';
import { Workshop } from '../types';

interface WorkshopsScreenProps {
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
  onOpenDrawer?: () => void;
  onOpenSupport?: () => void;
}

type TabType = 'all' | 'summits' | 'live-classes';

export const WorkshopsScreen: React.FC<WorkshopsScreenProps> = ({
  onOpenSubscription,
  onOpenNotifications,
  onOpenDrawer,
  onOpenSupport,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const insets = useSafeAreaInsets();
  const { workshops, isLoadingCourses, coursesError, refreshCourses } = useLearning();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 8 && !isScrolled) {
      setIsScrolled(true);
    } else if (offsetY <= 8 && isScrolled) {
      setIsScrolled(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    triggerHaptic('light');
    try {
      await refreshCourses();
      showToast({
        message: isBangla ? 'লাইভ ইভেন্ট তালিকা আপডেট হয়েছে' : 'Live events schedule refreshed',
        type: 'info',
      });
    } catch {
      showToast({
        message: isBangla ? 'ইভেন্ট রিফ্রেশ করতে সমস্যা হয়েছে' : 'Failed to refresh events',
        type: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Partition real live courses between cohort workshops and summits (memoized)
  const summits = useMemo(() => workshops.filter(
    (w) =>
      w.title.toLowerCase().includes('summit') ||
      w.category === '4ir_skills_summit' ||
      w.category === 'blockchain-summit'
  ), [workshops]);

  const liveClasses = useMemo(() => workshops.filter(
    (w) =>
      !w.title.toLowerCase().includes('summit') &&
      w.category !== '4ir_skills_summit' &&
      w.category !== 'blockchain-summit'
  ), [workshops]);

  const displayedWorkshops: Workshop[] = useMemo(() => {
    if (activeTab === 'all') return workshops;
    if (activeTab === 'live-classes') return liveClasses;
    return summits;
  }, [activeTab, workshops, liveClasses, summits]);

  const hasVisibleEvents = displayedWorkshops.length > 0;
  const liveWorkshopNow = useMemo(() => workshops.find((w) => !!w.isLive), [workshops]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={isBangla ? 'লাইভ ক্লাস ও সামিট' : 'Live Class & Summits'}
        subtitle={isBangla ? 'সরাসরি লাইভ ক্লাস ও ন্যাশনাল স্কিল সামিট' : 'Upcoming live sessions & skill summits'}
        isScrolled={isScrolled}
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
        onOpenSupport={onOpenSupport}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || (isLoadingCourses && workshops.length > 0)}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}
      >
        {/* Real-Time Live Broadcast Hero Card */}
        {liveWorkshopNow && (
          <View
            style={[
              styles.liveHeroCard,
              { backgroundColor: isDark ? '#1F1315' : '#FEF2F2', borderColor: '#DC2626' },
            ]}
          >
            <View style={styles.liveHeroHeader}>
              <View style={styles.liveBadgeRow}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveBadgeText}>
                  {isBangla ? 'এখন সরাসরি সম্প্রচার চলছে' : '🔴 STREAMING LIVE NOW'}
                </Text>
              </View>
              {liveWorkshopNow.liveViewerCount && (
                <View style={styles.liveViewersTag}>
                  <Ionicons name="eye" size={12} color="#DC2626" />
                  <Text style={styles.liveViewersText}>
                    {liveWorkshopNow.liveViewerCount} {isBangla ? 'জন লাইভে' : 'Watching'}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.liveHeroTitle, { color: colors.text }]} numberOfLines={2}>
              {liveWorkshopNow.title}
            </Text>

            <Text style={[styles.liveHeroSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
              {liveWorkshopNow.description}
            </Text>

            <View style={styles.liveHeroMetaRow}>
              <View style={styles.liveMetaItem}>
                <Ionicons name="person-circle-outline" size={15} color={colors.primary} />
                <Text style={[styles.liveMetaText, { color: colors.text }]}>
                  {liveWorkshopNow.speaker.name}
                </Text>
              </View>
              <View style={styles.liveMetaItem}>
                <Ionicons name="time-outline" size={15} color={colors.primary} />
                <Text style={[styles.liveMetaText, { color: colors.text }]}>
                  {liveWorkshopNow.time}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.liveHeroEnterBtn}
              onPress={async () => {
                triggerHaptic('medium');
                const rawUrl = (liveWorkshopNow.joinUrl || 'https://thrivingskill.com/live-room').trim();
                const isSafe = /^https?:\/\//i.test(rawUrl) || /^zoom(?:us|mtg):\/\//i.test(rawUrl);
                if (!isSafe) {
                  showToast({ message: 'Invalid live room link', type: 'error' });
                  return;
                }
                try {
                  showToast({
                    message: isBangla ? 'লাইভ ক্লাসরুমে যুক্ত করা হচ্ছে...' : 'Entering live classroom...',
                    type: 'info',
                  });
                  await Linking.openURL(rawUrl);
                } catch {
                  showToast({ message: 'Unable to open live link', type: 'error' });
                }
              }}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`Enter live classroom for ${liveWorkshopNow.title}`}
            >
              <Ionicons name="radio" size={17} color="#FFFFFF" />
              <Text style={styles.liveHeroEnterBtnText}>
                {isBangla ? 'সরাসরি লাইভ ক্লাসরুমে প্রবেশ করুন' : 'Enter Live Classroom'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
        {/* Banner */}
        <View
          style={[
            styles.banner,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          <View style={[styles.bannerIconBg, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="videocam" size={24} color={colors.primary} />
          </View>
          <View style={styles.bannerCol}>
            <Text style={[styles.bannerTitle, { color: colors.text }]}>
              {isBangla ? 'রিয়েল-টাইম এক্সিকিউটিভ লার্নিং' : 'Real-Time Executive Learning'}
            </Text>
            <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
              {isBangla
                ? 'সাপ্তাহিক লাইভ সেশন, রিয়েল-টাইম প্রবলেম সলভিং এবং বাংলাদেশ স্কিল সামিটে সরাসরি অংশ নিন।'
                : 'Join weekly live masterclasses, real-time Q&A clinics, and national leadership summits.'}
            </Text>
          </View>
        </View>

        {/* Tab Pills (Hick's Law: 3 focused filters, stationary and user-controlled) */}
        <View style={styles.filterRow} accessibilityRole="tablist">
          {[
            {
              id: 'all' as TabType,
              label: isBangla
                ? `সকল ইভেন্ট (${workshops.length})`
                : `All Events (${workshops.length})`,
            },
            {
              id: 'live-classes' as TabType,
              label: isBangla ? `লাইভ ক্লাস (${liveClasses.length})` : `Live Class (${liveClasses.length})`,
            },
            {
              id: 'summits' as TabType,
              label: isBangla ? `সামিট (${summits.length})` : `Summit (${summits.length})`,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surfaceCard,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveTab(tab.id);
                }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive ? colors.onPrimary : colors.text,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading Skeletons */}
        {isLoadingCourses && workshops.length === 0 && (
          <View style={styles.listContainer}>
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </View>
        )}

        {/* Error State */}
        {!isLoadingCourses && coursesError && workshops.length === 0 && (
          <View style={styles.listContainer}>
            <StateView
              mode="error"
              title={isBangla ? 'লাইভ ইভেন্ট লোড করা যায়নি' : 'Could not load live events'}
              message={coursesError}
              primaryActionLabel={isBangla ? 'আবার চেষ্টা করুন' : 'Retry'}
              onPrimaryAction={handleRefresh}
            />
          </View>
        )}

        {/* Empty State */}
        {!isLoadingCourses && !coursesError && !hasVisibleEvents && (
          <View style={styles.listContainer}>
            <StateView
              mode="empty"
              title={
                activeTab === 'summits'
                  ? (isBangla ? 'বর্তমানে কোনো সামিট নির্ধারিত নেই' : 'No summits currently scheduled')
                  : (isBangla ? 'এই ক্যাটাগরিতে কোনো লাইভ ইভেন্ট নেই' : 'No upcoming events in this category')
              }
              message={
                activeTab === 'summits'
                  ? (isBangla
                      ? 'বাংলাদেশ স্কিল সামিটের পরবর্তী রাউন্ডের রেজিস্ট্রেশন শীঘ্রই শুরু হবে।'
                      : 'Registrations for the next Bangladesh Skills Summit will open soon.')
                  : (isBangla
                      ? 'সকল আসন্ন লাইভ মাস্টারক্লাস দেখতে "সকল ইভেন্ট" ট্যাবে সুইচ করুন।'
                      : 'Switch back to All Events to view scheduled masterclasses.')
              }
              primaryActionLabel={activeTab !== 'all' ? (isBangla ? 'সকল ইভেন্ট দেখুন' : 'Show All Events') : undefined}
              onPrimaryAction={activeTab !== 'all' ? () => setActiveTab('all') : undefined}
            />
          </View>
        )}

        {/* Render Real Workshops */}
        {displayedWorkshops.map((workshop) => (
          <View key={workshop.id} style={styles.cardWrapper}>
            <LiveWorkshopCard workshop={workshop} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  liveHeroCard: {
    padding: 16,
    borderRadius: shape.large,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  liveHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  liveViewersTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveViewersText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  liveHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  liveHeroSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 12,
  },
  liveHeroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  liveMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  liveHeroEnterBtn: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: '#DC2626',
    borderRadius: shape.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    elevation: 2,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  liveHeroEnterBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: shape.large,
    borderWidth: 1,
    marginBottom: 16,
    gap: 14,
  },
  bannerIconBg: {
    width: 48,
    height: 48,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCol: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: 4,
  },
  bannerSub: {
    ...typography.caption,
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillText: {
    fontSize: 13,
  },
  listContainer: {
    marginTop: 8,
    gap: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
});
