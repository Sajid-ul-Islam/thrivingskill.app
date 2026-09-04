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

export type AssistantRole =
  | 'all_tutor'
  | 'agentic_ai'
  | 'excel_bi'
  | 'financial_model'
  | 'corporate_comm'
  | 'bangla_expert';

interface RoleConfig {
  id: AssistantRole;
  title: string;
  badge: string;
  icon: string;
  iconColor: string;
  placeholder: string;
  systemInstruction: string;
  quickPrompts: string[];
}

const ASSISTANT_ROLES: RoleConfig[] = [
  {
    id: 'all_tutor',
    title: 'Executive Tutor',
    badge: '🎓 ALL-ROUND',
    icon: 'school',
    iconColor: '#6366F1',
    placeholder: 'Ask any question across study notes & curriculum...',
    systemInstruction:
      'Role: Master Executive Coach & Learning Facilitator. Provide structured, executive-grade answers using BLUF (Bottom Line Up Front), bullet points, and actionable takeaways.',
    quickPrompts: [
      'Explain the Minto Pyramid BLUF method',
      'Generate a 1-page executive summary template',
      'How to conduct a McKinsey-style 80/20 analysis',
      'Quiz me on my active study materials',
    ],
  },
  {
    id: 'agentic_ai',
    title: 'Agentic AI & Tech',
    badge: '🤖 2026 AI ARCHITECT',
    icon: 'hardware-chip',
    iconColor: '#8B5CF6',
    placeholder: 'Ask about Agentic AI, LangGraph, CrewAI, Python...',
    systemInstruction:
      'Role: Lead AI Solutions Architect & LLM Engineer. Specialize in multi-agent orchestration (LangGraph, CrewAI), Agentic RAG architectures, prompt chaining, tool calling, and enterprise AI governance.',
    quickPrompts: [
      'Design a LangGraph multi-agent supervisor pattern',
      'Compare LangGraph vs CrewAI for enterprise workflows',
      'Write a self-correcting prompt template with schemas',
      'How to evaluate hallucination rates in Agentic RAG',
    ],
  },
  {
    id: 'excel_bi',
    title: 'MS Excel & Power BI',
    badge: '📊 DATA & DAX',
    icon: 'grid',
    iconColor: '#059669',
    placeholder: 'Ask for formulas, DAX measures, Power Query...',
    systemInstruction:
      'Role: Lead Microsoft MVP & Business Intelligence Specialist. Provide clean, copy-pasteable Excel formulas (XLOOKUP, LAMBDA, LET), DAX measures for Power BI, and Power Query M-code snippets with step-by-step walkthroughs.',
    quickPrompts: [
      'Write an advanced XLOOKUP with dynamic array spill',
      'Create a Power BI DAX measure for YoY % growth',
      'Explain how to optimize slow Power Query merges',
      'Build a dynamic KPI card formula for dashboards',
    ],
  },
  {
    id: 'financial_model',
    title: 'Financial Modeling',
    badge: '📈 DCF & VALUATION',
    icon: 'stats-chart',
    iconColor: '#0EA5E9',
    placeholder: 'Ask about DCF, WACC, EBITDA, balance sheets...',
    systemInstruction:
      'Role: Senior Investment Banking & Financial Modeling Analyst. Specialize in DCF terminal value audits, sensitivity tables, working capital schedules, and three-statement financial modeling.',
    quickPrompts: [
      'Audit terminal value exit multiple vs Gordon growth',
      'Explain working capital adjustments in free cash flow',
      'How to structure a dynamic 3-statement forecast',
      'Walk through a SaaS revenue waterfall model',
    ],
  },
  {
    id: 'corporate_comm',
    title: 'Leadership & Pitch',
    badge: '💼 C-SUITE READY',
    icon: 'briefcase',
    iconColor: '#F59E0B',
    placeholder: 'Ask for pitch decks, board emails, negotiation...',
    systemInstruction:
      'Role: Senior Corporate Leadership Strategist. Help craft high-stakes board presentations, persuasive elevator pitches, strategic client emails, and executive compensation negotiation frameworks.',
    quickPrompts: [
      'Draft a concise email to the Board pitching a new AI initiative',
      'Framework for answering "Tell me about yourself" in CXO interview',
      'How to negotiate a corporate package with performance equity',
      'Structure a high-stakes 5-minute sales pitch',
    ],
  },
  {
    id: 'bangla_expert',
    title: 'বাংলা এক্সপার্ট',
    badge: '🇧🇩 বাংলা লার্নিং',
    icon: 'chatbubbles',
    iconColor: '#10B981',
    placeholder: 'বাংলায় যেকোনো প্রশ্ন বা স্টাডি নোট সম্পর্কে জিজ্ঞাসা করুন...',
    systemInstruction:
      'ভূমিকা: থ্রাইভিং স্কিলসের সিনিয়র লার্নিং মেন্টর। সম্পূর্ণ পরিষ্কার ও সাবলীল বাংলায় উত্তর দিন। পেশাদার ও উৎসাহব্যঞ্জক টোনে কনসেপ্ট ব্যাখ্যা করুন।',
    quickPrompts: [
      'আজকের পাঠ্য বিষয়ের একটি সহজ বাংলা সারসংক্ষেপ দিন',
      'ক্যারিয়ার উন্নয়নে এআই কীভাবে কাজে লাগাব?',
      'একটি ব্যবসায়িক প্রস্তাবনার ৫টি প্রধান অংশ কী কী?',
      'চাকরির ইন্টারভিউতে কীভাবে ভালো প্রস্তুতি নেব?',
    ],
  },
];

