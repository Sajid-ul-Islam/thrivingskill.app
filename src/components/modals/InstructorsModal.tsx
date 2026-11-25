import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  TextInput,
  Platform,
  ActivityIndicator,
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
import { getInstructorAvatarSource } from '../../utils/imageUtils';
import { Env } from '../../config/env';

interface InstructorsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAuthor?: (author: CourseAuthorItem) => void;
}

type FilterCategory = 'all' | 'leadership' | 'faculty';

interface AuthorAvatarProps {
  name: string;
  avatarUrl?: string;
  localAvatar?: any;
  isFounder?: boolean;
  colors: any;
  isDark: boolean;
}

const AuthorAvatar: React.FC<AuthorAvatarProps> = ({
  name,
  avatarUrl,
  localAvatar,
  isFounder,
  colors,
  isDark,
}) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (text: string) => {
    if (!text) return 'TS';
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarSource = localAvatar || getInstructorAvatarSource(name, avatarUrl);

  return (
    <View style={styles.avatarWrapper}>
      {!hasError && avatarSource ? (
        <Image
          source={avatarSource}
          style={[
            styles.avatar,
            {
              borderColor: isFounder ? '#E34234' : colors.border,
            },
          ]}
          onError={() => setHasError(true)}
          {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarFallback,
            {
              backgroundColor: isFounder ? '#102F53' : isDark ? '#1E293B' : '#E2E8F0',
              borderColor: isFounder ? '#E34234' : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.avatarInitials,
              { color: isFounder ? '#FFFFFF' : isDark ? '#F8FAFC' : '#102F53' },
            ]}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}

      {isFounder && (
        <View style={styles.founderCrownPill}>
          <Ionicons name="star" size={10} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

export const InstructorsModal: React.FC<InstructorsModalProps> = ({
  visible,
  onClose,
  onSelectAuthor,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [instructorsList, setInstructorsList] = useState<CourseAuthorItem[]>(() =>
    SiteNavigationService.getInstructors()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLiveInstructors = async () => {
    setIsRefreshing(true);
    try {
      const liveData = await SiteNavigationService.fetchInstructorsFromLiveApi();
      if (liveData && liveData.length > 0) {
        setInstructorsList(liveData);
      }
    } catch {
      // Fallback to canonical instructors preserved
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadLiveInstructors();
    }
  }, [visible]);

  const filteredInstructors = useMemo(() => {
    let list = instructorsList;

    if (activeFilter === 'leadership') {
      list = list.filter(
        (item) => item.category === 'founder' || item.category === 'leadership' || item.isFounder
      );
    } else if (activeFilter === 'faculty') {
      list = list.filter((item) => item.category === 'faculty' && !item.isFounder);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const nameMatch =
          item.name.toLowerCase().includes(q) ||
          (item.banglaName && item.banglaName.toLowerCase().includes(q));
        const desigMatch =
          item.designation.toLowerCase().includes(q) ||
          (item.banglaDesignation && item.banglaDesignation.toLowerCase().includes(q));
        const orgMatch =
          item.organization.toLowerCase().includes(q) ||
          (item.banglaOrganization && item.banglaOrganization.toLowerCase().includes(q));
        const expMatch =
          item.expertise?.some((e) => e.toLowerCase().includes(q)) ||
          item.banglaExpertise?.some((e) => e.toLowerCase().includes(q));
        return nameMatch || desigMatch || orgMatch || expMatch;
      });
    }

    return list;
  }, [instructorsList, activeFilter, searchQuery]);

  if (!visible) return null;

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

  const counts = {
    all: instructorsList.length,
    leadership: instructorsList.filter(
      (item) => item.category === 'founder' || item.category === 'leadership' || item.isFounder
    ).length,
    faculty: instructorsList.filter((item) => item.category === 'faculty' && !item.isFounder)
      .length,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: isDark ? 'rgba(227, 66, 52, 0.16)' : '#FEE2E2' },
              ]}
            >
              <Ionicons name="people" size={20} color="#E34234" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {isBangla
                  ? 'আমাদের সম্মানিত শিক্ষক ও পরিচালনা পর্ষদ'
                  : 'Leadership & Certified Faculty'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {isBangla
                  ? 'থ্রাইভিং স্কিলসের প্রতিষ্ঠাতা, লিডারশিপ ও প্রশিক্ষক'
                  : 'Founders, Industry Leaders & Master Mentors'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                loadLiveInstructors();
              }}
              disabled={isRefreshing}
              style={[styles.headerActionBtn, { backgroundColor: colors.surfaceSubtle }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Sync instructor data from live platform"
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#E34234" />
              ) : (
                <Ionicons name="sync-outline" size={18} color={colors.text} />
              )}
            </TouchableOpacity>

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
        </View>

        {/* Search & Filter Bar */}
        <View
          style={[
            styles.controlsBar,
            { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border },
          ]}
        >
          {/* Search Input */}
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={17} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={
                isBangla ? 'নাম, পদবি বা দক্ষতা দিয়ে খুঁজুন...' : 'Search by name, role, or skill...'
              }
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Segmented Filter Tabs */}
          <View style={[styles.filterSegmentRow, { backgroundColor: colors.surfaceSubtle }]}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setActiveFilter('all');
              }}
              style={[
                styles.segmentTab,
                activeFilter === 'all' && [
                  styles.segmentTabActive,
                  { backgroundColor: colors.surfaceCard },
                ],
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.segmentTabText,
                  {
                    color:
                      activeFilter === 'all' ? (isDark ? '#E34234' : '#102F53') : colors.textMuted,
                  },
                  activeFilter === 'all' && styles.segmentTabTextActive,
                ]}
              >
                {isBangla ? 'সকল' : 'All'} ({counts.all})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setActiveFilter('leadership');
              }}
              style={[
                styles.segmentTab,
                activeFilter === 'leadership' && [
                  styles.segmentTabActive,
                  { backgroundColor: colors.surfaceCard },
                ],
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.segmentTabText,
                  {
                    color:
                      activeFilter === 'leadership'
                        ? isDark
                          ? '#E34234'
                          : '#102F53'
                        : colors.textMuted,
                  },
                  activeFilter === 'leadership' && styles.segmentTabTextActive,
                ]}
              >
                {isBangla ? 'ফাউন্ডার্স ও টিম' : 'Founders & Team'} ({counts.leadership})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setActiveFilter('faculty');
              }}
              style={[
                styles.segmentTab,
                activeFilter === 'faculty' && [
                  styles.segmentTabActive,
                  { backgroundColor: colors.surfaceCard },
                ],
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.segmentTabText,
                  {
                    color:
                      activeFilter === 'faculty'
                        ? isDark
                          ? '#E34234'
                          : '#102F53'
                        : colors.textMuted,
                  },
                  activeFilter === 'faculty' && styles.segmentTabTextActive,
                ]}
              >
                {isBangla ? 'ফ্যাকাল্টি' : 'Faculty'} ({counts.faculty})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
          ]}
        >
          {/* Become an Instructor Callout Banner */}
          <View
            style={[
              styles.joinBanner,
              {
                backgroundColor: isDark ? '#162840' : '#EFF6FF',
                borderColor: isDark ? '#1E3A5F' : '#DBEAFE',
              },
            ]}
          >
            <View style={styles.joinBannerContent}>
              <View
                style={[styles.joinIconWrap, { backgroundColor: isDark ? '#102F53' : '#DBEAFE' }]}
              >
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
              style={[styles.joinBtn, { backgroundColor: '#102F53' }]}
              activeScale={0.96}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'প্রশিক্ষক হিসেবে আবেদন করুন' : 'Apply as Instructor'}
            >
              <Ionicons
                name="person-add-outline"
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.joinBtnText}>{isBangla ? 'আবেদন করুন →' : 'Apply Now →'}</Text>
            </SpringPressable>
          </View>

          {/* Section Heading */}
          <View style={styles.sectionHeadingRow}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
              {activeFilter === 'leadership'
                ? isBangla
                  ? 'প্রতিষ্ঠাতা ও পরিচালনা পর্ষদ'
                  : 'FOUNDERS & EXECUTIVE LEADERSHIP'
                : activeFilter === 'faculty'
                  ? isBangla
                    ? 'সার্টিফাইড ফ্যাকাল্টি ও মাস্টার মেন্টর'
                    : 'CERTIFIED FACULTY & MASTER MENTORS'
                  : isBangla
                    ? 'সকল প্রোফাইল ও প্রশিক্ষকবৃন্দ'
                    : 'ALL PROFILES & FACULTY MEMBERS'}
            </Text>
            <Text style={[styles.resultsCountBadge, { color: colors.textMuted }]}>
              {filteredInstructors.length} {isBangla ? 'জন' : 'Profiles'}
            </Text>
          </View>

          {/* Empty State */}
          {filteredInstructors.length === 0 && (
            <View
              style={[
                styles.emptyContainer,
                { backgroundColor: colors.surfaceCard, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={36}
                color={colors.textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {isBangla ? 'কোনো প্রোফাইল পাওয়া যায়নি' : 'No Profiles Found'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {isBangla
                  ? 'ভিন্ন কোনো নাম বা কি-ওয়ার্ড দিয়ে আবার চেষ্টা করুন।'
                  : 'Try searching with another name or specialty.'}
              </Text>
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={[styles.clearSearchBtn, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityRole="button"
                accessibilityLabel="Clear Search Filter"
              >
                <Text style={[styles.clearSearchText, { color: colors.primary }]}>
                  {isBangla ? 'অনুসন্ধান মুছুন' : 'Clear Search'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Authors List */}
          {filteredInstructors.map((author) => {
            const isFounder = author.isFounder || author.category === 'founder';
            const badgeLabel = isBangla && author.banglaBadge ? author.banglaBadge : author.badge;
            const expertiseList =
              isBangla && author.banglaExpertise ? author.banglaExpertise : author.expertise;

            return (
              <View
                key={author.id}
                style={[
                  styles.authorCard,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: isFounder
                      ? isDark
                        ? 'rgba(227, 66, 52, 0.45)'
                        : '#FECACA'
                      : colors.border,
                    borderWidth: isFounder ? 1.5 : 1,
                    shadowColor: colors.cardShadow,
                  },
                ]}
              >
                {/* Author Card Header */}
                <View style={styles.authorHeader}>
                  <AuthorAvatar
                    name={author.name}
                    avatarUrl={author.avatarUrl}
                    localAvatar={author.localAvatar}
                    isFounder={isFounder}
                    colors={colors}
                    isDark={isDark}
                  />

                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
                        {isBangla && author.banglaName ? author.banglaName : author.name}
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10B981"
                        style={{ marginLeft: 4 }}
                      />
                    </View>

                    <Text
                      style={[styles.authorDesignation, { color: colors.primary }]}
                      numberOfLines={2}
                    >
                      {isBangla && author.banglaDesignation
                        ? author.banglaDesignation
                        : author.designation}
                    </Text>

                    <Text style={[styles.authorOrg, { color: colors.textMuted }]} numberOfLines={1}>
                      {isBangla && author.banglaOrganization
                        ? author.banglaOrganization
                        : author.organization}
                    </Text>

                    {badgeLabel && (
                      <View
                        style={[
                          styles.badgePill,
                          {
                            backgroundColor: isFounder
                              ? isDark
                                ? 'rgba(227, 66, 52, 0.2)'
                                : '#FEE2E2'
                              : isDark
                                ? 'rgba(16, 47, 83, 0.4)'
                                : '#EFF6FF',
                            borderColor: isFounder ? '#E34234' : isDark ? '#2563EB44' : '#BFDBFE',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: isFounder ? '#E34234' : isDark ? '#60A5FA' : '#1D4ED8' },
                          ]}
                        >
                          {badgeLabel}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Bio */}
                <Text style={[styles.authorBio, { color: colors.textMuted }]} numberOfLines={3}>
                  {isBangla && author.banglaBio ? author.banglaBio : author.bio}
                </Text>

                {/* Expertise Chips */}
                {expertiseList && expertiseList.length > 0 && (
                  <View style={styles.skillsRow}>
                    {expertiseList.map((skill, sIdx) => (
                      <View
                        key={sIdx}
                        style={[
                          styles.skillChip,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.skillChipText, { color: colors.text }]}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Footer with stats & Profile CTA */}
                <View style={[styles.authorFooter, { borderTopColor: colors.border }]}>
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
                    accessibilityRole="button"
                    accessibilityLabel={`View profile of ${author.name}`}
                  >
                    <Text style={[styles.viewProfileText, { color: colors.primary }]}>
                      {isBangla ? 'প্রোফাইল দেখুন →' : 'View Profile →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: shape.medium,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterSegmentRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: shape.medium,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: shape.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTabTextActive: {
    fontWeight: '800',
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
    color: '#FFFFFF',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resultsCountBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 24,
    borderRadius: shape.large,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  clearSearchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: shape.medium,
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  authorCard: {
    borderRadius: shape.large,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  authorHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  founderCrownPill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#E34234',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  authorDesignation: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 16,
  },
  authorOrg: {
    fontSize: 11.5,
    marginTop: 1,
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 5,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  authorBio: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: shape.small,
    borderWidth: 1,
  },
  skillChipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  authorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
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
