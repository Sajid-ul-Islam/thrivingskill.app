import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { CategoryPills } from '../components/CategoryPills';
import { CourseCard } from '../components/CourseCard';
import { SpecialBundleCard } from '../components/SpecialBundleCard';
import { CourseCardSkeleton } from '../components/SkeletonLoader';
import { StateView } from '../components/common';
import { SPECIAL_BUNDLES } from '../data/mockData';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { triggerHaptic } from '../utils/haptics';
import { shape } from '../theme/shapes';
import { MIN_TOUCH_TARGET } from '../theme/typography';

interface CoursesScreenProps {
  onNavigateToCourse: (courseId: string) => void;
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
  onOpenDrawer?: () => void;
}

type LevelFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';
type PriceFilter = 'all' | 'free' | 'paid';
type SortOption = 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high';

export const CoursesScreen: React.FC<CoursesScreenProps> = ({
  onNavigateToCourse,
  onOpenSubscription,
  onOpenNotifications,
  onOpenDrawer,
}) => {
  const { colors } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const {
    courses,
    categories,
    isLoadingCourses,
    coursesError,
    refreshCourses,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useLearning();

  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('All');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<PriceFilter>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const levelsAutoScroll = useAutoScroll({
    speed: 0.40,
    pauseAtEdgeMs: 1500,
    resumeDelayMs: 2500,
  });

  const levelLabels: Record<LevelFilter, { en: string; bn: string }> = {
    All: { en: 'All', bn: 'সব' },
    Beginner: { en: 'Beginner', bn: 'বিগিনার' },
    Intermediate: { en: 'Intermediate', bn: 'মিড-লেভেল' },
    Advanced: { en: 'Advanced', bn: 'অ্যাডভান্সড' },
  };

  // Filtering & Sorting
  const isBundleView = selectedCategory === 'career-track';

  let filtered = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel =
      selectedLevel === 'All' ||
      course.level === selectedLevel ||
      course.level === 'All Levels';
    const isFree = (!course.price || course.price === 0) && (!course.priceBdt || course.priceBdt === 0);
    const isPaid = (course.price && course.price > 0) || (course.priceBdt && course.priceBdt > 0);
    const matchesPrice =
      selectedPriceFilter === 'all' ||
      (selectedPriceFilter === 'free' && isFree) ||
      (selectedPriceFilter === 'paid' && isPaid);
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesLevel && matchesPrice && matchesSearch;
  });

  filtered.sort((a, b) => {
    if (selectedSort === 'newest') return Number(b.id) - Number(a.id);
    if (selectedSort === 'rating') return b.rating - a.rating;
    const priceA = a.priceBdt !== undefined && a.priceBdt > 0 ? a.priceBdt : (a.price ? a.price * 118 : 0);
    const priceB = b.priceBdt !== undefined && b.priceBdt > 0 ? b.priceBdt : (b.price ? b.price * 118 : 0);
    if (selectedSort === 'price-low') return priceA - priceB;
    if (selectedSort === 'price-high') return priceB - priceA;
    return b.enrolledCount - a.enrolledCount; // popular
  });

  const handleBundlePress = (bundleTitle: string) => {
    Alert.alert(
      `${bundleTitle}`,
      isBangla
        ? 'সম্পূর্ণ মাল্টি-কোর্স কারিকুলাম, প্র্যাকটিস ফাইল এবং ভেরিফাইড ডিজিটাল সার্টিফিকেট অন্তর্ভুক্ত। আপনার মেম্বারশিপ স্ট্যাটাস দেখুন অথবা কোর্সগুলো ব্রাউজ করুন।'
        : 'Includes complete multi-course curriculum, practice files, and verified digital certificates. View your synced membership status or browse individual courses in this track.',
      [
        { text: isBangla ? 'বন্ধ করুন' : 'Close', style: 'cancel' },
        { text: isBangla ? 'মেম্বারশিপ স্ট্যাটাস' : 'Membership Status', onPress: onOpenSubscription },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={isBangla ? 'কোর্স ক্যাটালগ' : 'Thriving Skills Catalog'}
        subtitle={isBangla ? '৩০০+ প্রিমিয়াম কোর্স ও স্পেশাল বান্ডেল' : '300+ Premium Courses & Special Bundles'}
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCourses}
            onRefresh={refreshCourses}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Search Header */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={isBangla ? 'কোর্স, জেনারেটিভ এআই, এক্সেল ফর্মুলা সার্চ করুন...' : 'Search courses, Generative AI, Excel formulas...'}
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={isBangla ? 'সার্চ মুছুন' : 'Clear search input'}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories Pills */}
        <CategoryPills
          selectedId={selectedCategory}
          categories={categories}
          onSelect={setSelectedCategory}
        />

        {/* Filters and View Mode Controls */}
        {!isBundleView && (
          <View style={styles.filterRow}>
            {/* Level selector */}
            <ScrollView
              ref={levelsAutoScroll.scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.levelsScroll}
              {...levelsAutoScroll.scrollProps}
            >
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as LevelFilter[]).map((lvl) => {
                const isSelected = selectedLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.levelPill,
                      {
                        backgroundColor:
                          isSelected ? colors.secondary : colors.surfaceSubtle,
                        borderColor: isSelected ? colors.secondary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      levelsAutoScroll.pauseTemporarily(3000);
                      setSelectedLevel(lvl);
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={
                      isBangla
                        ? `${levelLabels[lvl].bn} লেভেল ফিল্টার`
                        : `Filter by ${levelLabels[lvl].en} difficulty`
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Text
                      style={[
                        styles.levelText,
                        { color: isSelected ? colors.onSecondary : colors.textMuted },
                      ]}
                    >
                      {isBangla ? levelLabels[lvl].bn : levelLabels[lvl].en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* View toggle */}
            <View style={styles.viewToggleGroup}>
              <TouchableOpacity
                style={[
                  styles.viewToggleBtn,
                  viewMode === 'grid' && { backgroundColor: colors.surfaceSubtle },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setViewMode('grid');
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to grid layout"
              >
                <Ionicons
                  name="grid-outline"
                  size={18}
                  color={viewMode === 'grid' ? colors.primary : colors.textLight}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewToggleBtn,
                  viewMode === 'list' && { backgroundColor: colors.surfaceSubtle },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setViewMode('list');
                }}
                accessibilityRole="button"
                accessibilityLabel="Switch to list layout"
              >
                <Ionicons
                  name="list-outline"
                  size={18}
                  color={viewMode === 'list' ? colors.primary : colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Result Header & Filters */}
        <View style={styles.resultMetaRow}>
          <Text style={[styles.resultCount, { color: colors.textMuted }]}>
            {isBundleView ? (
              isBangla ? (
                <>দেখাচ্ছে <Text style={{ color: colors.text, fontWeight: '700' }}>{SPECIAL_BUNDLES.length}</Text> টি বান্ডেল</>
              ) : (
                <>Showing <Text style={{ color: colors.text, fontWeight: '700' }}>{SPECIAL_BUNDLES.length}</Text> Bundles</>
              )
            ) : (
              isBangla ? (
                <>দেখাচ্ছে <Text style={{ color: colors.text, fontWeight: '700' }}>{filtered.length}</Text> টি কোর্স</>
              ) : (
                <>Showing <Text style={{ color: colors.text, fontWeight: '700' }}>{filtered.length}</Text> courses</>
              )
            )}
          </Text>

          {!isBundleView && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {/* Free / Paid / All Segmented Pills (Section 5 Spec) */}
              <View style={[styles.priceFilterGroup, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]} accessibilityRole="tablist">
                {(['all', 'free', 'paid'] as PriceFilter[]).map((pf) => {
                  const isSelected = selectedPriceFilter === pf;
                  const pfLabel =
                    pf === 'all'
                      ? (isBangla ? 'সকল' : 'All')
                      : pf === 'free'
                      ? (isBangla ? 'ফ্রি' : 'Free')
                      : (isBangla ? 'মেম্বারস' : 'Members');
                  return (
                    <TouchableOpacity
                      key={pf}
                      style={[
                        styles.priceFilterBtn,
                        isSelected && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setSelectedPriceFilter(pf)}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={
                        isBangla
                          ? `${pfLabel} কোর্স ফিল্টার`
                          : `Filter by ${pfLabel} courses`
                      }
                    >
                      <Text
                        style={[
                          styles.priceFilterBtnText,
                          { color: isSelected ? colors.onPrimary : colors.textMuted },
                        ]}
                      >
                        {pfLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.sortBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                onPress={() => {
                  const order: SortOption[] = ['popular', 'newest', 'rating'];
                  const nextIdx = (order.indexOf(selectedSort) + 1) % order.length;
                  setSelectedSort(order[nextIdx]);
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  isBangla
                    ? `সাজান: ${selectedSort === 'popular' ? 'জনপ্রিয়' : selectedSort === 'newest' ? 'নতুন' : 'সেরা রেটিং'}`
                    : `Sort courses by ${selectedSort}`
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="swap-vertical" size={13} color={colors.primary} />
                <Text style={[styles.sortBtnText, { color: colors.text }]}>
                  {selectedSort === 'popular'
                    ? (isBangla ? 'জনপ্রিয়' : 'Popular')
                    : selectedSort === 'newest'
                    ? (isBangla ? 'নতুন' : 'Newest')
                    : (isBangla ? 'সেরা রেটিং' : 'Top Rated')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Content Rendering: Bundles or Courses */}
        <View style={styles.coursesContainer}>
          {isLoadingCourses && courses.length === 0 ? (
            <>
              <CourseCardSkeleton horizontal={viewMode === 'list'} />
              <CourseCardSkeleton horizontal={viewMode === 'list'} />
              <CourseCardSkeleton horizontal={viewMode === 'list'} />
            </>
          ) : coursesError && courses.length === 0 ? (
            <StateView
              mode="error"
              title={isBangla ? 'ক্যাটালগ লোড করা যায়নি' : 'Could not load catalog'}
              message={coursesError}
              primaryActionLabel={isBangla ? 'আবার চেষ্টা করুন' : 'Retry'}
              onPrimaryAction={refreshCourses}
            />
          ) : isBundleView ? (
            SPECIAL_BUNDLES.map((bundle) => (
              <SpecialBundleCard
                key={bundle.id}
                bundle={bundle}
                onPress={() => handleBundlePress(bundle.title)}
              />
            ))
          ) : filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="search-outline" size={42} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {isBangla ? 'কোনো কোর্স পাওয়া যায়নি' : 'No courses found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {isBangla
                  ? `"${searchQuery || selectedCategory}" এর সাথে মিলে এমন কোনো কোর্স পাওয়া যায়নি। জনপ্রিয় বিষয়গুলো দেখতে পারেন:`
                  : `We couldn't find any courses matching "${searchQuery || selectedCategory}". Try popular topics:`}
              </Text>

              {/* Popular quick searches */}
              <View style={styles.suggestionRow}>
                {(isBangla
                  ? [
                      { label: 'এআই ও অটোমেশন', q: 'AI' },
                      { label: 'ফাইন্যান্সিয়াল মডেলিং', q: 'Financial' },
                      { label: 'কর্পোরেট লিডারশিপ', q: 'Corporate' },
                    ]
                  : [
                      { label: 'AI & Automation', q: 'AI' },
                      { label: 'Financial Modeling', q: 'Financial' },
                      { label: 'Corporate Leadership', q: 'Corporate' },
                    ]
                ).map((topic) => (
                  <TouchableOpacity
                    key={topic.label}
                    style={[styles.suggestionChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                    onPress={() => {
                      setSearchQuery(topic.q);
                      setSelectedCategory('all');
                      setSelectedLevel('All');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isBangla
                        ? `${topic.label} বিষয় সার্চ করুন`
                        : `Search for ${topic.label}`
                    }
                  >
                    <Text style={[styles.suggestionText, { color: colors.text }]}>{topic.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedLevel('All');
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  isBangla ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'
                }
              >
                <Ionicons name="refresh" size={15} color={colors.onPrimary} />
                <Text style={[styles.resetBtnText, { color: colors.onPrimary }]}>
                  {isBangla ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                horizontal={viewMode === 'list'}
                onPress={() => onNavigateToCourse(course.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  levelsScroll: {
    gap: 6,
    paddingRight: 8,
  },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: shape.small,
    borderWidth: 1,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  viewToggleBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  resultCount: {
    fontSize: 13,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: shape.small,
    borderWidth: 1,
    gap: 6,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceFilterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: shape.small,
    borderWidth: 1,
    padding: 2,
  },
  priceFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: shape.extraSmall,
  },
  priceFilterBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  coursesContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  suggestionChip: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: shape.full,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetBtn: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: shape.medium,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
