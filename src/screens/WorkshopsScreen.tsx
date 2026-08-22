import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { LiveWorkshopCard } from '../components/LiveWorkshopCard';
import { WORKSHOPS } from '../data/mockData';
import { CategoryId } from '../types';

export const WorkshopsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');

  const filteredWorkshops = WORKSHOPS.filter(
    (w) => selectedCategory === 'all' || w.category === selectedCategory
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Live Masterclasses" subtitle="Interactive Live Bootcamps & Clinics" />

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
            <Text style={[styles.bannerTitle, { color: colors.text }]}>Real-Time Learning</Text>
            <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
              Join live instructor-led cohort sessions with real-time Q&A, hands-on labs, and
              breakout discussions.
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'ai-tech', label: 'AI & Automation' },
            { id: 'finance', label: 'Finance & Valuation' },
            { id: 'hr', label: 'People Analytics' },
          ].map((tab) => {
            const isActive = selectedCategory === tab.id;
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
                onPress={() => setSelectedCategory(tab.id as CategoryId)}
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

        {/* Workshop Cards */}
        <View style={styles.listContainer}>
          {filteredWorkshops.map((workshop) => (
            <LiveWorkshopCard
              key={workshop.id}
              workshop={workshop}
              onPress={() => {}}
            />
          ))}
        </View>
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
    fontSize: 16,
    fontWeight: '700',
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
  },
});
