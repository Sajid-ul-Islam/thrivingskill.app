import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { shape } from '../../theme/shapes';
import { triggerHaptic } from '../../utils/haptics';
import { Env } from '../../config/env';
import { AboutTabKey } from '../modals/AboutTSLModal';
import { LegalTabKey } from '../modals/LegalPolicyModal';
import { MessengerIcon } from '../common/MessengerIcon';
import { useFeedback } from '../../context/FeedbackContext';
import { ProfileSupportHub } from './ProfileSupportHub';

export interface GamificationBadge {
  id: string;
  title: string;
  banglaTitle: string;
  icon: string;
  color: string;
  isUnlocked: boolean;
}

interface ProfilePreferencesSectionProps {
  isAdmin: boolean;
  isBangla: boolean;
  isDark: boolean;
  colors: any;
  subscriptionTier: 'starter' | 'pro' | 'enterprise';
  onOpenSubscription: () => void;
  onOpenOrders: () => void;
  enrolledCount: number;
  completedCount: number;
  certificatesCount: number;
  onNavigateTab: (tab: any) => void;
  badges: GamificationBadge[];
  onOpenFlashcards: () => void;
  onOpenOfflineDeck: () => void;
  onOpenLocalSearch: () => void;
  language: string;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  videoQuality: string;
  cycleVideoQuality: () => void;
  onOpenUpdateModal: () => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (val: boolean) => void;
  onChangePassword: () => void;
  onOpenNotifications?: () => void;
  onClearCache: () => void;
  onOpenCorporateModal: () => void;
  onOpenHelpFaq: () => void;
  onOpenBlog: () => void;
  onOpenStorage: () => void;
  onOpenEbook?: () => void;
  onOpenServices?: () => void;
  onOpenInstructors?: () => void;
  pendingSyncCount: number;
  serverEnvironment?: 'production' | 'staging';
  onSwitchServerEnvironment?: () => void;
  isDevModeUnlocked?: boolean;
  onOpenAbout: (tab: AboutTabKey) => void;
  onOpenLegal: (tab: LegalTabKey) => void;
  isAuthenticated: boolean;
  onDeleteAccount: () => void;
  onLogout: () => void;
  onOpenAuthModal: () => void;
  showToast: (opts: { message: string; type: 'info' | 'success' | 'warning' | 'error' }) => void;
  t: (key: any, fallback?: string) => string;
}

