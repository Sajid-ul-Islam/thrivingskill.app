import { useState, useRef, useMemo, useEffect, useCallback, startTransition } from 'react';
import {
  FlatList,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutAnimation,
} from 'react-native';
import { triggerHaptic } from '../../utils/haptics';
import { CANONICAL_DEPARTMENTS_MAP, getCanonicalDepartmentId } from '../../components';
import { getCanonicalCareerTrackCourses } from '../../services/site/siteNavigationService';
import { useLearning } from '../../context/LearningContext';
import { useLanguage } from '../../context/LanguageContext';
import { Course, Category } from '../../types';
import {
  LevelFilter,
  PriceFilter,
  DurationFilter,
  SortOption,
  matchesCourseDepartment,
} from './coursesConstants';

export function useCoursesCatalogState(onOpenSearch?: () => void) {
  const { isBangla } = useLanguage();
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
    toggleBookmark,
    userProgress,
  } = useLearning();

  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('All');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<PriceFilter>('all');
  const [selectedDurationFilter, setSelectedDurationFilter] = useState<DurationFilter>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [quickPeekCourse, setQuickPeekCourse] = useState<Course | null>(null);
  const [isQuickPeekVisible, setIsQuickPeekVisible] = useState(false);

  const flatListRef = useRef<FlatList<any> | null>(null);
  const searchInputRef = useRef<React.ElementRef<typeof TextInput> | null>(null);
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
  }, []);

  const handleOpenQuickPeek = useCallback((c: Course) => {
    triggerHaptic('medium');
    setQuickPeekCourse(c);
    setIsQuickPeekVisible(true);
  }, []);

  const handleCloseQuickPeek = useCallback(() => {
    setIsQuickPeekVisible(false);
  }, []);

  const dynamicDepartments = useMemo(() => {
    const canonicalMap = new Map<
      string,
      { id: string; title: string; slug: string; count: number }
    >();

    (categories || []).forEach((cat) => {
      const slug = (cat.slug || cat.id || '').toLowerCase();
      const canonicalId = getCanonicalDepartmentId(slug, cat.name);
      if (!canonicalId || !CANONICAL_DEPARTMENTS_MAP[canonicalId]) return;

      const conf = CANONICAL_DEPARTMENTS_MAP[canonicalId];
      const title = isBangla ? conf.banglaName : conf.name;
      const count = cat.count || 0;

      if (!canonicalMap.has(canonicalId)) {
        canonicalMap.set(canonicalId, { id: canonicalId, title, slug: canonicalId, count });
      } else {
        const existing = canonicalMap.get(canonicalId)!;
        existing.count = Math.max(existing.count, count);
      }
    });

    Object.entries(CANONICAL_DEPARTMENTS_MAP).forEach(([deptId, conf]) => {
      if (!canonicalMap.has(deptId)) {
        canonicalMap.set(deptId, {
          id: deptId,
          title: isBangla ? conf.banglaName : conf.name,
          slug: deptId,
          count: 0,
        });
      }
    });

    return Array.from(canonicalMap.values()).sort((a, b) => b.count - a.count);
  }, [categories, isBangla]);

  const departmentCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    dynamicDepartments.forEach((dept) => {
      const liveCount = courses.filter((c) => matchesCourseDepartment(c, dept.id)).length;
      map[dept.id] = liveCount > 0 ? liveCount : dept.count || 0;
    });
    return map;
  }, [dynamicDepartments, courses]);

  const departmentSections = useMemo(() => {
    const careerTracks = getCanonicalCareerTrackCourses();
    const list = dynamicDepartments
      .map((dept) => ({
        ...dept,
        courses:
          dept.id === 'career-track'
            ? careerTracks
            : courses.filter((c) => matchesCourseDepartment(c, dept.id)),
      }))
      .filter((d) => d.courses.length > 0);

    if (!list.some((d) => d.id === 'career-track')) {
      list.unshift({
        id: 'career-track',
        title: isBangla ? '🚀 ক্যারিয়ার ট্র্যাক প্রোগ্রাম' : '🚀 Flagship Career Tracks',
        slug: 'career-track',
        count: careerTracks.length,
        courses: careerTracks,
      });
    }

    if (courses.length > 0) {
      const bestsellers = [...courses]
        .filter((c) => (c.rating ?? 0) >= 4.5 || (c.enrolledCount ?? 0) > 50 || c.badge)
        .sort((a, b) => (b.enrolledCount ?? 0) - (a.enrolledCount ?? 0))
        .slice(0, 8);

      if (bestsellers.length >= 3) {
        list.unshift({
          id: 'bestsellers-spotlight',
          title: isBangla ? '🌟 জনপ্রিয় ও টপ-রেটেড কোর্স' : '🌟 Bestsellers & Top Rated',
          slug: 'bestsellers',
          count: bestsellers.length,
          courses: bestsellers,
        });
      }
    }

    return list;
  }, [dynamicDepartments, courses, isBangla]);

  const canonicalCategoryPills = useMemo(() => {
    const totalCount = totalCourseCount || courses.length;
    const list: Category[] = [
      {
        id: 'all',
        name: 'All Courses',
        banglaName: 'সব কোর্স',
        icon: 'grid',
        count: totalCount,
        color: '#102F53',
        slug: 'all',
      },
      {
        id: 'career-track',
        name: 'Career Track',
        banglaName: 'ক্যারিয়ার ট্র্যাক',
        icon: 'ribbon-outline',
        count: 4,
        color: '#102F53',
        slug: 'career-track',
      },
    ];
    dynamicDepartments.forEach((dept) => {
      if (dept.id === 'career-track') return;
      const conf = CANONICAL_DEPARTMENTS_MAP[dept.id];
      list.push({
        id: dept.id,
        name: conf ? conf.name : dept.title,
        banglaName: conf ? conf.banglaName : dept.title,
        count: departmentCountsMap[dept.id] ?? dept.count,
        icon: 'book',
        color: '#102F53',
        slug: dept.slug,
      });
    });
    return list;
  }, [dynamicDepartments, departmentCountsMap, totalCourseCount, courses.length]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setLocalSearch(text);
      if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = setTimeout(() => {
        startTransition(() => setSearchQuery(text));
      }, 90);
    },
    [setSearchQuery]
  );

  const handleClearSearch = useCallback(() => {
    triggerHaptic('light');
    setLocalSearch('');
    startTransition(() => setSearchQuery(''));
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [setSearchQuery]);

  const handleCategorySelect = useCallback(
    (catId: string) => {
      triggerHaptic('selection');
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      startTransition(() => setSelectedCategory(catId));
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    },
    [setSelectedCategory]
  );

  const handleLevelSelect = useCallback((lvl: LevelFilter) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    startTransition(() => setSelectedLevel(lvl));
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleDurationFilterSelect = useCallback((df: DurationFilter) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    startTransition(() => setSelectedDurationFilter(df));
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handlePriceFilterSelect = useCallback((pf: PriceFilter) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    startTransition(() => setSelectedPriceFilter(pf));
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleSortToggle = useCallback(() => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const order: SortOption[] = ['popular', 'newest', 'rating', 'price-low', 'price-high'];
    const nextIdx = (order.indexOf(selectedSort) + 1) % order.length;
    startTransition(() => setSelectedSort(order[nextIdx]));
  }, [selectedSort]);

  const handleClearAllFilters = useCallback(() => {
    triggerHaptic('light');
    setLocalSearch('');
    startTransition(() => {
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedLevel('All');
      setSelectedDurationFilter('all');
      setSelectedPriceFilter('all');
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [setSearchQuery, setSelectedCategory]);

  const categoryIndex = useMemo(() => {
    const map = new Map<string, Course[]>();
    const bundles: Course[] = [];
    for (let i = 0; i < courses.length; i++) {
      const c = courses[i];
      if (
        c.isCareerBundle ||
        c.title.toLowerCase().includes('bundle') ||
        c.slug.toLowerCase().includes('bundle')
      ) {
        bundles.push(c);
      }
      const slugs = new Set<string>();
      if (c.category) slugs.add(c.category);
      c.categorySlugs?.forEach((s) => {
        if (s) slugs.add(s);
      });
      slugs.forEach((s) => {
        let list = map.get(s);
        if (!list) {
          list = [];
          map.set(s, list);
        }
        list.push(c);
      });
    }
    const careerTracks = getCanonicalCareerTrackCourses();
    map.set('career-track', [...careerTracks, ...bundles]);
    return map;
  }, [courses]);

  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const cat = selectedCategory;
    const isDeptFilter = dynamicDepartments.some((d) => d.id === cat || d.slug === cat);

    let candidateList: Course[];
    if (cat === 'all') {
      candidateList = courses;
    } else if (cat === 'career-track') {
      candidateList = categoryIndex.get('career-track') || getCanonicalCareerTrackCourses();
    } else if (isDeptFilter) {
      candidateList = courses.filter((c) => matchesCourseDepartment(c, cat));
    } else if (cat === 'bundle' || cat === 'bundle-courses') {
      candidateList = courses.filter(
        (c) =>
          c.isCareerBundle === true ||
          c.title.toLowerCase().includes('bundle') ||
          c.category === 'special-bundle'
      );
    } else if (cat === 'thrive-gen') {
      candidateList = courses.filter((c) => {
        const t = c.title.toLowerCase();
        const slugs = c.categorySlugs || [];
        return (
          [
            'english',
            'mindset',
            'habits',
            'notebooklm',
            'linkedin',
            'presentation',
            'research',
            'interview',
            'job',
          ].some((kw) => t.includes(kw)) ||
          slugs.some((s) =>
            ['thrive', 'ssc', 'hsc', 'honours', 'masters'].some((kw) => s.includes(kw))
          )
        );
      });
    } else {
      candidateList =
        categoryIndex.get(cat) ||
        courses.filter(
          (c) =>
            c.category === cat ||
            c.categorySlugs?.some((s) => s === cat || s.includes(cat) || cat.includes(s))
        );
    }

    const matched = candidateList.filter((course) => {
      if (
        selectedLevel !== 'All' &&
        course.level !== selectedLevel &&
        course.level !== 'All Levels'
      ) {
        return false;
      }
      if (selectedDurationFilter !== 'all') {
        const dHours = course.durationHours || 0;
        if (selectedDurationFilter === 'short' && dHours > 3) return false;
        if (selectedDurationFilter === 'in-depth' && dHours <= 3) return false;
      }
      if (selectedPriceFilter !== 'all') {
        const isFree =
          (!course.price || course.price === 0) && (!course.priceBdt || course.priceBdt === 0);
        if (selectedPriceFilter === 'free' && !isFree) return false;
        if (selectedPriceFilter === 'paid' && isFree) return false;
      }
      if (q) {
        if (course._searchIndex) {
          if (!course._searchIndex.includes(q)) return false;
        } else {
          const hay =
            `${course.title} ${course.subtitle || ''} ${course.instructor?.name || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
      }
      return true;
    });

    if (selectedSort === 'newest') matched.sort((a, b) => Number(b.id) - Number(a.id));
    else if (selectedSort === 'rating') matched.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (selectedSort === 'price-low')
      matched.sort((a, b) => (a.priceBdt ?? 0) - (b.priceBdt ?? 0));
    else if (selectedSort === 'price-high')
      matched.sort((a, b) => (b.priceBdt ?? 0) - (a.priceBdt ?? 0));
    else matched.sort((a, b) => (b.enrolledCount ?? 0) - (a.enrolledCount ?? 0));

    return matched;
  }, [
    courses,
    categoryIndex,
    dynamicDepartments,
    selectedCategory,
    selectedLevel,
    selectedDurationFilter,
    selectedPriceFilter,
    selectedSort,
    searchQuery,
  ]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      if (offsetY > 8 && !isScrolled) setIsScrolled(true);
      else if (offsetY <= 8 && isScrolled) setIsScrolled(false);
      if (offsetY > 70 && !showHeaderSearch) setShowHeaderSearch(true);
      else if (offsetY <= 70 && showHeaderSearch) setShowHeaderSearch(false);
      if (offsetY > 450 && !showScrollTop) setShowScrollTop(true);
      else if (offsetY <= 450 && showScrollTop) setShowScrollTop(false);
    },
    [isScrolled, showHeaderSearch, showScrollTop]
  );

  const handleHeaderSearchPress = useCallback(() => {
    if (onOpenSearch) onOpenSearch();
    else {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      searchInputRef.current?.focus();
    }
  }, [onOpenSearch]);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedLevel !== 'All' ||
    selectedDurationFilter !== 'all' ||
    selectedPriceFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const isBrowsingDepartments = selectedCategory === 'all' && !hasActiveFilters;

  const handleDeptCardPress = useCallback(
    (deptId: string) => {
      triggerHaptic('selection');
      if (deptId === 'bestsellers-spotlight') {
        setSelectedSort('popular');
        handleCategorySelect('all');
        return;
      }
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

  return {
    courses,
    totalCourseCount,
    isLoadingCourses,
    coursesError,
    refreshCourses,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    bookmarks,
    toggleBookmark,
    userProgress,
    selectedLevel,
    setSelectedLevel,
    selectedPriceFilter,
    setSelectedPriceFilter,
    selectedDurationFilter,
    selectedSort,
    viewMode,
    setViewMode,
    showHeaderSearch,
    isScrolled,
    showScrollTop,
    localSearch,
    setLocalSearch,
    quickPeekCourse,
    isQuickPeekVisible,
    flatListRef,
    searchInputRef,
    dynamicDepartments,
    departmentCountsMap,
    departmentSections,
    canonicalCategoryPills,
    filtered,
    hasActiveFilters,
    isBrowsingDepartments,
    handleOpenQuickPeek,
    handleCloseQuickPeek,
    handleSearchChange,
    handleClearSearch,
    handleCategorySelect,
    handleLevelSelect,
    handleDurationFilterSelect,
    handlePriceFilterSelect,
    handleSortToggle,
    handleClearAllFilters,
    handleScroll,
    handleHeaderSearchPress,
    handleDeptCardPress,
  };
}
