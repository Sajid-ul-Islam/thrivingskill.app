import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { CategoryPills } from '../components/CategoryPills';
import { CourseCard } from '../components/CourseCard';
import { CourseCardSkeleton } from '../components/SkeletonLoader';
import { StateView, ScrollToTopPill } from '../components/common';
import { triggerHaptic } from '../utils/haptics';
import { shape } from '../theme/shapes';
import { MIN_TOUCH_TARGET } from '../theme/typography';

interface CoursesScreenProps {
  onNavigateToCourse: (courseId: string) => void;
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
  onOpenDrawer?: () => void;
  onOpenSupport?: () => void;
  onOpenSearch?: () => void;
}

type LevelFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';
type PriceFilter = 'all' | 'free' | 'paid';
type SortOption = 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high';

export const CoursesScreen: React.FC<CoursesScreenProps> = ({
  onNavigateToCourse,
  onOpenSubscription,
  onOpenNotifications,
  onOpenDrawer,
  onOpenSupport,
  onOpenSearch,
}) => {
  const { colors } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const {
    courses,
    totalCourseCount,
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
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [displayLimit, setDisplayLimit] = useState<number>(24);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView> | null>(null);
  const searchInputRef = useRef<React.ElementRef<typeof TextInput> | null>(null);
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external searchQuery changes with local input
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Clean timer on unmount (AGENTS.md Rule 3)
  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
  }, []);

  // Fast responsive search change with 90ms debounce for 120Hz smooth input
  const handleSearchChange = useCallback((text: string) => {
    setLocalSearch(text);
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    searchDebounceTimerRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 90);
  }, [setSearchQuery]);

  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    setSearchQuery('');
    setDisplayLimit(24);
  }, [setSearchQuery]);

  // Filter Selection Handlers with instant window reset and scroll-to-top
  const handleCategorySelect = useCallback((catId: string) => {
    setSelectedCategory(catId);
    setDisplayLimit(24);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [setSelectedCategory]);

  const handleLevelSelect = useCallback((lvl: LevelFilter) => {
    triggerHaptic('selection');
    setSelectedLevel(lvl);
    setDisplayLimit(24);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const handlePriceFilterSelect = useCallback((pf: PriceFilter) => {
    triggerHaptic('selection');
    setSelectedPriceFilter(pf);
    setDisplayLimit(24);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const handleSortToggle = useCallback(() => {
    triggerHaptic('selection');
    const order: SortOption[] = ['popular', 'newest', 'rating', 'price-low', 'price-high'];
    const nextIdx = (order.indexOf(selectedSort) + 1) % order.length;
    setSelectedSort(order[nextIdx]);
    setDisplayLimit(24);
  }, [selectedSort]);

  const handleClearAllFilters = useCallback(() => {
    setLocalSearch('');
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('All');
    setSelectedPriceFilter('all');
    setDisplayLimit(24);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [setSearchQuery, setSelectedCategory]);

  const levelLabels: Record<LevelFilter, { en: string; bn: string }> = {
    All: { en: 'All', bn: 'সব' },
    Beginner: { en: 'Beginner', bn: 'বিগিনার' },
    Intermediate: { en: 'Intermediate', bn: 'মিড-লেভেল' },
    Advanced: { en: 'Advanced', bn: 'অ্যাডভান্সড' },
  };

  // High-Performance Memoized Filtering & Sorting:
  // Evaluates in <2ms and caches results, preventing wasteful recomputations on scroll
  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const cat = selectedCategory;
    const lvl = selectedLevel;
    const pf = selectedPriceFilter;
    const sort = selectedSort;

    const matched = courses.filter((course) => {
      // 1. Category check
      if (cat !== 'all') {
        if (cat === 'career-track') {
          const isBundle =
            course.isCareerBundle ||
            course.title.toLowerCase().includes('bundle') ||
            course.slug.toLowerCase().includes('bundle');
          if (!isBundle) return false;
        } else {
          const directMatch = course.category === cat;
          const slugList = course.categorySlugs;
          const slugMatch =
            slugList &&
            (slugList.includes(cat) ||
              slugList.some((s) => s.includes(cat) || cat.includes(s)));
          if (!directMatch && !slugMatch) return false;
        }
      }

      // 2. Level check
      if (lvl !== 'All') {
        if (course.level !== lvl && course.level !== 'All Levels') return false;
      }

      // 3. Price check
      if (pf !== 'all') {
        const isFree = (!course.price || course.price === 0) && (!course.priceBdt || course.priceBdt === 0);
        if (pf === 'free' && !isFree) return false;
        if (pf === 'paid' && isFree) return false;
      }

      // 4. Search query check
      if (q) {
        const titleMatch = course.title.toLowerCase().includes(q);
        const subMatch = course.subtitle?.toLowerCase().includes(q);
        const instMatch = course.instructor?.name?.toLowerCase().includes(q);
        if (!titleMatch && !subMatch && !instMatch) return false;
      }

      return true;
    });

    // Fast sort in place
    if (sort === 'newest') {
      matched.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sort === 'rating') {
      matched.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'price-low') {
      matched.sort((a, b) => (a.priceBdt || 0) - (b.priceBdt || 0));
    } else if (sort === 'price-high') {
      matched.sort((a, b) => (b.priceBdt || 0) - (a.priceBdt || 0));
    } else {
      matched.sort((a, b) => b.enrolledCount - a.enrolledCount);
    }

    return matched;
  }, [courses, selectedCategory, selectedLevel, selectedPriceFilter, selectedSort, searchQuery]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    // 1. Dynamic Header Elevation:
    if (offsetY > 8 && !isScrolled) {
      setIsScrolled(true);
    } else if (offsetY <= 8 && isScrolled) {
      setIsScrolled(false);
    }

    // 2. Dynamic Sticky Search in Header:
    if (offsetY > 70 && !showHeaderSearch) {
      setShowHeaderSearch(true);
    } else if (offsetY <= 70 && showHeaderSearch) {
      setShowHeaderSearch(false);
    }

    // 3. Dynamic "Back to Top" Floating Pill:
    if (offsetY > 450 && !showScrollTop) {
      setShowScrollTop(true);
    } else if (offsetY <= 450 && showScrollTop) {
      setShowScrollTop(false);
    }

    // 4. Progressive Windowing: auto-load next batch when scrolling near bottom
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;
    if (contentHeight > 0 && offsetY + layoutHeight >= contentHeight - 200) {
      setDisplayLimit((prev) => (prev < filtered.length ? Math.min(prev + 24, filtered.length) : prev));
    }
  };

  const handleHeaderSearchPress = () => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      searchInputRef.current?.focus();
    }
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedLevel !== 'All' ||
    selectedPriceFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const catalogCount = totalCourseCount || courses.length || 382;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={isBangla ? 'কোর্স ক্যাটালগ' : 'Thriving Skills Catalog'}
        subtitle={
          isBangla
            ? `${catalogCount}+ প্রিমিয়াম কোর্স ও স্পেশাল বান্ডেল`
            : `${catalogCount}+ Premium Courses & Special Bundles`
        }
        isScrolled={isScrolled}
        showSearch={showHeaderSearch}
        onOpenSearch={handleHeaderSearchPress}
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
        onOpenSupport={onOpenSupport}
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCourses}
            onRefresh={() => {
              triggerHaptic('light');
              refreshCourses();
            }}
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
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={isBangla ? 'কোর্স, জেনারেটিভ এআই, এক্সেল ফর্মুলা সার্চ করুন...' : 'Search courses, Generative AI, Excel formulas...'}
              placeholderTextColor={colors.textLight}
              value={localSearch}
              onChangeText={handleSearchChange}
            />
            {localSearch.length > 0 && (
              <TouchableOpacity
                onPress={handleClearSearch}
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
          onSelect={handleCategorySelect}
        />

        {/* Filters and View Mode Controls */}
        <View style={styles.filterRow}>
            {/* Level selector (user-controlled static scroll) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.levelsScroll}
              accessibilityRole="tablist"
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
                    onPress={() => handleLevelSelect(lvl)}
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

        {/* Result Header & Filters */}
        <View style={styles.resultMetaRow}>
          <Text style={[styles.resultCount, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
            {isBangla ? (
              <>দেখাচ্ছে <Text style={{ color: colors.text, fontWeight: '700' }}>{filtered.length}</Text> টি কোর্স</>
            ) : (
              <>Showing <Text style={{ color: colors.text, fontWeight: '700' }}>{filtered.length}</Text> courses</>
            )}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
                    onPress={() => handlePriceFilterSelect(pf)}
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
              onPress={handleSortToggle}
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
                  : selectedSort === 'rating'
                  ? (isBangla ? 'সেরা রেটিং' : 'Top Rated')
                  : selectedSort === 'price-low'
                  ? (isBangla ? 'কম দাম' : 'Price: Low')
                  : (isBangla ? 'বেশি দাম' : 'Price: High')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filter Dismiss Chips */}
        {hasActiveFilters && (
          <View style={styles.activeFilterChipsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFilterChipsScroll}
            >
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={handleClearSearch}
                  accessibilityRole="button"
                  accessibilityLabel={`Clear search: ${searchQuery}`}
                >
                  <Text style={[styles.activeFilterChipText, { color: colors.text }]}>
                    "{searchQuery}"
                  </Text>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {selectedCategory !== 'all' && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={() => handleCategorySelect('all')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear category filter"
                >
                  <Text style={[styles.activeFilterChipText, { color: colors.text }]}>
                    {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                  </Text>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {selectedLevel !== 'All' && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={() => handleLevelSelect('All')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear level filter"
                >
                  <Text style={[styles.activeFilterChipText, { color: colors.text }]}>
                    {selectedLevel}
                  </Text>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {selectedPriceFilter !== 'all' && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={() => handlePriceFilterSelect('all')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear price filter"
                >
                  <Text style={[styles.activeFilterChipText, { color: colors.text }]}>
                    {selectedPriceFilter === 'free' ? 'Free' : 'Members'}
                  </Text>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.clearAllFiltersBtn}
                onPress={handleClearAllFilters}
                accessibilityRole="button"
                accessibilityLabel="Clear all active filters"
              >
                <Text style={[styles.clearAllFiltersText, { color: colors.primary }]}>
                  {isBangla ? 'সব মুছুন' : 'Clear all'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Content Rendering: Real Courses */}
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
                      setLocalSearch(topic.q);
                      setSearchQuery(topic.q);
                      setSelectedCategory('all');
                      setSelectedLevel('All');
                      setDisplayLimit(24);
                      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
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
                onPress={handleClearAllFilters}
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
            <>
              {filtered.slice(0, displayLimit).map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  horizontal={viewMode === 'list'}
                  onPress={() => onNavigateToCourse(course.id)}
                />
              ))}

              {displayLimit < filtered.length && (
                <TouchableOpacity
                  style={[
                    styles.loadMoreButton,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    triggerHaptic('light');
                    setDisplayLimit((prev) => Math.min(prev + 24, filtered.length));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={isBangla ? 'আরও কোর্স দেখুন' : 'Load more courses'}
                >
                  <Ionicons name="chevron-down-circle-outline" size={18} color={colors.primary} />
                  <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                    {isBangla
                      ? `আরও ২৪টি কোর্স দেখুন (${filtered.length - displayLimit}টি বাকি)`
                      : `Load More Courses (${filtered.length - displayLimit} remaining)`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Dynamic Scroll to Top Quick Pill */}
      <ScrollToTopPill
        visible={showScrollTop}
        onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
        bottomOffset={Math.max(insets.bottom, 16) + 72}
      />
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
    gap: 8,
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
    flexShrink: 0,
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
    gap: 8,
  },
  resultCount: {
    fontSize: 13,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
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
  activeFilterChipsRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  activeFilterChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: shape.full,
    borderWidth: 1,
  },
  activeFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
  loadMoreButton: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: shape.medium,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
