import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserProfile } from '../../services/api/userService';
import { triggerHaptic } from '../../utils/haptics';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { getSafeImageSource } from '../../utils/imageUtils';

export interface FullProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  activeWorkspaceName?: string;
  colors: any;
  isDark: boolean;
  isBangla: boolean;
}

export const FullProfileModal: React.FC<FullProfileModalProps> = ({
  visible,
  onClose,
  onEditProfile,
  user,
  isAuthenticated,
  isAdmin,
  activeWorkspaceName = 'Default Workspace',
  colors,
  isDark,
  isBangla,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const displayName =
    user?.name ||
    user?.displayName ||
    user?.username ||
    (isBangla ? 'শিক্ষার্থী' : 'Learner');

  const username = user?.username ? `@${user.username}` : '';
  const email = user?.email || (isBangla ? 'যোগ করা হয়নি' : 'Not provided');
  const phone = user?.phone || '';
  const city = user?.city || '';
  const bio = user?.description || '';
  const avatarUri =
    user?.avatar ||
    (user?.avatar_urls &&
      (user.avatar_urls['96'] || user.avatar_urls['48'] || user.avatar_urls['24']));

  // Calculate profile completion metrics
  const completionItems = [
    { label: isBangla ? 'নাম' : 'Name', completed: Boolean(user?.name || user?.first_name) },
    { label: isBangla ? 'ইমেইল' : 'Email', completed: Boolean(user?.email) },
    { label: isBangla ? 'ফোন নম্বর' : 'Phone Number', completed: Boolean(user?.phone) },
    { label: isBangla ? 'প্রোফাইল ছবি' : 'Avatar Photo', completed: Boolean(avatarUri) },
    { label: isBangla ? 'বায়ো/বিবরণ' : 'Bio / Tagline', completed: Boolean(user?.description) },
    { label: isBangla ? 'শহর/ঠিকানা' : 'City / Location', completed: Boolean(user?.city) },
  ];
  const completedCount = completionItems.filter((i) => i.completed).length;
  const completionPct = Math.round((completedCount / completionItems.length) * 100);

  const handleEditPress = () => {
    triggerHaptic('medium');
    onClose();
    // Allow sheet to dismiss before presenting settings form
    setTimeout(() => {
      onEditProfile();
    }, 280);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropOverlay}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close profile view"
        />

        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Top Handle Bar */}
          <View style={[styles.handleBar, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }]} />

          {/* Header Row */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.borderSubtle }]}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="person-circle" size={20} color={colors.primary} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {isBangla ? 'সম্পূর্ণ প্রোফাইল বিবরণ' : 'Full Learner Profile'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? colors.surfaceSubtle : '#F1F5F9' }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Cover Banner with Avatar Overlap */}
            <View style={styles.coverWrapper}>
              {user?.cover_photo ? (
                <Image
                  source={getSafeImageSource(user.cover_photo)}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.coverFallback}>
                  <View style={styles.coverOverlayPattern} />
                </View>
              )}

              {/* Large Overlapping Avatar */}
              <View style={styles.avatarAnchor}>
                {avatarUri ? (
                  <Image
                    source={getSafeImageSource(avatarUri)}
                    style={[styles.largeAvatar, { borderColor: colors.surfaceCard }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.largeAvatar,
                      styles.avatarFallback,
                      { backgroundColor: colors.primary, borderColor: colors.surfaceCard },
                    ]}
                  >
                    <Text style={styles.avatarInitial}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.statusDot} />
              </View>
            </View>

            {/* User Title & Role Block */}
            <View style={styles.identityBlock}>
              <View style={styles.nameBadgeRow}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {displayName}
                </Text>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: isAdmin
                        ? 'rgba(227, 66, 52, 0.12)'
                        : 'rgba(16, 47, 83, 0.10)',
                      borderColor: isAdmin ? '#E34234' : colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name={isAdmin ? 'shield-checkmark' : 'school-outline'}
                    size={13}
                    color={isAdmin ? '#E34234' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.roleBadgeText,
                      { color: isAdmin ? '#E34234' : colors.primary },
                    ]}
                  >
                    {isAdmin ? 'ADMINISTRATOR' : isAuthenticated ? 'VERIFIED STUDENT' : 'GUEST'}
                  </Text>
                </View>
              </View>

              {username ? (
                <Text style={[styles.usernameText, { color: colors.textMuted }]}>
                  {username}
                </Text>
              ) : null}

              {bio ? (
                <Text style={[styles.bioText, { color: colors.textMuted }]}>
                  {bio}
                </Text>
              ) : null}
            </View>

            {/* Profile Completion Indicator */}
            <View
              style={[
                styles.completionCard,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <View style={styles.completionTopRow}>
                <View style={styles.completionLabelWrap}>
                  <Ionicons
                    name="sparkles"
                    size={16}
                    color={completionPct >= 80 ? '#10B981' : '#E34234'}
                  />
                  <Text style={[styles.completionTitle, { color: colors.text }]}>
                    {isBangla ? 'প্রোফাইল সম্পূর্ণতা' : 'Profile Strength'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.completionPct,
                    { color: completionPct >= 80 ? '#10B981' : '#E34234' },
                  ]}
                >
                  {completionPct}%
                </Text>
              </View>

              <View style={[styles.trackBg, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <View
                  style={[
                    styles.trackFill,
                    {
                      width: `${completionPct}%`,
                      backgroundColor: completionPct >= 80 ? '#10B981' : '#E34234',
                    },
                  ]}
                />
              </View>

              <View style={styles.checklistRow}>
                {completionItems.map((item, idx) => (
                  <View key={idx} style={styles.checkItem}>
                    <Ionicons
                      name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={13}
                      color={item.completed ? '#10B981' : colors.textLight}
                    />
                    <Text
                      style={[
                        styles.checkItemText,
                        { color: item.completed ? colors.text : colors.textMuted },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Detailed Account Attributes Card */}
            <View
              style={[
                styles.detailsCard,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>
                {isBangla ? 'যোগাযোগ ও অ্যাকাউন্ট তথ্য' : 'Contact & Account Details'}
              </Text>

              {/* Email */}
              <View style={styles.attributeRow}>
                <View style={[styles.attrIconBox, { backgroundColor: isDark ? 'rgba(16,47,83,0.35)' : '#E8EEF5' }]}>
                  <Ionicons name="mail-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.attrContent}>
                  <Text style={[styles.attrLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'ইমেইল এড্রেস' : 'Email Address'}
                  </Text>
                  <Text style={[styles.attrValue, { color: colors.text }]}>
                    {email}
                  </Text>
                </View>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              </View>

              {/* Phone */}
              <View style={styles.attributeRow}>
                <View style={[styles.attrIconBox, { backgroundColor: isDark ? 'rgba(16,47,83,0.35)' : '#E8EEF5' }]}>
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.attrContent}>
                  <Text style={[styles.attrLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </Text>
                  <Text style={[styles.attrValue, { color: phone ? colors.text : '#E34234' }]}>
                    {phone || (isBangla ? '+ ফোন নম্বর যোগ করুন (প্রয়োজনীয়)' : '+ Add Phone Number (Required)')}
                  </Text>
                </View>
                {phone ? (
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                ) : (
                  <TouchableOpacity onPress={handleEditPress}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#E34234' }}>
                      {isBangla ? 'যোগ করুন' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* City / Location */}
              <View style={styles.attributeRow}>
                <View style={[styles.attrIconBox, { backgroundColor: isDark ? 'rgba(16,47,83,0.35)' : '#E8EEF5' }]}>
                  <Ionicons name="location-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.attrContent}>
                  <Text style={[styles.attrLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'শহর / ঠিকানা' : 'City / Location'}
                  </Text>
                  <Text style={[styles.attrValue, { color: colors.text }]}>
                    {city || (isBangla ? 'উল্লেখ করা হয়নি' : 'Not specified')}
                  </Text>
                </View>
              </View>

              {/* Workspace / Platform */}
              <View style={styles.attributeRow}>
                <View style={[styles.attrIconBox, { backgroundColor: isDark ? 'rgba(16,47,83,0.35)' : '#E8EEF5' }]}>
                  <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.attrContent}>
                  <Text style={[styles.attrLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'অ্যাক্টিভ ওয়ার্কস্পেস' : 'Active Workspace'}
                  </Text>
                  <Text style={[styles.attrValue, { color: colors.text }]}>
                    {activeWorkspaceName}
                  </Text>
                </View>
              </View>

              {/* Security & LMS Connection */}
              <View style={[styles.attributeRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.attrIconBox, { backgroundColor: isDark ? 'rgba(16,47,83,0.35)' : '#E8EEF5' }]}>
                  <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.attrContent}>
                  <Text style={[styles.attrLabel, { color: colors.textMuted }]}>
                    {isBangla ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
                  </Text>
                  <Text style={[styles.attrValue, { color: '#10B981', fontWeight: '700' }]}>
                    Active • TLS Encrypted LMS
                  </Text>
                </View>
              </View>
            </View>

            {/* Social Links (if configured) */}
            {(user?.social?.facebook || user?.social?.linkedin || user?.social?.twitter || user?.social?.youtube) ? (
              <View
                style={[
                  styles.detailsCard,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>
                  {isBangla ? 'সোশ্যাল প্রোফাইল' : 'Social Profiles'}
                </Text>
                <View style={styles.socialRow}>
                  {user.social.facebook ? (
                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPress={() => user.social?.facebook && Linking.openURL(user.social.facebook).catch(() => {})}
                    >
                      <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                      <Text style={[styles.socialText, { color: colors.text }]}>Facebook</Text>
                    </TouchableOpacity>
                  ) : null}
                  {user.social.linkedin ? (
                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPress={() => user.social?.linkedin && Linking.openURL(user.social.linkedin).catch(() => {})}
                    >
                      <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
                      <Text style={[styles.socialText, { color: colors.text }]}>LinkedIn</Text>
                    </TouchableOpacity>
                  ) : null}
                  {user.social.youtube ? (
                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPress={() => user.social?.youtube && Linking.openURL(user.social.youtube).catch(() => {})}
                    >
                      <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                      <Text style={[styles.socialText, { color: colors.text }]}>YouTube</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Primary Action Button: Edit Profile Details */}
            <TouchableOpacity
              style={[styles.editButtonCta, { backgroundColor: '#E34234' }]}
              onPress={handleEditPress}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Edit Profile Details"
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.editButtonCtaText}>
                {isBangla ? 'প্রোফাইল তথ্য সম্পাদন করুন' : 'Edit Profile Details'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 13, 24, 0.72)',
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '92%',
    paddingTop: 12,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 30,
    alignItems: 'center',
  },
  coverWrapper: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 44,
  },
  coverImage: {
    width: '100%',
    height: 110,
    borderRadius: 16,
  },
  coverFallback: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    backgroundColor: '#102F53',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverOverlayPattern: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 182, 6, 0.08)',
    borderRadius: 16,
  },
  avatarAnchor: {
    position: 'absolute',
    bottom: -36,
    left: 20,
  },
  largeAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  identityBlock: {
    width: '100%',
    marginBottom: 16,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  usernameText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  completionCard: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  completionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completionLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  completionPct: {
    fontSize: 14,
    fontWeight: '900',
  },
  trackBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  checklistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailsCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    gap: 12,
  },
  attrIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attrContent: {
    flex: 1,
    minWidth: 0,
  },
  attrLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 1,
  },
  attrValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.25)',
  },
  socialText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButtonCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
