import React, { useCallback, useMemo, useRef } from 'react';
import { Linking } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  createNavigationContainerRef,
  NavigationState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { RootTab } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';
import { HomeScreen } from '../screens/HomeScreen';
import { CoursesScreen } from '../screens/CoursesScreen';
import { MyLearningScreen } from '../screens/MyLearningScreen';
import { WorkshopsScreen } from '../screens/WorkshopsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CourseDetailScreen } from '../screens/CourseDetailScreen';
import { LessonPlayerScreen } from '../screens/LessonPlayerScreen';
import { YouTubeVideosScreen } from '../screens/YouTubeVideosScreen';
import {
  APP_LINKING_CONFIG,
  MainTabParamList,
  RootStackParamList,
  parseAppDeepLink,
} from './deepLinking';
import { normalizeNotificationPayload } from '../services/notifications/pushNotificationService';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type PendingNavAction =
  | { type: 'tab'; tab: RootTab; courseId?: string }
  | { type: 'course'; courseId: string }
  | { type: 'lesson'; courseId: string; lessonId: string }
  | { type: 'youtube' };

let pendingNavigationQueue: PendingNavAction[] = [];

function executeNavAction(action: PendingNavAction): void {
  if (!navigationRef.isReady()) {
    pendingNavigationQueue.push(action);
    return;
  }

  switch (action.type) {
    case 'tab':
      navigationRef.navigate('MainTabs', { screen: action.tab });
      if (action.courseId) {
        navigationRef.navigate('CourseDetail', { courseId: action.courseId });
      }
      break;
    case 'course':
      navigationRef.navigate('CourseDetail', { courseId: action.courseId });
      break;
    case 'lesson':
      navigationRef.navigate('LessonPlayer', {
        courseId: action.courseId,
        lessonId: action.lessonId,
      });
      break;
    case 'youtube':
      navigationRef.navigate('YouTubeVideos');
      break;
  }
}

export function flushPendingNavigation(): void {
  if (!navigationRef.isReady() || pendingNavigationQueue.length === 0) return;
  const queued = [...pendingNavigationQueue];
  pendingNavigationQueue = [];
  queued.forEach(executeNavAction);
}

export function clearPendingNavigationForTest(): void {
  pendingNavigationQueue = [];
}

export function navigateToTab(tab: RootTab, courseId?: string): void {
  executeNavAction({ type: 'tab', tab, courseId });
}

export function navigateToCourse(courseId: string): void {
  if (!courseId) return;
  executeNavAction({ type: 'course', courseId });
}

export function navigateToLesson(courseId: string, lessonId: string): void {
  if (!courseId || !lessonId) return;
  executeNavAction({ type: 'lesson', courseId, lessonId });
}

export function openYouTubeVideos(): void {
  executeNavAction({ type: 'youtube' });
}

