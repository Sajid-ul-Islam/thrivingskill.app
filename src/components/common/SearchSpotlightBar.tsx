import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { shape } from '../../theme/shapes';

interface SearchSpotlightBarProps {
  onPress: () => void;
  onSelectTag?: (tag: string) => void;
}

const TRENDING_TAGS = [
  { label: '🤖 Agentic AI', query: 'agentic' },
  { label: '💼 AI for Business', query: 'ai' },
  { label: '📊 Power BI Data', query: 'power bi' },
  { label: '📈 Financial Modeling', query: 'finance' },
  { label: '🌱 ESG Strategy', query: 'esg' },
  { label: '🚀 Growth Marketing', query: 'marketing' },
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsScrollContent}
        >
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
              hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
            >
              <Text style={[styles.tagText, { color: colors.text }]}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    borderRadius: shape.large,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
    gap: 10,
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
    borderRadius: shape.medium,
  },
  cmdKText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  tagsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
  },
  trendingLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 2,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: shape.medium,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
