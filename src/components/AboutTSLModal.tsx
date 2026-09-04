import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface AboutTSLModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any) => void;
}

type TabKey = 'overview' | 'pillars' | 'summits' | 'leadership' | 'contact';

export const AboutTSLModal: React.FC<AboutTSLModalProps> = ({
  visible,
  onClose,
  onNavigateTab,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  if (!visible) return null;

  const handleCall = () => {
    Linking.openURL('tel:01312100288').catch(() => {});
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/8801312100288').catch(() => {});
  };

  const handleEmail = () => {
    Linking.openURL('mailto:info@thrivingskill.com').catch(() => {});
  };

  const handleOpenUrl = (url: string) => {
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
        {/* Modal Header */}
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
          <View style={styles.headerTitleRow}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.companyTitle, { color: colors.text }]}>
                Thriving<Text style={{ color: colors.primary }}>Skills</Text> Limited
              </Text>
              <Text style={[styles.companySubtitle, { color: colors.textMuted }]}>
                {isBangla ? 'দক্ষ জাতি গঠনে মানুষের ক্ষমতায়ন' : 'Empowering People, Building a Skilled Nation'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {[
              { key: 'overview', label: isBangla ? 'সংক্ষিপ্ত তথ্য' : 'Overview', icon: 'information-circle-outline' },
              { key: 'pillars', label: isBangla ? '৪টি মূল স্তম্ভ' : '4 Pillars', icon: 'layers-outline' },
              { key: 'summits', label: isBangla ? 'সামিট ও পার্টনার' : 'Summits', icon: 'ribbon-outline' },
              { key: 'leadership', label: isBangla ? 'নেতৃত্ব দল' : 'Leadership', icon: 'people-outline' },
              { key: 'contact', label: isBangla ? 'যোগাযোগ' : 'Contact', icon: 'call-outline' },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surfaceSubtle,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setActiveTab(tab.key as TabKey)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={isActive ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isActive ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content Body */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.contentBody, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <View style={styles.sectionContainer}>
              {/* Mission Hero Banner */}
              <View style={[styles.heroCard, { backgroundColor: isDark ? colors.surfaceCard : '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="sparkles" size={18} color="#10B981" />
                  <Text style={[styles.heroBadge, { color: '#059669' }]}>
                    OFFICIAL CORPORATE ECOSYSTEM
                  </Text>
                </View>
                <Text style={[styles.heroTitle, { color: colors.text }]}>
                  {isBangla
                    ? 'প্রযুক্তি ও মানব প্রতিভার সমন্বয়ে দক্ষতা-ভিত্তিক ভবিষ্যৎ অর্থনীতি'
                    : 'Skills-Focused Economy With Tech-Enabled Human Potential'}
                </Text>
                <Text style={[styles.heroDesc, { color: colors.textMuted }]}>
                  {isBangla
                    ? 'থ্রাইভিং স্কিলস লিমিটেড (TSL) একটি শীর্ষস্থানীয় স্কিলস অ্যান্ড ক্যাপাসিটি ডেভেলপমেন্ট প্ল্যাটফর্ম। ঢাকা বিশ্ববিদ্যালয় ডাকসু ও নর্থ সাউথ বিশ্ববিদ্যালয় এর সাথে যৌথভাবে জাতীয় দক্ষতা সামিট আয়োজনের পাশাপাশি দেশের লাখো পেশাজীবী ও শিক্ষার্থীকে ভবিষ্যতের জন্য প্রস্তুত করছে।'
                    : 'Thriving Skills Limited (TSL) is a premier workforce upskilling and corporate learning ecosystem in Bangladesh. Through cutting-edge masterclasses, national summits, and strategic advisory, TSL equips executives and fresh graduates for the 4th Industrial Revolution.'}
                </Text>
              </View>

              {/* Key Highlights Metrics */}
              <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                  <Text style={[styles.metricNumber, { color: colors.primary }]}>300+</Text>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'অন-ডিমান্ড কোর্স' : 'Executive Courses'}
                  </Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                  <Text style={[styles.metricNumber, { color: '#10B981' }]}>50,000+</Text>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'পেশাজীবী লার্নার' : 'Empowered Learners'}
                  </Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                  <Text style={[styles.metricNumber, { color: '#F59E0B' }]}>5+</Text>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'জাতীয় সামিট' : 'National Summits'}
                  </Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                  <Text style={[styles.metricNumber, { color: '#8B5CF6' }]}>150+</Text>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'কর্পোরেট পার্টনার' : 'Enterprise Partners'}
                  </Text>
                </View>
              </View>

              {/* SDG-4 Commitment */}
              <View style={[styles.infoBlock, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Ionicons name="globe-outline" size={18} color="#0284C7" />
                  <Text style={[styles.infoBlockTitle, { color: colors.text }]}>
                    SDG-4 Quality Education & Decent Work
                  </Text>
                </View>
                <Text style={[styles.infoBlockDesc, { color: colors.textMuted }]}>
                  Aligned with United Nations Sustainable Development Goals (SDG-4 & SDG-8), TSL delivers inclusive, high-impact digital learning accessible anywhere across Bangladesh and South Asia.
                </Text>
              </View>
            </View>
          )}

          {/* TAB 2: 4 CORE PILLARS */}
          {activeTab === 'pillars' && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.subheading, { color: colors.textMuted }]}>
                {isBangla ? 'আমাদের ৪টি প্রধান প্রাতিষ্ঠানিক সেবা স্তম্ভ:' : 'Our 4 Core Corporate Pillars:'}
              </Text>

              {/* Pillar 1 */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <View style={[styles.pillarIconBg, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="laptop-outline" size={22} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pillarTitle, { color: colors.text }]}>
                    1. Digital Learning Solutions (LMS)
                  </Text>
                  <Text style={[styles.pillarSubtitle, { color: colors.primary }]}>
                    {isBangla ? 'কর্পোরেট এলএমএস ও ডিজিটাল লার্নিং' : 'Enterprise LMS & SCORM Training'}
                  </Text>
                  <Text style={[styles.pillarDesc, { color: colors.textMuted }]}>
                    Custom LMS deployments, employee competency analytics, progress tracking dashboards, and interactive SCORM e-learning module authoring.
                  </Text>
                </View>
              </View>

              {/* Pillar 2 */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <View style={[styles.pillarIconBg, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="school-outline" size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pillarTitle, { color: colors.text }]}>
                    2. Professional Training & Cohorts
                  </Text>
                  <Text style={[styles.pillarSubtitle, { color: '#059669' }]}>
                    {isBangla ? '৩০০+ কোর্স ও সাপ্তাহিক লাইভ সেশন' : '300+ Courses & Weekly Live Classes'}
                  </Text>
                  <Text style={[styles.pillarDesc, { color: colors.textMuted }]}>
                    Self-paced on-demand masterclasses and live executive bootcamps spanning Generative & Agentic AI, MS Excel & BI, Leadership, Financial Modeling, and HR Operations.
                  </Text>
                </View>
              </View>

              {/* Pillar 3 */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <View style={[styles.pillarIconBg, { backgroundColor: '#FAF5FF' }]}>
                  <Ionicons name="briefcase-outline" size={22} color="#9333EA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pillarTitle, { color: colors.text }]}>
                    3. Strategic Advisory & Consultancy
                  </Text>
                  <Text style={[styles.pillarSubtitle, { color: '#9333EA' }]}>
                    {isBangla ? 'বিজনেস কনসালটেন্সি ও এসএমই রূপান্তর' : 'Corporate & SME Transformation'}
                  </Text>
                  <Text style={[styles.pillarDesc, { color: colors.textMuted }]}>
                    Strategic advisory services for SME scaling, ICT readiness, organizational culture, digital transformation roadmaps, and corporate governance.
                  </Text>
                </View>
              </View>

              {/* Pillar 4 */}
              <View style={[styles.pillarCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <View style={[styles.pillarIconBg, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="globe-outline" size={22} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pillarTitle, { color: colors.text }]}>
                    4. Ecosystem & Community Initiatives
                  </Text>
                  <Text style={[styles.pillarSubtitle, { color: '#D97706' }]}>
                    {isBangla ? 'জাতীয় সামিট ও বিশ্ববিদ্যালয় পার্টনারশিপ' : 'National Summits & University Alliances'}
                  </Text>
                  <Text style={[styles.pillarDesc, { color: colors.textMuted }]}>
                    Flagship national summits bringing together government, universities, and industry leaders to bridge the skill gap between academia and modern enterprise.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 3: NATIONAL SUMMITS */}
          {activeTab === 'summits' && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.subheading, { color: colors.textMuted }]}>
                {isBangla ? 'থ্রাইভিং স্কিলসের অফিসিয়াল জাতীয় সামিটসমূহ:' : 'Official TSL National Summits & Forums:'}
              </Text>

              {[
                {
                  title: 'Bangladesh Skills Summit',
                  badge: 'Flagship National Initiative',
                  partner: 'Co-organized with DUCSU (University of Dhaka)',
                  venue: 'Dhaka University Senate Bhaban',
                  desc: 'Uniting policymakers, corporate titans, and academia to establish Bangladesh as a global hub of skilled human capital.',
                  icon: 'business-outline',
                  color: '#4F46E5',
                },
                {
                  title: '4IR Skills Summit',
                  badge: 'Fourth Industrial Revolution',
                  partner: 'Organized with North South University (NSU)',
                  venue: 'NSU Campus & Hybrid Virtual Stage',
                  desc: 'Deep dives into Generative AI, enterprise robotics, prompt engineering, and workforce re-skilling for automated industries.',
                  icon: 'hardware-chip-outline',
                  color: '#10B981',
                },
                {
                  title: 'Bangladesh Blockchain Summit',
                  badge: 'Distributed Ledger & Web3',
                  partner: 'Industry & Tech Alliances',
                  venue: 'National Tech Auditoriums',
                  desc: 'National forum on blockchain adoption, smart contracts, fin-tech security, and verifiable credentialing.',
                  icon: 'shield-checkmark-outline',
                  color: '#8B5CF6',
                },
                {
                  title: 'Bangladesh Excel Summit',
                  badge: 'Premier Data Championship',
                  partner: 'bdexcelsummit.thrivingskill.com',
                  venue: 'Annual Live Championship Series',
                  desc: 'South Asia’s most popular financial modeling and Microsoft Excel mastery championship with speed formula challenges.',
                  icon: 'grid-outline',
                  color: '#059669',
                },
                {
                  title: 'Employability & Skills Summit',
                  badge: 'Youth & Graduate Career Bridge',
                  partner: 'Top 30+ University Placement Cells',
                  venue: 'Nationwide Campus Drive',
                  desc: 'Connecting top graduating talent with leading MNCs, telecommunications giants, and fast-growing tech companies.',
                  icon: 'people-outline',
                  color: '#F59E0B',
                },
              ].map((summit, idx) => (
                <View
                  key={idx}
                  style={[styles.summitCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                >
                  <View style={styles.summitHeaderRow}>
                    <View style={[styles.summitIconBg, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                      <Ionicons name={summit.icon as any} size={20} color={summit.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.summitTitle, { color: colors.text }]}>{summit.title}</Text>
                      <View style={[styles.summitBadge, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
                        <Text style={[styles.summitBadgeText, { color: summit.color }]}>{summit.badge}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.partnerRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={[styles.summitPartnerText, { color: colors.text }]}>{summit.partner}</Text>
                  </View>
                  <Text style={[styles.summitDesc, { color: colors.textMuted }]}>{summit.desc}</Text>
                </View>
              ))}
            </View>
          )}

          {/* TAB 4: LEADERSHIP */}
          {activeTab === 'leadership' && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.subheading, { color: colors.textMuted }]}>
                {isBangla ? 'থ্রাইভিং স্কিলস লিমিটেডের নির্বাহী পরিচালনা পর্ষদ:' : 'Executive Leadership & Board of Directors:'}
              </Text>

              {[
                {
                  name: 'Md. Abdullah Al Mahmud',
                  title: 'Chief Executive Officer (CEO) & Co-Founder',
                  desc: 'Visionary edtech entrepreneur committed to human potential development and bridging industry-academia skills gaps across Bangladesh.',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
                },
                {
                  name: 'Syed Nuruddin Ahmed',
                  title: 'Director & Strategic Advisor',
                  desc: 'Senior corporate governance leader, institutional strategist, and advocate for sustainable workforce development.',
                  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
                },
                {
                  name: 'Yusuf Iqbal',
                  title: 'Director, Operations & Partnerships',
                  desc: 'Leading strategic alliances with national universities, chambers of commerce, and multilateral organizations.',
                  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
                },
                {
                  name: 'Sayed Sirajul Islam',
                  title: 'Director, Digital Learning Technologies',
                  desc: 'Spearheading LMS platform infrastructure, enterprise digital systems, and scalable cloud architectures.',
                  avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
                },
                {
                  name: 'Md. Tareq Siddiqui',
                  title: 'Head of Strategic Communications',
                  desc: 'Driving national skills initiatives, media relations, and high-impact corporate ecosystem outreach.',
                  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
                },
                {
                  name: 'Md: Abdulla Al Noman',
                  title: 'Head of Learning Operations',
                  desc: 'Managing 300+ course curriculums, certified instructor cohorts, and enterprise learner satisfaction.',
                  avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
                },
              ].map((leader, idx) => (
                <View
                  key={idx}
                  style={[styles.leaderCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                >
                  <Image source={{ uri: leader.avatar }} style={styles.leaderAvatar} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.leaderName, { color: colors.text }]}>{leader.name}</Text>
                    <Text style={[styles.leaderTitle, { color: colors.primary }]}>{leader.title}</Text>
                    <Text style={[styles.leaderDesc, { color: colors.textMuted }]}>{leader.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 5: CONTACT & COORDINATES */}
          {activeTab === 'contact' && (
            <View style={styles.sectionContainer}>
              <View style={[styles.contactCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <Text style={[styles.contactCardHeader, { color: colors.text }]}>
                  {isBangla ? 'অফিসিয়াল যোগাযোগ ও সাপোর্ট' : 'Official Coordinates & Support'}
                </Text>

                {/* Hotline Phone */}
                <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                  <View style={[styles.contactIconBg, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="call" size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactLabel, { color: colors.textMuted }]}>
                      {isBangla ? 'অফিসিয়াল হটলাইন' : 'Direct Helpline'}
                    </Text>
                    <Text style={[styles.contactValue, { color: colors.primary }]}>01312 100288</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {/* WhatsApp */}
                <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
                  <View style={[styles.contactIconBg, { backgroundColor: '#ECFDF5' }]}>
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

                {/* Email */}
                <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
                  <View style={[styles.contactIconBg, { backgroundColor: '#FAF5FF' }]}>
                    <Ionicons name="mail" size={18} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactLabel, { color: colors.textMuted }]}>
                      {isBangla ? 'ইমেইল যোগাযোগ' : 'Inquiries & Support Email'}
                    </Text>
                    <Text style={[styles.contactValue, { color: colors.text }]}>info@thrivingskill.com</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Web */}
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => handleOpenUrl('https://thrivingskill.com')}
                >
                  <View style={[styles.contactIconBg, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="globe-outline" size={18} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactLabel, { color: colors.textMuted }]}>
                      {isBangla ? 'অফিসিয়াল ওয়েবসাইট' : 'Official Portal'}
                    </Text>
                    <Text style={[styles.contactValue, { color: colors.text }]}>thrivingskill.com</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Social Channels */}
              <Text style={[styles.subheading, { color: colors.textMuted, marginTop: 16 }]}>
                {isBangla ? 'সোশ্যাল মিডিয়ায় যুক্ত থাকুন:' : 'Official Social Channels:'}
              </Text>

              <View style={styles.socialGrid}>
                {[
                  {
                    name: 'Facebook',
                    icon: 'logo-facebook',
                    color: '#1877F2',
                    url: 'https://www.facebook.com/thrivingskills/',
                  },
                  {
                    name: 'LinkedIn',
                    icon: 'logo-linkedin',
                    color: '#0A66C2',
                    url: 'https://www.linkedin.com/company/thriving-skills',
                  },
                  {
                    name: 'YouTube',
                    icon: 'logo-youtube',
                    color: '#FF0000',
                    url: 'https://www.youtube.com/@ThrivingSkills',
                  },
                  {
                    name: 'Twitter / X',
                    icon: 'logo-twitter',
                    color: '#1DA1F2',
                    url: 'https://twitter.com/SkillsThriving',
                  },
                  {
                    name: 'Instagram',
                    icon: 'logo-instagram',
                    color: '#E4405F',
                    url: 'https://www.instagram.com/thriving_skills/',
                  },
                ].map((social, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.socialPill, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                    onPress={() => handleOpenUrl(social.url)}
                  >
                    <Ionicons name={social.icon as any} size={18} color={social.color} />
                    <Text style={[styles.socialName, { color: colors.text }]}>{social.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  companyTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  companySubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentBody: {
    padding: 16,
  },
  sectionContainer: {
    gap: 14,
  },
  heroCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  heroBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  infoBlock: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoBlockDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pillarCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  pillarIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  pillarSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  pillarDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  summitCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  summitHeaderRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  summitIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summitTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  summitBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  summitBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summitPartnerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summitDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  leaderCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  leaderAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  leaderName: {
    fontSize: 14,
    fontWeight: '800',
  },
  leaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  leaderDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  contactCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  contactCardHeader: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
    gap: 12,
  },
  contactIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  socialName: {
    fontSize: 12,
    fontWeight: '700',
  },
});
