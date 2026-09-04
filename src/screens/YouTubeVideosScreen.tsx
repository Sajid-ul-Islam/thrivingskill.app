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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { YouTubeCard } from '../components/YouTubeCard';
import { YouTubePlayerModal } from '../components/YouTubePlayerModal';
import { YouTubeVideo, YOUTUBE_CHANNEL, YOUTUBE_VIDEOS } from '../data/youtubeVideos';

interface YouTubeVideosScreenProps {
  onBack: () => void;
}

type VideoCategory = 'all' | 'ai-tech' | 'business' | 'finance' | 'career';

export const YouTubeVideosScreen: React.FC<YouTubeVideosScreenProps> = ({ onBack }) => {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('all');
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'horizontal'>('card');

  const categories: { id: VideoCategory; label: string; icon: string }[] = [
    { id: 'all', label: `All (${YOUTUBE_VIDEOS.length})`, icon: 'apps-outline' },
    { id: 'ai-tech', label: 'AI & Analytics', icon: 'hardware-chip-outline' },
    { id: 'business', label: 'Business & Supply', icon: 'briefcase-outline' },
    { id: 'finance', label: 'Finance & Excel', icon: 'stats-chart-outline' },
    { id: 'career', label: 'Career & HR', icon: 'people-outline' },
  ];

  // Filter videos based on category and search query
  const filteredVideos = useMemo(() => {
    return YOUTUBE_VIDEOS.filter((video) => {
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
          titleLower.includes('contract');
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
  }, [searchQuery, selectedCategory]);

  const handleOpenChannel = () => {
    Linking.openURL(YOUTUBE_CHANNEL.url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.headerLogoRow}>
            <Ionicons name="logo-youtube" size={22} color="#FF0000" />
            <Text style={[styles.headerTitle, { color: colors.text }]}>YouTube Showcase</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{YOUTUBE_CHANNEL.handle}</Text>
        </View>

        <TouchableOpacity style={styles.subscribeBtn} onPress={handleOpenChannel}>
          <Text style={styles.subscribeBtnText}>Subscribe</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar & View Mode */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search all 30+ masterclass videos..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.viewToggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setViewMode(viewMode === 'card' ? 'horizontal' : 'card')}
        >
          <Ionicons
            name={viewMode === 'card' ? 'list-outline' : 'grid-outline'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <View style={styles.pillsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? '#102E52' : colors.surface,
                    borderColor: isSelected ? '#102E52' : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Video List */}
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.resultsInfoRow}>
            <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
              {filteredVideos.length} {filteredVideos.length === 1 ? 'Video' : 'Videos'} available
            </Text>
            <TouchableOpacity style={styles.ytChannelLink} onPress={handleOpenChannel}>
              <Ionicons name="open-outline" size={14} color="#FF0000" />
              <Text style={styles.ytChannelLinkText}>Open YouTube Channel</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <YouTubeCard
            video={item}
            layout={viewMode}
            onPress={(vid) => setActiveVideo(vid)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No videos found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Try searching with a different term or select another category.
            </Text>
          </View>
        }
      />

      {/* Embedded In-App Player Modal */}
      <YouTubePlayerModal
        visible={activeVideo !== null}
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
        onSelectVideo={(v) => setActiveVideo(v)}
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
    width: 42,
    height: 42,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
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
