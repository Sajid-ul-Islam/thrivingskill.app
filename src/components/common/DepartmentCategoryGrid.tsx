import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLearning } from '../../context/LearningContext';
import { SpringPressable } from './SpringPressable';
import { CategoryIllustrationIcon, CategoryDepartmentId } from './CategoryIllustrationIcon';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { Category, Course } from '../../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const matchesDepartment = (c: Course, deptId: string): boolean => {
  const lowerCat = (c.category || '').toLowerCase();
  const slugs = c.categorySlugs ? c.categorySlugs.map((s) => s.toLowerCase()) : [];
  const dId = deptId.toLowerCase();

  // 1. Business
  if (dId === 'business') {
    const isStrategy = lowerCat.includes('strategy') || slugs.some((s) => s.includes('strategy'));
    if (isStrategy) return false;
    return lowerCat.includes('business') || slugs.some((s) => s.includes('business'));
  }

  // 2. Supply Chain & Logistics
  if (dId.includes('supply-chain') || dId.includes('supply') || dId.includes('logistics')) {
    return (
      lowerCat.includes('supply') ||
      lowerCat.includes('logistics') ||
      slugs.some((s) => s.includes('supply') || s.includes('logistics'))
    );
  }

  // 3. Microsoft Excel
  if (dId.includes('excel') || dId.includes('spreadsheet')) {
    return (
      lowerCat.includes('excel') ||
      lowerCat.includes('spreadsheet') ||
      slugs.some((s) => s.includes('excel') || s.includes('spreadsheet'))
    );
  }

  // 4. Leadership & Management
  if (dId.includes('leadership')) {
    return lowerCat.includes('leadership') || slugs.some((s) => s.includes('leadership'));
  }

  // 5. Personal Development
  if (dId.includes('personal-development') || dId.includes('personal')) {
    return (
      lowerCat.includes('personal') ||
      lowerCat.includes('habit') ||
      slugs.some((s) => s.includes('personal') || s.includes('habit') || s.includes('productivity'))
    );
  }

  // 6. Generative AI
  if (dId.includes('generative') || dId.includes('ai') || dId === '4ir') {
    return (
      lowerCat.includes('generative') ||
      lowerCat.includes('4ir') ||
      /\bai\b/i.test(lowerCat) ||
      slugs.some((s) => s.includes('generative') || s.includes('4ir') || /\bai\b/i.test(s))
    );
  }

  // 7. Finance, Accounting & Legal
  if (dId.includes('finance') || dId.includes('account') || dId.includes('legal')) {
    return (
      lowerCat.includes('finance') ||
      lowerCat.includes('account') ||
      lowerCat.includes('legal') ||
      slugs.some((s) => s.includes('finance') || s.includes('account') || s.includes('legal'))
    );
  }

  // 8. Human Resource Management (HRM)
  if (dId.includes('human-resource') || dId.includes('hrm') || dId.includes('hr')) {
    return (
      lowerCat.includes('human') ||
      /\bhr\b/i.test(lowerCat) ||
      slugs.some((s) => s.includes('human') || /\bhr\b/i.test(s) || s.includes('hrm'))
    );
  }

  // 9. Sales & Marketing
  if (dId.includes('marketing') || dId.includes('sales')) {
    return (
      lowerCat.includes('marketing') ||
      lowerCat.includes('sales') ||
      slugs.some((s) => s.includes('marketing') || s.includes('sales'))
    );
  }

  // 10. Data Science & Big Data
  if (dId.includes('data')) {
    return (
      lowerCat.includes('data') ||
      lowerCat.includes('analytics') ||
      slugs.some((s) => s.includes('data') || s.includes('analytics'))
    );
  }

  // 11. Job Seekers Skills
  if (dId.includes('job') || dId.includes('career')) {
    return (
      lowerCat.includes('job') ||
      lowerCat.includes('career') ||
      slugs.some((s) => s.includes('job') || s.includes('career'))
    );
  }

  // 12. Research & Academic
  if (dId.includes('research') || dId.includes('academic')) {
    return (
      lowerCat.includes('research') ||
      lowerCat.includes('academic') ||
      slugs.some((s) => s.includes('research') || s.includes('academic'))
    );
  }

  // 13. Business Strategy
  if (dId.includes('strategy') || dId.includes('consulting')) {
    return lowerCat.includes('strategy') || slugs.some((s) => s.includes('strategy'));
  }

  return false;
};

