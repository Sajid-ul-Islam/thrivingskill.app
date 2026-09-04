import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SocialPost } from '../types';
import { SocialFeedService } from '../services/socialFeedService';

interface SocialPostCardProps {
  post: SocialPost;
  width?: number;
  onPress?: (post: SocialPost) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SocialPostCard: React.FC<SocialPostCardProps> = ({
  post,
  width,
  onPress,
}) => {
  const { colors, isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likesCount || 0);

  const isFacebook = post.platform === 'facebook';
  const platformColor = isFacebook ? '#1877F2' : '#0A66C2';
  const platformIcon = isFacebook ? 'logo-facebook' : 'logo-linkedin';
  const platformLabel = isFacebook ? 'Facebook' : 'LinkedIn';

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const handleOpen = () => {
    if (onPress) {
      onPress(post);
    } else {
      SocialFeedService.openPost(post);
    }
  };

  const handleShare = () => {
    SocialFeedService.sharePost(post);
  };

  const cardWidth = width || SCREEN_WIDTH - 32;
  const isHorizontalCard = !!width;

  const previewContent =
    post.content.length > 140 && !isExpanded
      ? post.content.slice(0, 140) + '...'
      : post.content;

  return (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header: Author + Platform Badge */}
      <View style={styles.headerRow}>
        <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
        <View style={styles.authorMeta}>
          <View style={styles.authorNameRow}>
            <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
              {post.authorName}
            </Text>
            <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginLeft: 4 }} />
          </View>
          <Text style={[styles.authorHandle, { color: colors.textMuted }]}>
            {post.authorHandle} • {post.relativeTime || 'Recent'}
          </Text>
        </View>

        {/* Platform Tag */}
        <View style={[styles.platformBadge, { backgroundColor: `${platformColor}18` }]}>
          <Ionicons name={platformIcon as any} size={14} color={platformColor} />
          <Text style={[styles.platformBadgeText, { color: platformColor }]}>
            {platformLabel}
          </Text>
        </View>
      </View>

      {/* Content Text */}
      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.contentText,
            { color: colors.text },
            isHorizontalCard && !isExpanded && { maxHeight: 60 },
          ]}
          numberOfLines={isHorizontalCard && !isExpanded ? 3 : undefined}
        >
          {previewContent}
        </Text>
        {post.content.length > 140 && !isHorizontalCard && (
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.moreBtn}>
            <Text style={[styles.moreText, { color: platformColor }]}>
              {isExpanded ? 'Show less' : 'Read more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Featured Image */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <TouchableOpacity activeOpacity={0.9} onPress={handleOpen} style={styles.imageContainer}>
          <Image
            source={{ uri: post.mediaUrls[0] }}
            style={[
              styles.postImage,
              { height: isHorizontalCard ? 140 : 200 },
            ]}
            resizeMode="cover"
          />
          {post.badge && (
            <View style={styles.imageOverlayBadge}>
              <Text style={styles.imageOverlayBadgeText}>{post.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && !isHorizontalCard && (
        <View style={styles.tagsRow}>
          {post.tags.slice(0, 3).map((tag, idx) => (
            <Text key={idx} style={[styles.tagText, { color: platformColor }]}>
              {tag}{' '}
            </Text>
          ))}
        </View>
      )}

      {/* Footer / Engagement Row */}
      <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
        <View style={styles.engagementLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? '#EF4444' : colors.textMuted}
            />
            <Text
              style={[
                styles.actionText,
                { color: liked ? '#EF4444' : colors.textMuted },
              ]}
            >
              {likeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={17} color={colors.textMuted} />
            <Text style={[styles.actionText, { color: colors.textMuted }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.openLinkBtn, { backgroundColor: platformColor }]}
          onPress={handleOpen}
        >
          <Ionicons name={platformIcon as any} size={14} color="#FFFFFF" />
          <Text style={styles.openLinkBtnText}>View on {platformLabel}</Text>
          <Ionicons name="open-outline" size={12} color="#FFFFFF" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  authorMeta: {
    flex: 1,
    marginLeft: 10,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorHandle: {
    fontSize: 11,
    marginTop: 2,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  contentText: {
    fontSize: 13,
    lineHeight: 19,
  },
  moreBtn: {
    marginTop: 4,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  postImage: {
    width: '100%',
    backgroundColor: '#0F172A',
  },
  imageOverlayBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  imageOverlayBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
  },
  engagementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  openLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  openLinkBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
