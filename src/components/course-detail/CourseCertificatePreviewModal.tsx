import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Env } from '../../config/env';
import { Course } from '../../types';

interface CourseCertificatePreviewModalProps {
  visible: boolean;
  course: Course;
  userName: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  hasReviewed: boolean;
  certificateId?: string;
  verificationUrl?: string;
  onClose: () => void;
  onOpenMandatoryReview: () => void;
}

export const CourseCertificatePreviewModal: React.FC<CourseCertificatePreviewModalProps> = ({
  visible,
  course,
  userName,
  isUnlocked,
  isCompleted,
  hasReviewed,
  certificateId,
  verificationUrl,
  onClose,
  onOpenMandatoryReview,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();

  const certId = certificateId || `TSL-CERT-${course.id}-2026`;
  const verifyUrl =
    verificationUrl || `${Env.SITE_URL.replace(/\/+$/, '')}/certificates/${certId}/`;

  const handleLinkedInShare = () => {
    const now = new Date();
    const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
      course.title
    )}&organizationName=${encodeURIComponent('Thriving Skills')}&issueYear=${now.getFullYear()}&issueMonth=${
      now.getMonth() + 1
    }&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(certId)}`;

    Linking.openURL(linkedinUrl).catch(() => {
      Alert.alert(
        'LinkedIn Credential 🔗',
        `Visit ${verifyUrl} to verify or share credential #${certId}.`
      );
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={[
          styles.certModalOverlay,
          {
            paddingTop: Math.max(16, insets.top),
            paddingBottom: Math.max(16, insets.bottom),
          },
        ]}
      >
        <View style={[styles.certModalCard, { backgroundColor: isDark ? '#1C1D22' : '#FFFDF9' }]}>
          {/* Modal Header */}
          <View style={styles.certModalHeader}>
            <View style={styles.titleRow}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color="#E34234"
                style={{ flexShrink: 0 }}
              />
              <Text style={[styles.certModalTitle, { color: colors.text }]} numberOfLines={1}>
                {isBangla ? 'অফিসিয়াল সার্টিফিকেট প্রিভিউ' : 'Official Certificate Preview'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ flexShrink: 0 }}
              accessibilityRole="button"
              accessibilityLabel="Close certificate preview"
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* The Certificate Canvas */}
            <View
              style={[
                styles.certCanvas,
                { borderColor: '#D4AF37', backgroundColor: isDark ? '#121316' : '#FFFFFF' },
              ]}
            >
              {/* Gold Inner Border */}
              <View style={[styles.certInnerBorder, { borderColor: '#D4AF37' }]}>
                {/* Top Seal & Organization Header */}
                <View style={styles.certCanvasHeader}>
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={{ width: 34, height: 34, borderRadius: 8, marginBottom: 4 }}
                    resizeMode="contain"
                  />
                  <Text style={[styles.certOrgName, { color: colors.text }]}>
                    THRIVING <Text style={{ color: '#E34234' }}>SKILLS</Text> LIMITED
                  </Text>
                  <Text style={[styles.certOrgLoc, { color: colors.textMuted }]}>
                    DHAKA, BANGLADESH • SDG-4 QUALITY EDUCATION
                  </Text>
                </View>

                <View style={styles.certRibbonRow}>
                  <View style={styles.certLine} />
                  <Text style={styles.certMainHeading}>CERTIFICATE OF ACHIEVEMENT</Text>
                  <View style={styles.certLine} />
                </View>

                <Text style={[styles.certPresentedTo, { color: colors.textMuted }]}>
                  THIS IS PROUDLY PRESENTED TO
                </Text>

                <Text style={[styles.certLearnerName, { color: colors.text }]}>
                  {userName || 'Executive Graduate'}
                </Text>
                <View style={[styles.nameUnderline, { backgroundColor: '#D4AF37' }]} />

                <Text style={[styles.certBodyText, { color: colors.textMuted }]}>
                  for successfully mastering all curriculum modules and professional competencies in
                </Text>

                <Text style={[styles.certCourseName, { color: colors.primary }]}>
                  {course.title}
                </Text>

                {/* Verification Seal & Credential ID */}
                <View style={styles.certMetaRow}>
                  <View style={styles.certQrBox}>
                    <Ionicons name="qr-code-outline" size={34} color={colors.text} />
                    <Text style={[styles.certVerifyText, { color: colors.textMuted }]}>
                      Scan to Verify
                    </Text>
                  </View>

                  <View style={styles.certGoldSeal}>
                    <Ionicons name="medal" size={20} color="#E34234" />
                    <Text style={styles.certSealText}>VERIFIED</Text>
                    <Text style={styles.certSealSub}>CREDENTIAL</Text>
                  </View>

                  <View style={styles.certSigCol}>
                    <Text style={[styles.sigCursive, { color: colors.text }]}>
                      Abdullah Al Mahmud
                    </Text>
                    <View style={[styles.sigLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.sigTitle, { color: colors.textMuted }]}>
                      Md. Abdullah Al Mahmud
                    </Text>
                    <Text style={[styles.sigSub, { color: colors.textMuted }]}>
                      CEO, Thriving Skills Ltd.
                    </Text>
                  </View>
                </View>

                <View style={styles.certIdRow}>
                  <Text style={[styles.certIdText, { color: colors.textMuted }]}>
                    Credential ID: {certId} • thrivingskill.com/verify
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.certModalActions}>
              {isUnlocked ? (
                <TouchableOpacity
                  style={[styles.certShareBtn, { backgroundColor: '#0A66C2' }]}
                  onPress={handleLinkedInShare}
                  accessibilityRole="button"
                  accessibilityLabel="Add certificate to LinkedIn Profile"
                >
                  <Ionicons name="logo-linkedin" size={16} color="#FFFFFF" />
                  <Text style={styles.certShareBtnText}>Add to LinkedIn Profile</Text>
                </TouchableOpacity>
              ) : isCompleted && !hasReviewed ? (
                <TouchableOpacity
                  style={[styles.certShareBtn, { backgroundColor: '#E34234' }]}
                  onPress={() => {
                    onClose();
                    onOpenMandatoryReview();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isBangla
                      ? 'রিভিউ দিয়ে সার্টিফিকেট আনলক করুন'
                      : 'Rate & Review to Unlock Certificate'
                  }
                >
                  <Ionicons name="star" size={16} color="#FFFFFF" />
                  <Text style={styles.certShareBtnText}>
                    {isBangla ? 'রিভিউ দিয়ে সার্টিফিকেট আনলক করুন' : 'Rate & Review to Unlock'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={[styles.certShareBtn, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}
                >
                  <Ionicons name="lock-closed" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text
                    style={[styles.certShareBtnText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                  >
                    {isBangla ? 'কোর্স সম্পন্ন ও রিভিউ দিলে আনলক হবে' : 'Complete & Review to Unlock'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.certCloseBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close certificate preview"
              >
                <Text style={[styles.certCloseBtnText, { color: colors.text }]}>Close Preview</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  certModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  certModalCard: {
    borderRadius: 16,
    maxHeight: '85%',
    padding: 16,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  certModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  certModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  certCanvas: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  certInnerBorder: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  certCanvasHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  certOrgName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  certOrgLoc: {
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  certRibbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  certLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D4AF37',
  },
  certMainHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  certPresentedTo: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  certLearnerName: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  nameUnderline: {
    width: 140,
    height: 1.5,
    marginVertical: 6,
  },
  certBodyText: {
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 6,
  },
  certCourseName: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  certMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
  },
  certQrBox: {
    alignItems: 'center',
    gap: 2,
  },
  certVerifyText: {
    fontSize: 8,
    fontWeight: '600',
  },
  certGoldSeal: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(227, 66, 52, 0.1)',
  },
  certSealText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#E34234',
  },
  certSealSub: {
    fontSize: 7,
    fontWeight: '700',
    color: '#E34234',
  },
  certSigCol: {
    alignItems: 'center',
  },
  sigCursive: {
    fontStyle: 'italic',
    fontSize: 12,
    fontWeight: '600',
    color: '#102F53',
  },
  sigLine: {
    width: 80,
    height: 1,
    marginVertical: 3,
  },
  sigTitle: {
    fontSize: 8,
    fontWeight: '700',
  },
  sigSub: {
    fontSize: 7,
  },
  certIdRow: {
    marginTop: 8,
  },
  certIdText: {
    fontSize: 8,
    textAlign: 'center',
  },
  certModalActions: {
    gap: 8,
  },
  certShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  certShareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  certCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  certCloseBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
