import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useGamification } from '../../context/GamificationContext';
import { LessonsService } from '../../services/api/lessonsService';
import { cleanHtml } from '../../services/api/transformers';
import { getDomainQuestionsForCourse } from '../../data/domainQuizBank';
import { triggerHaptic } from '../../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

export interface QuizItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizPlayerModalProps {
  visible: boolean;
  courseTitle: string;
  courseCategory?: string;
  quizId?: string | number;
  questions?: QuizItem[];
  onClose: () => void;
  onPassed?: () => void;
}

export const QuizPlayerModal: React.FC<QuizPlayerModalProps> = ({
  visible,
  courseTitle,
  courseCategory,
  quizId,
  questions: propQuestions,
  onClose,
  onPassed,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, isBangla } = useLanguage();
  const { unlockBadge, triggerCelebration } = useGamification();

  const [activeQuestions, setActiveQuestions] = useState<QuizItem[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);
  const [isLiveLearnPressQuiz, setIsLiveLearnPressQuiz] = useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize and load quiz questions
  useEffect(() => {
    let isMounted = true;

    if (!visible) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setTimeLeft(120);

    // 1. If explicit questions are supplied, use them immediately
    if (propQuestions && propQuestions.length > 0) {
      setActiveQuestions(propQuestions);
      setIsLiveLearnPressQuiz(false);
      setIsLoadingQuiz(false);
      return;
    }

    // 2. If quizId is provided, attempt to fetch live LearnPress quiz
    if (quizId) {
      setIsLoadingQuiz(true);
      LessonsService.getQuiz(quizId)
        .then((raw) => {
          if (!isMounted) return;
          let parsed: QuizItem[] = [];

          const rawList = Array.isArray(raw?.questions)
            ? raw.questions
            : Array.isArray(raw?.items)
            ? raw.items
            : Array.isArray(raw)
            ? raw
            : [];

          if (rawList.length > 0) {
            parsed = rawList.map((q: any, idx: number) => {
              const qText = cleanHtml(q.title || q.name || q.question || `Question ${idx + 1}`);
              let opts: string[] = [];
              let cIndex = 0;

              if (Array.isArray(q.options)) {
                opts = q.options.map((o: any) =>
                  cleanHtml(typeof o === 'string' ? o : o.title || o.text || o.value || '')
                );
                const matchIdx = q.options.findIndex(
                  (o: any) =>
                    o.is_true === 'yes' ||
                    o.is_true === true ||
                    o.is_true === '1' ||
                    o.correct === 1 ||
                    o.correct === true
                );
                if (matchIdx >= 0) cIndex = matchIdx;
              } else if (Array.isArray(q.answers)) {
                opts = q.answers.map((a: any) =>
                  cleanHtml(typeof a === 'string' ? a : a.title || a.text || a.value || '')
                );
                const matchIdx = q.answers.findIndex(
                  (a: any) =>
                    a.is_true === 'yes' ||
                    a.is_true === true ||
                    a.is_true === '1' ||
                    a.correct === 1 ||
                    a.correct === true
                );
                if (matchIdx >= 0) cIndex = matchIdx;
              }

              return {
                id: String(q.id || `lp-q-${idx}`),
                question: qText,
                options: opts.length >= 2 ? opts : [isBangla ? 'সঠিক' : 'True', isBangla ? 'ভুল' : 'False'],
                correctIndex: cIndex,
                explanation: cleanHtml(
                  q.explanation ||
                    q.hint ||
                    (isBangla
                      ? 'সম্পূর্ণ ধারণা পরিষ্কারের জন্য সংশ্লিষ্ট লেকচারটি পুনরায় দেখুন।'
                      : 'Review the course lecture for comprehensive theoretical rationale.')
                ),
              };
            });
          }

          if (parsed.length > 0) {
            setActiveQuestions(parsed);
            setIsLiveLearnPressQuiz(true);
          } else {
            // Fallback to domain-tailored questions for this specific course
            const fallback = getDomainQuestionsForCourse(courseTitle, courseCategory, isBangla);
            setActiveQuestions(fallback);
            setIsLiveLearnPressQuiz(false);
          }
          setIsLoadingQuiz(false);
        })
        .catch(() => {
          if (!isMounted) return;
          // Fallback seamlessly to domain questions on 401 or network error
          const fallback = getDomainQuestionsForCourse(courseTitle, courseCategory, isBangla);
          setActiveQuestions(fallback);
          setIsLiveLearnPressQuiz(false);
          setIsLoadingQuiz(false);
        });
    } else {
      // 3. Fallback to domain-tailored course questions
      const fallback = getDomainQuestionsForCourse(courseTitle, courseCategory, isBangla);
      setActiveQuestions(fallback);
      setIsLiveLearnPressQuiz(false);
      setIsLoadingQuiz(false);
    }

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, quizId, courseTitle, courseCategory, isBangla, propQuestions]);

  // Countdown timer with proper unmount hygiene
  useEffect(() => {
    if (visible && !isSubmitted && !isLoadingQuiz && activeQuestions.length > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [visible, isSubmitted, isLoadingQuiz, activeQuestions.length]);

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    triggerHaptic('selection');
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const calculateScore = () => {
    if (!activeQuestions || activeQuestions.length === 0) return 0;
    let correct = 0;
    activeQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return Math.round((correct / activeQuestions.length) * 100);
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsSubmitted(true);
    const score = calculateScore();
    if (score >= 70) {
      unlockBadge('quiz_master');
      triggerCelebration({
        title: isBangla ? 'কুইজ সম্পন্ন! 🏆' : 'Quiz Passed! 🏆',
        subtitle: isBangla
          ? `স্কোর ${score}% • জ্ঞান অর্জন সফলভাবে যাচাই করা হয়েছে`
          : `Scored ${score}% • Knowledge Milestone Achieved`,
        xpAwarded: 100,
        icon: 'trophy',
      });
      if (onPassed) onPassed();
    }
    if (quizId) {
      LessonsService.finishQuiz(quizId).catch((err) => {
        console.log('[QuizPlayerModal] LearnPress background quiz sync:', err?.message || err);
      });
    }
  };

  useEffect(() => {
    if (visible && !isSubmitted && timeLeft === 0 && activeQuestions.length > 0) {
      handleSubmit();
    }
  }, [visible, isSubmitted, timeLeft, activeQuestions.length]);

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setTimeLeft(120);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const currentQ = activeQuestions[currentIndex];
  const score = isSubmitted ? calculateScore() : 0;
  const passed = score >= 70;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.topRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.titleBadgeRow}>
                <Text style={[styles.quizTitle, { color: colors.text }]}>{t('quizTitle')}</Text>
                {isLiveLearnPressQuiz ? (
                  <View style={styles.liveSyncBadge}>
                    <View style={styles.liveSyncDot} />
                    <Text style={styles.liveSyncText}>
                      {isBangla ? 'লাইভ লার্নপ্রেস' : 'LearnPress Sync'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.domainBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : '#EFF6FF' }]}>
                    <Text style={[styles.domainBadgeText, { color: isDark ? '#93C5FD' : '#2563EB' }]}>
                      {isBangla ? 'কোর্স মূল্যায়ন' : 'Curriculum Assessment'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.courseSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {courseTitle}
              </Text>
            </View>

            {!isSubmitted && !isLoadingQuiz && activeQuestions.length > 0 && (
              <View style={[styles.timerBadge, { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' }]}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.timerText, { color: colors.primary }]}>{formatTime(timeLeft)}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close Quiz"
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {isLoadingQuiz ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                {isBangla ? 'কুইজ প্রশ্ন লোড হচ্ছে...' : 'Loading quiz questions...'}
              </Text>
            </View>
          ) : activeQuestions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                {isBangla ? 'কোনো কুইজ প্রশ্ন পাওয়া যায়নি।' : 'No quiz questions available.'}
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {!isSubmitted ? (
                <>
                  {/* Question progress */}
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressText, { color: colors.textMuted }]}>
                      {isBangla ? 'প্রশ্ন' : 'Question'} {currentIndex + 1} {isBangla ? 'এর' : 'of'}{' '}
                      {activeQuestions.length}
                    </Text>
                    <View style={[styles.progressBar, { backgroundColor: isDark ? colors.surfaceSubtle : '#E2E8F0' }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: colors.primary,
                            width: `${((currentIndex + 1) / activeQuestions.length) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Question text */}
                  {currentQ && (
                    <Text style={[styles.questionText, { color: colors.text }]}>{currentQ.question}</Text>
                  )}

                  {/* Options */}
                  {currentQ && (
                    <View style={styles.optionsList}>
                      {currentQ.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[currentIndex] === optIdx;
                        return (
                          <TouchableOpacity
                            key={optIdx}
                            style={[
                              styles.optionCard,
                              {
                                backgroundColor: isSelected
                                  ? isDark
                                    ? 'rgba(16, 47, 83, 0.5)'
                                    : '#EEF2FF'
                                  : isDark
                                  ? colors.surfaceSubtle
                                  : '#F8FAFC',
                                borderColor: isSelected ? colors.primary : colors.border,
                              },
                            ]}
                            onPress={() => handleSelectOption(optIdx)}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel={`Option ${String.fromCharCode(65 + optIdx)}: ${opt}`}
                          >
                            <View
                              style={[
                                styles.optionRadio,
                                {
                                  borderColor: isSelected ? colors.primary : colors.border,
                                  backgroundColor: isSelected ? colors.primary : 'transparent',
                                },
                              ]}
                            >
                              {isSelected && <View style={styles.radioDot} />}
                            </View>
                            <Text
                              style={[
                                styles.optionText,
                                { color: colors.text, fontWeight: isSelected ? '700' : '500' },
                              ]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Navigation Buttons */}
                  <View style={styles.navButtonsRow}>
                    {currentIndex > 0 && (
                      <TouchableOpacity
                        style={[styles.prevBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                        onPress={() => setCurrentIndex((prev) => prev - 1)}
                        accessibilityRole="button"
                        accessibilityLabel="Previous question"
                      >
                        <Ionicons name="arrow-back" size={16} color={colors.text} />
                        <Text style={[styles.prevBtnText, { color: colors.text }]}>
                          {isBangla ? 'পূর্ববর্তী' : 'Previous'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {currentIndex < activeQuestions.length - 1 ? (
                      <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setCurrentIndex((prev) => prev + 1)}
                        accessibilityRole="button"
                        accessibilityLabel="Next question"
                      >
                        <Text style={[styles.nextBtnText, { color: colors.onPrimary }]}>
                          {isBangla ? 'পরবর্তী প্রশ্ন' : 'Next Question'}
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: '#047857' }]}
                        onPress={handleSubmit}
                        accessibilityRole="button"
                        accessibilityLabel="Submit quiz"
                      >
                        <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.nextBtnText}>
                          {isBangla ? 'কুইজ জমা দিন' : t('submitAnswer')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              ) : (
                /* Quiz Results View */
                <View style={styles.resultsContainer}>
                  <View
                    style={[
                      styles.scoreRing,
                      {
                        backgroundColor: passed ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                        borderColor: passed ? '#10B981' : '#EF4444',
                      },
                    ]}
                  >
                    <Ionicons
                      name={passed ? 'trophy' : 'alert-circle'}
                      size={40}
                      color={passed ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.scoreValue, { color: passed ? '#059669' : '#DC2626' }]}>
                      {score}%
                    </Text>
                  </View>

                  <Text style={[styles.resultTitle, { color: colors.text }]}>
                    {passed
                      ? isBangla
                        ? 'অভিনন্দন! আপনি কুইজে উত্তীর্ণ হয়েছেন 🎉'
                        : t('passed')
                      : isBangla
                      ? 'আবার চেষ্টা করুন (পাস মার্ক ৭০%)'
                      : t('failed')}
                  </Text>

                  {/* Explanations List */}
                  <Text style={[styles.explanationsHeading, { color: colors.text }]}>
                    {isBangla ? 'উত্তর ও বিশদ পর্যালোচনা' : `${t('reviewExplanations')}:`}
                  </Text>

                  {activeQuestions.map((q, qIdx) => {
                    const userAns = selectedAnswers[qIdx];
                    const isCorrect = userAns === q.correctIndex;
                    return (
                      <View
                        key={q.id}
                        style={[
                          styles.explanationCard,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: isCorrect ? '#10B981' : '#EF4444',
                          },
                        ]}
                      >
                        <View style={styles.explHeader}>
                          <Ionicons
                            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                            size={18}
                            color={isCorrect ? '#10B981' : '#EF4444'}
                          />
                          <Text style={[styles.explQuestion, { color: colors.text }]}>
                            {isBangla ? 'প্রশ্ন' : 'Q'}{qIdx + 1}: {q.question}
                          </Text>
                        </View>
                        <Text style={[styles.correctAnswerText, { color: '#059669' }]}>
                          ✓ {isBangla ? 'সঠিক উত্তর' : 'Correct Answer'}: {q.options[q.correctIndex]}
                        </Text>
                        <Text style={[styles.explanationNote, { color: colors.textMuted }]}>
                          {q.explanation}
                        </Text>
                      </View>
                    );
                  })}

                  {/* Actions */}
                  <View style={styles.resultActions}>
                    {!passed ? (
                      <TouchableOpacity
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                        onPress={resetQuiz}
                        accessibilityRole="button"
                        accessibilityLabel="Retake quiz"
                      >
                        <Ionicons name="refresh" size={18} color={colors.onPrimary} style={{ marginRight: 6 }} />
                        <Text style={[styles.retryBtnText, { color: colors.onPrimary }]}>
                          {isBangla ? 'পুনরায় পরীক্ষা দিন' : 'Retake Quiz'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.retryBtn, { backgroundColor: '#047857' }]}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel="Complete and continue"
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.retryBtnText}>
                          {isBangla ? 'সম্পন্ন ও পরবর্তী পাঠ' : 'Complete & Continue'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '92%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  quizTitle: {
    ...typography.h4,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  liveSyncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveSyncText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  domainBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  domainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  courseSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: shape.medium,
    gap: 4,
    marginRight: 10,
  },
  timerText: {
    ...typography.caption,
    fontWeight: '700',
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scroll: {
    paddingBottom: 24,
  },
  progressRow: {
    marginBottom: 16,
  },
  progressText: {
    ...typography.caption,
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: 18,
  },
  optionsList: {
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: shape.medium,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 6,
    minHeight: MIN_TOUCH_TARGET,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: shape.medium,
    gap: 6,
    minHeight: MIN_TOUCH_TARGET,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultsContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  scoreRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  resultTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: 20,
  },
  explanationsHeading: {
    ...typography.h5,
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginTop: 8,
  },
  explanationCard: {
    width: '100%',
    padding: 14,
    borderRadius: shape.medium,
    borderWidth: 1,
    marginBottom: 12,
  },
  explHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  explQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  correctAnswerText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    paddingLeft: 26,
  },
  explanationNote: {
    fontSize: 12,
    lineHeight: 17,
    paddingLeft: 26,
  },
  resultActions: {
    width: '100%',
    marginTop: 16,
    marginBottom: 10,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: shape.medium,
    minHeight: MIN_TOUCH_TARGET,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
