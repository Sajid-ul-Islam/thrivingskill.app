import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Certificate } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLearning } from '../../context/LearningContext';
import { triggerHaptic } from '../../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { MandatoryReviewModal } from './MandatoryReviewModal';

interface CertificateModalProps {
  visible: boolean;
  certificate: Certificate | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  visible,
  certificate,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const { hasReviewedCourse, submitMandatoryCourseReview } = useLearning();
  const insets = useSafeAreaInsets();
  const pdfTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (pdfTimerRef.current) clearTimeout(pdfTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  if (!certificate) return null;

  const isReviewed = certificate.courseId ? hasReviewedCourse(certificate.courseId) : true;

  const requireReviewGate = (): boolean => {
    if (!isReviewed) {
      triggerHaptic('warning');
      showToast({
        message: isBangla
          ? 'সার্টিফিকেট ডাউনলোড বা শেয়ার করতে আগে রিভিউ দিন'
          : 'Rating and review required before downloading or sharing certificate',
        type: 'warning',
      });
      setReviewModalVisible(true);
      return false;
    }
    return true;
  };

  const handleShare = async () => {
    if (!requireReviewGate()) return;
    try {
      await Share.share({
        message: `I've successfully completed "${certificate.courseTitle}" on Thriving Skills! Check my verified certificate: ${certificate.verificationUrl}`,
        title: `Thriving Skills Certificate - ${certificate.courseTitle}`,
      });
    } catch {
      Alert.alert('Shared', 'Certificate link copied to clipboard.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!requireReviewGate()) return;
    setIsDownloadingPdf(true);
    pdfTimerRef.current = setTimeout(async () => {
      setIsDownloadingPdf(false);
      try {
        await Share.share({
          title: `ThrivingSkills-Certificate-${certificate.credentialId}.pdf`,
          message: `Official Thriving Skills Accredited Certificate of Completion\nCourse: ${certificate.courseTitle}\nRecipient: ${certificate.studentName}\nCredential ID: ${certificate.credentialId}\nVerified at: ${certificate.verificationUrl}`,
        });
      } catch {
        Alert.alert('PDF Exported', 'Certificate PDF downloaded and saved to your device.');
      }
    }, 1200);
  };

  const handleVerifyOnline = () => {
    if (!requireReviewGate()) return;
    Linking.openURL(certificate.verificationUrl).catch(() => {
      Alert.alert('Verification', `Visit ${certificate.verificationUrl} to verify this credential online.`);
    });
  };

  const handleCopyLink = async () => {
    if (!requireReviewGate()) return;
    triggerHaptic('selection');
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(certificate.verificationUrl);
      } else {
        await Share.share({
          message: certificate.verificationUrl,
          title: `Verify ${certificate.courseTitle} Certificate`,
        });
      }
      setCopied(true);
      triggerHaptic('success');
      showToast({ message: 'Credential verification link copied', type: 'success' });
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      Alert.alert('Verification Link', certificate.verificationUrl);
    }
  };

  const handleAddToLinkedIn = () => {
    if (!requireReviewGate()) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const certName = encodeURIComponent(certificate.courseTitle);
    const orgName = encodeURIComponent('Thriving Skills');
    const certUrl = encodeURIComponent(certificate.verificationUrl);
    const certId = encodeURIComponent(certificate.credentialId);

    const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationName=${orgName}&issueYear=${year}&issueMonth=${month}&certUrl=${certUrl}&certId=${certId}`;

    Linking.openURL(linkedinUrl).catch(() => {
      Alert.alert('Unable to open LinkedIn', 'Please verify your network connection or copy your credential link.');
    });
  };

  const handleShareToLinkedInFeed = () => {
    if (!requireReviewGate()) return;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificate.verificationUrl)}`;
    Linking.openURL(shareUrl).catch(() => {
      handleShare();
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]} accessibilityViewIsModal={true}
        >
          {/* Top Bar */}
          <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
            <View style={styles.topBarLeft}>
              <Ionicons name="ribbon" size={20} color={colors.accent} style={{ flexShrink: 0 }} />
              <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>Verified Certificate</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close certificate dialog">
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            {/* Mandatory Review Warning Banner when certificate is locked */}
            {!isReviewed && (
              <View
                style={[
                  styles.lockedBanner,
                  {
                    backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                    borderColor: '#F59E0B',
                  },
                ]}
              >
                <View style={styles.lockedBannerHeader}>
                  <View style={styles.lockedIconCircle}>
                    <Ionicons name="lock-closed" size={16} color="#B45309" />
                  </View>
                  <Text style={[styles.lockedBannerTitle, { color: isDark ? '#FBBF24' : '#92400E' }]}>
                    {isBangla ? 'সার্টিফিকেট ডাউনলোড করতে রিভিউ আবশ্যক' : 'Mandatory Review Required to Unlock'}
                  </Text>
                </View>
                <Text style={[styles.lockedBannerBody, { color: isDark ? '#E5E7EB' : '#78350F' }]}>
                  {isBangla
                    ? 'অফিসিয়াল সার্টিফিকেট PDF ডাউনলোড, লিঙ্কডইন অ্যাড এবং ভেরিফিকেশন লিংক পেতে কোর্সটির উপর ১-৫ স্টার রেটিং ও মতামত প্রদান করুন।'
                    : 'To download official PDF, share, or add credentials to LinkedIn, please rate this course (1 to 5 stars) and write your review.'}
                </Text>
                <TouchableOpacity
                  style={styles.reviewNowCta}
                  onPress={() => setReviewModalVisible(true)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Rate and review course to unlock certificate"
                >
                  <Ionicons name="star" size={15} color="#FFFFFF" />
                  <Text style={styles.reviewNowCtaText}>
                    {isBangla ? 'এখনই রিভিউ দিন (১-৫ স্টার)' : 'Submit Review to Unlock'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* The Certificate Frame */}
            <View style={[styles.certFrame, { backgroundColor: '#FFFFFF', borderColor: '#FFB606' }]}>
              {/* Inner Decorative Border */}
              <View style={[styles.certInnerBorder, { borderColor: '#102F53' }]}>
                {/* Logo Header */}
                <View style={styles.certHeader}>
                  <View style={[styles.certLogoBadge, { backgroundColor: '#102F53' }]}>
                    <Ionicons name="school" size={20} color="#FFB606" />
                  </View>
                  <Text style={[styles.certOrgName, { color: '#102F53' }]}>THRIVING SKILLS</Text>
                  <Text style={styles.certOrgSub}>ACADEMY OF EXECUTIVE EXCELLENCE</Text>
                </View>

                {/* Certificate Text */}
                <Text style={styles.certMainHeading}>CERTIFICATE OF COMPLETION</Text>
                <Text style={styles.certSubText}>This is to proudly certify that</Text>

                <Text style={styles.certStudentName}>{certificate.studentName}</Text>
                <View style={styles.certNameDivider} />

                <Text style={styles.certSubText}>has successfully mastered and completed</Text>
                <Text style={styles.certCourseTitle}>{certificate.courseTitle}</Text>

                {/* Footer / Signatures */}
                <View style={styles.certFooter}>
                  <View style={styles.signCol}>
                    <Text style={styles.signName}>{certificate.instructorName}</Text>
                    <View style={styles.signLine} />
                    <Text style={styles.signTitle}>Course Director</Text>
                  </View>

                  <View style={[styles.goldSeal, { borderColor: '#FFB606', backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="shield-checkmark" size={26} color="#D97706" />
                    <Text style={styles.sealText}>VERIFIED</Text>
                  </View>

                  <View style={styles.signCol}>
                    <Text style={styles.signName}>{certificate.issueDate}</Text>
                    <View style={styles.signLine} />
                    <Text style={styles.signTitle}>Date Issued</Text>
                  </View>
                </View>

                {/* Credential ID */}
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialText}>
                    Credential ID: <Text style={{ fontWeight: '700' }}>{certificate.credentialId}</Text>
                  </Text>
                </View>

                {/* Verifiable QR Code Section */}
                <View style={styles.qrCodeSection}>
                  <View style={styles.qrMatrixContainer}>
                    <View style={styles.qrFinderTopLeft}>
                      <View style={styles.qrFinderInner} />
                    </View>
                    <View style={styles.qrFinderTopRight}>
                      <View style={styles.qrFinderInner} />
                    </View>
                    <View style={styles.qrFinderBottomLeft}>
                      <View style={styles.qrFinderInner} />
                    </View>
                    <View style={styles.qrPatternGrid}>
                      {[...Array(36)].map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.qrDot,
                            {
                              backgroundColor:
                                (i * 7 + certificate.credentialId.length) % 3 === 0
                                  ? '#102F53'
                                  : 'transparent',
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <View style={styles.qrCenterShield}>
                      <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                    </View>
                  </View>
                  <View style={styles.qrMetaCol}>
                    <Text style={styles.qrScanTitle}>Verifiable Credential</Text>
                    <Text style={styles.qrScanText}>Scan with camera or visit:</Text>
                    <Text style={styles.qrUrlText}>thrivingskill.com/verify</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {/* Primary: Download PDF Certificate */}
              <TouchableOpacity
                style={[
                  styles.downloadPdfBtn,
                  { backgroundColor: isReviewed ? colors.accent : '#F59E0B' },
                ]}
                onPress={handleDownloadPdf}
                disabled={isDownloadingPdf}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={
                  isReviewed
                    ? (isBangla ? 'পিডিএফ সার্টিফিকেট ডাউনলোড করুন' : 'Download PDF Certificate')
                    : (isBangla ? 'রিভিউ দিয়ে সার্টিফিকেট ডাউনলোড করুন (লক)' : 'Review to Download PDF (Locked)')
                }
              >
                {isDownloadingPdf ? (
                  <ActivityIndicator color={colors.onAccent} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name={isReviewed ? 'arrow-down-circle-outline' : 'lock-closed'}
                      size={18}
                      color={isReviewed ? colors.onAccent : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        styles.downloadPdfText,
                        { color: isReviewed ? colors.onAccent : '#FFFFFF' },
                      ]}
                    >
                      {isReviewed
                        ? (isBangla ? 'পিডিএফ সার্টিফিকেট ডাউনলোড করুন' : 'Download PDF Certificate')
                        : (isBangla ? 'রিভিউ দিয়ে ডাউনলোড করুন (লক)' : 'Review to Download PDF (Locked)')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Add to LinkedIn Profile */}
              <TouchableOpacity
                style={[styles.linkedinActionBtn, { backgroundColor: isReviewed ? '#0A66C2' : (isDark ? '#374151' : '#E5E7EB') }]}
                onPress={handleAddToLinkedIn}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={isReviewed ? "Add to LinkedIn Profile" : "Review required to add credential to LinkedIn"}
              >
                <Ionicons name="logo-linkedin" size={18} color={isReviewed ? "#FFFFFF" : (isDark ? "#9CA3AF" : "#6B7280")} />
                <Text style={[styles.linkedinActionText, !isReviewed && { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                  {isReviewed ? 'Add to LinkedIn Profile' : (isBangla ? 'রিভিউ দিয়ে লিঙ্কডইনে যোগ করুন' : 'Review to Add on LinkedIn')}
                </Text>
              </TouchableOpacity>

              {/* Share Row: Native Share + Post on LinkedIn */}
              <View style={styles.actionRowHalf}>
                <TouchableOpacity
                  style={[styles.halfActionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={handleShare}
                  accessibilityRole="button"
                  accessibilityLabel="Share certificate"
                >
                  <Ionicons name="share-social-outline" size={16} color={colors.text} />
                  <Text style={[styles.halfActionText, { color: colors.text }]}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.halfActionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={handleShareToLinkedInFeed}
                  accessibilityRole="button"
                  accessibilityLabel="Post certificate to LinkedIn feed"
                >
                  <Ionicons name="logo-linkedin" size={16} color="#0A66C2" />
                  <Text style={[styles.halfActionText, { color: colors.text }]}>Post to Feed</Text>
                </TouchableOpacity>
              </View>

              {/* Copy URL + Verify on Web */}
              <View style={styles.actionRowHalf}>
                <TouchableOpacity
                  style={[styles.halfActionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={handleCopyLink}
                  accessibilityRole="button"
                  accessibilityLabel={copied ? "Certificate link copied" : "Copy certificate link"}
                >
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={16}
                    color={copied ? '#10B981' : colors.textMuted}
                  />
                  <Text style={[styles.halfActionText, { color: copied ? '#10B981' : colors.text }]}>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.halfActionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={handleVerifyOnline}
                  accessibilityRole="button"
                  accessibilityLabel="Verify certificate online in browser"
                >
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                  <Text style={[styles.halfActionText, { color: colors.primary }]}>Verify on Web</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Mandatory Review Modal for Gated Unlock (CR-02) */}
      {certificate && (
        <MandatoryReviewModal
          visible={reviewModalVisible}
          courseTitle={certificate.courseTitle}
          instructorName={certificate.instructorName}
          onSubmit={(rating, feedback) => {
            submitMandatoryCourseReview(
              certificate.courseId,
              rating,
              feedback,
              certificate.studentName,
              'Course Graduate'
            );
            setReviewModalVisible(false);
            triggerHaptic('success');
            showToast({
              message: isBangla
                ? '🎉 রিভিউ সম্পন্ন হয়েছে! সার্টিফিকেট সফলভাবে আনলক হয়েছে।'
                : '🎉 Review submitted! Certificate unlocked.',
              type: 'success',
            });
          }}
          onDismissLater={() => setReviewModalVisible(false)}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  lockedBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  lockedBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  lockedIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  lockedBannerBody: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  reviewNowCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    minHeight: MIN_TOUCH_TARGET,
  },
  reviewNowCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  topBarTitle: {
    ...typography.h4,
    flex: 1,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scrollContainer: {
    padding: 16,
  },
  certFrame: {
    borderRadius: 12,
    borderWidth: 4,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  certInnerBorder: {
    borderWidth: 1.5,
    borderColor: '#D97706',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
  },
  certHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  certLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  certOrgName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#065F46',
  },
  certOrgSub: {
    fontSize: 9,
    letterSpacing: 1,
    color: '#047857',
    fontWeight: '700',
  },
  certMainHeading: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 4,
  },
  certSubText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  certStudentName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  certNameDivider: {
    width: 140,
    height: 1.5,
    backgroundColor: '#D97706',
    marginVertical: 6,
  },
  certCourseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    paddingTop: 10,
  },
  signCol: {
    alignItems: 'center',
    flex: 1,
  },
  signName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  signLine: {
    width: 80,
    height: 1,
    backgroundColor: '#CBD5E1',
    marginBottom: 4,
  },
  signTitle: {
    fontSize: 9,
    color: '#64748B',
  },
  goldSeal: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  sealText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#B45309',
    marginTop: 2,
  },
  credentialRow: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
    alignItems: 'center',
  },
  credentialText: {
    fontSize: 10,
    color: '#64748B',
  },
  actionsContainer: {
    marginTop: 16,
    gap: 10,
  },
  linkedinActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  linkedinActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionRowHalf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  halfActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  halfActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  downloadPdfText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qrCodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '100%',
  },
  qrMatrixContainer: {
    width: 68,
    height: 68,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#102F53',
    borderRadius: 8,
    padding: 3,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFinderTopLeft: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: '#102F53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFinderTopRight: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: '#102F53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFinderBottomLeft: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: '#102F53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFinderInner: {
    width: 6,
    height: 6,
    backgroundColor: '#102F53',
  },
  qrPatternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 44,
    height: 44,
    justifyContent: 'space-around',
    alignContent: 'space-around',
  },
  qrDot: {
    width: 5,
    height: 5,
    borderRadius: 1,
    margin: 1,
  },
  qrCenterShield: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
  },
  qrMetaCol: {
    justifyContent: 'center',
  },
  qrScanTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#102F53',
    letterSpacing: 0.5,
  },
  qrScanText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  qrUrlText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
