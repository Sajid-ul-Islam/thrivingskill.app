import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useSaaS } from '../../context/SaaSContext';
import { useLearning } from '../../context/LearningContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { SkillAssessmentQuestion, SkillAssessmentResult, Course } from '../../types';
import { SkillRadarChart } from '../analytics/SkillRadarChart';

interface SkillAssessmentModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToCourse?: (courseId: string) => void;
}

const ASSESSMENT_QUESTIONS: SkillAssessmentQuestion[] = [
  {
    id: 'q1',
    domain: 'Generative AI & Tech',
    domainBn: 'জেনারেটিভ এআই ও টেকনোলজি',
    question: 'How do you currently ensure reliable, hallucination-free output when instructing Enterprise AI models for executive analysis?',
    questionBn: 'করপোরেট বা এক্সিকিউটিভ অ্যানালাইসিসে এআই মডেল যাতে ভুল বা কাল্পনিক তথ্য না দেয়, তা নিশ্চিত করতে আপনি কী কৌশল অবলম্বন করেন?',
    options: [
      { text: 'I use conversational trial-and-error with basic prompts.', textBn: 'সাধারণ চ্যাট প্রম্পট দিয়ে বারবার চেষ্টা করি।', points: 40 },
      { text: 'I provide few-shot examples and check manually.', textBn: 'কিছু উদাহরণ দিয়ে ম্যানুয়ালি যাচাই করি।', points: 70 },
      { text: 'I apply structured RTCC prompt architectures with strict boundary constraints.', textBn: 'সুনির্দিষ্ট RTCC ফ্রেমওয়ার্ক ও কঠোর সীমাবদ্ধতা সহ স্ট্রাকচার্ড প্রম্পট ব্যবহার করি।', points: 100 },
      { text: 'I do not use AI tools in my daily executive workflows yet.', textBn: 'আমি এখনো দৈনন্দিন প্রাতিষ্ঠানিক কাজে এআই টুল ব্যবহার করি না।', points: 20 },
    ],
  },
  {
    id: 'q2',
    domain: 'Financial Strategy',
    domainBn: 'ফিন্যান্সিয়াল স্ট্র্যাটেজি ও ব্যাংকিং',
    question: 'When stress-testing a Discounted Cash Flow (DCF) model for an acquisition, which factor is most crucial to avoid overvaluation?',
    questionBn: 'একটি অধিগ্রহণের জন্য ডিসকাউন্টেড ক্যাশ ফ্লো (DCF) মডেল স্ট্রেস-টেস্ট করার সময় মাত্রাতিরিক্ত মূল্যায়ন এড়াতে সবচেয়ে জরুরি কোনটি?',
    options: [
      { text: 'Limiting terminal growth rate below long-term GDP growth & running sensitivity matrices.', textBn: 'টার্মিনাল গ্রোথ রেটকে দীর্ঘমেয়াদী জিডিপি প্রবৃদ্ধির নিচে সীমাবদ্ধ রাখা ও সেনসিটিভিটি ম্যাট্রিক্স চালানো।', points: 100 },
      { text: 'Assuming revenue will accelerate indefinitely without additional CapEx.', textBn: 'ধরে নেওয়া যে মূলধনী ব্যয় বৃদ্ধি ছাড়াই আয় অনির্দিষ্টকাল ধরে বাড়বে।', points: 20 },
      { text: 'Using static unadjusted industry average P/E multiples.', textBn: 'অপরিবর্তিত শিল্পের গড় পি/ই মাল্টিপল ব্যবহার করা।', points: 50 },
      { text: 'Excluding working capital changes to make cash flow look higher.', textBn: 'ক্যাশ ফ্লো বেশি দেখাতে কার্যকরী মূলধনের পরিবর্তন বাদ দেওয়া।', points: 10 },
    ],
  },
  {
    id: 'q3',
    domain: 'Data Analytics & BI',
    domainBn: 'ডেটা অ্যানালিটিক্স ও বিজনেস ইন্টেলিজেন্স',
    question: 'How do you analyze customer retention trends and recurring revenue cohorts in your organization?',
    questionBn: 'আপনার প্রতিষ্ঠানে গ্রাহক ধরে রাখা এবং পুনরাবৃত্ত আয়ের প্রবণতা বিশ্লেষণের জন্য কোন পদ্ধতি ব্যবহার করেন?',
    options: [
      { text: 'Exporting raw transaction sheets and manual filtering in Excel.', textBn: 'এক্সেলে র ডেটা শিট নামিয়ে ম্যানুয়ালি ফিল্টার করি।', points: 40 },
      { text: 'Writing SQL window functions with dynamic partition rankings and PowerBI dashboards.', textBn: 'এসকিউএল উইন্ডো ফাংশন ও ডাইনামিক পার্টিশন র‍্যাঙ্কিং সহ PowerBI ড্যাশবোর্ড তৈরি করি।', points: 100 },
      { text: 'Relying on monthly sales summaries without cohort breakdowns.', textBn: 'কোহর্ট ব্রেকডাউন ছাড়াই কেবল মাসিক বিক্রয় সারসংক্ষেপের ওপর নির্ভর করি।', points: 30 },
      { text: 'Delegating entirely without understanding the underlying metrics.', textBn: 'মূল মেট্রিক্স না বুঝেই অন্যদের ওপর ছেড়ে দিই।', points: 20 },
    ],
  },
  {
    id: 'q4',
    domain: 'People Analytics & HR',
    domainBn: 'পিপল অ্যানালিটিক্স ও এইচআর',
    question: 'How does your organization proactively identify high-risk voluntary employee turnover before exits happen?',
    questionBn: 'কর্মীদের পদত্যাগের আগেই প্রতিষ্ঠান কীভাবে উচ্চ ঝুঁকিপূর্ণ স্বেচ্ছা-বিদায় আগে থেকেই শনাক্ত করতে পারে?',
    options: [
      { text: 'Exit interviews conducted after the resignation letter.', textBn: 'পদত্যাগপত্র পাওয়ার পর এক্সিট ইন্টারভিউ নিয়ে।', points: 30 },
      { text: 'Annual generic satisfaction surveys.', textBn: 'বছরে একবার গৎবাঁধা সন্তুষ্টি জরিপ করে।', points: 50 },
      { text: 'Tracking Employee Lifetime Value (ELTV) ramp curves and early burnout signal analytics.', textBn: 'এমপ্লয়ি লাইফটাইম ভ্যালু (ELTV) কার্ভ এবং প্রারম্ভিক ক্লান্তি সংকেত অ্যানালিটিক্স ট্র্যাক করে।', points: 100 },
      { text: 'Informal gut-feel manager discussions.', textBn: 'ম্যানেজারদের ব্যক্তিগত অনুমানের ওপর ভিত্তি করে।', points: 35 },
    ],
  },
  {
    id: 'q5',
    domain: 'Executive Communication',
    domainBn: 'এক্সিকিউটিভ প্রেজেন্টেশন ও লিডারশিপ',
    question: 'When presenting a multi-million dollar capital expenditure proposal to the Board of Directors, what is the best structural approach?',
    questionBn: 'বোর্ড অব ডিরেক্টরসের কাছে বড় কোনো প্রস্তাবনা বা বাজেট অনুমোদনের উপস্থাপনায় সবচেয়ে কার্যকর কাঠামো কোনটি?',
    options: [
      { text: 'Starting with 20 slides of background history before revealing the budget request.', textBn: 'বাজেট চাওয়ার আগে ২০টি স্লাইড ব্যাকগ্রাউন্ড ইতিহাস দিয়ে শুরু করা।', points: 20 },
      { text: 'The Minto Pyramid Principle: Lead with direct recommendation, followed by grouped key arguments.', textBn: 'মিন্টো পিরামিড প্রিন্সিপাল: মূল সিদ্ধান্ত ও সুপারিশ প্রথমে, এরপর সহায়ক যুক্তি ও তথ্য।', points: 100 },
      { text: 'Reading full paragraphs verbatim from slide decks.', textBn: 'স্লাইড দেখে দেখে দীর্ঘ প্যারাগ্রাফ মুখস্থ পড়া।', points: 10 },
      { text: 'Sending raw spreadsheets without an executive summary.', textBn: 'কোনো এক্সিকিউটিভ সামারি ছাড়া সরাসরি স্প্রেডশিট পাঠিয়ে দেওয়া।', points: 25 },
    ],
  },
];

