import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Pressable, BackHandler, UIManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shape } from './src/theme/shapes';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LearningProvider, useLearning } from './src/context/LearningContext';
import { SaaSProvider, useSaaS } from './src/context/SaaSContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { GamificationProvider, useGamification } from './src/context/GamificationContext';
import { YouTubeProvider, useYouTube } from './src/context/YouTubeContext';
import { RootTab, ActiveScreen } from './src/types';

import { HomeScreen } from './src/screens/HomeScreen';
import { CoursesScreen } from './src/screens/CoursesScreen';
import { MyLearningScreen } from './src/screens/MyLearningScreen';
import { WorkshopsScreen } from './src/screens/WorkshopsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CourseDetailScreen } from './src/screens/CourseDetailScreen';
import { LessonPlayerScreen } from './src/screens/LessonPlayerScreen';
import { YouTubeVideosScreen } from './src/screens/YouTubeVideosScreen';

import { SubscriptionModal } from './src/components/SubscriptionModal';
import { NotificationModal } from './src/components/NotificationModal';
import { SkillAssessmentModal } from './src/components/SkillAssessmentModal';
import { CorporateInquiryModal } from './src/components/CorporateInquiryModal';
import { AuthModal } from './src/components/AuthModal';
import { YouTubeMiniPlayer } from './src/components/YouTubeMiniPlayer';
import { YouTubePlayerModal } from './src/components/YouTubePlayerModal';
import { UniversalSearchModal } from './src/components/UniversalSearchModal';
import { BrandDrawer } from './src/components/BrandDrawer';
import { AppUpdateModal } from './src/components/AppUpdateModal';
import { ScreenTransition, CelebrationToast } from './src/components/common';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MainAppContent: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { userProgress } = useLearning();
  const { activeWorkspace, unreadNotificationsCount } = useSaaS();
  const { isAuthModalVisible, setAuthModalVisible } = useAuth();
  const { celebration, clearCelebration } = useGamification();
  const { activeVideo, playerMode, closePlayer, minimizePlayer, playVideo } = useYouTube();

  const [activeTab, setActiveTab] = useState<RootTab>('Home');
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>({
    name: 'MainTabs',
    tab: 'Home',
  });

  // Global Modals State
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [corporateModalVisible, setCorporateModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [brandDrawerVisible, setBrandDrawerVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  const inProgressCount = Object.values(userProgress).filter((p) => !p.isCompleted).length;

  const navigateToTab = (tab: RootTab) => {
    setActiveTab(tab);
    setActiveScreen({ name: 'MainTabs', tab });
  };

  const navigateToCourse = (courseId: string) => {
    setActiveScreen({ name: 'CourseDetail', courseId });
  };

  const navigateToLesson = (courseId: string, lessonId: string) => {
    setActiveScreen({ name: 'LessonPlayer', courseId, lessonId });
  };

  const navigateBackToTabs = () => {
    setActiveScreen({ name: 'MainTabs', tab: activeTab });
  };

  // Android Hardware Back Button Hook (prevents accidental app exit)
  useEffect(() => {
    const onHardwareBack = () => {
      if (brandDrawerVisible) {
        setBrandDrawerVisible(false);
        return true;
      }
      if (searchModalVisible) {
        setSearchModalVisible(false);
        return true;
      }
      if (updateModalVisible) {
        setUpdateModalVisible(false);
        return true;
      }
      if (subscriptionModalVisible) {
        setSubscriptionModalVisible(false);
        return true;
      }
      if (notificationModalVisible) {
        setNotificationModalVisible(false);
        return true;
      }
      if (assessmentModalVisible) {
        setAssessmentModalVisible(false);
        return true;
      }
      if (corporateModalVisible) {
        setCorporateModalVisible(false);
        return true;
      }
      if (playerMode === 'modal') {
        minimizePlayer();
        return true;
      }
      if (activeScreen.name !== 'MainTabs') {
        navigateBackToTabs();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [
    brandDrawerVisible,
    searchModalVisible,
    updateModalVisible,
    subscriptionModalVisible,
    notificationModalVisible,
    assessmentModalVisible,
    corporateModalVisible,
    playerMode,
    activeScreen.name,
  ]);

  const tabItems: {
    id: RootTab;
    label: string;
    icon: string;
    iconOutline: string;
    badgeCount?: number;
  }[] = [
    { id: 'Home', label: t('tabHome'), icon: 'home', iconOutline: 'home-outline' },
    { id: 'Courses', label: t('tabExplore'), icon: 'compass', iconOutline: 'compass-outline' },
    {
      id: 'MyLearning',
      label: t('tabMyHub'),
      icon: 'book',
      iconOutline: 'book-outline',
      badgeCount: inProgressCount,
    },
    { id: 'Workshops', label: t('tabLive'), icon: 'videocam', iconOutline: 'videocam-outline' },
    { id: 'Profile', label: t('tabProfile'), icon: 'person', iconOutline: 'person-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.screenContainer}>
        {activeScreen.name === 'CourseDetail' ? (
          <ScreenTransition key={`detail-${activeScreen.courseId}`} direction="horizontal">
            <CourseDetailScreen
              courseId={activeScreen.courseId}
              onBack={navigateBackToTabs}
              onNavigateToLesson={navigateToLesson}
            />
          </ScreenTransition>
        ) : activeScreen.name === 'LessonPlayer' ? (
          <ScreenTransition key={`player-${activeScreen.lessonId}`} direction="horizontal">
            <LessonPlayerScreen
              courseId={activeScreen.courseId}
              lessonId={activeScreen.lessonId}
              onBack={navigateBackToTabs}
              onSelectLesson={navigateToLesson}
            />
          </ScreenTransition>
        ) : activeScreen.name === 'YouTubeVideos' ? (
          <ScreenTransition key="yt-videos" direction="horizontal">
            <YouTubeVideosScreen
              onBack={navigateBackToTabs}
              onNavigateToCourse={navigateToCourse}
            />
          </ScreenTransition>
        ) : (
          <>
            {activeTab === 'Home' && (
              <ScreenTransition key="tab-Home" direction="vertical" duration={180}>
                <HomeScreen
                  onNavigateToCourse={navigateToCourse}
                  onNavigateToLesson={navigateToLesson}
                  onNavigateTab={navigateToTab}
                  onOpenCorporateModal={() => setCorporateModalVisible(true)}
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onOpenAssessment={() => setAssessmentModalVisible(true)}
                  onOpenYouTube={() => setActiveScreen({ name: 'YouTubeVideos' })}
                  onOpenSearch={() => setSearchModalVisible(true)}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                />
              </ScreenTransition>
            )}
            {activeTab === 'Courses' && (
              <ScreenTransition key="tab-Courses" direction="vertical" duration={180}>
                <CoursesScreen
                  onNavigateToCourse={navigateToCourse}
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                />
              </ScreenTransition>
            )}
            {activeTab === 'MyLearning' && (
              <ScreenTransition key="tab-MyLearning" direction="vertical" duration={180}>
                <MyLearningScreen
                  onNavigateToCourse={navigateToCourse}
                  onNavigateToLesson={navigateToLesson}
                  onBrowseCourses={() => navigateToTab('Courses')}
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onOpenYouTube={() => setActiveScreen({ name: 'YouTubeVideos' })}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                />
              </ScreenTransition>
            )}
            {activeTab === 'Workshops' && (
              <ScreenTransition key="tab-Workshops" direction="vertical" duration={180}>
                <WorkshopsScreen
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                />
              </ScreenTransition>
            )}
            {activeTab === 'Profile' && (
              <ScreenTransition key="tab-Profile" direction="vertical" duration={180}>
                <ProfileScreen
                  onOpenCorporateModal={() => setCorporateModalVisible(true)}
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onNavigateTab={navigateToTab}
                  onNavigateToCourse={navigateToCourse}
                  onNavigateToLesson={navigateToLesson}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                />
              </ScreenTransition>
            )}
          </>
        )}
      </View>

      {/* Floating Mini Player (visible when player is minimized) */}
      <YouTubeMiniPlayer
        bottomOffset={
          activeScreen.name === 'MainTabs'
            ? 64 + Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8)
            : Math.max(insets.bottom, 16)
        }
      />

      {/* Bottom Tab Bar (shown only when on MainTabs) */}
      {activeScreen.name === 'MainTabs' && (
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: colors.tabBarBg,
              borderTopColor: colors.tabBarBorder,
              shadowColor: colors.cardShadow,
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8),
            },
          ]}
        >
          {tabItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={styles.tabButton}
                onPress={() => navigateToTab(tab.id)}
                android_ripple={{
                  color: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 47, 83, 0.08)',
                  borderless: true,
                  radius: 32,
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
              >
                <View
                  style={[
                    styles.tabPillIndicator,
                    isActive && {
                      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : colors.primaryLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={(isActive ? tab.icon : tab.iconOutline) as any}
                    size={21}
                    color={isActive ? colors.primary : colors.tabInactive}
                  />
                  {tab.badgeCount && tab.badgeCount > 0 ? (
                    <View style={[styles.tabBadge, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.tabBadgeText, { color: colors.onAccent }]}>{tab.badgeCount}</Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.tabButtonLabel,
                    {
                      color: isActive ? colors.primary : colors.tabInactive,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Brand Drawer */}
      <BrandDrawer
        visible={brandDrawerVisible}
        onClose={() => setBrandDrawerVisible(false)}
        onNavigateTab={navigateToTab}
        onOpenYouTube={() => setActiveScreen({ name: 'YouTubeVideos' })}
        onOpenAssessment={() => setAssessmentModalVisible(true)}
        onOpenSubscription={() => setSubscriptionModalVisible(true)}
        onOpenUpdate={() => setUpdateModalVisible(true)}
      />

      {/* Global In-App Update Modal */}
      <AppUpdateModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
      />

      {/* Global SaaS Modals */}
      <SubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
      />

      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        onNavigateToTab={(tab, courseId) => {
          if (tab) navigateToTab(tab);
          if (courseId) navigateToCourse(courseId);
        }}
      />

      <SkillAssessmentModal
        visible={assessmentModalVisible}
        onClose={() => setAssessmentModalVisible(false)}
        onNavigateToCourse={navigateToCourse}
      />

      <CorporateInquiryModal
        visible={corporateModalVisible}
        onClose={() => setCorporateModalVisible(false)}
      />

      {/* WordPress LearnPress Auth Modal */}
      <AuthModal
        visible={isAuthModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      {/* Global In-App YouTube Player Modal */}
      <YouTubePlayerModal
        visible={playerMode === 'modal' && activeVideo !== null}
        video={activeVideo}
        onClose={closePlayer}
        onMinimize={minimizePlayer}
        onNavigateToCourse={navigateToCourse}
        onSelectVideo={(v) => playVideo(v, 'modal')}
      />

      {/* Universal Search & Spotlight Modal */}
      <UniversalSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelectCourse={(courseId) => {
          setSearchModalVisible(false);
          navigateToCourse(courseId);
        }}
        onSelectYouTubeVideo={(video) => {
          setSearchModalVisible(false);
          playVideo(video, 'modal');
        }}
        onSelectWorkshop={() => {
          setSearchModalVisible(false);
          navigateToTab('Workshops');
        }}
      />

      {/* Global Milestone & Lesson Completion Celebration HUD */}
      <CelebrationToast data={celebration} onDismiss={clearCelebration} />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <GamificationProvider>
            <AuthProvider>
              <SaaSProvider>
                <LearningProvider>
                  <YouTubeProvider>
                    <MainAppContent />
                  </YouTubeProvider>
                </LearningProvider>
              </SaaSProvider>
            </AuthProvider>
          </GamificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
    paddingVertical: 4,
  },
  tabPillIndicator: {
    width: 60,
    height: 32,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  tabBadge: {
    position: 'absolute',
    top: 1,
    right: 12,
    zIndex: 10,
    elevation: 3,
    minWidth: 16,
    height: 16,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    lineHeight: 10,
    includeFontPadding: false,
    fontWeight: '800',
  },
  tabButtonLabel: {
    fontSize: 10.5,
    marginTop: 3,
  },
});