export function goBackNavigation(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * Resolves any notification tap payload (`course_id`, `courseId`, `lesson_id`, `screen`, `postUrl`)
 * on either cold start or warm start and navigates to the destination screen.
 */
export function navigateByNotificationData(
  rawData: Record<string, any> | null | undefined
): boolean {
  const target = normalizeNotificationPayload(rawData);
  if (!target) return false;

  if (target.screen === 'LessonPlayer' && target.courseId && target.lessonId) {
    navigateToLesson(target.courseId, target.lessonId);
    return true;
  }
  if (target.screen === 'CourseDetail' && target.courseId) {
    navigateToCourse(target.courseId);
    return true;
  }
  if (target.screen === 'YouTubeVideos') {
    openYouTubeVideos();
    return true;
  }
  if (target.externalUrl) {
    const parsed = parseAppDeepLink(target.externalUrl);
    if (parsed?.type === 'course') {
      navigateToCourse(parsed.courseId);
      return true;
    }
    if (parsed?.type === 'lesson') {
      navigateToLesson(parsed.courseId, parsed.lessonId);
      return true;
    }
    if (parsed?.type === 'tab') {
      navigateToTab(parsed.tab);
      return true;
    }
    if (parsed?.type === 'youtube') {
      openYouTubeVideos();
      return true;
    }
    Linking.openURL(target.externalUrl).catch(() => {});
    return true;
  }
  if (target.tab) {
    navigateToTab(target.tab, target.courseId);
    return true;
  }
  return false;
}

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const HomeTabRoute: React.FC = () => {
  const { openModal } = useModal();
  return (
    <HomeScreen
      onNavigateToCourse={navigateToCourse}
      onNavigateToLesson={navigateToLesson}
      onNavigateTab={(tab) => navigateToTab(tab)}
      onOpenCorporateModal={() => openModal('corporate')}
      onOpenSubscription={() => openModal('subscription')}
      onOpenNotifications={() => openModal('notifications')}
      onOpenAssessment={() => openModal('assessment')}
      onOpenYouTube={openYouTubeVideos}
      onOpenSearch={() => openModal('search')}
      onOpenDrawer={() => openModal('drawer')}
      onOpenSupport={() => openModal('support')}
    />
  );
};

const CoursesTabRoute: React.FC = () => {
  const { openModal } = useModal();
  return (
    <CoursesScreen
      onNavigateToCourse={navigateToCourse}
      onOpenSubscription={() => openModal('subscription')}
      onOpenNotifications={() => openModal('notifications')}
      onOpenDrawer={() => openModal('drawer')}
      onOpenSupport={() => openModal('support')}
      onOpenSearch={() => openModal('search')}
    />
  );
};

const MyLearningTabRoute: React.FC = () => {
  const { openModal } = useModal();
  return (
    <MyLearningScreen
      onNavigateToCourse={navigateToCourse}
      onNavigateToLesson={navigateToLesson}
      onBrowseCourses={() => navigateToTab('Courses')}
      onOpenSubscription={() => openModal('subscription')}
      onOpenNotifications={() => openModal('notifications')}
      onOpenYouTube={openYouTubeVideos}
      onOpenDrawer={() => openModal('drawer')}
      onOpenSupport={() => openModal('support')}
    />
  );
};

const WorkshopsTabRoute: React.FC = () => {
  const { openModal } = useModal();
  return (
    <WorkshopsScreen
      onOpenSubscription={() => openModal('subscription')}
      onOpenNotifications={() => openModal('notifications')}
      onOpenDrawer={() => openModal('drawer')}
      onOpenSupport={() => openModal('support')}
    />
  );
};

const ProfileTabRoute: React.FC = () => {
  const { openModal } = useModal();
  return (
    <ProfileScreen
      onOpenCorporateModal={() => openModal('corporate')}
      onOpenSubscription={() => openModal('subscription')}
      onOpenNotifications={() => openModal('notifications')}
      onNavigateTab={(tab: RootTab) => navigateToTab(tab)}
      onNavigateToCourse={navigateToCourse}
      onNavigateToLesson={navigateToLesson}
      onOpenDrawer={() => openModal('drawer')}
      onOpenSupport={() => openModal('support')}
    />
  );
};

const CourseDetailRoute: React.FC<{ route: { params: { courseId: string } } }> = ({ route }) => (
  <CourseDetailScreen
    courseId={route.params.courseId}
    onBack={goBackNavigation}
    onNavigateToLesson={navigateToLesson}
  />
);

const LessonPlayerRoute: React.FC<{
  route: { params: { courseId: string; lessonId: string } };
}> = ({ route }) => (
  <LessonPlayerScreen
    courseId={route.params.courseId}
    lessonId={route.params.lessonId}
    onBack={goBackNavigation}
    onSelectLesson={navigateToLesson}
  />
);

const YouTubeVideosRoute: React.FC = () => (
  <YouTubeVideosScreen onBack={goBackNavigation} onNavigateToCourse={navigateToCourse} />
);

function extractActiveRouteInfo(state: NavigationState | undefined): {
  routeName: keyof RootStackParamList;
  activeTab: RootTab;
} {
  if (!state || !state.routes || state.routes.length === 0) {
    return { routeName: 'MainTabs', activeTab: 'Home' };
  }
  const current = state.routes[state.index ?? 0];
  if (current.name === 'MainTabs' && current.state && 'routes' in current.state) {
    const tabState = current.state as { routes: { name: string }[]; index?: number };
    const tabRoute = tabState.routes[tabState.index ?? 0];
    return {
      routeName: 'MainTabs',
      activeTab: (tabRoute?.name as RootTab) || 'Home',
    };
  }
  return {
    routeName: (current.name as keyof RootStackParamList) || 'MainTabs',
    activeTab: 'Home',
  };
}

interface AppNavigatorProps {
  renderTabBar: (props: BottomTabBarProps) => React.ReactNode;
  onRouteChange?: (info: { routeName: keyof RootStackParamList; activeTab: RootTab }) => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ renderTabBar, onRouteChange }) => {
  const { colors, isDark } = useTheme();
  const { setAuthInitialMode } = useModal();
  const { isAuthenticated, setAuthModalVisible } = useAuth();
  const lastRouteRef = useRef<string>('MainTabs');

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    };
  }, [colors, isDark]);

  const handleStateChange = useCallback(
    (state: NavigationState | undefined) => {
      const info = extractActiveRouteInfo(state);
      lastRouteRef.current = info.routeName;
      onRouteStateSync(info);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onRouteChange]
  );

  const onRouteStateSync = (info: { routeName: keyof RootStackParamList; activeTab: RootTab }) => {
    onRouteChange?.(info);
  };

  const handleIncomingAuthUrl = useCallback(
    (url: string) => {
      const parsed = parseAppDeepLink(url);
      if (parsed?.type === 'auth' && !isAuthenticated) {
        setAuthInitialMode(parsed.mode);
        setAuthModalVisible(true);
      }
    },
    [isAuthenticated, setAuthInitialMode, setAuthModalVisible]
  );

  const MainTabs = useCallback(
    () => (
      <Tab.Navigator
        initialRouteName="Home"
        tabBar={renderTabBar}
        screenOptions={{ headerShown: false, lazy: true }}
      >
        <Tab.Screen name="Home" component={HomeTabRoute} />
        <Tab.Screen name="Courses" component={CoursesTabRoute} />
        <Tab.Screen name="MyLearning" component={MyLearningTabRoute} />
        <Tab.Screen name="Workshops" component={WorkshopsTabRoute} />
        <Tab.Screen name="Profile" component={ProfileTabRoute} />
      </Tab.Navigator>
    ),
    [renderTabBar]
  );

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={APP_LINKING_CONFIG}
      theme={navTheme}
      onReady={() => {
        flushPendingNavigation();
        Linking.getInitialURL()
          .then((url) => {
            if (url) handleIncomingAuthUrl(url);
          })
          .catch(() => {});
      }}
      onStateChange={handleStateChange}
    >
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="CourseDetail" component={CourseDetailRoute as any} />
        <Stack.Screen name="LessonPlayer" component={LessonPlayerRoute as any} />
        <Stack.Screen name="YouTubeVideos" component={YouTubeVideosRoute} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
