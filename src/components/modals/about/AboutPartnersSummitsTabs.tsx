import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getPartnerGroups, getNationalSummits } from './aboutTSL.data';
import { aboutTslStyles as styles } from './aboutTSL.styles';

interface TabThemeProps {
  colors: any;
  isDark: boolean;
  isBangla: boolean;
}

export const AboutPartnersTab: React.FC<TabThemeProps> = ({ colors, isDark, isBangla }) => (
  <View style={styles.sectionContainer}>
    <View
      style={[
        styles.verifiedHeaderBanner,
        {
          backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF',
          borderColor: '#2563EB44',
        },
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
      {isBangla
        ? 'থ্রাইভিং স্কিলসের প্রাতিষ্ঠানিক ও জাতীয় সহযোগীসমূহ:'
        : 'TSL Institutional & Strategic Alliances:'}
    </Text>

    {getPartnerGroups(isBangla).map((group, groupIdx) => (
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
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.partnerCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.partnerOrgName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.partnerOrgRole, { color: colors.primary }]}>{item.role}</Text>
              </View>
              <View
                style={[
                  styles.partnerBadgeTag,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
                ]}
              >
                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                <Text style={[styles.partnerBadgeTagText, { color: colors.textMuted }]}>
                  {item.badge}
                </Text>
              </View>
            </View>
            <Text style={[styles.partnerOrgScope, { color: colors.textMuted }]}>{item.scope}</Text>
          </View>
        ))}
      </View>
    ))}
  </View>
);

export const AboutSummitsTab: React.FC<TabThemeProps> = ({ colors, isDark, isBangla }) => (
  <View style={styles.sectionContainer}>
    <Text style={[styles.subheading, { color: colors.textMuted }]}>
      {isBangla
        ? 'থ্রাইভিং স্কিলসের অফিসিয়াল জাতীয় সামিটসমূহ:'
        : 'Official TSL National Summits & Forums:'}
    </Text>

    {getNationalSummits().map((summit, idx) => (
      <View
        key={idx}
        style={[
          styles.summitCard,
          { backgroundColor: colors.surfaceCard, borderColor: colors.border },
        ]}
      >
        <View style={styles.summitHeaderRow}>
          <View
            style={[
              styles.summitIconBg,
              { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' },
            ]}
          >
            <Ionicons name={summit.icon as any} size={20} color={summit.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.summitTitle, { color: colors.text }]}>{summit.title}</Text>
            <View
              style={[
                styles.summitBadge,
                { backgroundColor: isDark ? colors.surfaceSubtle : '#EEF2FF' },
              ]}
            >
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
);
