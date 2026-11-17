import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useGamification } from '../../context/GamificationContext';
import { triggerHaptic } from '../../utils/haptics';
import {
  SpacedRepetitionService,
  Flashcard,
  ReviewRating,
} from '../../services/study/spacedRepetitionService';
import { Course } from '../../types';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface SpacedRepetitionModalProps {
  visible: boolean;
  onClose: () => void;
  course?: Course;
}

export const SpacedRepetitionModal: React.FC<SpacedRepetitionModalProps> = ({
  visible,
  onClose,
  course,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedback();
  const { recordStudyTime } = useGamification();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [reviewedCount, setReviewedCount] = useState<number>(0);

  const loadCards = useCallback(async () => {
    setIsLoading(true);
    setIsSessionComplete(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);

    try {
      let deck: Flashcard[] = [];
      if (course) {
        deck = await SpacedRepetitionService.generateDeckForCourse(course);
      } else {
        deck = await SpacedRepetitionService.getDueCards();
        if (deck.length === 0) {
          deck = await SpacedRepetitionService.getAllCards();
        }
      }
      setCards(deck);
    } catch {
      // Safe fallback
    } finally {
      setIsLoading(false);
    }
  }, [course]);

  useEffect(() => {
    if (visible) {
      loadCards();
    }
  }, [visible, loadCards]);

  const handleFlip = () => {
    triggerHaptic('light');
    setIsFlipped(!isFlipped);
  };

  const handleRate = async (rating: ReviewRating) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    triggerHaptic('selection');
    try {
      await SpacedRepetitionService.reviewCard(currentCard.id, rating);
    } catch {}

    const nextCount = reviewedCount + 1;
    setReviewedCount(nextCount);

    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session finished!
      setIsSessionComplete(true);
      triggerHaptic('success');
      recordStudyTime(5); // Award 5 minutes of focused recall time
      showToast({
        message: 'Active Recall Session Complete! +30 XP awarded 🧠',
        type: 'success',
      });
    }
  };

  const currentCard = cards[currentIndex];
  const progressPct = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

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
            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>Spaced Repetition Recall</Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                {course ? course.title : 'Active Recall & Memory Retention'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' }]}
              accessibilityRole="button"
              accessibilityLabel="Close Flashcards"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Preparing personalized study deck...
              </Text>
            </View>
          ) : isSessionComplete ? (
            <View style={styles.centerContainer}>
              <View style={[styles.trophyCircle, { backgroundColor: isDark ? colors.surfaceSubtle : '#FEF3C7' }]}>
                <Ionicons name="trophy" size={48} color={colors.brandGold} />
              </View>
              <Text style={[styles.completeTitle, { color: colors.text }]}>Session Complete! 🎉</Text>
              <Text style={[styles.completeDesc, { color: colors.textMuted }]}>
                You reviewed {reviewedCount} flashcards. SM-2 has dynamically scheduled their next review intervals for optimal memory retention.
              </Text>
              <TouchableOpacity
                style={[styles.finishBtn, { backgroundColor: colors.primary }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Finish Flashcard Session"
              >
                <Text style={[styles.finishBtnText, { color: colors.onPrimary }]}>Done & Save Progress</Text>
              </TouchableOpacity>
            </View>
          ) : cards.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="file-tray-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.completeTitle, { color: colors.text, marginTop: 12 }]}>No Cards Due Right Now</Text>
              <Text style={[styles.completeDesc, { color: colors.textMuted }]}>
                Great job! You are caught up with all your spaced repetition reviews.
              </Text>
            </View>
          ) : (
            <View style={styles.cardArea}>
              {/* Progress Bar */}
              <View style={styles.progressRow}>
                <Text style={[styles.progressText, { color: colors.textMuted }]}>
                  Card {currentIndex + 1} of {cards.length}
                </Text>
                <Text style={[styles.intervalText, { color: colors.textMuted }]}>
                  Interval: {currentCard.interval} {currentCard.interval === 1 ? 'day' : 'days'}
                </Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSubtle }]}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%`, backgroundColor: colors.primary }]} />
              </View>

              {/* Flashcard Box */}
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={handleFlip}
                style={[
                  styles.flashcard,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: isFlipped ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Flip flashcard"
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.sideBadge, { backgroundColor: isFlipped ? colors.primary : colors.surfaceSubtle }]}>
                    <Text
                      style={[
                        styles.sideBadgeText,
                        { color: isFlipped ? colors.onPrimary : colors.textMuted },
                      ]}
                    >
                      {isFlipped ? 'ANSWER' : 'QUESTION'}
                    </Text>
                  </View>
                  <Ionicons name="swap-horizontal-outline" size={18} color={colors.textMuted} />
                </View>

                <View style={styles.cardContent}>
                  <Text style={[styles.cardText, { color: colors.text }]}>
                    {isFlipped ? currentCard.answer : currentCard.question}
                  </Text>
                </View>

                <Text style={[styles.flipPrompt, { color: colors.textMuted }]}>
                  {isFlipped ? 'Tap to see question again' : 'Tap card to reveal answer'}
                </Text>
              </TouchableOpacity>

              {/* Rating Buttons (Shown only when flipped) */}
              {isFlipped ? (
                <View style={styles.ratingContainer}>
                  <Text style={[styles.ratingPrompt, { color: colors.textMuted }]}>
                    How easily did you remember?
                  </Text>
                  <View style={styles.ratingRow}>
                    <TouchableOpacity
                      style={[styles.rateBtn, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}
                      onPress={() => handleRate('again')}
                      accessibilityRole="button"
                      accessibilityLabel="Rate Again, review in 1 day"
                    >
                      <Text style={[styles.rateBtnLabel, { color: '#B91C1C' }]}>Again</Text>
                      <Text style={[styles.rateBtnInterval, { color: '#B91C1C' }]}>1d</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rateBtn, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
                      onPress={() => handleRate('hard')}
                      accessibilityRole="button"
                      accessibilityLabel="Rate Hard, review in 3 days"
                    >
                      <Text style={[styles.rateBtnLabel, { color: '#B45309' }]}>Hard</Text>
                      <Text style={[styles.rateBtnInterval, { color: '#B45309' }]}>3d</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rateBtn, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}
                      onPress={() => handleRate('good')}
                      accessibilityRole="button"
                      accessibilityLabel="Rate Good, normal interval"
                    >
                      <Text style={[styles.rateBtnLabel, { color: '#047857' }]}>Good</Text>
                      <Text style={[styles.rateBtnInterval, { color: '#047857' }]}>6d</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rateBtn, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]}
                      onPress={() => handleRate('easy')}
                      accessibilityRole="button"
                      accessibilityLabel="Rate Easy, longer interval"
                    >
                      <Text style={[styles.rateBtnLabel, { color: '#1D4ED8' }]}>Easy</Text>
                      <Text style={[styles.rateBtnInterval, { color: '#1D4ED8' }]}>14d</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.revealBtn, { backgroundColor: colors.primary }]}
                  onPress={handleFlip}
                  accessibilityRole="button"
                  accessibilityLabel="Reveal answer"
                >
                  <Text style={[styles.revealBtnText, { color: colors.onPrimary }]}>Show Answer</Text>
                </TouchableOpacity>
              )}
            </View>
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
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 8,
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
    flexShrink: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  trophyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  completeDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  finishBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardArea: {
    flex: 1,
    padding: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  intervalText: {
    fontSize: 12,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: shape.extraSmall,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: shape.extraSmall,
  },
  flashcard: {
    flex: 1,
    borderRadius: shape.largeIncreased,
    borderWidth: 1.5,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sideBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: shape.extraSmall,
    flexShrink: 0,
  },
  sideBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  cardText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
  },
  flipPrompt: {
    fontSize: 12,
    textAlign: 'center',
  },
  ratingContainer: {
    marginTop: 18,
  },
  ratingPrompt: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: shape.small,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  rateBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  rateBtnInterval: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  revealBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  revealBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
