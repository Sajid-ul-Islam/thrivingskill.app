import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  Pressable,
  UIManager,
  Animated,
  Easing,
  LayoutAnimation,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
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
import { ModalProvider, useModal } from './src/context/ModalContext';
import { triggerHaptic } from './src/utils/haptics';
import { RootTab } from './src/types';
import {
  AppNavigator,
  navigateToTab,
  navigateToCourse,
  openYouTubeVideos,
  navigateByNotificationData,
} from './src/navigation/AppNavigator';
import { RootStackParamList } from './src/navigation/deepLinking';

import {
  YouTubeMiniPlayer,
  SlidingTabBarIndicator,
  CelebrationToast,
  ActionToast,
  ModernSnackbar,
  ModernBanner,
  ModernPopup,
  FloatingCrmWidget,
  AppErrorBoundary,
  IosActionNotificationPanel,
  BrandSplashScreen,
} from './src/components';
import { AppModalHost } from './src/components/common/AppModalHost';
import { AppUpdateService } from './src/services/appUpdateService';
import { TelemetryService } from './src/services/telemetry/telemetryService';
import { PushNotificationService } from './src/services/notifications/pushNotificationService';
import { HabitNotificationQueue } from './src/services/notifications/habitNotificationQueue';
import { StorageSanitizer } from './src/services/storage/storageSanitizer';
import { Env } from './src/config/env';

// Ensure browser omits external Referer on Web to prevent CDN hotlink blocks (Cloudflare 403)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  try {
    let meta = document.querySelector('meta[name="referrer"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'referrer');
      meta.setAttribute('content', 'no-referrer');
      document.head.appendChild(meta);
    } else {
      meta.setAttribute('content', 'no-referrer');
    }
  } catch {}
}

// Suppress React 19 web SVG warning for legacy transform-origin prop from react-native-svg web runtime
if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const origConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Invalid DOM property `transform-origin`')
    ) {
      return;
    }
    origConsoleError.apply(console, args);
  };
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const APP_PROVIDERS: React.ComponentType<{ children: React.ReactNode }>[] = [
  NetworkProvider,
  FeedbackProvider,
  AuthProvider,
  GamificationProvider,
  SaaSProvider,
  LearningProvider,
  YouTubeProvider,
  ModalProvider,
];

function composeProviders(
  providers: React.ComponentType<{ children: React.ReactNode }>[],
  children: React.ReactNode
): React.ReactElement {
  return providers.reduceRight<React.ReactElement>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    <>{children}</>
  );
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
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={name as any} size={size} color={color} />
    </Animated.View>
  );
};