export const getIconForCategory = (slug: string = '', name: string = ''): CategoryDepartmentId => {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();

  // 1. Supply Chain & Logistics (check early before any substrings)
  if (
    s.includes('supply') ||
    s.includes('logistics') ||
    s.includes('procurement') ||
    n.includes('supply') ||
    n.includes('logistics')
  ) {
    return 'supply-chain-management';
  }
  // 2. Generative AI & 4IR
  if (
    s.includes('generative') ||
    s.includes('4ir') ||
    /\bai\b/i.test(s) ||
    /\bai\b/i.test(n) ||
    s.includes('artificial')
  ) {
    return 'generative-ai';
  }
  // 3. Microsoft Excel & Spreadsheets
  if (s.includes('excel') || s.includes('spreadsheet') || n.includes('excel')) {
    return 'excel';
  }
  // 4. Finance, Accounting & Legal
  if (
    s.includes('finance') ||
    s.includes('account') ||
    s.includes('legal') ||
    s.includes('tax') ||
    n.includes('finance') ||
    n.includes('account') ||
    n.includes('legal')
  ) {
    return 'finance-accounting-legal';
  }
  // 5. Human Resource Management (HRM)
  if (
    s.includes('human-resource') ||
    s.includes('hrm') ||
    s.includes('recruitment') ||
    s.includes('talent') ||
    n.includes('human resource') ||
    /\bhr\b/i.test(s) ||
    /\bhr\b/i.test(n)
  ) {
    return 'human-resource-management';
  }
  // 6. Data Science & Big Data
  if (
    s.includes('data') ||
    s.includes('analytics') ||
    s.includes('bi') ||
    n.includes('data science') ||
    n.includes('analytics')
  ) {
    return 'data-science';
  }
  // 7. Leadership & Executive Management
  if (s.includes('leadership') || n.includes('leadership')) {
    return 'leadership-management';
  }
  // 8. Personal Development & Soft Skills
  if (
    s.includes('personal') ||
    s.includes('habit') ||
    s.includes('soft-skill') ||
    s.includes('productivity') ||
    n.includes('personal') ||
    n.includes('self')
  ) {
    return 'personal-development';
  }
  // 9. Job Seekers Skills & Career
  if (
    s.includes('job') ||
    s.includes('career') ||
    s.includes('resume') ||
    s.includes('interview') ||
    n.includes('job') ||
    n.includes('career')
  ) {
    return 'job-seekers-skills';
  }
  // 10. Research & Academic
  if (
    s.includes('research') ||
    s.includes('academic') ||
    s.includes('thesis') ||
    n.includes('research') ||
    n.includes('academic')
  ) {
    return 'research-courses';
  }
  // 11. Business Strategy & Consulting
  if (s.includes('strategy') || s.includes('consulting') || n.includes('strategy')) {
    return 'business-strategy';
  }
  // 12. Sales & Marketing
  if (
    s.includes('market') ||
    s.includes('sales') ||
    s.includes('brand') ||
    s.includes('seo') ||
    n.includes('market') ||
    n.includes('sales')
  ) {
    return 'marketing';
  }
  // 13. Design, Presentation & Creative
  if (
    s.includes('design') ||
    s.includes('creative') ||
    s.includes('presentation') ||
    s.includes('ui') ||
    s.includes('ux') ||
    n.includes('design')
  ) {
    return 'design';
  }
  // 14. Cyber Security & Hacking
  if (
    s.includes('hack') ||
    s.includes('cyber') ||
    s.includes('security') ||
    n.includes('cyber') ||
    n.includes('security')
  ) {
    return 'hacking';
  }
  // 15. Software & Tech Tools
  if (s.includes('software') || s.includes('tool') || n.includes('software')) {
    return 'software';
  }
  // 16. Development, Coding & Programming
  if (
    s.includes('dev') ||
    s.includes('python') ||
    s.includes('code') ||
    s.includes('programming') ||
    n.includes('dev') ||
    n.includes('code')
  ) {
    return 'development';
  }
  // 17. Networking & Cloud Infrastructure
  if (
    s.includes('network') ||
    s.includes('cloud') ||
    s.includes('infrastructure') ||
    n.includes('network')
  ) {
    return 'networking';
  }
  // 18. Fitness & Health
  if (
    s.includes('fitness') ||
    s.includes('health') ||
    s.includes('wellness') ||
    n.includes('fitness') ||
    n.includes('health')
  ) {
    return 'fitness';
  }
  // 19. Business, Management & Corporate (Default)
  return 'business';
};

