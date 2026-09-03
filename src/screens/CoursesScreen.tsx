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
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { CategoryPills } from '../components/CategoryPills';
import { CourseCard } from '../components/CourseCard';
import { SpecialBundleCard } from '../components/SpecialBundleCard';
import { SPECIAL_BUNDLES } from '../data/mockData';

interface CoursesScreenProps {
  onNavigateToCourse: (courseId: string) => void;
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
}

type LevelFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';
type SortOption = 'popular' | 'rating' | 'price-low' | 'price-high';

export const CoursesScreen: React.FC<CoursesScreenProps> = ({
  onNavigateToCourse,
  onOpenSubscription,
  onOpenNotifications,
}) => {
  const { colors } = useTheme();
  const {
    courses,
    categories,
    isLoadingCourses,
    refreshCourses,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useLearning();

  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('All');
  const [selectedSort, setSelectedSort] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtering & Sorting
  const isBundleView = selectedCategory === 'career-track';

  let filtered = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel =
      selectedLevel === 'All' ||
      course.level === selectedLevel ||
      course.level === 'All Levels';
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesLevel && matchesSearch;
  });

  filtered.sort((a, b) => {
    if (selectedSort === 'rating') return b.rating - a.rating;
    if (selectedSort === 'price-low') return a.price - b.price;
    if (selectedSort === 'price-high') return b.price - a.price;
    return b.enrolledCount - a.enrolledCount; // popular
  });

  const handleBundlePress = (bundleTitle: string, priceBdt: number) => {
    Alert.alert(
      `${bundleTitle} 🎁`,
      `Special Bundle Price: ৳${priceBdt.toLocaleString()} BDT\n\nIncludes complete curriculum, practice files, and verified digital certificates. Enroll now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enroll in Bundle', onPress: onOpenSubscription },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Thriving Skills Catalog"
        subtitle="৩০০+ প্রিমিয়াম কোর্স ও স্পেশাল বান্ডেল"
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
              placeholder="Search courses, Generative AI, Excel formulas..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelsScroll}>
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as LevelFilter[]).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.levelPill,
                    {
                      backgroundColor:
                        selectedLevel === lvl ? colors.secondary : colors.surfaceSubtle,
                      borderColor: selectedLevel === lvl ? colors.secondary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedLevel(lvl)}
                >
                  <Text
                    style={[
                      styles.levelText,
                      { color: selectedLevel === lvl ? '#FFFFFF' : colors.textMuted },
                    ]}
                  >
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* View toggle */}
            <View style={styles.viewToggleGroup}>
              <TouchableOpacity
                style={[
                  styles.viewToggleBtn,
                  viewMode === 'grid' && { backgroundColor: colors.surfaceSubtle },
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons
                  name="grid-outline"
                  size={16}
                  color={viewMode === 'grid' ? colors.primary : colors.textLight}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewToggleBtn,
                  viewMode === 'list' && { backgroundColor: colors.surfaceSubtle },
                ]}
                onPress={() => setViewMode('list')}
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

        {/* Result Header */}
        <View style={styles.resultMetaRow}>
          <Text style={[styles.resultCount, { color: colors.textMuted }]}>
            {isBundleView ? (
              <>Showing <Text style={{ color: colors.text, fontWeight: '700' }}>{SPECIAL_BUNDLES.length}</Text> Special Bundles</>
            ) : (
              <>Showing <Text style={{ color: colors.text, fontWeight: '700' }}>{filtered.length}</Text> courses</>
            )}
          </Text>

          {!isBundleView && (
            <TouchableOpacity
              style={[styles.sortBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              onPress={() => {
                const order: SortOption[] = ['popular', 'rating', 'price-low', 'price-high'];
                const nextIdx = (order.indexOf(selectedSort) + 1) % order.length;
                setSelectedSort(order[nextIdx]);
              }}
            >
              <Ionicons name="swap-vertical" size={13} color={colors.primary} />
              <Text style={[styles.sortBtnText, { color: colors.text }]}>
                {selectedSort === 'popular'
                  ? 'Most Popular'
                  : selectedSort === 'rating'
                  ? 'Top Rated'
                  : selectedSort === 'price-low'
                  ? 'Price: Low'
                  : 'Price: High'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Rendering: Bundles or Courses */}
        <View style={styles.coursesContainer}>
          {isBundleView ? (
            SPECIAL_BUNDLES.map((bundle) => (
              <SpecialBundleCard
                key={bundle.id}
                bundle={bundle}
                onPress={() => handleBundlePress(bundle.title, bundle.priceBdt)}
              />
            ))
          ) : filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No courses found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Try adjusting your search terms or category filters.
              </Text>
              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedLevel('All');
                }}
              >
                <Text style={styles.resetBtnText}>Reset All Filters</Text>
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
    borderRadius: 8,
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
    width: 32,
    height: 32,
    borderRadius: 8,
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
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  coursesContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  resetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