const MainAppContent: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { userProgress, hasActiveLiveWorkshop, toggleBookmark } = useLearning();
  const { user, isAuthenticated } = useAuth();
  const { celebration, clearCelebration } = useGamification();
  const { activeVideo, playerMode } = useYouTube();
  const { openModal } = useModal();
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

  const [currentRouteName, setCurrentRouteName] = useState<keyof RootStackParamList>('MainTabs');
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCheckedUpdateRef = useRef<boolean>(false);

  // Telemetry & Push Notification Infrastructure Initialization (Env.init() already awaited in root App)
  useEffect(() => {
    TelemetryService.initialize();
    PushNotificationService.registerForPushNotifications();
    HabitNotificationQueue.resetStartupSession();
    PushNotificationService.scheduleDailyStreakNudge();
    StorageSanitizer.runStartupSanitization().catch(() => {});
  }, []);

  useEffect(() => {
    TelemetryService.setUser(
      user ? { id: String(user.id), username: user.username, role: user.roles?.[0] } : null
    );
    if (isAuthenticated && user?.id) {
      PushNotificationService.registerForPushNotifications().catch(() => {});
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (hasCheckedUpdateRef.current) return;
    hasCheckedUpdateRef.current = true;

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

  // Unified cold-start & warm-start deep-link routing when learner taps native push notification
  useEffect(() => {
    const unsub = PushNotificationService.addNativeNotificationResponseListener((data) => {
      navigateByNotificationData(data);
    });
    return unsub;
  }, []);

  const handleRouteChange = useCallback(
    ({ routeName }: { routeName: keyof RootStackParamList; activeTab: RootTab }) => {
      setCurrentRouteName(routeName);
      TelemetryService.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${routeName}`,
      });
      HabitNotificationQueue.recordUserActivity().catch(() => {});
    },
    []
  );

  const inProgressCount = Object.values(userProgress).filter((p) => !p.isCompleted).length;

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

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => {
      const currentTab = (props.state.routes[props.state.index]?.name as RootTab) || 'Home';
      return (
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
          <View
            style={styles.tabBarInner}
            onLayout={(e) => {
              const width = e.nativeEvent.layout.width;
              if (width > 0 && width !== tabBarWidth) {
                setTabBarWidth(width);
              }
            }}
          >
            <SlidingTabBarIndicator
              activeIndex={tabItems.findIndex((item) => item.id === currentTab)}
              tabCount={tabItems.length}
              containerWidth={tabBarWidth}
              isDark={isDark}
              accentColor={colors.accent}
            />
            {tabItems.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={styles.tabButton}
                  onPress={() => {
                    triggerHaptic('selection');
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    props.navigation.navigate(tab.id);
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
                        <Text style={[styles.tabBadgeText, { color: colors.onAccent }]}>
                          {tab.badgeCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.tabLabelContainer}>
                    <Text
                      style={[
                        styles.tabButtonLabel,
                        {
                          color: isActive ? colors.tabActive : colors.tabInactive,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    },
    [colors, insets.bottom, isDark, tabBarWidth, tabItems]
  );

  const isMainTabs = currentRouteName === 'MainTabs';
  const bottomToastOffset = isMainTabs
    ? 74 + Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8)
    : Math.max(insets.bottom, 16) + 12;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.screenContainer}>
        <AppNavigator renderTabBar={renderTabBar} onRouteChange={handleRouteChange} />
      </View>

      <YouTubeMiniPlayer
        bottomOffset={
          isMainTabs
            ? 64 + Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8)
            : Math.max(insets.bottom, 16)
        }
      />

      <AppModalHost
        onNavigateTab={navigateToTab}
        onNavigateToCourse={navigateToCourse}
        onOpenYouTube={openYouTubeVideos}
      />

      {(isMainTabs || currentRouteName === 'CourseDetail') && (
        <FloatingCrmWidget
          bottomOffset={
            currentRouteName === 'CourseDetail'
              ? 84 + Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8)
              : (playerMode === 'mini' && activeVideo !== null ? 134 : 68) +
                Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8)
          }
          inquiryType={currentRouteName === 'CourseDetail' ? 'course' : 'general'}
          onOpenFullModal={() => openModal('support')}
        />
      )}

      <CelebrationToast data={celebration} onDismiss={clearCelebration} />
      <ActionToast toast={currentToast} onDismiss={dismissToast} bottomOffset={bottomToastOffset} />
      <ModernSnackbar
        snackbar={currentSnackbar}
        onDismiss={dismissSnackbar}
        bottomOffset={bottomToastOffset}
      />
      <ModernBanner banner={currentBanner} onDismiss={dismissBanner} sticky />
      <ModernPopup popup={currentPopup} onDismiss={dismissPopup} />

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
        onOpenNotifications={() => openModal('notifications')}
      />
    </SafeAreaView>
  );
};

export default function App() {
  const [envReady, setEnvReady] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Env.init()
      .then(() => {
        if (mounted) setEnvReady(true);
      })
      .catch((err: any) => {
        if (mounted) {
          setEnvError(
            err?.message ||
              'Missing required environment variables. Please check EXPO_PUBLIC_* build configuration.'
          );
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            {envError ? (
              <SafeAreaView style={[styles.safeArea, styles.envErrorContainer]}>
                <Text style={styles.envErrorTitle}>Configuration Error</Text>
                <Text style={styles.envErrorMessage}>{envError}</Text>
              </SafeAreaView>
            ) : !envReady ? (
              <BrandSplashScreen isLoading={true} />
            ) : (
              composeProviders(APP_PROVIDERS, <MainAppContent />)
            )}
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
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderRadius: shape.full,
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
    letterSpacing: 0.4,
  },
  tabLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 2,
    marginTop: 2,
    minHeight: 16,
    overflow: 'visible',
  },
  tabButtonLabel: {
    fontSize: 10,
    lineHeight: Platform.OS === 'android' ? 15 : 13,
    letterSpacing: -0.1,
    textAlign: 'center',
    paddingBottom: 0,
    maxWidth: '100%',
    includeFontPadding: true,
  },
  envErrorContainer: {
    backgroundColor: '#0F192C',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  envErrorTitle: {
    color: '#FFB606',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  envErrorMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