export interface CanonicalDepartmentConfig {
  name: string;
  banglaName: string;
}

export const CANONICAL_DEPARTMENTS_MAP: Record<string, CanonicalDepartmentConfig> = {
  'generative-ai': { name: 'Generative AI', banglaName: 'জেনারেটিভ এআই' },
  business: { name: 'Business', banglaName: 'ব্যবসা ও বাণিজ্য' },
  'microsoft-excel-courses': { name: 'Microsoft Excel', banglaName: 'মাইক্রোসফট এক্সেল' },
  'finance-accounting-legal': { name: 'Finance & Legal', banglaName: 'অর্থনীতি ও আইন' },
  'human-resource-management': {
    name: 'Human Resource Management',
    banglaName: 'মানব সম্পদ ব্যবস্থাপনা',
  },
  'leadership-management': { name: 'Leadership & Management', banglaName: 'নেতৃত্ব ও ব্যবস্থাপনা' },
  'personal-development': { name: 'Personal Development', banglaName: 'ব্যক্তিগত দক্ষতা উন্নয়ন' },
  'sales-marketing': { name: 'Sales & Marketing', banglaName: 'বিক্রয় ও বিপণন' },
  'supply-chain-management': {
    name: 'Supply Chain Management',
    banglaName: 'সাপ্লাই চেইন ম্যানেজমেন্ট',
  },
  'data-science': { name: 'Data Science', banglaName: 'ডাটা সায়েন্স' },
  'job-seekers-skills': { name: 'Job Seekers Skills', banglaName: 'চাকরি প্রত্যাশীদের দক্ষতা' },
  'research-courses': { name: 'Research & Academic', banglaName: 'গবেষণা ও শিক্ষায়তনিক' },
  'business-strategy': { name: 'Business Strategy', banglaName: 'ব্যবসায়িক কৌশল' },
};

export const getCanonicalDepartmentId = (slug: string = '', name: string = ''): string | null => {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();

  const excluded = [
    'all',
    'all-courses',
    'published',
    'get-offer',
    '60-off',
    'offer',
    'get-tickets',
    'siam-city-cement',
    'bayer-cropscience',
    'homemakers-skills',
    'ebook',
    'courses',
    'physical-training',
    'upcoming',
    'upcoming-live-training',
    'our-popular-courses',
    'our-exclusive-free-course',
    'master-classes',
    'bundle-courses',
    '4ir_skills_summit',
    'blockchain-summit',
    'a-guide-to-real-estate-business',
  ];

  if (excluded.includes(s) || excluded.some((ex) => s === ex || s.startsWith(`${ex}-`))) {
    return null;
  }

  // Supply Chain & Logistics
  if (
    s.includes('supply') ||
    s.includes('logistics') ||
    s.includes('procurement') ||
    n.includes('supply') ||
    n.includes('logistics')
  ) {
    return 'supply-chain-management';
  }
  // Generative AI & 4IR
  if (
    s.includes('generative') ||
    s.includes('4ir') ||
    /\bai\b/i.test(s) ||
    /\bai\b/i.test(n) ||
    s.includes('artificial')
  ) {
    return 'generative-ai';
  }
  // Microsoft Excel
  if (s.includes('excel') || s.includes('spreadsheet') || n.includes('excel')) {
    return 'microsoft-excel-courses';
  }
  // Finance, Accounting & Legal
  if (
    s.includes('finance') ||
    s.includes('account') ||
    s.includes('legal') ||
    s.includes('tax') ||
    n.includes('finance') ||
    n.includes('account') ||
    n.includes('legal')
  ) {
    return 'finance-accounting-legal';
  }
  // Human Resource Management (HRM)
  if (
    s.includes('human-resource') ||
    s.includes('hrm') ||
    s.includes('recruitment') ||
    s.includes('talent') ||
    n.includes('human resource') ||
    /\bhr\b/i.test(s) ||
    /\bhr\b/i.test(n)
  ) {
    return 'human-resource-management';
  }
  // Data Science & Big Data
  if (
    s.includes('data') ||
    s.includes('analytics') ||
    s === 'python' ||
    s === 'r' ||
    s.includes('bi') ||
    n.includes('data science') ||
    n.includes('analytics')
  ) {
    return 'data-science';
  }
  // Leadership & Executive Management
  if (s.includes('leadership') || n.includes('leadership')) {
    return 'leadership-management';
  }
  // Personal Development & Soft Skills
  if (
    s.includes('personal') ||
    s.includes('habit') ||
    s.includes('soft-skill') ||
    s.includes('productivity') ||
    n.includes('personal') ||
    n.includes('self')
  ) {
    return 'personal-development';
  }
  // Job Seekers Skills & Career
  if (
    s.includes('job') ||
    s.includes('career') ||
    s.includes('resume') ||
    s.includes('interview') ||
    n.includes('job') ||
    n.includes('career')
  ) {
    return 'job-seekers-skills';
  }
  // Research & Academic
  if (
    s.includes('research') ||
    s.includes('academic') ||
    s.includes('thesis') ||
    n.includes('research') ||
    n.includes('academic')
  ) {
    return 'research-courses';
  }
  // Business Strategy & Consulting
  if (s.includes('strategy') || s.includes('consulting') || n.includes('strategy')) {
    return 'business-strategy';
  }
  // Sales & Marketing
  if (
    s.includes('market') ||
    s.includes('sales') ||
    s.includes('brand') ||
    s.includes('seo') ||
    n.includes('market') ||
    n.includes('sales')
  ) {
    return 'sales-marketing';
  }
  // General Business & Management
  if (
    s === 'business' ||
    s.startsWith('business-essentials') ||
    n === 'business' ||
    n.startsWith('business essentials')
  ) {
    return 'business';
  }

  return null;
};

