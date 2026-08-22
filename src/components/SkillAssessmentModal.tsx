import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';
import { useLearning } from '../context/LearningContext';
import { SkillAssessmentQuestion, SkillAssessmentResult } from '../types';

interface SkillAssessmentModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToCourse?: (courseId: string) => void;
}

const ASSESSMENT_QUESTIONS: SkillAssessmentQuestion[] = [
  {
    id: 'q1',
    domain: 'Generative AI & Tech',
    question: 'How do you currently ensure reliable, hallucination-free output when instructing Enterprise AI models for executive analysis?',
    options: [
      { text: 'I use conversational trial-and-error with basic prompts.', points: 40 },
      { text: 'I provide few-shot examples and check manually.', points: 70 },
      { text: 'I apply structured RTCC prompt architectures with strict boundary constraints.', points: 100 },
      { text: 'I do not use AI tools in my daily executive workflows yet.', points: 20 },
    ],
  },
  {
    id: 'q2',
    domain: 'Financial Strategy',
    question: 'When stress-testing a Discounted Cash Flow (DCF) model for an acquisition, which factor is most crucial to avoid overvaluation?',
    options: [
      { text: 'Limiting terminal growth rate below long-term GDP growth & running sensitivity matrices.', points: 100 },
      { text: 'Assuming revenue will accelerate indefinitely without additional CapEx.', points: 20 },
      { text: 'Using static unadjusted industry average P/E multiples.', points: 50 },
      { text: 'Excluding working capital changes to make cash flow look higher.', points: 10 },
    ],
  },
  {
    id: 'q3',
    domain: 'Data Analytics & BI',
    question: 'How do you analyze customer retention trends and recurring revenue cohorts in your organization?',
    options: [
      { text: 'Exporting raw transaction sheets and manual filtering in Excel.', points: 40 },
      { text: 'Writing SQL window functions with dynamic partition rankings and PowerBI dashboards.', points: 100 },
      { text: 'Relying on monthly sales summaries without cohort breakdowns.', points: 30 },
      { text: 'Delegating entirely without understanding the underlying metrics.', points: 20 },
    ],
  },
  {
    id: 'q4',
    domain: 'People Analytics & HR',
    question: 'How does your organization proactively identify high-risk voluntary employee turnover before exits happen?',
    options: [
      { text: 'Exit interviews conducted after the resignation letter.', points: 30 },
      { text: 'Annual generic satisfaction surveys.', points: 50 },
      { text: 'Tracking Employee Lifetime Value (ELTV) ramp curves and early burnout signal analytics.', points: 100 },
      { text: 'Informal gut-feel manager discussions.', points: 35 },
    ],
  },
  {
    id: 'q5',
    domain: 'Executive Communication',
    question: 'When presenting a multi-million dollar capital expenditure proposal to the Board of Directors, what is the best structural approach?',
    options: [
      { text: 'Starting with 20 slides of background history before revealing the budget request.', points: 20 },
      { text: 'The Minto Pyramid Principle: Lead with direct recommendation, followed by grouped key arguments.', points: 100 },
      { text: 'Reading full paragraphs verbatim from slide decks.', points: 10 },
      { text: 'Sending raw spreadsheets without an executive summary.', points: 25 },
    ],
  },
];

