import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SearchSpotlightBarProps {
  onPress: () => void;
  onSelectTag?: (tag: string) => void;
}

const TRENDING_TAGS = [
  { label: 'Generative AI', query: 'ai' },
  { label: 'Excel BI', query: 'excel' },
  { label: 'Financial Modeling', query: 'finance' },
  { label: 'Supply Chain', query: 'supply' },
];

export const SearchSpotlightBar: React.FC<SearchSpotlightBarProps> = ({
  onPress,
  onSelectTag,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Primary Search Launcher Bar */}
      <TouchableOpacity
        style={[
          styles.searchBox,
          {
            backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Ionicons name="search" size={18} color={colors.primary} />
        <Text style={[styles.placeholderText, { color: colors.textMuted }]} numberOfLines={1}>
          Search courses, instructors, masterclasses...
        </Text>
        <View style={[styles.cmdKChip, { backgroundColor: colors.surfaceSubtle }]}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={[styles.cmdKText, { color: colors.primary }]}>AI Search</Text>
        </View>
      </TouchableOpacity>

      {/* Trending Tag Chips */}
      <View style={styles.tagsRow}>
        <Text style={[styles.trendingLabel, { color: colors.textMuted }]}>
          TRENDING:
        </Text>
        {TRENDING_TAGS.map((tag, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.tagPill,
              {
                backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
            onPress={() => onSelectTag ? onSelectTag(tag.query) : onPress()}
            activeOpacity={0.7}
          >
            <Text style={[styles.tagText, { color: colors.text }]}>{tag.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  placeholderText: {
    flex: 1,
    fontSize: 13,
  },
  cmdKChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cmdKText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  trendingLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 2,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
