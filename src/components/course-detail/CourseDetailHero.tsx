import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Course, Lesson } from '../../types';
import { YouTubeVideo } from '../../data/youtubeVideos';

interface CourseDetailHeroProps {
  course: Course;
  isEnrolled: boolean;
  isAdmin: boolean;
  trailerVideo?: YouTubeVideo | null;
  isTablet?: boolean;
  hasReviewed: boolean;
  isCompleted: boolean;
  onPlayTrailer?: (video: YouTubeVideo) => void;
  onEnrollOrResume: () => void;
  onNavigateToLesson: (lessonId: string) => void;
  onOpenCertPreview: () => void;
  onOpenMandatoryReview: () => void;
}

export const CourseDetailHero: React.FC<CourseDetailHeroProps> = ({
  course,
  isEnrolled,
  isAdmin,
  trailerVideo,
  isTablet,
  hasReviewed,
  isCompleted,
  onPlayTrailer,
  onEnrollOrResume,
  onNavigateToLesson,
  onOpenCertPreview,
  onOpenMandatoryReview,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  const previewLesson =
    course.modules?.flatMap((m) => m.lessons || []).find((l) => l.isFreePreview) ||
    course.modules?.[0]?.lessons?.[0];

  const handleHeroPlayPress = () => {
    if (isEnrolled || isAdmin) {
      onEnrollOrResume();
      return;
    }
    if (trailerVideo && onPlayTrailer) {
      onPlayTrailer(trailerVideo);
      return;
    }
    if (previewLesson) {
      onNavigateToLesson(previewLesson.id);
    } else {
      onEnrollOrResume();
    }
  };

  return (
    <View style={styles.container}>
      {/* Thumbnail Hero with Preview Button */}
      <View style={[styles.heroWrapper, isTablet && { height: 360 }]}>
        <Image
          source={{ uri: course.thumbnail, cache: 'force-cache' }}
          style={styles.heroThumbnail}
        />
        {course.badge && (
          <View style={[styles.badgeTag, { backgroundColor: colors.badgeBackground }]}>
            <Text style={[styles.badgeText, { color: colors.badgeText }]}>{course.badge}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.previewPlayBtn, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
          onPress={handleHeroPlayPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            isEnrolled || isAdmin
              ? 'Resume course lecture'
              : trailerVideo
              ? 'Watch Video Trailer'
              : 'Watch Free Preview'
          }
        >
          <Ionicons name="play" size={28} color="#FFFFFF" />
          <Text style={styles.previewBtnText}>
            {isEnrolled || isAdmin
              ? isBangla
                ? 'কোর্স শুরু / চালিয়ে যান'
                : 'Resume Course'
              : trailerVideo
              ? isBangla
                ? 'ট্রেইলার ভিডিও দেখুন'
                : 'Watch Video Trailer'
              : isBangla
              ? 'ফ্রি প্রিভিউ দেখুন'
              : 'Watch Free Preview'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Course Video Trailer Banner */}
      {trailerVideo && (
        <TouchableOpacity
          style={[
            styles.trailerCard,
            {
              backgroundColor: isDark ? '#1F2937' : '#EFF6FF',
              borderColor: isDark ? '#374151' : '#BFDBFE',
            },
          ]}
          onPress={() => onPlayTrailer && onPlayTrailer(trailerVideo)}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'ফ্রি কোর্স ট্রেইলার ভিডিও দেখুন' : 'Watch Free Course Trailer'}
        >
          <View style={styles.trailerThumbWrapper}>
            <Image
              source={{ uri: trailerVideo.thumbnail, cache: 'force-cache' }}
              style={styles.trailerThumb}
            />
            <View style={styles.trailerPlayOverlay}>
              <Ionicons name="play" size={14} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.trailerInfo}>
            <View style={styles.trailerBadgeRow}>
              <View style={styles.trailerBadge}>
                <Ionicons name="logo-youtube" size={12} color="#FF0000" />
                <Text style={styles.trailerBadgeText}>
                  {isBangla ? 'ফ্রি কোর্স ট্রেইলার' : 'FREE COURSE TRAILER'}
                </Text>
              </View>
              {trailerVideo.duration ? (
                <Text style={[styles.trailerDuration, { color: colors.textMuted }]}>
                  {trailerVideo.duration}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.trailerTitle, { color: colors.text }]} numberOfLines={1}>
              {trailerVideo.title}
            </Text>
            <Text style={[styles.trailerPrompt, { color: colors.primary }]}>
              {isBangla ? 'মেন্টরের পরিচিতি ভিডিও দেখুন →' : 'Watch free mentor overview →'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Main Course Info Header */}
      <View style={styles.mainInfo}>
        <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text>
        <Text style={[styles.courseSubtitle, { color: colors.textMuted }]}>
          {course.subtitle}
        </Text>

        {/* Stats Bar */}
        <View style={[styles.statsBar, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <View style={styles.statCell}>
            <Ionicons name="star" size={16} color={colors.starColor} />
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
              {course.rating}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>
              ({course.reviewsCount})
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.statCell}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
              {course.enrolledCount.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {isBangla ? 'এনরোল্ড' : 'Enrolled'}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.statCell}>
            <Ionicons name="time-outline" size={16} color={colors.secondary} />
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
              {course.durationHours}h
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {isBangla ? 'মোট' : 'Total'}
            </Text>
          </View>
        </View>

        {/* Highlights */}
        {course.highlights && course.highlights.length > 0 && (
          <View style={[styles.highlightsCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Text style={[styles.highlightsHeading, { color: colors.text }]}>
              {isBangla ? 'যা যা শিখবেন' : "What You'll Master"}
            </Text>
            <View style={styles.highlightsList}>
              {course.highlights.map((item, idx) => (
                <View key={idx} style={styles.highlightRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[styles.highlightText, { color: colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Institutional Trust & Partners Strip */}
        <View style={[styles.trustStripCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="shield-checkmark" size={15} color={colors.primary} />
            <Text style={[styles.trustStripTitle, { color: colors.primary, flex: 1 }]} numberOfLines={2}>
              {isBangla ? 'শীর্ষ অ্যাকাডেমিক ও কর্পোরেট পার্টনারদের আস্থা' : 'TRUSTED BY TOP ACADEMIC & ENTERPRISE PARTNERS'}
            </Text>
          </View>

          <View style={styles.partnerLogosRow}>
            <View style={[styles.partnerTag, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <Ionicons name="school-outline" size={13} color={colors.text} />
              <Text style={[styles.partnerTagText, { color: colors.text }]}>Dhaka University (DU)</Text>
            </View>
            <View style={[styles.partnerTag, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <Ionicons name="people-outline" size={13} color={colors.text} />
              <Text style={[styles.partnerTagText, { color: colors.text }]}>DUCSU</Text>
            </View>
            <View style={[styles.partnerTag, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <Ionicons name="library-outline" size={13} color={colors.text} />
              <Text style={[styles.partnerTagText, { color: colors.text }]}>North South Univ (NSU)</Text>
            </View>
          </View>

          <View style={styles.trustFeaturesRow}>
            <View style={styles.trustFeatureItem}>
              <Ionicons name="infinite-outline" size={13} color={colors.secondary} />
              <Text style={[styles.trustFeatureText, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                {isBangla ? 'আজীবন অ্যাক্সেস' : 'Lifetime Access'}
              </Text>
            </View>
            <View style={styles.trustFeatureItem}>
              <Ionicons name="phone-portrait-outline" size={13} color={colors.primary} />
              <Text style={[styles.trustFeatureText, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                {isBangla ? 'মোবাইল ও ওয়েব' : 'Mobile & Web'}
              </Text>
            </View>
            <View style={styles.trustFeatureItem}>
              <Ionicons name="ribbon-outline" size={13} color="#10B981" />
              <Text style={[styles.trustFeatureText, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                {isBangla ? 'ভেরিফাইড সার্টিফিকেট' : 'Verified Credential'}
              </Text>
            </View>
          </View>
        </View>

        {/* Official Certificate Card & Preview Trigger */}
        <View style={[styles.certPromoCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <View style={styles.certPromoLeft}>
            <View style={[styles.certIconBg, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7' }]}>
              <Ionicons name="ribbon" size={20} color={isDark ? '#FBBF24' : '#D97706'} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.certPromoTitle, { color: colors.text }]}>
                {isBangla ? 'অফিসিয়াল সার্টিফিকেট অন্তর্ভুক্ত' : 'Official Certificate Included'}
              </Text>
              <Text style={[styles.certPromoSub, { color: colors.textMuted }]}>
                {isBangla
                  ? 'ভেরিফাইড ডিজিটাল ক্রেডেনশিয়াল যা সরাসরি লিঙ্কডইনে শেয়ারযোগ্য।'
                  : 'Verified digital credential directly shareable to LinkedIn.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.certPreviewBtn,
              {
                backgroundColor:
                  isCompleted && !hasReviewed
                    ? '#FEF2F2'
                    : colors.surfaceSubtle,
                borderColor:
                  isCompleted && !hasReviewed
                    ? '#EF4444'
                    : colors.border,
              },
            ]}
            onPress={() => {
              if (isCompleted && !hasReviewed) {
                onOpenMandatoryReview();
              } else {
                onOpenCertPreview();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={
              isBangla ? 'সার্টিফিকেট প্রিভিউ অথবা আনলক করতে রিভিউ' : 'Certificate preview or review to unlock'
            }
          >
            <Ionicons
              name={isCompleted && !hasReviewed ? 'lock-closed' : 'ribbon-outline'}
              size={14}
              color={isCompleted && !hasReviewed ? '#EF4444' : colors.primary}
            />
            <Text
              style={[
                styles.certPreviewBtnText,
                { color: isCompleted && !hasReviewed ? '#EF4444' : colors.primary },
              ]}
            >
              {isCompleted && !hasReviewed
                ? isBangla
                  ? 'রিভিউ দিয়ে আনলক'
                  : 'Review to Unlock'
                : isBangla
                ? 'প্রিভিউ'
                : 'Preview'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  heroWrapper: {
    height: 220,
    position: 'relative',
  },
  heroThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  previewPlayBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  previewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  trailerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  trailerThumbWrapper: {
    width: 68,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  trailerThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  trailerPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailerInfo: {
    flex: 1,
  },
  trailerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 8,
  },
  trailerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 6,
  },
  trailerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF0000',
    letterSpacing: 0.5,
  },
  trailerDuration: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 0,
  },
  trailerTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  trailerPrompt: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  mainInfo: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 6,
  },
  courseSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 16,
  },
  highlightsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  highlightsHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  highlightsList: {
    gap: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    fontSize: 13,
    flex: 1,
  },
  trustStripCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  trustStripTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  partnerLogosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  partnerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  partnerTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trustFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(156, 163, 175, 0.25)',
  },
  trustFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  trustFeatureText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  certPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  certPromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  certIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certPromoTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  certPromoSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  certPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  certPreviewBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
