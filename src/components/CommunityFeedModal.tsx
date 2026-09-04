import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SocialPost, SocialPlatform } from '../types';
import { SocialFeedService } from '../services/socialFeedService';
import { SocialPostCard } from './SocialPostCard';
import { SOCIAL_PROFILES } from '../data/socialPosts';

interface CommunityFeedModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CommunityFeedModal: React.FC<CommunityFeedModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | SocialPlatform>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadFeed = useCallback(async () => {
    try {
      const data = await SocialFeedService.getSocialPosts();
      setPosts(data);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadFeed();
    }
  }, [visible, loadFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesPlatform =
      selectedPlatform === 'all' || post.platform === selectedPlatform;
    const matchesSearch =
      !searchQuery ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPlatform && matchesSearch;
  });

  const fbCount = posts.filter((p) => p.platform === 'facebook').length;
  const liCount = posts.filter((p) => p.platform === 'linkedin').length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Modal Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Community Hub
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Official Facebook & LinkedIn Feeds
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={loadFeed}
          >
            <Ionicons name="sync" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Follow Official Pages Bar */}
        <View
          style={[
            styles.followBar,
            { backgroundColor: isDark ? colors.surfaceCard : '#F8FAFC' },
          ]}
        >
          <Text style={[styles.followBarLabel, { color: colors.textMuted }]}>
            CONNECT WITH US:
          </Text>
          <View style={styles.followButtons}>
            <TouchableOpacity
              style={[styles.followBtn, { backgroundColor: '#1877F2' }]}
              onPress={() => SocialFeedService.openPageProfile('facebook')}
            >
              <Ionicons name="logo-facebook" size={14} color="#FFFFFF" />
              <Text style={styles.followBtnText}>Follow Page</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.followBtn, { backgroundColor: '#0A66C2' }]}
              onPress={() => SocialFeedService.openPageProfile('linkedin')}
            >
              <Ionicons name="logo-linkedin" size={14} color="#FFFFFF" />
              <Text style={styles.followBtnText}>Follow on LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: isDark ? colors.surfaceCard : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search posts, hashtags, masterclasses..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Segmented Filter Bar */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              selectedPlatform === 'all' && [
                styles.activeSegmentTab,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => setSelectedPlatform('all')}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    selectedPlatform === 'all' ? '#FFFFFF' : colors.textMuted,
                  fontWeight: selectedPlatform === 'all' ? '700' : '500',
                },
              ]}
            >
              All ({posts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              selectedPlatform === 'facebook' && [
                styles.activeSegmentTab,
                { backgroundColor: '#1877F2' },
              ],
            ]}
            onPress={() => setSelectedPlatform('facebook')}
          >
            <Ionicons
              name="logo-facebook"
              size={14}
              color={selectedPlatform === 'facebook' ? '#FFFFFF' : '#1877F2'}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    selectedPlatform === 'facebook'
                      ? '#FFFFFF'
                      : colors.textMuted,
                  fontWeight: selectedPlatform === 'facebook' ? '700' : '500',
                },
              ]}
            >
              Facebook ({fbCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              selectedPlatform === 'linkedin' && [
                styles.activeSegmentTab,
                { backgroundColor: '#0A66C2' },
              ],
            ]}
            onPress={() => setSelectedPlatform('linkedin')}
          >
            <Ionicons
              name="logo-linkedin"
              size={14}
              color={selectedPlatform === 'linkedin' ? '#FFFFFF' : '#0A66C2'}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    selectedPlatform === 'linkedin'
                      ? '#FFFFFF'
                      : colors.textMuted,
                  fontWeight: selectedPlatform === 'linkedin' ? '700' : '500',
                },
              ]}
            >
              LinkedIn ({liCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feed List */}
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.postWrapper}>
              <SocialPostCard post={item} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No posts found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Try adjusting your search query or switching filters.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  refreshIconBtn: {
    padding: 6,
  },
  followBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  followBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  followButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  segmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  activeSegmentTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  postWrapper: {
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
