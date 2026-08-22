import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface CorporateInquiryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CorporateInquiryModal: React.FC<CorporateInquiryModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [teamSize, setTeamSize] = useState('10-50');
  const [focusArea, setFocusArea] = useState('Generative AI & Tech Automation');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!companyName || !contactName || !workEmail) return;
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setCompanyName('');
    setContactName('');
    setWorkEmail('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="business" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Corporate Training</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {submitted ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconBg, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                </View>
                <Text style={[styles.successTitle, { color: colors.text }]}>Inquiry Received!</Text>
                <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
                  Our Enterprise Learning Consultant will contact {contactName} at {workEmail}{' '}
                  within 24 hours with a custom proposal and skills assessment deck.
                </Text>
                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                  onPress={handleResetAndClose}
                >
                  <Text style={styles.doneText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.introText, { color: colors.textMuted }]}>
                  Customized learning paths, enterprise LMS integration, and certified trainers for
                  your team.
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Company Name *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="e.g. Acme Corp"
                    placeholderTextColor={colors.textLight}
                    value={companyName}
                    onChangeText={setCompanyName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Your Name & Title *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="e.g. Jane Doe, Head of L&D"
                    placeholderTextColor={colors.textLight}
                    value={contactName}
                    onChangeText={setContactName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Work Email *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="jane@acme.com"
                    placeholderTextColor={colors.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={workEmail}
                    onChangeText={setWorkEmail}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Team Size to Train</Text>
                  <View style={styles.pillRow}>
                    {['5-20', '20-50', '50-200', '200+'].map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.sizePill,
                          {
                            backgroundColor:
                              teamSize === size ? colors.primary : colors.surfaceSubtle,
                            borderColor: teamSize === size ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setTeamSize(size)}
                      >
                        <Text
                          style={[
                            styles.sizePillText,
                            { color: teamSize === size ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Target Focus Area</Text>
                  <View style={styles.focusOptions}>
                    {[
                      'Generative AI & Tech Automation',
                      'Financial Modeling & Valuations',
                      'Executive Leadership & Communication',
                      'Data Analytics (PowerBI / SQL)',
                      'Strategic HR & People Analytics',
                    ].map((area) => (
                      <TouchableOpacity
                        key={area}
                        style={[
                          styles.focusOption,
                          {
                            backgroundColor:
                              focusArea === area ? colors.surfaceElevated : colors.surfaceSubtle,
                            borderColor: focusArea === area ? colors.secondary : colors.border,
                          },
                        ]}
                        onPress={() => setFocusArea(area)}
                      >
                        <Ionicons
                          name={focusArea === area ? 'radio-button-on' : 'radio-button-off'}
                          size={16}
                          color={focusArea === area ? colors.secondary : colors.textMuted}
                        />
                        <Text style={[styles.focusOptionText, { color: colors.text }]}>{area}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor:
                        companyName && contactName && workEmail ? colors.primary : colors.surfaceSubtle,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={!companyName || !contactName || !workEmail}
                >
                  <Text
                    style={[
                      styles.submitText,
                      { color: companyName && contactName && workEmail ? '#FFFFFF' : colors.textMuted },
                    ]}
                  >
                    Request Custom Training Proposal
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: 24,
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
  introText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sizePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  focusOptions: {
    gap: 8,
  },
  focusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  focusOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  doneBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
