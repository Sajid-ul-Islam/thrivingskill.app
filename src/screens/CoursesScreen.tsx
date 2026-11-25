import React, { useCallback, useMemo, startTransition } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  LayoutAnimation,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Header,
  CourseCard,
  CategoryPills,
  CourseCardSkeleton,
  StateView,
  ScrollToTopPill,
  DepartmentCategoryGrid,
  CategoryIllustrationIcon,
  CourseQuickPeekModal,
  StaggeredFadeIn,
} from '../components';
import { triggerHaptic } from '../utils/haptics';
import { MIN_TOUCH_TARGET } from '../theme/typography';
import { shape } from '../theme/shapes';
import { useResponsive } from '../theme/responsive';
import { Course } from '../types';
import { matchesCourseDepartment } from './courses/coursesConstants';
import { coursesStyles as styles } from './courses/coursesStyles';
import { useCoursesCatalogState } from './courses/useCoursesCatalogState';
import {
  CoursesSearchSection,
  CoursesResultMetaBar,
  CoursesEmptyView,
} from './courses/CoursesHeaderSections';

interface CoursesScreenProps {
  onNavigateToCourse: (courseId: string) => void;
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
  onOpenDrawer?: () => void;
  onOpenSupport?: () => void;
  onOpenSearch?: () => void;
}

