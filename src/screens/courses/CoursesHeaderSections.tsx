import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { triggerHaptic } from '../../utils/haptics';
import { Category } from '../../types';
import {
  HOT_TOPICS,
  PriceFilter,
  SortOption,
  LevelFilter,
  DurationFilter,
} from './coursesConstants';
import { coursesStyles as styles } from './coursesStyles';

export const CoursesSearchSection: React.FC<{
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  localSearch: string;
  searchQuery: string;
  selectedCategory: string;
  selectedPriceFilter: PriceFilter;
  searchInputRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
  onSelectPriceFilter: (pf: PriceFilter) => void;
  onSelectCategory: (catId: string) => void;
  onClearAllFilters: () => void;
}> = ({
  colors,
  isDark,
  isBangla,
  localSearch,
  searchQuery,
  selectedCategory,
  selectedPriceFilter,
  searchInputRef,
  onSearchChange,
  onClearSearch,
  onSelectPriceFilter,
  onSelectCategory,
  onClearAllFilters,
}) => (
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
        onChangeText={onSearchChange}
      />
      {localSearch.length > 0 && (
        <TouchableOpacity
          onPress={onClearSearch}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'সার্চ মুছুন' : 'Clear search input'}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>

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
                onSelectPriceFilter(selectedPriceFilter === 'free' ? 'all' : 'free');
              } else if (topic.type === 'dept') {
                onSelectCategory(topic.id);
              } else {
                onClearAllFilters();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? topic.bnLabel : topic.label}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Ionicons
              name={topic.icon as any}
              size={13}
              color={isSelected ? colors.onPrimary : isDark ? colors.textLight : colors.textMuted}
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
);

export const CoursesResultMetaBar: React.FC<{
  colors: any;
  isBangla: boolean;
  filteredCount: number;
  selectedPriceFilter: PriceFilter;
  selectedSort: SortOption;
  selectedCategory: string;
  selectedLevel: LevelFilter;
  selectedDurationFilter: DurationFilter;
  searchQuery: string;
  hasActiveFilters: boolean;
  canonicalCategoryPills: Category[];
  onSelectPriceFilter: (pf: PriceFilter) => void;
  onSortToggle: () => void;
  onClearSearch: () => void;
  onClearCategory: () => void;
  onClearLevel: () => void;
  onClearDuration: () => void;
  onClearAllFilters: () => void;
}> = ({
  colors,
  isBangla,
  filteredCount,
  selectedPriceFilter,
  selectedSort,
  selectedCategory,
  selectedLevel,
  selectedDurationFilter,
  searchQuery,
  hasActiveFilters,
  canonicalCategoryPills,
  onSelectPriceFilter,
  onSortToggle,
  onClearSearch,
  onClearCategory,
  onClearLevel,
  onClearDuration,
  onClearAllFilters,
}) => {
  const sortLabel =
    selectedSort === 'popular'
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
              : 'Price: High';

  return (
    <>
      <View style={styles.resultMetaRow}>
        <Text
          style={[styles.resultCount, { color: colors.textMuted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {isBangla ? (
            <>
              দেখাচ্ছে <Text style={{ color: colors.text, fontWeight: '700' }}>{filteredCount}</Text>{' '}
              টি কোর্স
            </>
          ) : (
            <>
              Showing <Text style={{ color: colors.text, fontWeight: '700' }}>{filteredCount}</Text>{' '}
              courses
            </>
          )}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
                  style={[styles.priceFilterBtn, isSelected && { backgroundColor: colors.primary }]}
                  onPress={() => onSelectPriceFilter(pf)}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
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
            onPress={onSortToggle}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="swap-vertical" size={13} color={colors.primary} />
            <Text style={[styles.sortBtnText, { color: colors.text }]}>{sortLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                onPress={onClearSearch}
                accessibilityRole="button"
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
                onPress={onClearCategory}
                accessibilityRole="button"
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
                onPress={onClearLevel}
                accessibilityRole="button"
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
                onPress={onClearDuration}
                accessibilityRole="button"
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
                onPress={() => onSelectPriceFilter('all')}
                accessibilityRole="button"
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
              onPress={onClearAllFilters}
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={[styles.clearAllFiltersText, { color: colors.primary }]}>
                {isBangla ? 'সব মুছুন' : 'Clear all'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </>
  );
};

export const CoursesEmptyView: React.FC<{
  colors: any;
  isBangla: boolean;
  searchQuery: string;
  selectedCategory: string;
  onSelectSuggestion: (q: string) => void;
  onClearAllFilters: () => void;
}> = ({
  colors,
  isBangla,
  searchQuery,
  selectedCategory,
  onSelectSuggestion,
  onClearAllFilters,
}) => {
  const topics = isBangla
    ? [
        { label: 'এআই ও অটোমেশন', q: 'AI' },
        { label: 'ফাইন্যান্সিয়াল মডেলিং', q: 'Financial' },
        { label: 'কর্পোরেট লিডারশিপ', q: 'Corporate' },
      ]
    : [
        { label: 'AI & Automation', q: 'AI' },
        { label: 'Financial Modeling', q: 'Financial' },
        { label: 'Corporate Leadership', q: 'Corporate' },
      ];

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
      <View style={styles.suggestionRow}>
        {topics.map((topic) => (
          <TouchableOpacity
            key={topic.label}
            style={[
              styles.suggestionChip,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
            ]}
            onPress={() => onSelectSuggestion(topic.q)}
            accessibilityRole="button"
          >
            <Text style={[styles.suggestionText, { color: colors.text }]}>{topic.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.resetBtn, { backgroundColor: colors.primary }]}
        onPress={onClearAllFilters}
        accessibilityRole="button"
      >
        <Ionicons name="refresh" size={15} color={colors.onPrimary} />
        <Text style={[styles.resetBtnText, { color: colors.onPrimary }]}>
          {isBangla ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
