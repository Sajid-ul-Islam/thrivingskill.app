import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLearning } from '../context/LearningContext';
import { cleanHtml } from '../services/api/transformers';

export interface BlogModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCourse?: (courseId: string) => void;
}

interface BlogPostItem {
  id: string | number;
  title: string;
  banglaTitle?: string;
  excerpt: string;
  content: string;
  category: string;
  categoryLabel: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  imageUrl: string;
}

const CURATED_BLOGS: BlogPostItem[] = [
  {
    id: 'blog-1',
    title: 'The Rise of Prompt Engineering: How Bangladeshi Executives Are Leveraging AI in 2026',
    banglaTitle: 'প্রম্পট ইঞ্জিনিয়ারিং: ২০২৬ সালে যেভাবে বাংলাদেশের এক্সিকিউটিভরা এআই ব্যবহার করছেন',
    excerpt:
      'Discover how generative AI frameworks like RTCC and Retrieval-Augmented Generation are reshaping corporate productivity across Dhaka.',
    content: `Generative AI is no longer just a trend for software engineers. In 2026, corporate executives, HR directors, financial analysts, and marketing leads in Bangladesh are deploying structured Prompt Engineering frameworks to supercharge business operations.

### The RTCC Framework for Reliable Business Outputs
When prompting Large Language Models (LLMs), unstructured commands yield erratic results. The proven standard across Thriving Skills corporate bootcamps is RTCC:
1. **Role**: Assign an authoritative persona (e.g. "You are an expert FMCG Supply Chain Director in Dhaka").
2. **Task**: State the exact output needed (e.g. "Synthesize this 40-page quarterly logistics audit into a 1-page executive memo").
3. **Context**: Provide business constraints, target audience, and local industry context.
4. **Constraints**: Define what *not* to do (e.g. "Do not extrapolate missing numbers; flag them with [DATA NEEDED]").

### Enterprise Adoption Across Dhaka & Chittagong
Major multinationals and leading conglomerates in Bangladesh are now integrating private AI copilots to automate Excel forecasting, draft bilingual board resolutions, and optimize talent acquisition pipelines. Upskilling internal teams has proven 4x more cost-effective than outsourcing technical development.`,
    category: 'ai',
    categoryLabel: 'Generative AI & 4IR',
    author: 'Abdullah Al Mahmud',
    authorRole: 'CEO & Founder, Thriving Skills',
    date: 'August 28, 2026',
    readTime: '4 min read',
    imageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'blog-2',
    title: 'Mastering Advanced Excel Dashboards for Strategic Corporate Decision Making',
    banglaTitle: 'কর্পোরেট ডিসিশন মেকিংয়ে অ্যাডভান্সড এক্সেল ড্যাশবোর্ড তৈরির উপায়',
    excerpt:
      'Transform static spreadsheets into dynamic interactive executive cockpits with XLOOKUP, INDEX-MATCH, and Power Query.',
    content: `In modern data-driven enterprises, executives don't have time to sift through rows of raw tabular data. They need visual, interactive dashboards that answer mission-critical questions in seconds.

### Three Essential Formula Pillars
1. **Dynamic Arrays & XLOOKUP**: Replace rigid legacy VLOOKUP formulas that break upon column insertion.
2. **Power Query Automation**: Automate the monthly import, cleaning, and consolidation of multiple branch reports into a single pipeline.
3. **Interactive Slicers & Timeline Controls**: Give boardroom stakeholders the power to filter KPIs by quarter, region, and product category with a single tap.

By designing dashboards with high data-to-ink ratios and neutral corporate palettes, financial analysts can communicate actionable insights that drive revenue.`,
    category: 'analytics',
    categoryLabel: 'Data & Analytics',
    author: 'Syed Nuruddin Ahmed',
    authorRole: 'Co-Founder & Corporate Trainer, TSL',
    date: 'August 15, 2026',
    readTime: '5 min read',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'blog-3',
    title: 'Leadership in the Age of Hybrid Work: Cultivating Empathy and High-Performance Teams',
    banglaTitle: 'হাইব্রিড যুগে নেতৃত্ব: সহানুভূতি ও উচ্চ-দক্ষতাসম্পন্ন টিম গঠনের কৌশল',
    excerpt:
      'Why emotional intelligence and psychological safety are the ultimate competitive advantages in 2026 workplace leadership.',
    content: `Leading modern cross-functional teams requires far more than managing tasks and deadlines. As hybrid working models stabilize across Bangladeshi enterprises, leadership has shifted toward emotional intelligence, psychological safety, and clear purpose alignment.

### Pillars of Empathic Leadership
- **Asynchronous Clarity**: Document goals transparently so team members can work autonomously without constant micromanagement.
- **Active Listening & Check-ins**: Foster an environment where employees feel safe speaking up about blockers and workload burnout.
- **Continuous Learning Culture**: Support team certifications, masterclasses, and skill summits to ensure organizational adaptability.`,
    category: 'leadership',
    categoryLabel: 'Executive Leadership',
    author: 'Tareq Siddiqui',
    authorRole: 'Director of Learning, TSL',
    date: 'July 22, 2026',
    readTime: '3 min read',
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
  },
];

