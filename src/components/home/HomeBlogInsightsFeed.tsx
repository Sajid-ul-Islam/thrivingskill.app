import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SpringPressable } from '../common/SpringPressable';
import { typography } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { triggerHaptic } from '../../utils/haptics';
import { getSafeImageSource } from '../../utils/imageUtils';
import { cleanHtml } from '../../services/api/transformers';
import type { WpPost } from '../../types';

interface HomeBlogInsightsFeedProps {
  posts: WpPost[];
  onSelectPost: (post: WpPost) => void;
  onViewAllPosts: () => void;
}

const FALLBACK_INSIGHTS: WpPost[] = [
  {
    id: 88000,
    title: 'Staying Relevant in the AI Era: The Real Advantage Is Not AI, but What You Do With It',
    excerpt:
      'Practical AI frameworks, prompt engineering, and human-in-the-loop workflows that give professionals competitive advantage.',
    content: 'Full article on AI workflows and human adaptability in 2026...',
    date: '2026-11-15T00:00:00',
    link: 'https://thrivingskill.com/thriving-insights/',
    authorName: 'Syed Nuruddin Ahmed',
    featuredImageUrl: 'https://thrivingskill.com/wp-content/uploads/2026/10/sty-ai-era.png',
    categories: ['4IR & AI'],
  },
  {
    id: 82139,
    title: 'Elevate Your Career: The 10 Essential Skills Every Job Seeker Needs to Succeed',
    excerpt:
      'From digital presentation to emotional intelligence and dynamic spreadsheets, the must-have skills for modern enterprise employment.',
    content: 'The 10 essential employability pillars...',
    date: '2026-10-20T00:00:00',
    link: 'https://thrivingskill.com/blog/',
    authorName: 'Tareq Siddiqui',
    featuredImageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    categories: ['Career Growth'],
  },
  {
    id: 68428,
    title: 'Mastering Contract Management: The Keystone of Procurement Excellence',
    excerpt:
      'Navigating supplier risk, SLAs, dispute resolution, and international trade compliance in Bangladesh manufacturing.',
    content: 'Comprehensive guide to contract management...',
    date: '2026-09-10T00:00:00',
    link: 'https://thrivingskill.com/blog/',
    authorName: 'Khandker Moniruzzaman',
    featuredImageUrl:
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    categories: ['Supply Chain'],
  },
  {
    id: 61641,
    title: 'How to Submit Your Income Tax eReturn in Bangladesh (Step-by-Step)',
    excerpt:
      'A complete practical walkthrough of the NBR eReturn portal, tax rebate calculations, and investment allowances.',
    content: 'Step by step eReturn guide...',
    date: '2026-08-25T00:00:00',
    link: 'https://thrivingskill.com/blog/',
    authorName: 'Finance Faculty, TSL',
    featuredImageUrl:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    categories: ['Tax & Accounting'],
  },
];

const CARD_WIDTH = 270;
const CARD_GAP = 14;

export const HomeBlogInsightsFeed: React.FC<HomeBlogInsightsFeedProps> = ({
  posts,
  onSelectPost,
  onViewAllPosts,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  const displayPosts = posts && posts.length > 0 ? posts : FALLBACK_INSIGHTS;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF' },
              ]}
            >
              <Ionicons name="newspaper-outline" size={11} color="#3B82F6" />
              <Text style={[styles.badgeText, { color: '#2563EB' }]}>
                {isBangla ? 'ইনসাইটস ও অ্যানালাইসিস' : 'EDITORIAL & INSIGHTS'}
              </Text>
            </View>
          </View>
          <Text style={[typography.h3, { color: colors.text }]}>
            {isBangla ? 'থ্রাইভিং ইনসাইটস ও নলেজ হাব' : 'Thriving Insights & Thought Leadership'}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            {isBangla
              ? '৪আইআর, এআই রূপান্তর ও কর্মদক্ষতা বৃদ্ধির আধুনিক আর্টিকেল'
              : 'Actionable frameworks, 4IR research & corporate growth models'}
          </Text>
        </View>

        <SpringPressable
          onPress={() => {
            triggerHaptic('light');
            onViewAllPosts();
          }}
          style={styles.viewAllBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'সব আর্টিকেল দেখুন' : 'View all articles'}
        >
          <Text style={[typography.caption, { color: colors.primary }]}>
            {isBangla ? 'সব দেখুন →' : 'See all →'}
          </Text>
        </SpringPressable>
      </View>

      {/* Snap Carousel */}
      <FlatList
        data={displayPosts.slice(0, 6)}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        renderItem={({ item }) => {
          const cleanTitle = cleanHtml(item.title);
          const cleanExcerpt = cleanHtml(item.excerpt);
          const categoryName =
            item.categories && item.categories.length > 0 ? item.categories[0] : 'Insight';
          let formattedDate = 'Recent';
          if (item.date) {
            try {
              const parsedD = new Date(item.date);
              if (!isNaN(parsedD.getTime())) {
                formattedDate = parsedD.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              }
            } catch {
              formattedDate = 'Recent';
            }
          }

          return (
            <SpringPressable
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
              activeScale={0.96}
              haptic="selection"
              onPress={() => {
                triggerHaptic('light');
                onSelectPost(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${cleanTitle}, Written by ${item.authorName}`}
            >
              {/* Thumbnail */}
              <View style={styles.thumbnailContainer}>
                <Image
                  source={getSafeImageSource(
                    item.featuredImageUrl ||
                      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                  )}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                  {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
                />
                <View style={[styles.categoryTag, { backgroundColor: 'rgba(16, 47, 83, 0.9)' }]}>
                  <Text style={styles.categoryTagText}>{categoryName}</Text>
                </View>
              </View>

              {/* Body */}
              <View style={styles.bodyWrap}>
                <View style={styles.metaRow}>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {formattedDate}
                  </Text>
                  <Text style={[styles.dotText, { color: colors.textMuted }]}>•</Text>
                  <View style={styles.readTimeWrap}>
                    <Ionicons name="time-outline" size={10} color={colors.textMuted} />
                    <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
                      {isBangla ? '৪ মিনিট পাঠ' : '4 min read'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[typography.bodyMedium, styles.postTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {cleanTitle}
                </Text>

                <Text
                  style={[typography.bodySmall, styles.postExcerpt, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {cleanExcerpt}
                </Text>

                <View style={styles.footerRow}>
                  <View style={styles.authorRow}>
                    <View
                      style={[
                        styles.authorAvatarCircle,
                        { backgroundColor: isDark ? 'rgba(16, 47, 83, 0.4)' : '#E8EEF5' },
                      ]}
                    >
                      <Text style={[styles.authorInitials, { color: colors.primary }]}>
                        {(item.authorName || 'TS').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
                      {item.authorName || 'TSL Editorial'}
                    </Text>
                  </View>

                  <View style={[styles.readPill, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.readPillText, { color: colors.onPrimary }]}>
                      {isBangla ? 'পড়ুন' : 'Read'}
                    </Text>
                    <Ionicons name="arrow-forward" size={10} color={colors.onPrimary} />
                  </View>
                </View>
              </View>
            </SpringPressable>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    gap: 4,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: shape.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  card: {
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
    height: 125,
    backgroundColor: '#0A1C33',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  categoryTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: shape.full,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bodyWrap: {
    padding: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  dotText: {
    fontSize: 10,
  },
  readTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readTimeText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  postTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  postExcerpt: {
    fontSize: 11,
    lineHeight: 15,
    minHeight: 30,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 6,
  },
  authorAvatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitials: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  authorName: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  readPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: shape.full,
  },
  readPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