interface DepartmentCategoryGridProps {
  categories?: Category[];
  selectedDeptId?: string | null;
  onSelectDepartment: (deptId: string) => void;
  departmentCounts?: Record<string, number>;
  onReset?: () => void;
  showHeader?: boolean;
  maxItems?: number;
  isCollapsible?: boolean;
  initialVisibleCount?: number;
}

export const DepartmentCategoryGrid: React.FC<DepartmentCategoryGridProps> = ({
  categories: propCategories,
  selectedDeptId,
  onSelectDepartment,
  departmentCounts = {},
  onReset,
  showHeader = true,
  maxItems = 12,
  isCollapsible = true,
  initialVisibleCount = 4,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { categories: contextCategories, courses } = useLearning();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // 1. Source categories dynamically from props or context
  const sourceCategories = propCategories || contextCategories;

  // 2. Filter out non-department metadata tags and canonicalize into distinct departments
  const validDepartments = useMemo(() => {
    const rawList = sourceCategories || [];
    const canonicalMap = new Map<string, Category>();

    for (const cat of rawList) {
      const slug = (cat.slug || cat.id || '').toLowerCase();
      const canonicalId = getCanonicalDepartmentId(slug, cat.name);
      if (!canonicalId || !CANONICAL_DEPARTMENTS_MAP[canonicalId]) continue;

      const conf = CANONICAL_DEPARTMENTS_MAP[canonicalId];
      const liveCalculatedCount = courses
        ? courses.filter((c) => matchesDepartment(c, canonicalId)).length
        : 0;
      const count =
        departmentCounts[canonicalId] ??
        departmentCounts[cat.id] ??
        departmentCounts[slug] ??
        (cat.count && cat.count > 0 ? cat.count : liveCalculatedCount);

      if (!canonicalMap.has(canonicalId)) {
        canonicalMap.set(canonicalId, {
          id: canonicalId,
          slug: canonicalId,
          name: conf.name,
          banglaName: conf.banglaName,
          count: count,
          icon: 'book',
          color: '#4F46E5',
        });
      } else {
        const existing = canonicalMap.get(canonicalId)!;
        existing.count = Math.max(existing.count || 0, count);
      }
    }

    // Comprehensive Fallback: Ensure all canonical departments exist with live course counts
    Object.entries(CANONICAL_DEPARTMENTS_MAP).forEach(([deptId, conf]) => {
      if (!canonicalMap.has(deptId)) {
        const liveCalculatedCount = courses
          ? courses.filter((c) => matchesDepartment(c, deptId)).length
          : 0;
        const count = departmentCounts[deptId] ?? liveCalculatedCount;
        canonicalMap.set(deptId, {
          id: deptId,
          slug: deptId,
          name: conf.name,
          banglaName: conf.banglaName,
          count: count,
          icon: 'book',
          color: '#4F46E5',
        });
      }
    });

    const uniqueList = Array.from(canonicalMap.values());

    // Sort by course count descending so top site departments appear first
    uniqueList.sort((a, b) => {
      const countA = departmentCounts[a.id] ?? a.count ?? 0;
      const countB = departmentCounts[b.id] ?? b.count ?? 0;
      return countB - countA;
    });

    return uniqueList.slice(0, maxItems);
  }, [sourceCategories, departmentCounts, courses, maxItems]);

  const displayedDepartments = useMemo(() => {
    if (!isCollapsible || isExpanded) return validDepartments;
    const topSlice = validDepartments.slice(0, initialVisibleCount);
    if (selectedDeptId && selectedDeptId !== 'all') {
      const isSelectedInTop = topSlice.some(
        (d) => d.id === selectedDeptId || d.slug === selectedDeptId
      );
      if (!isSelectedInTop) {
        const found = validDepartments.find(
          (d) => d.id === selectedDeptId || d.slug === selectedDeptId
        );
        if (found) return [...topSlice.slice(0, Math.max(1, initialVisibleCount - 1)), found];
      }
    }
    return topSlice;
  }, [validDepartments, isCollapsible, isExpanded, initialVisibleCount, selectedDeptId]);

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBangla ? 'ক্যাটাগরি' : 'Categories'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {isBangla ? 'ক্যাটাগরি অনুযায়ী কোর্স ব্রাউজ করুন' : 'Browse courses by categories'}
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
        {displayedDepartments.map((dept) => {
          const isSelected = selectedDeptId === dept.id || selectedDeptId === dept.slug;
          const count = departmentCounts[dept.id] ?? dept.count ?? 0;
          const displayName = isBangla ? dept.banglaName || dept.name : dept.name;
          const iconType = getIconForCategory(dept.slug || dept.id, dept.name);

          return (
            <SpringPressable
              key={`dept-grid-${dept.id}`}
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: isSelected ? colors.primary : isDark ? colors.border : '#F1F5F9',
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

              <View style={styles.titleContainer}>
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
              </View>

              <View style={styles.countPillContainer}>
                {count > 0 ? (
                  <View
                    style={[
                      styles.countPill,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : isDark
                            ? colors.surfaceSubtle
                            : '#F8FAFC',
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
                ) : (
                  <View style={styles.countPillPlaceholder} />
                )}
              </View>
            </SpringPressable>
          );
        })}
      </View>

      {/* Dynamic Expand/Collapse Toggle */}
      {isCollapsible && validDepartments.length > initialVisibleCount && (
        <View style={styles.expandToggleWrapper}>
          <SpringPressable
            onPress={() => {
              triggerHaptic('light');
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setIsExpanded((prev) => !prev);
            }}
            style={[
              styles.expandToggleBtn,
              {
                backgroundColor: isDark ? colors.surfaceCard : '#F8FAFC',
                borderColor: isDark ? colors.border : '#E2E8F0',
              },
            ]}
            activeScale={0.97}
            accessibilityRole="button"
            accessibilityLabel={
              isExpanded
                ? isBangla
                  ? 'ক্যাটাগরি সংক্ষেপ করুন'
                  : 'Collapse categories'
                : isBangla
                  ? `সবগুলো (${validDepartments.length}) ক্যাটাগরি দেখুন`
                  : `Explore all (${validDepartments.length}) categories`
            }
          >
            <Ionicons
              name={isExpanded ? 'chevron-up-circle' : 'grid-outline'}
              size={15}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.expandToggleText, { color: colors.primary }]}>
              {isExpanded
                ? isBangla
                  ? 'সংক্ষেপ করুন ▴'
                  : 'Show Less ▴'
                : isBangla
                  ? `সবগুলো (${validDepartments.length}) ক্যাটাগরি দেখুন ▾`
                  : `Explore All (${validDepartments.length}) Categories ▾`}
            </Text>
          </SpringPressable>
        </View>
      )}
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
    height: 154,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  titleContainer: {
    height: 38,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13.5,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  countPillContainer: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  countPillPlaceholder: {
    height: 20,
  },
  countText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  expandToggleWrapper: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  expandToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
