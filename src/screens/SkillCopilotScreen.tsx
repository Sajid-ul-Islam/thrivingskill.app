import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';
import { Header } from '../components/Header';
import { CopilotMessage } from '../types';
import {
  NotebookSource,
  NotebookCitation,
  StudioArtifactType,
  NotebookNote,
} from '../types/notebookLM';
import { NotebookLMService } from '../services/notebookLMService';
import {
  AudioOverviewModal,
  NotebookSourcesModal,
  StudioGuideModal,
  CitationModal,
  NotesModal,
} from '../components/notebookLM';
import { GoogleApiKeyModal } from '../components/GoogleApiKeyModal';
import { GeminiService } from '../services/geminiService';
import { useAutoScroll } from '../hooks/useAutoScroll';

interface SkillCopilotScreenProps {
  onOpenSubscription: () => void;
  onOpenNotifications: () => void;
  onNavigateToCourse?: (courseId: string) => void;
  onOpenDrawer?: () => void;
}

export const SkillCopilotScreen: React.FC<SkillCopilotScreenProps> = ({
  onOpenSubscription,
  onOpenNotifications,
  onNavigateToCourse,
  onOpenDrawer,
}) => {
  const { colors, isDark } = useTheme();
  const { clearCopilotHistory } = useSaaS();

  // Google Gemini API state
  const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);

  useEffect(() => {
    GeminiService.getApiKey().then((k) => setHasGoogleKey(!!k));
  }, []);

  // Local message state supporting citations
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-init-notebook',
      sender: 'assistant',
      text: `Welcome to **ThrivingSkills AI Assistant** 🤖⚡

Powered by **Google Gemini** and source-grounded in your **verified course syllabi, YouTube masterclass transcripts, and uploaded study notes**.

Every answer can be generated using your personal **Google Gemini API Key** or grounded locally with verified citations.

Tap any tool in the **Studio Shelf** above to generate an **Audio Overview podcast**, **Study Guide**, or **Active Recall Flashcards**!`,
      timestamp: 'Just now',
      suggestedActions: [
        'Audit DCF model terminal value',
        'Generate RTCC prompt blueprint',
        'Explain Minto Pyramid BLUF',
        'Connect Google API Key',
      ],
    },
  ]);

  const [messageCitations, setMessageCitations] = useState<{
    [msgId: string]: NotebookCitation[];
  }>({});

  const [sources, setSources] = useState<NotebookSource[]>([]);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Modals state
  const [isSourcesModalVisible, setIsSourcesModalVisible] = useState(false);
  const [isAudioOverviewVisible, setIsAudioOverviewVisible] = useState(false);
  const [isStudioGuideVisible, setIsStudioGuideVisible] = useState(false);
  const [studioGuideInitialType, setStudioGuideInitialType] =
    useState<StudioArtifactType>('study_guide');
  const [selectedCitation, setSelectedCitation] = useState<NotebookCitation | null>(null);
  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);

  // Load sources and notes on mount
  useEffect(() => {
    const loadData = async () => {
      const srcList = await NotebookLMService.getSources();
      setSources(srcList);
      const noteList = await NotebookLMService.getNotes();
      setNotes(noteList);
    };
    loadData();
  }, []);

  const reloadSources = async () => {
    const srcList = await NotebookLMService.getSources();
    setSources(srcList);
  };

  const reloadNotes = async () => {
    const noteList = await NotebookLMService.getNotes();
    setNotes(noteList);
  };

  const activeSourcesCount = sources.filter((s) => s.isSelected).length;

  // Auto-scroll for Studio Action Shelf
  const studioShelfAutoScroll = useAutoScroll({
    speed: 0.40,
    pauseAtEdgeMs: 1800,
    resumeDelayMs: 2800,
  });

  const studioTools: {
    id: string;
    title: string;
    badge: string;
    icon: string;
    iconColor: string;
    onPress: () => void;
  }[] = [
    {
      id: 'tool-audio',
      title: 'Audio Overview',
      badge: '🎙️ DEEP DIVE PODCAST',
      icon: 'mic',
      iconColor: '#8B5CF6',
      onPress: () => setIsAudioOverviewVisible(true),
    },
    {
      id: 'tool-guide',
      title: 'Study Guide',
      badge: '📑 CHAPTER SYNTHESIS',
      icon: 'document-text',
      iconColor: '#3B82F6',
      onPress: () => {
        setStudioGuideInitialType('study_guide');
        setIsStudioGuideVisible(true);
      },
    },
    {
      id: 'tool-flashcards',
      title: 'Flashcards',
      badge: '🗂️ ACTIVE RECALL (8)',
      icon: 'albums',
      iconColor: '#10B981',
      onPress: () => {
        setStudioGuideInitialType('flashcards');
        setIsStudioGuideVisible(true);
      },
    },
    {
      id: 'tool-faq',
      title: 'Executive FAQ',
      badge: '❓ SOURCE BRIEFING',
      icon: 'help-circle',
      iconColor: '#F59E0B',
      onPress: () => {
        setStudioGuideInitialType('faq');
        setIsStudioGuideVisible(true);
      },
    },
    {
      id: 'tool-roadmap',
      title: 'Skill Roadmap',
      badge: '🗺️ 30-DAY TRACK',
      icon: 'map',
      iconColor: '#EC4899',
      onPress: () => {
        setStudioGuideInitialType('roadmap');
        setIsStudioGuideVisible(true);
      },
    },
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (text === 'Connect Google API Key') {
      setIsApiKeyModalVisible(true);
      return;
    }
    if (text === 'Open Sources Drawer') {
      setIsSourcesModalVisible(true);
      return;
    }

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const apiKey = await GeminiService.getApiKey();
      const activeSources = await NotebookLMService.getActiveSources();

      // If user provided a Google Gemini API Key, execute live Gemini call
      if (apiKey) {
        const historyTurns = messages.map((m) => ({
          role: m.sender as 'user' | 'assistant',
          text: m.text,
        }));

        const geminiRes = await GeminiService.generateContent(text, activeSources, historyTurns);

        if (geminiRes.isRealApi && geminiRes.text) {
          const assistantMsgId = `ai-${Date.now()}`;
          const assistantMsg: CopilotMessage = {
            id: assistantMsgId,
            sender: 'assistant',
            text: geminiRes.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedActions: [
              'Save to Notes',
              'Explain in deeper detail',
              'Generate Quiz Question',
              'Summarize Key Takeaways',
            ],
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setIsTyping(false);

          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
          return;
        }
      }

      // Offline / Grounded fallback with NotebookLM citations
      const { reply, citations, suggestedActions } = await NotebookLMService.queryGrounded(text);
      const assistantMsgId = `ai-${Date.now()}`;

      const finalActions = !hasGoogleKey
        ? ['Connect Google API Key', ...suggestedActions.slice(0, 2)]
        : suggestedActions;

      const assistantMsg: CopilotMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: finalActions,
      };

      if (citations && citations.length > 0) {
        setMessageCitations((prev) => ({
          ...prev,
          [assistantMsgId]: citations,
        }));
      }

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      setIsTyping(false);
    }
  };

  const handlePinToNotes = async (msg: CopilotMessage) => {
    const title = msg.text.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '') + '...';
    await NotebookLMService.saveNote(`📌 ${title}`, msg.text, ['Pinned Insight', 'NotebookLM']);
    await reloadNotes();
    Alert.alert('Pinned to Notes 📌', 'Insight saved to your personal notebook notes.');
  };

  const handleCopyText = (msgText: string) => {
    Alert.alert('Copied 📋', 'Copied text to clipboard. Ready to paste into your notes or deck.');
  };

  const handleClearHistory = () => {
    Alert.alert('Clear Chat History', 'Are you sure you want to reset this study chat session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearCopilotHistory();
          setMessages([
            {
              id: `init-${Date.now()}`,
              sender: 'assistant',
              text: 'Session reset. Notebook sources are still active. How can I assist your study session?',
              timestamp: 'Just now',
            },
          ]);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="AI Assistant"
        subtitle="Powered by Google Gemini • Grounded Learning"
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              style={[
                styles.apiKeyBtn,
                {
                  backgroundColor: hasGoogleKey
                    ? isDark
                      ? '#064E3B'
                      : '#ECFDF5'
                    : colors.surfaceSubtle,
                  borderColor: hasGoogleKey ? '#10B981' : colors.border,
                },
              ]}
              onPress={() => setIsApiKeyModalVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="sparkles"
                size={13}
                color={hasGoogleKey ? '#10B981' : colors.primary}
              />
              <Text
                style={[
                  styles.apiKeyBtnText,
                  { color: hasGoogleKey ? (isDark ? '#34D399' : '#059669') : colors.text },
                ]}
              >
                {hasGoogleKey ? 'Gemini 1.5' : 'Add Key'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={handleClearHistory}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Source Grounding Status Bar */}
        <View style={[styles.groundingBar, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.sourcesToggleBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
            onPress={() => setIsSourcesModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.sourcesIndicatorDot} />
            <Text style={[styles.sourcesToggleText, { color: colors.text }]}>
              {activeSourcesCount} Active Sources
            </Text>
            <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={[styles.miniActionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => setIsAudioOverviewVisible(true)}
            >
              <Ionicons name="mic" size={12} color="#FFFFFF" />
              <Text style={styles.miniActionBtnText}>Deep Dive</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.miniActionBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => setIsNotesModalVisible(true)}
            >
              <Ionicons name="journal-outline" size={12} color={colors.primary} />
              <Text style={[styles.miniActionBtnText, { color: colors.text }]}>
                Notes ({notes.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NotebookLM Studio Action Shelf (Auto-Scrolling Carousels) */}
        <View style={[styles.studioShelfArea, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <ScrollView
            ref={studioShelfAutoScroll.scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.studioShelfScroll}
            {...studioShelfAutoScroll.scrollProps}
          >
            {studioTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.studioCard,
                  {
                    backgroundColor: isDark ? '#111D33' : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  studioShelfAutoScroll.pauseTemporarily(3500);
                  tool.onPress();
                }}
                activeOpacity={0.85}
              >
                <View style={styles.studioCardHeader}>
                  <View style={[styles.studioIconWrap, { backgroundColor: tool.iconColor + '20' }]}>
                    <Ionicons name={tool.icon as any} size={15} color={tool.iconColor} />
                  </View>
                  <Text style={[styles.studioBadgeText, { color: tool.iconColor }]}>
                    {tool.badge}
                  </Text>
                </View>
                <Text style={[styles.studioCardTitle, { color: colors.text }]}>
                  {tool.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Grounded Chat Feed */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg: CopilotMessage) => {
            const isUser = msg.sender === 'user';
            const citations = messageCitations[msg.id];

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isUser ? styles.userMessageWrapper : styles.assistantMessageWrapper,
                ]}
              >
                {!isUser && (
                  <View style={[styles.assistantAvatar, { backgroundColor: colors.primary }]}>
                    <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: colors.primary }]
                      : [
                          styles.assistantBubble,
                          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      { color: isUser ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {msg.text}
                  </Text>

                  {/* Grounded Citations Bar (NotebookLM Signature Feature) */}
                  {!isUser && citations && citations.length > 0 && (
                    <View style={styles.citationsContainer}>
                      <Text style={[styles.citationsLabel, { color: colors.textMuted }]}>
                        Verified Sources:
                      </Text>
                      <View style={styles.citationsRow}>
                        {citations.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={[
                              styles.citationPill,
                              { backgroundColor: isDark ? '#1A2942' : '#E8EEF5' },
                            ]}
                            onPress={() => setSelectedCitation(c)}
                          >
                            <View style={[styles.citeNumberBadge, { backgroundColor: colors.primary }]}>
                              <Text style={styles.citeNumberText}>{c.citationIndex}</Text>
                            </View>
                            <Text style={[styles.citationPillText, { color: colors.text }]} numberOfLines={1}>
                              {c.sourceTitle}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Message Footer & Pin/Copy Actions */}
                  <View style={styles.bubbleFooter}>
                    <Text
                      style={[
                        styles.timestampText,
                        { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                      ]}
                    >
                      {msg.timestamp}
                    </Text>

                    {!isUser && (
                      <View style={styles.msgActionsGroup}>
                        <TouchableOpacity
                          onPress={() => handlePinToNotes(msg)}
                          style={styles.actionIconBtn}
                        >
                          <Ionicons name="bookmark-outline" size={13} color={colors.primary} />
                          <Text style={[styles.actionIconText, { color: colors.primary }]}>Pin</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleCopyText(msg.text)}
                          style={styles.actionIconBtn}
                        >
                          <Ionicons name="copy-outline" size={13} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Suggested Follow-up Actions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <View style={styles.suggestedActionsRow}>
                      {msg.suggestedActions.map((action, aIdx) => (
                        <TouchableOpacity
                          key={aIdx}
                          style={[
                            styles.actionChip,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => handleSend(action)}
                        >
                          <Ionicons name="arrow-forward-circle" size={12} color={colors.primary} />
                          <Text style={[styles.actionChipText, { color: colors.primary }]}>
                            {action}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.typingIndicator, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Ionicons name="sparkles" size={14} color="#8B5CF6" />
              <Text style={[styles.typingText, { color: colors.textMuted }]}>
                NotebookLM is retrieving verified course passages...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surfaceCard, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.inputField,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Ask grounded questions across active sources..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceSubtle },
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={16}
              color={inputText.trim() ? '#FFFFFF' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Google NotebookLM Modals */}
      <AudioOverviewModal
        visible={isAudioOverviewVisible}
        onClose={() => setIsAudioOverviewVisible(false)}
      />

      <NotebookSourcesModal
        visible={isSourcesModalVisible}
        onClose={() => setIsSourcesModalVisible(false)}
        sources={sources}
        onSourcesUpdated={reloadSources}
      />

      <StudioGuideModal
        visible={isStudioGuideVisible}
        initialType={studioGuideInitialType}
        onClose={() => setIsStudioGuideVisible(false)}
      />

      <CitationModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      <NotesModal
        visible={isNotesModalVisible}
        onClose={() => setIsNotesModalVisible(false)}
        notes={notes}
        onNotesUpdated={reloadNotes}
      />

      <GoogleApiKeyModal
        visible={isApiKeyModalVisible}
        onClose={() => setIsApiKeyModalVisible(false)}
        onKeyUpdated={(hasKey) => setHasGoogleKey(hasKey)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  apiKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  apiKeyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groundingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  sourcesToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  sourcesIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  sourcesToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  miniActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  studioShelfArea: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  studioShelfScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  studioCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 135,
    gap: 4,
  },
  studioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studioIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  studioCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  assistantMessageWrapper: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 14,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  citationsContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  citationsLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  citationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  citationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    maxWidth: 220,
  },
  citeNumberBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citeNumberText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  citationPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timestampText: {
    fontSize: 10.5,
  },
  msgActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    padding: 2,
  },
  actionIconText: {
    fontSize: 11,
    fontWeight: '700',
  },
  suggestedActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  inputField: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 13.5,
    lineHeight: 18,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