export const SkillAssessmentModal: React.FC<SkillAssessmentModalProps> = ({
  visible,
  onClose,
  onNavigateToCourse,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { saveAssessmentResult } = useSaaS();
  const { enrollInCourse, courses } = useLearning();
  const { isBangla } = useLanguage();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SkillAssessmentResult | null>(null);

  const currentQ = ASSESSMENT_QUESTIONS[currentIndex];
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (points: number) => {
    triggerHaptic('selection');
    const updated = { ...selectedAnswers, [currentQ.id]: points };
    setSelectedAnswers(updated);

    if (!isLastQuestion) {
      setCurrentIndex(currentIndex + 1);
    } else {
      triggerHaptic('success');
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
        domain: isBangla && q.domainBn ? q.domainBn : q.domain,
        score,
        maxScore: 100,
      });
    });

    const overall = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;

    let levelName = isBangla ? 'ইমার্জিং প্র্যাকটিশনার (লেভেল ১)' : 'Emerging Practitioner (Level I)';
    if (overall >= 85) levelName = isBangla ? 'এক্সিকিউটিভ স্ট্র্যাটেজিস্ট (লেভেল ৪)' : 'Executive Strategist (Level IV)';
    else if (overall >= 70) levelName = isBangla ? 'সিনিয়র স্পেশালিস্ট (লেভেল ৩)' : 'Senior Specialist (Level III)';
    else if (overall >= 50) levelName = isBangla ? 'বিজনেস অ্যাসোসিয়েট (লেভেল ২)' : 'Business Associate (Level II)';

    // Match lowest-scoring competency domains to real courses
    const sortedDomains = [...domainScores].sort((a, b) => a.score - b.score);
    const matchedCourseIds: string[] = [];

    for (const d of sortedDomains) {
      const dName = d.domain.toLowerCase();
      let matched: Course | undefined;
      if (dName.includes('ai') || dName.includes('tech') || dName.includes('এআই')) {
        matched = courses.find((c) => c.category === 'generative-ai' || /ai|prompt|chatgpt|notebooklm/i.test(c.title));
      } else if (dName.includes('finan') || dName.includes('অর্থনীতি') || dName.includes('ফিন্যান্স')) {
        matched = courses.find((c) => c.category === 'finance-accounting' || /excel|financ|bank|invest|stock/i.test(c.title));
      } else if (dName.includes('analyt') || dName.includes('bi') || dName.includes('ডেটা')) {
        matched = courses.find((c) => c.category === 'data-science' || /data|analyt|bi|power\s?bi/i.test(c.title));
      } else if (dName.includes('hr') || dName.includes('people') || dName.includes('এইচআর')) {
        matched = courses.find((c) => c.category === 'hr-management' || /hr|talent|employ|people|leadership/i.test(c.title));
      } else if (dName.includes('communicat') || dName.includes('যোগাযোগ') || dName.includes('প্রেজেন্টেশন')) {
        matched = courses.find((c) => c.category === 'leadership-management' || /communicat|present|leadership|mindset/i.test(c.title));
      }

      if (matched && !matchedCourseIds.includes(matched.id)) {
        matchedCourseIds.push(matched.id);
      }
    }

    // Fill up to 3 courses with top courses if needed
    if (matchedCourseIds.length < 3) {
      for (const c of courses) {
        if (!matchedCourseIds.includes(c.id)) {
          matchedCourseIds.push(c.id);
          if (matchedCourseIds.length >= 3) break;
        }
      }
    }

    const keyInsight = isBangla
      ? `আপনার সামগ্রিক স্কিল রেডিয়ারনেস স্কোর ${overall}%। আপনার মূল্যায়নের ভিত্তিতে চিহ্নিত স্কিল বৃদ্ধির জন্য সেরা কোর্সগুলো তালিকাভুক্ত করা হয়েছে।`
      : `Your strategic communication and professional readiness index is ${overall}%. We have identified your core growth areas and tailored course recommendations to accelerate your mastery.`;

    const calculated: SkillAssessmentResult = {
      completedAt: new Date().toISOString().split('T')[0],
      overallScore: overall,
      domainScores,
      levelName,
      recommendedCourseIds: matchedCourseIds,
      keyInsight,
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
    if (result && result.recommendedCourseIds.length > 0) {
      result.recommendedCourseIds.forEach((cId) => enrollInCourse(cId));
      onClose();
      if (onNavigateToCourse) {
        onNavigateToCourse(result.recommendedCourseIds[0]);
      }
    }
  };

  const recommendedCoursesList: Course[] = result
    ? result.recommendedCourseIds
        .map((cId) => courses.find((c) => c.id === cId))
        .filter((c): c is Course => Boolean(c))
    : [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="analytics" size={20} color={colors.primary} style={{ flexShrink: 0 }} />
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {isBangla ? 'এক্সিকিউটিভ স্কিল ডায়াগনস্টিক' : 'Executive Skill Diagnostic'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close diagnostic"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {!result ? (
              <>
                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressMeta}>
                    <Text style={[styles.progressStepText, { color: colors.primary }]}>
                      {isBangla ? 'প্রশ্ন' : 'Question'} {currentIndex + 1} {isBangla ? 'এর' : 'of'}{' '}
                      {totalQuestions}
                    </Text>
                    <Text style={[styles.domainBadge, { color: colors.primary, backgroundColor: colors.primaryLight }]}>
                      {isBangla && currentQ.domainBn ? currentQ.domainBn : currentQ.domain}
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${totalQuestions > 0 ? Math.min(100, Math.round(((currentIndex + 1) / totalQuestions) * 100)) : 0}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Question */}
                <Text style={[styles.questionText, { color: colors.text }]}>
                  {isBangla && currentQ.questionBn ? currentQ.questionBn : currentQ.question}
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
                              ? isDark
                                ? 'rgba(16, 47, 83, 0.5)'
                                : '#EEF2FF'
                              : isDark
                              ? colors.surfaceSubtle
                              : '#F8FAFC',
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => handleSelectOption(opt.points)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Option ${String.fromCharCode(65 + idx)}`}
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
                              { color: isSelected ? colors.onPrimary : colors.text },
                            ]}
                          >
                            {String.fromCharCode(65 + idx)}
                          </Text>
                        </View>
                        <Text style={[styles.optionText, { color: colors.text }]}>
                          {isBangla && opt.textBn ? opt.textBn : opt.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {currentIndex > 0 && (
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => setCurrentIndex(currentIndex - 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Previous question"
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
                    <Text style={[styles.backBtnText, { color: colors.textMuted }]}>
                      {isBangla ? 'পূর্ববর্তী প্রশ্ন' : 'Previous Question'}
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
                    {isBangla ? 'স্কোর' : 'Readiness'}
                  </Text>
                </View>

                <Text style={[styles.resultLevelTitle, { color: colors.text }]}>
                  {result.levelName}
                </Text>
                <Text style={[styles.resultInsightText, { color: colors.textMuted }]}>
                  {result.keyInsight}
                </Text>

                {/* 5-Axis Spider / Radar Competency Breakdown */}
                <SkillRadarChart
                  data={result.domainScores}
                  colors={colors}
                  size={270}
                />

                {/* Domain Breakdown Bars */}
                <View style={[styles.domainsBreakdownCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <Text style={[styles.domainSectionHeading, { color: colors.text }]}>
                    {isBangla ? 'দক্ষতা ও সক্ষমতার বিশ্লেষণ' : 'Competency Breakdown'}
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

                {/* Targeted Recommended Courses (From live catalog) */}
                {recommendedCoursesList.length > 0 && (
                  <View style={styles.recommendSection}>
                    <Text style={[styles.recommendHeading, { color: colors.text }]}>
                      {isBangla ? 'আপনার জন্য সুপারিশকৃত কোর্সসমূহ' : 'Targeted Course Recommendations'}
                    </Text>
                    <Text style={[styles.recommendSub, { color: colors.textMuted }]}>
                      {isBangla
                        ? 'আপনার মূল্যায়নে চিহ্নিত ঘাটতি পূরণে সরাসরি এই কোর্সগুলো থেকে শুরু করুন'
                        : 'Curated courses to bridge competency gaps identified in your assessment'}
                    </Text>
                    <View style={styles.recommendCardsCol}>
                      {recommendedCoursesList.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.recommendCourseCard,
                            {
                              backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => {
                            onClose();
                            onNavigateToCourse?.(c.id);
                          }}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel={`View recommended course: ${c.title}`}
                        >
                          <Image source={{ uri: c.thumbnail }} style={styles.recommendCourseThumb} />
                          <View style={styles.recommendCourseInfo}>
                            <Text style={[styles.recommendCourseTitle, { color: colors.text }]} numberOfLines={2}>
                              {c.title}
                            </Text>
                            <View style={styles.recommendCourseMetaRow}>
                              <View style={[styles.recommendCatBadge, { backgroundColor: colors.primaryLight }]}>
                                <Text style={[styles.recommendCatText, { color: colors.primary }]}>
                                  {c.category}
                                </Text>
                              </View>
                              <Text style={[styles.recommendPriceText, { color: colors.primary }]}>
                                {c.priceBdt ? `৳${c.priceBdt}` : 'Free'}
                              </Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Action CTAs */}
                <TouchableOpacity
                  style={[styles.enrollTrackBtn, { backgroundColor: colors.primary }]}
                  onPress={handleEnrollTrack}
                  accessibilityRole="button"
                  accessibilityLabel="Enroll in Recommended Pathway"
                >
                  <Ionicons name="rocket" size={18} color={colors.onPrimary} />
                  <Text style={[styles.enrollTrackBtnText, { color: colors.onPrimary }]}>
                    {isBangla ? 'প্রস্তাবিত পাথওয়ে শুরু করুন' : 'Enroll in Recommended Pathway'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={handleReset}
                  accessibilityRole="button"
                  accessibilityLabel="Retake assessment"
                >
                  <Text style={[styles.retakeBtnText, { color: colors.textMuted }]}>
                    {isBangla ? 'পুনরায় মূল্যায়ন টেস্ট দিন' : 'Retake Assessment'}
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
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  domainBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: shape.extraSmall,
    flexShrink: 0,
  },
  progressTrack: {
    height: 6,
    borderRadius: shape.extraSmall,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: shape.extraSmall,
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
    borderRadius: shape.large,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: shape.full,
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
    marginTop: 16,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 14,
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
    borderRadius: shape.full,
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
  recommendSection: {
    width: '100%',
    marginBottom: 20,
  },
  recommendHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  recommendSub: {
    fontSize: 12,
    marginBottom: 12,
  },
  recommendCardsCol: {
    gap: 10,
  },
  recommendCourseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  recommendCourseThumb: {
    width: 64,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  recommendCourseInfo: {
    flex: 1,
  },
  recommendCourseTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 4,
  },
  recommendCourseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendCatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendCatText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recommendPriceText: {
    fontSize: 11,
    fontWeight: '800',
  },
  enrollTrackBtn: {
    width: '100%',
    minHeight: 48,
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
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
