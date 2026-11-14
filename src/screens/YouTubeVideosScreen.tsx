import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Linking,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useYouTube } from '../context/YouTubeContext';
import { YouTubeCard } from '../components/YouTubeCard';
import { StateView } from '../components/common';
import { YouTubeVideo, YOUTUBE_CHANNEL } from '../data/youtubeVideos';
import { shape } from '../theme/shapes';
import { MIN_TOUCH_TARGET } from '../theme/typography';

interface YouTubeVideosScreenProps {
  onBack: () => void;
  onNavigateToCourse?: (courseId: string) => void;
}

type VideoCategory = 'all' | 'saved' | 'ai-tech' | 'business' | 'finance' | 'career';

export const YouTubeVideosScreen: React.FC<YouTubeVideosScreenProps> = ({
  onBack,
  onNavigateToCourse,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { videos, savedVideos, isLoading, refreshVideos, playVideo } = useYouTube();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('all');
  const [viewMode, setViewMode] = useState<'card' | 'horizontal'>('card');

  const categories: { id: VideoCategory; label: string; icon: string; count?: number }[] = [
    { id: 'all', label: `${isBangla ? 'সব' : 'All'} (${videos.length})`, icon: 'apps-outline' },
    { id: 'saved', label: `${isBangla ? 'সংরক্ষিত' : 'Saved'} (${savedVideos.length})`, icon: 'bookmark-outline' },
    { id: 'ai-tech', label: isBangla ? 'এআই ও অ্যানালিটিক্স' : 'AI & Analytics', icon: 'hardware-chip-outline' },
    { id: 'business', label: isBangla ? 'বিজনেস ও সাপ্লাই' : 'Business & Supply', icon: 'briefcase-outline' },
    { id: 'finance', label: isBangla ? 'ফাইন্যান্স ও এক্সেল' : 'Finance & Excel', icon: 'stats-chart-outline' },
    { id: 'career', label: isBangla ? 'ক্যারিয়ার ও এইচআর' : 'Career & HR', icon: 'people-outline' },
  ];

  // Filter videos based on category and search query
  const filteredVideos = useMemo(() => {
    const sourceList = selectedCategory === 'saved' ? savedVideos : videos;

    return sourceList.filter((video) => {
      const titleLower = video.title.toLowerCase();

      // Search matching
      const matchesSearch =
        !searchQuery || titleLower.includes(searchQuery.trim().toLowerCase());

      // Category matching
      let matchesCat = true;
      if (selectedCategory === 'ai-tech') {
        matchesCat =
          titleLower.includes('ai') ||
          titleLower.includes('chatgpt') ||
          titleLower.includes('data') ||
          titleLower.includes('analytics') ||
          titleLower.includes('tech') ||
          titleLower.includes('python');
      } else if (selectedCategory === 'business') {
        matchesCat =
          titleLower.includes('procurement') ||
          titleLower.includes('supply') ||
          titleLower.includes('business') ||
          titleLower.includes('management') ||
          titleLower.includes('negotiation') ||
          titleLower.includes('contract') ||
          titleLower.includes('cotton');
      } else if (selectedCategory === 'finance') {
        matchesCat =
          titleLower.includes('financial') ||
          titleLower.includes('finance') ||
          titleLower.includes('excel') ||
          titleLower.includes('stock') ||
          titleLower.includes('accounting') ||
          titleLower.includes('tax') ||
          titleLower.includes('vat');
      } else if (selectedCategory === 'career') {
        matchesCat =
          titleLower.includes('career') ||
          titleLower.includes('hr') ||
          titleLower.includes('interview') ||
          titleLower.includes('resume') ||
          titleLower.includes('job') ||
          titleLower.includes('soft skill');
      }

      return matchesSearch && matchesCat;
    });
  }, [videos, savedVideos, searchQuery, selectedCategory]);

  const handleOpenChannel = () => {
    Linking.openURL(YOUTUBE_CHANNEL.url);
  };

  const handlePlay = (vid: YouTubeVideo) => {
    playVideo(vid, 'modal');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: topInset + 6,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'ফিরে যান' : 'Back'}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.headerLogoRow}>
            <Ionicons name="logo-youtube" size={22} color="#FF0000" />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isBangla ? 'ইউটিউব শোকেস' : 'YouTube Showcase'}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{YOUTUBE_CHANNEL.handle}</Text>
        </View>

        <TouchableOpacity
          style={styles.subscribeBtn}
          onPress={handleOpenChannel}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'ইউটিউবে সাবস্ক্রাইব করুন' : 'Subscribe on YouTube'}
        >
          <Text style={styles.subscribeBtnText}>{isBangla ? 'সাবস্ক্রাইব' : 'Subscribe'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar & View Mode Toggle */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={
              isBangla
                ? 'টপিক বা টুল দিয়ে মাস্টারক্লাস খুঁজুন...'
                : 'Search masterclasses by topic or tool...'
            }
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'সার্চ মুছুন' : 'Clear search'}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.viewToggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setViewMode(viewMode === 'card' ? 'horizontal' : 'card')}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'ভিউ পরিবর্তন করুন' : 'Toggle list/grid view'}
        >
          <Ionicons
            name={viewMode === 'card' ? 'list-outline' : 'grid-outline'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Category Pills (user-controlled static scroll) */}
      <View style={styles.pillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
          accessibilityRole="tablist"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={isBangla ? `${cat.label} ক্যাটাগরি` : `Filter by ${cat.label}`}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? colors.onPrimary : cat.id === 'saved' && savedVideos.length > 0 ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? colors.onPrimary : colors.text, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Video List with Pull-to-Refresh (Live RSS Sync) */}
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshVideos}
            tintColor={colors.primary}
            colors={['#FF0000', colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.resultsInfoRow}>
            <View style={styles.syncStatusRow}>
              <View style={styles.liveDot} />
              <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
                {isBangla
                  ? `${filteredVideos.length} টি ভিডিও • লাইভ সিঙ্ক করতে নিচে টানুন`
                  : `${filteredVideos.length} ${filteredVideos.length === 1 ? 'Video' : 'Videos'} • Pull down to sync RSS`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.ytChannelLink}
              onPress={handleOpenChannel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'থ্রাইভিং স্কিলস ইউটিউব চ্যানেল খুলুন' : 'Open Thriving Skills YouTube channel'}
            >
              <Ionicons name="open-outline" size={16} color={colors.danger} />
              <Text style={[styles.ytChannelLinkText, { color: colors.danger }]}>
                {isBangla ? 'ইউটিউব চ্যানেল' : 'YouTube Channel'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <YouTubeCard
            video={item}
            layout={viewMode}
            onPress={handlePlay}
          />
        )}
        ListEmptyComponent={
          <StateView
            mode="empty"
            icon={selectedCategory === 'saved' ? 'bookmark-outline' : 'videocam-off-outline'}
            title={
              selectedCategory === 'saved'
                ? (isBangla ? 'কোনো সংরক্ষিত ভিডিও নেই' : 'No saved videos yet')
                : (isBangla ? 'কোনো ভিডিও পাওয়া যায়নি' : 'No videos found')
            }
            message={
              selectedCategory === 'saved'
                ? (isBangla
                    ? 'পরে দেখার জন্য আপনার পছন্দের মাস্টারক্লাসগুলো বুকমার্ক করে রাখুন।'
                    : 'Bookmark masterclasses to save them to your watch later list.')
                : (isBangla
                    ? 'ভিন্ন কোনো শব্দ লিখে সার্চ করুন অথবা অন্য ক্যাটাগরি বেছে নিন।'
                    : 'Try searching with a different term or select another category.')
            }
            primaryActionLabel={
              selectedCategory !== 'all' || searchQuery
                ? (isBangla ? 'সকল ভিডিও দেখুন' : 'Show All Videos')
                : (isBangla ? 'ভিডিও সিঙ্ক করুন' : 'Sync Videos')
            }
            onPrimaryAction={() => {
              if (selectedCategory !== 'all' || searchQuery) {
                setSelectedCategory('all');
                setSearchQuery('');
              } else {
                refreshVideos();
              }
            }}
          />
        }
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  subscribeBtn: {
    backgroundColor: '#CC0000',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  viewToggleBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsContainer: {
    paddingVertical: 10,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: shape.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  resultsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  ytChannelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ytChannelLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF0000',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
