import React, { useState, useEffect } from 'react';
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

import { LegalPolicyModal, LegalTabKey } from './LegalPolicyModal';

export type AboutTabKey = 'overview' | 'pillars' | 'partners' | 'summits' | 'leadership' | 'contact';

interface AboutTSLModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any) => void;
  initialTab?: AboutTabKey;
}

// Authentic Founder & Leadership Team Assets from official thrivingskill.com portal
const FOUNDER_IMAGES = {
  abdullah_al_mahmud: require('../../assets/team/abdullah_al_mahmud.jpeg'),
  syed_nuruddin_ahmed: require('../../assets/team/syed_nuruddin_ahmed.jpeg'),
  yusuf_iqbal: require('../../assets/team/yusuf_iqbal.jpeg'),
  tareq_siddiqui: require('../../assets/team/tareq_siddiqui.jpeg'),
  abdulla_al_noman: require('../../assets/team/abdulla_al_noman.jpeg'),
};

export const AboutTSLModal: React.FC<AboutTSLModalProps> = ({
  visible,
  onClose,
  onNavigateTab,
  initialTab = 'overview',
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AboutTabKey>(initialTab);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('terms');

  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

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
              { key: 'partners', label: isBangla ? 'পার্টনার্স ও সহযোগী' : 'Partners & MoUs', icon: 'shield-checkmark-outline' },
              { key: 'summits', label: isBangla ? 'সামিট ও ইভেন্ট' : 'Summits', icon: 'ribbon-outline' },
              { key: 'leadership', label: isBangla ? 'নেতৃত্ব ও ফাউন্ডার্স' : 'Founders & Team', icon: 'people-outline' },
              { key: 'contact', label: isBangla ? 'যোগাযোগ ও আইনি' : 'Contact & Legal', icon: 'call-outline' },
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
                  onPress={() => setActiveTab(tab.key as AboutTabKey)}
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

          {/* TAB 3: TRUSTED PARTNERS & MOUS */}
          {activeTab === 'partners' && (
            <View style={styles.sectionContainer}>
              <View
                style={[
                  styles.verifiedHeaderBanner,
                  { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF', borderColor: '#2563EB44' },
                ]}
              >
                <Ionicons name="ribbon" size={20} color="#2563EB" />
                <Text style={[styles.verifiedHeaderText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
                  {isBangla
                    ? 'শীর্ষস্থানীয় বিশ্ববিদ্যালয়, সরকারি উদ্ভাবনী বিভাগ ও শিল্প অংশীদারদের সাথে কার্যকর কোলাবরেশন'
                    : 'Strategic Partnerships, Signed MoUs & Academic Co-Organizers'}
                </Text>
              </View>

              <Text style={[styles.subheading, { color: colors.textMuted }]}>
                {isBangla ? 'থ্রাইভিং স্কিলসের প্রাতিষ্ঠানিক ও জাতীয় সহযোগীসমূহ:' : 'TSL Institutional & Strategic Alliances:'}
              </Text>

              {[
                {
                  category: isBangla ? 'জাতীয় বিশ্ববিদ্যালয় ও অ্যাকাডেমিক পার্টনার্স' : 'Academic & University Alliances',
                  icon: 'school-outline',
                  color: '#2563EB',
                  items: [
                    {
                      name: 'University of Dhaka (DU) / DUCSU',
                      role: isBangla ? 'জাতীয় স্কিলস সামিট কো-অর্গানাইজার' : 'National Skills Summit Co-Organizer',
                      scope: isBangla
                        ? 'ঢাকা বিশ্ববিদ্যালয়ের সিনেট ভবনে বাংলাদেশ স্কিলস সামিট আয়োজনের যৌথ অংশীদার। জাতীয় পুনর্গঠন ও কর্মদক্ষতা রূপান্তরে অগ্রণী।'
                        : 'Co-organizer of the Bangladesh Skills Summit at the Senate Bhaban, University of Dhaka, advancing national workforce reform.',
                      badge: 'DU Senate Bhaban Summit',
                    },
                    {
                      name: 'North South University (NSU)',
                      role: isBangla ? '৪আইআর সামিট ও প্লেসমেন্ট পার্টনার' : '4IR Skills Summit & Placement Partner',
                      scope: isBangla
                        ? 'নর্থ সাউথ ইউনিভার্সিটির ক্যারিয়ার অ্যান্ড প্লেসমেন্ট সেন্টারের (CPC) সাথে ফোর্থ ইন্ডাস্ট্রিয়াল রেভোলিউশন সামিট কো-অর্গানাইজার।'
                        : 'Organized the 4th Industrial Revolution (4IR) Skills Summit with NSU’s Career and Placement Center (CPC) to equip youth with modern AI capabilities.',
                      badge: 'NSU CPC Partner',
                    },
                    {
                      name: 'Eastern University (EU)',
                      role: isBangla ? 'দ্বিপাক্ষিক সমঝোতা স্মারক (MoU) স্বাক্ষরিত' : 'Official Bilateral MoU Signed',
                      scope: isBangla
                        ? 'শিক্ষা, গবেষণা ও প্রাতিষ্ঠানিক দক্ষতায় এআই (AI) অন্তর্ভুক্তির লক্ষ্যে আনুষ্ঠানিক চুক্তি (MoU) স্বাক্ষরিত। শিক্ষক ও কর্মকর্তাদের এআই প্রশিক্ষণ প্রদান।'
                        : 'Signed a formal Memorandum of Understanding (MoU) to integrate Artificial Intelligence into university teaching, student curricula, and administrative workflows.',
                      badge: 'Signed AI Integration MoU',
                    },
                    {
                      name: 'Ahsanullah University of Science & Tech (AUST)',
                      role: isBangla ? 'এমপ্লয়েবিলিটি সামিট কো-অর্গানাইজার' : 'Employability & Skills Summit Co-Organizer',
                      scope: isBangla
                        ? 'অস্ট স্কুল অব বিজনেস-এর যৌথ উদ্যোগে এমপ্লয়েবিলিটি অ্যান্ড স্কিলস সামিট, জব ফেয়ার এবং কর্পোরেট একাডেমি ডায়ালগ পরিচালনা।'
                        : 'Partnered with AUST School of Business to host the national Employability & Skills Summit, corporate job fairs, and industry masterclasses.',
                      badge: 'AUST School of Business',
                    },
                    {
                      name: 'Comilla University (CoU) & Manarat Int. University',
                      role: isBangla ? 'দক্ষতা উন্নয়ন কর্মশালা ও ফ্যাকাল্টি পার্টনার' : 'Skills Workshop & Faculty Partner',
                      scope: isBangla
                        ? 'শিক্ষার্থীদের ক্যারিয়ার প্রস্তুতি, সফটওয়্যার স্কিলস এবং ডেটা অ্যানালিটিক্স প্রশিক্ষণে সক্রিয় প্রাতিষ্ঠানিক অংশীদার।'
                        : 'Delivering tailored masterclasses in data literacy, business presentation, and enterprise digital tools for graduating student cohorts.',
                      badge: 'Regional Academic Alliances',
                    },
                  ],
                },
                {
                  category: isBangla ? 'সরকারি সংস্থা ও আন্তর্জাতিক ফ্রেমওয়ার্ক' : 'Government & Innovation Frameworks',
                  icon: 'globe-outline',
                  color: '#10B981',
                  items: [
                    {
                      name: 'Aspire to Innovate (a2i) — ICT & Cabinet Division',
                      role: isBangla ? 'স্মার্ট বাংলাদেশ ও ৪আইআর পার্টনার' : 'National 4IR & Smart Workforce Partner',
                      scope: isBangla
                        ? 'চতুর্থ শিল্প বিপ্লবের চ্যালেঞ্জ মোকাবিলা এবং জাতীয় তরুণদের ডিজিটাল কর্মসংস্থানে যৌথ উদ্যোগ ও কনফারেন্স কোলাবরেশন।'
                        : 'Strategic alignment with a2i (ICT Division & Cabinet Division, Bangladesh) for 4IR skills adoption and tech workforce readiness.',
                      badge: 'a2i / ICT Division',
                    },
                    {
                      name: 'United Nations SDG-4 (Quality Education)',
                      role: isBangla ? 'টেকসই উন্নয়ন লক্ষ্যমাত্রা ৪.৪ বাস্তবায়ন' : 'UN SDG Goal 4.4 Framework',
                      scope: isBangla
                        ? 'জীবনব্যাপী শিক্ষা নিশ্চিতকরণ এবং তরুণ প্রজন্মের কর্মসংস্থান ও উদ্যোক্তা দক্ষতায় অবদান রাখতে এসডিজি-৪ মানদণ্ড বাস্তবায়ন।'
                        : 'Dedicated to UN Sustainable Development Goal 4: Substantially increasing the percentage of skilled youth and adults ready for entrepreneurship and global careers.',
                      badge: 'UN SDG-4 Quality Education',
                    },
                  ],
                },
                {
                  category: isBangla ? 'পেশাদার ও জাতীয় শিল্প সমিতি' : 'Professional & Industry Associations',
                  icon: 'briefcase-outline',
                  color: '#8B5CF6',
                  items: [
                    {
                      name: 'ICMAB (Cost & Management Accountants)',
                      role: isBangla ? 'প্রফেশনাল ফিন্যান্স স্কিলিং পার্টনার' : 'Professional Finance Skilling Partner',
                      scope: isBangla
                        ? 'পেশাদার একাউন্ট্যান্টদের জন্য কৃত্রিম বুদ্ধিমত্তা (AI) ও প্রেডিক্টিভ বিজনেস অ্যানালিটিক্স কর্মশালা পরিচালনা।'
                        : 'Joint webinars and masterclasses equipping professional cost & management accountants with applied AI in corporate finance.',
                      badge: 'Chartered Professional Body',
                    },
                    {
                      name: 'BASIS (Software & Information Services)',
                      role: isBangla ? 'আইটি ইন্ডাস্ট্রি লিংকেজ ও সফটএক্সপো' : 'BASIS SoftExpo & Committee Partner',
                      scope: isBangla
                        ? 'জাতীয় সফটএক্সপোতে সক্রিয় অংশগ্রহণ, আইটি কমিটির প্রতিনিধিত্ব এবং সফটওয়্যার ইন্ডাস্ট্রির স্কিলস গ্যাপ দূরীকরণে কাজ।'
                        : 'Engaged with BASIS SoftExpo and standing committees to connect software talent with tech employer demands.',
                      badge: 'Apex IT Industry Body',
                    },
                  ],
                },
              ].map((group, groupIdx) => (
                <View key={groupIdx} style={styles.partnerGroupBlock}>
                  <View style={styles.partnerGroupHeader}>
                    <Ionicons name={group.icon as any} size={18} color={group.color} />
                    <Text style={[styles.partnerGroupTitle, { color: colors.text }]}>{group.category}</Text>
                  </View>

                  {group.items.map((item, itemIdx) => (
                    <View
                      key={itemIdx}
                      style={[
                        styles.partnerCard,
                        {
                          backgroundColor: colors.surfaceCard,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.partnerCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.partnerOrgName, { color: colors.text }]}>{item.name}</Text>
                          <Text style={[styles.partnerOrgRole, { color: colors.primary }]}>{item.role}</Text>
                        </View>
                        <View style={[styles.partnerBadgeTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
                          <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                          <Text style={[styles.partnerBadgeTagText, { color: colors.textMuted }]}>{item.badge}</Text>
                        </View>
                      </View>
                      <Text style={[styles.partnerOrgScope, { color: colors.textMuted }]}>{item.scope}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* TAB 4: NATIONAL SUMMITS */}
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

          {/* TAB 4: LEADERSHIP & FOUNDERS */}
          {activeTab === 'leadership' && (
            <View style={styles.sectionContainer}>
              <View style={[styles.verifiedHeaderBanner, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5', borderColor: '#10B981' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                <Text style={[styles.verifiedHeaderText, { color: isDark ? '#34D399' : '#065F46' }]}>
                  {isBangla
                    ? 'অফিসিয়াল পোর্টাল (thrivingskill.com) থেকে ভেরিফাইড পরিচালনা পর্ষদ ও ফাউন্ডার্স'
                    : 'Official Verified Leadership & Founders from thrivingskill.com'}
                </Text>
              </View>

              <Text style={[styles.subheading, { color: colors.textMuted }]}>
                {isBangla ? 'থ্রাইভিং স্কিলস লিমিটেডের প্রতিষ্ঠাতা ও পরিচালনা পর্ষদ:' : 'Executive Leadership & Board of Directors:'}
              </Text>

              {[
                {
                  name: 'Md. Abdullah Al Mahmud',
                  title: isBangla ? 'প্রতিষ্ঠাতা ও প্রধান নির্বাহী কর্মকর্তা (সিইও)' : 'Founder & Chief Executive Officer (CEO)',
                  badge: isBangla ? 'প্রতিষ্ঠাতা ও সিইও' : 'Founder & CEO',
                  isFounder: true,
                  desc: isBangla
                    ? 'থ্রাইভিং স্কিলসের মূল প্রতিষ্ঠাতা ও স্বপ্নদ্রষ্টা। বাংলাদেশের কর্মক্ষম তরুণদের চতুর্থ শিল্প বিপ্লব (4IR) ও এআই যুগের জন্য দক্ষ করতে নিবেদিতপ্রাণ এডটেক উদ্যোক্তা।'
                    : 'Visionary founder & CEO spearheading 21st-century human potential development, 4IR skills readiness, and bridging industry-academia gaps across Bangladesh.',
                  localAvatar: FOUNDER_IMAGES.abdullah_al_mahmud,
                  webAvatar: 'https://thrivingskill.com/wp-content/uploads/2015/11/About-us.jpeg',
                  profileUrl: 'https://thrivingskill.com/our_team/abdullah_al_mahmud/',
                  linkedin: 'https://www.linkedin.com/in/md-abdullah-al-mahmud/',
                },
                {
                  name: 'Syed Nuruddin Ahmed',
                  title: isBangla ? 'প্রতিষ্ঠাতা ও চেয়ারম্যান' : 'Founder & Chairman',
                  badge: isBangla ? 'প্রতিষ্ঠাতা ও চেয়ারম্যান' : 'Founder & Chairman',
                  isFounder: true,
                  desc: isBangla
                    ? 'কর্পোরেট সুশাসন, প্রাতিষ্ঠানিক কৌশল ও জাতীয় মানবসম্পদ উন্নয়নে নিবেদিতপ্রাণ দূরদর্শী উদ্যোক্তা ও প্রতিষ্ঠাতা চেয়ারম্যান।'
                    : 'Senior corporate governance leader, institutional strategist, and founder advocating for sustainable lifelong learning ecosystems and workforce empowerment.',
                  localAvatar: FOUNDER_IMAGES.syed_nuruddin_ahmed,
                  webAvatar: 'https://thrivingskill.com/wp-content/uploads/2015/11/WhatsApp-Image-2020-10-28-at-2.09.53-PM.jpeg',
                  profileUrl: 'https://thrivingskill.com/our_team/syed_nuruddin_ahmed/',
                  linkedin: undefined,
                },
                {
                  name: 'Yusuf Iqbal',
                  title: isBangla ? 'কর্পোরেট একাউন্ট্যান্ট ও অপারেশনস' : 'Corporate Accountant & Operations',
                  badge: 'Finance & Operations',
                  isFounder: false,
                  desc: isBangla
                    ? 'প্রাতিষ্ঠানিক আর্থিক পরিকল্পনা, প্রাতিষ্ঠানিক অডিট, বাণিজ্য সংগঠন ও জাতীয় বিশ্ববিদ্যালয় পার্টনারশিপ সমন্বয়কারী।'
                    : 'Leading institutional fiscal planning, university alliances, chambers of commerce partnerships, and operational financial compliance.',
                  localAvatar: FOUNDER_IMAGES.yusuf_iqbal,
                  webAvatar: 'https://thrivingskill.com/wp-content/uploads/2023/06/Yusuf-Iqbal.jpeg',
                  profileUrl: 'https://thrivingskill.com/our_team/yusuf-iqbal/',
                  linkedin: undefined,
                },
                {
                  name: 'Md. Tareq Siddiqui',
                  title: isBangla ? 'সিনিয়র এক্সিকিউটিভ, প্রোডাকশন' : 'Senior Executive, Production & Content Strategy',
                  badge: 'Production & Media',
                  isFounder: false,
                  desc: isBangla
                    ? 'ডিজিটাল লার্নিং কন্টেন্ট প্রোডাকশন, স্টুডিও ফ্যাসিলিটেশন এবং ন্যাশনাল স্কিলস সামিটের স্ট্র্যাটেজিক যোগাযোগ সমন্বয়ক।'
                    : 'Driving multimedia instructional production, national skills summits communications, and enterprise video learning experiences.',
                  localAvatar: FOUNDER_IMAGES.tareq_siddiqui,
                  webAvatar: 'https://thrivingskill.com/wp-content/uploads/2023/06/file.jpeg',
                  profileUrl: 'https://thrivingskill.com/our_team/md-tareq-siddiqui-2/',
                  linkedin: undefined,
                },
                {
                  name: 'Md: Abdulla Al Noman',
                  title: isBangla ? 'ওয়েব ডেভেলপার ও প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেটর' : 'Web Developer & Platform Administrator',
                  badge: 'Platform Engineering',
                  isFounder: false,
                  desc: isBangla
                    ? 'থ্রাইভিং স্কিলসের মূল এলএমএস আর্কিটেকচার, ওয়েব পোর্টাল সিকিউরিটি এবং এন্টারপ্রাইজ ডিজিটাল লার্নিং ক্লাউড পরিচালনা।'
                    : 'Architecting core LMS infrastructure, enterprise learner portals, web performance optimization, and cybersecurity.',
                  localAvatar: FOUNDER_IMAGES.abdulla_al_noman,
                  webAvatar: 'https://thrivingskill.com/wp-content/uploads/2023/06/nOMAN.jpeg',
                  profileUrl: 'https://thrivingskill.com/our_team/md-abdulla-al-noman/',
                  linkedin: 'http://linkedin.com/in/abdulla-al-noman-3076b4182/',
                },
              ].map((leader, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.leaderCard,
                    {
                      backgroundColor: colors.surfaceCard,
                      borderColor: leader.isFounder ? (isDark ? '#F59E0B66' : '#FDE68A') : colors.border,
                      borderWidth: leader.isFounder ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.leaderAvatarContainer}>
                    <Image
                      source={leader.localAvatar || { uri: leader.webAvatar }}
                      style={styles.leaderAvatar}
                      resizeMode="cover"
                    />
                    {leader.isFounder ? (
                      <View style={styles.founderStarBadge}>
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
                                ? (isDark ? '#78350F' : '#FEF3C7')
                                : (isDark ? '#064E3B' : '#E0F2FE'),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.leaderBadgePillText,
                              {
                                color: leader.isFounder ? (isDark ? '#FCD34D' : '#92400E') : (isDark ? '#6EE7B7' : '#0369A1'),
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

                    {/* Official Verification Links */}
                    <View style={styles.leaderActionsRow}>
                      {leader.profileUrl && (
                        <TouchableOpacity
                          style={[styles.leaderMiniBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}
                          onPress={() => handleOpenUrl(leader.profileUrl)}
                          activeOpacity={0.7}
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
                          style={[styles.leaderMiniBtn, { backgroundColor: isDark ? 'rgba(10, 102, 194, 0.15)' : '#EFF6FF' }]}
                          onPress={() => handleOpenUrl(leader.linkedin)}
                          activeOpacity={0.7}
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

              {/* LEGAL & COPYRIGHT POLICIES */}
              <View style={[styles.legalAccessCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
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
                    onPress={() => {
                      setLegalInitialTab('terms');
                      setLegalModalVisible(true);
                    }}
                  >
                    <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                    <Text style={[styles.legalBtnText, { color: colors.primary }]}>
                      {isBangla ? 'শর্তাবলী' : 'Terms of Use'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.legalBtn, { borderColor: colors.secondary }]}
                    onPress={() => {
                      setLegalInitialTab('privacy');
                      setLegalModalVisible(true);
                    }}
                  >
                    <Ionicons name="lock-closed-outline" size={14} color={colors.secondary} />
                    <Text style={[styles.legalBtnText, { color: colors.secondary }]}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ALL RIGHTS RESERVED FOOTER NOTICE */}
              <View style={styles.copyrightBlock}>
                <Ionicons name="ribbon" size={16} color="#F59E0B" />
                <Text style={[styles.copyrightNoticeText, { color: colors.textMuted }]}>
                  © 2026 Thriving Skills Limited. All Rights Reserved.{'\n'}
                  Registered under Companies Act of Bangladesh • Gulshan-2, Dhaka
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialTab={legalInitialTab}
      />
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
  verifiedHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 6,
  },
  verifiedHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  leaderCard: {
    flexDirection: 'row',
    padding: 13,
    borderRadius: 14,
    alignItems: 'flex-start',
    gap: 2,
  },
  leaderAvatarContainer: {
    position: 'relative',
    marginTop: 2,
  },
  leaderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
  },
  founderStarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  verifiedCheckDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  leaderHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  leaderName: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  leaderBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  leaderBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  leaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  leaderDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  leaderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  leaderMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  leaderMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
  partnerGroupBlock: {
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  partnerGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 2,
  },
  partnerGroupTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  partnerCard: {
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  partnerCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  partnerOrgName: {
    fontSize: 14,
    fontWeight: '800',
  },
  partnerOrgRole: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  partnerBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  partnerBadgeTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  partnerOrgScope: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  legalAccessCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 14,
  },
  legalAccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalAccessTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  legalAccessDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  legalActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  legalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  legalBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  copyrightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
    marginTop: 6,
  },
  copyrightNoticeText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
