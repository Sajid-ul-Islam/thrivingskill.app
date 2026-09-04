import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SocialPost, SocialPlatform } from '../types';
import { SocialFeedService } from '../services/socialFeedService';
import { SocialPostCard } from './SocialPostCard';
import { SOCIAL_PROFILES } from '../data/socialPosts';
import { useAutoScroll } from '../hooks/useAutoScroll';

interface CommunityFeedShelfProps {
  onViewAll: () => void;
  onSelectPost?: (post: SocialPost) => void;
}

export const CommunityFeedShelf: React.FC<CommunityFeedShelfProps> = ({
  onViewAll,
  onSelectPost,
}) => {
  const { colors, isDark } = useTheme();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | SocialPlatform>('all');
  const [loading, setLoading] = useState(true);

  const filteredPosts = posts.filter((p) => {
    if (selectedFilter === 'all') return true;
    return p.platform === selectedFilter;
  });

  const { scrollViewRef, scrollProps, pauseTemporarily } = useAutoScroll({
    enabled: !loading && filteredPosts.length > 1,
    speed: 0.45,
    pauseAtEdgeMs: 2000,
    resumeDelayMs: 3000,
  });

  useEffect(() => {
    let mounted = true;
    const loadPosts = async () => {
      try {
        const data = await SocialFeedService.getSocialPosts();
        if (mounted) {
          setPosts(data);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    loadPosts();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <View style={styles.brandIconsRow}>
            <View style={[styles.miniBadge, { backgroundColor: '#1877F2' }]}>
              <Ionicons name="logo-facebook" size={14} color="#FFFFFF" />
            </View>
            <View style={[styles.miniBadge, { backgroundColor: '#0A66C2', marginLeft: -6 }]}>
              <Ionicons name="logo-linkedin" size={14} color="#FFFFFF" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Community & Social
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Live announcements & career insights from Facebook & LinkedIn
          </Text>
        </View>

        <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All ({posts.length}) →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'all'
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: isDark ? colors.surfaceCard : '#F1F5F9', borderColor: colors.border },
          ]}
          onPress={() => {
            pauseTemporarily(2500);
            setSelectedFilter('all');
          }}
        >
          <Text
            style={[
              styles.filterText,
              { color: selectedFilter === 'all' ? '#FFFFFF' : colors.text },
            ]}
          >
            All Updates
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'facebook'
              ? { backgroundColor: '#1877F2', borderColor: '#1877F2' }
              : { backgroundColor: isDark ? colors.surfaceCard : '#F1F5F9', borderColor: colors.border },
          ]}
          onPress={() => {
            pauseTemporarily(2500);
            setSelectedFilter('facebook');
          }}
        >
          <Ionicons
            name="logo-facebook"
            size={13}
            color={selectedFilter === 'facebook' ? '#FFFFFF' : '#1877F2'}
          />
          <Text
            style={[
              styles.filterText,
              { color: selectedFilter === 'facebook' ? '#FFFFFF' : colors.text },
            ]}
          >
            Facebook
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'linkedin'
              ? { backgroundColor: '#0A66C2', borderColor: '#0A66C2' }
              : { backgroundColor: isDark ? colors.surfaceCard : '#F1F5F9', borderColor: colors.border },
          ]}
          onPress={() => {
            pauseTemporarily(2500);
            setSelectedFilter('linkedin');
          }}
        >
          <Ionicons
            name="logo-linkedin"
            size={13}
            color={selectedFilter === 'linkedin' ? '#FFFFFF' : '#0A66C2'}
          />
          <Text
            style={[
              styles.filterText,
              { color: selectedFilter === 'linkedin' ? '#FFFFFF' : colors.text },
            ]}
          >
            LinkedIn
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel */}
      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          {...scrollProps}
        >
          {filteredPosts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              width={290}
              onPress={(p) => {
                pauseTemporarily(3500);
                if (onSelectPost) {
                  onSelectPost(p);
                } else {
                  SocialFeedService.openPost(p);
                }
              }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleArea: {
    flex: 1,
  },
  brandIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loaderArea: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
});
