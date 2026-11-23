import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { SpringPressable } from '../common/SpringPressable';
import { triggerHaptic } from '../../utils/haptics';
import { SiteNavigationService, CourseAuthorItem } from '../../services/site/siteNavigationService';
import { Env } from '../../config/env';

interface InstructorsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAuthor?: (author: CourseAuthorItem) => void;
}

export const InstructorsModal: React.FC<InstructorsModalProps> = ({
  visible,
  onClose,
  onSelectAuthor,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const instructors = SiteNavigationService.getInstructors();

  const handleBecomeInstructor = () => {
    triggerHaptic('medium');
    Linking.openURL(`${Env.SITE_URL}/become-an-instructor/`).catch(() => {});
  };

  const handleOpenAuthorProfile = (author: CourseAuthorItem) => {
    triggerHaptic('light');
    if (onSelectAuthor) {
      onSelectAuthor(author);
    } else {
      Linking.openURL(author.profileUrl).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.surfaceCard,
              paddingTop: insets.top ? insets.top + 8 : 16,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255, 182, 6, 0.15)' : '#FFFBEB' }]}>
              <Ionicons name="people" size={20} color="#FFB606" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isBangla ? 'আমাদের কোর্স ইন্সট্রাক্টরগণ' : 'Our Course Authors'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {isBangla ? 'শীর্ষস্থানীয় ইন্ডাস্ট্রি প্র্যাকটিশনার' : 'Industry Executives & Academicians'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.surfaceSubtle }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close instructors modal"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}>
          {/* Become an Instructor Callout Banner */}
          <View
            style={[
              styles.joinBanner,
              {
                backgroundColor: isDark ? '#1C2E46' : '#EFF6FF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.joinBannerContent}>
              <View style={[styles.joinIconWrap, { backgroundColor: isDark ? '#24364B' : '#DBEAFE' }]}>
                <Ionicons name="school" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.joinTitle, { color: colors.text }]}>
                  {isBangla ? 'ইন্সট্রাক্টর হতে চান?' : 'Become An Instructor'}
                </Text>
                <Text style={[styles.joinText, { color: colors.textMuted }]}>
                  {isBangla
                    ? 'আপনার পেশাগত দক্ষতা ও অভিজ্ঞতা শিক্ষার্থীদের সাথে শেয়ার করুন এবং রয়্যালটি আয় করুন।'
                    : 'Share your expertise with 200,000+ ambitious learners nationwide and earn royalties.'}
                </Text>
              </View>
            </View>
            <SpringPressable
              onPress={handleBecomeInstructor}
              style={[styles.joinBtn, { backgroundColor: colors.secondary }]}
              activeScale={0.96}
            >
              <Ionicons name="person-add-outline" size={16} color="#102F53" style={{ marginRight: 6 }} />
              <Text style={styles.joinBtnText}>
                {isBangla ? 'আবেদন করুন →' : 'Apply Now →'}
              </Text>
            </SpringPressable>
          </View>

          {/* Authors List */}
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            {isBangla ? 'সার্টিফাইড ফ্যাকাল্টি ও এক্সপার্ট' : 'CERTIFIED FACULTY & EXPERTS'}
          </Text>

          {instructors.map((author) => (
            <View
              key={author.id}
              style={[
                styles.authorCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              <View style={styles.authorHeader}>
                <Image
                  source={{ uri: author.avatarUrl }}
                  style={[styles.avatar, { borderColor: colors.border }]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.authorName, { color: colors.text }]}>
                    {isBangla && author.banglaName ? author.banglaName : author.name}
                  </Text>
                  <Text style={[styles.authorDesignation, { color: colors.primary }]}>
                    {author.designation}
                  </Text>
                  <Text style={[styles.authorOrg, { color: colors.textMuted }]}>
                    {author.organization}
                  </Text>
                </View>
              </View>

              <Text style={[styles.authorBio, { color: colors.textMuted }]} numberOfLines={3}>
                {author.bio}
              </Text>

              <View style={styles.authorFooter}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="book-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.statText, { color: colors.text }]}>
                      {author.coursesCount} {isBangla ? 'কোর্স' : 'Courses'}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.statText, { color: colors.text }]}>
                      {author.studentsCount.toLocaleString()} {isBangla ? 'শিক্ষার্থী' : 'Students'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleOpenAuthorProfile(author)}
                  style={styles.viewProfileTouch}
                >
                  <Text style={[styles.viewProfileText, { color: colors.primary }]}>
                    {isBangla ? 'প্রোফাইল দেখুন →' : 'View Profile →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  joinBanner: {
    borderRadius: shape.large,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  joinBannerContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  joinIconWrap: {
    width: 40,
    height: 40,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  joinText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: shape.medium,
    alignSelf: 'flex-start',
    minHeight: 38,
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#102F53',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  authorCard: {
    borderRadius: shape.large,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  authorHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 1,
  },
  authorDesignation: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  authorOrg: {
    fontSize: 11.5,
  },
  authorBio: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 12,
  },
  authorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  viewProfileTouch: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
