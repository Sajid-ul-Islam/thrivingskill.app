import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuizQuestion } from '../types';
import { useTheme } from '../context/ThemeContext';

interface QuizModalProps {
  visible: boolean;
  questions: QuizQuestion[];
  onClose: () => void;
  onPass: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ visible, questions, onClose, onPass }) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    if (selectedOption === currentQ.correctAnswerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setQuizFinished(true);
      if (score + (selectedOption === currentQ.correctAnswerIndex ? 1 : 0) >= Math.ceil(questions.length * 0.7)) {
        onPass();
      }
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="help-circle" size={22} color={colors.secondary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Knowledge Check</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {quizFinished ? (
              <View style={styles.finishedContainer}>
                <View
                  style={[
                    styles.scoreCircle,
                    {
                      backgroundColor:
                        score >= Math.ceil(questions.length * 0.7)
                          ? colors.primaryLight
                          : colors.dangerLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      score >= Math.ceil(questions.length * 0.7)
                        ? 'trophy'
                        : 'alert-circle'
                    }
                    size={48}
                    color={
                      score >= Math.ceil(questions.length * 0.7)
                        ? colors.primary
                        : colors.danger
                    }
                  />
                </View>

                <Text style={[styles.resultTitle, { color: colors.text }]}>
                  {score >= Math.ceil(questions.length * 0.7)
                    ? 'Quiz Passed! Great Job!'
                    : 'Keep Practicing'}
                </Text>
                <Text style={[styles.resultSubtitle, { color: colors.textMuted }]}>
                  You answered {score} out of {questions.length} questions correctly (
                  {Math.round((score / questions.length) * 100)}%).
                </Text>

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={[styles.retryBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                    onPress={handleReset}
                  >
                    <Text style={[styles.retryText, { color: colors.text }]}>Try Again</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                    onPress={onClose}
                  >
                    <Text style={styles.doneText}>Continue Course</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {/* Progress Indicator */}
                <View style={styles.progressRow}>
                  <Text style={[styles.progressText, { color: colors.textMuted }]}>
                    Question {currentIndex + 1} of {questions.length}
                  </Text>
                  <View style={[styles.scoreTag, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.scoreText, { color: colors.primary }]}>Score: {score}</Text>
                  </View>
                </View>

                <Text style={[styles.questionText, { color: colors.text }]}>
                  {currentQ.question}
                </Text>

                {/* Options */}
                <View style={styles.optionsContainer}>
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    let optionBg = colors.surfaceSubtle;
                    let optionBorder = colors.border;
                    let iconColor = colors.textMuted;

                    if (isSubmitted) {
                      if (idx === currentQ.correctAnswerIndex) {
                        optionBg = colors.primaryLight;
                        optionBorder = colors.primary;
                        iconColor = colors.primary;
                      } else if (isSelected) {
                        optionBg = colors.dangerLight;
                        optionBorder = colors.danger;
                        iconColor = colors.danger;
                      }
                    } else if (isSelected) {
                      optionBg = colors.surfaceElevated;
                      optionBorder = colors.secondary;
                      iconColor = colors.secondary;
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: optionBg,
                            borderColor: optionBorder,
                          },
                        ]}
                        onPress={() => handleSelectOption(idx)}
                        activeOpacity={0.7}
                        disabled={isSubmitted}
                      >
                        <View
                          style={[
                            styles.optionLetterBadge,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surfaceCard,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionLetter,
                              { color: isSelected ? '#FFFFFF' : colors.text },
                            ]}
                          >
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        </View>
                        <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Explanation Card */}
                {isSubmitted && (
                  <View
                    style={[
                      styles.explanationCard,
                      {
                        backgroundColor:
                          selectedOption === currentQ.correctAnswerIndex
                            ? colors.primaryLight
                            : colors.dangerLight,
                      },
                    ]}
                  >
                    <View style={styles.explanationHeader}>
                      <Ionicons
                        name={
                          selectedOption === currentQ.correctAnswerIndex
                            ? 'checkmark-circle'
                            : 'close-circle'
                        }
                        size={18}
                        color={
                          selectedOption === currentQ.correctAnswerIndex
                            ? colors.primary
                            : colors.danger
                        }
                      />
                      <Text
                        style={[
                          styles.explanationTitle,
                          {
                            color:
                              selectedOption === currentQ.correctAnswerIndex
                                ? colors.primary
                                : colors.danger,
                          },
                        ]}
                      >
                        {selectedOption === currentQ.correctAnswerIndex
                          ? 'Correct!'
                          : 'Incorrect'}
                      </Text>
                    </View>
                    <Text style={[styles.explanationBody, { color: colors.text }]}>
                      {currentQ.explanation}
                    </Text>
                  </View>
                )}

                {/* Action button */}
                <View style={styles.actionContainer}>
                  {!isSubmitted ? (
                    <TouchableOpacity
                      style={[
                        styles.primaryActionBtn,
                        {
                          backgroundColor:
                            selectedOption !== null ? colors.primary : colors.surfaceSubtle,
                        },
                      ]}
                      onPress={handleCheckAnswer}
                      disabled={selectedOption === null}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: selectedOption !== null ? '#FFFFFF' : colors.textMuted },
                        ]}
                      >
                        Check Answer
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                      onPress={handleNext}
                    >
                      <Text style={styles.actionBtnText}>
                        {currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionLetterBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 14,
    flex: 1,
  },
  explanationCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  explanationBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: 8,
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  finishedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
