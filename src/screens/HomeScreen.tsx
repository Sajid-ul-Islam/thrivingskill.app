import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { CategoryPills } from '../components/CategoryPills';
import { CourseCard } from '../components/CourseCard';
import { LiveWorkshopCard } from '../components/LiveWorkshopCard';
import { CORPORATE_CLIENTS, WORKSHOPS } from '../data/mockData';
import { Course, RootTab } from '../types';

interface HomeScreenProps {
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onNavigateTab: (tab: RootTab) => void;
  onOpenCorporateModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToCourse,
  onNavigateToLesson,
  onNavigateTab,
  onOpenCorporateModal,
}) => {
  const { colors, isDark } = useTheme();
  const {
    courses,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    userProgress,
    getCourseProgressPercentage,
  } = useLearning();

  // Find enrolled active course to show "Continue Learning"
  const enrolledCourseIds = Object.keys(userProgress);
  const activeCourseId = enrolledCourseIds[0];
  const activeCourse = courses.find((c) => c.id === activeCourseId);
  const activeProgress = activeCourse ? userProgress[activeCourse.id] : undefined;
  const activeProgressPercent = activeCourse ? getCourseProgressPercentage(activeCourse.id) : 0;

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredCourses = courses.slice(0, 3);
  const trendingCourses = courses.filter((c) => c.badge === 'Trending' || c.badge === 'Bestseller');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#064E3B',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={12} color="#FBBF24" />
            <Text style={styles.heroBadgeText}>INDUSTRY-READY WORKFORCE</Text>
          </View>

          <Text style={styles.heroTitle}>Master In-Demand Skills for Tomorrow</Text>
          <Text style={styles.heroSubtitle}>
            Practical executive courses in Generative AI, Financial Modeling, Leadership & Analytics
            taught by industry leaders.
          </Text>

          {/* Quick Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF' }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? colors.text : '#0F172A' }]}
              placeholder="Search skills, AI, finance, leadership..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Continue Learning Resume Card (if enrolled) */}
        {activeCourse && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Learning</Text>
              <TouchableOpacity onPress={() => onNavigateTab('MyLearning')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>My Hub →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.resumeCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
              onPress={() => {
                const targetLessonId =
                  activeProgress?.lastAccessedLessonId ||
                  activeCourse.modules[0]?.lessons[0]?.id ||
                  '';
                onNavigateToLesson(activeCourse.id, targetLessonId);
              }}
              activeOpacity={0.88}
            >
              <Image source={{ uri: activeCourse.thumbnail }} style={styles.resumeThumb} />
              <View style={styles.resumeInfo}>
                <Text style={[styles.resumeCourseTitle, { color: colors.text }]} numberOfLines={1}>
                  {activeCourse.title}
                </Text>
                <Text style={[styles.resumeInstructor, { color: colors.textMuted }]}>
                  {activeCourse.instructor.name}
                </Text>

                <View style={styles.resumeProgressRow}>
                  <View style={[styles.resumeTrack, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.resumeFill,
                        { backgroundColor: colors.primary, width: `${activeProgressPercent}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.resumePercentText, { color: colors.primary }]}>
                    {activeProgressPercent}%
                  </Text>
                </View>
              </View>

              <View style={[styles.playBtnBg, { backgroundColor: colors.primary }]}>
                <Ionicons name="play" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Filter Pills */}
        <View style={styles.categorySection}>
          <CategoryPills
            selectedId={selectedCategory}
            onSelect={(id) => {
              setSelectedCategory(id);
              if (id !== 'all') {
                onNavigateTab('Courses');
              }
            }}
          />
        </View>

        {/* Featured Masterclasses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Masterclasses</Text>
            <TouchableOpacity onPress={() => onNavigateTab('Courses')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View All ({courses.length})</Text>
            </TouchableOpacity>
          </View>

          {filteredCourses.slice(0, 3).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => onNavigateToCourse(course.id)}
            />
          ))}
        </View>

        {/* Corporate Training B2B Spotlight */}
        <View
          style={[
            styles.corporateBanner,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#1E1B4B',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.corporateBadge}>
            <Ionicons name="business" size={14} color="#818CF8" />
            <Text style={styles.corporateBadgeText}>FOR ORGANIZATIONS</Text>
          </View>
          <Text style={styles.corporateTitle}>Empower Your Team with Custom Upskilling</Text>
          <Text style={styles.corporateSubtitle}>
            Tailored learning paths, skills gap analytics, and certified trainers for enterprise teams.
          </Text>

          <TouchableOpacity
            style={[styles.corporateBtn, { backgroundColor: colors.secondary }]}
            onPress={onOpenCorporateModal}
            activeOpacity={0.85}
          >
            <Text style={styles.corporateBtnText}>Request Corporate Proposal</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Live Upcoming Workshops */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Masterclasses</Text>
            <TouchableOpacity onPress={() => onNavigateTab('Workshops')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Schedule →</Text>
            </TouchableOpacity>
          </View>

          {WORKSHOPS.slice(0, 2).map((workshop) => (
            <LiveWorkshopCard
              key={workshop.id}
              workshop={workshop}
              onPress={() => onNavigateTab('Workshops')}
            />
          ))}
        </View>

        {/* Trusted Corporate Alumni Logos */}
        <View style={styles.trustSection}>
          <Text style={[styles.trustHeading, { color: colors.textMuted }]}>
            TRUSTED BY PROFESSIONALS FROM LEADING ENTERPRISES
          </Text>
          <View style={styles.clientLogosRow}>
            {CORPORATE_CLIENTS.map((client, index) => (
              <View
                key={index}
                style={[
                  styles.clientChip,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                ]}
              >
                <Ionicons name={client.logo as any} size={14} color={colors.primary} />
                <Text style={[styles.clientName, { color: colors.text }]}>{client.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroCard: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  resumeThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  resumeInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  resumeCourseTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  resumeInstructor: {
    fontSize: 12,
    marginBottom: 6,
  },
  resumeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumeTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  resumeFill: {
    height: '100%',
    borderRadius: 3,
  },
  resumePercentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  playBtnBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySection: {
    marginBottom: 8,
  },
  corporateBanner: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  corporateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  corporateBadgeText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  corporateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 8,
  },
  corporateSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 16,
  },
  corporateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  corporateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trustSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  trustHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  clientLogosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  clientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  clientName: {
    fontSize: 12,
    fontWeight: '600',
  },
});
