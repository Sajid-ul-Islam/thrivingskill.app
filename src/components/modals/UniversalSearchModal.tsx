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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLearning } from '../../context/LearningContext';
import { useYouTube } from '../../context/YouTubeContext';
import { Course } from '../../types';
import { YouTubeVideo } from '../../data/youtubeVideos';
import { triggerHaptic } from '../../utils/haptics';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';

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
  const { isBangla } = useLanguage();
  const { courses, workshops, recordCategoryInteraction, recordSearchKeyword } = useLearning();
  const { videos } = useYouTube();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');

  const filterTabs: { id: SearchFilterType; label: string; icon: string }[] = [
    { id: 'all', label: isBangla ? 'সব' : 'All', icon: 'apps-outline' },
    { id: 'courses', label: isBangla ? 'কোর্স' : 'Courses', icon: 'school-outline' },
    { id: 'youtube', label: isBangla ? 'ইউটিউব' : 'YouTube', icon: 'logo-youtube' },
    { id: 'workshops', label: isBangla ? 'ওয়ার্কশপ' : 'Workshops', icon: 'videocam-outline' },
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

    // Search Real Live Workshops & Masterclasses
    if (activeFilter === 'all' || activeFilter === 'workshops') {
      workshops.forEach((w) => {
        if (
          w.title.toLowerCase().includes(trimmed) ||
          w.description.toLowerCase().includes(trimmed) ||
          w.speaker.name.toLowerCase().includes(trimmed)
        ) {
          results.push({
            type: 'workshop',
            id: `workshop-${w.id}`,
            data: w,
            title: w.title,
            subtitle: `${w.speaker.name} • ${w.duration} • ${w.date}`,
            thumbnail: w.thumbnail,
          });
        }
      });
    }

    return results;
  }, [query, activeFilter, courses, workshops, videos]);

  const handleSelectItem = (item: UnifiedSearchResult) => {
    onClose();
    if (query.trim()) {
      recordSearchKeyword(query);
    }
    if (item.type === 'course') {
      if (item.data.category) {
        recordCategoryInteraction(item.data.category);
      }
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
              placeholder={
                isBangla
                  ? 'কোর্স, ইউটিউব মাস্টারক্লাস, সামিট সার্চ করুন...'
                  : 'Search courses, YouTube masterclasses, summits...'
              }
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => {
                if (query.trim()) recordSearchKeyword(query);
              }}
              autoFocus
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  handleClear();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={isBangla ? 'সার্চ মুছুন' : 'Clear search query'}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              onClose();
            }}
            style={styles.cancelBtn}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'সার্চ বাতিল করুন' : 'Cancel search'}
          >
            <Text style={[styles.cancelBtnText, { color: colors.primary }]}>
              {isBangla ? 'বাতিল' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={[styles.filterBar, { borderBottomColor: colors.border }]} accessibilityRole="tablist">
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
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={
                  isBangla
                    ? `${tab.label} ফিল্টার`
                    : `Filter results by ${tab.label}`
                }
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveFilter(tab.id);
                }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={13}
                  color={isSelected ? colors.onPrimary : tab.id === 'youtube' ? '#FF0000' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? colors.onPrimary : colors.text,
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
                {isBangla
                  ? `${searchResults.length} টি ফলাফল পাওয়া গেছে`
                  : `${searchResults.length} ${searchResults.length === 1 ? 'match' : 'matches'} found`}
              </Text>
            ) : undefined
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
                        ? (isBangla ? 'অ্যাক্রেডিটেড কোর্স' : 'ACCREDITED COURSE')
                        : item.type === 'youtube'
                        ? (isBangla ? 'ইউটিউব মাস্টারক্লাস' : 'YOUTUBE MASTERCLASS')
                        : (isBangla ? 'লাইভ সামিট' : 'LIVE SUMMIT')}
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
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons
                  name={query.trim() ? 'search-outline' : 'trending-up'}
                  size={26}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {query.trim()
                  ? (isBangla ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found')
                  : (isBangla ? 'জনপ্রিয় বিজনেস ও এআই স্কিলস' : 'Trending Business & AI Skills')}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {query.trim()
                  ? (isBangla
                      ? `"${query}" এর সাথে মিলে এমন কিছু পাওয়া যায়নি। Agentic AI, Power BI বা Finance লিখে সার্চ করুন।`
                      : `No content matching "${query}". Try searching for Agentic AI, Power BI, or Finance.`)
                  : (isBangla
                      ? 'জনপ্রিয় মাস্টারক্লাসগুলো দেখতে নিচের স্কিলে ট্যাপ করুন:'
                      : 'Tap any high-demand skill below to discover accredited masterclasses:')}
              </Text>

              {!query.trim() && (
                <View style={styles.trendingPillsGrid}>
                  {(isBangla
                    ? [
                        { label: '🤖 এজেন্টিক এআই ও অটোমেশন', q: 'agentic' },
                        { label: '💼 বিজনেস লিডারদের জন্য এআই', q: 'ai' },
                        { label: '📊 পাওয়ার বিআই ও ডেটা স্টোরিটেলিং', q: 'power bi' },
                        { label: '📈 ফাইন্যান্সিয়াল মডেলিং ও ডিসিএফ', q: 'financial' },
                        { label: '🌱 ইএসজি ও সাসটেইনেবল স্ট্র্যাটেজি', q: 'esg' },
                        { label: '🚀 গ্রোথ ও পারফরম্যান্স মার্কেটিং', q: 'marketing' },
                      ]
                    : [
                        { label: '🤖 Agentic AI & Workflows', q: 'agentic' },
                        { label: '💼 AI for Business Leaders', q: 'ai' },
                        { label: '📊 Power BI & Storytelling', q: 'power bi' },
                        { label: '📈 Financial Modeling & DCF', q: 'financial' },
                        { label: '🌱 ESG & Sustainable Strategy', q: 'esg' },
                        { label: '🚀 Growth & Performance', q: 'marketing' },
                      ]
                  ).map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.trendingModalPill,
                        {
                          backgroundColor: colors.surfaceCard,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setQuery(item.q)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isBangla
                          ? `${item.label} টপিক সার্চ করুন`
                          : `Search for ${item.label}`
                      }
                    >
                      <Text style={[styles.trendingModalPillText, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      <Ionicons name="arrow-forward" size={13} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
    height: 44,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  cancelBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  cancelBtnText: {
    ...typography.button,
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
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    borderRadius: shape.medium,
    borderWidth: 1,
  },
  filterPillText: {
    ...typography.caption,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  resultsCountText: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: 6,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: shape.medium,
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
    marginBottom: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  trendingPillsGrid: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  trendingModalPill: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  trendingModalPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
