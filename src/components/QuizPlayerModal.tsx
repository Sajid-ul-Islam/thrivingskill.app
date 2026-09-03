import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';

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
  questions?: QuizItem[];
  onClose: () => void;
  onPassed?: () => void;
}

const DEFAULT_QUESTIONS: QuizItem[] = [
  {
    id: 'q1',
    question: 'In the RTCC Prompt Engineering model, what does the "C" represent?',
    options: ['Computation & Code', 'Context & Constraints', 'Creativity & Cloud', 'Cost & Calibration'],
    correctIndex: 1,
    explanation: 'RTCC stands for Role, Task, Context, and Constraints — ensuring reliable structured output from LLMs.',
  },
  {
    id: 'q2',
    question: 'Which of the following is a primary pillar of Emotional Intelligence in workplace leadership?',
    options: ['Self-Regulation & Empathy', 'Raw Cognitive IQ', 'Authoritarian Directing', 'Speed Reading'],
    correctIndex: 0,
    explanation: 'Self-regulation, self-awareness, empathy, motivation, and social skills form the core framework of EI.',
  },
  {
    id: 'q3',
    question: 'What is the recommended approach to reduce AI hallucinations in business reporting?',
    options: [
      'Increase temperature to maximum',
      'Provide source documents in prompt and request citations',
      'Shorten the prompt to one word',
      'Disable prompt system messages',
    ],
    correctIndex: 1,
    explanation: 'Grounding the LLM with factual source text (RAG / Context injection) dramatically eliminates hallucinations.',
  },
];

export const QuizPlayerModal: React.FC<QuizPlayerModalProps> = ({
  visible,
  courseTitle,
  questions = DEFAULT_QUESTIONS,
  onClose,
  onPassed,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { unlockBadge } = useGamification();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes

  useEffect(() => {
    if (visible && !isSubmitted) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [visible, isSubmitted]);

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const score = calculateScore();
    if (score >= 70) {
      unlockBadge('quiz_master');
      if (onPassed) onPassed();
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setTimeLeft(120);
  };

  const currentQ = questions[currentIndex];
  const score = isSubmitted ? calculateScore() : 0;
  const passed = score >= 70;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.topRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quizTitle, { color: colors.text }]}>{t('quizTitle')}</Text>
              <Text style={[styles.courseSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {courseTitle}
              </Text>
            </View>

            {!isSubmitted && (
              <View style={[styles.timerBadge, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={[styles.timerText, { color: colors.primary }]}>{formatTime(timeLeft)}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {!isSubmitted ? (
              <>
                {/* Question progress */}
                <View style={styles.progressRow}>
                  <Text style={[styles.progressText, { color: colors.textMuted }]}>
                    {t('question')} {currentIndex + 1} {t('of')} {questions.length}
                  </Text>
                  <View style={[styles.progressBar, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${((currentIndex + 1) / questions.length) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Question text */}
                <Text style={[styles.questionText, { color: colors.text }]}>{currentQ.question}</Text>

                {/* Options */}
                <View style={styles.optionsList}>
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentIndex] === optIdx;
                    return (
                      <TouchableOpacity
                        key={optIdx}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: isSelected ? colors.primaryLight : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => handleSelectOption(optIdx)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.optionRadio,
                            {
                              borderColor: isSelected ? colors.primary : colors.textMuted,
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

                {/* Navigation Buttons */}
                <View style={styles.navButtonsRow}>
                  {currentIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.prevBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                      onPress={() => setCurrentIndex((prev) => prev - 1)}
                    >
                      <Ionicons name="arrow-back" size={16} color={colors.text} />
                      <Text style={[styles.prevBtnText, { color: colors.text }]}>Previous</Text>
                    </TouchableOpacity>
                  )}

                  {currentIndex < questions.length - 1 ? (
                    <TouchableOpacity
                      style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                      onPress={() => setCurrentIndex((prev) => prev + 1)}
                    >
                      <Text style={styles.nextBtnText}>Next Question</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.nextBtn, { backgroundColor: '#10B981' }]}
                      onPress={handleSubmit}
                    >
                      <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.nextBtnText}>{t('submitAnswer')}</Text>
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
                    { backgroundColor: passed ? '#ECFDF5' : '#FEF2F2', borderColor: passed ? '#10B981' : '#EF4444' },
                  ]}
                >
                  <Ionicons
                    name={passed ? 'trophy' : 'alert-circle'}
                    size={40}
                    color={passed ? '#10B981' : '#EF4444'}
                  />
                  <Text style={[styles.scoreValue, { color: passed ? '#065F46' : '#991B1B' }]}>{score}%</Text>
                </View>

                <Text style={[styles.resultTitle, { color: colors.text }]}>
                  {passed ? t('passed') : t('failed')}
                </Text>

                {/* Explanations List */}
                <Text style={[styles.explanationsHeading, { color: colors.text }]}>
                  {t('reviewExplanations')}:
                </Text>
                {questions.map((q, qIdx) => {
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
                          Q{qIdx + 1}: {q.question}
                        </Text>
                      </View>
                      <Text style={[styles.correctAnswerText, { color: colors.primary }]}>
                        ✓ Correct Answer: {q.options[q.correctIndex]}
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
                    >
                      <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.retryBtnText}>Retake Quiz</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.retryBtn, { backgroundColor: '#10B981' }]} onPress={onClose}>
                      <Ionicons name="ribbon" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.retryBtnText}>{t('claimCertificate')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
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
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  quizTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  courseSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    marginRight: 10,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    paddingBottom: 24,
  },
  progressRow: {
    marginBottom: 14,
    gap: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
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
    fontWeight: '700',
    lineHeight: 22,
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
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 19,
  },
  navButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 6,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resultsContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  scoreRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  explanationsHeading: {
    fontSize: 14,
    fontWeight: '800',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  explanationCard: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 6,
  },
  explHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  explQuestion: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  correctAnswerText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  explanationNote: {
    fontSize: 12,
    lineHeight: 16,
  },
  resultActions: {
    width: '100%',
    marginTop: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
