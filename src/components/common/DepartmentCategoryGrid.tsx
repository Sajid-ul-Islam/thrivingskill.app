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

  // 1. Supply Chain & Logistics (check early before any substrings)
  if (s.includes('supply') || s.includes('logistics') || s.includes('procurement') || n.includes('supply') || n.includes('logistics')) {
    return 'supply-chain-management';
  }
  // 2. Generative AI & 4IR
  if (s.includes('generative') || s.includes('4ir') || /\bai\b/i.test(s) || /\bai\b/i.test(n) || s.includes('artificial')) {
    return 'generative-ai';
  }
  // 3. Microsoft Excel & Spreadsheets
  if (s.includes('excel') || s.includes('spreadsheet') || n.includes('excel')) {
    return 'excel';
  }
  // 4. Finance, Accounting & Legal
  if (s.includes('finance') || s.includes('account') || s.includes('legal') || s.includes('tax') || n.includes('finance') || n.includes('account') || n.includes('legal')) {
    return 'finance-accounting-legal';
  }
  // 5. Human Resource Management (HRM)
  if (s.includes('human-resource') || s.includes('hrm') || s.includes('recruitment') || s.includes('talent') || n.includes('human resource') || /\bhr\b/i.test(s) || /\bhr\b/i.test(n)) {
    return 'human-resource-management';
  }
  // 6. Data Science & Big Data
  if (s.includes('data') || s.includes('analytics') || s.includes('bi') || n.includes('data science') || n.includes('analytics')) {
    return 'data-science';
  }
  // 7. Leadership & Executive Management
  if (s.includes('leadership') || n.includes('leadership')) {
    return 'leadership-management';
  }
  // 8. Personal Development & Soft Skills
  if (s.includes('personal') || s.includes('habit') || s.includes('soft-skill') || s.includes('productivity') || n.includes('personal') || n.includes('self')) {
    return 'personal-development';
  }
  // 9. Job Seekers Skills & Career
  if (s.includes('job') || s.includes('career') || s.includes('resume') || s.includes('interview') || n.includes('job') || n.includes('career')) {
    return 'job-seekers-skills';
  }
  // 10. Research & Academic
  if (s.includes('research') || s.includes('academic') || s.includes('thesis') || n.includes('research') || n.includes('academic')) {
    return 'research-courses';
  }
  // 11. Business Strategy & Consulting
  if (s.includes('strategy') || s.includes('consulting') || n.includes('strategy')) {
    return 'business-strategy';
  }
  // 12. Sales & Marketing
  if (s.includes('market') || s.includes('sales') || s.includes('brand') || s.includes('seo') || n.includes('market') || n.includes('sales')) {
    return 'marketing';
  }
  // 13. Design, Presentation & Creative
  if (s.includes('design') || s.includes('creative') || s.includes('presentation') || s.includes('ui') || s.includes('ux') || n.includes('design')) {
    return 'design';
  }
  // 14. Cyber Security & Hacking
  if (s.includes('hack') || s.includes('cyber') || s.includes('security') || n.includes('cyber') || n.includes('security')) {
    return 'hacking';
  }
  // 15. Software & Tech Tools
  if (s.includes('software') || s.includes('tool') || n.includes('software')) {
    return 'software';
  }
  // 16. Development, Coding & Programming
  if (s.includes('dev') || s.includes('python') || s.includes('code') || s.includes('programming') || n.includes('dev') || n.includes('code')) {
    return 'development';
  }
  // 17. Networking & Cloud Infrastructure
  if (s.includes('network') || s.includes('cloud') || s.includes('infrastructure') || n.includes('network')) {
    return 'networking';
  }
  // 18. Fitness & Health
  if (s.includes('fitness') || s.includes('health') || s.includes('wellness') || n.includes('fitness') || n.includes('health')) {
    return 'fitness';
  }
  // 19. Business, Management & Corporate (Default)
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
  maxItems = 12,
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
