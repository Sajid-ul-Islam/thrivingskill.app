import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SpringPressable } from './SpringPressable';
import { CategoryIllustrationIcon, CategoryDepartmentId } from './CategoryIllustrationIcon';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

export interface DepartmentItem {
  id: CategoryDepartmentId;
  titleEn: string;
  titleBn: string;
  courseCount?: number;
}

export const DEPARTMENTS_CATALOG: DepartmentItem[] = [
  { id: 'design', titleEn: 'Design', titleBn: 'ডিজাইন' },
  { id: 'software', titleEn: 'Software', titleBn: 'সফটওয়্যার' },
  { id: 'networking', titleEn: 'Networking', titleBn: 'নেটওয়ার্কিং' },
  { id: 'marketing', titleEn: 'Marketing', titleBn: 'মার্কেটিং' },
  { id: 'hacking', titleEn: 'Hacking', titleBn: 'হ্যাকিং' },
  { id: 'development', titleEn: 'Development', titleBn: 'ডেভেলপমেন্ট' },
  { id: 'fitness', titleEn: 'Fitness', titleBn: 'ফিটনেস' },
  { id: 'business', titleEn: 'Business', titleBn: 'বিজনেস' },
];

interface DepartmentCategoryGridProps {
  selectedDeptId?: string | null;
  onSelectDepartment: (deptId: CategoryDepartmentId) => void;
  departmentCounts?: Record<string, number>;
  onReset?: () => void;
  showHeader?: boolean;
}

export const DepartmentCategoryGrid: React.FC<DepartmentCategoryGridProps> = ({
  selectedDeptId,
  onSelectDepartment,
  departmentCounts = {},
  onReset,
  showHeader = true,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBangla ? 'ক্যাটাগরি বিভাগ' : 'Department Categories'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {isBangla ? 'বিভাগ অনুযায়ী কোর্স ব্রাউজ করুন' : 'Browse courses by department'}
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

      {/* 2-Column Grid */}
      <View style={styles.grid}>
        {DEPARTMENTS_CATALOG.map((dept) => {
          const isSelected = selectedDeptId === dept.id;
          const count = departmentCounts[dept.id] || 0;
          const title = isBangla ? dept.titleBn : dept.titleEn;

          return (
            <SpringPressable
              key={dept.id}
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
                onSelectDepartment(dept.id);
              }}
              activeScale={0.96}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${title} department, ${count > 0 ? `${count} courses` : ''}`}
            >
              <View style={styles.iconContainer}>
                <CategoryIllustrationIcon category={dept.id} size={48} />
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? '800' : '700',
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
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
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 122,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    height: 50,
  },
  cardTitle: {
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: -0.2,
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
