import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '../data/mockData';
import { Category, CategoryId } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface CategoryPillsProps {
  selectedId: CategoryId;
  onSelect: (id: CategoryId) => void;
  categories?: Category[];
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({ selectedId, onSelect, categories }) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const list: Category[] = categories && categories.length > 0 ? categories : CATEGORIES;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {list.map((cat) => {
        const isSelected = selectedId === cat.id;
        const displayName = isBangla && cat.banglaName ? cat.banglaName : cat.name;

        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : isDark
                  ? colors.surfaceCard
                  : '#FFFFFF',
                borderColor: isSelected ? colors.primary : colors.border,
              },
              isSelected && styles.selectedPillShadow,
            ]}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={cat.icon as any}
              size={15}
              color={isSelected ? '#FFFFFF' : colors.primary}
              style={styles.icon}
            />
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? '#FFFFFF' : colors.text,
                  fontWeight: isSelected ? '700' : '600',
                },
              ]}
            >
              {displayName}
            </Text>
            {cat.id !== 'all' && (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : colors.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: isSelected ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  {cat.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectedPillShadow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
