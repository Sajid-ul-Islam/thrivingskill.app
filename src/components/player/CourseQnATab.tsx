import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { getSafeImageSource } from '../../utils/imageUtils';

export interface QnAItem {
  id: string;
  courseId: string;
  authorName: string;
  authorAvatar: string;
  question: string;
  date: string;
  upvotes: number;
  hasUpvoted?: boolean;
  lessonReference?: string;
  answer?: {
    instructorName: string;
    instructorAvatar: string;
    answerText: string;
    date: string;
    isVerified: boolean;
  };
}

const INITIAL_QNA: QnAItem[] = [];
const QNA_STORAGE_PREFIX = '@thriving_skill_qna_';

const sanitizeQnAItem = (item: any): QnAItem | null => {
  if (!item || !item.id || !item.question) return null;
  // Discard legacy mock QnA items
  if (
    item.id === 'qna-1' ||
    item.id === 'qna-2' ||
    item.authorName === 'Tanvir Hossain' ||
    item.authorName === 'Nusrat Jahan' ||
    (typeof item.authorAvatar === 'string' && item.authorAvatar.includes('unsplash.com'))
  ) {
    return null;
  }
  return {
    ...item,
    authorAvatar:
      item.authorAvatar && !item.authorAvatar.includes('unsplash.com')
        ? item.authorAvatar
        : 'https://secure.gravatar.com/avatar/?d=mp&s=192',
    answer: item.answer
      ? {
          ...item.answer,
          instructorAvatar:
            item.answer.instructorAvatar && !item.answer.instructorAvatar.includes('unsplash.com')
              ? item.answer.instructorAvatar
              : 'https://secure.gravatar.com/avatar/?d=mp&s=300',
        }
      : undefined,
  };
};

interface CourseQnATabProps {
  courseId: string;
  currentLessonTitle?: string;
}