export const SkillCopilotScreen: React.FC<SkillCopilotScreenProps> = ({
  onOpenSubscription,
  onOpenNotifications,
  onNavigateToCourse,
  onOpenDrawer,
}) => {
  const { colors, isDark } = useTheme();
  const { clearCopilotHistory } = useSaaS();

  // Active Role State
  const [selectedRole, setSelectedRole] = useState<AssistantRole>('all_tutor');
  const currentRoleConfig =
    ASSISTANT_ROLES.find((r) => r.id === selectedRole) || ASSISTANT_ROLES[0];

  // Feedback states
  const [feedbackMap, setFeedbackMap] = useState<{ [id: string]: 'up' | 'down' | undefined }>({});

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

Powered by **Google Gemini 2.5** and source-grounded in your **verified course syllabi, YouTube masterclass transcripts, and study notes**.

Every answer can be generated using your personal **Google Gemini API Key** or grounded locally with verified citations.

Select a specialized persona above, or tap any tool in the **Studio Shelf** to generate an **Audio Deep Dive podcast**, **Study Guide**, or **Active Recall Flashcards**!`,
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

  const [messageModels, setMessageModels] = useState<{
    [msgId: string]: string;
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

        const geminiRes = await GeminiService.generateContent(
          text,
          activeSources,
          historyTurns,
          currentRoleConfig.systemInstruction
        );

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

          setMessageModels((prev) => ({
            ...prev,
            [assistantMsgId]: geminiRes.model || 'gemini-2.5-flash',
          }));

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

      setMessageModels((prev) => ({
        ...prev,
        [assistantMsgId]: 'NotebookLM Grounded',
      }));

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
    await NotebookLMService.saveNote(`📌 ${title}`, msg.text, ['Pinned Insight', currentRoleConfig.title]);
    await reloadNotes();
    Alert.alert('Pinned to Notes 📌', 'Insight saved to your personal notebook notes.');
  };

  const handleCopyText = (msgText: string) => {
    Alert.alert('Copied 📋', 'Copied text to clipboard. Ready to paste into your notes or deck.');
  };

  const handleToggleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? undefined : type,
    }));
  };

  const handleReadAloud = (text: string) => {
    const preview = text.slice(0, 120) + '...';
    Alert.alert(
      'Audio Readout 🔊',
      `Speaking key takeaways:\n\n"${preview}"\n\n(Tip: Tap 'Deep Dive' in the Studio Shelf to listen to full 2-host audio podcast!)`
    );
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
              text: `Session reset. Active Persona: **${currentRoleConfig.title}**.\n\nNotebook sources and Google Gemini are ready. How can I assist your learning?`,
              timestamp: 'Just now',
            },
          ]);
        },
      },
    ]);
  };

  /**
   * Helper to parse and render code blocks with syntax styling and Copy button
   */
  const renderFormattedMessage = (rawText: string, isUser: boolean) => {
    if (isUser) {
      return <Text style={styles.userMessageText}>{rawText}</Text>;
    }

    // Split text by markdown code fences: ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: { type: 'text' | 'code'; content: string; lang?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: rawText.slice(lastIndex, match.index) });
      }
      parts.push({
        type: 'code',
        lang: match[1] || 'CODE / FORMULA',
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < rawText.length) {
      parts.push({ type: 'text', content: rawText.slice(lastIndex) });
    }

    if (parts.length === 0) {
      return <Text style={[styles.messageText, { color: colors.text }]}>{rawText}</Text>;
    }

    return (
      <View style={{ gap: 8 }}>
        {parts.map((part, pIdx) => {
          if (part.type === 'code') {
            return (
              <View
                key={pIdx}
                style={[
                  styles.codeCard,
                  {
                    backgroundColor: isDark ? '#0A0F1D' : '#1E293B',
                    borderColor: isDark ? '#1E293B' : '#334155',
                  },
                ]}
              >
                <View style={styles.codeCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="terminal-outline" size={12} color="#60A5FA" />
                    <Text style={styles.codeLangText}>{part.lang?.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyCodeBtn}
                    onPress={() => handleCopyText(part.content)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="copy-outline" size={12} color="#94A3B8" />
                    <Text style={styles.copyCodeBtnText}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeContentText}>{part.content}</Text>
              </View>
            );
          }
          return (
            <Text key={pIdx} style={[styles.messageText, { color: colors.text }]}>
              {part.content}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Global Header: Minimal, completely uncluttered icon buttons on right (NO text overlap) */}
      <Header
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
        rightAction={
          <View style={styles.headerRightGroup}>
            {/* Compact API Key Icon with live green status dot */}
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
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
              accessibilityLabel="Google Gemini API Key"
            >
              <Ionicons
                name="sparkles"
                size={15}
                color={hasGoogleKey ? '#10B981' : colors.primary}
              />
              {hasGoogleKey && <View style={styles.headerActiveBadgeDot} />}
            </TouchableOpacity>

            {/* Clear Chat Button */}
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={handleClearHistory}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Clear chat session"
            >
              <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 2. Specialized AI Roles Selector Row */}
        <View style={[styles.rolesBar, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rolesScroll}
          >
            {ASSISTANT_ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleChip,
                    {
                      backgroundColor: isSelected
                        ? role.iconColor
                        : isDark
                        ? '#1E293B'
                        : '#F1F5F9',
                      borderColor: isSelected ? role.iconColor : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedRole(role.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={role.icon as any}
                    size={13}
                    color={isSelected ? '#FFFFFF' : role.iconColor}
                  />
                  <Text
                    style={[
                      styles.roleChipText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {role.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Dedicated Gemini Engine Status & Source Grounding Bar (Full Width, Zero Overlap) */}
        <View style={[styles.groundingBar, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          {/* Engine Status Pill */}
          <TouchableOpacity
            style={[
              styles.modelEnginePill,
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
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.sourcesIndicatorDot,
                { backgroundColor: hasGoogleKey ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text
              style={[
                styles.modelEngineText,
                { color: hasGoogleKey ? (isDark ? '#34D399' : '#059669') : colors.text },
              ]}
            >
              {hasGoogleKey ? 'Gemini 2.5 Active' : 'Offline Grounded'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={11}
              color={hasGoogleKey ? '#10B981' : colors.textMuted}
            />
          </TouchableOpacity>

          {/* Sources and Notes Badges */}
          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={[
                styles.sourcesCountBadge,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={() => setIsSourcesModalVisible(true)}
            >
              <Ionicons name="library-outline" size={12} color={colors.primary} />
              <Text style={[styles.sourcesToggleText, { color: colors.text }]}>
                {activeSourcesCount} Sources
              </Text>
            </TouchableOpacity>

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
                {notes.length} Notes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. NotebookLM Studio Action Shelf (Auto-Scrolling Carousels) */}
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

        {/* 5. Grounded Chat Feed */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg: CopilotMessage) => {
            const isUser = msg.sender === 'user';
            const citations = messageCitations[msg.id];
            const modelName = messageModels[msg.id];
            const feedback = feedbackMap[msg.id];

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isUser ? styles.userMessageWrapper : styles.assistantMessageWrapper,
                ]}
              >
                {!isUser && (
                  <View style={[styles.assistantAvatar, { backgroundColor: currentRoleConfig.iconColor }]}>
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
                  {/* Model Name & Grounding Badge */}
                  {!isUser && modelName && (
                    <View style={styles.modelHeaderRow}>
                      <View style={[styles.modelBadgePill, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
                        <Ionicons name="hardware-chip-outline" size={11} color={colors.primary} />
                        <Text style={[styles.modelBadgeText, { color: colors.primary }]}>
                          {modelName}
                        </Text>
                      </View>
                      <Text style={[styles.roleTagText, { color: colors.textMuted }]}>
                        • {currentRoleConfig.title}
                      </Text>
                    </View>
                  )}

                  {/* Formatted Content */}
                  {renderFormattedMessage(msg.text, isUser)}

                  {/* Grounded Citations Bar (NotebookLM Signature Feature) */}
                  {!isUser && citations && citations.length > 0 && (
                    <View style={styles.citationsContainer}>
                      <Text style={[styles.citationsLabel, { color: colors.textMuted }]}>
                        Verified Grounding Sources:
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

                  {/* Message Footer & Interactive Controls */}
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
                        {/* Audio Readout */}
                        <TouchableOpacity
                          onPress={() => handleReadAloud(msg.text)}
                          style={styles.actionIconBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="volume-medium-outline" size={14} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Thumbs Up */}
                        <TouchableOpacity
                          onPress={() => handleToggleFeedback(msg.id, 'up')}
                          style={styles.actionIconBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name={feedback === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
                            size={13}
                            color={feedback === 'up' ? '#10B981' : colors.textMuted}
                          />
                        </TouchableOpacity>

                        {/* Thumbs Down */}
                        <TouchableOpacity
                          onPress={() => handleToggleFeedback(msg.id, 'down')}
                          style={styles.actionIconBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name={feedback === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
                            size={13}
                            color={feedback === 'down' ? '#EF4444' : colors.textMuted}
                          />
                        </TouchableOpacity>

                        {/* Pin Note */}
                        <TouchableOpacity
                          onPress={() => handlePinToNotes(msg)}
                          style={styles.actionIconBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="bookmark-outline" size={13} color={colors.primary} />
                          <Text style={[styles.actionIconText, { color: colors.primary }]}>Pin</Text>
                        </TouchableOpacity>

                        {/* Copy Text */}
                        <TouchableOpacity
                          onPress={() => handleCopyText(msg.text)}
                          style={styles.actionIconBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
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
                {hasGoogleKey
                  ? 'Google Gemini 2.5 is synthesizing grounded answer...'
                  : 'NotebookLM is retrieving verified course passages...'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* 6. Quick Prompts Inspiration Bar (Role-Specific) */}
        <View style={[styles.quickPromptsBar, { backgroundColor: colors.surfaceCard, borderTopColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptsScroll}
          >
            {currentRoleConfig.quickPrompts.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.quickPromptChip,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleSend(prompt)}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles-outline" size={12} color={currentRoleConfig.iconColor} />
                <Text style={[styles.quickPromptText, { color: colors.text }]} numberOfLines={1}>
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 7. Enhanced Input Dock */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surfaceCard, borderTopColor: colors.border },
          ]}
        >
          {/* Attachment / Sources Button */}
          <TouchableOpacity
            style={[styles.attachBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
            onPress={() => setIsSourcesModalVisible(true)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel="Manage grounding sources"
          >
            <Ionicons name="attach" size={18} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={currentRoleConfig.placeholder}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />

            {inputText.length > 0 && (
              <TouchableOpacity
                style={styles.clearInputBtn}
                onPress={() => setInputText('')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Voice Prompt Simulator */}
          <TouchableOpacity
            style={[styles.micBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
            onPress={() => {
              Alert.alert(
                'Voice Prompt 🎙️',
                'Dictate your learning query:',
                [
                  {
                    text: 'Ask: "Explain Agentic AI"',
                    onPress: () => handleSend('Explain what is Agentic AI and how autonomous multi-agents work'),
                  },
                  {
                    text: 'Ask: "Audit DCF Formula"',
                    onPress: () => handleSend('How to audit a DCF valuation model in Excel?'),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <Ionicons name="mic-outline" size={17} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Send Button */}
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerActiveBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  rolesBar: {
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rolesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groundingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modelEnginePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
  },
  modelEngineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sourcesIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourcesCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  sourcesToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 12,
    gap: 3.5,
  },
  miniActionBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  studioShelfArea: {
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  studioShelfScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  studioCard: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 13,
    borderWidth: 1,
    minWidth: 130,
    gap: 3,
  },
  studioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  studioIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  studioCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  messageWrapper: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  assistantMessageWrapper: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 13,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  modelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  modelBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  codeCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 4,
  },
  codeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  codeLangText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  copyCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  copyCodeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  codeContentText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#38BDF8',
    padding: 10,
  },
  citationsContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  citationsLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    maxWidth: '100%',
  },
  citeNumberBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
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
    maxWidth: 160,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timestampText: {
    fontSize: 10,
  },
  msgActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    padding: 2,
  },
  actionIconText: {
    fontSize: 10.5,
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
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  quickPromptsBar: {
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quickPromptsScroll: {
    paddingHorizontal: 16,
    gap: 7,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  inputField: {
    minHeight: 36,
    maxHeight: 90,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingRight: 28,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  clearInputBtn: {
    position: 'absolute',
    right: 7,
    top: 9,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
