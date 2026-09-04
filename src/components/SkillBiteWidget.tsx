import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useGamification } from '../context/GamificationContext';

const SKILL_BITE_STORAGE_KEY = '@thriving_skill_daily_bite_date';

interface SkillBiteQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

const DAILY_QUESTIONS: SkillBiteQuestion[] = [
  {
    id: 'bite-excel-xlookup',
    category: 'Excel & Financial Modeling',
    question:
      'Which modern Excel formula performs bidirectional lookups both left and right without requiring column index numbers?',
    options: ['VLOOKUP', 'INDEX & MATCH', 'XLOOKUP', 'HLOOKUP'],
    correctIndex: 2,
    explanation:
      'XLOOKUP replaces VLOOKUP with flexible bidirectional search, default exact matching, and resilience against inserted columns.',
    xpReward: 50,
  },
  {
    id: 'bite-ai-temperature',
    category: 'Generative AI & LLMs',
    question:
      'When prompting an LLM for structured financial analysis or SQL, how should you adjust the "temperature" parameter?',
    options: [
      'Increase to 1.0+ for maximum creativity',
      'Lower to 0.0 – 0.2 for deterministic precision',
      'Keep at 2.0 to randomize output',
      'Temperature does not affect LLMs',
    ],
    correctIndex: 1,
    explanation:
      'Lower temperature (near 0) produces deterministic, repeatable outputs vital for math, code, and formal corporate reporting.',
    xpReward: 50,
  },
  {
    id: 'bite-leadership-okr',
    category: 'Corporate Leadership',
    question:
      'What distinguishes a good "Key Result" in the OKR framework from a standard KPI?',
    options: [
      'It must always be an executive opinion',
      'It should be strictly measurable with a clear baseline and target',
      'It must involve at least 10 team members',
      'It is never reviewed quarterly',
    ],
    correctIndex: 1,
    explanation:
      'Effective Key Results are quantifiable outcomes (e.g. "Increase retention from 70% to 85%"), not open-ended task lists.',
    xpReward: 50,
  },
];

export const SkillBiteWidget: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { addXP, incrementStreak } = useGamification();

  const [question, setQuestion] = useState<SkillBiteQuestion>(DAILY_QUESTIONS[0]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCompletedToday, setIsCompletedToday] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Select daily question deterministically by day of year
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    const qIndex = dayOfYear % DAILY_QUESTIONS.length;
    setQuestion(DAILY_QUESTIONS[qIndex]);

    AsyncStorage.getItem(SKILL_BITE_STORAGE_KEY).then((storedDate) => {
      if (storedDate === todayStr) {
        setIsCompletedToday(true);
        setIsAnswered(true);
        setSelectedIndex(DAILY_QUESTIONS[qIndex].correctIndex);
      }
    });
  }, [todayStr]);

  const handleSelectOption = async (index: number) => {
    if (isAnswered) return;

    setSelectedIndex(index);
    setIsAnswered(true);

    const isCorrect = index === question.correctIndex;
    if (isCorrect && !rewardClaimed) {
      setRewardClaimed(true);
      addXP(question.xpReward);
      incrementStreak();
    }

    await AsyncStorage.setItem(SKILL_BITE_STORAGE_KEY, todayStr);
    setIsCompletedToday(true);
  };

  const isCorrect = selectedIndex === question.correctIndex;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#14223B' : '#FFFFFF',
          borderColor: isDark ? '#22365A' : '#E2E8F0',
        },
      ]}
    >
      {/* Header Pill */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: isDark ? '#1F3354' : '#E8EEF5' }]}>
          <Ionicons name="flash" size={14} color="#FFB606" />
          <Text style={[styles.badgeText, { color: isDark ? '#93C5FD' : '#102F53' }]}>
            DAILY SKILL BITE
          </Text>
        </View>

        <View style={styles.xpPill}>
          <Ionicons name="sparkles" size={13} color="#FFB606" />
          <Text style={styles.xpText}>+{question.xpReward} XP</Text>
        </View>
      </View>

      {/* Category & Question */}
      <Text style={[styles.categoryText, { color: colors.accent }]}>
        {question.category}
      </Text>
      <Text style={[styles.questionText, { color: colors.text }]}>
        {question.question}
      </Text>

      {/* Options */}
      <View style={styles.optionsList}>
        {question.options.map((opt, idx) => {
          let btnBg = isDark ? '#1B2B4A' : '#F8FAFC';
          let btnBorder = isDark ? '#22365A' : '#E2E8F0';
          let textColor = colors.text;
          let iconName: any = 'radio-button-off';
          let iconColor = colors.textMuted;

          if (isAnswered) {
            if (idx === question.correctIndex) {
              btnBg = isDark ? '#064E3B' : '#ECFDF5';
              btnBorder = '#10B981';
              textColor = isDark ? '#A7F3D0' : '#065F46';
              iconName = 'checkmark-circle';
              iconColor = '#10B981';
            } else if (idx === selectedIndex) {
              btnBg = isDark ? '#7F1D1D' : '#FEF2F2';
              btnBorder = '#EF4444';
              textColor = isDark ? '#FECACA' : '#991B1B';
              iconName = 'close-circle';
              iconColor = '#EF4444';
            }
          }

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionBtn,
                {
                  backgroundColor: btnBg,
                  borderColor: btnBorder,
                },
              ]}
              onPress={() => handleSelectOption(idx)}
              activeOpacity={0.75}
              disabled={isAnswered}
            >
              <Ionicons name={iconName} size={18} color={iconColor} style={styles.optIcon} />
              <Text style={[styles.optText, { color: textColor }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feedback & Explanation Box */}
      {isAnswered && (
        <View
          style={[
            styles.explanationBox,
            {
              backgroundColor: isCorrect
                ? isDark
                  ? '#064E3B40'
                  : '#ECFDF5'
                : isDark
                ? '#7F1D1D40'
                : '#FEF2F2',
              borderColor: isCorrect ? '#10B981' : '#EF4444',
            },
          ]}
        >
          <View style={styles.explanationHeader}>
            <Ionicons
              name={isCorrect ? 'trophy' : 'information-circle'}
              size={18}
              color={isCorrect ? '#10B981' : '#EF4444'}
            />
            <Text
              style={[
                styles.explanationTitle,
                { color: isCorrect ? '#10B981' : '#EF4444' },
              ]}
            >
              {isCorrect ? 'Excellent Insight! +50 XP Added' : 'Not Quite! Here is the concept:'}
            </Text>
          </View>
          <Text
            style={[
              styles.explanationContent,
              { color: isDark ? '#E2E8F0' : '#334155' },
            ]}
          >
            {question.explanation}
          </Text>
          {isCompletedToday && (
            <View style={styles.streakFooter}>
              <Ionicons name="flame" size={14} color="#F59E0B" />
              <Text style={styles.streakFooterText}>
                Daily challenge completed. Come back tomorrow for your next bite!
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    shadowColor: '#102F53',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  xpText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 14,
  },
  optionsList: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optIcon: {
    marginRight: 10,
  },
  optText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  explanationBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  explanationContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  streakFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  streakFooterText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    flex: 1,
  },
});
