import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
}

type TabType = 'all' | 'summits' | 'live-classes';

export const WorkshopsScreen: React.FC<WorkshopsScreenProps> = ({
  onOpenSubscription,
  onOpenNotifications,
  onOpenDrawer,
}) => {
  const { colors } = useTheme();
  const { isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const insets = useSafeAreaInsets();
  const { workshops, isLoadingCourses, coursesError, refreshCourses } = useLearning();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);

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

  // Partition real live courses between cohort workshops and summits
  const summits = workshops.filter(
    (w) =>
      w.title.toLowerCase().includes('summit') ||
      w.category === '4ir_skills_summit' ||
      w.category === 'blockchain-summit'
  );
  const liveClasses = workshops.filter(
    (w) =>
      !w.title.toLowerCase().includes('summit') &&
      w.category !== '4ir_skills_summit' &&
      w.category !== 'blockchain-summit'
  );

  const displayedWorkshops: Workshop[] =
    activeTab === 'all'
      ? workshops
      : activeTab === 'live-classes'
      ? liveClasses
      : summits;

  const hasVisibleEvents = displayedWorkshops.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={isBangla ? 'লাইভ মাস্টারক্লাস ও সামিট' : 'Live Masterclasses & Summits'}
        subtitle={isBangla ? 'সাপ্তাহিক লাইভ ট্রেনিং ও ন্যাশনাল স্কিল সামিট' : 'Weekly executive sessions & skill summits'}
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || (isLoadingCourses && workshops.length > 0)}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}
      >
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
              label: isBangla ? `লাইভ ক্লাস (${liveClasses.length})` : `Live Classes (${liveClasses.length})`,
            },
            {
              id: 'summits' as TabType,
              label: isBangla ? `স্কিল সামিট (${summits.length})` : `Skills Summits (${summits.length})`,
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
