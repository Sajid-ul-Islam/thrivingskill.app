import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { StudioArtifactType, Flashcard } from '../../types/notebookLM';
import { NotebookLMService } from '../../services/notebookLMService';

interface StudioGuideModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: StudioArtifactType;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const StudioGuideModal: React.FC<StudioGuideModalProps> = ({
  visible,
  onClose,
  initialType = 'study_guide',
}) => {
  const { colors, isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<StudioArtifactType>(initialType);

  // Data from service
  const studyGuide = NotebookLMService.getStudyGuide();
  const faq = NotebookLMService.getFAQ();
  const roadmap = NotebookLMService.getRoadmap();
  const flashcardsData = NotebookLMService.getFlashcards();

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  // Revealed exam review questions state
  const [revealedAnswers, setRevealedAnswers] = useState<{ [key: string]: boolean }>({});

  const toggleRevealAnswer = (key: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Thriving Skills NotebookLM Study Guide',
        message: `📑 Check out this AI-synthesized Study Guide & Flashcard deck generated from Thriving Skills verified course sources!`,
      });
    } catch {
      // ignore
    }
  };

  const currentCard: Flashcard | undefined = flashcardsData.cards[currentCardIndex];

  const handleNextCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcardsData.cards.length);
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) =>
      prev === 0 ? flashcardsData.cards.length - 1 : prev - 1
    );
  };

  const toggleMastered = (cardId: string) => {
    setMasteredIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Modal Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.titleCol}>
            <View style={styles.sparkleRow}>
              <Ionicons name="sparkles" size={13} color="#8B5CF6" />
              <Text style={styles.sparkleText}>NotebookLM Studio</Text>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedType === 'study_guide' && 'Comprehensive Study Guide'}
              {selectedType === 'faq' && 'Executive FAQ & Briefing'}
              {selectedType === 'roadmap' && '30-Day Skill Roadmap'}
              {selectedType === 'flashcards' && 'Active Recall Flashcards'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Studio Tabs Navigation */}
        <View style={[styles.tabBar, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            <TouchableOpacity
              style={[
                styles.tabPill,
                selectedType === 'study_guide' && [styles.tabPillActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setSelectedType('study_guide')}
            >
              <Ionicons
                name="document-text-outline"
                size={14}
                color={selectedType === 'study_guide' ? '#FFFFFF' : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabPillText,
                  { color: selectedType === 'study_guide' ? '#FFFFFF' : colors.text },
                ]}
              >
                Study Guide
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                selectedType === 'flashcards' && [styles.tabPillActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setSelectedType('flashcards')}
            >
              <Ionicons
                name="albums-outline"
                size={14}
                color={selectedType === 'flashcards' ? '#FFFFFF' : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabPillText,
                  { color: selectedType === 'flashcards' ? '#FFFFFF' : colors.text },
                ]}
              >
                Flashcards ({flashcardsData.cards.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                selectedType === 'faq' && [styles.tabPillActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setSelectedType('faq')}
            >
              <Ionicons
                name="help-circle-outline"
                size={14}
                color={selectedType === 'faq' ? '#FFFFFF' : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabPillText,
                  { color: selectedType === 'faq' ? '#FFFFFF' : colors.text },
                ]}
              >
                Executive FAQ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                selectedType === 'roadmap' && [styles.tabPillActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setSelectedType('roadmap')}
            >
              <Ionicons
                name="map-outline"
                size={14}
                color={selectedType === 'roadmap' ? '#FFFFFF' : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabPillText,
                  { color: selectedType === 'roadmap' ? '#FFFFFF' : colors.text },
                ]}
              >
                Skill Roadmap
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Studio Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* VIEW: STUDY GUIDE */}
          {selectedType === 'study_guide' && (
            <View style={styles.guideContainer}>
              <View style={[styles.bannerCard, { backgroundColor: isDark ? '#111D33' : '#E8EEF5' }]}>
                <Text style={[styles.bannerTitle, { color: colors.primary }]}>{studyGuide.title}</Text>
                <Text style={[styles.bannerSub, { color: colors.textMuted }]}>{studyGuide.subtitle}</Text>
              </View>

              {studyGuide.sections.map((sec, sIdx) => (
                <View
                  key={sIdx}
                  style={[styles.sectionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{sec.title}</Text>
                  <Text style={[styles.sectionSummary, { color: colors.textMuted }]}>{sec.summary}</Text>

                  {/* Key Concepts */}
                  <View style={styles.conceptsList}>
                    <Text style={[styles.subHeading, { color: colors.text }]}>🔑 Key Concepts</Text>
                    {sec.keyConcepts.map((kc, kIdx) => (
                      <View key={kIdx} style={styles.bulletRow}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={[styles.bulletText, { color: colors.text }]}>{kc}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Formulas or Frameworks */}
                  {sec.formulasOrFrameworks && (
                    <View style={styles.formulaBox}>
                      <Text style={[styles.subHeading, { color: colors.text }]}>📐 Formulas & Prompt Sandboxes</Text>
                      {sec.formulasOrFrameworks.map((f, fIdx) => (
                        <View key={fIdx} style={[styles.codeBlock, { backgroundColor: isDark ? '#0B1220' : '#F1F5F9' }]}>
                          <Text style={[styles.codeText, { color: colors.text }]}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Exam Review Question */}
                  {sec.examReviewQuestions.map((q, qIdx) => {
                    const qKey = `sec-${sIdx}-q-${qIdx}`;
                    const isRevealed = revealedAnswers[qKey];

                    return (
                      <View key={qIdx} style={[styles.reviewQBox, { borderColor: colors.border }]}>
                        <View style={styles.qHeader}>
                          <Ionicons name="help-circle" size={16} color="#F59E0B" />
                          <Text style={[styles.qText, { color: colors.text }]}>{q.question}</Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.revealBtn, { backgroundColor: colors.surfaceSubtle }]}
                          onPress={() => toggleRevealAnswer(qKey)}
                        >
                          <Text style={[styles.revealBtnText, { color: colors.primary }]}>
                            {isRevealed ? 'Hide Answer' : '💡 Reveal Answer'}
                          </Text>
                        </TouchableOpacity>

                        {isRevealed && (
                          <View style={styles.answerBox}>
                            <Text style={[styles.answerText, { color: colors.text }]}>{q.answer}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Glossary */}
              <View style={[styles.glossaryCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <Text style={[styles.glossaryTitle, { color: colors.text }]}>📚 Executive Glossary</Text>
                {studyGuide.glossary.map((g, gIdx) => (
                  <View key={gIdx} style={[styles.glossaryRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.glossaryTerm, { color: colors.primary }]}>{g.term}</Text>
                    <Text style={[styles.glossaryDef, { color: colors.text }]}>{g.definition}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* VIEW: FLASHCARDS (Interactive Flip Cards) */}
          {selectedType === 'flashcards' && currentCard && (
            <View style={styles.flashcardsContainer}>
              {/* Progress and Stats Header */}
              <View style={styles.flashcardProgressRow}>
                <Text style={[styles.cardCounter, { color: colors.textMuted }]}>
                  Card {currentCardIndex + 1} of {flashcardsData.cards.length}
                </Text>
                <View style={styles.masteredBadge}>
                  <Ionicons name="ribbon" size={14} color="#10B981" />
                  <Text style={styles.masteredText}>
                    {masteredIds.length} Mastered
                  </Text>
                </View>
              </View>

              {/* Flippable Card */}
              <TouchableOpacity
                style={[
                  styles.flashcard,
                  {
                    backgroundColor: isCardFlipped
                      ? isDark
                        ? '#162238'
                        : '#EFF6FF'
                      : colors.surfaceCard,
                    borderColor: isCardFlipped ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.9}
                onPress={() => setIsCardFlipped(!isCardFlipped)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.catBadge, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.catBadgeText, { color: colors.primary }]}>
                      {currentCard.category}
                    </Text>
                  </View>
                  <Text style={[styles.cardSourceHint, { color: colors.textMuted }]}>
                    {currentCard.sourceTitle}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={[styles.flipInstruction, { color: colors.textMuted }]}>
                    {isCardFlipped ? 'REVEALED ANSWER' : 'QUESTION (TAP TO FLIP)'}
                  </Text>
                  <Text style={[styles.cardMainText, { color: colors.text }]}>
                    {isCardFlipped ? currentCard.answer : currentCard.question}
                  </Text>
                  {!isCardFlipped && currentCard.hint && (
                    <View style={styles.hintRow}>
                      <Ionicons name="bulb-outline" size={14} color="#F59E0B" />
                      <Text style={[styles.hintText, { color: colors.textMuted }]}>
                        Hint: {currentCard.hint}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Ionicons name="sync" size={14} color={colors.textMuted} />
                  <Text style={[styles.flipNotice, { color: colors.textMuted }]}>
                    Tap anywhere to flip
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Mastered Toggle Button */}
              <TouchableOpacity
                style={[
                  styles.masteredBtn,
                  masteredIds.includes(currentCard.id)
                    ? { backgroundColor: '#10B981' }
                    : { backgroundColor: colors.surfaceSubtle },
                ]}
                onPress={() => toggleMastered(currentCard.id)}
              >
                <Ionicons
                  name={masteredIds.includes(currentCard.id) ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={18}
                  color={masteredIds.includes(currentCard.id) ? '#FFFFFF' : colors.text}
                />
                <Text
                  style={[
                    styles.masteredBtnText,
                    { color: masteredIds.includes(currentCard.id) ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {masteredIds.includes(currentCard.id) ? 'Marked as Mastered' : 'Mark as Mastered'}
                </Text>
              </TouchableOpacity>

              {/* Navigation Controls */}
              <View style={styles.cardNavRow}>
                <TouchableOpacity
                  style={[styles.cardNavBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                  onPress={handlePrevCard}
                >
                  <Ionicons name="arrow-back" size={18} color={colors.text} />
                  <Text style={[styles.cardNavText, { color: colors.text }]}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cardNavBtn, { backgroundColor: colors.primary }]}
                  onPress={handleNextCard}
                >
                  <Text style={[styles.cardNavText, { color: '#FFFFFF' }]}>Next Card</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* VIEW: EXECUTIVE FAQ */}
          {selectedType === 'faq' && (
            <View style={styles.faqContainer}>
              <View style={[styles.bannerCard, { backgroundColor: isDark ? '#111D33' : '#E8EEF5' }]}>
                <Text style={[styles.bannerTitle, { color: colors.primary }]}>{faq.title}</Text>
                <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
                  High-impact executive questions answered strictly from verified course data
                </Text>
              </View>

              {faq.items.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.faqCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                >
                  <View style={styles.faqHeader}>
                    <Ionicons name="help-circle" size={18} color={colors.primary} />
                    <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
                  </View>
                  <Text style={[styles.faqAnswer, { color: colors.text }]}>{item.answer}</Text>
                  <View style={styles.faqCitation}>
                    <Ionicons name="bookmark-outline" size={12} color="#10B981" />
                    <Text style={styles.faqCitationText}>{item.sourceCitation}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* VIEW: 30-DAY SKILL ROADMAP */}
          {selectedType === 'roadmap' && (
            <View style={styles.roadmapContainer}>
              <View style={[styles.bannerCard, { backgroundColor: isDark ? '#111D33' : '#E8EEF5' }]}>
                <Text style={[styles.bannerTitle, { color: colors.primary }]}>{roadmap.title}</Text>
                <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
                  Target Track: {roadmap.targetRole}
                </Text>
              </View>

              {roadmap.milestones.map((ms, idx) => (
                <View
                  key={idx}
                  style={[styles.milestoneCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                >
                  <View style={styles.msWeekBadge}>
                    <Text style={styles.msWeekText}>{ms.week}</Text>
                  </View>
                  <Text style={[styles.msTitle, { color: colors.text }]}>{ms.title}</Text>

                  <View style={styles.msSkillsRow}>
                    {ms.skills.map((sk, sIdx) => (
                      <View key={sIdx} style={[styles.skillChip, { backgroundColor: colors.surfaceSubtle }]}>
                        <Text style={[styles.skillChipText, { color: colors.primary }]}>{sk}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.msCourseRow, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}>
                    <Ionicons name="school-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.msCourseText, { color: colors.textMuted }]}>
                      Recommended Course: <Text style={{ color: colors.text, fontWeight: '700' }}>{ms.recommendedCourse}</Text>
                    </Text>
                  </View>

                  <View style={styles.msOutcomeRow}>
                    <Ionicons name="trophy-outline" size={14} color="#F59E0B" />
                    <Text style={[styles.msOutcomeText, { color: colors.text }]}>
                      Target Outcome: {ms.outcome}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sparkleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  tabBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabPillActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  guideContainer: {
    gap: 14,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSummary: {
    fontSize: 13,
    lineHeight: 19,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  conceptsList: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  formulaBox: {
    gap: 6,
  },
  codeBlock: {
    padding: 12,
    borderRadius: 10,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  reviewQBox: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
    gap: 8,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  qText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  revealBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  revealBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  answerBox: {
    padding: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  answerText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  glossaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  glossaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  glossaryRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 2,
  },
  glossaryTerm: {
    fontSize: 13,
    fontWeight: '800',
  },
  glossaryDef: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  flashcardsContainer: {
    alignItems: 'center',
    gap: 16,
  },
  flashcardProgressRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCounter: {
    fontSize: 13,
    fontWeight: '600',
  },
  masteredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  masteredText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  flashcard: {
    width: '100%',
    minHeight: 280,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardSourceHint: {
    fontSize: 11,
  },
  cardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 12,
  },
  flipInstruction: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardMainText: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 25,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  flipNotice: {
    fontSize: 11,
  },
  masteredBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  masteredBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardNavRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardNavText: {
    fontSize: 14,
    fontWeight: '700',
  },
  faqContainer: {
    gap: 12,
  },
  faqCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 20,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
  },
  faqCitation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  faqCitationText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  roadmapContainer: {
    gap: 12,
  },
  milestoneCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  msWeekBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFB606',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  msWeekText: {
    color: '#102F53',
    fontSize: 11,
    fontWeight: '800',
  },
  msTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  msSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  msCourseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  msCourseText: {
    fontSize: 12,
  },
  msOutcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  msOutcomeText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
});