export const ProfilePreferencesSection: React.FC<ProfilePreferencesSectionProps> = ({
  isAdmin,
  isBangla,
  isDark,
  colors,
  subscriptionTier,
  onOpenSubscription,
  onOpenOrders,
  enrolledCount,
  completedCount,
  certificatesCount,
  onNavigateTab,
  badges,
  onOpenFlashcards,
  onOpenOfflineDeck,
  onOpenLocalSearch,
  language,
  toggleLanguage,
  toggleTheme,
  videoQuality,
  cycleVideoQuality,
  onOpenUpdateModal,
  biometricEnabled,
  setBiometricEnabled,
  onChangePassword,
  onOpenNotifications,
  onClearCache,
  onOpenCorporateModal,
  onOpenHelpFaq,
  onOpenBlog,
  onOpenStorage,
  onOpenEbook,
  onOpenServices,
  onOpenInstructors,
  pendingSyncCount,
  serverEnvironment = 'production',
  onSwitchServerEnvironment,
  isDevModeUnlocked = false,
  onOpenAbout,
  onOpenLegal,
  isAuthenticated,
  onDeleteAccount,
  onLogout,
  onOpenAuthModal,
  showToast,
  t,
}) => {
  const { showPopup } = useFeedback();

  return (
    <>
      {/* Administrator Management Console (Section 2 Spec) */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {isBangla ? 'অ্যাডমিন কন্ট্রোল সেন্টার' : 'ADMIN MANAGEMENT CONSOLE'}
          </Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Linking.openURL(Env.WP_ADMIN_URL).catch(() => {})}
              accessibilityRole="button"
              accessibilityLabel="WordPress Admin Dashboard"
            >
              <View style={styles.settingLeft}>
                <Ionicons name="speedometer-outline" size={20} color="#EC4899" />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'ওয়ার্ডপ্রেস অ্যাডমিন ড্যাশবোর্ড' : 'WordPress Admin Dashboard'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {Env.WP_ADMIN_URL}
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Linking.openURL(`${Env.SITE_URL}/wp-admin/edit.php?post_type=lp_course`).catch(() => {})}
              accessibilityRole="button"
              accessibilityLabel="Courses and Lessons Management"
            >
              <View style={styles.settingLeft}>
                <Ionicons name="book-outline" size={20} color="#3B82F6" />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'কোর্স ও লেসন ম্যানেজমেন্ট' : 'Courses & Lessons Management'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'কোর্স, মডিউল ও ভিডিও কনটেন্ট পরিচালনা করুন' : 'Manage courses, modules & videos on WP'}
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Linking.openURL(`${Env.SITE_URL}/wp-admin/users.php`).catch(() => {})}
              accessibilityRole="button"
              accessibilityLabel="Students and Users Management"
            >
              <View style={styles.settingLeft}>
                <Ionicons name="people-outline" size={20} color="#10B981" />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'শিক্ষার্থী ও ইউজার ম্যানেজমেন্ট' : 'Students & Users'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'স্টুডেন্ট তালিকা, অ্যাক্সেস ও প্রোগ্রেস মনিটরিং' : 'Student enrollment & progress tracking'}
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Linking.openURL(`${Env.SITE_URL}/wp-admin/edit.php?post_type=lp_order`).catch(() => {})}
              accessibilityRole="button"
              accessibilityLabel="Orders and Enrollment Management"
            >
              <View style={styles.settingLeft}>
                <Ionicons name="card-outline" size={20} color="#F59E0B" />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'এনরোলমেন্ট ও অর্ডার ম্যানেজমেন্ট' : 'Orders & Enrollment Management'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'অর্ডার স্ট্যাটাস ও এনরোলমেন্ট রিভিউ করুন' : 'Review LearnPress enrollment records'}
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Linking.openURL(`${Env.SITE_URL}/wp-admin/admin.php?page=learnpress-statistics`).catch(() => {})}
              accessibilityRole="button"
              accessibilityLabel="Reports and Analytics"
            >
              <View style={styles.settingLeft}>
                <Ionicons name="analytics-outline" size={20} color="#8B5CF6" />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'রিপোর্ট ও অ্যানালিটিক্স' : 'Reports & Analytics'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'লার্নিং অ্যানালিটিক্স ও কমপ্লিশন রিপোর্ট' : 'Learning stats & course performance'}
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Account Membership Card */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {isBangla ? 'অ্যাকাউন্ট মেম্বারশিপ ও অ্যাক্সেস' : 'ACCOUNT MEMBERSHIP & ACCESS'}
        </Text>
        <View
          style={[
            styles.subscriptionCard,
            { backgroundColor: colors.surfaceCard, borderColor: colors.primary },
          ]}
        >
          <View style={styles.planBadgeRow}>
            <View style={[styles.tierTag, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="ribbon" size={12} color={colors.primary} />
              <Text style={[styles.tierTagText, { color: colors.primary }]}>
                {subscriptionTier === 'enterprise'
                  ? 'ENTERPRISE SCALE'
                  : subscriptionTier === 'pro'
                  ? 'PRO EXECUTIVE'
                  : 'STARTER MEMBER'}
              </Text>
            </View>
          </View>

          <Text style={[styles.planTitle, { color: colors.text }]}>
            {subscriptionTier === 'enterprise'
              ? 'Enterprise Team Workspace'
              : subscriptionTier === 'pro'
              ? (isBangla ? '৩০০+ কোর্স ও ভেরিফায়েড সার্টিফিকেট আনলকড' : '300+ Courses & Verified Certificates Unlocked')
              : 'Synced Account Access'}
          </Text>
          <Text style={[styles.planExpiry, { color: colors.textMuted }]}>
            {isBangla
              ? 'আপনার ওয়েব অ্যাকাউন্টের সাথে স্বয়ংক্রিয়ভাবে সিঙ্ক করা'
              : 'Synced automatically with your Thriving Skills account'}
          </Text>

          <View style={styles.subActionRow}>
            <TouchableOpacity
              style={[styles.managePlanBtn, { backgroundColor: colors.primary }]}
              onPress={onOpenSubscription}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'মেম্বারশিপ তথ্য' : 'Membership Details'}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.onPrimary} />
              <Text style={[styles.managePlanText, { color: colors.onPrimary }]}>
                {isBangla ? 'মেম্বারশিপ তথ্য' : 'Membership Details'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.invoiceBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
              onPress={onOpenOrders}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'অর্ডার রেকর্ড' : 'Orders'}
            >
              <Ionicons name="library-outline" size={16} color={colors.text} />
              <Text style={[styles.invoiceBtnText, { color: colors.text }]}>
                {isBangla ? 'অর্ডার রেকর্ড' : 'Orders'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Study & Recall Suite (Phase 2 R&D) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {isBangla ? 'স্মৃতি ও অফলাইন শিক্ষা টুলস' : 'LEARNING & MEMORY SUITE'}
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {/* Active Recall Flashcards (SM-2) */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenFlashcards();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'অ্যাক্টিভ রিকল ফ্ল্যাশকার্ড খুলুন' : 'Open Active Recall Flashcards'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="layers-outline" size={20} color={colors.primary} />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'অ্যাক্টিভ রিকল ফ্ল্যাশকার্ড (SM-2)' : 'Active Recall Flashcards'}
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                  {isBangla ? 'বৈজ্ঞানিক স্পেসড রিপিটেশন পদ্ধতি' : 'SuperMemo-2 spaced repetition memory engine'}
                </Text>
              </View>
            </View>
            <View style={[styles.langPill, { backgroundColor: isDark ? colors.surfaceSubtle : '#FEF3C7' }]}>
              <Text style={[styles.langPillText, { color: colors.brandGold }]}>
                {isBangla ? 'স্মৃতি পরীক্ষা' : 'Review Deck'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Offline Study Deck */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenOfflineDeck();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'অফলাইন স্টাডি ডেক খুলুন' : 'Open Offline Study Deck'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-offline" size={20} color="#10B981" />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'অফলাইন স্টাডি ডেক' : 'Offline Study Deck'}
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                  {isBangla ? 'ইন্টারনেট ছাড়াই লেকচার ও নোটস পড়ুন' : 'Read saved lectures & takeaways without internet'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* On-Device Fast Search (Phase 3 FTS) */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenLocalSearch();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'অন-ডিভাইস ফাস্ট সার্চ খুলুন' : 'Open On-Device Fast Search'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="search" size={20} color="#3B82F6" />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'অন-ডিভাইস ফাস্ট সার্চ (FTS)' : 'On-Device Fast Search (FTS)'}
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                  {isBangla ? 'কোর্স, লেকচার ও নোটস নিমেষে সার্চ করুন' : 'Instant inverted index search across offline content'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Experience & Playback (Miller's Law: <= 5 items per Gestalt group) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {isBangla ? 'অ্যাপ অভিজ্ঞতা ও প্লেব্যাক' : 'EXPERIENCE & PLAYBACK'}
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {/* Language Switcher */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('selection');
              toggleLanguage();
              showToast({
                message: language === 'en' ? 'ভাষা বাংলা (BN) নির্ধারণ করা হয়েছে' : 'Language switched to English (EN)',
                type: 'info',
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'ভাষা পরিবর্তন করুন' : 'Switch app language'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={20} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBangla ? 'ভাষা (Language)' : 'Language'}
              </Text>
            </View>
            <View style={[styles.langPill, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.langPillText, { color: colors.primary }]}>
                {language === 'en' ? 'English (EN)' : 'বাংলা (BN)'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Dark mode switch */}
          <View style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}>
            <View style={styles.settingLeft}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={20}
                color={isDark ? colors.accent : colors.primary}
              />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBangla ? 'ডার্ক মোড' : 'Dark Mode'}
              </Text>
            </View>
            <Switch
              value={isDark}
              accessibilityLabel={isBangla ? 'ডার্ক মোড টগল' : 'Toggle Dark Mode'}
              onValueChange={() => {
                triggerHaptic('selection');
                toggleTheme();
                showToast({
                  message: isDark ? 'Light mode enabled' : 'Dark mode enabled',
                  type: 'info',
                });
              }}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Video Streaming Resolution */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('selection');
              cycleVideoQuality();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'ভিডিও স্ট্রিমিং কোয়ালিটি পরিবর্তন করুন' : 'Cycle video streaming quality'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="videocam-outline" size={20} color="#3B82F6" />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'ভিডিও স্ট্রিমিং কোয়ালিটি' : 'Video Streaming Quality'}
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                  {isBangla ? 'ডিফল্ট রেজোলিউশন প্রেফারেন্স' : 'Preferred playback resolution'}
                </Text>
              </View>
            </View>
            <View style={[styles.langPill, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <Text style={[styles.langPillText, { color: isDark ? colors.primary : '#1D4ED8', fontWeight: '800' }]}>
                {videoQuality}
              </Text>
            </View>
          </TouchableOpacity>

          {/* In-App OTA Updates */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenUpdateModal();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'ইন-অ্যাপ আপডেট দেখুন' : 'Check in-app OTA updates'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-download-outline" size={20} color="#10B981" />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'ইন-অ্যাপ আপডেট (OTA)' : 'In-App Updates (OTA)'}
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                  {isBangla ? 'APK রি-বিল্ড ছাড়াই নতুন ফিচার পান' : 'Instant updates without rebuilding APK'}
                </Text>
              </View>
            </View>
            <View style={[styles.langPill, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
              <Text style={[styles.langPillText, { color: isDark ? '#34D399' : '#047857', fontWeight: '800' }]}>
                OTA Engine
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Security, Library & Storage (Miller's Law: <= 5 items per Gestalt group) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {isBangla ? 'নিরাপত্তা ও লাইব্রেরি' : 'SECURITY & LIBRARY'}
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {/* Biometric unlock toggle */}
          <View style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="finger-print" size={20} color={colors.secondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBangla ? 'বায়োমেট্রিক আনলক (ফিঙ্গারপ্রিন্ট)' : 'Biometric Security'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              accessibilityLabel={isBangla ? 'বায়োমেট্রিক নিরাপত্তা টগল' : 'Toggle Biometric Security'}
              onValueChange={(val) => {
                triggerHaptic('selection');
                setBiometricEnabled(val);
                showToast({
                  message: val
                    ? 'Biometric unlock enabled'
                    : 'Biometric unlock disabled',
                  type: 'info',
                });
              }}
              trackColor={{ false: '#CBD5E1', true: colors.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Change Account Password */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onChangePassword();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={20} color="#F59E0B" />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                  {isBangla ? 'অ্যাকাউন্ট সিকিউরিটি ক্রেডেনশিয়াল' : 'Update your account security'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Enrolled Courses & Library History */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenOrders();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'অর্ডার ও কোর্স রেকর্ড দেখুন' : 'View Orders and Course Records'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="receipt-outline" size={20} color="#10B981" />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'অর্ডার ও কোর্স রেকর্ড' : 'Orders & Course Records'}
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                  {isBangla ? 'আপনার সিঙ্ক করা সকল LearnPress ও WooCommerce অর্ডার' : 'Your synced LearnPress & WooCommerce orders'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Push notifications */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenNotifications?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'নোটিফিকেশন সেন্টার খুলুন' : 'Open Notification Center'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBangla ? 'নোটিফিকেশন সেন্টার' : 'Notification Center'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Clear Storage & Cache */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onClearCache();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'ক্যাশ মেমোরি ক্লিয়ার করুন' : 'Clear Storage and Cache'}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'ক্যাশ মেমোরি ক্লিয়ার করুন' : 'Clear Storage & Cache'}
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                  {isBangla ? 'অব্যবহৃত টেম্পোরারি ফাইল মুছুন (~38 MB)' : 'Free up temporary local storage (~38 MB)'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Server Environment Switcher (Live vs Staging) - Visible in DEV mode, for Admins, or via Easter Egg */}
          {Boolean(__DEV__ || isAdmin || isDevModeUnlocked) && (
            <TouchableOpacity
              style={[styles.settingRow, isAdmin ? { borderBottomColor: colors.borderSubtle } : { borderBottomWidth: 0 }]}
              onPress={() => {
                triggerHaptic('light');
                onSwitchServerEnvironment?.();
              }}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'সার্ভার পরিবেশ পরিবর্তন করুন' : 'Switch Server Environment'}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="server-outline" size={20} color={colors.primary} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'সার্ভার পরিবেশ' : 'Server Environment'}
                  </Text>
                  <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                    {serverEnvironment === 'production'
                      ? (isBangla ? 'লাইভ প্রোডাকশন • thrivingskill.com' : 'Live Production • thrivingskill.com')
                      : (isBangla ? 'স্টেজিং সার্ভার • staging.thrivingskill.com' : 'Staging Server • staging.thrivingskill.com')}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                    backgroundColor:
                      serverEnvironment === 'production'
                        ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
                        : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7'),
                    borderWidth: 1,
                    borderColor: serverEnvironment === 'production' ? '#10B981' : '#F59E0B',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: serverEnvironment === 'production' ? '#10B981' : '#D97706',
                      letterSpacing: 0.5,
                    }}
                  >
                    {serverEnvironment === 'production'
                      ? (isBangla ? 'লাইভ' : 'LIVE')
                      : (isBangla ? 'স্টেজিং' : 'STAGING')}
                  </Text>
                </View>
                <Ionicons name="swap-horizontal" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}

          {/* WordPress Admin Portal Shortcut (Admin only) */}
          {isAdmin && (
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => Linking.openURL(Env.WP_ADMIN_URL).catch(() => {})}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'ওয়ার্ডপ্রেস অ্যাডমিন পোর্টাল খুলুন' : 'Open WordPress Admin Portal'}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="settings-outline" size={20} color="#EC4899" />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'ওয়ার্ডপ্রেস অ্যাডমিন পোর্টাল (WP-Admin)' : 'WordPress Admin Portal (WP-Admin)'}
                  </Text>
                  <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>
                    {Env.WP_ADMIN_URL}
                  </Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Enterprise & Corporate Upskilling */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ENTERPRISE & B2B SOLUTIONS</Text>
        <TouchableOpacity
          style={[
            styles.corporateCard,
            { backgroundColor: colors.surfaceCard, borderColor: colors.secondary },
          ]}
          onPress={() => {
            triggerHaptic('light');
            onOpenCorporateModal();
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Corporate Training & SME Advisory"
        >
          <View style={[styles.corpIconBg, { backgroundColor: colors.secondaryLight }]}>
            <Ionicons name="business" size={22} color={colors.secondary} />
          </View>
          <View style={styles.corpInfo}>
            <Text style={[styles.corpTitle, { color: colors.text }]}>
              Corporate Training & SME Advisory
            </Text>
            <Text style={[styles.corpSubtitle, { color: colors.textMuted }]}>
              কাস্টমাইজড Corporate Training, LMS Integration এবং বিজনেস কনসালটেন্সি প্রপোজাল।
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Modern Consolidated Support & Resources Hub */}
      <ProfileSupportHub
        colors={colors}
        isDark={isDark}
        isBangla={isBangla}
        onOpenHelpFaq={onOpenHelpFaq}
        onOpenBlog={onOpenBlog}
        onOpenEbook={onOpenEbook}
        onOpenInstructors={onOpenInstructors}
        onOpenStorage={onOpenStorage}
        pendingSyncCount={pendingSyncCount}
      />

      {/* About Thriving Skills (Miller's Law: 3 items) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {isBangla ? 'থ্রাইভিং স্কিলস পরিচিতি' : 'ABOUT THRIVING SKILLS'}
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenAbout('overview');
            }}
            accessibilityRole="button"
            accessibilityLabel="About Thriving Skills Overview"
          >
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>About Thriving Skills (TSL)</Text>
            </View>
            <Text style={[styles.versionText, { color: colors.primary, fontWeight: '600' }]}>Vision & Values →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenAbout('leadership');
            }}
            accessibilityRole="button"
            accessibilityLabel="Founders and Leadership"
          >
            <View style={styles.settingLeft}>
              <Ionicons name="people-outline" size={20} color={isDark ? '#FBBF24' : '#B45309'} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Founders & Leadership</Text>
            </View>
            <Text style={[styles.versionText, { color: isDark ? '#FBBF24' : '#B45309', fontWeight: '600' }]}>Exec Board →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenAbout('partners');
            }}
            accessibilityRole="button"
            accessibilityLabel="Trusted Partners and MoUs"
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={isDark ? '#34D399' : '#047857'} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Trusted Partners & MoUs</Text>
            </View>
            <Text style={[styles.versionText, { color: isDark ? '#34D399' : '#047857', fontWeight: '600' }]}>Universities & a2i →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Legal & Data Privacy (Miller's Law: 3 items) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {isBangla ? 'আইনগত নীতিমালা ও প্রাইভেসি' : 'LEGAL & DATA PRIVACY'}
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenLegal('terms');
            }}
            accessibilityRole="button"
            accessibilityLabel="Terms and Conditions"
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Terms & Conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            onPress={() => {
              triggerHaptic('light');
              onOpenLegal('privacy');
            }}
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Account & Data Deletion Row (Google Play Mandatory Policy: https://thrivingskill.com/delete-account/) */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={() => {
              triggerHaptic('light');
              Linking.openURL(Env.ACCOUNT_DELETION_URL).catch(() => {
                Alert.alert(
                  isBangla ? 'ওয়েব ডাটা মুছে ফেলার ফর্ম' : 'Web Data Deletion Form',
                  t('deleteAccountWebPrompt')
                );
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={t('dataDeletionRequestWeb')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="person-remove-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('dataDeletionRequestWeb')}
              </Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Actions (Isolated destructive/auth controls per Fitts's Law error prevention) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {isBangla ? 'অ্যাকাউন্ট অ্যাকশন' : 'ACCOUNT ACTIONS'}
        </Text>
        <View
          style={[
            styles.cardGroup,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => {
                triggerHaptic('warning');
                onDeleteAccount();
              }}
              accessibilityRole="button"
              accessibilityLabel={t('deleteAccount')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <Text style={[styles.settingLabel, { color: colors.danger, fontWeight: '700' }]}>
                  {t('deleteAccount')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.danger} />
            </TouchableOpacity>
          )}

          {/* Auth Action Row */}
          {isAuthenticated ? (
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                triggerHaptic('warning');
                showPopup({
                  title: isBangla ? 'সাইন আউট করবেন?' : 'Sign Out?',
                  message: isBangla
                    ? 'আপনি কি নিশ্চিত যে আপনার অ্যাকাউন্ট থেকে সাইন আউট করতে চান?'
                    : 'Are you sure you want to sign out of your account on this device?',
                  primaryLabel: isBangla ? 'সাইন আউট' : 'Sign Out',
                  secondaryLabel: isBangla ? 'বাতিল' : 'Cancel',
                  isDestructive: true,
                  icon: 'log-out-outline',
                  onConfirm: onLogout,
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'সাইন আউট' : 'Sign Out'}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.danger, fontWeight: '700' }]} numberOfLines={1}>
                    {isBangla ? 'সাইন আউট' : 'Sign Out'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                triggerHaptic('light');
                onOpenAuthModal();
              }}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'থ্রাইভিং স্কিলস অ্যাকাউন্টে সাইন ইন' : 'Sign In with Thriving Skills Account'}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="log-in-outline" size={20} color={colors.primary} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                    {isBangla ? 'থ্রাইভিং স্কিলস অ্যাকাউন্টে সাইন ইন' : 'Sign In with Thriving Skills Account'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cardGroup: {
    borderRadius: shape.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    gap: 12,
  },
  settingTextCol: {
    flex: 1,
    minWidth: 0,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 11,
    marginTop: 1,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  subscriptionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  tierTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  tierTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  planExpiry: {
    fontSize: 11,
    marginBottom: 8,
  },
  subActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  managePlanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  managePlanText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  invoiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  badgesScroll: {
    paddingRight: 16,
    gap: 12,
  },
  badgeCard: {
    width: 120,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
  },
  badgeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeStatus: {
    fontSize: 10,
    fontWeight: '700',
  },
  corporateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  corpIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpInfo: {
    flex: 1,
  },
  corpTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  corpSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  versionText: {
    fontSize: 12,
  },
});
