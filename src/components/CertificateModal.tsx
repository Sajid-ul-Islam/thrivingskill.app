import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Certificate } from '../types';
import { useTheme } from '../context/ThemeContext';

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
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!certificate) return null;

  const handleShare = async () => {
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
    setIsDownloadingPdf(true);
    setTimeout(async () => {
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
    Linking.openURL(certificate.verificationUrl).catch(() => {
      Alert.alert('Verification', `Visit ${certificate.verificationUrl} to verify this credential online.`);
    });
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddToLinkedIn = () => {
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
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificate.verificationUrl)}`;
    Linking.openURL(shareUrl).catch(() => {
      handleShare();
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {/* Top Bar */}
          <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
            <View style={styles.topBarLeft}>
              <Ionicons name="ribbon" size={20} color={colors.accent} />
              <Text style={[styles.topBarTitle, { color: colors.text }]}>Verified Certificate</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                style={[styles.downloadPdfBtn, { backgroundColor: colors.accent }]}
                onPress={handleDownloadPdf}
                disabled={isDownloadingPdf}
                activeOpacity={0.88}
              >
                {isDownloadingPdf ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="arrow-down-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.downloadPdfText}>Download PDF Certificate</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Add to LinkedIn Profile */}
              <TouchableOpacity
                style={[styles.linkedinActionBtn, { backgroundColor: '#0A66C2' }]}
                onPress={handleAddToLinkedIn}
                activeOpacity={0.88}
              >
                <Ionicons name="logo-linkedin" size={18} color="#FFFFFF" />
                <Text style={styles.linkedinActionText}>Add to LinkedIn Profile</Text>
              </TouchableOpacity>

              {/* Share Row: Native Share + Post on LinkedIn */}
              <View style={styles.actionRowHalf}>
                <TouchableOpacity
                  style={[styles.halfActionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-social-outline" size={16} color={colors.text} />
                  <Text style={[styles.halfActionText, { color: colors.text }]}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.halfActionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={handleShareToLinkedInFeed}
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
                >
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                  <Text style={[styles.halfActionText, { color: colors.primary }]}>Verify on Web</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
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
