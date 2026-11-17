import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFeedback } from '../../context/FeedbackContext';
import { triggerHaptic } from '../../utils/haptics';
import { OfflineManager, OfflineLessonData } from '../../services/offline/offlineManager';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface OfflineStudyDeckModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenLessonInPlayer?: (courseId: string, lessonId: string) => void;
}

export const OfflineStudyDeckModal: React.FC<OfflineStudyDeckModalProps> = ({
  visible,
  onClose,
  onOpenLessonInPlayer,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedback();

  const [groupedCourses, setGroupedCourses] = useState<
    { courseId: string; courseTitle: string; lessons: OfflineLessonData[] }[]
  >([]);
  const [selectedLesson, setSelectedLesson] = useState<OfflineLessonData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDownloadedLessons = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await OfflineManager.getDownloadedCoursesGrouped();
      setGroupedCourses(data);
    } catch {
      // Safe fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadDownloadedLessons();
      setSelectedLesson(null);
    }
  }, [visible, loadDownloadedLessons]);

  const handleDeleteLesson = async (lessonId: string) => {
    triggerHaptic('warning');
    await OfflineManager.removeDownloadedLesson(lessonId);
    showToast({ message: 'Removed lesson from offline deck', type: 'info' });
    if (selectedLesson?.lessonId === lessonId) {
      setSelectedLesson(null);
    }
    await loadDownloadedLessons();
  };

  const handleShareSummary = async (lesson: OfflineLessonData) => {
    try {
      await Share.share({
        title: lesson.title,
        message: `Thriving Skills Lecture Notes: ${lesson.title}\n\n${lesson.summary}\n\nKey Takeaways:\n${(lesson.takeaways || []).map((t) => `• ${t}`).join('\n')}`,
      });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            {selectedLesson ? (
              <TouchableOpacity
                onPress={() => setSelectedLesson(null)}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Back to offline courses list"
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : null}

            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedLesson ? selectedLesson.title : 'Offline Study Deck'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {selectedLesson
                  ? `${selectedLesson.courseTitle || 'Course Lesson'} • ${selectedLesson.duration}`
                  : 'Distraction-free offline lecture summaries & study guides'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' }]}
              accessibilityRole="button"
              accessibilityLabel="Close Offline Study Deck"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptySubtext, { color: colors.textMuted, marginTop: 12 }]}>
                Loading offline study deck...
              </Text>
            </View>
          ) : selectedLesson ? (
            /* Selected Lesson Detail Reader View */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.readerContent}>
              <View style={[styles.readerCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <View style={styles.badgeRow}>
                  <View style={[styles.downloadBadge, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={[styles.downloadBadgeText, { color: '#047857' }]}>Saved on Device</Text>
                  </View>
                  <Text style={[styles.durationText, { color: colors.textMuted }]}>{selectedLesson.duration}</Text>
                </View>

                <Text style={[styles.readerTitle, { color: colors.text }]}>{selectedLesson.title}</Text>
                <Text style={[styles.readerSummary, { color: colors.textMuted }]}>{selectedLesson.summary}</Text>

                {/* Key Takeaways */}
                {selectedLesson.takeaways && selectedLesson.takeaways.length > 0 && (
                  <View style={[styles.takeawaySection, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.takeawayHeader, { color: colors.primary }]}>Key Concepts & Takeaways</Text>
                    {selectedLesson.takeaways.map((point, idx) => (
                      <View key={idx} style={styles.takeawayRow}>
                        <Ionicons name="sparkles-outline" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                        <Text style={[styles.takeawayText, { color: colors.text }]}>{point}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Main Content Body */}
                <Text style={[styles.bodyHeader, { color: colors.text }]}>Study Guide</Text>
                <Text style={[styles.bodyText, { color: colors.text }]}>{selectedLesson.content}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {onOpenLessonInPlayer && (
                  <TouchableOpacity
                    style={[styles.playerBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      onOpenLessonInPlayer(selectedLesson.courseId, selectedLesson.lessonId);
                      onClose();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Open in Lesson Player"
                  >
                    <Ionicons name="play" size={18} color={colors.onPrimary} />
                    <Text style={[styles.btnText, { color: colors.onPrimary }]}>Open in Player</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: colors.border, backgroundColor: colors.surfaceCard }]}
                  onPress={() => handleShareSummary(selectedLesson)}
                  accessibilityRole="button"
                  accessibilityLabel="Share Lesson Summary"
                >
                  <Ionicons name="share-outline" size={18} color={colors.text} />
                  <Text style={[styles.btnText, { color: colors.text }]}>Share Notes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}
                  onPress={() => handleDeleteLesson(selectedLesson.lessonId)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove Download"
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : groupedCourses.length === 0 ? (
            /* Empty State */
            <View style={styles.centerContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="cloud-download-outline" size={44} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Offline Lessons Yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Tap the download button while watching any lecture in the course player to save study guides and read offline without internet.
              </Text>
            </View>
          ) : (
            /* Grouped Course Lessons List */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
              {groupedCourses.map((group) => (
                <View key={group.courseId} style={styles.courseGroup}>
                  <View style={styles.courseGroupHeader}>
                    <Ionicons name="book-outline" size={18} color={colors.primary} />
                    <Text style={[styles.courseGroupTitle, { color: colors.text }]} numberOfLines={1}>
                      {group.courseTitle}
                    </Text>
                    <Text style={[styles.courseLessonCount, { color: colors.textMuted }]}>
                      {group.lessons.length} {group.lessons.length === 1 ? 'lesson' : 'lessons'}
                    </Text>
                  </View>

                  <View style={[styles.lessonListCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                    {group.lessons.map((item, index) => (
                      <TouchableOpacity
                        key={item.lessonId}
                        style={[
                          styles.lessonRow,
                          index < group.lessons.length - 1 && { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 },
                        ]}
                        onPress={() => {
                          triggerHaptic('light');
                          setSelectedLesson(item);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Read offline lesson ${item.title}`}
                      >
                        <View style={[styles.lessonNumberCircle, { backgroundColor: colors.surfaceSubtle }]}>
                          <Text style={[styles.lessonNumber, { color: colors.text }]}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 10 }}>
                          <Text style={[styles.lessonRowTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={[styles.lessonRowDuration, { color: colors.textMuted }]}>{item.duration}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    height: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  backButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  courseGroup: {},
  courseGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  courseGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  courseLessonCount: {
    fontSize: 12,
  },
  lessonListCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: MIN_TOUCH_TARGET,
  },
  lessonNumberCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  lessonRowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  lessonRowDuration: {
    fontSize: 12,
    marginTop: 2,
  },
  readerContent: {
    padding: 16,
    gap: 14,
  },
  readerCard: {
    borderRadius: shape.large,
    borderWidth: 1,
    padding: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  downloadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: shape.extraSmall,
    flexShrink: 0,
  },
  downloadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  durationText: {
    fontSize: 12,
    flexShrink: 0,
  },
  readerTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  readerSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  takeawaySection: {
    marginTop: 16,
    borderRadius: shape.medium,
    padding: 14,
    gap: 8,
  },
  takeawayHeader: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  takeawayText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  bodyHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  playerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: shape.medium,
    minHeight: MIN_TOUCH_TARGET,
    gap: 6,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: shape.medium,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
    gap: 6,
  },
  deleteBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
