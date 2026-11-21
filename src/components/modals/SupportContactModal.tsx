import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFeedback } from '../../context/FeedbackContext';
import { triggerHaptic } from '../../utils/haptics';
import {
  CRM_CHANNELS,
  CrmInquiryType,
  openWhatsAppChat,
  openFacebookMessenger,
  openFacebookPage,
  openCallHelpline,
} from '../../config/crm';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { MessengerIcon } from '../common/MessengerIcon';

export interface SupportContactModalProps {
  visible: boolean;
  onClose: () => void;
  initialInquiryType?: CrmInquiryType;
}

export const SupportContactModal: React.FC<SupportContactModalProps> = ({
  visible,
  onClose,
  initialInquiryType = 'general',
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const insets = useSafeAreaInsets();
  const [selectedTopic, setSelectedTopic] = useState<CrmInquiryType>(initialInquiryType);

  const topicOptions: { id: CrmInquiryType; label: string; icon: string }[] = [
    {
      id: 'general',
      label: isBangla ? 'সাধারণ তথ্য ও জিজ্ঞাসা' : 'General Inquiry',
      icon: 'help-circle-outline',
    },
    {
      id: 'payment',
      label: isBangla ? 'পেমেন্ট ও এনরোলমেন্ট' : 'Payment & Enrollment',
      icon: 'card-outline',
    },
    {
      id: 'live',
      label: isBangla ? 'লাইভ ক্লাস ও লিংক' : 'Live Class & Room Link',
      icon: 'videocam-outline',
    },
    {
      id: 'certificate',
      label: isBangla ? 'সার্টিফিকেট যাচাই' : 'Certificate Verification',
      icon: 'ribbon-outline',
    },
    {
      id: 'corporate',
      label: isBangla ? 'করপোরেট ট্রেনিং' : 'Corporate Training',
      icon: 'business-outline',
    },
  ];

  const handleOpenWhatsApp = async (topic = selectedTopic) => {
    triggerHaptic('medium');
    showToast({
      message: isBangla ? 'হোয়াটসঅ্যাপ খোলা হচ্ছে...' : 'Launching WhatsApp support...',
      type: 'info',
    });
    await openWhatsAppChat(topic, isBangla);
  };

  const handleOpenMessenger = async () => {
    triggerHaptic('medium');
    showToast({
      message: isBangla ? 'মেসেঞ্জার খোলা হচ্ছে...' : 'Launching Messenger support...',
      type: 'info',
    });
    await openFacebookMessenger();
  };

  const handleCall = async () => {
    triggerHaptic('light');
    await openCallHelpline();
  };

  const handleOpenFacebookPage = async () => {
    triggerHaptic('selection');
    await openFacebookPage();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Bar */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surfaceCard,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top, 14),
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={[styles.headerIconBg, { backgroundColor: isDark ? 'rgba(255, 182, 6, 0.15)' : colors.primaryLight }]}>
              <Ionicons name="headset" size={22} color={isDark ? colors.brandGold : colors.primary} />
            </View>
            <View style={styles.headerTitleCol}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {isBangla ? 'অফিসিয়াল সিআরএম ও হেল্পডেস্ক' : 'Official CRM & Helpdesk'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {isBangla ? 'হোয়াটসঅ্যাপ ও ফেসবুক মেসেঞ্জারে সরাসরি কথা বলুন' : 'Instant live support via WhatsApp & Messenger'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close support desk"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
          ]}
        >
          {/* Working Hours Badge */}
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.statusDot} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {isBangla ? 'এডভাইজার টিম প্রস্তুত আছে' : 'Support Advisors Active'}
              </Text>
              <Text style={[styles.statusHours, { color: colors.textMuted }]}>
                {isBangla ? CRM_CHANNELS.workingHoursBn : CRM_CHANNELS.workingHours}
              </Text>
            </View>
            <View style={[styles.verifiedPill, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.verifiedText}>Official</Text>
            </View>
          </View>

          {/* Inquiry Topic Picker (Pre-populates WhatsApp text) */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBangla ? '১. আপনার বিষয়টি নির্বাচন করুন' : '1. Select Your Inquiry Topic'}
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
              {isBangla
                ? 'বিষয় অনুযায়ী আমাদের এক্সপার্ট টিম দ্রুত রেসপন্স করবে'
                : 'Helps our advisors connect you to the right specialist faster'}
            </Text>
          </View>

          <View style={styles.topicsGrid}>
            {topicOptions.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicChip,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.surfaceCard,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedTopic(topic.id);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Ionicons
                    name={topic.icon as any}
                    size={16}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.topicChipText,
                      {
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {topic.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CRM Action Cards */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBangla ? '২. যোগাযোগ মাধ্যম বেছে নিন' : '2. Choose Official Contact Channel'}
            </Text>
          </View>

          {/* 1. Official WhatsApp Card */}
          <TouchableOpacity
            style={[styles.channelCard, { backgroundColor: '#25D366' }]}
            onPress={() => handleOpenWhatsApp()}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`Chat on WhatsApp at ${CRM_CHANNELS.phoneDisplay}`}
          >
            <View style={styles.channelIconWrap}>
              <Ionicons name="logo-whatsapp" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.channelTextCol}>
              <View style={styles.channelBadgeRow}>
                <Text style={styles.channelBadgeText}>RECOMMENDED & FASTEST</Text>
              </View>
              <Text style={styles.channelTitle}>WhatsApp Live Chat</Text>
              <Text style={styles.channelSubtitle}>
                {CRM_CHANNELS.phoneDisplay} • Direct message to advisors
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 2. Official Messenger Card */}
          <TouchableOpacity
            style={[styles.channelCard, { backgroundColor: '#0084FF', marginTop: 12 }]}
            onPress={handleOpenMessenger}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Chat on Messenger"
          >
            <View style={styles.channelIconWrap}>
              <MessengerIcon size={28} color="#FFFFFF" />
            </View>
            <View style={styles.channelTextCol}>
              <View style={[styles.channelBadgeRow, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                <Text style={styles.channelBadgeText}>OFFICIAL COMMUNITY CRM</Text>
              </View>
              <Text style={styles.channelTitle}>Messenger</Text>
              <Text style={styles.channelSubtitle}>
                facebook.com/thrivingskills • @thrivingskills
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Secondary Actions Row: Direct Phone Call & Facebook Page */}
          <View style={styles.secondaryRow}>
            {/* Direct Phone Call */}
            <TouchableOpacity
              style={[
                styles.secondaryCard,
                { backgroundColor: colors.surfaceCard, borderColor: colors.border },
              ]}
              onPress={handleCall}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Call official helpline at ${CRM_CHANNELS.phoneDisplay}`}
            >
              <View style={[styles.secondaryIconBg, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="call" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.secondaryTitle, { color: colors.text }]} numberOfLines={1}>
                  {isBangla ? 'সরাসরি কল করুন' : 'Helpline Call'}
                </Text>
                <Text style={[styles.secondarySub, { color: colors.primary }]} numberOfLines={1}>
                  {CRM_CHANNELS.phoneDisplay}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Visit Official Facebook Page */}
            <TouchableOpacity
              style={[
                styles.secondaryCard,
                { backgroundColor: colors.surfaceCard, borderColor: colors.border },
              ]}
              onPress={handleOpenFacebookPage}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Visit official Facebook page"
            >
              <View style={[styles.secondaryIconBg, { backgroundColor: 'rgba(24, 119, 242, 0.12)' }]}>
                <Ionicons name="open-outline" size={18} color="#1877F2" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.secondaryTitle, { color: colors.text }]} numberOfLines={1}>
                  {isBangla ? 'অফিসিয়াল পেজ' : 'FB Official Page'}
                </Text>
                <Text style={[styles.secondarySub, { color: '#1877F2' }]} numberOfLines={1}>
                  thrivingskills
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Confidence Note */}
          <View style={[styles.footerNote, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.footerNoteText, { color: colors.textMuted }]}>
              {isBangla
                ? 'থ্রাইভিং স্কিলসের সকল কোর্স, পেমেন্ট ও এনরোলমেন্ট সরাসরি https://thrivingskill.com এর অফিসিয়াল সিস্টেমের সাথে যুক্ত।'
                : 'Official support for courses, certificates, and live workshops hosted by Thriving Skills Ltd.'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBg: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  headerTitle: {
    ...typography.h4,
    fontSize: 17,
  },
  headerSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: shape.large,
    borderWidth: 1,
    gap: 12,
    marginBottom: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusHours: {
    fontSize: 11,
    marginTop: 1,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: shape.small,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  topicsGrid: {
    gap: 8,
    marginBottom: 20,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 10,
  },
  topicChipText: {
    flex: 1,
    fontSize: 12.5,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: shape.large,
    gap: 14,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  channelIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTextCol: {
    flex: 1,
    minWidth: 0,
  },
  channelBadgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  channelBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  channelTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  channelSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11.5,
    marginTop: 2,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 18,
  },
  secondaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 10,
  },
  secondaryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondarySub: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: shape.medium,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
});