export const BlogModal: React.FC<BlogModalProps> = ({ visible, onClose, onSelectCourse }) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { blogPosts } = useLearning();
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<BlogPostItem | null>(null);

  if (!visible) return null;

  // Merge live WordPress posts with curated insights
  const liveTransformed: BlogPostItem[] = (blogPosts || []).map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: cleanHtml(p.excerpt).substring(0, 160) + '...',
    content: cleanHtml(p.content),
    category: 'live',
    categoryLabel: 'WordPress CMS',
    author: p.authorName || 'Thriving Skills Editorial',
    authorRole: 'Editorial Team',
    date: p.date ? new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
    readTime: '3 min read',
    imageUrl: p.featuredImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  }));

  const allArticles = [...CURATED_BLOGS, ...liveTransformed];

  const categories = [
    { id: 'all', label: isBangla ? 'সকল পোস্ট' : 'All Articles' },
    { id: 'ai', label: isBangla ? 'এআই ও টেক' : 'Generative AI' },
    { id: 'analytics', label: isBangla ? 'ডাটা ও এক্সেল' : 'Analytics' },
    { id: 'leadership', label: isBangla ? 'লিডারশিপ' : 'Leadership' },
  ];

  const filteredArticles = allArticles.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.excerpt.toLowerCase().includes(query) ||
      item.author.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleShareArticle = async (article: BlogPostItem) => {
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nRead more on Thriving Skills: https://thrivingskill.com/blog`,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (activeArticle) setActiveArticle(null);
        else onClose();
      }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
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
          <View style={styles.headerRow}>
            {activeArticle ? (
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => setActiveArticle(null)}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="newspaper-outline" size={20} color={colors.primary} />
              </View>
            )}

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {activeArticle
                  ? isBangla ? 'নিবন্ধ পাঠ' : 'Article Reader'
                  : isBangla ? 'থ্রাইভিং স্কিলস ব্লগ ও আর্টিকেল' : 'Thriving Skills Blog'}
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {activeArticle
                  ? activeArticle.categoryLabel
                  : isBangla ? 'কর্পোরেট ইনসাইটস ও স্কিল ডেভেলপমেন্ট' : 'Executive Insights, Tech & Leadership'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search & Categories (only in list mode) */}
          {!activeArticle && (
            <>
              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={isBangla ? 'আর্টিকেল খুঁজুন (যেমন: AI, Excel, Leadership)...' : 'Search articles (e.g. AI, Excel)...'}
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {categories.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: active ? colors.primary : colors.surfaceSubtle,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          { color: active ? '#FFFFFF' : colors.text, fontWeight: active ? '700' : '500' },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        {/* Body Content */}
        {activeArticle ? (
          /* Full Article Reader View */
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.readerContent}>
            <Image source={{ uri: activeArticle.imageUrl }} style={styles.articleHero} />

            <View style={styles.readerBody}>
              <View style={[styles.categoryTag, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.categoryTagText, { color: colors.primary }]}>
                  {activeArticle.categoryLabel.toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.readerTitle, { color: colors.text }]}>
                {isBangla && activeArticle.banglaTitle ? activeArticle.banglaTitle : activeArticle.title}
              </Text>

              {/* Author Row */}
              <View style={[styles.authorRow, { borderBottomColor: colors.borderSubtle }]}>
                <View style={[styles.authorAvatar, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="person" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.authorName, { color: colors.text }]}>
                    {activeArticle.author}
                  </Text>
                  <Text style={[styles.authorMeta, { color: colors.textMuted }]}>
                    {activeArticle.date} • {activeArticle.readTime}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.shareBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={() => handleShareArticle(activeArticle)}
                >
                  <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Article Markdown/HTML Body */}
              <Text style={[styles.readerParagraph, { color: colors.text }]}>
                {activeArticle.content}
              </Text>

              {/* Read on Website Link */}
              <TouchableOpacity
                style={[styles.webLinkBtn, { borderColor: colors.primary }]}
                onPress={() => Linking.openURL('https://thrivingskill.com/blog')}
              >
                <Ionicons name="open-outline" size={16} color={colors.primary} />
                <Text style={[styles.webLinkText, { color: colors.primary }]}>
                  Read More on thrivingskill.com/blog
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* Articles List */
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {filteredArticles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="newspaper-outline" size={44} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No articles found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Try a different search keyword or category filter.
                </Text>
              </View>
            ) : (
              filteredArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={[
                    styles.articleCard,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                  ]}
                  onPress={() => setActiveArticle(article)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: article.imageUrl }} style={styles.cardThumb} />
                  <View style={styles.cardContent}>
                    <View style={styles.cardBadgeRow}>
                      <Text style={[styles.cardCatText, { color: colors.primary }]}>
                        {article.categoryLabel}
                      </Text>
                      <Text style={[styles.cardDateText, { color: colors.textMuted }]}>
                        {article.date}
                      </Text>
                    </View>

                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                      {isBangla && article.banglaTitle ? article.banglaTitle : article.title}
                    </Text>

                    <Text style={[styles.cardExcerpt, { color: colors.textMuted }]} numberOfLines={2}>
                      {article.excerpt}
                    </Text>

                    <View style={styles.cardFooter}>
                      <Text style={[styles.authorSmall, { color: colors.textMuted }]}>
                        By {article.author}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Text style={[styles.readTimeText, { color: colors.primary }]}>
                          Read Article
                        </Text>
                        <Ionicons name="arrow-forward" size={13} color={colors.primary} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  articleCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardThumb: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 14,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardCatText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardDateText: {
    fontSize: 11,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 6,
  },
  cardExcerpt: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  authorSmall: {
    fontSize: 11,
  },
  readTimeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  readerContent: {
    paddingBottom: 50,
  },
  articleHero: {
    width: '100%',
    height: 220,
  },
  readerBody: {
    padding: 18,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  readerTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 18,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  authorMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerParagraph: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 20,
  },
  webLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  webLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    marginTop: 4,
  },
});
