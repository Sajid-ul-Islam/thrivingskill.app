import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export type LegalTabKey = 'terms' | 'privacy_en' | 'privacy_bn';

interface LegalPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: LegalTabKey;
}

export const LegalPolicyModal: React.FC<LegalPolicyModalProps> = ({
  visible,
  onClose,
  initialTab = 'terms',
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LegalTabKey>(initialTab);

  if (!visible) return null;

  const handleOpenWebLegal = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.surfaceCard,
              paddingTop: insets.top ? insets.top + 8 : 16,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.legalIconBadge, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isBangla ? 'আইনি নীতিমালা ও অধিকার' : 'Legal & Policies'}
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                Thriving Skills Limited • thrivingskill.com
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close Legal Modal"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabBar, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          {[
            { key: 'terms' as LegalTabKey, label: isBangla ? 'শর্তাবলী' : 'Terms & Conditions', icon: 'shield-checkmark-outline' },
            { key: 'privacy_en' as LegalTabKey, label: 'Privacy (EN)', icon: 'lock-closed-outline' },
            { key: 'privacy_bn' as LegalTabKey, label: 'গোপনীয়তা (বাংলা)', icon: 'book-outline' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabItem,
                  isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 },
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.primary : colors.textMuted, fontWeight: isActive ? '700' : '500' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 1: TERMS AND CONDITIONS */}
          {activeTab === 'terms' && (
            <View style={styles.contentBlock}>
              <View style={[styles.metaBanner, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', borderColor: '#3B82F644' }]}>
                <Ionicons name="information-circle" size={18} color="#3B82F6" />
                <Text style={[styles.metaBannerText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
                  Official Terms of Use for Thriving Skills Limited platform and digital services.
                </Text>
              </View>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>1. Acceptance of Terms</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                Welcome to thrivingskill.com! These terms and conditions outline the rules and regulations for the use of Thriving Skills Limited’s mobile and web platforms located at https://www.thrivingskill.com. By accessing or using this service, you acknowledge that you have read, understood, and agreed to be bound by all of the terms and conditions stated herein.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>2. Intellectual Property Rights & License</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                Unless otherwise stated, Thriving Skills Limited and/or its licensors own the intellectual property rights for all materials, courses, video masterclasses, curriculum assets, software, and brand trademarks on thrivingskill.com. All intellectual property rights are reserved worldwide.
              </Text>
              <View style={[styles.bulletCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <Text style={[styles.bulletTitle, { color: colors.text }]}>Learners and users must NOT:</Text>
                <Text style={[styles.bulletItem, { color: colors.textMuted }]}>• Republish, pirate, or redistribute course material without written permission</Text>
                <Text style={[styles.bulletItem, { color: colors.textMuted }]}>• Sell, rent, or sub-license material or account credentials to third parties</Text>
                <Text style={[styles.bulletItem, { color: colors.textMuted }]}>• Reproduce, duplicate, or reverse engineer any software or course files</Text>
                <Text style={[styles.bulletItem, { color: colors.textMuted }]}>• Infringe upon copyright, patent, or trademark protections of instructors</Text>
              </View>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>3. Payment & Transactions</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                Course enrollment and subscription fees are collected through secure SSLCommerz and authorized international payment gateways with your full consent. Please verify applicable discount vouchers before completing transactions. As per company policy, digital educational access is granted instantly upon checkout.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>4. User Code of Conduct</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                Users agree not to post defamatory, offensive, or unlawful material in discussion boards, Q&A forums, or AI copilot prompts. Thriving Skills reserves the right to moderate and revoke access in cases of ethical breach or harmful conduct.
              </Text>

              <TouchableOpacity
                style={[styles.webLinkBtn, { borderColor: colors.primary }]}
                onPress={() => handleOpenWebLegal('https://thrivingskill.com/terms-and-conditions/')}
              >
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
                <Text style={[styles.webLinkText, { color: colors.primary }]}>
                  View Live Terms & Conditions on thrivingskill.com
                </Text>
                <Ionicons name="open-outline" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 2: PRIVACY POLICY (ENGLISH) */}
          {activeTab === 'privacy_en' && (
            <View style={styles.contentBlock}>
              <View style={[styles.metaBanner, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', borderColor: '#10B98144' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                <Text style={[styles.metaBannerText, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                  We prioritize your privacy. Learn how your learner data is safeguarded and encrypted.
                </Text>
              </View>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>1. Overview & Scope</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                At thrivingskill.com, accessible from https://www.thrivingskill.com, one of our main priorities is the privacy and security of our visitors and learners. This Privacy Policy document outlines the types of information that is collected and recorded by Thriving Skills Limited and how we securely utilize it.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>2. Information We Collect</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                When you create an account, enroll in courses, or contact our support desk, we may collect your name, email address, phone number, institutional affiliation, course progress metrics, and certificate verification records. Standard log files capture IP addresses, browser types, and session timestamps for analytics and system security.
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>3. Data Protection & Cookies</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                We employ industry-standard encryption, SSL transmission protocols, and tokenized authorization. Cookies are utilized to remember learner session states, course playback positions, and personalized language preferences (English & বাংলা).
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>4. Children’s Information Protection</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                thrivingskill.com does not knowingly collect Personally Identifiable Information from children under the age of 13. If you believe such data has been entered without parental consent, contact our Data Protection Officer immediately for swift removal.
              </Text>

              <TouchableOpacity
                style={[styles.webLinkBtn, { borderColor: colors.primary }]}
                onPress={() => handleOpenWebLegal('https://thrivingskill.com/privacy-policy/')}
              >
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
                <Text style={[styles.webLinkText, { color: colors.primary }]}>
                  View Live Privacy Policy on thrivingskill.com
                </Text>
                <Ionicons name="open-outline" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 3: PRIVACY POLICY (BANGLA) */}
          {activeTab === 'privacy_bn' && (
            <View style={styles.contentBlock}>
              <View style={[styles.metaBanner, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : '#FAF5FF', borderColor: '#A855F744' }]}>
                <Ionicons name="lock-closed" size={18} color="#A855F7" />
                <Text style={[styles.metaBannerText, { color: isDark ? '#D8B4FE' : '#6B21A8' }]}>
                  থ্রাইভিং স্কিলস লিমিটেডের অফিসিয়াল বাংলা গোপনীয়তা নীতি (Privacy Policy Bangla).
                </Text>
              </View>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>১. সাধারণ তথ্য ও সম্মতি</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                thrivingskill.com-এ আমাদের প্রধান অগ্রাধিকারগুলোর মধ্যে একটি হল আমাদের শিক্ষার্থী ও ভিজিটরদের তথ্যের সর্বোচ্চ সুরক্ষা। আমাদের অ্যাপ ও ওয়েবসাইট ব্যবহার করে, আপনি আমাদের গোপনীয়তা নীতির শর্তাবলীতে সম্মতি প্রদান করছেন।
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>২. সংগৃহীত তথ্য ও ব্যবহার</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                শিক্ষার্থী নিবন্ধন, কোর্স এনরোলমেন্ট এবং সার্টিফিকেট ভেরিফিকেশনের জন্য নাম, ইমেইল, মোবাইল নম্বর এবং প্রগ্রেস ডাটা সংরক্ষিত হয়। এই তথ্য শুধুমাত্র লার্নিং এক্সপেরিয়েন্স উন্নত করা, কাস্টমার সাপোর্ট এবং সার্টিফিকেট অথেনটিকেশনের উদ্দেশ্যে ব্যবহৃত হয়।
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>৩. কুকিজ এবং নিরাপত্তা</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                অন্যান্য ওয়েবসাইটের মতো, thrivingskill.com ব্যবহারকারীদের পছন্দ এবং লগইন স্টেট সংরক্ষণের জন্য কুকিজ ও নিরাপদ এনক্রিপশন প্রোটোকল ব্যবহার করে। আপনার ব্যক্তিগত তথ্য কখনোই কোনো অননুমোদিত তৃতীয় পক্ষের কাছে বিক্রি বা অপব্যবহার করা হয় না।
              </Text>

              <Text style={[styles.sectionHeading, { color: colors.text }]}>৪. শিশুদের তথ্যের সুরক্ষা</Text>
              <Text style={[styles.bodyText, { color: colors.textMuted }]}>
                থ্রাইভিং স্কিলস ১৩ বছরের কম বয়সী শিশুদের কাছ থেকে কোনো সংবেদনশীল তথ্য সংগ্রহ করে না। অভিভাবকগণের যেকোনো পর্যবেক্ষণ বা তথ্যের অনুরোধ দ্রুততার সাথে নিষ্পত্তি করা হয়।
              </Text>

              <TouchableOpacity
                style={[styles.webLinkBtn, { borderColor: colors.primary }]}
                onPress={() => handleOpenWebLegal('https://thrivingskill.com/privacy-policy-bangla/')}
              >
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
                <Text style={[styles.webLinkText, { color: colors.primary }]}>
                  ওয়েবসাইটে বাংলা গোপনীয়তা নীতি দেখুন
                </Text>
                <Ionicons name="open-outline" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* ALL RIGHTS RESERVED COPYRIGHT FOOTER */}
          <View style={[styles.copyrightContainer, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={styles.sealRow}>
              <Ionicons name="ribbon" size={22} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sealTitle, { color: colors.text }]}>
                  {isBangla ? 'সর্বস্বত্ব সংরক্ষিত • থ্রাইভিং স্কিলস লিমিটেড' : 'All Rights Reserved • Thriving Skills Ltd.'}
                </Text>
                <Text style={[styles.sealDesc, { color: colors.textMuted }]}>
                  Registered Corporate Enterprise under the Companies Act of Bangladesh
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.legalInfoGrid}>
              <View style={styles.legalInfoRow}>
                <Ionicons name="business-outline" size={14} color={colors.primary} />
                <Text style={[styles.legalInfoText, { color: colors.textMuted }]}>
                  Gulshan-2, Dhaka, Bangladesh • Helpline: 01312 100288
                </Text>
              </View>
              <View style={styles.legalInfoRow}>
                <Ionicons name="mail-outline" size={14} color={colors.primary} />
                <Text style={[styles.legalInfoText, { color: colors.textMuted }]}>
                  Official Inquiries: info@thrivingskill.com
                </Text>
              </View>
              <View style={styles.legalInfoRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#10B981" />
                <Text style={[styles.legalInfoText, { color: '#10B981', fontWeight: '700' }]}>
                  Contributing to UN SDG-4 (Quality Education) & 4IR Readiness
                </Text>
              </View>
            </View>

            <Text style={[styles.copyrightNotice, { color: colors.textMuted }]}>
              © 2026 Thriving Skills Limited. All rights reserved. No part of this mobile application or associated digital learning platforms may be reproduced, distributed, or transmitted in any form without prior written authorization.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legalIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 12.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  contentBlock: {
    gap: 12,
  },
  metaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    marginTop: 6,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bulletCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginVertical: 4,
  },
  bulletTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  bulletItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  webLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  webLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  copyrightContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 14,
  },
  sealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sealTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sealDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  legalInfoGrid: {
    gap: 6,
  },
  legalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalInfoText: {
    fontSize: 11.5,
  },
  copyrightNotice: {
    fontSize: 10.5,
    lineHeight: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});
