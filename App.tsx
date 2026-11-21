import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  Pressable,
  BackHandler,
  UIManager,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  LayoutAnimation,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { shape } from './src/theme/shapes';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LearningProvider, useLearning } from './src/context/LearningContext';
import { SaaSProvider } from './src/context/SaaSContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { GamificationProvider, useGamification } from './src/context/GamificationContext';
import { YouTubeProvider, useYouTube } from './src/context/YouTubeContext';
import { FeedbackProvider, useFeedback } from './src/context/FeedbackContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { triggerHaptic } from './src/utils/haptics';
import { RootTab } from './src/types';
import { useNavigationStack } from './src/hooks';

import { HomeScreen } from './src/screens/HomeScreen';
import { CoursesScreen } from './src/screens/CoursesScreen';
import { MyLearningScreen } from './src/screens/MyLearningScreen';
import { WorkshopsScreen } from './src/screens/WorkshopsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CourseDetailScreen } from './src/screens/CourseDetailScreen';
import { LessonPlayerScreen } from './src/screens/LessonPlayerScreen';
import { YouTubeVideosScreen } from './src/screens/YouTubeVideosScreen';

import {
  SubscriptionModal,
  NotificationModal,
  SkillAssessmentModal,
  CorporateInquiryModal,
  AuthModal,
  YouTubeMiniPlayer,
  YouTubePlayerModal,
  UniversalSearchModal,
  BrandDrawer,
  AppUpdateModal,
  SupportContactModal,
  ScreenTransition,
  CelebrationToast,
  ActionToast,
  ModernSnackbar,
  ModernBanner,
  ModernPopup,
  FloatingCrmWidget,
  AppErrorBoundary,
  IosActionNotificationPanel,
} from './src/components';
import { AppUpdateService } from './src/services/appUpdateService';
import { TelemetryService } from './src/services/telemetry/telemetryService';
import { PushNotificationService } from './src/services/notifications/pushNotificationService';
import { HabitNotificationQueue } from './src/services/notifications/habitNotificationQueue';
import { StorageSanitizer } from './src/services/storage/storageSanitizer';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedTabIcon: React.FC<{
  isActive: boolean;
  name: string;
  size: number;
  color: string;
}> = ({ isActive, name, size, color }) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.92)).current;

  useEffect(() => {
    if (isActive) {
      scaleAnim.setValue(0.82);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name as any} size={size} color={color} />
    </Animated.View>
  );
};

