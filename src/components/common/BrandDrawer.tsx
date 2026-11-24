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
  useWindowDimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useSaaS } from '../../context/SaaSContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLearning } from '../../context/LearningContext';
import { AboutTSLModal, AboutTabKey } from '../modals/AboutTSLModal';
import { LegalPolicyModal, LegalTabKey } from '../modals/LegalPolicyModal';
import { HelpFaqModal } from '../modals/HelpFaqModal';
import { BlogModal } from '../modals/BlogModal';
import { EbookModal } from '../modals/EbookModal';
import { ServicesModal } from '../modals/ServicesModal';
import { InstructorsModal } from '../modals/InstructorsModal';
import { RootTab } from '../../types';
import { shape } from '../../theme/shapes';
import { Env } from '../../config/env';
import { MessengerIcon } from './MessengerIcon';

interface BrandDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigateTab: (tab: RootTab) => void;
  onOpenYouTube?: () => void;
  onOpenAssessment?: () => void;
  onOpenSubscription?: () => void;
  onOpenUpdate?: () => void;
  onOpenSupport?: () => void;
  onOpenCorporate?: () => void;
}

export const BrandDrawer: React.FC<BrandDrawerProps> = ({
  visible,
  onClose,
  onNavigateTab,
  onOpenYouTube,
  onOpenAssessment,
  onOpenSubscription,
  onOpenUpdate,
  onOpenSupport,
  onOpenCorporate,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const drawerWidth = Math.min(windowWidth * 0.82, 340);
  const { colors, isDark, toggleTheme } = useTheme();
  const { activeWorkspace, switchWorkspace, workspaces, subscriptionTier } = useSaaS();
  const { language, setLanguage, isBangla } = useLanguage();
  const { user, isAuthenticated, logout, setAuthModalVisible } = useAuth();
  const { siteBranding } = useLearning();
  const insets = useSafeAreaInsets();
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<AboutTabKey>('overview');
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('terms');
  const [legalPrivacyLang, setLegalPrivacyLang] = useState<'en' | 'bn'>('en');
  const [helpFaqModalVisible, setHelpFaqModalVisible] = useState(false);
  const [blogModalVisible, setBlogModalVisible] = useState(false);
  const [ebookModalVisible, setEbookModalVisible] = useState(false);
  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [servicesInitialId, setServicesInitialId] = useState<string | undefined>(undefined);
  const [instructorsModalVisible, setInstructorsModalVisible] = useState(false);

  const [modalRendered, setModalRendered] = useState(visible);
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setModalRendered(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 3,
          speed: 16,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -drawerWidth,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalRendered(false);
      });
    }
  }, [visible, drawerWidth, slideAnim, fadeAnim]);

  if (!modalRendered) return null;

  const handleNav = (action: () => void) => {
    onClose();
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
    }
    navTimerRef.current = setTimeout(() => {
      navTimerRef.current = null;
      action();
    }, 150);
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:01312100288').catch(() => {});
  };

  const handleOpenWebsite = () => {
    Linking.openURL(Env.SITE_URL).catch(() => {});
  };

  return (
    <Modal
      transparent
      visible={modalRendered}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
            accessibilityLabel="Close Drawer"
          />
        </Animated.View>

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContent,
            {
              width: drawerWidth,
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
                source={require('../../../assets/icon.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <View style={styles.brandTitleCol}>
                <Text style={[styles.brandTitle, { color: colors.text }]} numberOfLines={1}>
                  Thriving<Text style={{ color: colors.primary }}>Skills</Text>
                </Text>
                <Text style={[styles.brandSlogan, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                  {isBangla
                    ? (siteBranding?.taglineBn || 'দক্ষ জাতি গঠনে মানুষের ক্ষমতায়ন')
                    : (siteBranding?.tagline || 'Empowering People, Building a Skilled Nation')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close Drawer"
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
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Switch Workspace"
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

            {/* Section 1: Learning & Knowledge (eBook, Blog, Our Course Author, Become An Instructor) */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {isBangla ? 'লার্নিং ও নলেজ হাব' : 'LEARNING & KNOWLEDGE'}
            </Text>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onNavigateTab('Courses'))}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(255, 182, 6, 0.16)' : '#EFF6FF' }]}>
                <Ionicons name="compass-outline" size={18} color={isDark ? colors.primary : '#102F53'} />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>
                {isBangla ? 'সকল কোর্স ও বান্ডেল' : 'All Courses & Bundles'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* 1. eBook */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setEbookModalVisible(true)}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(255, 182, 6, 0.16)' : '#FFFBEB' }]}>
                <Ionicons name="book-outline" size={18} color="#FFB606" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navLabel, { color: colors.text }]}>
                  {isBangla ? 'ই-বুক (eBook)' : 'eBook'}
                </Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: isDark ? '#1C2E46' : '#EFF6FF' }]}>
                <Text style={[styles.pillStateText, { color: colors.primary }]}>FREE</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Blog */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setBlogModalVisible(true)}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : '#F5F3FF' }]}>
                <Ionicons name="newspaper-outline" size={18} color={isDark ? '#A78BFA' : '#8B5CF6'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navLabel, { color: colors.text }]}>
                  {isBangla ? 'ব্লগ (Blog)' : 'Blog'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* 5. Our Course Author */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setInstructorsModalVisible(true)}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5' }]}>
                <Ionicons name="people-outline" size={18} color={isDark ? '#34D399' : '#059669'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navLabel, { color: colors.text }]}>
                  {isBangla ? 'আমাদের কোর্স ইন্সট্রাক্টর (Our Course Author)' : 'Our Course Author'}
                </Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: isDark ? '#1E3147' : '#FEF3C7' }]}>
                <Text style={[styles.pillStateText, { color: '#FFB606' }]}>FACULTY</Text>
              </View>
            </TouchableOpacity>

            {/* 6. Become An Instructor */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => Linking.openURL(`${Env.SITE_URL}/become-an-instructor/`).catch(() => {})}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(227, 66, 52, 0.16)' : '#FEE2E2' }]}>
                <Ionicons name="school-outline" size={18} color="#E34234" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navLabel, { color: colors.text }]}>
                  {isBangla ? 'ইন্সট্রাক্টর হন (Become An Instructor)' : 'Become An Instructor'}
                </Text>
              </View>
              <Ionicons name="open-outline" size={15} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Live Class & Summits */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onNavigateTab('Workshops'))}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FFFBEB' }]}>
                <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>
                {isBangla ? 'লাইভ ক্লাস ও সামিট' : 'Live Class & Summits'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* YouTube Masterclasses */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onOpenYouTube?.())}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEF2F2' }]}>
                <Ionicons name="logo-youtube" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>YouTube Masterclasses</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNav(() => onOpenAssessment?.())}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : '#F5F3FF' }]}>
                <Ionicons name="analytics-outline" size={18} color={isDark ? '#A78BFA' : '#8B5CF6'} />
              </View>
              <Text style={[styles.navLabel, { color: colors.text }]}>Skill Assessment Center</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Section 2: Corporate & Services (Services >, Buy For Team, Business Consultancy, Affiliate) */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {isBangla ? 'কর্পোরেট সলিউশন ও পার্টনারশিপ' : 'SERVICES & ENTERPRISE'}
            </Text>

            {/* 4. Services > */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                setServicesInitialId(undefined);
                setServicesModalVisible(true);
              }}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(255, 182, 6, 0.16)' : '#FFFBEB' }]}>
                <Ionicons name="briefcase-outline" size={18} color={isDark ? colors.primary : '#102F53'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navLabel, { color: colors.text }]}>
                  {isBangla ? 'সার্ভিসসমূহ (Services)' : 'Services'}
                </Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: isDark ? '#1C2E46' : '#E0F2FE' }]}>
                <Text style={[styles.pillStateText, { color: colors.primary }]}>6 SOLUTIONS</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            {/* 7. Buy For Team */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                if (onOpenCorporate) {
                  onClose();
                  onOpenCorporate();
                } else {
                  Linking.openURL(`${Env.SITE_URL}/buyforyourteam/`).catch(() => {});
                }
              }}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5' }]}>
                <Ionicons name="business-outline" size={18} color={isDark ? '#34D399' : '#059669'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navLabel, { color: colors.text }]}>
                  {isBangla ? 'টিমের জন্য সাবস্ক্রিপশন (Buy For Team)' : 'Buy For Team'}
                </Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: isDark ? '#1E3147' : '#DCFCE7' }]}>
                <Text style={[styles.pillStateText, { color: '#10B981' }]}>TEAMS</Text>
              </View>
            </TouchableOpacity>

            {/* 8. Business Consultancy */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                setServicesInitialId('digital-transformation');
                setServicesModalVisible(true);
              }}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7' }]}>
                <Ionicons name="trending-up-outline" size={18} color={isDark ? '#FBBF24' : '#D97706'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navLabel, { color: colors.text }]}>
                  {isBangla ? 'বিজনেস কনসালট্যান্সি (Business Consultancy)' : 'Business Consultancy'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* 9. Affiliate */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => Linking.openURL(`${Env.SITE_URL}/affiliate/`).catch(() => {})}
            >
              <View style={[styles.navIconBg, { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.18)' : '#FCE7F3' }]}>
                <Ionicons name="gift-outline" size={18} color={isDark ? '#F472B6' : '#DB2777'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.navLabel, { color: colors.text }]}>
                  {isBangla ? 'অ্যাফিলিয়েট প্রোগ্রাম (Affiliate)' : 'Affiliate'}
                </Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: isDark ? '#1C2E46' : '#FCE7F3' }]}>
                <Text style={[styles.pillStateText, { color: '#EC4899' }]}>EARN</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Section 3: Company & Governance (About Us, Contact, HELP) */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {isBangla ? 'প্রতিষ্ঠান ও সহায়তা' : 'ABOUT & GOVERNANCE'}
            </Text>

            {/* 3. About Us */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setAboutInitialTab('overview');
                setAboutModalVisible(true);
              }}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {isBangla ? 'আমাদের সম্পর্কে (About Us)' : 'About Us'}
                </Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.pillStateText, { color: colors.primary }]}>TSL</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setAboutInitialTab('leadership');
                setAboutModalVisible(true);
              }}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="people-outline" size={18} color="#F59E0B" />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Founders & Leadership</Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Text style={[styles.pillStateText, { color: '#F59E0B' }]}>Exec Board</Text>
              </View>
            </TouchableOpacity>

            {/* 10. Contact */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                if (onOpenSupport) {
                  onClose();
                  onOpenSupport();
                } else {
                  handleCallHelpline();
                }
              }}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="call-outline" size={18} color="#10B981" />
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {isBangla ? 'যোগাযোগ (Contact)' : 'Contact'}
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, flexShrink: 0 }}>01312 100288</Text>
            </TouchableOpacity>

            {/* 14. HELP */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setHelpFaqModalVisible(true)}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="help-circle-outline" size={18} color="#6366F1" />
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {isBangla ? 'হেল্প ও এফএকিউ (HELP)' : 'HELP'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>

            {/* WhatsApp Live Support */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => Linking.openURL('https://wa.me/8801312100288').catch(() => {})}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={1}>WhatsApp Live Support</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#25D366', flexShrink: 0 }}>Active</Text>
            </TouchableOpacity>

            {/* Messenger Support */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => Linking.openURL('https://m.me/thrivingskills').catch(() => {})}
            >
              <View style={styles.actionLeft}>
                <MessengerIcon size={18} color="#0084FF" />
                <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={1}>Messenger</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#0084FF', flexShrink: 0 }}>@thrivingskills</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Section 4: Legal & Policies (Privacy Policy, Privacy Policy Bangla, Terms and Conditions) */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {isBangla ? 'নীতিমালা ও শর্তাবলি' : 'LEGAL & POLICIES'}
            </Text>

            {/* 11. Privacy Policy */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setLegalInitialTab('privacy');
                setLegalPrivacyLang('en');
                setLegalModalVisible(true);
              }}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="shield-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Privacy Policy</Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.pillStateText, { color: colors.primary }]}>EN</Text>
              </View>
            </TouchableOpacity>

            {/* 12. Privacy Policy Bangla */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setLegalInitialTab('privacy');
                setLegalPrivacyLang('bn');
                setLegalModalVisible(true);
              }}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Privacy Policy Bangla (বাংলা)</Text>
              </View>
              <View style={[styles.pillState, { backgroundColor: isDark ? '#1C2E46' : '#EFF6FF' }]}>
                <Text style={[styles.pillStateText, { color: colors.primary }]}>বাংলা</Text>
              </View>
            </TouchableOpacity>

            {/* 13. Terms and Conditions */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setLegalInitialTab('terms');
                setLegalModalVisible(true);
              }}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>Terms and Conditions</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Section 5: Preferences & Settings */}
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
              <Text style={{ fontSize: 11, color: colors.textMuted }}>v1.4.0</Text>
            </TouchableOpacity>

            {/* Section 6: User Authentication & Logout */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={{ paddingHorizontal: 8, paddingBottom: 10 }}>
              {isAuthenticated ? (
                <TouchableOpacity
                  style={[styles.sessionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                  onPress={() => {
                    onClose();
                    logout();
                  }}
                >
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                  <Text style={[styles.sessionBtnText, { color: '#EF4444' }]}>
                    {isBangla ? 'লগআউট করুন' : 'Logout'} ({user?.username || 'Learner'})
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.sessionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => {
                    onClose();
                    setAuthModalVisible(true);
                  }}
                >
                  <Ionicons name="log-in-outline" size={18} color={colors.onPrimary} />
                  <Text style={[styles.sessionBtnText, { color: colors.onPrimary }]}>
                    {isBangla ? 'লগইন / সাইন আপ' : 'Sign In / Register'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
        initialPrivacyLang={legalPrivacyLang}
      />

      <HelpFaqModal
        visible={helpFaqModalVisible}
        onClose={() => setHelpFaqModalVisible(false)}
      />

      <BlogModal
        visible={blogModalVisible}
        onClose={() => setBlogModalVisible(false)}
      />

      <EbookModal
        visible={ebookModalVisible}
        onClose={() => setEbookModalVisible(false)}
      />

      <ServicesModal
        visible={servicesModalVisible}
        onClose={() => setServicesModalVisible(false)}
        initialServiceId={servicesInitialId}
        onOpenInquiry={(title) => {
          setServicesModalVisible(false);
          if (onOpenCorporate) {
            onClose();
            onOpenCorporate();
          }
        }}
      />

      <InstructorsModal
        visible={instructorsModalVisible}
        onClose={() => setInstructorsModalVisible(false)}
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
    height: '100%',
    flexGrow: 0,
    flexShrink: 0,
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
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    flexShrink: 0,
  },
  brandTitleCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
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
    borderRadius: shape.large,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  workspaceCard: {
    borderRadius: shape.medium,
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
    borderRadius: shape.full,
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
    borderRadius: shape.small,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: 6,
  },
  switchWsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  partnerBanner: {
    borderRadius: shape.medium,
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
    borderRadius: shape.medium,
    marginBottom: 2,
    gap: 10,
  },
  navIconBg: {
    width: 32,
    height: 32,
    borderRadius: shape.small,
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
    borderRadius: shape.extraSmall,
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
    minHeight: 48,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  pillState: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: shape.medium,
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
  sessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: shape.medium,
    borderWidth: 1,
    marginTop: 6,
  },
  sessionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
