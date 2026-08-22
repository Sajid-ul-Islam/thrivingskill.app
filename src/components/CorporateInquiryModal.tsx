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
  const [phone, setPhone] = useState('');
  const [selectedService, setSelectedService] = useState('Corporate Training');
  const [teamSize, setTeamSize] = useState('10-50');
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
    setPhone('');
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
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Thriving Skills Enterprise Solutions
                </Text>
                <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                  Corporate Training & Business Consultancy
                </Text>
              </View>
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
                <Text style={[styles.successTitle, { color: colors.text }]}>Proposal Request Received!</Text>
                <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
                  Our Enterprise Strategic Advisor will contact {contactName} at {workEmail}{' '}
                  within 24 hours with a custom {selectedService} proposal and competency diagnostic framework.
                </Text>

                <View style={[styles.contactBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <Text style={[styles.contactBoxTitle, { color: colors.text }]}>Direct Enterprise Hotline</Text>
                  <Text style={[styles.contactPhone, { color: colors.primary }]}>📞 +880 1312-100288</Text>
                  <Text style={[styles.contactEmail, { color: colors.textMuted }]}>✉️ support@thrivingskill.com</Text>
                </View>

                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                  onPress={handleResetAndClose}
                >
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.introText, { color: colors.textMuted }]}>
                  আপনার টিমের পেশাদার দক্ষতা বৃদ্ধি, কার্যকর এবং ফলাফলমুখী করতে কাস্টমাইজড ট্রেনিং ও স্ট্র্যাটেজিক কনসালটেন্সি প্রপোজাল গ্রহণ করুন।
                </Text>

                {/* Service Selection */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Select Enterprise Solution *</Text>
                  <View style={styles.servicesGrid}>
                    {[
                      { id: 'Corporate Training', label: 'Corporate Training', icon: 'school' },
                      { id: 'Digital LMS Platform', label: 'Digital Learning (LMS)', icon: 'laptop' },
                      { id: 'SME Consultancy', label: 'SME Consultancy', icon: 'briefcase' },
                      { id: 'ICT & Policy Consulting', label: 'ICT & Policy Consulting', icon: 'shield-checkmark' },
                      { id: 'Buy For Team', label: 'Buy For Team (Licenses)', icon: 'people' },
                    ].map((serv) => (
                      <TouchableOpacity
                        key={serv.id}
                        style={[
                          styles.serviceChip,
                          {
                            backgroundColor:
                              selectedService === serv.id ? colors.primaryLight : colors.surfaceSubtle,
                            borderColor:
                              selectedService === serv.id ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedService(serv.id)}
                      >
                        <Ionicons
                          name={serv.icon as any}
                          size={14}
                          color={selectedService === serv.id ? colors.primary : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.serviceChipText,
                            {
                              color: selectedService === serv.id ? colors.primary : colors.text,
                              fontWeight: selectedService === serv.id ? '700' : '500',
                            },
                          ]}
                        >
                          {serv.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Company / Organization Name *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="e.g. Apex Holdings / BRAC"
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
                    placeholder="e.g. Tanvir Ahmed, Head of HR / MD"
                    placeholderTextColor={colors.textLight}
                    value={contactName}
                    onChangeText={setContactName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Corporate Work Email *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="name@company.com"
                    placeholderTextColor={colors.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={workEmail}
                    onChangeText={setWorkEmail}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Contact Phone / WhatsApp</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text },
                    ]}
                    placeholder="+880 17XXXXXXXX"
                    placeholderTextColor={colors.textLight}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Team Size to Upskill</Text>
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
    gap: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  introText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  serviceChipText: {
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: '600',
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
    paddingVertical: 24,
  },
  successIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  contactBox: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  contactBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    fontWeight: '800',
  },
  contactEmail: {
    fontSize: 12,
  },
  doneBtn: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
