import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { SpringPressable } from '../common/SpringPressable';
import { triggerHaptic } from '../../utils/haptics';
import { SiteNavigationService, EbookItem } from '../../services/site/siteNavigationService';

interface EbookModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EbookModal: React.FC<EbookModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!visible) return null;

  const ebooks = SiteNavigationService.getEbooks();

  const categories = ['all', ...Array.from(new Set(ebooks.map((e) => e.category)))];

  const filteredEbooks = ebooks.filter((b) => {
    const matchesCat = selectedCategory === 'all' || b.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim().length === 0 ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.banglaTitle.includes(searchQuery) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleOpenEbook = (url: string) => {
    triggerHaptic('light');
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.surfaceCard,
              paddingTop: insets.top ? insets.top + 8 : 16,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255, 182, 6, 0.15)' : '#FFFBEB' }]}>
              <Ionicons name="book" size={20} color="#FFB606" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isBangla ? 'ই-বুক লাইব্রেরি' : 'eBook Library'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {isBangla ? 'প্রফেশনাল গাইড ও রিসোর্স' : 'Expert Handbooks & Blueprints'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.surfaceSubtle }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close eBook modal"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search & Filter Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={isBangla ? 'ই-বুক অনুসন্ধান করুন...' : 'Search handbooks & guides...'}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedCategory(cat);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={cat}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surfaceSubtle,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: isActive ? '#FFFFFF' : colors.textMuted, fontWeight: isActive ? '700' : '500' },
                    ]}
                  >
                    {cat === 'all' ? (isBangla ? 'সকল বিষয়' : 'All Topics') : cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* eBook Items */}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}>
          {filteredEbooks.map((book) => (
            <View
              key={book.id}
              style={[
                styles.ebookCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.bookIconBadge, { backgroundColor: isDark ? 'rgba(255, 182, 6, 0.16)' : '#EFF6FF' }]}>
                  <Ionicons name="document-text" size={24} color={isDark ? colors.primary : '#102F53'} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.categoryBadgeRow}>
                    <View style={[styles.catBadge, { backgroundColor: isDark ? '#1C2E46' : '#E8EEF5' }]}>
                      <Text style={[styles.catBadgeText, { color: isDark ? colors.primary : '#102F53' }]}>
                        {book.category}
                      </Text>
                    </View>
                    {book.pages && (
                      <Text style={[styles.pagesText, { color: colors.textMuted }]}>
                        {book.pages} {isBangla ? 'পৃষ্ঠা' : 'pages'}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
                    {isBangla ? book.banglaTitle : book.title}
                  </Text>
                  <Text style={[styles.bookAuthor, { color: colors.textMuted }]}>
                    {book.author}
                  </Text>
                </View>
              </View>

              <Text style={[styles.bookDescription, { color: colors.textMuted }]} numberOfLines={3}>
                {isBangla ? book.banglaDescription : book.description}
              </Text>

              <View style={styles.cardActions}>
                <SpringPressable
                  onPress={() => handleOpenEbook(book.readUrl)}
                  style={[styles.readBtn, { backgroundColor: colors.accent }]}
                  activeScale={0.96}
                  accessibilityRole="button"
                  accessibilityLabel={isBangla ? `${book.title} পড়ুন` : `Read ${book.title}`}
                >
                  <Ionicons name="open-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.readBtnText}>
                    {isBangla ? 'ই-বুক পড়ুন / ডাউনলোড' : 'Read & Download Free'}
                  </Text>
                </SpringPressable>
              </View>
            </View>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: shape.medium,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: shape.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  ebookCard: {
    borderRadius: shape.large,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  bookIconBadge: {
    width: 50,
    height: 64,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: shape.small,
  },
  catBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pagesText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: shape.medium,
    minHeight: 38,
  },
  readBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
