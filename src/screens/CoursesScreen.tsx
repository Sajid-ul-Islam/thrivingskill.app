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
  DepartmentCategoryGrid,
  CategoryIllustrationIcon,
  CourseQuickPeekModal,
  StaggeredFadeIn,
  CANONICAL_DEPARTMENTS_MAP,
  getCanonicalDepartmentId,
} from '../components';
import { triggerHaptic } from '../utils/haptics';
import { shape } from '../theme/shapes';
import { MIN_TOUCH_TARGET } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import { Course, Category } from '../types';

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
type DurationFilter = 'all' | 'short' | 'in-depth';
type SortOption = 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high';

interface HotTopicItem {
  id: string;
  label: string;
  bnLabel: string;
  icon: string;
  type: 'dept' | 'price_free' | 'all';
}

const HOT_TOPICS: HotTopicItem[] = [
  { id: 'all', label: 'All Courses', bnLabel: 'সব কোর্স', icon: 'sparkles', type: 'all' },
  {
    id: 'thrive-gen',
    label: 'Thrive Gen (Youth)',
    bnLabel: 'থ্রাইভ জেন (ছাত্রছাত্রী)',
    icon: 'school-outline',
    type: 'dept',
  },
  {
    id: 'bundle-courses',
    label: 'Career Bundles',
    bnLabel: 'ক্যারিয়ার বান্ডেল',
    icon: 'layers-outline',
    type: 'dept',
  },
  {
    id: 'generative-ai',
    label: 'AI & ChatGPT',
    bnLabel: 'এআই ও চ্যাটজিপিটি',
    icon: 'hardware-chip-outline',
    type: 'dept',
  },
  {
    id: 'microsoft-excel-courses',
    label: 'Excel Mastery',
    bnLabel: 'এক্সেল স্প্রেডশিট',
    icon: 'grid-outline',
    type: 'dept',
  },
  {
    id: 'free-offer',
    label: '100% Free',
    bnLabel: 'সম্পূর্ণ ফ্রি',
    icon: 'gift-outline',
    type: 'price_free',
  },
  {
    id: 'human-resource-management',
    label: 'HR Management',
    bnLabel: 'এইচআর ম্যানেজমেন্ট',
    icon: 'people-outline',
    type: 'dept',
  },
  {
    id: 'supply-chain-management',
    label: 'Supply Chain',
    bnLabel: 'সাপ্লাই চেইন',
    icon: 'cube-outline',
    type: 'dept',
  },
  {
    id: 'leadership-management',
    label: 'Leadership',
    bnLabel: 'লিডারশিপ',
    icon: 'compass-outline',
    type: 'dept',
  },
  {
    id: 'job-seekers-skills',
    label: 'Career & Jobs',
    bnLabel: 'চাকরি ও ক্যারিয়ার',
    icon: 'briefcase-outline',
    type: 'dept',
  },
];

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

  const handleOpenQuickPeek = useCallback((c: Course) => {
    triggerHaptic('medium');
    setQuickPeekCourse(c);
    setIsQuickPeekVisible(true);
  }, []);

  const handleCloseQuickPeek = useCallback(() => {
    setIsQuickPeekVisible(false);
  }, []);

  // Helper to match courses against dynamic site categories
  const matchesDepartment = useCallback((c: Course, deptId: string): boolean => {
    const dId = (deptId || '').toLowerCase();
    const lowerCat = (c.category || '').toLowerCase();
    const slugs = (c.categorySlugs || []).map((s) => s.toLowerCase());

    if (lowerCat === dId || slugs.includes(dId)) return true;

    // 1. Business Strategy & Consulting (must precede general business check)
    if (dId === 'business-strategy' || dId.includes('strategy')) {
      return lowerCat.includes('strategy') || slugs.some((s) => s.includes('strategy'));
    }

    // 2. Microsoft Excel & Spreadsheets
    if (dId.includes('excel')) {
      return lowerCat.includes('excel') || slugs.some((s) => s.includes('excel'));
    }

    // 3. Generative AI & 4IR
    if (dId.includes('generative') || dId.includes('ai') || dId === '4ir') {
      return (
        lowerCat.includes('generative') ||
        lowerCat.includes('4ir') ||
        /\bai\b/i.test(lowerCat) ||
        slugs.some((s) => s.includes('generative') || s.includes('4ir') || /\bai\b/i.test(s))
      );
    }

    // 4. Finance, Accounting & Legal
    if (dId.includes('finance') || dId.includes('account') || dId.includes('legal')) {
      return (
        lowerCat.includes('finance') ||
        lowerCat.includes('account') ||
        lowerCat.includes('legal') ||
        slugs.some((s) => s.includes('finance') || s.includes('account') || s.includes('legal'))
      );
    }

    // 5. Sales & Marketing
    if (dId.includes('marketing') || dId.includes('sales')) {
      return (
        lowerCat.includes('marketing') ||
        lowerCat.includes('sales') ||
        slugs.some((s) => s.includes('marketing') || s.includes('sales'))
      );
    }

    // 6. Human Resource Management (HRM)
    if (dId.includes('human-resource') || dId.includes('hrm') || dId.includes('hr')) {
      return (
        lowerCat.includes('human') ||
        /\bhr\b/i.test(lowerCat) ||
        slugs.some((s) => s.includes('human') || /\bhr\b/i.test(s) || s.includes('hrm'))
      );
    }

    // 7. Supply Chain & Logistics
    if (dId.includes('supply-chain') || dId.includes('supply') || dId.includes('logistics')) {
      return (
        lowerCat.includes('supply') ||
        lowerCat.includes('logistics') ||
        slugs.some((s) => s.includes('supply') || s.includes('logistics'))
      );
    }

    // 8. Personal Development & Soft Skills
    if (dId.includes('personal-development') || dId.includes('personal')) {
      return (
        lowerCat.includes('personal') ||
        lowerCat.includes('habit') ||
        slugs.some(
          (s) => s.includes('personal') || s.includes('habit') || s.includes('productivity')
        )
      );
    }

    // 9. Leadership & Management
    if (dId.includes('leadership')) {
      return lowerCat.includes('leadership') || slugs.some((s) => s.includes('leadership'));
    }

    // 10. Data Science & Big Data
    if (dId.includes('data')) {
      return (
        lowerCat.includes('data') ||
        lowerCat.includes('analytics') ||
        slugs.some((s) => s.includes('data') || s.includes('analytics'))
      );
    }

    // 11. General Business & Administration (excluding strategy)
    if (dId.includes('business')) {
      const isStrategy = lowerCat.includes('strategy') || slugs.some((s) => s.includes('strategy'));
      if (isStrategy) return false;
      return lowerCat.includes('business') || slugs.some((s) => s.includes('business'));
    }

    // 12. Career Bundles
    if (dId.includes('bundle')) {
      return (
        c.isCareerBundle || c.title.toLowerCase().includes('bundle') || lowerCat.includes('bundle')
      );
    }

    // 13. Research & Academic
    if (dId.includes('research') || dId.includes('academic')) {
      return (
        lowerCat.includes('research') ||
        lowerCat.includes('academic') ||
        slugs.some((s) => s.includes('research') || s.includes('academic'))
      );
    }

    // 14. Job Seekers Skills
    if (dId.includes('job') || dId.includes('career')) {
      return (
        lowerCat.includes('job') ||
        lowerCat.includes('career') ||
        slugs.some((s) => s.includes('job') || s.includes('career'))
      );
    }

    return false;
  }, []);

  // Dynamically source canonical departments from the authentic live site categories
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
        canonicalMap.set(canonicalId, {
          id: canonicalId,
          title,
          slug: canonicalId,
          count,
        });
      } else {
        const existing = canonicalMap.get(canonicalId)!;
        existing.count = Math.max(existing.count, count);
      }
    });

    // Fallback: If network categories are empty or incomplete, guarantee all canonical departments exist
    Object.entries(CANONICAL_DEPARTMENTS_MAP).forEach(([deptId, conf]) => {
      if (!canonicalMap.has(deptId)) {
        const title = isBangla ? conf.banglaName : conf.name;
        canonicalMap.set(deptId, {
          id: deptId,
          title,
          slug: deptId,
          count: 0,
        });
      }
    });

    const list = Array.from(canonicalMap.values());
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [categories, isBangla]);

  const departmentCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    dynamicDepartments.forEach((dept) => {
      const liveCount = courses.filter((c) => matchesDepartment(c, dept.id)).length;
      map[dept.id] = liveCount > 0 ? liveCount : dept.count || 0;
    });
    return map;
  }, [dynamicDepartments, courses, matchesDepartment]);

  const departmentSections = useMemo(() => {
    const list = dynamicDepartments
      .map((dept) => {
        const deptCourses = courses.filter((c) => matchesDepartment(c, dept.id));
        return {
          ...dept,
          courses: deptCourses,
        };
      })
      .filter((d) => d.courses.length > 0);

    // Dynamic R&D: Add "🌟 Bestsellers & Top Rated" as the leading curated spotlight ribbon
    if (courses.length > 0) {
      const bestsellers = [...courses]
        .filter((c) => c.rating >= 4.5 || c.enrolledCount > 50 || c.badge)
        .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
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
  }, [dynamicDepartments, courses, matchesDepartment, isBangla]);

  // Clean canonical category pills for filter bar
  const canonicalCategoryPills = useMemo(() => {
    const totalCount = totalCourseCount || courses.length;
    const list: Category[] = [
      {
        id: 'all',
        name: 'All Courses',
        banglaName: 'সব কোর্স',
        icon: 'grid',
        count: totalCount,
        color: '#059669',
        slug: 'all',
      },
    ];

    dynamicDepartments.forEach((dept) => {
      const conf = CANONICAL_DEPARTMENTS_MAP[dept.id];
      list.push({
        id: dept.id,
        name: conf ? conf.name : dept.title,
        banglaName: conf ? conf.banglaName : dept.title,
        count: departmentCountsMap[dept.id] ?? dept.count,
        icon: 'book',
        color: '#4F46E5',
        slug: dept.slug,
      });
    });

    return list;
  }, [dynamicDepartments, departmentCountsMap, totalCourseCount, courses.length]);

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
  const handleSearchChange = useCallback(
    (text: string) => {
      setLocalSearch(text);
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
      searchDebounceTimerRef.current = setTimeout(() => {
        startTransition(() => {
          setSearchQuery(text);
        });
      }, 90);
    },
    [setSearchQuery]
  );

  const handleClearSearch = useCallback(() => {
    triggerHaptic('light');
    setLocalSearch('');
    startTransition(() => {
      setSearchQuery('');
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [setSearchQuery]);

  // Filter Selection Handlers with React 19 Concurrent Transitions & instant scroll-to-top
  const handleCategorySelect = useCallback(
    (catId: string) => {
      triggerHaptic('selection');
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      startTransition(() => {
        setSelectedCategory(catId);
      });
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    },
    [setSelectedCategory]
  );

  const handleLevelSelect = useCallback((lvl: LevelFilter) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    startTransition(() => {
      setSelectedLevel(lvl);
    });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleDurationFilterSelect = useCallback((df: DurationFilter) => {
    triggerHaptic('selection');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    startTransition(() => {
      setSelectedDurationFilter(df);
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
      setSelectedDurationFilter('all');
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
    const isDeptFilter = dynamicDepartments.some((d) => d.id === cat || d.slug === cat);
    if (cat === 'all') {
      candidateList = courses;
    } else if (isDeptFilter) {
      candidateList = courses.filter((c) => matchesDepartment(c, cat));
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
          t.includes('english') ||
          t.includes('mindset') ||
          t.includes('habits') ||
          t.includes('notebooklm') ||
          t.includes('linkedin') ||
          t.includes('presentation') ||
          t.includes('research') ||
          t.includes('interview') ||
          t.includes('job') ||
          slugs.some(
            (s) =>
              s.includes('thrive') ||
              s.includes('ssc') ||
              s.includes('hsc') ||
              s.includes('honours') ||
              s.includes('masters')
          )
        );
      });
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
            (slugList.includes(cat) || slugList.some((s) => s.includes(cat) || cat.includes(s)));
          return directMatch || slugMatch;
        });
      }
    }

    const matched = candidateList.filter((course) => {
      // Level check
      if (lvl !== 'All') {
        if (course.level !== lvl && course.level !== 'All Levels') return false;
      }

      // Duration check
      if (selectedDurationFilter !== 'all') {
        const dHours = course.durationHours || 0;
        if (selectedDurationFilter === 'short' && dHours > 3) return false;
        if (selectedDurationFilter === 'in-depth' && dHours <= 3) return false;
      }

      // Price check
      if (pf !== 'all') {
        const isFree =
          (!course.price || course.price === 0) && (!course.priceBdt || course.priceBdt === 0);
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
      matched.sort((a, b) => (a.priceBdt ?? 0) - (b.priceBdt ?? 0));
    } else if (sort === 'price-high') {
      matched.sort((a, b) => (b.priceBdt ?? 0) - (a.priceBdt ?? 0));
    } else {
      matched.sort((a, b) => b.enrolledCount - a.enrolledCount);
    }

    return matched;
  }, [
    courses,
    categoryIndex,
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
    },
    [isScrolled, showHeaderSearch, showScrollTop]
  );

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
    selectedDurationFilter !== 'all' ||
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

  const catalogCount = totalCourseCount || courses.length || 382;

  // Render course item or department carousel row
  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (isBrowsingDepartments) {
        const dept = item as {
          id: string;
          title: string;
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
                <CategoryIllustrationIcon category={dept.id} size={28} />
                <Text style={[styles.deptRowTitle, { color: colors.text }]} numberOfLines={1}>
                  {dept.title}
                </Text>
                <View
                  style={[
                    styles.deptCountBadge,
                    { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' },
                  ]}
                >
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
                <StaggeredFadeIn index={0}>
                  <CourseCard
                    course={dept.courses[0]}
                    horizontal={true}
                    isBookmarked={bookmarks.includes(dept.courses[0].id)}
                    isEnrolled={!!userProgress[dept.courses[0].id]}
                    onPress={() => onNavigateToCourse(dept.courses[0].id)}
                    onLongPress={() => handleOpenQuickPeek(dept.courses[0])}
                  />
                </StaggeredFadeIn>
              </View>
            ) : isTablet && deptItemCount === 2 && !isLandscape ? (
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 16,
                  gap: 12,
                  alignItems: 'stretch',
                }}
              >
                {dept.courses.map((courseItem, idx) => (
                  <StaggeredFadeIn
                    key={`dept-course-${dept.id}-${courseItem.id}`}
                    index={idx}
                    style={{ flex: 1, height: '100%', alignSelf: 'stretch' }}
                  >
                    <CourseCard
                      course={courseItem}
                      isBookmarked={bookmarks.includes(courseItem.id)}
                      isEnrolled={!!userProgress[courseItem.id]}
                      onPress={() => onNavigateToCourse(courseItem.id)}
                      onLongPress={() => handleOpenQuickPeek(courseItem)}
                    />
                  </StaggeredFadeIn>
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
                renderItem={({ item: courseItem, index: cIdx }) => (
                  <StaggeredFadeIn
                    index={cIdx}
                    style={{ width: deptCardWidth, alignSelf: 'stretch' }}
                  >
                    <CourseCard
                      course={courseItem}
                      isBookmarked={bookmarks.includes(courseItem.id)}
                      isEnrolled={!!userProgress[courseItem.id]}
                      onPress={() => onNavigateToCourse(courseItem.id)}
                      onLongPress={() => handleOpenQuickPeek(courseItem)}
                    />
                  </StaggeredFadeIn>
                )}
              />
            )}
          </View>
        );
      }

      return (
        <StaggeredFadeIn
          index={index}
          style={[styles.cardItemWrapper, effectiveColumns > 1 && styles.gridCardItem]}
        >
          <CourseCard
            course={item as Course}
            horizontal={viewMode === 'list'}
            isBookmarked={bookmarks.includes((item as Course).id)}
            isEnrolled={!!userProgress[(item as Course).id]}
            onPress={() => onNavigateToCourse(item.id)}
            onLongPress={() => handleOpenQuickPeek(item as Course)}
          />
        </StaggeredFadeIn>
      );
    },
    [
      isBrowsingDepartments,
      colors,
      isDark,
      isBangla,
      handleCategorySelect,
      onNavigateToCourse,
      viewMode,
      bookmarks,
      userProgress,
      effectiveColumns,
      width,
      isTablet,
      isLandscape,
      handleOpenQuickPeek,
    ]
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
              placeholder={
                isBangla
                  ? 'কোর্স, জেনারেটিভ এআই, এক্সেল ফর্মুলা সার্চ করুন...'
                  : 'Search courses, Generative AI, Excel formulas...'
              }
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

          {/* Dynamic Hot Topic Discovery Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hotTopicsScroll}
            accessibilityRole="tablist"
          >
            {HOT_TOPICS.map((topic) => {
              const isSelected =
                (topic.type === 'dept' && selectedCategory === topic.id) ||
                (topic.type === 'price_free' && selectedPriceFilter === 'free') ||
                (topic.type === 'all' &&
                  selectedCategory === 'all' &&
                  selectedPriceFilter === 'all' &&
                  !searchQuery);

              return (
                <TouchableOpacity
                  key={`hot-topic-${topic.id}`}
                  style={[
                    styles.hotTopicChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isDark
                          ? colors.surfaceCard
                          : '#F1F5F9',
                      borderColor: isSelected ? colors.primary : isDark ? colors.border : '#E2E8F0',
                    },
                    isSelected && { shadowColor: colors.primary, elevation: 2 },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    if (topic.type === 'price_free') {
                      setSelectedPriceFilter(selectedPriceFilter === 'free' ? 'all' : 'free');
                    } else if (topic.type === 'dept') {
                      handleCategorySelect(topic.id);
                    } else {
                      handleClearAllFilters();
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={isBangla ? topic.bnLabel : topic.label}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <Ionicons
                    name={topic.icon as any}
                    size={13}
                    color={
                      isSelected ? colors.onPrimary : isDark ? colors.textLight : colors.textMuted
                    }
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.hotTopicText,
                      {
                        color: isSelected ? colors.onPrimary : isDark ? colors.text : '#334155',
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {isBangla ? topic.bnLabel : topic.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* CR-4: Department-wise Category Navigation Grid with Custom Illustrative Icons & Collapsible Mode */}
        <DepartmentCategoryGrid
          selectedDeptId={selectedCategory === 'all' ? null : selectedCategory}
          onSelectDepartment={(deptId) => {
            handleDeptCardPress(deptId);
          }}
          departmentCounts={departmentCountsMap}
          onReset={() => handleCategorySelect('all')}
          showHeader={true}
          isCollapsible={true}
          initialVisibleCount={4}
        />

        {/* Categories Pills */}
        <CategoryPills
          selectedId={selectedCategory}
          categories={canonicalCategoryPills}
          onSelect={handleCategorySelect}
        />

        {/* Quick Filter Chips (Skill Level: Beginner/Advanced, Duration: Short/In-depth, Price: Free/Paid) */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.levelsScroll}
            accessibilityRole="tablist"
          >
            {/* Beginner Chip */}
            <TouchableOpacity
              style={[
                styles.quickFilterChip,
                selectedLevel === 'Beginner'
                  ? {
                      backgroundColor: isDark ? '#FFFFFF' : '#102F53',
                      borderColor: isDark ? '#FFFFFF' : '#102F53',
                    }
                  : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={() => handleLevelSelect(selectedLevel === 'Beginner' ? 'All' : 'Beginner')}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedLevel === 'Beginner' }}
              accessibilityLabel={isBangla ? 'বিগিনার লেভেল ফিল্টার' : 'Filter by Beginner level'}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons
                name="school-outline"
                size={12}
                color={
                  selectedLevel === 'Beginner'
                    ? isDark
                      ? colors.onSecondary
                      : '#FFFFFF'
                    : colors.primary
                }
              />
              <Text
                style={[
                  styles.quickFilterText,
                  {
                    color:
                      selectedLevel === 'Beginner'
                        ? isDark
                          ? colors.onSecondary
                          : '#FFFFFF'
                        : colors.text,
                  },
                ]}
              >
                {isBangla ? 'বিগিনার' : 'Beginner'}
              </Text>
            </TouchableOpacity>

            {/* Advanced Chip */}
            <TouchableOpacity
              style={[
                styles.quickFilterChip,
                selectedLevel === 'Advanced'
                  ? {
                      backgroundColor: isDark ? '#FFFFFF' : '#102F53',
                      borderColor: isDark ? '#FFFFFF' : '#102F53',
                    }
                  : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={() => handleLevelSelect(selectedLevel === 'Advanced' ? 'All' : 'Advanced')}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedLevel === 'Advanced' }}
              accessibilityLabel={isBangla ? 'অ্যাডভান্সড লেভেল ফিল্টার' : 'Filter by Advanced level'}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons
                name="trending-up-outline"
                size={12}
                color={
                  selectedLevel === 'Advanced' ? (isDark ? '#0F192C' : '#FFFFFF') : colors.primary
                }
              />
              <Text
                style={[
                  styles.quickFilterText,
                  {
                    color:
                      selectedLevel === 'Advanced' ? (isDark ? '#0F192C' : '#FFFFFF') : colors.text,
                  },
                ]}
              >
                {isBangla ? 'অ্যাডভান্সড' : 'Advanced'}
              </Text>
            </TouchableOpacity>

            {/* Short Duration (<3h) */}
            <TouchableOpacity
              style={[
                styles.quickFilterChip,
                selectedDurationFilter === 'short'
                  ? {
                      backgroundColor: isDark ? '#FFFFFF' : '#102F53',
                      borderColor: isDark ? '#FFFFFF' : '#102F53',
                    }
                  : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={() =>
                handleDurationFilterSelect(selectedDurationFilter === 'short' ? 'all' : 'short')
              }
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedDurationFilter === 'short' }}
              accessibilityLabel={isBangla ? 'সংক্ষিপ্ত কোর্স ফিল্টার' : 'Filter by Short duration'}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons
                name="flash-outline"
                size={12}
                color={
                  selectedDurationFilter === 'short'
                    ? isDark
                      ? '#0F192C'
                      : '#FFFFFF'
                    : colors.primary
                }
              />
              <Text
                style={[
                  styles.quickFilterText,
                  {
                    color:
                      selectedDurationFilter === 'short'
                        ? isDark
                          ? '#0F192C'
                          : '#FFFFFF'
                        : colors.text,
                  },
                ]}
              >
                {isBangla ? 'সংক্ষিপ্ত (<৩ঘ)' : 'Short (<3h)'}
              </Text>
            </TouchableOpacity>

            {/* In-depth Duration (3h+) */}
            <TouchableOpacity
              style={[
                styles.quickFilterChip,
                selectedDurationFilter === 'in-depth'
                  ? {
                      backgroundColor: isDark ? '#FFFFFF' : '#102F53',
                      borderColor: isDark ? '#FFFFFF' : '#102F53',
                    }
                  : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={() =>
                handleDurationFilterSelect(
                  selectedDurationFilter === 'in-depth' ? 'all' : 'in-depth'
                )
              }
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedDurationFilter === 'in-depth' }}
              accessibilityLabel={isBangla ? 'ইন-ডেপ্থ কোর্স ফিল্টার' : 'Filter by In-depth duration'}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons
                name="time-outline"
                size={12}
                color={
                  selectedDurationFilter === 'in-depth'
                    ? isDark
                      ? '#0F192C'
                      : '#FFFFFF'
                    : colors.primary
                }
              />
              <Text
                style={[
                  styles.quickFilterText,
                  {
                    color:
                      selectedDurationFilter === 'in-depth'
                        ? isDark
                          ? '#0F192C'
                          : '#FFFFFF'
                        : colors.text,
                  },
                ]}
              >
                {isBangla ? 'ইন-ডেপ্থ (৩ঘ+)' : 'In-depth (3h+)'}
              </Text>
            </TouchableOpacity>

            {/* Free Price Chip */}
            <TouchableOpacity
              style={[
                styles.quickFilterChip,
                selectedPriceFilter === 'free'
                  ? {
                      backgroundColor: isDark ? '#FFFFFF' : '#102F53',
                      borderColor: isDark ? '#FFFFFF' : '#102F53',
                    }
                  : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={() =>
                handlePriceFilterSelect(selectedPriceFilter === 'free' ? 'all' : 'free')
              }
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedPriceFilter === 'free' }}
              accessibilityLabel={isBangla ? 'ফ্রি কোর্স ফিল্টার' : 'Filter by Free courses'}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons
                name="gift-outline"
                size={12}
                color={
                  selectedPriceFilter === 'free' ? (isDark ? '#0F192C' : '#FFFFFF') : '#16A34A'
                }
              />
              <Text
                style={[
                  styles.quickFilterText,
                  {
                    color:
                      selectedPriceFilter === 'free'
                        ? isDark
                          ? '#0F192C'
                          : '#FFFFFF'
                        : colors.text,
                  },
                ]}
              >
                {isBangla ? 'ফ্রি' : 'Free'}
              </Text>
            </TouchableOpacity>

            {/* Paid Price Chip */}
            <TouchableOpacity
              style={[
                styles.quickFilterChip,
                selectedPriceFilter === 'paid'
                  ? {
                      backgroundColor: isDark ? '#FFFFFF' : '#102F53',
                      borderColor: isDark ? '#FFFFFF' : '#102F53',
                    }
                  : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={() =>
                handlePriceFilterSelect(selectedPriceFilter === 'paid' ? 'all' : 'paid')
              }
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedPriceFilter === 'paid' }}
              accessibilityLabel={isBangla ? 'পেইড কোর্স ফিল্টার' : 'Filter by Paid courses'}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons
                name="card-outline"
                size={12}
                color={
                  selectedPriceFilter === 'paid' ? (isDark ? '#0F192C' : '#FFFFFF') : colors.accent
                }
              />
              <Text
                style={[
                  styles.quickFilterText,
                  {
                    color:
                      selectedPriceFilter === 'paid'
                        ? isDark
                          ? '#0F192C'
                          : '#FFFFFF'
                        : colors.text,
                  },
                ]}
              >
                {isBangla ? 'পেইড' : 'Paid'}
              </Text>
            </TouchableOpacity>

            {/* Reset / Clear Chip when any quick filter is active */}
            {(selectedLevel !== 'All' ||
              selectedDurationFilter !== 'all' ||
              selectedPriceFilter !== 'all') && (
              <TouchableOpacity
                style={[
                  styles.quickFilterChip,
                  {
                    backgroundColor: isDark ? 'rgba(227,66,52,0.2)' : '#FEE2E2',
                    borderColor: '#E34234',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  handleLevelSelect('All');
                  handleDurationFilterSelect('all');
                  handlePriceFilterSelect('all');
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear all quick filters"
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={12} color="#E34234" />
                <Text style={[styles.quickFilterText, { color: '#E34234', fontWeight: '700' }]}>
                  {isBangla ? 'রিসেট' : 'Reset'}
                </Text>
              </TouchableOpacity>
            )}
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
          <Text
            style={[styles.resultCount, { color: colors.textMuted }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isBangla ? (
              <>
                দেখাচ্ছে{' '}
                <Text style={{ color: colors.text, fontWeight: '700' }}>{filtered.length}</Text> টি
                কোর্স
              </>
            ) : (
              <>
                Showing{' '}
                <Text style={{ color: colors.text, fontWeight: '700' }}>{filtered.length}</Text>{' '}
                courses
              </>
            )}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Free / Paid / All Segmented Pills */}
            <View
              style={[
                styles.priceFilterGroup,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
              accessibilityRole="tablist"
            >
              {(['all', 'free', 'paid'] as PriceFilter[]).map((pf) => {
                const isSelected = selectedPriceFilter === pf;
                const pfLabel =
                  pf === 'all'
                    ? isBangla
                      ? 'সকল'
                      : 'All'
                    : pf === 'free'
                      ? isBangla
                        ? 'ফ্রি'
                        : 'Free'
                      : isBangla
                        ? 'মেম্বারস'
                        : 'Members';
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
                      isBangla ? `${pfLabel} কোর্স ফিল্টার` : `Filter by ${pfLabel} courses`
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
              style={[
                styles.sortBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
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
                  ? isBangla
                    ? 'জনপ্রিয়'
                    : 'Popular'
                  : selectedSort === 'newest'
                    ? isBangla
                      ? 'নতুন'
                      : 'Newest'
                    : selectedSort === 'rating'
                      ? isBangla
                        ? 'সেরা রেটিং'
                        : 'Top Rated'
                      : selectedSort === 'price-low'
                        ? isBangla
                          ? 'কম দাম'
                          : 'Price: Low'
                        : isBangla
                          ? 'বেশি দাম'
                          : 'Price: High'}
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
                  style={[
                    styles.activeFilterChip,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
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
                  style={[
                    styles.activeFilterChip,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                  onPress={() => handleCategorySelect('all')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear category filter"
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text style={[styles.activeFilterChipText, { color: colors.text }]}>
                    {(() => {
                      const active = canonicalCategoryPills.find((c) => c.id === selectedCategory);
                      if (!active) return selectedCategory;
                      return isBangla && active.banglaName ? active.banglaName : active.name;
                    })()}
                  </Text>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {selectedLevel !== 'All' && (
                <TouchableOpacity
                  style={[
                    styles.activeFilterChip,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
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
              {selectedDurationFilter !== 'all' && (
                <TouchableOpacity
                  style={[
                    styles.activeFilterChip,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                  onPress={() => handleDurationFilterSelect('all')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear duration filter"
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text style={[styles.activeFilterChipText, { color: colors.text }]}>
                    {selectedDurationFilter === 'short'
                      ? isBangla
                        ? 'সংক্ষিপ্ত (<৩ঘ)'
                        : 'Short (<3h)'
                      : isBangla
                        ? 'ইন-ডেপ্থ (৩ঘ+)'
                        : 'In-depth (3h+)'}
                  </Text>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {selectedPriceFilter !== 'all' && (
                <TouchableOpacity
                  style={[
                    styles.activeFilterChip,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                  onPress={() => handlePriceFilterSelect('all')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear price filter"
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text style={[styles.activeFilterChipText, { color: colors.text }]}>
                    {selectedPriceFilter === 'free'
                      ? isBangla
                        ? 'ফ্রি'
                        : 'Free'
                      : isBangla
                        ? 'পেইড'
                        : 'Paid'}
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
    isDark,
    isBangla,
    localSearch,
    handleSearchChange,
    handleClearSearch,
    selectedCategory,
    categories,
    canonicalCategoryPills,
    departmentCountsMap,
    handleDeptCardPress,
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
              style={[
                styles.suggestionChip,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
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
                isBangla ? `${topic.label} বিষয় সার্চ করুন` : `Search for ${topic.label}`
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
          accessibilityLabel={isBangla ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'}
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

      {/* Dynamic Course Quick Peek Modal */}
      <CourseQuickPeekModal
        visible={isQuickPeekVisible}
        course={quickPeekCourse}
        onClose={handleCloseQuickPeek}
        onNavigateToCourse={onNavigateToCourse}
        isBookmarked={quickPeekCourse ? bookmarks.includes(quickPeekCourse.id) : false}
        onToggleBookmark={toggleBookmark}
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
  hotTopicsScroll: {
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
    flexDirection: 'row',
  },
  hotTopicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
  },
  hotTopicText: {
    fontSize: 12,
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
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 6,
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
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
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginVertical: 10,
    gap: 8,
    rowGap: 8,
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
    paddingRight: 24,
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
    alignItems: 'stretch',
  },
  gridCardItem: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 0,
    alignSelf: 'stretch',
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
    minWidth: 0,
    marginRight: 8,
  },
  deptRowTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  deptCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    flexShrink: 0,
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
    flexShrink: 0,
  },
  seeAllDeptText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deptCarouselContent: {
    paddingLeft: 16,
    paddingRight: 24,
    gap: 12,
    paddingBottom: 4,
    alignItems: 'stretch',
  },
  deptCardItemWrap: {
    width: 250,
  },
});
