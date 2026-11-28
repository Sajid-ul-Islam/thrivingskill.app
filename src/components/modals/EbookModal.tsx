import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useAuth } from '../../context/AuthContext';
import { useLearning } from '../../context/LearningContext';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { SpringPressable } from '../common/SpringPressable';
import { triggerHaptic } from '../../utils/haptics';
import { SiteNavigationService, EbookItem } from '../../services/site/siteNavigationService';
import { CompanionService } from '../../services/api/companionService';
import { Env } from '../../config/env';

export const STORAGE_KEY_PURCHASED_EBOOKS = '@ts_purchased_ebooks';

export function getEbookEntitlementStorageKey(userId?: string | number | null): string {
  const scope = userId ? `_u_${String(userId).trim()}` : '_guest';
  return `${STORAGE_KEY_PURCHASED_EBOOKS}:${scope}`;
}

export interface EbookModalProps {
  visible: boolean;
  onClose: () => void;
  onBuyEbook?: (ebook: EbookItem) => void;
  purchasedEbookIds?: string[];
  onEbookPurchased?: (ebookId: string) => void;
}

export const EbookModal: React.FC<EbookModalProps> = ({
  visible,
  onClose,
  onBuyEbook,
  purchasedEbookIds: propPurchasedIds,
  onEbookPurchased,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedback();
  const { user, isAuthenticated } = useAuth();
  const { courses, userProgress } = useLearning();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [serverPurchasedIds, setServerPurchasedIds] = useState<string[]>([]);

  // Synchronize eBook entitlements against server-verified LearnPress enrollments (and account-scoped offline cache).
  useEffect(() => {
    if (!visible) return;
    let active = true;

    const ebooksCatalog = SiteNavigationService.getEbooks();
    const resolveMatchedEbookIds = (enrolledCourseIds: string[]): string[] => {
      const idSet = new Set(enrolledCourseIds.map((id) => String(id).trim()));
      const slugByCourseId = new Map<string, string>();
      courses.forEach((c) => {
        if (c?.id && c?.slug) {
          slugByCourseId.set(String(c.id), String(c.slug));
        }
      });

      const resolved = new Set<string>();
      ebooksCatalog.forEach((book) => {
        const target = book.courseId ? String(book.courseId).trim() : '';
        if (!target) return;
        if (idSet.has(target) || idSet.has(book.id)) {
          resolved.add(book.id);
          return;
        }
        for (const enrolledId of idSet) {
          if (slugByCourseId.get(enrolledId) === target) {
            resolved.add(book.id);
            break;
          }
        }
      });
      return Array.from(resolved);
    };

    if (!isAuthenticated || !user?.id) {
      setServerPurchasedIds([]);
      return;
    }

    const storageKey = getEbookEntitlementStorageKey(user.id);
    const enrolledFromContext = Object.keys(userProgress || {});
    if (enrolledFromContext.length > 0) {
      setServerPurchasedIds(resolveMatchedEbookIds(enrolledFromContext));
    } else {
      AsyncStorage.getItem(storageKey)
        .then((data) => {
          if (!active || !data) return;
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              setServerPurchasedIds(parsed.map(String));
            }
          } catch {
            // Ignore malformed cache
          }
        })
        .catch(() => {});
    }

    CompanionService.checkServerEnrollment()
      .then((serverCheck) => {
        if (!active || !serverCheck) return;
        const verifiedIds = resolveMatchedEbookIds(serverCheck.enrolledCourseIds || []);
        setServerPurchasedIds(verifiedIds);
        AsyncStorage.setItem(storageKey, JSON.stringify(verifiedIds)).catch(() => {});
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [visible, isAuthenticated, user?.id, courses, userProgress]);

  if (!visible) return null;

  const ebooks = SiteNavigationService.getEbooks();
  const categories = ['all', ...Array.from(new Set(ebooks.map((e) => e.category)))];

  const effectivePurchasedIds = propPurchasedIds || serverPurchasedIds;

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

  const handleBuyEbook = async (book: EbookItem) => {
    triggerHaptic('medium');
    if (onBuyEbook) {
      onBuyEbook(book);
      return;
    }

    // Direct checkout path matching live site https://thrivingskill.com/courses/...
    const checkoutUrl = book.courseId
      ? `${Env.SITE_URL}/courses/${book.courseId}/`
      : book.readUrl || `${Env.SITE_URL}/ebook/`;

    showToast({
      type: 'info',
      message: isBangla
        ? `৳${book.price} মূল্যের ই-বুকের চেকআউট পেজ ওপেন হচ্ছে...`
        : `Opening secure checkout for ৳${book.price} eBook...`,
    });

    try {
      await Linking.openURL(checkoutUrl);
    } catch {
      // Fallback to portal root if custom scheme fails
      Linking.openURL(`${Env.SITE_URL}/ebook/`).catch(() => {});
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="book" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isBangla ? 'ই-বুক লাইব্রেরি' : 'eBook Library'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {isBangla ? 'প্রফেশনাল হ্যান্ডবুক ও গাইড' : 'Expert Handbooks & Blueprints'}
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
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.searchInputWrapper,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textMuted}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={isBangla ? 'ই-বুক অনুসন্ধান করুন...' : 'Search handbooks & guides...'}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Category Filter Pills — Official high-contrast brand palette */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
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
                      backgroundColor: isActive
                        ? colors.primary
                        : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : colors.surfaceSubtle,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      {
                        color: isActive ? colors.onPrimary : colors.textMuted,
                        fontWeight: isActive ? '700' : '500',
                      },
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
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
          ]}
        >
          {filteredEbooks.map((book) => {
            const isPurchased = effectivePurchasedIds.includes(book.id) || !!book.isPurchased;
            return (
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
                  <View style={[styles.bookIconBadge, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.categoryBadgeRow}>
                      <View
                        style={[
                          styles.catBadge,
                          { backgroundColor: isDark ? '#1C2E46' : '#E8EEF5' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.catBadgeText,
                            { color: isDark ? colors.primary : '#102F53' },
                          ]}
                        >
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

                <Text
                  style={[styles.bookDescription, { color: colors.textMuted }]}
                  numberOfLines={3}
                >
                  {isBangla ? book.banglaDescription : book.description}
                </Text>

                {/* Footer with Transparent Pricing & Buy Action */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  {/* Pricing Breakdown */}
                  <View style={styles.priceContainer}>
                    <View style={styles.priceRow}>
                      <Text style={[styles.salePriceText, { color: colors.accent }]}>
                        ৳{book.price}
                      </Text>
                      {book.regularPrice ? (
                        <Text style={[styles.regularPriceText, { color: colors.textMuted }]}>
                          ৳{book.regularPrice}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.priceTagSubtext, { color: colors.textMuted }]}>
                      {isPurchased
                        ? isBangla
                          ? '✓ আপনার সংগ্রহে রয়েছে'
                          : '✓ In Your Library'
                        : isBangla
                          ? 'এককালীন ক্রয় • লাইফটাইম অ্যাক্সেস'
                          : 'One-time purchase • Lifetime access'}
                    </Text>
                  </View>

                  {/* Dynamic Paid CTA — Buy vs Read */}
                  {isPurchased ? (
                    <SpringPressable
                      onPress={() => handleOpenEbook(book.readUrl)}
                      style={[styles.readBtn, { backgroundColor: isDark ? '#1C2E46' : '#E8EEF5' }]}
                      activeScale={0.96}
                      accessibilityRole="button"
                      accessibilityLabel={isBangla ? `${book.title} পড়ুন` : `Read ${book.title}`}
                    >
                      <Ionicons
                        name="book-outline"
                        size={16}
                        color={isDark ? colors.primary : '#102F53'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[styles.readBtnText, { color: isDark ? colors.primary : '#102F53' }]}
                      >
                        {isBangla ? 'পড়ুন / ডাউনলোড' : 'Read & Download'}
                      </Text>
                    </SpringPressable>
                  ) : (
                    <SpringPressable
                      onPress={() => handleBuyEbook(book)}
                      style={[styles.buyBtn, { backgroundColor: colors.accent }]}
                      activeScale={0.96}
                      accessibilityRole="button"
                      accessibilityLabel={isBangla ? `${book.title} কিনুন` : `Buy ${book.title}`}
                    >
                      <Ionicons
                        name="cart-outline"
                        size={17}
                        color={colors.onAccent}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.buyBtnText, { color: colors.onAccent }]}>
                        {isBangla ? `কিনুন • ৳${book.price}` : `Buy eBook • ৳${book.price}`}
                      </Text>
                    </SpringPressable>
                  )}
                </View>
              </View>
            );
          })}
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: shape.full,
    borderWidth: 1.5,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillText: {
    fontSize: 12.5,
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  priceContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  salePriceText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  regularPriceText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  priceTagSubtext: {
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: '500',
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: shape.medium,
    minHeight: 44,
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buyBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: shape.medium,
    minHeight: 44,
  },
  readBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