export const SkillAssessmentModal: React.FC<SkillAssessmentModalProps> = ({
  visible,
  onClose,
  onNavigateToCourse,
}) => {
  const { colors } = useTheme();
  const { saveAssessmentResult } = useSaaS();
  const { enrollInCourse } = useLearning();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SkillAssessmentResult | null>(null);

  const currentQ = ASSESSMENT_QUESTIONS[currentIndex];
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (points: number) => {
    const updated = { ...selectedAnswers, [currentQ.id]: points };
    setSelectedAnswers(updated);

    if (!isLastQuestion) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate results
      computeAndSaveResult(updated);
    }
  };

  const computeAndSaveResult = (answers: Record<string, number>) => {
    const domainScores: { domain: string; score: number; maxScore: number }[] = [];
    let totalScore = 0;

    ASSESSMENT_QUESTIONS.forEach((q) => {
      const score = answers[q.id] || 0;
      totalScore += score;
      domainScores.push({
        domain: q.domain,
        score,
        maxScore: 100,
      });
    });

    const overall = Math.round(totalScore / totalQuestions);

    let levelName = 'Emerging Practitioner (Level I)';
    if (overall >= 85) levelName = 'Executive Strategist (Level IV)';
    else if (overall >= 70) levelName = 'Senior Specialist (Level III)';
    else if (overall >= 50) levelName = 'Business Associate (Level II)';

    const calculated: SkillAssessmentResult = {
      completedAt: new Date().toISOString().split('T')[0],
      overallScore: overall,
      domainScores,
      levelName,
      recommendedCourseIds: ['course-1', 'course-2', 'course-3'],
      keyInsight: `Your strategic communication and AI readiness index is ${overall}%. We have structured a high-velocity learning pathway to master financial modeling and advanced analytics.`,
    };

    setResult(calculated);
    saveAssessmentResult(calculated);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setResult(null);
  };

  const handleEnrollTrack = () => {
    if (result) {
      result.recommendedCourseIds.forEach((cId) => enrollInCourse(cId));
      onClose();
      if (onNavigateToCourse) {
        onNavigateToCourse(result.recommendedCourseIds[0]);
      }
    }
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
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Executive Skill Diagnostic
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {!result ? (
              <>
                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressMeta}>
                    <Text style={[styles.progressStepText, { color: colors.primary }]}>
                      Question {currentIndex + 1} of {totalQuestions}
                    </Text>
                    <Text style={[styles.domainBadge, { color: colors.secondary, backgroundColor: colors.secondaryLight }]}>
                      {currentQ.domain}
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Question */}
                <Text style={[styles.questionText, { color: colors.text }]}>
                  {currentQ.question}
                </Text>

                {/* Options */}
                <View style={styles.optionsList}>
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedAnswers[currentQ.id] === opt.points;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: isSelected
                              ? colors.surfaceElevated
                              : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => handleSelectOption(opt.points)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.optionLetter,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surfaceCard,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionLetterText,
                              { color: isSelected ? '#FFFFFF' : colors.text },
                            ]}
                          >
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        </View>
                        <Text style={[styles.optionText, { color: colors.text }]}>
                          {opt.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {currentIndex > 0 && (
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => setCurrentIndex(currentIndex - 1)}
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
                    <Text style={[styles.backBtnText, { color: colors.textMuted }]}>
                      Previous Question
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              /* Diagnostic Results View */
              <View style={styles.resultView}>
                <View style={[styles.scoreBadgeCircle, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.scoreCircleValue, { color: colors.primary }]}>
                    {result.overallScore}%
                  </Text>
                  <Text style={[styles.scoreCircleLabel, { color: colors.primary }]}>
                    Readiness
                  </Text>
                </View>

                <Text style={[styles.resultLevelTitle, { color: colors.text }]}>
                  {result.levelName}
                </Text>
                <Text style={[styles.resultInsightText, { color: colors.textMuted }]}>
                  {result.keyInsight}
                </Text>

                {/* Domain Breakdown Bars */}
                <View style={[styles.domainsBreakdownCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <Text style={[styles.domainSectionHeading, { color: colors.text }]}>
                    Competency Breakdown
                  </Text>
                  {result.domainScores.map((ds, index) => (
                    <View key={index} style={styles.domainRow}>
                      <View style={styles.domainLabelRow}>
                        <Text style={[styles.domainName, { color: colors.text }]}>{ds.domain}</Text>
                        <Text style={[styles.domainScoreVal, { color: colors.primary }]}>
                          {ds.score}%
                        </Text>
                      </View>
                      <View style={[styles.domainTrack, { backgroundColor: colors.surfaceCard }]}>
                        <View
                          style={[
                            styles.domainFill,
                            {
                              backgroundColor:
                                ds.score >= 80
                                  ? colors.primary
                                  : ds.score >= 60
                                  ? colors.secondary
                                  : colors.accent,
                              width: `${ds.score}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                {/* Action CTAs */}
                <TouchableOpacity
                  style={[styles.enrollTrackBtn, { backgroundColor: colors.primary }]}
                  onPress={handleEnrollTrack}
                >
                  <Ionicons name="rocket" size={18} color="#FFFFFF" />
                  <Text style={styles.enrollTrackBtnText}>
                    Enroll in Recommended Pathway
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.retakeBtn} onPress={handleReset}>
                  <Text style={[styles.retakeBtnText, { color: colors.textMuted }]}>
                    Retake Assessment
                  </Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
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
  scrollContent: {
    padding: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '700',
  },
  domainBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  progressTrack: {
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
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultView: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  scoreBadgeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  scoreCircleValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  scoreCircleLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  resultLevelTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  resultInsightText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  domainsBreakdownCard: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  domainSectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  domainRow: {
    marginBottom: 10,
  },
  domainLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  domainName: {
    fontSize: 12,
    fontWeight: '600',
  },
  domainScoreVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  domainTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  domainFill: {
    height: '100%',
    borderRadius: 3,
  },
  enrollTrackBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  enrollTrackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  retakeBtn: {
    paddingVertical: 8,
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