const MainAppContent: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { userProgress, hasActiveLiveWorkshop, toggleBookmark } = useLearning();
  const { user, isAuthenticated, isLoading: isAuthLoading, isAuthModalVisible, setAuthModalVisible } = useAuth();
  const { celebration, clearCelebration } = useGamification();
  const { activeVideo, playerMode, closePlayer, minimizePlayer, playVideo } = useYouTube();
  const {
    currentToast,
    dismissToast,
    showToast,
    currentSnackbar,
    dismissSnackbar,
    showSnackbar,
    currentBanner,
    dismissBanner,
    currentPopup,
    dismissPopup,
  } = useFeedback();

  // Option D: Telemetry & Push Notification Infrastructure Initialization
  useEffect(() => {
    TelemetryService.initialize();
    PushNotificationService.registerForPushNotifications();
    HabitNotificationQueue.resetStartupSession();
    // Schedule daily streak reminder (guarded by once-per-calendar-day throttle)
    PushNotificationService.scheduleDailyStreakNudge();
  }, []);

  useEffect(() => {
    TelemetryService.setUser(
      user ? { id: String(user.id), username: user.username, role: user.roles?.[0] } : null
    );
  }, [user]);

  // CR-1: Splash screen timer (2 seconds) with logo, wordmark, tagline
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Sanitize local storage of any legacy mock avatars or comments
    StorageSanitizer.runStartupSanitization().catch(() => {});

    splashTimerRef.current = setTimeout(() => {
      setIsSplashVisible(false);
    }, 2000);

    return () => {
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
        splashTimerRef.current = null;
      }
    };
  }, []);

  // Cross-platform timer for proactive background OTA check
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCheckedUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasCheckedUpdateRef.current) return;
    hasCheckedUpdateRef.current = true;

    // Proactive background OTA check in standalone builds (silently bypassed in Expo Go)
    updateTimerRef.current = setTimeout(async () => {
      try {
        const update = await AppUpdateService.checkForUpdate();
        if (update.isDownloaded) {
          showToast({
            message: 'A new update was downloaded! Restart now to apply latest features.',
            type: 'success',
            actionLabel: 'Restart',
            onAction: () => AppUpdateService.reloadApp(),
            durationMs: 9000,
          });
        }
      } catch {
        // Silent catch for offline or dev mode
      }
    }, 6000);

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, [showToast]);

  // Type-Safe Navigation Stack Architecture
  const {
    currentScreen: activeScreen,
    activeTab,
    direction: navDirection,
    canGoBack,
    push,
    pop: navigateBack,
    navigateToTab,
    navigateToCourse,
    navigateToLesson,
  } = useNavigationStack({ initialTab: 'Home' });

  useEffect(() => {
    TelemetryService.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${activeScreen.name}`,
    });
    HabitNotificationQueue.recordUserActivity().catch(() => {});
  }, [activeScreen.name]);

  // Deep-link routing when learner taps native Android status bar drop-down notification
  useEffect(() => {
    const unsub = PushNotificationService.addNativeNotificationResponseListener((data) => {
      if (data?.courseId) {
        navigateToCourse(String(data.courseId));
      } else if (data?.postUrl) {
        Linking.openURL(String(data.postUrl)).catch(() => {});
      }
    });
    return unsub;
  }, [navigateToCourse]);

  // Global Modals State
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [corporateModalVisible, setCorporateModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [brandDrawerVisible, setBrandDrawerVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  const inProgressCount = Object.values(userProgress).filter((p) => !p.isCompleted).length;

  // Android Hardware Back Button Hook (prevents accidental app exit)
  useEffect(() => {
    const onHardwareBack = () => {
      if (brandDrawerVisible) {
        setBrandDrawerVisible(false);
        return true;
      }
      if (isAuthModalVisible) {
        setAuthModalVisible(false);
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
      if (supportModalVisible) {
        setSupportModalVisible(false);
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
      if (canGoBack) {
        navigateBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [
    brandDrawerVisible,
    isAuthModalVisible,
    searchModalVisible,
    updateModalVisible,
    subscriptionModalVisible,
    notificationModalVisible,
    assessmentModalVisible,
    corporateModalVisible,
    playerMode,
    canGoBack,
    navigateBack,
  ]);

  const tabItems: {
    id: RootTab;
    label: string;
    icon: string;
    iconOutline: string;
    badgeCount?: number;
    isLiveBadge?: boolean;
  }[] = [
    { id: 'Home', label: t('tabHome'), icon: 'home', iconOutline: 'home-outline' },
    { id: 'Courses', label: t('tabCourses'), icon: 'compass', iconOutline: 'compass-outline' },
    {
      id: 'MyLearning',
      label: t('tabMyCourses'),
      icon: 'book',
      iconOutline: 'book-outline',
      badgeCount: inProgressCount,
    },
    {
      id: 'Workshops',
      label: t('tabLiveClass'),
      icon: 'videocam',
      iconOutline: 'videocam-outline',
      isLiveBadge: hasActiveLiveWorkshop,
    },
    { id: 'Profile', label: t('tabProfile'), icon: 'person', iconOutline: 'person-outline' },
  ];

  // CR-1: Brand splash screen on startup (holds until both 2s splash timer and auth session restore complete)
  if (isSplashVisible || isAuthLoading) {
    return (
      <View style={splashStyles.container}>
        <StatusBar style="light" />
        <View style={splashStyles.content}>
          <View style={splashStyles.logoWrap}>
            <Image
              source={require('./assets/icon.png')}
              style={splashStyles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={splashStyles.wordmark}>
            Thriving <Text style={{ color: '#FFB606' }}>Skills</Text>
          </Text>
          <Text style={splashStyles.tagline}>
            জাতির দক্ষতা বিনির্মাণে • Building a Skilled Nation
          </Text>
        </View>
        <View style={splashStyles.footer}>
          <ActivityIndicator size="small" color="#FFB606" />
          <Text style={splashStyles.footerText}>Loading LMS Workspace...</Text>
        </View>
      </View>
    );
  }

  // CR-1: Mandatory login access control - without logging in, no content is accessible
  if (!isAuthenticated && !isAuthLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <AuthModal
          visible={true}
          dismissible={false}
          onClose={() => {}}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.screenContainer}>
        {activeScreen.name === 'CourseDetail' ? (
          <ScreenTransition
            key={`detail-${activeScreen.courseId}`}
            direction={navDirection === 'backward' ? 'backward' : 'forward'}
          >
            <CourseDetailScreen
              courseId={activeScreen.courseId}
              onBack={navigateBack}
              onNavigateToLesson={navigateToLesson}
            />
          </ScreenTransition>
        ) : activeScreen.name === 'LessonPlayer' ? (
          <ScreenTransition
            key={`player-${activeScreen.lessonId}`}
            direction={navDirection === 'backward' ? 'backward' : 'forward'}
          >
            <LessonPlayerScreen
              courseId={activeScreen.courseId}
              lessonId={activeScreen.lessonId}
              onBack={navigateBack}
              onSelectLesson={navigateToLesson}
            />
          </ScreenTransition>
        ) : activeScreen.name === 'YouTubeVideos' ? (
          <ScreenTransition
            key="yt-videos"
            direction={navDirection === 'backward' ? 'backward' : 'forward'}
          >
            <YouTubeVideosScreen
              onBack={navigateBack}
              onNavigateToCourse={navigateToCourse}
            />
          </ScreenTransition>
        ) : (
          <>
            {activeTab === 'Home' && (
              <ScreenTransition key="tab-Home" direction="fade" duration={160}>
                <HomeScreen
                  onNavigateToCourse={navigateToCourse}
                  onNavigateToLesson={navigateToLesson}
                  onNavigateTab={navigateToTab}
                  onOpenCorporateModal={() => setCorporateModalVisible(true)}
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onOpenAssessment={() => setAssessmentModalVisible(true)}
                  onOpenYouTube={() => push({ name: 'YouTubeVideos' })}
                  onOpenSearch={() => setSearchModalVisible(true)}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                  onOpenSupport={() => setSupportModalVisible(true)}
                />
              </ScreenTransition>
            )}
            {activeTab === 'Courses' && (
              <ScreenTransition key="tab-Courses" direction="fade" duration={160}>
                <CoursesScreen
                  onNavigateToCourse={navigateToCourse}
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                  onOpenSupport={() => setSupportModalVisible(true)}
                  onOpenSearch={() => setSearchModalVisible(true)}
                />
              </ScreenTransition>
            )}
            {activeTab === 'MyLearning' && (
              <ScreenTransition key="tab-MyLearning" direction="fade" duration={160}>
                <MyLearningScreen
                  onNavigateToCourse={navigateToCourse}
                  onNavigateToLesson={navigateToLesson}
                  onBrowseCourses={() => navigateToTab('Courses')}
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onOpenYouTube={() => push({ name: 'YouTubeVideos' })}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                  onOpenSupport={() => setSupportModalVisible(true)}
                />
              </ScreenTransition>
            )}
            {activeTab === 'Workshops' && (
              <ScreenTransition key="tab-Workshops" direction="fade" duration={160}>
                <WorkshopsScreen
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                  onOpenSupport={() => setSupportModalVisible(true)}
                />
              </ScreenTransition>
            )}
            {activeTab === 'Profile' && (
              <ScreenTransition key="tab-Profile" direction="fade" duration={160}>
                <ProfileScreen
                  onOpenCorporateModal={() => setCorporateModalVisible(true)}
                  onOpenSubscription={() => setSubscriptionModalVisible(true)}
                  onOpenNotifications={() => setNotificationModalVisible(true)}
                  onNavigateTab={navigateToTab}
                  onNavigateToCourse={navigateToCourse}
                  onNavigateToLesson={navigateToLesson}
                  onOpenDrawer={() => setBrandDrawerVisible(true)}
                  onOpenSupport={() => setSupportModalVisible(true)}
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
          <View style={styles.tabBarInner}>
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={styles.tabButton}
                  onPress={() => {
                    triggerHaptic('selection');
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    navigateToTab(tab.id);
                  }}
                  android_ripple={{
                    color: isDark ? 'rgba(255, 182, 6, 0.12)' : 'rgba(16, 47, 83, 0.08)',
                    borderless: true,
                    radius: 32,
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={tab.label}
                >
                  <View style={styles.tabPillIndicator}>
                    <AnimatedTabIcon
                      isActive={isActive}
                      name={isActive ? tab.icon : tab.iconOutline}
                      size={21}
                      color={isActive ? colors.tabActive : colors.tabInactive}
                    />
                    {tab.isLiveBadge ? (
                      <View style={styles.tabLivePill}>
                        <View style={styles.tabLiveDot} />
                        <Text style={styles.tabLiveText}>LIVE</Text>
                      </View>
                    ) : tab.badgeCount && tab.badgeCount > 0 ? (
                      <View style={[styles.tabBadge, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.tabBadgeText, { color: colors.onAccent }]}>{tab.badgeCount}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.tabButtonLabel,
                      {
                        color: isActive ? colors.tabActive : colors.tabInactive,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Brand Drawer */}
      <BrandDrawer
        visible={brandDrawerVisible}
        onClose={() => setBrandDrawerVisible(false)}
        onNavigateTab={navigateToTab}
        onOpenYouTube={() => push({ name: 'YouTubeVideos' })}
        onOpenAssessment={() => setAssessmentModalVisible(true)}
        onOpenSubscription={() => setSubscriptionModalVisible(true)}
        onOpenUpdate={() => setUpdateModalVisible(true)}
        onOpenSupport={() => setSupportModalVisible(true)}
      />

      {/* Official CRM & Helpdesk Support Modal */}
      <SupportContactModal
        visible={supportModalVisible}
        onClose={() => setSupportModalVisible(false)}
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

      {/* Omnipresent Floating Draggable WhatsApp & Messenger CRM Widget */}
      {(activeScreen.name === 'MainTabs' || activeScreen.name === 'CourseDetail') && (
        <FloatingCrmWidget
          bottomOffset={
            activeScreen.name === 'CourseDetail'
              ? 84 + Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8)
              : (playerMode === 'mini' && activeVideo !== null ? 134 : 68) +
                Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8)
          }
          inquiryType={activeScreen.name === 'CourseDetail' ? 'course' : 'general'}
          onOpenFullModal={() => setSupportModalVisible(true)}
        />
      )}

      {/* Global Milestone & Lesson Completion Celebration HUD */}
      <CelebrationToast data={celebration} onDismiss={clearCelebration} />

      {/* Global Immediate Action Feedback & Undo Toast */}
      <ActionToast
        toast={currentToast}
        onDismiss={dismissToast}
        bottomOffset={
          activeScreen.name === 'MainTabs'
            ? 74 + Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8)
            : Math.max(insets.bottom, 16) + 12
        }
      />

      {/* Global Interactive Bottom Snackbar with Undo & Duration Progress */}
      <ModernSnackbar
        snackbar={currentSnackbar}
        onDismiss={dismissSnackbar}
        bottomOffset={
          activeScreen.name === 'MainTabs'
            ? 74 + Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8)
            : Math.max(insets.bottom, 16) + 12
        }
      />

      {/* Global In-App Sticky Announcement & System Banner */}
      <ModernBanner
        banner={currentBanner}
        onDismiss={dismissBanner}
        sticky
      />

      {/* Global Modern Confirmation & Alert Popup Dialog */}
      <ModernPopup
        popup={currentPopup}
        onDismiss={dismissPopup}
      />

      {/* Interactive iOS & Android Action Notification Panel */}
      <IosActionNotificationPanel
        onNavigateToCourse={navigateToCourse}
        onBookmarkCourse={(courseId) => {
          toggleBookmark(courseId);
          showSnackbar({
            message: 'Course saved to Bookmarks',
            actionLabel: 'Undo',
            onAction: () => toggleBookmark(courseId),
            type: 'success',
          });
        }}
        onOpenNotifications={() => setNotificationModalVisible(true)}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <NetworkProvider>
              <FeedbackProvider>
                <AuthProvider>
                  <GamificationProvider>
                    <SaaSProvider>
                      <LearningProvider>
                        <YouTubeProvider>
                          <MainAppContent />
                        </YouTubeProvider>
                      </LearningProvider>
                    </SaaSProvider>
                  </GamificationProvider>
                </AuthProvider>
              </FeedbackProvider>
            </NetworkProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
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
    paddingVertical: 8,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
    paddingVertical: 4,
    borderRadius: shape.full,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
        outlineWidth: 0 as any,
        boxShadow: 'none' as any,
        userSelect: 'none' as any,
        WebkitTapHighlightColor: 'transparent' as any,
      },
    }),
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
    fontVariant: ['tabular-nums'],
  },
  tabLivePill: {
    position: 'absolute',
    top: -2,
    right: 4,
    zIndex: 10,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E34234',
    borderRadius: shape.full,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    gap: 3,
  },
  tabLiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  tabLiveText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
    lineHeight: 9,
    includeFontPadding: false,
    letterSpacing: 0.4,
  },
  tabButtonLabel: {
    fontSize: 10.5,
    marginTop: 3,
  },
});

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102F53',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB606',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
});
