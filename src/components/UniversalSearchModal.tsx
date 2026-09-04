import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useYouTube } from '../context/YouTubeContext';
import { SKILLS_SUMMITS } from '../data/mockData';
import { Course } from '../types';
import { YouTubeVideo } from '../data/youtubeVideos';

interface UniversalSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCourse: (courseId: string) => void;
  onSelectYouTubeVideo: (video: YouTubeVideo) => void;
  onSelectWorkshop: () => void;
}

type SearchFilterType = 'all' | 'courses' | 'youtube' | 'workshops';

type UnifiedSearchResult =
  | { type: 'course'; data: Course; id: string; title: string; subtitle: string; thumbnail?: string }
  | { type: 'youtube'; data: YouTubeVideo; id: string; title: string; subtitle: string; thumbnail?: string }
  | { type: 'workshop'; data: any; id: string; title: string; subtitle: string; thumbnail?: string };

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  visible,
  onClose,
  onSelectCourse,
  onSelectYouTubeVideo,
  onSelectWorkshop,
}) => {
  const { colors, isDark } = useTheme();
  const { courses } = useLearning();
  const { videos } = useYouTube();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');

  const filterTabs: { id: SearchFilterType; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'courses', label: 'Courses', icon: 'school-outline' },
    { id: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
    { id: 'workshops', label: 'Workshops', icon: 'videocam-outline' },
  ];

  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const results: UnifiedSearchResult[] = [];

    // Search Courses
    if (activeFilter === 'all' || activeFilter === 'courses') {
      courses.forEach((c) => {
        if (
          c.title.toLowerCase().includes(trimmed) ||
          c.subtitle.toLowerCase().includes(trimmed) ||
          c.instructor.name.toLowerCase().includes(trimmed) ||
          (c.category && c.category.toLowerCase().includes(trimmed))
        ) {
          results.push({
            type: 'course',
            id: `course-${c.id}`,
            data: c,
            title: c.title,
            subtitle: `${c.instructor.name} • ${c.durationHours}h • ${c.level}`,
            thumbnail: c.thumbnail,
          });
        }
      });
    }

    // Search YouTube Masterclasses
    if (activeFilter === 'all' || activeFilter === 'youtube') {
      videos.forEach((v) => {
        if (v.title.toLowerCase().includes(trimmed)) {
          results.push({
            type: 'youtube',
            id: `yt-${v.id}`,
            data: v,
            title: v.title,
            subtitle: `@ThrivingSkills • Masterclass Video`,
            thumbnail: v.thumbnail,
          });
        }
      });
    }

    // Search Summits / Workshops
    if (activeFilter === 'all' || activeFilter === 'workshops') {
      SKILLS_SUMMITS.forEach((s) => {
        if (
          s.title.toLowerCase().includes(trimmed) ||
          s.theme.toLowerCase().includes(trimmed) ||
          s.description.toLowerCase().includes(trimmed)
        ) {
          results.push({
            type: 'workshop',
            id: `summit-${s.id}`,
            data: s,
            title: s.title,
            subtitle: `${s.date} • ${s.theme}`,
            thumbnail: s.bannerImage,
          });
        }
      });
    }

    return results;
  }, [query, activeFilter, courses, videos]);

  const handleSelectItem = (item: UnifiedSearchResult) => {
    onClose();
    if (item.type === 'course') {
      onSelectCourse(item.data.id);
    } else if (item.type === 'youtube') {
      onSelectYouTubeVideo(item.data);
    } else if (item.type === 'workshop') {
      onSelectWorkshop();
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {/* Search Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search courses, YouTube masterclasses, summits..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelBtnText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveFilter(tab.id)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={13}
                  color={isSelected ? '#FFFFFF' : tab.id === 'youtube' ? '#FF0000' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Results List */}
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            query.trim().length > 0 ? (
              <Text style={[styles.resultsCountText, { color: colors.textMuted }]}>
                {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'} found
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.resultItem,
                { backgroundColor: colors.surfaceCard, borderColor: colors.border },
              ]}
              onPress={() => handleSelectItem(item)}
              activeOpacity={0.8}
            >
              {item.thumbnail ? (
                <View style={styles.thumbWrapper}>
                  <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
                  {item.type === 'youtube' && (
                    <View style={styles.ytBadge}>
                      <Ionicons name="play" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.fallbackThumb, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="school" size={20} color={colors.primary} />
                </View>
              )}

              <View style={styles.resultInfo}>
                <View style={styles.typeBadgeRow}>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          item.type === 'course'
                            ? 'rgba(5, 150, 105, 0.12)'
                            : item.type === 'youtube'
                            ? 'rgba(255, 0, 0, 0.1)'
                            : 'rgba(59, 130, 246, 0.12)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        {
                          color:
                            item.type === 'course'
                              ? '#059669'
                              : item.type === 'youtube'
                              ? '#FF0000'
                              : '#3B82F6',
                        },
                      ]}
                    >
                      {item.type === 'course'
                        ? 'ACCREDITED COURSE'
                        : item.type === 'youtube'
                        ? 'YOUTUBE MASTERCLASS'
                        : 'LIVE SUMMIT'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.resultSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={query.trim() ? 'search-outline' : 'sparkles-outline'}
                size={48}
                color={colors.textLight}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {query.trim() ? 'No results found' : 'Spotlight Search'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {query.trim()
                  ? `No content matching "${query}". Try searching for AI, Excel, Procurement, or Finance.`
                  : 'Search across accredited courses, free YouTube masterclasses, and national summits.'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  thumbWrapper: {
    width: 64,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ytBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: '#FF0000',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackThumb: {
    width: 64,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  typeBadgeRow: {
    marginBottom: 3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
