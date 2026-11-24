import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SpringPressable } from '../common/SpringPressable';
import { typography } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { triggerHaptic } from '../../utils/haptics';
import { getSafeImageSource } from '../../utils/imageUtils';

export type AcademicLevel = 'all' | 'ssc' | 'hsc' | 'honours' | 'masters';

export interface ThriveGenCourseItem {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  level: 'ssc' | 'hsc' | 'honours' | 'masters';
  levelLabel: string;
  levelLabelBn: string;
  subtitle: string;
  subtitleBn: string;
  rating: number;
  studentsCount: number;
  badge: string;
  imageUrl: string;
  isFree?: boolean;
}

export const THRIVE_GEN_COURSES: ThriveGenCourseItem[] = [
  // SSC
  {
    id: 'tg-ssc-eng',
    slug: 'communicative-english',
    title: 'Communicative English Language for All',
    titleBn: 'সবার জন্য সহজ কমিউনিকেটিভ ইংলিশ',
    level: 'ssc',
    levelLabel: 'SSC Students',
    levelLabelBn: 'এসএসসি শিক্ষার্থী',
    subtitle: 'Master speaking confidence, grammar foundations & daily fluency.',
    subtitleBn: 'কথা বলার আত্মবিশ্বাস, বেসিক গ্রামার ও প্র্যাকটিক্যাল স্পিকিং।',
    rating: 4.9,
    studentsCount: 1420,
    badge: 'FOUNDATION',
    imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
    isFree: true,
  },
  {
    id: 'tg-ssc-mindset',
    slug: 'creating-winning-mindset-2',
    title: 'Creating a Winning Mindset',
    titleBn: 'উইনিং মাইন্ডসেট ও লক্ষ্য নির্ধারণ',
    level: 'ssc',
    levelLabel: 'SSC Students',
    levelLabelBn: 'এসএসসি শিক্ষার্থী',
    subtitle: 'Overcome exam anxiety, build focus habits & unlock potential.',
    subtitleBn: 'পরীক্ষার ভয় দূর করা, মনোযোগ বৃদ্ধির অভ্যাস ও আত্মবিশ্বাস।',
    rating: 4.8,
    studentsCount: 980,
    badge: 'MINDSET',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
  },
  // HSC
  {
    id: 'tg-hsc-ai',
    slug: 'generative-ai-productivity',
    title: 'Generative AI & Study Productivity',
    titleBn: 'জেনারেটিভ এআই ও স্টাডি প্রোডাক্টিভিটি',
    level: 'hsc',
    levelLabel: 'HSC Students',
    levelLabelBn: 'এইচএসসি শিক্ষার্থী',
    subtitle: 'Leverage AI study companions to summarize notes and solve questions.',
    subtitleBn: 'এআই টুলসের সাহায্যে দ্রুত নোট তৈরি ও কনসেপ্ট বোঝা।',
    rating: 4.9,
    studentsCount: 2150,
    badge: 'HOT & NEW',
    imageUrl: 'https://thrivingskill.com/wp-content/uploads/2026/05/AI-Bundle-Promotional-Poster.jpg',
  },
  {
    id: 'tg-hsc-habits',
    slug: 'winning-habits',
    title: 'Winning Habits: Secret of Success',
    titleBn: 'সাফল্যের জন্য উইনিং হ্যাবিটস',
    level: 'hsc',
    levelLabel: 'HSC Students',
    levelLabelBn: 'এইচএসসি শিক্ষার্থী',
    subtitle: 'Time management, digital distraction control & morning routines.',
    subtitleBn: 'টাইম ম্যানেজমেন্ট, সোশ্যাল মিডিয়া ডিস্ট্র্যাকশন নিয়ন্ত্রণ।',
    rating: 4.8,
    studentsCount: 890,
    badge: 'HABITS',
    imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=80',
  },
  // Honours
  {
    id: 'tg-hon-notebooklm',
    slug: 'mastering-notebooklm',
    title: 'Mastering NotebookLM for Academic Research',
    titleBn: 'অ্যাকাডেমিক রিসার্চে NotebookLM মাস্টারক্লাস',
    level: 'honours',
    levelLabel: 'Honours / Undergrad',
    levelLabelBn: 'অনার্স শিক্ষার্থী',
    subtitle: 'Generate audio podcasts, synthesize term papers & cite sources.',
    subtitleBn: 'টার্ম পেপার সিন্থেসিস ও সোর্স সাইটেশন সহজ করুন।',
    rating: 5.0,
    studentsCount: 1670,
    badge: 'GOOGLE AI',
    imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tg-hon-linkedin',
    slug: 'linkedin-networking-career-growth',
    title: 'Level Up with LinkedIn: Grow Your Network',
    titleBn: 'লিঙ্কডইন নেটওয়ার্কিং ও ক্যারিয়ার গ্রোথ',
    level: 'honours',
    levelLabel: 'Honours / Undergrad',
    levelLabelBn: 'অনার্স শিক্ষার্থী',
    subtitle: 'Optimize student profiles, connect with recruiters & land internships.',
    subtitleBn: 'প্রফেশনাল প্রোফাইল তৈরি ও রিক্রুটারদের সাথে নেটওয়ার্কিং।',
    rating: 4.9,
    studentsCount: 3100,
    badge: 'CAREER ACCELERATOR',
    imageUrl: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tg-hon-presentation',
    slug: 'presentation-mastery-using-ai',
    title: 'Presentation Mastery Using AI',
    titleBn: 'এআই দিয়ে প্রফেশনাল প্রেজেন্টেশন ডিজাইন',
    level: 'honours',
    levelLabel: 'Honours / Undergrad',
    levelLabelBn: 'অনার্স শিক্ষার্থী',
    subtitle: 'Create executive PowerPoint decks with Gamma, Copilot & storytelling.',
    subtitleBn: 'বোর্ডরুম স্ট্যান্ডার্ড স্লাইড ডিজাইন ও প্রেজেন্টেশন স্কিল।',
    rating: 4.9,
    studentsCount: 1840,
    badge: 'PRESENTATION',
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80',
  },
  // Masters
  {
    id: 'tg-mas-chatgpt',
    slug: 'chatgpt-in-research',
    title: 'Using ChatGPT in Academic & Corporate Research',
    titleBn: 'থিসিস ও করপোরেট গবেষণায় চ্যাটজিপিটি',
    level: 'masters',
    levelLabel: 'Masters & Job Seekers',
    levelLabelBn: 'মাস্টার্স ও গ্র্যাজুয়েট',
    subtitle: 'Literature review automation, thesis structuring & ethical prompting.',
    subtitleBn: 'লিটারেচার রিভিউ অটোমেশন, থিসিস স্ট্রাকচারিং ও এথিক্যাল এআই।',
    rating: 5.0,
    studentsCount: 2280,
    badge: 'RESEARCH',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tg-mas-interview',
    slug: 'win-an-interview-skills-to-succeed',
    title: 'How to Win an Interview: Skills to Succeed',
    titleBn: 'ইন্টারভিউ জয়ের পূর্ণাঙ্গ রোডম্যাপ',
    level: 'masters',
    levelLabel: 'Masters & Job Seekers',
    levelLabelBn: 'মাস্টার্স ও গ্র্যাজুয়েট',
    subtitle: 'Behavioral STAR answers, corporate salary negotiation & mock drills.',
    subtitleBn: 'STAR টেকনিক উত্তর, স্যালারি নেগোসিয়েশন ও মক ইন্টারভিউ।',
    rating: 4.9,
    studentsCount: 2650,
    badge: 'JOB READY',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
  },
];

