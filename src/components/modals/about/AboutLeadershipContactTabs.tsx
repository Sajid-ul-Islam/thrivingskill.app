import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Env } from '../../../config/env';
import { getSafeImageSource } from '../../../utils/imageUtils';
import { LegalTabKey } from '../LegalPolicyModal';
import { ABOUT_SOCIAL_CHANNELS, getLeadershipMembers } from './aboutTSL.data';
import { aboutTslStyles as styles } from './aboutTSL.styles';

interface LeadershipTabProps {
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  onOpenUrl: (url: string) => void;
}

export const AboutLeadershipTab: React.FC<LeadershipTabProps> = ({
  colors,
  isDark,
  isBangla,
  onOpenUrl,
}) => (
  <View style={styles.sectionContainer}>
    <View
      style={[
        styles.verifiedHeaderBanner,
        {
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
          borderColor: '#10B981',
        },
      ]}
    >
      <Ionicons name="shield-checkmark" size={18} color="#10B981" />
      <Text style={[styles.verifiedHeaderText, { color: isDark ? '#34D399' : '#065F46' }]}>
        {isBangla
          ? 'অফিসিয়াল পোর্টাল (thrivingskill.com) থেকে ভেরিফাইড পরিচালনা পর্ষদ ও ফাউন্ডার্স'
          : 'Official Verified Leadership & Founders from thrivingskill.com'}
      </Text>
    </View>

    <Text style={[styles.subheading, { color: colors.textMuted }]}>
      {isBangla
        ? 'থ্রাইভিং স্কিলস লিমিটেডের প্রতিষ্ঠাতা ও পরিচালনা পর্ষদ:'
        : 'Executive Leadership & Board of Directors:'}
    </Text>

    {getLeadershipMembers(isBangla).map((leader, idx) => (
      <View
        key={idx}
        style={[
          styles.leaderCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: leader.isFounder
              ? isDark
                ? 'rgba(227, 66, 52, 0.4)'
                : 'rgba(227, 66, 52, 0.25)'
              : colors.border,
            borderWidth: leader.isFounder ? 1.5 : 1,
          },
        ]}
      >
        <View style={styles.leaderAvatarContainer}>
          <Image
            source={leader.localAvatar || getSafeImageSource(leader.webAvatar)}
            style={styles.leaderAvatar}
            resizeMode="cover"
            {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
          />
          {leader.isFounder ? (
            <View style={[styles.founderStarBadge, { backgroundColor: '#E34234' }]}>
              <Ionicons name="star" size={10} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.verifiedCheckDot}>
              <Ionicons name="checkmark" size={9} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.leaderHeaderLine}>
            <Text style={[styles.leaderName, { color: colors.text }]}>{leader.name}</Text>
            {leader.badge && (
              <View
                style={[
                  styles.leaderBadgePill,
                  {
                    backgroundColor: leader.isFounder
                      ? isDark
                        ? 'rgba(227, 66, 52, 0.2)'
                        : 'rgba(227, 66, 52, 0.12)'
                      : isDark
                        ? '#064E3B'
                        : '#E0F2FE',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.leaderBadgePillText,
                    {
                      color: leader.isFounder ? '#E34234' : isDark ? '#6EE7B7' : '#0369A1',
                    },
                  ]}
                >
                  {leader.badge}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.leaderTitle, { color: colors.primary }]}>{leader.title}</Text>
          <Text style={[styles.leaderDesc, { color: colors.textMuted }]}>{leader.desc}</Text>

          <View style={styles.leaderActionsRow}>
            {leader.profileUrl && (
              <TouchableOpacity
                style={[
                  styles.leaderMiniBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
                ]}
                onPress={() => onOpenUrl(leader.profileUrl)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Open official bio for ${leader.name}`}
              >
                <Ionicons name="globe-outline" size={12} color={colors.primary} />
                <Text style={[styles.leaderMiniBtnText, { color: colors.primary }]}>
                  {isBangla ? 'অফিসিয়াল প্রোফাইল' : 'Official Bio'}
                </Text>
                <Ionicons name="open-outline" size={10} color={colors.primary} />
              </TouchableOpacity>
            )}
            {leader.linkedin && (
              <TouchableOpacity
                style={[
                  styles.leaderMiniBtn,
                  { backgroundColor: isDark ? 'rgba(10, 102, 194, 0.15)' : '#EFF6FF' },
                ]}
                onPress={() => onOpenUrl(leader.linkedin!)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Open LinkedIn profile for ${leader.name}`}
              >
                <Ionicons name="logo-linkedin" size={12} color="#0A66C2" />
                <Text style={[styles.leaderMiniBtnText, { color: '#0A66C2' }]}>LinkedIn</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    ))}
  </View>
);

interface ContactTabProps {
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  onOpenUrl: (url: string) => void;
  onOpenLegalTab: (tab: LegalTabKey) => void;
}

export const AboutContactTab: React.FC<ContactTabProps> = ({
  colors,
  isDark,
  isBangla,
  onOpenUrl,
  onOpenLegalTab,
}) => {
  const handleCall = () => Linking.openURL('tel:01312100288').catch(() => {});
  const handleWhatsApp = () => Linking.openURL('https://wa.me/8801312100288').catch(() => {});
  const handleEmail = () => Linking.openURL('mailto:info@thrivingskill.com').catch(() => {});

  return (
    <View style={styles.sectionContainer}>
      <View
        style={[
          styles.contactCard,
          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.contactCardHeader, { color: colors.text }]}>
          {isBangla ? 'অফিসিয়াল যোগাযোগ ও সাপোর্ট' : 'Official Coordinates & Support'}
        </Text>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={handleCall}
          accessibilityRole="button"
          accessibilityLabel="Call direct helpline 01312 100288"
        >
          <View
            style={[
              styles.contactIconBg,
              { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.18)' : '#EFF6FF' },
            ]}
          >
            <Ionicons name="call" size={18} color={isDark ? '#60A5FA' : '#2563EB'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactLabel, { color: colors.textMuted }]}>
              {isBangla ? 'অফিসিয়াল হটলাইন' : 'Direct Helpline'}
            </Text>
            <Text style={[styles.contactValue, { color: colors.primary }]}>01312 100288</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={handleWhatsApp}
          accessibilityRole="button"
          accessibilityLabel="Open official WhatsApp +880 1312-100288"
        >
          <View
            style={[
              styles.contactIconBg,
              { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5' },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactLabel, { color: colors.textMuted }]}>
              {isBangla ? 'হোয়াটসঅ্যাপ সাপোর্ট' : 'WhatsApp Official Chat'}
            </Text>
            <Text style={[styles.contactValue, { color: '#10B981' }]}>+880 1312-100288</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={handleEmail}
          accessibilityRole="button"
          accessibilityLabel="Send email to info@thrivingskill.com"
        >
          <View
            style={[
              styles.contactIconBg,
              { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.16)' : '#FAF5FF' },
            ]}
          >
            <Ionicons name="mail" size={18} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactLabel, { color: colors.textMuted }]}>
              {isBangla ? 'ইমেইল যোগাযোগ' : 'Inquiries & Support Email'}
            </Text>
            <Text style={[styles.contactValue, { color: colors.text }]}>
              info@thrivingskill.com
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => onOpenUrl(Env.SITE_URL)}
          accessibilityRole="button"
          accessibilityLabel="Open official portal on web"
        >
          <View
            style={[
              styles.contactIconBg,
              { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2' },
            ]}
          >
            <Ionicons name="globe-outline" size={18} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactLabel, { color: colors.textMuted }]}>
              {isBangla ? 'অফিসিয়াল ওয়েবসাইট' : 'Official Portal'}
            </Text>
            <Text style={[styles.contactValue, { color: colors.text }]}>
              {Env.SITE_URL.replace(/^https?:\/\//, '')}
            </Text>
          </View>
          <Ionicons name="open-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.subheading, { color: colors.textMuted, marginTop: 16 }]}>
        {isBangla ? 'সোশ্যাল মিডিয়ায় যুক্ত থাকুন:' : 'Official Social Channels:'}
      </Text>

      <View style={styles.socialGrid}>
        {ABOUT_SOCIAL_CHANNELS.map((social, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.socialPill,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
            onPress={() => onOpenUrl(social.url)}
            accessibilityRole="button"
            accessibilityLabel={`Visit Thriving Skills on ${social.name}`}
          >
            <Ionicons name={social.icon as any} size={18} color={social.color} />
            <Text style={[styles.socialName, { color: colors.text }]}>{social.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View
        style={[
          styles.legalAccessCard,
          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        ]}
      >
        <View style={styles.legalAccessHeader}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text style={[styles.legalAccessTitle, { color: colors.text }]}>
            {isBangla ? 'আইনি নীতিমালা ও সর্বস্বত্ব' : 'Legal Policies & Rights'}
          </Text>
        </View>
        <Text style={[styles.legalAccessDesc, { color: colors.textMuted }]}>
          {isBangla
            ? 'থ্রাইভিং স্কিলস লিমিটেডের প্রাতিষ্ঠানিক শর্তাবলী ও ডাটা সুরক্ষা নীতিমালা পর্যালোচনা করুন।'
            : 'Review official terms of enrollment, platform intellectual property, and learner privacy safeguards.'}
        </Text>
        <View style={styles.legalActionRow}>
          <TouchableOpacity
            style={[styles.legalBtn, { borderColor: colors.primary }]}
            onPress={() => onOpenLegalTab('terms')}
            accessibilityRole="button"
            accessibilityLabel="Open Terms of Use"
          >
            <Ionicons name="document-text-outline" size={14} color={colors.primary} />
            <Text style={[styles.legalBtnText, { color: colors.primary }]}>
              {isBangla ? 'শর্তাবলী' : 'Terms of Use'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legalBtn, { borderColor: colors.secondary }]}
            onPress={() => onOpenLegalTab('privacy')}
            accessibilityRole="button"
            accessibilityLabel="Open Privacy Policy"
          >
            <Ionicons name="lock-closed-outline" size={14} color={colors.secondary} />
            <Text style={[styles.legalBtnText, { color: colors.secondary }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.copyrightBlock}>
        <Ionicons name="ribbon" size={16} color="#E34234" />
        <Text style={[styles.copyrightNoticeText, { color: colors.textMuted }]}>
          © 2026 Thriving <Text style={{ color: '#E34234' }}>Skills</Text> Limited. All Rights
          Reserved.{'\n'}
          Registered under Companies Act of Bangladesh • Gulshan-2, Dhaka
        </Text>
      </View>
    </View>
  );
};
