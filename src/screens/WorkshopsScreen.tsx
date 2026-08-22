import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { LiveWorkshopCard } from '../components/LiveWorkshopCard';
import { SummitCard } from '../components/SummitCard';
import { WORKSHOPS, SKILLS_SUMMITS } from '../data/mockData';

interface WorkshopsScreenProps {
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
}

type TabType = 'all' | 'summits' | 'live-classes';

export const WorkshopsScreen: React.FC<WorkshopsScreenProps> = ({
  onOpenSubscription,
  onOpenNotifications,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Live Masterclasses & Summits"
        subtitle="সাপ্তাহিক লাইভ ট্রেনিং ও ন্যাশনাল স্কিল সামিট"
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
            <Text style={[styles.bannerTitle, { color: colors.text }]}>Real-Time Executive Learning</Text>
            <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
              সাপ্তাহিক লাইভ সেশন, রিয়েল-টাইম প্রবলেম সলভিং এবং বাংলাদেশ স্কিল সামিটে সরাসরি অংশ নিন।
            </Text>
          </View>
        </View>

        {/* Tab Pills */}
        <View style={styles.filterRow}>
          {[
            { id: 'all', label: `All Events (${WORKSHOPS.length + SKILLS_SUMMITS.length})` },
            { id: 'live-classes', label: `Live Classes (${WORKSHOPS.length})` },
            { id: 'summits', label: `Skills Summits (${SKILLS_SUMMITS.length})` },
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
                onPress={() => setActiveTab(tab.id as TabType)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive ? '#FFFFFF' : colors.text,
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

        {/* Live Cohort Classes */}
        {(activeTab === 'all' || activeTab === 'live-classes') && (
          <View style={styles.listContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
              সাপ্তাহিক লাইভ মাস্টারক্লাস
            </Text>
            {WORKSHOPS.map((workshop) => (
              <LiveWorkshopCard
                key={workshop.id}
                workshop={workshop}
                onPress={() => {}}
              />
            ))}
          </View>
        )}

        {/* National Skills Summits */}
        {(activeTab === 'all' || activeTab === 'summits') && (
          <View style={styles.listContainer}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
              National Skills Summits & 4IR Conferences
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bannerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
});
