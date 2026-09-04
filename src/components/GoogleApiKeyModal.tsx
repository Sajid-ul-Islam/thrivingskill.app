import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GeminiService } from '../services/geminiService';

interface GoogleApiKeyModalProps {
  visible: boolean;
  onClose: () => void;
  onKeyUpdated?: (hasKey: boolean) => void;
}

export const GoogleApiKeyModal: React.FC<GoogleApiKeyModalProps> = ({
  visible,
  onClose,
  onKeyUpdated,
}) => {
  const { colors, isDark } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSavedKey();
    }
  }, [visible]);

  const loadSavedKey = async () => {
    const key = await GeminiService.getApiKey();
    if (key) {
      setApiKey(key);
      setHasSavedKey(true);
    } else {
      setApiKey('');
      setHasSavedKey(false);
    }
  };

  const handleSaveAndTest = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Empty Key', 'Please enter or paste your Google Gemini API Key.');
      return;
    }

    setIsTesting(true);
    const testResult = await GeminiService.testApiKey(apiKey.trim());
    setIsTesting(false);

    if (testResult.valid) {
      await GeminiService.setApiKey(apiKey.trim());
      setHasSavedKey(true);
      onKeyUpdated?.(true);
      Alert.alert(
        'Connected Successfully! 🚀',
        'Your Google Gemini API Key has been verified and saved securely on your device. The AI Assistant will now use your real Google Gemini model for live answers.'
      );
      onClose();
    } else {
      Alert.alert(
        'Verification Failed ❌',
        `Google API returned an error:\n\n${testResult.error || 'Invalid API Key'}\n\nPlease check your key and try again.`
      );
    }
  };

  const handleClearKey = async () => {
    Alert.alert(
      'Remove API Key?',
      'Are you sure you want to remove your saved Google Gemini API Key? The AI Assistant will switch back to offline curriculum mode.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await GeminiService.clearApiKey();
            setApiKey('');
            setHasSavedKey(false);
            onKeyUpdated?.(false);
            Alert.alert('Removed', 'Your Google Gemini API Key has been cleared.');
          },
        },
      ]
    );
  };

  const handleOpenGoogleAIStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey').catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Google Gemini API</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Connect your personal AI Studio key
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Connection Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: hasSavedKey
                  ? isDark
                    ? '#064E3B'
                    : '#D1FAE5'
                  : isDark
                  ? '#374151'
                  : '#F3F4F6',
              },
            ]}
          >
            <Ionicons
              name={hasSavedKey ? 'checkmark-circle' : 'information-circle'}
              size={16}
              color={hasSavedKey ? '#10B981' : colors.textMuted}
            />
            <Text
              style={[
                styles.statusText,
                { color: hasSavedKey ? (isDark ? '#34D399' : '#047857') : colors.textMuted },
              ]}
            >
              {hasSavedKey
                ? 'Status: Google Gemini API Active & Verified'
                : 'Status: Offline Grounded Mode (No API key saved)'}
            </Text>
          </View>

          {/* Key Input */}
          <Text style={[styles.inputLabel, { color: colors.text }]}>Google API Key</Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="key-outline" size={18} color={colors.textMuted} style={styles.keyIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="AIzaSy..."
              placeholderTextColor={colors.textMuted}
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showKey}
            />
            {apiKey.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowKey(!showKey)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showKey ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.helpText, { color: colors.textMuted }]}>
            Your key is stored locally on this device and only called directly against Google's official Gemini endpoint.
          </Text>

          {/* AI Studio Link Button */}
          <TouchableOpacity
            style={[styles.linkBtn, { borderColor: colors.borderSubtle }]}
            onPress={handleOpenGoogleAIStudio}
          >
            <Ionicons name="open-outline" size={14} color={colors.primary} />
            <Text style={[styles.linkBtnText, { color: colors.primary }]}>
              Get a free API Key from Google AI Studio
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {hasSavedKey && (
              <TouchableOpacity
                style={[styles.removeBtn, { borderColor: '#EF4444' }]}
                onPress={handleClearKey}
                disabled={isTesting}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary, flex: hasSavedKey ? 2 : 1 },
              ]}
              onPress={handleSaveAndTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Verify & Save Key</Text>
                </>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  keyIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  helpText: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 20,
    paddingVertical: 6,
  },
  linkBtnText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  removeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