export const CourseQnATab: React.FC<CourseQnATabProps> = ({ courseId, currentLessonTitle }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showToast } = useFeedback();
  const { isBangla } = useLanguage();

  const [questions, setQuestions] = useState<QnAItem[]>(INITIAL_QNA);
  const [askModalVisible, setAskModalVisible] = useState<boolean>(false);
  const [newQuestionText, setNewQuestionText] = useState<string>('');

  // Load and sanitize course-specific questions from AsyncStorage
  useEffect(() => {
    let isMounted = true;
    const loadQnA = async () => {
      try {
        const stored = await AsyncStorage.getItem(`${QNA_STORAGE_PREFIX}${courseId}`);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const valid = parsed
              .map(sanitizeQnAItem)
              .filter((q): q is QnAItem => q !== null);
            setQuestions(valid);
            // Re-persist sanitized list if mock items were stripped
            if (valid.length !== parsed.length) {
              await AsyncStorage.setItem(`${QNA_STORAGE_PREFIX}${courseId}`, JSON.stringify(valid));
            }
          }
        }
      } catch {}
    };
    loadQnA();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const persistQuestions = async (updated: QnAItem[]) => {
    try {
      await AsyncStorage.setItem(`${QNA_STORAGE_PREFIX}${courseId}`, JSON.stringify(updated));
    } catch {}
  };

  const handleToggleUpvote = (id: string) => {
    triggerHaptic('selection');
    setQuestions((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const hasUpvoted = !item.hasUpvoted;
          return {
            ...item,
            hasUpvoted,
            upvotes: hasUpvoted ? item.upvotes + 1 : Math.max(0, item.upvotes - 1),
          };
        }
        return item;
      });
      persistQuestions(next);
      return next;
    });
  };

  const handlePostQuestion = () => {
    if (!newQuestionText.trim()) {
      triggerHaptic('warning');
      showToast({
        message: isBangla ? 'অনুগ্রহ করে প্রশ্ন লিখুন।' : 'Please write your question before submitting.',
        type: 'error',
      });
      return;
    }

    const defaultAvatar = 'https://secure.gravatar.com/avatar/?d=mp&s=192';
    const authorAvatar =
      user?.avatar && !user.avatar.includes('unsplash.com') ? user.avatar : defaultAvatar;

    const newQ: QnAItem = {
      id: `qna-user-${Date.now()}`,
      courseId,
      authorName: user?.displayName || user?.username || (isBangla ? 'লার্নার' : 'Active Learner'),
      authorAvatar,
      question: newQuestionText.trim(),
      date: isBangla ? 'এইমাত্র' : 'Just now',
      upvotes: 1,
      hasUpvoted: true,
      lessonReference: currentLessonTitle || (isBangla ? 'সাধারণ প্রশ্নোত্তর' : 'General Course Q&A'),
    };

    const nextList = [newQ, ...questions];
    setQuestions(nextList);
    persistQuestions(nextList);
    setNewQuestionText('');
    setAskModalVisible(false);
    triggerHaptic('success');
    showToast({
      message: isBangla ? 'প্রশ্ন সফলভাবে পোস্ট করা হয়েছে' : 'Question posted to instructor Q&A',
      type: 'success',
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Action Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleCol}>
          <Text style={[styles.heading, { color: colors.text }]} numberOfLines={1}>Discussion & Q&A</Text>
          <Text style={[styles.subheading, { color: colors.textMuted }]} numberOfLines={1}>
            {questions.length} questions answered by instructors
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.askBtn, { backgroundColor: colors.accent }]}
          onPress={() => setAskModalVisible(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Ask a question"
        >
          <Ionicons name="chatbubble-ellipses" size={16} color={colors.onAccent} style={{ marginRight: 6 }} />
          <Text style={[styles.askBtnText, { color: colors.onAccent }]}>Ask Question</Text>
        </TouchableOpacity>
      </View>

      {/* Questions Feed or Authentic Empty State */}
      {questions.length === 0 ? (
        <View
          style={[
            styles.emptyStateCard,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            {isBangla ? 'এখনও কোনো প্রশ্নোত্তর নেই' : 'No questions yet'}
          </Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textMuted }]}>
            {isBangla
              ? 'কোর্স বা কোনো লেকচার নিয়ে প্রশ্ন থাকলে প্রথম প্রশ্নটি আপনিই করুন।'
              : 'Have a question about this course or lecture? Ask your mentors and join the discussion!'}
          </Text>
          <TouchableOpacity
            style={[styles.emptyAskBtn, { backgroundColor: colors.accent }]}
            onPress={() => setAskModalVisible(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'প্রশ্ন করুন' : 'Ask Question'}
          >
            <Ionicons name="create-outline" size={16} color={colors.onAccent} style={{ marginRight: 6 }} />
            <Text style={[styles.askBtnText, { color: colors.onAccent }]}>
              {isBangla ? 'প্রথম প্রশ্নটি করুন' : 'Ask the First Question'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {questions.map((item) => {
            const authorImgUri =
              item.authorAvatar && !item.authorAvatar.includes('unsplash.com')
                ? item.authorAvatar
                : 'https://secure.gravatar.com/avatar/?d=mp&s=192';

            return (
              <View
                key={item.id}
                style={[
                  styles.qnaCard,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Student Header */}
                <View style={styles.authorRow}>
                  <Image
                    source={getSafeImageSource(authorImgUri)}
                    style={styles.authorAvatar}
                    {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
                  />
              <View style={styles.authorMeta}>
                <Text style={[styles.authorName, { color: colors.text }]}>{item.authorName}</Text>
                <Text style={[styles.questionDate, { color: colors.textMuted }]}>
                  {item.date} {item.lessonReference ? `• ${item.lessonReference}` : ''}
                </Text>
              </View>
              {/* Upvote Button */}
              <TouchableOpacity
                style={[
                  styles.upvoteBtn,
                  {
                    backgroundColor: item.hasUpvoted
                      ? isDark
                        ? 'rgba(59, 130, 246, 0.20)'
                        : '#EFF6FF'
                      : colors.surfaceSubtle,
                    borderColor: item.hasUpvoted ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => handleToggleUpvote(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Upvote question, current count: ${item.upvotes}`}
              >
                <Ionicons
                  name={item.hasUpvoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                  size={16}
                  color={item.hasUpvoted ? '#3B82F6' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.upvoteText,
                    { color: item.hasUpvoted ? '#3B82F6' : colors.textMuted },
                  ]}
                >
                  {item.upvotes}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Question Text */}
            <Text style={[styles.questionBody, { color: colors.text }]}>{item.question}</Text>

            {/* Instructor Answer */}
            {item.answer ? (
              <View
                style={[
                  styles.answerContainer,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.instructorHeaderRow}>
                  <Image
                    source={getSafeImageSource(
                      item.answer.instructorAvatar &&
                        !item.answer.instructorAvatar.includes('unsplash.com')
                        ? item.answer.instructorAvatar
                        : 'https://secure.gravatar.com/avatar/?d=mp&s=300'
                    )}
                    style={styles.instructorAvatar}
                    {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.verifiedRow}>
                      <Text style={[styles.instructorName, { color: colors.text }]}>
                        {item.answer.instructorName}
                      </Text>
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                        <Text style={styles.verifiedBadgeText}>Instructor</Text>
                      </View>
                    </View>
                    <Text style={[styles.answerDate, { color: colors.textMuted }]}>
                      {item.answer.date}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.answerText, { color: colors.text }]}>
                  {item.answer.answerText}
                </Text>
              </View>
            ) : (
              <View style={[styles.pendingAnswerBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.pendingText, { color: colors.textMuted }]}>
                  {isBangla
                    ? 'মেন্টরের উত্তর অপেক্ষমাণ। উত্তর দেওয়া হলে আপনি নোটিফিকেশন পাবেন।'
                    : 'Instructor review pending. You will receive a notification when answered.'}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  )}

      {/* Ask Question Modal */}
      <Modal
        visible={askModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setAskModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View
            style={[
              styles.askModalCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>Ask Course Instructor</Text>
                <TouchableOpacity
                  onPress={() => setAskModalVisible(false)}
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
                  accessibilityRole="button"
                  accessibilityLabel="Close Ask Instructor dialog"
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalHint, { color: colors.textMuted }]}>
                Be specific about what you are trying to solve. You can reference specific formulas, slides, or timestamps.
              </Text>

              <TextInput
                style={[
                  styles.questionInput,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. In lesson 2, how do we prevent Excel from auto-formatting date strings into serial numbers?"
                placeholderTextColor={colors.textMuted + '80'}
                multiline
                numberOfLines={4}
                value={newQuestionText}
                onChangeText={setNewQuestionText}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setAskModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel question"
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitQuestionBtn, { backgroundColor: colors.accent }]}
                  onPress={handlePostQuestion}
                  accessibilityRole="button"
                  accessibilityLabel="Submit question"
                >
                  <Text style={[styles.submitQuestionText, { color: colors.onAccent }]}>Submit Question</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
  },
  subheading: {
    fontSize: 12,
    marginTop: 2,
  },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
    flexShrink: 0,
  },
  askBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    gap: 14,
  },
  qnaCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    flexShrink: 0,
  },
  authorMeta: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  questionDate: {
    fontSize: 11,
    marginTop: 2,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    flexShrink: 0,
  },
  upvoteText: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionBody: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  answerContainer: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  instructorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  instructorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    flexShrink: 0,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  instructorName: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    flexShrink: 0,
  },
  verifiedBadgeText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '700',
  },
  answerDate: {
    fontSize: 10,
    marginTop: 1,
  },
  answerText: {
    fontSize: 13,
    lineHeight: 19,
  },
  pendingAnswerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  pendingText: {
    fontSize: 12,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  askModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderTopWidth: 1,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  questionInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitQuestionBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitQuestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyStateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 280,
  },
  emptyAskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
