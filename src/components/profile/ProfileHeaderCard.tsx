import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { UserProfile } from '../../services/api/userService';
import { Env } from '../../config/env';

interface ProfileHeaderCardProps {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  customName: string;
  customBio: string;
  activeWorkspaceName: string;
  colors: any;
  isBangla: boolean;
  onEditProfile: () => void;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  user,
  isAuthenticated,
  isAdmin,
  customName,
  customBio,
  activeWorkspaceName,
  colors,
  isBangla,
  onEditProfile,
}) => {
  const avatarUri =
    user?.avatar ||
    (user?.avatar_urls &&
      (user.avatar_urls['96'] || user.avatar_urls['48'] || user.avatar_urls['24']));

  const displayName =
    user?.name ||
    user?.displayName ||
    user?.username ||
    customName ||
    (isBangla ? 'অতিথি শিক্ষার্থী' : 'Guest Learner');

  return (
    <View
      style={[
        styles.profileCard,
        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
      ]}
    >
      {user?.cover_photo ? (
        <View style={styles.coverPhotoContainer}>
          <Image
            source={{ uri: user.cover_photo }}
            style={styles.coverPhotoImage}
            resizeMode="cover"
          />
          <View style={styles.coverPhotoOverlay} />
        </View>
      ) : null}

      <View style={styles.contentRow}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarInitialsCircle,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.avatarInitialsTextBig}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View
              style={[
                styles.verifiedBadge,
                {
                  backgroundColor: isAdmin
                    ? 'rgba(239, 68, 68, 0.12)'
                    : isAuthenticated
                    ? colors.primaryLight
                    : colors.surfaceSubtle,
                },
              ]}
            >
              <Ionicons
                name={isAdmin ? 'shield-checkmark' : isAuthenticated ? 'school-outline' : 'person-outline'}
                size={12}
                color={isAdmin ? '#EF4444' : isAuthenticated ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.verifiedText,
                  { color: isAdmin ? '#EF4444' : isAuthenticated ? colors.primary : colors.textMuted },
                ]}
              >
                {isAdmin ? 'ADMINISTRATOR' : isAuthenticated ? 'STUDENT' : 'GUEST'}
              </Text>
            </View>
          </View>

          <Text style={[styles.email, { color: colors.textMuted }]}>
            {user?.email || (isBangla ? 'কোর্স ক্যাটালগ এক্সপ্লোর করুন' : 'Explore catalog & courses freely')}
          </Text>

          {user?.city ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
                {user.city}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.role, { color: colors.secondary }]} numberOfLines={2}>
            {user?.description || customBio || (isAuthenticated
              ? `Connected to ${Env.SITE_URL.replace(/^https?:\/\//, '')} • ${activeWorkspaceName}`
              : 'Thriving Skills Online Platform')}
          </Text>

          <TouchableOpacity
            style={[
              styles.editProfileBtn,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
            onPress={onEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Ionicons name="create-outline" size={14} color={colors.primary} />
            <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>
              {isBangla ? 'প্রোফাইল সম্পাদন' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverPhotoContainer: {
    width: '100%',
    height: 84,
    position: 'relative',
    backgroundColor: '#102F53',
  },
  coverPhotoImage: {
    width: '100%',
    height: '100%',
  },
  coverPhotoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16, 47, 83, 0.2)',
  },
  contentRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  avatarInitialsCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsTextBig: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  verifiedText: {
    fontSize: 9,
    lineHeight: 11,
    includeFontPadding: false,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 12,
    marginBottom: 4,
  },
  role: {
    fontSize: 11,
    fontWeight: '600',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    marginTop: 8,
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
