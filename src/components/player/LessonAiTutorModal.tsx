import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { AiTutorService, AiTutorContext, TutorMessage } from '../../services/ai/aiTutorService';
import { AiAssessmentService } from '../../services/ai/aiAssessmentService';

interface LessonAiTutorModalProps {
  visible: boolean;
  context: AiTutorContext;
  onClose: () => void;
}

export const LessonAiTutorModal: React.FC<LessonAiTutorModalProps> = ({
  visible,
  context,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [nanoStatus, setNanoStatus] = useState<string>('Gemini Nano On-Device');
  const [isNanoOfflineReady, setIsNanoOfflineReady] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, []);

  const scheduleScrollToEnd = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Load chat history & on-device Gemini Nano status when opened
  useEffect(() => {
    if (visible) {
      AiTutorService.getExecutionStatus().then((status) => {
        setIsNanoOfflineReady(status.isSupported);
        setNanoStatus(
          status.isSupported
            ? 'Gemini Nano (Offline ⚡)'
            : 'AI Edge Hybrid'
        );
      });

      AiTutorService.getSmartReplies('', isBangla).then(setSmartReplies);

      if (context.lessonId) {
        AiTutorService.getStoredHistory(context.lessonId).then((history) => {
          if (history.length > 0) {
            setMessages(history);
          } else {
            // Welcome message
            const welcomeMsg: TutorMessage = {
              id: 'welcome',
              role: 'assistant',
              content: isBangla
                ? `স্বাগতম! আমি "SkillBot", আপনার অন-ডিভাইস এআই লার্নিং টিউটর (Gemini Nano Powered)।\n\n"${context.lessonTitle}" লেকচার নিয়ে যেকোনো প্রশ্ন বা কনসেপ্ট পরিষ্কার করতে নিচে লিখুন অথবা দ্রুত বাটনগুলোতে ট্যাপ করুন। এটি ১০০% অফলাইনেও কাজ করে!`
                : `Welcome! I'm "SkillBot", your in-lecture AI copilot powered by Gemini Nano on-device.\n\nAsk me anything about "${context.lessonTitle}", summarize key points, or tap one of the suggested prompts below to get started—even 100% offline!`,
              timestamp: Date.now(),
            };
            setMessages([welcomeMsg]);
          }
        });
      }
    }
  }, [visible, context.lessonId, isBangla, context.lessonTitle]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isThinking) return;

    triggerHaptic('light');
    const userMsg: TutorMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsThinking(true);

    scheduleScrollToEnd();

    try {
      const answer = await AiTutorService.askTutor(text, context, newHistory, isBangla);
      const assistantMsg: TutorMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: Date.now(),
      };
      const finalHistory = [...newHistory, assistantMsg];
      setMessages(finalHistory);
      AiTutorService.saveHistory(context.lessonId, finalHistory);
      AiTutorService.getSmartReplies(answer, isBangla).then(setSmartReplies);
    } catch {
      const errorMsg: TutorMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: isBangla
          ? 'দুঃখিত, সংযোগ সমস্যার কারণে উত্তর পেতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Unable to reach AI tutor service right now. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
      scheduleScrollToEnd();
    }
  };

  const handleSummarizeLecture = async () => {
    if (isThinking) return;
    triggerHaptic('medium');
    setIsThinking(true);
    const content = context.lessonSummary || context.lessonTitle;
    try {
      const res = await AiTutorService.summarizeLectureOnDevice(content, isBangla);
      const summaryMsg: TutorMessage = {
        id: `summary-${Date.now()}`,
        role: 'assistant',
        content: res.summary,
        timestamp: Date.now(),
      };
      const finalHistory = [...messages, summaryMsg];
      setMessages(finalHistory);
      AiTutorService.saveHistory(context.lessonId, finalHistory);
      AiTutorService.getSmartReplies(res.summary, isBangla).then(setSmartReplies);
    } catch {}
    finally {
      setIsThinking(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleGenerateCheatSheet = () => {
    if (isThinking) return;
    triggerHaptic('medium');
    const sheet = AiAssessmentService.generateCheatSheet(context, isBangla);
    const content = isBangla
      ? `📋 **"${sheet.lessonTitle}" লেকচার চিটশিট:**\n\n` +
        `**মূল পয়েন্টসমূহ:**\n${sheet.takeaways.map((t) => `• ${t}`).join('\n')}\n\n` +
        `**কাজের সূত্র:**\n${sheet.practicalFormula}\n\n` +
        `**অ্যাকশন স্টেপ:**\n${sheet.actionItem}`
      : `📋 **"${sheet.lessonTitle}" Executive Cheat-Sheet:**\n\n` +
        `**Key Takeaways:**\n${sheet.takeaways.map((t) => `• ${t}`).join('\n')}\n\n` +
        `**Practical Formula:**\n${sheet.practicalFormula}\n\n` +
        `**Immediate Action Item:**\n${sheet.actionItem}`;

    const cheatMsg: TutorMessage = {
      id: `cheat-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    const finalHistory = [...messages, cheatMsg];
    setMessages(finalHistory);
    AiTutorService.saveHistory(context.lessonId, finalHistory);
    scheduleScrollToEnd();
  };

  const handleDiagnosticQuiz = async () => {
    if (isThinking) return;
    triggerHaptic('medium');
    setIsThinking(true);
    try {
      const quiz = await AiAssessmentService.generateDiagnosticQuiz(context, isBangla);
      const quizContent = isBangla
        ? `🎯 **"${context.lessonTitle}" ডায়াগনস্টিক কুইজ (${quiz.length}টি প্রশ্ন):**\n\n` +
          quiz
            .map(
              (q, i) =>
                `**প্রশ্ন ${i + 1}: ${q.question}**\n` +
                q.options.map((opt, oi) => `  ${String.fromCharCode(65 + oi)}) ${opt}`).join('\n') +
                `\n*সঠিক উত্তর:* ${String.fromCharCode(65 + q.correctIndex)}) ${q.options[q.correctIndex]}\n*ব্যাখ্যা:* ${q.explanation}`
            )
            .join('\n\n')
        : `🎯 **"${context.lessonTitle}" Comprehension Check (${quiz.length} Questions):**\n\n` +
          quiz
            .map(
              (q, i) =>
                `**Question ${i + 1}: ${q.question}**\n` +
                q.options.map((opt, oi) => `  ${String.fromCharCode(65 + oi)}) ${opt}`).join('\n') +
                `\n*Answer:* ${String.fromCharCode(65 + q.correctIndex)}) ${q.options[q.correctIndex]}\n*Rationale:* ${q.explanation}`
            )
            .join('\n\n');

      const quizMsg: TutorMessage = {
        id: `quiz-${Date.now()}`,
        role: 'assistant',
        content: quizContent,
        timestamp: Date.now(),
      };
      const finalHistory = [...messages, quizMsg];
      setMessages(finalHistory);
      AiTutorService.saveHistory(context.lessonId, finalHistory);
    } catch {
    } finally {
      setIsThinking(false);
      scheduleScrollToEnd();
    }
  };

  const handleClearHistory = () => {
    triggerHaptic('warning');
    AiTutorService.clearHistory(context.lessonId);
    setMessages([]);
  };

  const QUICK_PROMPTS = isBangla
    ? [
        { label: 'সহজ বাংলায় মূল বিষয়', query: 'সহজ বাংলায় এই লেকচারের মূল বিষয় বুঝিয়ে বলুন।' },
        { label: '৩টি পয়েন্টে সামারি', query: '৩টি পয়েন্টে এই লেকচার সামারি করুন।' },
        { label: 'বাস্তব কর্মক্ষেত্রে প্রয়োগ', query: 'বাস্তব কর্মক্ষেত্রে এটি কিভাবে প্রয়োগ করব?' },
        { label: 'অনুশীলন প্রশ্ন', query: 'এই লেকচার থেকে গুরুত্বপূর্ণ কুইজ বা প্রশ্ন কী?' },
      ]
    : [
        { label: 'Explain Simply', query: 'Explain the core concept of this lecture in simple terms.' },
        { label: '3-Point Summary', query: 'Summarize this lesson in 3 actionable bullet points.' },
        { label: 'Workplace Application', query: 'How do I apply this concept in real executive workplace scenarios?' },
        { label: 'Practice Quiz', query: 'Give me a key self-assessment question based on this lecture.' },
      ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.botIconCircle, { backgroundColor: isDark ? '#1E293B' : 'rgba(227, 66, 52, 0.12)' }]}>
                <Ionicons name="sparkles" size={18} color="#E34234" />
              </View>
              <View style={styles.headerTitleWrap}>
                <View style={styles.headerBadgeRow}>
                  <Text style={[styles.botName, { color: colors.text }]}>SkillBot Copilot</Text>
                  <View
                    style={[
                      styles.aiBadge,
                      {
                        backgroundColor: isNanoOfflineReady
                          ? 'rgba(16, 185, 129, 0.16)'
                          : 'rgba(227, 66, 52, 0.12)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isNanoOfflineReady ? 'flash' : 'sparkles'}
                      size={10}
                      color={isNanoOfflineReady ? '#059669' : '#E34234'}
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={[
                        styles.aiBadgeText,
                        { color: isNanoOfflineReady ? '#059669' : '#E34234' },
                      ]}
                    >
                      {nanoStatus}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.lessonSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {context.lessonTitle}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={handleClearHistory}
                style={styles.headerActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear chat"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={styles.headerActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Close tutor"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Prompt Suggestions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptScroll}
          >
            {/* On-Device Gemini Nano Quick Summarize Button */}
            <TouchableOpacity
              style={[
                styles.quickPromptPill,
                {
                  backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                  borderColor: isDark ? '#059669' : '#A7F3D0',
                },
              ]}
              onPress={handleSummarizeLecture}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'অন-ডিভাইস লেকচার সামারি' : 'On-Device Lecture Summary'}
            >
              <Ionicons name="sparkles" size={12} color="#059669" />
              <Text style={[styles.quickPromptText, { color: '#059669', fontWeight: '700' }]}>
                {isBangla ? '⚡ লেকচার সামারি' : '⚡ Summarize'}
              </Text>
            </TouchableOpacity>

            {/* AI Executive Cheat-Sheet Button */}
            <TouchableOpacity
              style={[
                styles.quickPromptPill,
                {
                  backgroundColor: isDark ? '#312E81' : '#EEF2FF',
                  borderColor: isDark ? '#4338CA' : '#C7D2FE',
                },
              ]}
              onPress={handleGenerateCheatSheet}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'লেকচার চিটশিট' : 'Lecture Cheat-Sheet'}
            >
              <Ionicons name="document-text" size={12} color="#6366F1" />
              <Text style={[styles.quickPromptText, { color: '#6366F1', fontWeight: '700' }]}>
                {isBangla ? '📋 চিটশিট' : '📋 Cheat-Sheet'}
              </Text>
            </TouchableOpacity>

            {/* AI Diagnostic Comprehension Quiz Button */}
            <TouchableOpacity
              style={[
                styles.quickPromptPill,
                {
                  backgroundColor: isDark ? '#4C1D95' : '#F5F3FF',
                  borderColor: isDark ? '#6D28D9' : '#DDD6FE',
                },
              ]}
              onPress={handleDiagnosticQuiz}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'ডায়াগনস্টিক কুইজ' : 'Diagnostic Quiz'}
            >
              <Ionicons name="help-circle" size={12} color="#8B5CF6" />
              <Text style={[styles.quickPromptText, { color: '#8B5CF6', fontWeight: '700' }]}>
                {isBangla ? '🎯 টেস্ট কুইজ' : '🎯 Quick Quiz'}
              </Text>
            </TouchableOpacity>

            {QUICK_PROMPTS.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.quickPromptPill,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                    borderColor: isDark ? '#334155' : '#BFDBFE',
                  },
                ]}
                onPress={() => handleSendMessage(p.query)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={p.label}
              >
                <Ionicons name="flash-outline" size={12} color={colors.primary} />
                <Text style={[styles.quickPromptText, { color: colors.primary }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Message Thread */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <View
                  key={m.id}
                  style={[
                    styles.messageRow,
                    isUser ? styles.messageRowUser : styles.messageRowBot,
                  ]}
                >
                  {!isUser && (
                    <View style={styles.botAvatarCircle}>
                      <Ionicons name="sparkles" size={12} color="#E34234" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? [styles.bubbleUser, { backgroundColor: colors.primary }]
                        : [
                            styles.bubbleBot,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                              borderColor: colors.border,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: isUser ? colors.onPrimary : colors.text },
                      ]}
                      selectable
                    >
                      {m.content}
                    </Text>
                  </View>
                </View>
              );
            })}

            {isThinking && (
              <View style={[styles.messageRow, styles.messageRowBot]}>
                <View style={styles.botAvatarCircle}>
                  <Ionicons name="sparkles" size={12} color="#E34234" />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleBot,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    },
                  ]}
                >
                  <ActivityIndicator size="small" color="#E34234" />
                  <Text style={[styles.thinkingText, { color: colors.textMuted }]}>
                    {isBangla ? 'SkillBot বিশ্লেষণ করছে…' : 'SkillBot is thinking…'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Smart Reply Suggestions (Powered by Gemini Nano) */}
          {smartReplies.length > 0 && !isThinking && (
            <View style={styles.smartRepliesContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.smartRepliesScroll}
              >
                {smartReplies.map((reply, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.smartReplyChip,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    onPress={() => handleSendMessage(reply)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={reply}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={11} color={colors.primary} />
                    <Text style={[styles.smartReplyText, { color: colors.text }]}>{reply}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { borderTopColor: colors.border, paddingBottom: Math.max(12, insets.bottom) }]}>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={
                isBangla
                  ? 'এই লেকচার নিয়ে যেকোনো প্রশ্ন লিখুন…'
                  : 'Ask any question about this lecture…'
              }
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
              multiline
              maxLength={400}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputText.trim() ? colors.primary : colors.surfaceSubtle,
                  opacity: inputText.trim() ? 1 : 0.6,
                },
              ]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isThinking}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Send question"
            >
              <Ionicons
                name="send"
                size={16}
                color={inputText.trim() ? colors.onPrimary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    height: '82%',
    display: 'flex',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  botIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botName: {
    fontSize: 15,
    fontWeight: '800',
  },
  aiBadge: {
    backgroundColor: '#E34234',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lessonSub: {
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    padding: 6,
  },
  quickPromptScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickPromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messagesScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 12,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  botAvatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#102F53',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  bubbleUser: {
    borderBottomRightRadius: 2,
  },
  bubbleBot: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  thinkingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 80,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartRepliesContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  smartRepliesScroll: {
    gap: 8,
    alignItems: 'center',
  },
  smartReplyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  smartReplyText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
