import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { aboutTslStyles as styles } from './aboutTSL.styles';

interface TabThemeProps {
  colors: any;
  isDark: boolean;
  isBangla: boolean;
}

export const AboutOverviewTab: React.FC<TabThemeProps> = ({ colors, isDark, isBangla }) => (
  <View style={styles.sectionContainer}>
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: isDark ? colors.surfaceCard : '#F0FDF4',
          borderColor: '#BBF7D0',
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Ionicons name="shield-checkmark" size={18} color="#10B981" />
        <Text style={[styles.heroBadge, { color: '#059669' }]}>OFFICIAL CORPORATE ECOSYSTEM</Text>
      </View>
      <Text style={[styles.heroTitle, { color: colors.text }]}>
        {isBangla
          ? 'প্রযুক্তি ও মানব প্রতিভার সমন্বয়ে দক্ষতা-ভিত্তিক ভবিষ্যৎ অর্থনীতি'
          : 'Skills-Focused Economy With Tech-Enabled Human Potential'}
      </Text>
      <Text style={[styles.heroDesc, { color: colors.textMuted }]}>
        {isBangla
          ? 'থ্রাইভিং স্কিলস লিমিটেড (TSL) একটি শীর্ষস্থানীয় স্কিলস অ্যান্ড ক্যাপাসিটি ডেভেলপমেন্ট প্ল্যাটফর্ম। ঢাকা বিশ্ববিদ্যালয় ডাকসু ও নর্থ সাউথ বিশ্ববিদ্যালয় এর সাথে যৌথভাবে জাতীয় দক্ষতা সামিট আয়োজনের পাশাপাশি দেশের লাখো পেশাজীবী ও শিক্ষার্থীকে ভবিষ্যতের জন্য প্রস্তুত করছে।'
          : 'Thriving Skills Limited (TSL) is a premier workforce upskilling and corporate learning ecosystem in Bangladesh. Through industry masterclasses, national summits, and strategic advisory, TSL equips executives and fresh graduates for modern professional careers.'}
      </Text>
    </View>

    <View style={styles.metricsGrid}>
      <View
        style={[
          styles.metricCard,
          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.metricNumber, { color: colors.primary }]}>300+</Text>
        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
          {isBangla ? 'অন-ডিমান্ড কোর্স' : 'Executive Courses'}
        </Text>
      </View>
      <View
        style={[
          styles.metricCard,
          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.metricNumber, { color: '#10B981' }]}>50,000+</Text>
        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
          {isBangla ? 'পেশাজীবী লার্নার' : 'Empowered Learners'}
        </Text>
      </View>
      <View
        style={[
          styles.metricCard,
          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.metricNumber, { color: '#E34234' }]}>5+</Text>
        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
          {isBangla ? 'জাতীয় সামিট' : 'National Summits'}
        </Text>
      </View>
      <View
        style={[
          styles.metricCard,
          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.metricNumber, { color: '#8B5CF6' }]}>150+</Text>
        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
          {isBangla ? 'কর্পোরেট পার্টনার' : 'Enterprise Partners'}
        </Text>
      </View>
    </View>

    <View
      style={[
        styles.infoBlock,
        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Ionicons name="globe-outline" size={18} color="#0284C7" />
        <Text style={[styles.infoBlockTitle, { color: colors.text }]}>
          SDG-4 Quality Education & Decent Work
        </Text>
      </View>
      <Text style={[styles.infoBlockDesc, { color: colors.textMuted }]}>
        Aligned with United Nations Sustainable Development Goals (SDG-4 & SDG-8), TSL delivers
        inclusive, high-impact digital learning accessible anywhere across Bangladesh and South
        Asia.
      </Text>
    </View>
  </View>
);

export const AboutPillarsTab: React.FC<TabThemeProps> = ({ colors, isDark, isBangla }) => {
  const pillars = [
    {
      icon: 'laptop-outline',
      iconColor: isDark ? '#818CF8' : '#4F46E5',
      iconBg: isDark ? 'rgba(79, 70, 229, 0.18)' : '#EEF2FF',
      title: '1. Digital Learning Solutions (LMS)',
      subtitle: isBangla ? 'কর্পোরেট এলএমএস ও ডিজিটাল লার্নিং' : 'Enterprise LMS & SCORM Training',
      subtitleColor: colors.primary,
      desc: 'Custom LMS deployments, employee competency analytics, progress tracking dashboards, and interactive SCORM e-learning module authoring.',
    },
    {
      icon: 'school-outline',
      iconColor: isDark ? '#34D399' : '#059669',
      iconBg: isDark ? 'rgba(5, 150, 105, 0.18)' : '#ECFDF5',
      title: '2. Professional Training & Cohorts',
      subtitle: isBangla ? '৩০০+ কোর্স ও সাপ্তাহিক লাইভ সেশন' : '300+ Courses & Weekly Live Classes',
      subtitleColor: '#059669',
      desc: 'Self-paced on-demand masterclasses and live executive bootcamps spanning Generative & Agentic AI, MS Excel & BI, Leadership, Financial Modeling, and HR Operations.',
    },
    {
      icon: 'briefcase-outline',
      iconColor: '#9333EA',
      iconBg: isDark ? 'rgba(147, 51, 234, 0.16)' : '#FAF5FF',
      title: '3. Strategic Advisory & Consultancy',
      subtitle: isBangla ? 'বিজনেস কনসালটেন্সি ও এসএমই রূপান্তর' : 'Corporate & SME Transformation',
      subtitleColor: '#9333EA',
      desc: 'Strategic advisory services for SME scaling, ICT readiness, organizational culture, digital transformation roadmaps, and corporate governance.',
    },
    {
      icon: 'globe-outline',
      iconColor: '#E34234',
      iconBg: isDark ? 'rgba(227, 66, 52, 0.16)' : '#FEE2E2',
      title: '4. Ecosystem & Community Initiatives',
      subtitle: isBangla
        ? 'জাতীয় সামিট ও বিশ্ববিদ্যালয় পার্টনারশিপ'
        : 'National Summits & University Alliances',
      subtitleColor: '#E34234',
      desc: 'Flagship national summits bringing together government, universities, and industry leaders to bridge the skill gap between academia and modern enterprise.',
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      <Text style={[styles.subheading, { color: colors.textMuted }]}>
        {isBangla ? 'আমাদের ৪টি প্রধান প্রাতিষ্ঠানিক সেবা স্তম্ভ:' : 'Our 4 Core Corporate Pillars:'}
      </Text>
      {pillars.map((pillar) => (
        <View
          key={pillar.title}
          style={[
            styles.pillarCard,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          <View style={[styles.pillarIconBg, { backgroundColor: pillar.iconBg }]}>
            <Ionicons name={pillar.icon as any} size={22} color={pillar.iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pillarTitle, { color: colors.text }]}>{pillar.title}</Text>
            <Text style={[styles.pillarSubtitle, { color: pillar.subtitleColor }]}>
              {pillar.subtitle}
            </Text>
            <Text style={[styles.pillarDesc, { color: colors.textMuted }]}>{pillar.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};
