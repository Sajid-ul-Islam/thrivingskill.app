import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';
import { Header } from '../components/Header';
import { LiveWorkshopCard } from '../components/LiveWorkshopCard';
import { SummitCard } from '../components/SummitCard';
import { StateView } from '../components/common';
import { WORKSHOPS, SKILLS_SUMMITS } from '../data/mockData';
import { triggerHaptic } from '../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../theme/typography';
import { shape } from '../theme/shapes';

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
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    triggerHaptic('light');
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      setRefreshing(false);
      showToast({
        message: isBangla ? 'লাইভ ইভেন্ট তালিকা আপডেট হয়েছে' : 'Live events schedule refreshed',
        type: 'info',
      });
    }, 450);
  };

  const hasVisibleEvents =
    (activeTab === 'all' && WORKSHOPS.length + SKILLS_SUMMITS.length > 0) ||
    (activeTab === 'live-classes' && WORKSHOPS.length > 0) ||
    (activeTab === 'summits' && SKILLS_SUMMITS.length > 0);

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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
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

        {/* Tab Pills (Hick's Law: 3 focused filters) */}
        <View style={styles.filterRow} accessibilityRole="tablist">
          {[
            {
              id: 'all' as TabType,
              label: isBangla
                ? `সকল ইভেন্ট (${WORKSHOPS.length + SKILLS_SUMMITS.length})`
                : `All Events (${WORKSHOPS.length + SKILLS_SUMMITS.length})`,
            },
            {
              id: 'live-classes' as TabType,
              label: isBangla ? `লাইভ ক্লাস (${WORKSHOPS.length})` : `Live Classes (${WORKSHOPS.length})`,
            },
            {
              id: 'summits' as TabType,
              label: isBangla ? `স্কিল সামিট (${SKILLS_SUMMITS.length})` : `Skills Summits (${SKILLS_SUMMITS.length})`,
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

        {!hasVisibleEvents && (
          <View style={styles.listContainer}>
            <StateView
              mode="empty"
              title={isBangla ? 'এই ক্যাটাগরিতে কোনো ইভেন্ট নেই' : 'No events in this filter'}
              message={isBangla ? 'সকল আসন্ন লাইভ সেশন দেখতে ফিল্টার পরিবর্তন করুন।' : 'Switch back to All Events to view upcoming workshops.'}
              primaryActionLabel={isBangla ? 'সকল ইভেন্ট দেখুন' : 'Show All Events'}
              onPrimaryAction={() => setActiveTab('all')}
            />
          </View>
        )}

        {/* Live Cohort Classes */}
        {(activeTab === 'all' || activeTab === 'live-classes') && (
          <View style={styles.listContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
              {isBangla ? 'সাপ্তাহিক লাইভ মাস্টারক্লাস' : 'Weekly Live Masterclasses'}
            </Text>
            {WORKSHOPS.map((workshop) => (
              <LiveWorkshopCard
                key={workshop.id}
                workshop={workshop}
              />
            ))}
          </View>
        )}

        {/* National Skills Summits */}
        {(activeTab === 'all' || activeTab === 'summits') && (
          <View style={styles.listContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
              {isBangla ? 'ন্যাশনাল স্কিল সামিট ও 4IR কনফারেন্স' : 'National Skills Summits & 4IR Conferences'}
            </Text>
            {SKILLS_SUMMITS.map((summit) => (
              <SummitCard key={summit.id} summit={summit} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  banner: {
    margin: 16,
    borderRadius: shape.large,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bannerIconBg: {
    width: 48,
    height: 48,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCol: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.h5,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSub: {
    ...typography.caption,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: shape.full,
    borderWidth: 1,
  },
  filterPillText: {
    ...typography.caption,
  },
  listContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    ...typography.h4,
    marginBottom: 12,
  },
});
