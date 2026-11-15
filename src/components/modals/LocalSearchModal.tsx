import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLearning } from '../../context/LearningContext';
import { triggerHaptic } from '../../utils/haptics';
import {
  LocalSearchEngine,
  SearchDocType,
  SearchResult,
} from '../../services/search/localSearchEngine';
import { LiteRtService } from '../../services/ai/liteRtService';
import { SpacedRepetitionService } from '../../services/study/spacedRepetitionService';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

interface LocalSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCourse?: (courseId: string) => void;
  onSelectLesson?: (courseId: string, lessonId: string) => void;
}

type FilterOption = 'all' | SearchDocType;

export const LocalSearchModal: React.FC<LocalSearchModalProps> = ({
  visible,
  onClose,
  onSelectCourse,
  onSelectLesson,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { courses, notes } = useLearning();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterOption>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSemanticActive, setIsSemanticActive] = useState<boolean>(LiteRtService.isSemanticEnabled());
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const handleToggleSemantic = async () => {
    triggerHaptic('selection');
    const next = !isSemanticActive;
    setIsSemanticActive(next);
    await LiteRtService.setSemanticSearchEnabled(next);
    if (query.trim()) {
      const res = LocalSearchEngine.search(
        query.trim(),
        filterType === 'all' ? undefined : filterType
      );
      setResults(res);
    }
  };

  // Rebuild the local index on modal open or when courses/notes change
  useEffect(() => {
    if (visible) {
      (async () => {
        const flashcards = await SpacedRepetitionService.getAllCards();
        LocalSearchEngine.rebuildIndex(courses, notes, flashcards);
        if (query.trim()) {
          const res = LocalSearchEngine.search(
            query.trim(),
            filterType === 'all' ? undefined : filterType
          );
          setResults(res);
        }
      })();
    }
  }, [visible, courses, notes]);

  const handleSearch = useCallback(
    (text: string, filter: FilterOption) => {
      setQuery(text);
      if (!text.trim()) {
        setResults([]);
        return;
      }
      const res = LocalSearchEngine.search(
        text.trim(),
        filter === 'all' ? undefined : filter
      );
      setResults(res);
    },
    []
  );

  const handleFilterChange = (filter: FilterOption) => {
    triggerHaptic('selection');
    setFilterType(filter);
    if (query.trim()) {
      const res = LocalSearchEngine.search(
        query.trim(),
        filter === 'all' ? undefined : filter
      );
      setResults(res);
    }
  };

  const handleSelectResult = (item: SearchResult) => {
    triggerHaptic('light');
    const { doc } = item;
    if (doc.type === 'course' && doc.courseId && onSelectCourse) {
      onSelectCourse(doc.courseId);
      onClose();
    } else if (doc.type === 'lesson' && doc.courseId && doc.lessonId && onSelectLesson) {
      onSelectLesson(doc.courseId, doc.lessonId);
      onClose();
    } else if (doc.type === 'note' && doc.courseId && doc.lessonId && onSelectLesson) {
      onSelectLesson(doc.courseId, doc.lessonId);
      onClose();
    } else if (doc.courseId && onSelectCourse) {
      onSelectCourse(doc.courseId);
      onClose();
    }
  };

  const getTypeColor = (type: SearchDocType) => {
    switch (type) {
      case 'course':
        return '#102F53';
      case 'lesson':
        return '#059669';
      case 'note':
        return '#D97706';
      case 'flashcard':
        return '#7C3AED';
    }
  };

  const getTypeIcon = (type: SearchDocType): any => {
    switch (type) {
      case 'course':
        return 'school-outline';
      case 'lesson':
        return 'play-circle-outline';
      case 'note':
        return 'document-text-outline';
      case 'flashcard':
        return 'sparkles-outline';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Top Bar with Search Input */}
          <View style={[styles.searchBarRow, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="search" size={20} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                ref={inputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search courses, lessons, notes & flashcards..."
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={(text) => handleSearch(text, filterType)}
                autoFocus
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSearch('', filterType)}
                  style={styles.clearBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search input"
                >
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { minHeight: MIN_TOUCH_TARGET }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
            >
              <Text style={[styles.cancelBtnText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Chips Bar */}
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity
                onPress={handleToggleSemantic}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSemanticActive ? (isDark ? '#3B0764' : '#EDE9FE') : colors.surfaceSubtle,
                    borderColor: isSemanticActive ? '#7C3AED' : colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Toggle AI Semantic Search"
              >
                <Ionicons
                  name="sparkles"
                  size={13}
                  color={isSemanticActive ? '#7C3AED' : colors.textMuted}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSemanticActive ? '#7C3AED' : colors.textMuted },
                    isSemanticActive && { fontWeight: '700' },
                  ]}
                >
                  {isSemanticActive ? 'AI Semantic: ON' : 'AI Semantic: OFF'}
                </Text>
              </TouchableOpacity>

              {[
                { id: 'all', label: 'All Results' },
                { id: 'course', label: 'Courses' },
                { id: 'lesson', label: 'Lessons' },
                { id: 'note', label: 'My Notes' },
                { id: 'flashcard', label: 'Flashcards' },
              ].map((f) => {
                const isSelected = filterType === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => handleFilterChange(f.id as FilterOption)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSelected ? colors.onPrimary : colors.textMuted },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Results List or Empty State */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.resultsContent}
          >
            {query.trim().length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="hardware-chip-outline" size={48} color={colors.primary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text, marginTop: 12 }]}>
                  On-Device Fast Search (FTS)
                </Text>
                <Text style={[styles.emptyStateDesc, { color: colors.textMuted }]}>
                  Instant offline inverted-index search across all courses, downloaded lessons, study summaries, and personal notes with sub-10ms response time.
                </Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="search-outline" size={44} color={colors.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: colors.text, marginTop: 12 }]}>
                  No Local Results Found
                </Text>
                <Text style={[styles.emptyStateDesc, { color: colors.textMuted }]}>
                  Try checking your spelling or selecting "All Results" to broaden your local search.
                </Text>
              </View>
            ) : (
              results.map((res) => {
                const color = getTypeColor(res.doc.type);
                const icon = getTypeIcon(res.doc.type);
                return (
                  <TouchableOpacity
                    key={res.doc.id}
                    style={[styles.resultCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                    onPress={() => handleSelectResult(res)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${res.doc.type}: ${res.doc.title}`}
                  >
                    <View style={styles.resultHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
                          <Ionicons name={icon} size={14} color={color} style={{ marginRight: 4 }} />
                          <Text style={[styles.typeBadgeText, { color }]}>{res.doc.type.toUpperCase()}</Text>
                        </View>
                        {res.isSemanticMatch && (
                          <View style={[styles.typeBadge, { backgroundColor: '#7C3AED20' }]}>
                            <Ionicons name="sparkles" size={11} color="#7C3AED" style={{ marginRight: 3 }} />
                            <Text style={[styles.typeBadgeText, { color: '#7C3AED' }]}>AI SEMANTIC</Text>
                          </View>
                        )}
                      </View>
                      {res.doc.badge ? (
                        <Text style={[styles.badgeText, { color: colors.textMuted }]} numberOfLines={1}>
                          {res.doc.badge}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>
                      {res.doc.title}
                    </Text>

                    <Text style={[styles.resultSnippet, { color: colors.textMuted }]} numberOfLines={2}>
                      {res.snippet}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  container: {
    flex: 1,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  cancelBtn: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultsContent: {
    padding: 16,
    gap: 12,
  },
  emptyStateContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyStateDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeText: {
    fontSize: 11,
    maxWidth: 160,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  resultSnippet: {
    fontSize: 12,
    lineHeight: 17,
  },
});
