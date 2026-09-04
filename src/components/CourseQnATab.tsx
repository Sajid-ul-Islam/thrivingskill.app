import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

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

const INITIAL_QNA: QnAItem[] = [
  {
    id: 'qna-1',
    courseId: 'default',
    authorName: 'Tanvir Hossain',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    question:
      'When using XLOOKUP across multiple sheets, what is the best practice to handle #N/A errors if an employee ID is missing?',
    date: '2 days ago',
    upvotes: 24,
    hasUpvoted: false,
    lessonReference: 'Module 1 • Modern Lookup Formulas',
    answer: {
      instructorName: 'Humaira Sharim',
      instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300',
      answerText:
        'Great question Tanvir! XLOOKUP has a built-in 4th argument `if_not_found`. Instead of wrapping with `IFERROR`, pass `"ID Not Found"` directly: `=XLOOKUP(A2, Sheet2!A:A, Sheet2!B:B, "ID Not Found")`. This is much cleaner and faster!',
      date: '1 day ago',
      isVerified: true,
    },
  },
  {
    id: 'qna-2',
    courseId: 'default',
    authorName: 'Nusrat Jahan',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    question:
      'Can we export the fine-tuned system prompt template from the Generative AI workspace directly into production APIs?',
    date: '3 days ago',
    upvotes: 16,
    hasUpvoted: false,
    lessonReference: 'Module 3 • System Prompt Architecture',
    answer: {
      instructorName: 'Lead AI Engineer',
      instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
      answerText:
        'Yes! You can copy the exact XML tags from lesson 3.4. We recommend keeping the temperature under 0.2 and including few-shot examples for structured JSON output.',
      date: '2 days ago',
      isVerified: true,
    },
  },
];

interface CourseQnATabProps {
  courseId: string;
  currentLessonTitle?: string;
}

export const CourseQnATab: React.FC<CourseQnATabProps> = ({ courseId, currentLessonTitle }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<QnAItem[]>(INITIAL_QNA);
  const [askModalVisible, setAskModalVisible] = useState<boolean>(false);
  const [newQuestionText, setNewQuestionText] = useState<string>('');

  const handleToggleUpvote = (id: string) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const hasUpvoted = !item.hasUpvoted;
          return {
            ...item,
            hasUpvoted,
            upvotes: hasUpvoted ? item.upvotes + 1 : item.upvotes - 1,
          };
        }
        return item;
      })
    );
  };

  const handlePostQuestion = () => {
    if (!newQuestionText.trim()) {
      Alert.alert('Empty Inquiry', 'Please write your question before submitting.');
      return;
    }

    const newQ: QnAItem = {
      id: `qna-user-${Date.now()}`,
      courseId,
      authorName: user?.displayName || 'Active Learner',
      authorAvatar:
        user?.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
      question: newQuestionText.trim(),
      date: 'Just now',
      upvotes: 1,
      hasUpvoted: true,
      lessonReference: currentLessonTitle || 'General Course Q&A',
    };

    setQuestions([newQ, ...questions]);
    setNewQuestionText('');
    setAskModalVisible(false);
    Alert.alert('Question Posted! 🚀', 'Your question has been sent to the instructor and discussion forum.');
  };

  return (
    <View style={styles.container}>
      {/* Top Action Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.heading, { color: colors.text }]}>Discussion & Q&A</Text>
          <Text style={[styles.subheading, { color: colors.textMuted }]}>
            {questions.length} questions answered by instructors
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.askBtn, { backgroundColor: colors.accent }]}
          onPress={() => setAskModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.askBtnText}>Ask Question</Text>
        </TouchableOpacity>
      </View>

      {/* Questions Feed */}
      <View style={styles.listContainer}>
        {questions.map((item) => (
          <View
            key={item.id}
            style={[
              styles.qnaCard,
              {
                backgroundColor: isDark ? '#14223B' : '#FFFFFF',
                borderColor: isDark ? '#22365A' : '#E2E8F0',
              },
            ]}
          >
            {/* Student Header */}
            <View style={styles.authorRow}>
              <Image source={{ uri: item.authorAvatar }} style={styles.authorAvatar} />
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
                        ? '#1E3A8A'
                        : '#EFF6FF'
                      : isDark
                      ? '#1B2B4A'
                      : '#F1F5F9',
                    borderColor: item.hasUpvoted ? '#3B82F6' : 'transparent',
                  },
                ]}
                onPress={() => handleToggleUpvote(item.id)}
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
                    backgroundColor: isDark ? '#0F192C' : '#F8FAFC',
                    borderColor: isDark ? '#1E2F4C' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.instructorHeaderRow}>
                  <Image
                    source={{ uri: item.answer.instructorAvatar }}
                    style={styles.instructorAvatar}
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
                <Text style={[styles.answerText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  {item.answer.answerText}
                </Text>
              </View>
            ) : (
              <View style={[styles.pendingAnswerBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.pendingText, { color: colors.textMuted }]}>
                  Instructor review pending. You will receive a notification when answered.
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Ask Question Modal */}
      <Modal visible={askModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.askModalCard,
              {
                backgroundColor: isDark ? '#14223B' : '#FFFFFF',
                borderColor: isDark ? '#22365A' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Ask Course Instructor</Text>
              <TouchableOpacity onPress={() => setAskModalVisible(false)} style={styles.closeBtn}>
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
                  backgroundColor: isDark ? '#0F192C' : '#F8FAFC',
                  borderColor: isDark ? '#22365A' : '#E2E8F0',
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
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitQuestionBtn, { backgroundColor: colors.accent }]}
                onPress={handlePostQuestion}
              >
                <Text style={styles.submitQuestionText}>Submit Question</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  authorMeta: {
    flex: 1,
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
  },
  instructorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  verifiedBadgeText: {
    color: '#10B981',
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
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
});
