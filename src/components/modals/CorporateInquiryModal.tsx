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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFeedback } from '../../context/FeedbackContext';
import { triggerHaptic } from '../../utils/haptics';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';

interface CorporateInquiryModalProps {
  visible: boolean;
  onClose: () => void;
}

const ENTERPRISE_SOLUTIONS = [
  { id: 'Corporate Training', label: 'Corporate Training', desc: 'Tailored upskilling cohorts for teams', icon: 'school' },
  { id: 'Digital LMS Platform', label: 'Digital Learning (LMS)', desc: 'White-label LMS deployment & hosting', icon: 'laptop' },
  { id: 'SME Consultancy', label: 'SME Consultancy', desc: 'Process optimization & growth strategy', icon: 'briefcase' },
  { id: 'ICT & Policy Consulting', label: 'ICT & Policy Consulting', desc: 'Digital transformation & AI governance', icon: 'shield-checkmark' },
  { id: 'Team Training Access', label: 'Enterprise Team Access', desc: 'Bulk seat access to 300+ courses', icon: 'people' },
] as const;

const TEAM_SIZES = ['5-20', '20-50', '50-200', '200+'] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CorporateInquiryModal: React.FC<CorporateInquiryModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedback();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<string>('Corporate Training');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teamSize, setTeamSize] = useState<string>('20-50');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const companyError =
    touched.companyName && companyName.trim().length < 2
      ? 'Please enter your company or organization name.'
      : null;
  const contactError =
    touched.contactName && contactName.trim().length < 2
      ? 'Please enter your full name and title.'
      : null;
  const emailError =
    touched.workEmail && !EMAIL_REGEX.test(workEmail.trim())
      ? 'Please enter a valid work email (e.g. name@company.com).'
      : null;
  const phoneError =
    touched.phone && phone.trim().length > 0 && phone.replace(/\D/g, '').length < 10
      ? 'Enter at least 10 digits or leave blank.'
      : null;

  const isStep2Valid =
    companyName.trim().length >= 2 &&
    contactName.trim().length >= 2 &&
    EMAIL_REGEX.test(workEmail.trim()) &&
    !phoneError;

  const handleNextFromStep2 = () => {
    setTouched({ companyName: true, contactName: true, workEmail: true, phone: true });
    if (!isStep2Valid) {
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('selection');
    setStep(3);
  };

  const handleSubmit = () => {
    if (!isStep2Valid) {
      setStep(2);
      setTouched({ companyName: true, contactName: true, workEmail: true, phone: true });
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('medium');
    setIsSubmitting(true);
    setSubmitted(true);
    setIsSubmitting(false);
    showToast({
      message: 'Enterprise proposal request submitted!',
      type: 'success',
    });
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setStep(1);
    setCompanyName('');
    setContactName('');
    setWorkEmail('');
    setPhone('');
    setTouched({});
    onClose();
  };

  const stepLabels = ['Solution', 'Contact Info', 'Team & Review'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={submitted ? handleResetAndClose : onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20) + 8,
            },
          ]}
          accessibilityViewIsModal={true}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="business" size={20} color={colors.primary} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.h4, { color: colors.text }]} numberOfLines={1}>
                  Enterprise Solutions
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                  {submitted
                    ? 'Request Confirmed'
                    : `Step ${step} of 3 • ${stepLabels[step - 1]}`}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={submitted ? handleResetAndClose : onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close inquiry dialog"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Progressive Disclosure Step Indicator */}
          {!submitted && (
            <View style={[styles.stepperContainer, { borderBottomColor: colors.borderSubtle }]}>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${(step / 3) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.stepDotsRow}>
                {stepLabels.map((lbl, idx) => {
                  const sNum = idx + 1;
                  const isDone = step > sNum;
                  const isCurrent = step === sNum;
                  return (
                    <Text
                      key={lbl}
                      style={[
                        typography.caption,
                        {
                          color: isCurrent || isDone ? colors.primary : colors.textMuted,
                          fontWeight: isCurrent ? '700' : '500',
                        },
                      ]}
                    >
                      {isDone ? '✓ ' : `${sNum}. `}
                      {lbl}
                    </Text>
                  );
                })}
              </View>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {submitted ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconBg, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                </View>
                <Text style={[typography.h3, styles.successTitle, { color: colors.text }]}>
                  Proposal Request Received!
                </Text>
                <Text style={[typography.bodySmall, styles.successSubtitle, { color: colors.textMuted }]}>
                  Our Enterprise Strategic Advisor will contact {contactName} at {workEmail} within
                  24 hours with a custom {selectedService} proposal for {teamSize} learners.
                </Text>

                <View
                  style={[
                    styles.contactBox,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <Text style={[typography.h6, { color: colors.text, marginBottom: 2 }]}>
                    Direct Enterprise Hotline
                  </Text>
                  <Text style={[typography.h5, { color: colors.primary }]}>+880 1312-100288</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    support@thrivingskill.com
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                  onPress={handleResetAndClose}
                  accessibilityRole="button"
                >
                  <Text style={[typography.button, { color: colors.onPrimary }]}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : step === 1 ? (
              <>
                <Text style={[typography.bodySmall, { color: colors.textMuted, marginBottom: 14 }]}>
                  Select the primary solution your organization needs. You can adjust details in the next steps.
                </Text>

                <View style={styles.solutionsList}>
                  {ENTERPRISE_SOLUTIONS.map((serv) => {
                    const isSelected = selectedService === serv.id;
                    return (
                      <TouchableOpacity
                        key={serv.id}
                        style={[
                          styles.solutionCard,
                          {
                            backgroundColor: isSelected ? colors.primaryLight : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setSelectedService(serv.id);
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View
                          style={[
                            styles.solutionIconWrap,
                            { backgroundColor: isSelected ? colors.primary : colors.surfaceCard },
                          ]}
                        >
                          <Ionicons
                            name={serv.icon as any}
                            size={18}
                            color={isSelected ? colors.onPrimary : colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.h5, { color: colors.text }]}>{serv.label}</Text>
                          <Text style={[typography.caption, { color: colors.textMuted }]}>
                            {serv.desc}
                          </Text>
                        </View>
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={isSelected ? colors.primary : colors.textMuted}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setStep(2);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={[typography.button, { color: colors.onPrimary }]}>
                    Continue to Contact Info
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
                </TouchableOpacity>
              </>
            ) : step === 2 ? (
              <>
                <Text style={[typography.bodySmall, { color: colors.textMuted, marginBottom: 14 }]}>
                  Tell us who we should prepare the {selectedService} proposal for.
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[typography.h6, styles.label, { color: colors.text }]}>
                    Company / Organization Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: companyError ? colors.danger : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="e.g. Apex Holdings / BRAC"
                    placeholderTextColor={colors.textLight}
                    value={companyName}
                    onChangeText={setCompanyName}
                    onBlur={() => setTouched((p) => ({ ...p, companyName: true }))}
                  />
                  {companyError ? (
                    <Text style={[typography.caption, { color: colors.danger, marginTop: 4 }]}>
                      {companyError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={[typography.h6, styles.label, { color: colors.text }]}>
                    Your Name & Title *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: contactError ? colors.danger : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="e.g. Tanvir Ahmed, Head of HR"
                    placeholderTextColor={colors.textLight}
                    value={contactName}
                    onChangeText={setContactName}
                    onBlur={() => setTouched((p) => ({ ...p, contactName: true }))}
                  />
                  {contactError ? (
                    <Text style={[typography.caption, { color: colors.danger, marginTop: 4 }]}>
                      {contactError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={[typography.h6, styles.label, { color: colors.text }]}>
                    Corporate Work Email *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: emailError ? colors.danger : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="name@company.com"
                    placeholderTextColor={colors.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={workEmail}
                    onChangeText={setWorkEmail}
                    onBlur={() => setTouched((p) => ({ ...p, workEmail: true }))}
                  />
                  {emailError ? (
                    <Text style={[typography.caption, { color: colors.danger, marginTop: 4 }]}>
                      {emailError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={[typography.h6, styles.label, { color: colors.text }]}>
                    Phone / WhatsApp (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: phoneError ? colors.danger : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="+880 17XXXXXXXX"
                    placeholderTextColor={colors.textLight}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                  />
                  {phoneError ? (
                    <Text style={[typography.caption, { color: colors.danger, marginTop: 4 }]}>
                      {phoneError}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.wizardNavRow}>
                  <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                    onPress={() => setStep(1)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.text} />
                    <Text style={[typography.button, { color: colors.text }]}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                    onPress={handleNextFromStep2}
                    accessibilityRole="button"
                  >
                    <Text style={[typography.button, { color: colors.onPrimary }]}>Review</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={[typography.h6, styles.label, { color: colors.text }]}>
                    Team Size to Upskill
                  </Text>
                  <View style={styles.pillRow}>
                    {TEAM_SIZES.map((size) => {
                      const active = teamSize === size;
                      return (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.sizePill,
                            {
                              backgroundColor: active ? colors.primary : colors.surfaceSubtle,
                              borderColor: active ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => {
                            triggerHaptic('selection');
                            setTeamSize(size);
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active }}
                        >
                          <Text
                            style={[
                              typography.button,
                              { color: active ? colors.onPrimary : colors.text },
                            ]}
                          >
                            {size}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Review Summary Card */}
                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <Text style={[typography.h5, { color: colors.text, marginBottom: 8 }]}>
                    Proposal Request Summary
                  </Text>
                  <View style={styles.summaryRow}>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>Solution:</Text>
                    <Text style={[typography.bodySmall, { color: colors.text, fontWeight: '700' }]}>
                      {selectedService}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>Company:</Text>
                    <Text style={[typography.bodySmall, { color: colors.text, fontWeight: '700' }]}>
                      {companyName}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>Contact:</Text>
                    <Text style={[typography.bodySmall, { color: colors.text, fontWeight: '700' }]}>
                      {contactName}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>Work Email:</Text>
                    <Text style={[typography.bodySmall, { color: colors.text, fontWeight: '700' }]}>
                      {workEmail}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>Team Size:</Text>
                    <Text style={[typography.bodySmall, { color: colors.primary, fontWeight: '700' }]}>
                      {teamSize} learners
                    </Text>
                  </View>
                </View>

                <View style={styles.wizardNavRow}>
                  <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                    onPress={() => setStep(2)}
                    accessibilityRole="button"
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.text} />
                    <Text style={[typography.button, { color: colors.text }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <>
                        <Text style={[typography.button, { color: colors.onPrimary }]}>
                          Submit Request
                        </Text>
                        <Ionicons name="checkmark-circle" size={18} color={colors.onPrimary} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
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
    borderTopLeftRadius: shape.extraLarge,
    borderTopRightRadius: shape.extraLarge,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressTrack: {
    height: 5,
    borderRadius: shape.extraSmall,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: shape.extraSmall,
  },
  stepDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scrollContent: {
    padding: 20,
  },
  solutionsList: {
    gap: 10,
    marginBottom: 16,
  },
  solutionCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: shape.medium,
    borderWidth: 1.5,
    gap: 12,
  },
  solutionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: shape.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    borderRadius: shape.medium,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizePill: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 70,
    paddingHorizontal: 14,
    borderRadius: shape.small,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    borderRadius: shape.medium,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: shape.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  wizardNavRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  backBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: shape.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextBtn: {
    flex: 2,
    minHeight: 48,
    borderRadius: shape.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconBg: {
    width: 72,
    height: 72,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  contactBox: {
    width: '100%',
    padding: 14,
    borderRadius: shape.medium,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  doneBtn: {
    minHeight: 48,
    minWidth: 160,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
