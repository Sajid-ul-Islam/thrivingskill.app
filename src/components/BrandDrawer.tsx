import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';
import { useLanguage } from '../context/LanguageContext';
import { AboutTSLModal, AboutTabKey } from './AboutTSLModal';
import { LegalPolicyModal, LegalTabKey } from './LegalPolicyModal';
import { RootTab } from '../types';

interface BrandDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigateTab: (tab: RootTab) => void;
  onOpenYouTube?: () => void;
  onOpenAssessment?: () => void;
  onOpenSubscription?: () => void;
  onOpenUpdate?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

export const BrandDrawer: React.FC<BrandDrawerProps> = ({
  visible,
  onClose,
  onNavigateTab,
  onOpenYouTube,
  onOpenAssessment,
  onOpenSubscription,
  onOpenUpdate,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { activeWorkspace, switchWorkspace, workspaces, subscriptionTier } = useSaaS();
  const { language, setLanguage, isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<AboutTabKey>('overview');
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('terms');

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  const handleNav = (action: () => void) => {
    onClose();
    setTimeout(action, 150);
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:01312100288').catch(() => {});
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://thrivingskill.com').catch(() => {});
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close Drawer"
        />

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContent,
            {
              width: DRAWER_WIDTH,
              backgroundColor: colors.surface,
              paddingTop: Math.max(insets.top, 24) + 12,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header Row with Brand & Close */}
          <View style={styles.drawerHeader}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <View>
                <Text style={[styles.brandTitle, { color: colors.text }]}>
                  Thriving<Text style={{ color: colors.primary }}>Skills</Text>
                </Text>
                <Text style={[styles.brandSlogan, { color: colors.textMuted }]}>
                  Upskill. Elevate. Thrive.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Body */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Workspace & Tier Pill */}
            <View style={[styles.workspaceCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <View style={styles.workspaceInfo}>
                <View style={[styles.wsIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons
                    name={activeWorkspace.type === 'enterprise' ? 'business' : 'person'}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.workspaceName, { color: colors.text }]} numberOfLines={1}>
                    {activeWorkspace.name}
                  </Text>
                  <Text style={[styles.workspaceTier, { color: colors.primary }]}>
                    {subscriptionTier.toUpperCase()} PLAN • {activeWorkspace.type === 'enterprise' ? `${activeWorkspace.activeSeats}/${activeWorkspace.totalSeats} Seats` : 'Learner'}
                  </Text>
                </View>
              </View>

              {workspaces.length > 1 && (
                <TouchableOpacity
                  style={[styles.switchWsBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={() => {
                    const nextWs = workspaces.find((w) => w.id !== activeWorkspace.id);
                    if (nextWs) switchWorkspace(nextWs.id);
                  }}
                >
                  <Ionicons name="swap-horizontal" size={14} color={colors.text} />
                  <Text style={[styles.switchWsText, { color: colors.text }]}>Switch</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Official Partner Spotlight Banner */}
            <View style={[styles.partnerBanner, { backgroundColor: colors.primaryLight, borderColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="shield-checkmark" size={15} color={colors.primary} />
                <Text style={[styles.partnerHeading, { color: colors.primary }]}>
                  OFFICIAL NATIONAL INITIATIVE
                </Text>
              </View>
              <Text style={[styles.partnerSub, { color: colors.text }]}>
                Co-organizer of Bangladesh Skills Summit with <Text style={{ fontWeight: '800' }}>DUCSU (University of Dhaka)</Text> & 4IR Summit with <Text style={{ fontWeight: '800' }}>NSU</Text>.
              </Text>
            </View>

            {/* Section 1: Learning Hub */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>LEARNING ECOSYSTEM</Text>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onNavigateTab('Courses'))}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="book-outline" size={18} color="#4F46E5" />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>All Courses & Bundles</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onNavigateTab('Copilot'))}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="hardware-chip-outline" size={18} color="#10B981" />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>AI Assistant</Text>
              <View style={[styles.badgeNew, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeNewText}>AI</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onOpenYouTube?.())}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="logo-youtube" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>YouTube Masterclasses</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onNavigateTab('Workshops'))}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>Live Summits & Workshops</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onOpenAssessment?.())}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="analytics-outline" size={18} color="#8B5CF6" />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>Skill Assessment Center</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onNavigateTab('MyLearning'))}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="ribbon-outline" size={18} color="#059669" />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>Verified Digital Certificates</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onNavigateTab('TeamHub'))}
            >
              <View style={[styles.navIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people-outline" size={18} color="#2563EB" />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>Enterprise Workforce Hub</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Section 2: Quick Controls & Settings */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES & SETTINGS</Text>

            {/* Dark Mode Toggle Row */}
            <TouchableOpacity style={styles.actionRow} onPress={toggleTheme}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#FBBF24' : '#F59E0B'} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {isDark ? 'Dark Theme' : 'Light Theme'}
                </Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.pillStateText, { color: colors.primary }]}>
                  {isDark ? 'ON' : 'OFF'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Language Switch */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="globe-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Language</Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.pillStateText, { color: colors.primary }]}>
                  {isBangla ? 'বাংলা' : 'English'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Check for Updates */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleNav(() => onOpenUpdate?.())}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="cloud-download-outline" size={18} color="#10B981" />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Check OTA Updates</Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>v1.0.0</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Section 3: Official Links & Contact */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ABOUT & GOVERNANCE</Text>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setAboutInitialTab('overview');
                setAboutModalVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>About Thriving Skills (TSL)</Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.pillStateText, { color: colors.primary }]}>Overview</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setAboutInitialTab('leadership');
                setAboutModalVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="people-outline" size={18} color="#F59E0B" />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Founders & Leadership</Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Text style={[styles.pillStateText, { color: '#F59E0B' }]}>Exec Board</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setAboutInitialTab('partners');
                setAboutModalVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Trusted Partners & MoUs</Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Text style={[styles.pillStateText, { color: '#10B981' }]}>Govt & Universities</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Section 4: Legal & Policies */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>LEGAL & POLICIES</Text>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setLegalInitialTab('terms');
                setLegalModalVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Terms & Conditions</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setLegalInitialTab('privacy_en');
                setLegalModalVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="shield-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Privacy Policy (English)</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setLegalInitialTab('privacy_bn');
                setLegalModalVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="language-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionLabel, { color: colors.primary }]}>গোপনীয়তা নীতি (বাংলা)</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Section 5: Support */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SUPPORT & CONTACT</Text>

            <TouchableOpacity style={styles.actionRow} onPress={handleCallHelpline}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="call-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Call Helpline</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>01312 100288</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleOpenWebsite}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="globe" size={18} color={colors.textMuted} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Visit thrivingskill.com</Text>
              </View>
              <Ionicons name="open-outline" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Thriving Skills Limited • Dhaka, BD
            </Text>
            <Text style={[styles.footerSub, { color: colors.textMuted }]}>
              © 2026 All Rights Reserved • SDG-4
            </Text>
          </View>
        </Animated.View>
      </View>

      <AboutTSLModal
        visible={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
        initialTab={aboutInitialTab}
        onNavigateTab={(tab) => {
          setAboutModalVisible(false);
          handleNav(() => onNavigateTab(tab));
        }}
      />

      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialTab={legalInitialTab}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawerContent: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSlogan: {
    fontSize: 10.5,
    marginTop: 1,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  workspaceCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workspaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  wsIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  workspaceTier: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 1,
  },
  switchWsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: 6,
  },
  switchWsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  partnerBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  partnerHeading: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  partnerSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
    gap: 10,
  },
  navIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },
  badgeNew: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeNewText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillState: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillStateText: {
    fontSize: 10,
    fontWeight: '800',
  },
  drawerFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 9.5,
    marginTop: 2,
  },
});
