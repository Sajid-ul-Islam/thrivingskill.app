import React, { useState, useRef, useMemo, useEffect, useCallback, startTransition } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ListRenderItem,
  LayoutAnimation,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLearning } from '../context/LearningContext';
import {
  Header,
  CategoryPills,
  CourseCard,
  CourseCardSkeleton,
  StateView,
  ScrollToTopPill,
} from '../components';
import { triggerHaptic } from '../utils/haptics';
import { shape } from '../theme/shapes';
import { MIN_TOUCH_TARGET } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import { Course } from '../types';

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
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();
  const { isTablet, isLandscape, numColumns, containerClampStyle, width } = useResponsive();
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
    bookmarks,
    userProgress,
  } = useLearning();

  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('All');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<PriceFilter>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  const departments = useMemo(() => [
    { id: 'generative-ai', title: isBangla ? 'জেনারেটিভ এআই' : 'Generative AI', icon: 'sparkles', color: '#6366F1' },
    { id: 'sales-marketing', title: isBangla ? 'মার্কেটিং' : 'Marketing', icon: 'megaphone', color: '#EC4899' },
    { id: 'supply-chain-management', title: isBangla ? 'সাপ্লাই চেইন' : 'Supply Chain', icon: 'cube', color: '#F59E0B' },
    { id: 'human-resource-management', title: isBangla ? 'এইচআর ম্যানেজমেন্ট' : 'Human Resource', icon: 'people', color: '#10B981' },
    { id: 'finance-accounting-legal', title: isBangla ? 'ফাইন্যান্স ও ট্যাক্স' : 'Finance & Accounts', icon: 'calculator', color: '#0EA5E9' },
    { id: 'microsoft-excel-courses', title: isBangla ? 'এক্সেল ও ডেটা' : 'Excel & Analytics', icon: 'stats-chart', color: '#8B5CF6' },
    { id: 'leadership-management', title: isBangla ? 'লিডারশিপ' : 'Leadership', icon: 'trophy', color: '#F97316' },
    { id: 'bundle', title: isBangla ? 'স্পেশাল বান্ডেল' : 'Special Bundles', icon: 'layers', color: '#E11D48' },
  ], [isBangla]);

  const departmentSections = useMemo(() => {
    return departments
      .map((dept) => {
        const deptCourses = courses.filter((c) => {
          if (dept.id === 'bundle') {
            return c.category === 'bundle' || c.title.toLowerCase().includes('bundle');
          }
          if (c.category === dept.id) return true;
          if (c.categorySlugs && c.categorySlugs.some((s) => s.includes(dept.id) || dept.id.includes(s))) return true;
          const lowerCat = (c.category || '').toLowerCase();
          const lowerTitle = (c.title || '').toLowerCase();
          if (dept.id === 'generative-ai' && (lowerCat.includes('ai') || lowerTitle.includes('ai') || lowerCat.includes('prompt'))) return true;
          if (dept.id === 'sales-marketing' && (lowerCat.includes('market') || lowerCat.includes('sales') || lowerTitle.includes('marketing'))) return true;
          if (dept.id === 'supply-chain-management' && (lowerCat.includes('supply') || lowerCat.includes('logistics') || lowerTitle.includes('supply chain'))) return true;
          if (dept.id === 'human-resource-management' && (lowerCat.includes('hr') || lowerCat.includes('human') || lowerCat.includes('resource') || lowerTitle.includes('hr'))) return true;
          if (dept.id === 'finance-accounting-legal' && (lowerCat.includes('finan') || lowerCat.includes('account') || lowerCat.includes('tax') || lowerTitle.includes('tax') || lowerTitle.includes('financial'))) return true;
          if (dept.id === 'microsoft-excel-courses' && (lowerCat.includes('excel') || lowerTitle.includes('excel') || lowerCat.includes('data'))) return true;
          if (dept.id === 'leadership-management' && (lowerCat.includes('leader') || lowerCat.includes('manage') || lowerTitle.includes('leadership'))) return true;
          return false;
        });
        return {
          ...dept,
          courses: deptCourses,
        };
      })
      .filter((d) => d.courses.length > 0);
  }, [departments, courses]);

  const flatListRef = useRef<FlatList<any> | null>(null);
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
      startTransition(() => {
        setSearchQuery(text);
      });
    }, 90);
  }, [setSearchQuery]);

  const handleClearSearch = useCallback(() => {
    triggerHaptic('light');
    setLocalSearch('');
    startTransition(() => {
      setSearchQuery('');
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [setSearchQuery]);

  // Filter Selection Handlers with React 19 Concurrent Transitions & instant scroll-to-top
  const handleCategorySelect = useCallback((catId: string) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    startTransition(() => {
      setSelectedCategory(catId);
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [setSelectedCategory]);

  const handleLevelSelect = useCallback((lvl: LevelFilter) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    startTransition(() => {
      setSelectedLevel(lvl);
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handlePriceFilterSelect = useCallback((pf: PriceFilter) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    startTransition(() => {
      setSelectedPriceFilter(pf);
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleSortToggle = useCallback(() => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const order: SortOption[] = ['popular', 'newest', 'rating', 'price-low', 'price-high'];
    const nextIdx = (order.indexOf(selectedSort) + 1) % order.length;
    startTransition(() => {
      setSelectedSort(order[nextIdx]);
    });
  }, [selectedSort]);

  const handleClearAllFilters = useCallback(() => {
    triggerHaptic('light');
    setLocalSearch('');
    startTransition(() => {
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedLevel('All');
      setSelectedPriceFilter('all');
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [setSearchQuery, setSelectedCategory]);

  const levelLabels: Record<LevelFilter, { en: string; bn: string }> = {
    All: { en: 'All', bn: 'সব' },
    Beginner: { en: 'Beginner', bn: 'বিগিনার' },
    Intermediate: { en: 'Intermediate', bn: 'মিড-লেভেল' },
    Advanced: { en: 'Advanced', bn: 'অ্যাডভান্সড' },
  };

  // 1. Pre-build inverted category index Map for O(1) category access
  const categoryIndex = useMemo(() => {
    const map = new Map<string, Course[]>();
    const bundles: Course[] = [];

    for (let i = 0; i < courses.length; i++) {
      const c = courses[i];
      // Check special bundles
      if (
        c.isCareerBundle ||
        c.title.toLowerCase().includes('bundle') ||
        c.slug.toLowerCase().includes('bundle')
      ) {
        bundles.push(c);
      }

      // Check category and categorySlugs
      const slugs = new Set<string>();
      if (c.category) slugs.add(c.category);
      if (c.categorySlugs && c.categorySlugs.length > 0) {
        for (let j = 0; j < c.categorySlugs.length; j++) {
          if (c.categorySlugs[j]) slugs.add(c.categorySlugs[j]);
        }
      }

      slugs.forEach((s) => {
        let list = map.get(s);
        if (!list) {
          list = [];
          map.set(s, list);
        }
        list.push(c);
      });
    }

    map.set('career-track', bundles);
    return map;
  }, [courses]);

  // 2. High-Performance Memoized Filtering & Sorting:
  // Evaluates in sub-millisecond time and caches results
  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const cat = selectedCategory;
    const lvl = selectedLevel;
    const pf = selectedPriceFilter;
    const sort = selectedSort;

    // Fast-path: O(1) candidate category pool
    let candidateList: Course[];
    if (cat === 'all') {
      candidateList = courses;
    } else if (cat === 'bundle') {
      candidateList = courses.filter((c) => c.isCareerBundle === true || c.title.includes('Bundle') || c.category === 'special-bundle');
    } else {
      const indexed = categoryIndex.get(cat);
      if (indexed) {
        candidateList = indexed;
      } else {
        // Fallback for partial category match
        candidateList = courses.filter((c) => {
          const directMatch = c.category === cat;
          const slugList = c.categorySlugs;
          const slugMatch =
            slugList &&
            (slugList.includes(cat) ||
              slugList.some((s) => s.includes(cat) || cat.includes(s)));
          return directMatch || slugMatch;
        });
      }
    }

    const matched = candidateList.filter((course) => {
      // Level check
      if (lvl !== 'All') {
        if (course.level !== lvl && course.level !== 'All Levels') return false;
      }

      // Price check
      if (pf !== 'all') {
        const isFree = (!course.price || course.price === 0) && (!course.priceBdt || course.priceBdt === 0);
        if (pf === 'free' && !isFree) return false;
        if (pf === 'paid' && isFree) return false;
      }

      // Search query check using pre-computed search index (zero string allocations)
      if (q) {
        if (course._searchIndex) {
          if (!course._searchIndex.includes(q)) return false;
        } else {
          const titleMatch = course.title.toLowerCase().includes(q);
          const subMatch = course.subtitle?.toLowerCase().includes(q);
          const instMatch = course.instructor?.name?.toLowerCase().includes(q);
          if (!titleMatch && !subMatch && !instMatch) return false;
        }
      }

      return true;
    });

    // Fast sort in place
    if (sort === 'newest') {
      matched.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sort === 'rating') {
      matched.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'price-low') {
      matched.sort((a, b) => {
        const priceA = a.priceBdt ?? (typeof a.price === 'number' ? a.price * 120 : 0);
        const priceB = b.priceBdt ?? (typeof b.price === 'number' ? b.price * 120 : 0);
        return priceA - priceB;
      });
    } else if (sort === 'price-high') {
      matched.sort((a, b) => {
        const priceA = a.priceBdt ?? (typeof a.price === 'number' ? a.price * 120 : 0);
        const priceB = b.priceBdt ?? (typeof b.price === 'number' ? b.price * 120 : 0);
        return priceB - priceA;
      });
    } else {
      matched.sort((a, b) => b.enrolledCount - a.enrolledCount);
    }

    return matched;
  }, [courses, categoryIndex, selectedCategory, selectedLevel, selectedPriceFilter, selectedSort, searchQuery]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
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
  }, [isScrolled, showHeaderSearch, showScrollTop]);

  const handleHeaderSearchPress = useCallback(() => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      searchInputRef.current?.focus();
    }
  }, [onOpenSearch]);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedLevel !== 'All' ||
    selectedPriceFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const isBrowsingDepartments = selectedCategory === 'all' && !hasActiveFilters;

  const effectiveColumns = useMemo(() => {
    if (isBrowsingDepartments) return 1;
    if (viewMode === 'list') return isTablet && isLandscape ? 2 : 1;
    return numColumns;
  }, [isBrowsingDepartments, viewMode, isTablet, isLandscape, numColumns]);

  const handleDeptCardPress = useCallback(
    (deptId: string) => {
      triggerHaptic('selection');
      if (isBrowsingDepartments) {
        const idx = departmentSections.findIndex((d) => d.id === deptId);
        if (idx !== -1 && flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
          } catch {
            flatListRef.current.scrollToOffset({ offset: Math.max(0, idx * 300), animated: true });
          }
          return;
        }
      }
      handleCategorySelect(deptId);
    },
    [isBrowsingDepartments, departmentSections, handleCategorySelect]
  );

  const catalogCount = totalCourseCount || courses.length || 382;

  // Render course item or department carousel row
  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (isBrowsingDepartments) {
        const dept = item as {
          id: string;
          title: string;
          icon: string;
          color: string;
          courses: Course[];
        };
        const deptItemCount = dept.courses.length;
        const effectiveWidth = Math.min(width, 1100);
        const deptCardWidth = isTablet
          ? isLandscape
            ? Math.max(280, Math.floor((effectiveWidth - 48) / 3.2))
            : Math.max(300, Math.floor((effectiveWidth - 48) / 2.2))
          : Math.min(270, Math.max(240, Math.round(width * 0.68)));

        return (
          <View style={styles.deptRowSection}>
            <View style={styles.deptRowHeader}>
              <View style={styles.deptRowTitleRow}>
                <View style={[styles.deptIconCircle, { backgroundColor: dept.color + '18' }]}>
                  <Ionicons name={dept.icon as any} size={15} color={dept.color} />
                </View>
                <Text style={[styles.deptRowTitle, { color: colors.text }]}>
                  {dept.title}
                </Text>
                <View style={[styles.deptCountBadge, { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' }]}>
                  <Text style={[styles.deptCountText, { color: colors.textMuted }]}>
                    {dept.courses.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  handleCategorySelect(dept.id);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.seeAllTouch}
                accessibilityRole="button"
                accessibilityLabel={`See all ${dept.title} courses`}
              >
                <Text style={[styles.seeAllDeptText, { color: colors.primary }]}>
                  {isBangla ? 'সবগুলো দেখুন →' : 'See All →'}
                </Text>
              </TouchableOpacity>
            </View>

            {deptItemCount === 1 ? (
              <View style={{ paddingHorizontal: 16 }}>
                <CourseCard
                  course={dept.courses[0]}
                  horizontal={true}
                  isBookmarked={bookmarks.includes(dept.courses[0].id)}
                  isEnrolled={!!userProgress[dept.courses[0].id]}
                  onPress={() => onNavigateToCourse(dept.courses[0].id)}
                />
              </View>
            ) : isTablet && deptItemCount === 2 && !isLandscape ? (
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
                {dept.courses.map((courseItem) => (
                  <View key={`dept-course-${dept.id}-${courseItem.id}`} style={{ flex: 1 }}>
                    <CourseCard
                      course={courseItem}
                      isBookmarked={bookmarks.includes(courseItem.id)}
                      isEnrolled={!!userProgress[courseItem.id]}
                      onPress={() => onNavigateToCourse(courseItem.id)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <FlatList
                data={dept.courses}
                keyExtractor={(c) => `dept-course-${dept.id}-${c.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.deptCarouselContent}
                initialNumToRender={isTablet ? 4 : 3}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews={Platform.OS === 'android'}
                renderItem={({ item: courseItem }) => (
                  <View style={{ width: deptCardWidth }}>
                    <CourseCard
                      course={courseItem}
                      isBookmarked={bookmarks.includes(courseItem.id)}
                      isEnrolled={!!userProgress[courseItem.id]}
                      onPress={() => onNavigateToCourse(courseItem.id)}
                    />
                  </View>
                )}
              />
            )}
          </View>
        );
      }

      return (
        <View style={[styles.cardItemWrapper, effectiveColumns > 1 && styles.gridCardItem]}>
          <CourseCard
            course={item as Course}
            horizontal={viewMode === 'list'}
            isBookmarked={bookmarks.includes((item as Course).id)}
            isEnrolled={!!userProgress[(item as Course).id]}
            onPress={() => onNavigateToCourse(item.id)}
          />
        </View>
      );
    },
    [isBrowsingDepartments, colors, isDark, isBangla, handleCategorySelect, onNavigateToCourse, viewMode, bookmarks, userProgress, effectiveColumns, width, isTablet, isLandscape]
  );

  const keyExtractor = useCallback(
    (item: any) => (isBrowsingDepartments ? `dept-sec-${item.id}` : item.id),
    [isBrowsingDepartments]
  );

  // List Header Component containing all interactive controls
  const renderHeader = useMemo(() => {
    return (
      <View>
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

        {/* CR-4: Department-wise Category Navigation Grid */}
        <View style={styles.deptGridSection}>
          <View style={styles.deptHeaderRow}>
            <Text style={[styles.deptSectionTitle, { color: colors.text }]}>
              {isBangla ? 'ক্যাটাগরি বিভাগ' : 'Department Categories'}
            </Text>
            {selectedCategory !== 'all' && (
              <TouchableOpacity
                onPress={() => handleCategorySelect('all')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Show all categories"
              >
                <Text style={[styles.resetCatText, { color: colors.primary }]}>
                  {isBangla ? 'সকল কোর্স দেখুন →' : 'View All →'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.deptGridCards}>
            {departments.map((dept) => {
              const isSelected = selectedCategory === dept.id;
              return (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.deptCard,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : (isDark ? colors.surfaceCard : '#FFFFFF'),
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleDeptCardPress(dept.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter or jump to ${dept.title}`}
                >
                  <View style={[styles.deptIconCircle, { backgroundColor: dept.color + '18' }]}>
                    <Ionicons name={dept.icon as any} size={18} color={dept.color} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[
                        styles.deptCardTitle,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {dept.title}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                    size={14}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
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
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
            {/* Free / Paid / All Segmented Pills */}
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
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
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
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
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
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
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
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
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
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Text style={[styles.clearAllFiltersText, { color: colors.primary }]}>
                  {isBangla ? 'সব মুছুন' : 'Clear all'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>
    );
  }, [
    colors,
    isBangla,
    localSearch,
    handleSearchChange,
    handleClearSearch,
    selectedCategory,
    categories,
    handleCategorySelect,
    selectedLevel,
    handleLevelSelect,
    levelLabels,
    viewMode,
    filtered.length,
    selectedPriceFilter,
    handlePriceFilterSelect,
    selectedSort,
    handleSortToggle,
    hasActiveFilters,
    searchQuery,
    handleClearAllFilters,
  ]);

  // List Empty Component (skeleton / error / empty search)
  const renderEmpty = useMemo(() => {
    if (isLoadingCourses && courses.length === 0) {
      return (
        <View style={styles.coursesContainer}>
          <CourseCardSkeleton horizontal={viewMode === 'list'} />
          <CourseCardSkeleton horizontal={viewMode === 'list'} />
          <CourseCardSkeleton horizontal={viewMode === 'list'} />
        </View>
      );
    }

    if (coursesError && courses.length === 0) {
      return (
        <View style={styles.coursesContainer}>
          <StateView
            mode="error"
            title={isBangla ? 'ক্যাটালগ লোড করা যায়নি' : 'Could not load catalog'}
            message={coursesError}
            primaryActionLabel={isBangla ? 'আবার চেষ্টা করুন' : 'Retry'}
            onPrimaryAction={refreshCourses}
          />
        </View>
      );
    }

    return (
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
                startTransition(() => {
                  setSearchQuery(topic.q);
                  setSelectedCategory('all');
                  setSelectedLevel('All');
                });
                flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
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
    );
  }, [
    isLoadingCourses,
    courses.length,
    viewMode,
    coursesError,
    isBangla,
    refreshCourses,
    colors,
    searchQuery,
    selectedCategory,
    handleClearAllFilters,
    setSearchQuery,
    setSelectedCategory,
  ]);

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

      <FlatList
        key={`courses-flatlist-cols-${effectiveColumns}-${viewMode}`}
        ref={flatListRef}
        data={isBrowsingDepartments ? (departmentSections as any[]) : filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={effectiveColumns}
        columnWrapperStyle={effectiveColumns > 1 ? styles.gridColumnWrapper : undefined}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          containerClampStyle,
          { paddingBottom: Math.max(insets.bottom, 16) + 84 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        updateCellsBatchingPeriod={50}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, info.averageItemLength * info.index),
            animated: true,
          });
        }}
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
      />

      {/* Dynamic Scroll to Top Quick Pill */}
      <ScrollToTopPill
        visible={showScrollTop}
        onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
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
  deptGridSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  deptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deptSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  resetCatText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deptGridCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  deptCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: shape.small,
    borderWidth: 1,
    gap: 6,
    minHeight: 44,
  },
  deptIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deptCardTitle: {
    fontSize: 11.5,
    fontWeight: '700',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    borderRadius: shape.full,
    borderWidth: 1,
  },
  activeFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  cardItemWrapper: {
    paddingHorizontal: 16,
  },
  gridColumnWrapper: {
    paddingHorizontal: 12,
    gap: 12,
  },
  gridCardItem: {
    flex: 1,
    paddingHorizontal: 0,
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
  deptRowSection: {
    marginTop: 14,
    marginBottom: 8,
  },
  deptRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  deptRowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  deptRowTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  deptCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  deptCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  seeAllTouch: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  seeAllDeptText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deptCarouselContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  deptCardItemWrap: {
    width: 250,
  },
});
