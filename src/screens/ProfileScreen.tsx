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
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<AboutTabKey>('overview');
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('terms');
  const { userProgress, certificates } = useLearning();
  const { user, isAuthenticated, logout, setAuthModalVisible } = useAuth();
  const {
    subscriptionTier,
    billingInterval,
    activeWorkspace,
  } = useSaaS();

  const enrolledCount = Object.keys(userProgress).length;
  const completedCount = Object.values(userProgress).filter((p) => p.isCompleted).length;

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
                {user?.displayName || user?.username || 'Guest Learner'}
              </Text>
              <View
                style={[
                  styles.verifiedBadge,
                  { backgroundColor: isAuthenticated ? colors.primaryLight : colors.surfaceSubtle },
                ]}
              >
                <Ionicons
                  name={isAuthenticated ? 'checkmark-circle' : 'person-outline'}
                  size={12}
                  color={isAuthenticated ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.verifiedText,
                    { color: isAuthenticated ? colors.primary : colors.textMuted },
                  ]}
                >
                  {isAuthenticated ? 'WORDPRESS' : 'GUEST'}
                </Text>
              </View>
            </View>
            <Text style={[styles.email, { color: colors.textMuted }]}>
              {user?.email || 'Explore catalog & courses freely'}
            </Text>
            <Text style={[styles.role, { color: colors.secondary }]}>
              {isAuthenticated
                ? `Connected to thrivingskill.com • ${activeWorkspace.name}`
                : 'Thriving Skills Online Platform'}
            </Text>
          </View>
        </View>

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
                onPress={handleDownloadInvoice}
              >
                <Ionicons name="receipt-outline" size={16} color={colors.text} />
                <Text style={[styles.invoiceBtnText, { color: colors.text }]}>Invoice</Text>
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
});
