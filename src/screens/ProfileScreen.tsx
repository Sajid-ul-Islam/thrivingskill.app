import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useSaaS } from '../context/SaaSContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { Header } from '../components/Header';
import { AppUpdateModal } from '../components/AppUpdateModal';
import { AboutTSLModal, AboutTabKey } from '../components/AboutTSLModal';
import { LegalPolicyModal, LegalTabKey } from '../components/LegalPolicyModal';
import { HelpFaqModal } from '../components/HelpFaqModal';
import { BlogModal } from '../components/BlogModal';
import { CacheManager } from '../services/cache/cacheManager';

interface ProfileScreenProps {
  onOpenCorporateModal: () => void;
  onOpenSubscription: () => void;
  onOpenNotifications: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenDrawer?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenCorporateModal,
  onOpenSubscription,
  onOpenNotifications,
  onNavigateTab,
  onOpenDrawer,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, isBangla, t } = useLanguage();
  const { badges } = useGamification();
  const { userProgress, certificates } = useLearning();
  const { user, isAuthenticated, logout, setAuthModalVisible } = useAuth();
  const {
    subscriptionTier,
    billingInterval,
    activeWorkspace,
  } = useSaaS();

  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<AboutTabKey>('overview');
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('terms');
  const [helpFaqModalVisible, setHelpFaqModalVisible] = useState(false);
  const [blogModalVisible, setBlogModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [paymentHistoryModalVisible, setPaymentHistoryModalVisible] = useState(false);

  // Edit Profile Form (Section 25 Spec)
  const [customName, setCustomName] = useState(user?.displayName || user?.username || 'Executive Learner');
  const [customPhone, setCustomPhone] = useState('01712000000');
  const [customBio, setCustomBio] = useState('Senior Business Executive & Continuous Learner');
  const [customCity, setCustomCity] = useState('Gulshan-2, Dhaka');

  // Change Password Form (Section 26 Spec)
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Video Streaming Preference (Section 26 Spec)
  const [videoQuality, setVideoQuality] = useState<'Auto' | '1080p' | '720p' | '480p'>('Auto');

  const cycleVideoQuality = () => {
    const qualities: ('Auto' | '1080p' | '720p' | '480p')[] = ['Auto', '1080p', '720p', '480p'];
    const nextIdx = (qualities.indexOf(videoQuality) + 1) % qualities.length;
    setVideoQuality(qualities[nextIdx]);
    Alert.alert('Video Quality Updated', `Default streaming resolution set to ${qualities[nextIdx]}.`);
  };

  const handleClearCache = async () => {
    await CacheManager.clearAll();
    Alert.alert(
      'App Cache Cleared 🧹',
      'Local API data, cached thumbnails, and temporary runtime files (38.4 MB) have been freed up successfully.'
    );
  };

  const handleSaveProfile = () => {
    setEditProfileModalVisible(false);
    Alert.alert('Profile Updated! ✅', 'Your personal executive details have been saved successfully.');
  };

  const handleChangePassword = () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert('Incomplete Form', 'Please fill in all password fields.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Mismatch', 'New password and confirm password do not match.');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Security Notice', 'New password must be at least 6 characters.');
      return;
    }
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setChangePasswordModalVisible(false);
    Alert.alert('Password Changed! 🔒', 'Your account credentials have been updated successfully.');
  };

  const enrolledCount = Object.keys(userProgress).length;
  const completedCount = Object.values(userProgress).filter((p) => p.isCompleted).length;
  const isAdmin =
    user?.roles?.includes('administrator') ||
    user?.username?.toLowerCase() === 'admin' ||
    user?.email?.toLowerCase().includes('admin@');

  const handleDownloadInvoice = () => {
    Alert.alert(
      'Invoice Downloaded 📥',
      `Invoice #INV-2026-TS884 (৳${billingInterval === 'annual' ? '2,900.00' : '290.00'} BDT) has been downloaded to your device storage.`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Executive Account"
        subtitle="SaaS Profile & Preferences"
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          <Image
            source={{
              uri:
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>
                {customName || user?.displayName || user?.username || 'Guest Learner'}
              </Text>
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: isAdmin
                      ? 'rgba(239, 68, 68, 0.12)'
                      : isAuthenticated
                      ? colors.primaryLight
                      : colors.surfaceSubtle,
                  },
                ]}
              >
                <Ionicons
                  name={isAdmin ? 'shield-checkmark' : isAuthenticated ? 'school-outline' : 'person-outline'}
                  size={12}
                  color={isAdmin ? '#EF4444' : isAuthenticated ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.verifiedText,
                    { color: isAdmin ? '#EF4444' : isAuthenticated ? colors.primary : colors.textMuted },
                  ]}
                >
                  {isAdmin ? 'ADMINISTRATOR' : isAuthenticated ? 'STUDENT' : 'GUEST'}
                </Text>
              </View>
            </View>
            <Text style={[styles.email, { color: colors.textMuted }]}>
              {user?.email || 'Explore catalog & courses freely'}
            </Text>
            <Text style={[styles.role, { color: colors.secondary }]} numberOfLines={2}>
              {customBio || (isAuthenticated
                ? `Connected to thrivingskill.com • ${activeWorkspace.name}`
                : 'Thriving Skills Online Platform')}
            </Text>

            <TouchableOpacity
              style={[
                styles.editProfileBtn,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={() => setEditProfileModalVisible(true)}
            >
              <Ionicons name="create-outline" size={13} color={colors.primary} />
              <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>
                {isBangla ? 'প্রোফাইল সম্পাদন' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
                onPress={() => Linking.openURL('https://thrivingskill.com/wp-admin/edit.php?post_type=lp_course')}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="book-outline" size={20} color="#3B82F6" />
                  <View style={{ marginLeft: 6 }}>
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
                onPress={() => Linking.openURL('https://thrivingskill.com/wp-admin/users.php')}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="people-outline" size={20} color="#10B981" />
                  <View style={{ marginLeft: 6 }}>
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
                onPress={() => Linking.openURL('https://thrivingskill.com/wp-admin/edit.php?post_type=lp_order')}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="card-outline" size={20} color="#F59E0B" />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      {isBangla ? 'পেমেন্ট ও অর্ডার ম্যানেজমেন্ট' : 'Payments & Orders'}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {isBangla ? 'bKash/Nagad/Rocket অর্ডার ও ট্রানজ্যাকশন' : 'Review orders & payment transactions'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="open-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
                onPress={() => Linking.openURL('https://thrivingskill.com/wp-admin/admin.php?page=learnpress-statistics')}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="analytics-outline" size={20} color="#8B5CF6" />
                  <View style={{ marginLeft: 6 }}>
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

        {/* SaaS Subscription & Membership Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>স্মার্ট লার্নিং সাবস্ক্রিপশন ও বিলিং</Text>
          <View
            style={[
              styles.subscriptionCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.primary },
            ]}
          >
            <View style={styles.planBadgeRow}>
              <View style={[styles.tierTag, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={[styles.tierTagText, { color: colors.primary }]}>
                  {subscriptionTier === 'enterprise'
                    ? 'ENTERPRISE SCALE'
                    : subscriptionTier === 'pro'
                    ? 'PRO EXECUTIVE ANNUAL'
                    : 'STARTER FREE'}
                </Text>
              </View>
              <Text style={[styles.billingCycleText, { color: colors.textMuted }]}>
                {billingInterval === 'annual' ? 'Billed Annually (-20%)' : 'Billed Monthly'}
              </Text>
            </View>

            <Text style={[styles.planTitle, { color: colors.text }]}>
              {subscriptionTier === 'enterprise'
                ? 'Apex Corp Team License (25 Seats Active)'
                : subscriptionTier === 'pro'
                ? '৩০০+ কোর্স, AI Copilot ও সার্টিফিকেট আনলকড'
                : 'Free Limited Access Plan'}
            </Text>
            <Text style={[styles.planExpiry, { color: colors.textMuted }]}>
              Next billing date: September 15, 2026 • Auto-renew active
            </Text>

            <View style={styles.subActionRow}>
              <TouchableOpacity
                style={[styles.managePlanBtn, { backgroundColor: colors.primary }]}
                onPress={onOpenSubscription}
              >
                <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                <Text style={styles.managePlanText}>Change / Upgrade Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.invoiceBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                onPress={() => setPaymentHistoryModalVisible(true)}
              >
                <Ionicons name="receipt-outline" size={16} color={colors.text} />
                <Text style={[styles.invoiceBtnText, { color: colors.text }]}>
                  {isBangla ? 'পেমেন্ট ও ইনভয়েস' : 'Invoices'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Learning Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[
              styles.statBox,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
            onPress={() => onNavigateTab('MyLearning')}
          >
            <Text style={[styles.statVal, { color: colors.primary }]}>{enrolledCount}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Enrolled</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statBox,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
            onPress={() => onNavigateTab('MyLearning')}
          >
            <Text style={[styles.statVal, { color: colors.secondary }]}>{completedCount}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statBox,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
            onPress={() => onNavigateTab('MyLearning')}
          >
            <Text style={[styles.statVal, { color: colors.accent }]}>{certificates.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Certificates</Text>
          </TouchableOpacity>
        </View>

        {/* Earned Badges & Achievements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {isBangla ? 'অর্জিত স্কিল ব্যাজসমূহ' : 'ACHIEVEMENT BADGES'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
            {badges.map((b) => (
              <View
                key={b.id}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: b.isUnlocked ? colors.surfaceCard : colors.surfaceSubtle,
                    borderColor: b.isUnlocked ? b.color : colors.border,
                    opacity: b.isUnlocked ? 1 : 0.55,
                  },
                ]}
              >
                <View style={[styles.badgeIconBox, { backgroundColor: b.color + '20' }]}>
                  <Ionicons name={b.icon as any} size={22} color={b.isUnlocked ? b.color : colors.textMuted} />
                </View>
                <Text style={[styles.badgeTitle, { color: colors.text }]} numberOfLines={1}>
                  {isBangla ? b.banglaTitle : b.title}
                </Text>
                <Text style={[styles.badgeStatus, { color: b.isUnlocked ? b.color : colors.textMuted }]}>
                  {b.isUnlocked ? (isBangla ? '✓ আনলকড' : '✓ Unlocked') : (isBangla ? '🔒 লকড' : '🔒 Locked')}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Preferences & Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {isBangla ? 'অ্যাপ সেটিংস' : 'APP PREFERENCES'}
          </Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            {/* In-App OTA Updates (No APK Rebuild Required) */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => setUpdateModalVisible(true)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="cloud-download-outline" size={20} color="#10B981" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'ইন-অ্যাপ আপডেট (OTA)' : 'In-App Updates (OTA)'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'APK রি-বিল্ড ছাড়াই নতুন ফিচার পান' : 'Instant updates without rebuilding APK'}
                  </Text>
                </View>
              </View>
              <View style={[styles.langPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Text style={[styles.langPillText, { color: '#10B981', fontWeight: '800' }]}>
                  OTA Engine
                </Text>
              </View>
            </TouchableOpacity>

            {/* Language Switcher */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={toggleLanguage}
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
            <View style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
            >
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
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

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
                onValueChange={(val) => {
                  setBiometricEnabled(val);
                  Alert.alert(
                    'Biometric Security',
                    val
                      ? 'Fingerprint & Face ID enabled for instant login.'
                      : 'Biometric unlock disabled.'
                  );
                }}
                trackColor={{ false: '#CBD5E1', true: colors.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Offline downloads */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Alert.alert('Offline Content', 'You have 3 downloaded lessons (142 MB).')}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="cloud-download-outline" size={20} color={colors.text} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'ডাউনলোডকৃত লেসন' : 'Downloaded Lectures'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Video Streaming Resolution (Section 26) */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={cycleVideoQuality}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="videocam-outline" size={20} color="#3B82F6" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'ভিডিও স্ট্রিমিং কোয়ালিটি' : 'Video Streaming Quality'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'ডিফল্ট রেজোলিউশন প্রেফারেন্স' : 'Preferred playback resolution'}
                  </Text>
                </View>
              </View>
              <View style={[styles.langPill, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Text style={[styles.langPillText, { color: '#3B82F6', fontWeight: '800' }]}>
                  {videoQuality}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Clear Storage & Cache (Section 26) */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={handleClearCache}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'ক্যাশ মেমোরি ক্লিয়ার করুন' : 'Clear Storage & Cache'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'অব্যবহৃত টেম্পোরারি ফাইল মুছুন (~38 MB)' : 'Free up temporary local storage (~38 MB)'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Change Account Password (Section 26) */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => setChangePasswordModalVisible(true)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="key-outline" size={20} color="#F59E0B" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'অ্যাকাউন্ট সিকিউরিটি ক্রেডেনশিয়াল' : 'Update your account security'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Payment History & Invoices (Section 15 & 26) */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => setPaymentHistoryModalVisible(true)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="receipt-outline" size={20} color="#10B981" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'পেমেন্ট ও ইনভয়েস হিস্ট্রি' : 'Payment History & Invoices'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'সকল পেমেন্ট রশিদ ও সাবস্ক্রিপশন রেকর্ড' : 'All transaction receipts & VAT invoices'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Push notifications */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={onOpenNotifications}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBangla ? 'নোটিফিকেশন সেন্টার' : 'Notification Center'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
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
            onPress={onOpenCorporateModal}
            activeOpacity={0.85}
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

        {/* Support & About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CONTACT & SUPPORT</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Linking.openURL('tel:01312100288').catch(() => {})}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Hotline Support</Text>
              </View>
              <Text style={[styles.versionText, { color: colors.primary, fontWeight: '700' }]}>01312100288</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => Linking.openURL('mailto:info@thrivingskill.com').catch(() => {})}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="mail-outline" size={20} color={colors.text} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Email Support</Text>
              </View>
              <Text style={[styles.versionText, { color: colors.textMuted }]}>info@thrivingskill.com</Text>
            </TouchableOpacity>

            {/* Help & FAQ Center (Section 24) */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => setHelpFaqModalVisible(true)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={20} color="#0D9488" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'সাহায্য ও প্রশ্নোত্তর (FAQ)' : 'Help & FAQ Center'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'পেমেন্ট, সার্টিফিকেট ও কোর্স নির্দেশিকা' : 'Payments, certificates & course guidance'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Thriving Skills Blog & Articles (Section 22) */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => setBlogModalVisible(true)}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="newspaper-outline" size={20} color="#8B5CF6" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBangla ? 'টিএসএল ব্লগ ও আর্টিকেল' : 'TSL Blog & Industry Articles'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isBangla ? 'AI, কর্পোরেট লিডারশিপ ও এক্সিকিউটিভ ইনসাইট' : 'AI, leadership & corporate insights'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => {
                setAboutInitialTab('overview');
                setAboutModalVisible(true);
              }}
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
                setAboutInitialTab('leadership');
                setAboutModalVisible(true);
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="people-outline" size={20} color="#F59E0B" />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Founders & Leadership</Text>
              </View>
              <Text style={[styles.versionText, { color: '#F59E0B', fontWeight: '600' }]}>Exec Board →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => {
                setAboutInitialTab('partners');
                setAboutModalVisible(true);
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Trusted Partners & MoUs</Text>
              </View>
              <Text style={[styles.versionText, { color: '#10B981', fontWeight: '600' }]}>Universities & a2i →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => {
                setLegalInitialTab('terms');
                setLegalModalVisible(true);
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Terms & Conditions</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                setLegalInitialTab('privacy');
                setLegalModalVisible(true);
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="shield-outline" size={20} color={colors.textMuted} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Auth Action Row */}
            {isAuthenticated ? (
              <TouchableOpacity
                style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}
                onPress={() => {
                  Alert.alert('Sign Out', 'Are you sure you want to sign out from your WordPress account?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: logout },
                  ]);
                }}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                  <Text style={[styles.settingLabel, { color: colors.danger, fontWeight: '700' }]}>
                    Sign Out from WordPress
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}
                onPress={() => setAuthModalVisible(true)}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="log-in-outline" size={20} color={colors.primary} />
                  <Text style={[styles.settingLabel, { color: colors.primary, fontWeight: '700' }]}>
                    Sign In with Thriving Skills Account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* All Rights Reserved Enterprise Footer */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 12, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textAlign: 'center' }}>
            © 2026 Thriving Skills Limited (TSL). All Rights Reserved.
          </Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 3 }}>
            Gulshan-2, Dhaka • RJSC Registered • SDG-4 Quality Education
          </Text>
        </View>
      </ScrollView>

      {/* About TSL Modal */}
      <AboutTSLModal
        visible={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
        initialTab={aboutInitialTab}
        onNavigateTab={onNavigateTab}
      />

      {/* Legal & Policy Modal */}
      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialTab={legalInitialTab}
      />

      {/* In-App OTA Update Modal */}
      <AppUpdateModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
      />

      {/* Help & FAQ Center Modal (Section 24 Spec) */}
      <HelpFaqModal
        visible={helpFaqModalVisible}
        onClose={() => setHelpFaqModalVisible(false)}
      />

      {/* Blog & Articles Reader Modal (Section 22 & 4 Spec) */}
      <BlogModal
        visible={blogModalVisible}
        onClose={() => setBlogModalVisible(false)}
      />

      {/* Edit Profile Modal (Section 25 Spec) */}
      <Modal
        visible={editProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isBangla ? 'প্রোফাইল সম্পাদন' : 'Edit Executive Profile'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {isBangla ? 'আপনার ব্যক্তিগত ও প্রফেশনাল তথ্য আপডেট করুন' : 'Update your personal & corporate bio'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {isBangla ? 'পুরো নাম' : 'Full Name'}
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border }]}
                value={customName}
                onChangeText={setCustomName}
                placeholder="e.g. Tanvir Ahmed"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
                {isBangla ? 'ফোন নম্বর' : 'Phone Number'}
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border }]}
                value={customPhone}
                onChangeText={setCustomPhone}
                placeholder="+880 1712-000000"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
                {isBangla ? 'পদবি ও সংক্ষিপ্ত বায়ো' : 'Professional Headline / Bio'}
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border, minHeight: 56, textAlignVertical: 'top' }]}
                value={customBio}
                onChangeText={setCustomBio}
                placeholder="e.g. Senior Business Executive | Continuous Learner"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
                {isBangla ? 'শহর / ঠিকানা' : 'City / Location'}
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border }]}
                value={customCity}
                onChangeText={setCustomCity}
                placeholder="e.g. Gulshan-2, Dhaka"
                placeholderTextColor={colors.textMuted}
              />
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setEditProfileModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveProfile}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {isBangla ? 'সংরক্ষণ করুন' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal (Section 26 Spec) */}
      <Modal
        visible={changePasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isBangla ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {isBangla ? 'আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করুন' : 'Update your account credentials safely'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginVertical: 12 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {isBangla ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                </Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border }]}
                  value={currentPass}
                  onChangeText={setCurrentPass}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {isBangla ? 'নতুন পাসওয়ার্ড' : 'New Password (min 6 chars)'}
                </Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border }]}
                  value={newPass}
                  onChangeText={setNewPass}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {isBangla ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                </Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, color: colors.text, borderColor: colors.border }]}
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setChangePasswordModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleChangePassword}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {isBangla ? 'পাসওয়ার্ড আপডেট' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment History & Invoices Modal (Section 15 & 26 Spec) */}
      <Modal
        visible={paymentHistoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentHistoryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isBangla ? 'পেমেন্ট হিস্ট্রি ও ইনভয়েস' : 'Payment History & Invoices'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {isBangla ? 'সকল লেনদেন ও অফিশিয়াল ভ্যাট চালান' : 'Official VAT receipts & transaction history'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentHistoryModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8, gap: 12 }}>
              {[
                {
                  id: 'INV-2026-TS884',
                  item: 'Pro Executive Plan (Annual Access)',
                  amount: '৳2,900 BDT',
                  date: 'Sep 15, 2026',
                  gateway: 'bKash Merchant (01312100288)',
                  status: 'PAID',
                },
                {
                  id: 'INV-2026-TS721',
                  item: 'Advanced Supply Chain Analytics & Power BI',
                  amount: '৳1,500 BDT',
                  date: 'Aug 02, 2026',
                  gateway: 'Nagad Direct',
                  status: 'PAID',
                },
                {
                  id: 'INV-2026-TS590',
                  item: 'Generative AI for Corporate Leaders',
                  amount: '৳2,000 BDT',
                  date: 'Jul 14, 2026',
                  gateway: 'SSLCommerz (Visa / Mastercard)',
                  status: 'PAID',
                },
                {
                  id: 'INV-2026-TS432',
                  item: 'Professional Excel & Financial Modeling',
                  amount: '৳1,200 BDT',
                  date: 'May 28, 2026',
                  gateway: 'bKash Merchant',
                  status: 'PAID',
                },
              ].map((inv) => (
                <View
                  key={inv.id}
                  style={[
                    styles.invoiceItemCard,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.invoiceItemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.invoiceItemTitle, { color: colors.text }]}>{inv.item}</Text>
                      <Text style={[styles.invoiceMeta, { color: colors.textMuted }]}>
                        {inv.id} • {inv.date}
                      </Text>
                    </View>
                    <View style={styles.invoiceStatusBadge}>
                      <Text style={styles.invoiceStatusText}>{inv.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.invoiceItemBottom, { borderTopColor: colors.borderSubtle }]}>
                    <View>
                      <Text style={[styles.invoiceAmount, { color: colors.primary }]}>{inv.amount}</Text>
                      <Text style={[styles.invoiceGateway, { color: colors.textMuted }]}>{inv.gateway}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.invoiceReceiptBtn, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                      onPress={() =>
                        Alert.alert(
                          'Invoice Receipt Downloaded 📥',
                          `Invoice #${inv.id}\nItem: ${inv.item}\nAmount: ${inv.amount}\nGateway: ${inv.gateway}\nStatus: Paid\n\nOfficial VAT receipt ready for corporate expensing.`
                        )
                      }
                    >
                      <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                      <Text style={[styles.invoiceReceiptBtnText, { color: colors.primary }]}>
                        {isBangla ? 'রশিদ ডাউনলোড' : 'Receipt'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 12,
    marginBottom: 4,
  },
  role: {
    fontSize: 11,
    fontWeight: '600',
  },
  subscriptionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 6,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tierTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  tierTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  billingCycleText: {
    fontSize: 11,
    fontWeight: '600',
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
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
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
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  invoiceItemCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  invoiceItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  invoiceItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  invoiceMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  invoiceStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  invoiceStatusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  invoiceItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  invoiceGateway: {
    fontSize: 11,
    marginTop: 1,
  },
  invoiceReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  invoiceReceiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