interface ThriveGenHubProps {
  onSelectCourse: (course: ThriveGenCourseItem) => void;
  onExploreAllThriveGen?: () => void;
}

const CARD_WIDTH = 260;
const CARD_GAP = 14;

export const ThriveGenHub: React.FC<ThriveGenHubProps> = ({
  onSelectCourse,
  onExploreAllThriveGen,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const [activeLevel, setActiveLevel] = useState<AcademicLevel>('all');

  const filteredCourses = useMemo(() => {
    if (activeLevel === 'all') return THRIVE_GEN_COURSES;
    return THRIVE_GEN_COURSES.filter((c) => c.level === activeLevel);
  }, [activeLevel]);

  const levelTabs: { id: AcademicLevel; label: string; labelBn: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'all', label: 'All Levels', labelBn: 'সকল লেভেল', icon: 'apps' },
    { id: 'ssc', label: 'SSC', labelBn: 'এসএসসি', icon: 'school' },
    { id: 'hsc', label: 'HSC', labelBn: 'এইচএসসি', icon: 'book' },
    { id: 'honours', label: 'Honours', labelBn: 'অনার্স', icon: 'ribbon' },
    { id: 'masters', label: 'Masters', labelBn: 'মাস্টার্স', icon: 'briefcase' },
  ];

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={[styles.brandPill, { backgroundColor: '#FFB606' }]}>
            <Ionicons name="sparkles" size={11} color="#102F53" />
            <Text style={styles.brandPillText}>THRIVE GEN</Text>
          </View>
          <View style={[styles.studentsTag, { backgroundColor: isDark ? 'rgba(16, 47, 83, 0.4)' : '#E8EEF5' }]}>
            <Text style={[styles.studentsTagText, { color: colors.textMuted }]}>
              {isBangla ? '১০,০০০+ শিক্ষার্থীর ভরসা' : 'Trusted by 10,000+ Students'}
            </Text>
          </View>
        </View>

        <Text style={[typography.h3, styles.title, { color: colors.text }]}>
          {isBangla
            ? 'থ্রাইভ জেন: ভবিষ্যৎ কর্মক্ষেত্রের জন্য প্রস্তুতি'
            : 'Thrive Gen: Future-Ready Student Pathways'}
        </Text>

        <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
          {isBangla
            ? 'এসএসসি থেকে মাস্টার্স — সফট ও হার্ড স্কিলে এগিয়ে থাকার পূর্ণাঙ্গ একাডেমিক কারিকুলাম'
            : 'Industry-aligned skill tracks for SSC, HSC, Honours & Masters cohorts'}
        </Text>
      </View>

      {/* 4 Pillars Mini-Capsules */}
      <View style={styles.pillarsGrid}>
        <View style={[styles.pillarItem, { backgroundColor: isDark ? colors.surfaceCard : '#F8FAFC', borderColor: colors.border }]}>
          <Text style={styles.pillarIcon}>👤</Text>
          <Text style={[styles.pillarText, { color: colors.text }]}>
            {isBangla ? 'শীর্ষ ফ্যাকাল্টি' : 'Industry Faculty'}
          </Text>
        </View>
        <View style={[styles.pillarItem, { backgroundColor: isDark ? colors.surfaceCard : '#F8FAFC', borderColor: colors.border }]}>
          <Text style={styles.pillarIcon}>📝</Text>
          <Text style={[styles.pillarText, { color: colors.text }]}>
            {isBangla ? 'রিয়েল প্রজেক্ট' : 'Hands-on Labs'}
          </Text>
        </View>
        <View style={[styles.pillarItem, { backgroundColor: isDark ? colors.surfaceCard : '#F8FAFC', borderColor: colors.border }]}>
          <Text style={styles.pillarIcon}>📜</Text>
          <Text style={[styles.pillarText, { color: colors.text }]}>
            {isBangla ? 'সার্টিফিকেট' : 'Certificates'}
          </Text>
        </View>
        <View style={[styles.pillarItem, { backgroundColor: isDark ? colors.surfaceCard : '#F8FAFC', borderColor: colors.border }]}>
          <Text style={styles.pillarIcon}>⏱️</Text>
          <Text style={[styles.pillarText, { color: colors.text }]}>
            {isBangla ? 'নিজের সুবিধামতো' : 'Self-Paced'}
          </Text>
        </View>
      </View>

      {/* Level Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.levelTabsScroll}
      >
        {levelTabs.map((tab) => {
          const isActive = activeLevel === tab.id;
          return (
            <SpringPressable
              key={tab.id}
              style={[
                styles.levelTab,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : isDark
                    ? colors.surfaceCard
                    : '#FFFFFF',
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                triggerHaptic('selection');
                setActiveLevel(tab.id);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={isBangla ? tab.labelBn : tab.label}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={isActive ? '#FFFFFF' : colors.textMuted}
              />
              <Text
                style={[
                  styles.levelTabText,
                  { color: isActive ? '#FFFFFF' : colors.text },
                ]}
              >
                {isBangla ? tab.labelBn : tab.label}
              </Text>
            </SpringPressable>
          );
        })}
      </ScrollView>

      {/* Courses Horizontal Snap Carousel */}
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        renderItem={({ item }) => {
          const title = isBangla ? item.titleBn : item.title;
          const subtitle = isBangla ? item.subtitleBn : item.subtitle;
          const levelLabel = isBangla ? item.levelLabelBn : item.levelLabel;

          return (
            <SpringPressable
              style={[
                styles.courseCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
              activeScale={0.96}
              haptic="selection"
              onPress={() => {
                triggerHaptic('light');
                onSelectCourse(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${title}, Level: ${levelLabel}`}
            >
              {/* Thumbnail Container */}
              <View style={styles.thumbnailContainer}>
                <Image
                  source={getSafeImageSource(item.imageUrl)}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                  {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
                />
                <View style={[styles.cardBadge, { backgroundColor: '#102F53' }]}>
                  <Text style={styles.cardBadgeText}>{item.badge}</Text>
                </View>
                {item.isFree && (
                  <View style={[styles.freeTag, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.freeTagText}>{isBangla ? 'ফ্রি অ্যাক্সেস' : 'FREE'}</Text>
                  </View>
                )}
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <View style={styles.levelRow}>
                  <Text style={[styles.levelText, { color: colors.primary }]}>
                    {levelLabel}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={11} color="#FFB606" />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                </View>

                <Text
                  style={[typography.h5, styles.courseTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {title}
                </Text>

                <Text
                  style={[typography.bodySmall, styles.courseSubtitle, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={[styles.learnersCount, { color: colors.textMuted }]}>
                    {item.studentsCount.toLocaleString()}+ {isBangla ? 'লার্নার্স' : 'Learners'}
                  </Text>

                  <View style={[styles.exploreBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.exploreBtnText}>
                      {isBangla ? 'শুরু করুন' : 'Explore'}
                    </Text>
                    <Ionicons name="arrow-forward" size={11} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </SpringPressable>
          );
        }}
      />

      {/* Footer Explore All CTA */}
      {onExploreAllThriveGen && (
        <View style={styles.footerWrap}>
          <SpringPressable
            style={[
              styles.exploreAllBanner,
              {
                backgroundColor: isDark ? 'rgba(16, 47, 83, 0.4)' : '#E8EEF5',
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              triggerHaptic('light');
              onExploreAllThriveGen();
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'সব থ্রাইভ জেন কোর্স দেখুন' : 'Explore all Thrive Gen courses'}
          >
            <View style={styles.exploreAllTextCol}>
              <Text style={[styles.exploreAllTitle, { color: colors.text }]}>
                {isBangla
                  ? 'ক্যাম্পাস ও ক্যারিয়ার ট্রেইনিং সম্পর্কে আরও জানুন'
                  : 'Empower Your Campus With Certified Masterclasses'}
              </Text>
              <Text style={[styles.exploreAllSub, { color: colors.textMuted }]}>
                {isBangla
                  ? 'বিশ্ববিদ্যালয় ক্লাব ও শিক্ষার্থীদের জন্য বিশেষ অ্যাক্রিডিটেশন'
                  : 'Official MoU partner for 30+ university clubs & placement cells'}
              </Text>
            </View>
            <View style={[styles.exploreAllIconWrap, { backgroundColor: colors.primary }]}>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </View>
          </SpringPressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: shape.full,
  },
  brandPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#102F53',
    letterSpacing: 0.6,
  },
  studentsTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: shape.full,
  },
  studentsTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    marginTop: 2,
  },
  pillarsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 8,
  },
  pillarItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: shape.small,
    borderWidth: 1,
  },
  pillarIcon: {
    fontSize: 11,
  },
  pillarText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  levelTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 8,
  },
  levelTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: shape.full,
    borderWidth: 1,
  },
  levelTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
    paddingVertical: 4,
  },
  courseCard: {
    width: CARD_WIDTH,
    borderRadius: shape.large,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#102F53',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 8px rgba(16, 47, 83, 0.08)',
      },
    }),
  },
  thumbnailContainer: {
    width: '100%',
    height: 128,
    backgroundColor: '#0A1C33',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: shape.full,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  freeTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: shape.full,
  },
  freeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFB606',
  },
  courseTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  courseSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    minHeight: 30,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  learnersCount: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: shape.full,
  },
  exploreBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerWrap: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  exploreAllBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: shape.medium,
    borderWidth: 1,
  },
  exploreAllTextCol: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  exploreAllTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  exploreAllSub: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  exploreAllIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