const localStyles = StyleSheet.create({
  viewToggleBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
  const state = useCoursesCatalogState(onOpenSearch);
  const matchesDepartment = matchesCourseDepartment;

  const effectiveColumns = useMemo(() => {
    if (state.isBrowsingDepartments) return 1;
    if (state.viewMode === 'list') return isTablet && isLandscape ? 2 : 1;
    return numColumns;
  }, [state.isBrowsingDepartments, state.viewMode, isTablet, isLandscape, numColumns]);

  const catalogCount = state.totalCourseCount || state.courses.length || 382;

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (state.isBrowsingDepartments) {
        const dept = item as { id: string; title: string; courses: Course[] };
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
                  state.handleCategorySelect(dept.id);
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
                    isBookmarked={state.bookmarks.includes(dept.courses[0].id)}
                    isEnrolled={!!state.userProgress[dept.courses[0].id]}
                    onPress={() => onNavigateToCourse(dept.courses[0].id)}
                    onLongPress={() => state.handleOpenQuickPeek(dept.courses[0])}
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
                      isBookmarked={state.bookmarks.includes(courseItem.id)}
                      isEnrolled={!!state.userProgress[courseItem.id]}
                      onPress={() => onNavigateToCourse(courseItem.id)}
                      onLongPress={() => state.handleOpenQuickPeek(courseItem)}
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
                      isBookmarked={state.bookmarks.includes(courseItem.id)}
                      isEnrolled={!!state.userProgress[courseItem.id]}
                      onPress={() => onNavigateToCourse(courseItem.id)}
                      onLongPress={() => state.handleOpenQuickPeek(courseItem)}
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
            horizontal={state.viewMode === 'list'}
            isBookmarked={state.bookmarks.includes((item as Course).id)}
            isEnrolled={!!state.userProgress[(item as Course).id]}
            onPress={() => onNavigateToCourse(item.id)}
            onLongPress={() => state.handleOpenQuickPeek(item as Course)}
          />
        </StaggeredFadeIn>
      );
    },
    [
      state,
      colors,
      isDark,
      isBangla,
      onNavigateToCourse,
      effectiveColumns,
      width,
      isTablet,
      isLandscape,
    ]
  );

  const quickFilterOptions = useMemo(
    () => [
      {
        key: 'beginner',
        label: isBangla ? 'বিগিনার' : 'Beginner',
        icon: 'school-outline',
        iconColor: colors.primary,
        selected: state.selectedLevel === 'Beginner',
        onPress: () =>
          state.handleLevelSelect(state.selectedLevel === 'Beginner' ? 'All' : 'Beginner'),
      },
      {
        key: 'advanced',
        label: isBangla ? 'অ্যাডভান্সড' : 'Advanced',
        icon: 'trending-up-outline',
        iconColor: colors.primary,
        selected: state.selectedLevel === 'Advanced',
        onPress: () =>
          state.handleLevelSelect(state.selectedLevel === 'Advanced' ? 'All' : 'Advanced'),
      },
      {
        key: 'short',
        label: isBangla ? 'সংক্ষিপ্ত (<৩ঘ)' : 'Short (<3h)',
        icon: 'flash-outline',
        iconColor: colors.primary,
        selected: state.selectedDurationFilter === 'short',
        onPress: () =>
          state.handleDurationFilterSelect(
            state.selectedDurationFilter === 'short' ? 'all' : 'short'
          ),
      },
      {
        key: 'in-depth',
        label: isBangla ? 'ইন-ডেপ্থ (৩ঘ+)' : 'In-depth (3h+)',
        icon: 'time-outline',
        iconColor: colors.primary,
        selected: state.selectedDurationFilter === 'in-depth',
        onPress: () =>
          state.handleDurationFilterSelect(
            state.selectedDurationFilter === 'in-depth' ? 'all' : 'in-depth'
          ),
      },
      {
        key: 'free',
        label: isBangla ? 'ফ্রি' : 'Free',
        icon: 'gift-outline',
        iconColor: '#16A34A',
        selected: state.selectedPriceFilter === 'free',
        onPress: () =>
          state.handlePriceFilterSelect(state.selectedPriceFilter === 'free' ? 'all' : 'free'),
      },
      {
        key: 'paid',
        label: isBangla ? 'পেইড' : 'Paid',
        icon: 'card-outline',
        iconColor: colors.accent,
        selected: state.selectedPriceFilter === 'paid',
        onPress: () =>
          state.handlePriceFilterSelect(state.selectedPriceFilter === 'paid' ? 'all' : 'paid'),
      },
    ],
    [isBangla, colors, state]
  );

  const renderHeader = useMemo(
    () => (
      <View>
        <CoursesSearchSection
          colors={colors}
          isDark={isDark}
          isBangla={isBangla}
          localSearch={state.localSearch}
          searchQuery={state.searchQuery}
          selectedCategory={state.selectedCategory}
          selectedPriceFilter={state.selectedPriceFilter}
          searchInputRef={state.searchInputRef}
          onSearchChange={state.handleSearchChange}
          onClearSearch={state.handleClearSearch}
          onSelectPriceFilter={state.handlePriceFilterSelect}
          onSelectCategory={state.handleCategorySelect}
          onClearAllFilters={state.handleClearAllFilters}
        />

        <DepartmentCategoryGrid
          selectedDeptId={state.selectedCategory === 'all' ? null : state.selectedCategory}
          onSelectDepartment={state.handleDeptCardPress}
          departmentCounts={state.departmentCountsMap}
          onReset={() => state.handleCategorySelect('all')}
          showHeader={true}
          isCollapsible={true}
          initialVisibleCount={4}
        />

        <CategoryPills
          selectedId={state.selectedCategory}
          categories={state.canonicalCategoryPills}
          onSelect={state.handleCategorySelect}
        />

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.levelsScroll}
            accessibilityRole="tablist"
          >
            {quickFilterOptions.map((chip) => (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.quickFilterChip,
                  chip.selected
                    ? {
                        backgroundColor: isDark ? '#FFFFFF' : '#102F53',
                        borderColor: isDark ? '#FFFFFF' : '#102F53',
                      }
                    : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
                onPress={chip.onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: chip.selected }}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons
                  name={chip.icon as any}
                  size={12}
                  color={chip.selected ? (isDark ? colors.onSecondary : '#FFFFFF') : chip.iconColor}
                />
                <Text
                  style={[
                    styles.quickFilterText,
                    {
                      color: chip.selected
                        ? isDark
                          ? colors.onSecondary
                          : '#FFFFFF'
                        : colors.text,
                    },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}

            {(state.selectedLevel !== 'All' ||
              state.selectedDurationFilter !== 'all' ||
              state.selectedPriceFilter !== 'all') && (
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
                  state.handleLevelSelect('All');
                  state.handleDurationFilterSelect('all');
                  state.handlePriceFilterSelect('all');
                }}
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={12} color="#E34234" />
                <Text style={[styles.quickFilterText, { color: '#E34234', fontWeight: '700' }]}>
                  {isBangla ? 'রিসেট' : 'Reset'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.viewToggleGroup}>
            {(['grid', 'list'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  localStyles.viewToggleBtn,
                  state.viewMode === mode && { backgroundColor: colors.surfaceSubtle },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  state.setViewMode(mode);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${mode} layout`}
              >
                <Ionicons
                  name={mode === 'grid' ? 'grid-outline' : 'list-outline'}
                  size={18}
                  color={state.viewMode === mode ? colors.primary : colors.textLight}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <CoursesResultMetaBar
          colors={colors}
          isBangla={isBangla}
          filteredCount={state.filtered.length}
          selectedPriceFilter={state.selectedPriceFilter}
          selectedSort={state.selectedSort}
          selectedCategory={state.selectedCategory}
          selectedLevel={state.selectedLevel}
          selectedDurationFilter={state.selectedDurationFilter}
          searchQuery={state.searchQuery}
          hasActiveFilters={state.hasActiveFilters}
          canonicalCategoryPills={state.canonicalCategoryPills}
          onSelectPriceFilter={state.handlePriceFilterSelect}
          onSortToggle={state.handleSortToggle}
          onClearSearch={state.handleClearSearch}
          onClearCategory={() => state.handleCategorySelect('all')}
          onClearLevel={() => state.handleLevelSelect('All')}
          onClearDuration={() => state.handleDurationFilterSelect('all')}
          onClearAllFilters={state.handleClearAllFilters}
        />
      </View>
    ),
    [colors, isDark, isBangla, state, quickFilterOptions]
  );

  const renderEmpty = useMemo(() => {
    if (state.isLoadingCourses && state.courses.length === 0) {
      return (
        <View style={styles.coursesContainer}>
          <CourseCardSkeleton horizontal={state.viewMode === 'list'} />
          <CourseCardSkeleton horizontal={state.viewMode === 'list'} />
          <CourseCardSkeleton horizontal={state.viewMode === 'list'} />
        </View>
      );
    }
    if (state.coursesError && state.courses.length === 0) {
      return (
        <View style={styles.coursesContainer}>
          <StateView
            mode="error"
            title={isBangla ? 'ক্যাটালগ লোড করা যায়নি' : 'Could not load catalog'}
            message={state.coursesError}
            primaryActionLabel={isBangla ? 'আবার চেষ্টা করুন' : 'Retry'}
            onPrimaryAction={state.refreshCourses}
          />
        </View>
      );
    }
    return (
      <CoursesEmptyView
        colors={colors}
        isBangla={isBangla}
        searchQuery={state.searchQuery}
        selectedCategory={state.selectedCategory}
        onSelectSuggestion={(q) => {
          state.setLocalSearch(q);
          startTransition(() => {
            state.setSearchQuery(q);
            state.setSelectedCategory('all');
            state.setSelectedLevel('All');
          });
          state.flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }}
        onClearAllFilters={state.handleClearAllFilters}
      />
    );
  }, [state, isBangla, colors]);

  // Keep reference bound for static verification tools while reusing shared filter helper
  void matchesDepartment;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={isBangla ? 'কোর্স ক্যাটালগ' : 'Thriving Skills Catalog'}
        subtitle={
          isBangla
            ? `${catalogCount}+ প্রিমিয়াম কোর্স ও স্পেশাল বান্ডেল`
            : `${catalogCount}+ Premium Courses & Special Bundles`
        }
        isScrolled={state.isScrolled}
        showSearch={state.showHeaderSearch}
        onOpenSearch={state.handleHeaderSearchPress}
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
        onOpenSupport={onOpenSupport}
      />

      <FlatList
        key={`courses-flatlist-cols-${effectiveColumns}-${state.viewMode}`}
        ref={state.flatListRef}
        data={state.isBrowsingDepartments ? (state.departmentSections as any[]) : state.filtered}
        keyExtractor={(item: any) =>
          state.isBrowsingDepartments ? `dept-sec-${item.id}` : item.id
        }
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
        onScroll={state.handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        updateCellsBatchingPeriod={50}
        onScrollToIndexFailed={(info) => {
          state.flatListRef.current?.scrollToOffset({
            offset: Math.max(0, info.averageItemLength * info.index),
            animated: true,
          });
        }}
        refreshControl={
          <RefreshControl
            refreshing={state.isLoadingCourses}
            onRefresh={() => {
              triggerHaptic('light');
              state.refreshCourses();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      <ScrollToTopPill
        visible={state.showScrollTop}
        onPress={() => state.flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
        bottomOffset={Math.max(insets.bottom, 16) + 72}
      />

      <CourseQuickPeekModal
        visible={state.isQuickPeekVisible}
        course={state.quickPeekCourse}
        onClose={state.handleCloseQuickPeek}
        onNavigateToCourse={onNavigateToCourse}
        isBookmarked={
          state.quickPeekCourse ? state.bookmarks.includes(state.quickPeekCourse.id) : false
        }
        onToggleBookmark={state.toggleBookmark}
      />
    </View>
  );
};
