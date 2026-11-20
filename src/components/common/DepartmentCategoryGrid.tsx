import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLearning } from '../../context/LearningContext';
import { SpringPressable } from './SpringPressable';
import { CategoryIllustrationIcon, CategoryDepartmentId } from './CategoryIllustrationIcon';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { Category } from '../../types';


export const getIconForCategory = (slug: string = '', name: string = ''): CategoryDepartmentId => {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();

  // Excel & Software
  if (s.includes('excel') || s.includes('software') || n.includes('excel') || n.includes('software')) {
    return 'software';
  }
  // Generative AI, Data Science & Tech Development
  if (s.includes('ai') || s.includes('generative') || s.includes('4ir') || s.includes('data') || s.includes('python') || n.includes('ai') || n.includes('data') || n.includes('tech')) {
    return 'development';
  }
  // Sales & Marketing
  if (s.includes('market') || s.includes('sales') || s.includes('brand') || s.includes('seo') || n.includes('market') || n.includes('sales')) {
    return 'marketing';
  }
  // Supply Chain & Network Logistics
  if (s.includes('supply') || s.includes('network') || s.includes('cloud') || s.includes('infrastructure') || n.includes('supply') || n.includes('network')) {
    return 'networking';
  }
  // Personal Development, Leadership & Wellbeing
  if (s.includes('personal') || s.includes('leadership') || s.includes('fitness') || s.includes('health') || s.includes('habit') || n.includes('personal') || n.includes('lead')) {
    return 'fitness';
  }
  // Design, Presentation & Creative
  if (s.includes('design') || s.includes('creative') || s.includes('presentation') || s.includes('ui') || s.includes('ux') || n.includes('design')) {
    return 'design';
  }
  // Cyber Security & Hacking
  if (s.includes('hack') || s.includes('cyber') || s.includes('security') || n.includes('cyber') || n.includes('security')) {
    return 'hacking';
  }
  // Business, Finance, Accounts & Legal (Default)
  return 'business';
};

interface DepartmentCategoryGridProps {
  categories?: Category[];
  selectedDeptId?: string | null;
  onSelectDepartment: (deptId: string) => void;
  departmentCounts?: Record<string, number>;
  onReset?: () => void;
  showHeader?: boolean;
  maxItems?: number;
}

export const DepartmentCategoryGrid: React.FC<DepartmentCategoryGridProps> = ({
  categories: propCategories,
  selectedDeptId,
  onSelectDepartment,
  departmentCounts = {},
  onReset,
  showHeader = true,
  maxItems = 10,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { categories: contextCategories } = useLearning();

  // 1. Source categories dynamically from props or context
  const sourceCategories = propCategories || contextCategories;

  // 2. Filter out administrative and non-department metadata tags
  const validDepartments = useMemo(() => {
    const excluded = new Set([
      'all',
      'published',
      'get-offer',
      '60-off',
      'get-tickets',
      'siam-city-cement',
      'homemakers-skills',
      'ebook',
      'courses',
      'physical-training',
    ]);

    const filtered = (sourceCategories || []).filter((c) => {
      const slug = (c.slug || c.id || '').toLowerCase();
      if (excluded.has(slug)) return false;
      // Must have at least 1 course or count > 0
      const count = departmentCounts[c.id] ?? c.count ?? 0;
      return count > 0 || c.id === 'business' || c.id === 'generative-ai';
    });

    // Deduplicate by normalized slug
    const seen = new Set<string>();
    const uniqueList: Category[] = [];

    for (const cat of filtered) {
      const slug = (cat.slug || cat.id || '').toLowerCase();
      if (!seen.has(slug)) {
        seen.add(slug);
        uniqueList.push(cat);
      }
    }

    // Sort by course count descending so top site departments appear first
    uniqueList.sort((a, b) => {
      const countA = departmentCounts[a.id] ?? a.count ?? 0;
      const countB = departmentCounts[b.id] ?? b.count ?? 0;
      return countB - countA;
    });

    return uniqueList.slice(0, maxItems);
  }, [sourceCategories, departmentCounts, maxItems]);

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBangla ? 'ক্যাটাগরি বিভাগ' : 'Department Categories'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {isBangla ? 'লাইভ সাইটের বিভাগ অনুযায়ী কোর্স ব্রাউজ করুন' : 'Browse courses by live site departments'}
            </Text>
          </View>
          {selectedDeptId && selectedDeptId !== 'all' && onReset && (
            <SpringPressable
              onPress={() => {
                triggerHaptic('light');
                onReset();
              }}
              style={styles.resetBtn}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'সকল ক্যাটাগরি দেখুন' : 'View all categories'}
            >
              <Text style={[styles.resetBtnText, { color: colors.primary }]}>
                {isBangla ? 'সব দেখুন →' : 'View All →'}
              </Text>
            </SpringPressable>
          )}
        </View>
      )}

      {/* 2-Column Grid of Dynamic Site Categories */}
      <View style={styles.grid}>
        {validDepartments.map((dept) => {
          const isSelected = selectedDeptId === dept.id || selectedDeptId === dept.slug;
          const count = departmentCounts[dept.id] ?? dept.count ?? 0;
          const displayName = isBangla
            ? (dept.banglaName || dept.name)
            : dept.name;
          const iconType = getIconForCategory(dept.slug || dept.id, dept.name);

          return (
            <SpringPressable
              key={`dept-grid-${dept.id}`}
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: isSelected ? colors.primary : (isDark ? colors.border : '#F1F5F9'),
                  borderWidth: isSelected ? 2 : 1,
                  shadowColor: isDark ? '#000000' : '#0F172A',
                },
                isSelected && {
                  shadowColor: colors.primary,
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  elevation: 4,
                },
              ]}
              onPress={() => {
                triggerHaptic('selection');
                onSelectDepartment(dept.slug || dept.id);
              }}
              activeScale={0.96}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${displayName} department, ${count > 0 ? `${count} courses` : ''}`}
            >
              <View style={styles.iconContainer}>
                <CategoryIllustrationIcon category={iconType} size={48} />
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? '800' : '700',
                  },
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {displayName}
              </Text>

              {count > 0 && (
                <View
                  style={[
                    styles.countPill,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryLight
                        : (isDark ? colors.surfaceSubtle : '#F8FAFC'),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: isSelected ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {count} {isBangla ? 'কোর্স' : 'Courses'}
                  </Text>
                </View>
              )}
            </SpringPressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  resetBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  resetBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48.2%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 128,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    height: 50,
  },
  cardTitle: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  countPill: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
});
