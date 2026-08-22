import React, { useState, useRef } from 'react';
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

interface SkillCopilotScreenProps {
  onOpenSubscription: () => void;
  onOpenNotifications: () => void;
  onNavigateToCourse?: (courseId: string) => void;
}

export const SkillCopilotScreen: React.FC<SkillCopilotScreenProps> = ({
  onOpenSubscription,
  onOpenNotifications,
  onNavigateToCourse,
}) => {
  const { colors, isDark } = useTheme();
  const { copilotMessages, sendCopilotMessage, clearCopilotHistory, subscriptionTier } = useSaaS();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const quickPrompts = [
    { label: '📊 Audit DCF Model', prompt: 'Audit my DCF model assumptions and advise on terminal value sensitivity.' },
    { label: '🤖 RTCC Prompt Blueprint', prompt: 'Create an RTCC executive prompt to synthesize quarterly earnings for our board.' },
    { label: '🗺️ 30-Day Upskill Roadmap', prompt: 'Generate a 30-day AI & Analytics upskilling roadmap for my operations department.' },
    { label: '🗣️ Boardroom Roleplay', prompt: 'Simulate pushback from a skeptical CFO on funding our team AI automation pilot.' },
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setInputText('');
    setIsTyping(true);
    await sendCopilotMessage(text);
    setIsTyping(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCopyText = (msgText: string) => {
    Alert.alert('Copied to Clipboard 📋', 'Copilot advice copied. Ready to paste into your executive notes or email.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="AI Skill Copilot"
        subtitle="Executive Strategy & Mentorship"
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        rightAction={
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: colors.surfaceSubtle }]}
            onPress={clearCopilotHistory}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Quick Prompts Carousel */}
        <View style={[styles.quickPromptsBar, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
            {quickPrompts.map((qp, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.quickPill,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
                onPress={() => handleSend(qp.prompt)}
              >
                <Text style={[styles.quickPillText, { color: colors.text }]}>{qp.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages Feed */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {copilotMessages.map((msg: CopilotMessage) => {
            const isUser = msg.sender === 'user';
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
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
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

                  {/* Timestamp & Actions */}
                  <View style={styles.bubbleFooter}>
                    <Text
                      style={[
                        styles.timestampText,
                        { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textLight },
                      ]}
                    >
                      {msg.timestamp}
                    </Text>

                    {!isUser && (
                      <TouchableOpacity
                        onPress={() => handleCopyText(msg.text)}
                        style={styles.copyBtn}
                      >
                        <Ionicons name="copy-outline" size={13} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Suggested Follow-up Action Chips */}
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
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.typingText, { color: colors.textMuted }]}>
                Executive AI Copilot is synthesizing insights...
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
            placeholder="Ask anything (e.g., Explain WACC, draft RTCC prompt)..."
            placeholderTextColor={colors.textLight}
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
              color={inputText.trim() ? '#FFFFFF' : colors.textLight}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPromptsBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  quickScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '82%',
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
    fontSize: 14,
    lineHeight: 20,
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
  copyBtn: {
    padding: 2,
  },
  suggestedActionsRow: {
    marginTop: 10,
    gap: 6,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginLeft: 36,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputField: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
