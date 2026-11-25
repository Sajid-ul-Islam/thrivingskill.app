import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { parseAppDeepLink, APP_LINKING_CONFIG } from '../navigation/deepLinking';
import {
  normalizeNotificationPayload,
  PushNotificationService,
} from '../services/notifications/pushNotificationService';
import { ModalProvider, useModal } from '../context/ModalContext';
import {
  navigationRef,
  navigateByNotificationData,
  flushPendingNavigation,
  clearPendingNavigationForTest,
} from '../navigation/AppNavigator';

jest.mock('expo-notifications', () => {
  let warmTapCallback: ((response: any) => void) | null = null;
  const removeFn = jest.fn();
  return {
    __esModule: true,
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn((cb: (response: any) => void) => {
      warmTapCallback = cb;
      return { remove: removeFn };
    }),
    getLastNotificationResponseAsync: jest.fn(async () => null),
    __triggerWarmTap: (response: any) => {
      if (warmTapCallback) warmTapCallback(response);
    },
    __resetMock: () => {
      warmTapCallback = null;
      removeFn.mockClear();
    },
  };
});

jest.mock('../screens/HomeScreen', () => ({ HomeScreen: () => null }));
jest.mock('../screens/CoursesScreen', () => ({ CoursesScreen: () => null }));
jest.mock('../screens/MyLearningScreen', () => ({ MyLearningScreen: () => null }));
jest.mock('../screens/WorkshopsScreen', () => ({ WorkshopsScreen: () => null }));
jest.mock('../screens/ProfileScreen', () => ({ ProfileScreen: () => null }));
jest.mock('../screens/CourseDetailScreen', () => ({ CourseDetailScreen: () => null }));
jest.mock('../screens/LessonPlayerScreen', () => ({ LessonPlayerScreen: () => null }));
jest.mock('../screens/YouTubeVideosScreen', () => ({ YouTubeVideosScreen: () => null }));

const mockNotifications = jest.requireMock('expo-notifications');

const ModalHarness: React.FC = () => {
  const { activeModal, isModalOpen, openModal, closeModal } = useModal();
  return (
    <View>
      <Text testID="active-modal">{activeModal ?? 'none'}</Text>
      <Text testID="search-open">{String(isModalOpen('search'))}</Text>
      <TouchableOpacity testID="open-search" onPress={() => openModal('search')} />
      <TouchableOpacity testID="open-notifs" onPress={() => openModal('notifications')} />
      <TouchableOpacity testID="close-modal" onPress={closeModal} />
    </View>
  );
};

describe('Deep links, notification routing, and ModalManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotifications.__resetMock();
    clearPendingNavigationForTest();
    (PushNotificationService as any).handledResponseKeys?.clear();
  });

  it('parses internal schemes and verified domains while rejecting untrusted hosts', () => {
    expect(parseAppDeepLink('thrivingskill://courses/123')).toEqual({
      type: 'course',
      courseId: '123',
    });
    expect(parseAppDeepLink('https://thrivingskill.com/courses/45/lessons/9')).toEqual({
      type: 'lesson',
      courseId: '45',
      lessonId: '9',
    });
    expect(parseAppDeepLink('https://www.thrivingskill.com/login')).toEqual({
      type: 'auth',
      mode: 'login',
    });
    expect(parseAppDeepLink('https://thrivingskill.com/register')).toEqual({
      type: 'auth',
      mode: 'register',
    });
    expect(parseAppDeepLink('https://thrivingskill.com/my-learning')).toEqual({
      type: 'tab',
      tab: 'MyLearning',
    });
    expect(parseAppDeepLink('https://evil.example.com/courses/123')).toBeNull();
    expect(APP_LINKING_CONFIG.prefixes).toContain('https://thrivingskill.com');
  });

  it('normalizes backend push payloads (course_id/courseId/lesson_id/screen/url)', () => {
    expect(normalizeNotificationPayload({ course_id: 101, screen: 'CourseDetail' })).toEqual({
      screen: 'CourseDetail',
      courseId: '101',
      rawScreen: 'CourseDetail',
    });
    expect(normalizeNotificationPayload({ course_id: 202, lesson_id: 303 })).toEqual({
      screen: 'LessonPlayer',
      courseId: '202',
      lessonId: '303',
      rawScreen: '',
    });
    expect(normalizeNotificationPayload({ screen: 'Workshops' })).toEqual({
      screen: 'Workshops',
      tab: 'Workshops',
      rawScreen: 'Workshops',
    });
    expect(
      normalizeNotificationPayload({ postUrl: 'https://thrivingskill.com/courses/77/lessons/88' })
    ).toEqual({
      screen: 'LessonPlayer',
      courseId: '77',
      lessonId: '88',
      rawScreen: '',
    });
  });

  it('handles both cold-start and warm-start notification taps with deduplication', async () => {
    mockNotifications.getLastNotificationResponseAsync.mockResolvedValueOnce({
      actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
      notification: {
        request: {
          identifier: 'cold-notif-1',
          content: {
            data: { course_id: '55', screen: 'CourseDetail' },
          },
        },
      },
    });

    const listener = jest.fn();
    const unsubscribe = PushNotificationService.addNativeNotificationResponseListener(listener);

    await waitFor(() => {
      expect(listener).toHaveBeenCalledTimes(1);
    });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        course_id: '55',
        courseId: '55',
        normalizedScreen: 'CourseDetail',
      })
    );

    // Duplicate delivery of the exact same notification identifier is ignored
    mockNotifications.__triggerWarmTap({
      actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
      notification: {
        request: {
          identifier: 'cold-notif-1',
          content: { data: { course_id: '55', screen: 'CourseDetail' } },
        },
      },
    });
    expect(listener).toHaveBeenCalledTimes(1);

    // Warm-start tap with a new lesson payload dispatches immediately
    mockNotifications.__triggerWarmTap({
      actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
      notification: {
        request: {
          identifier: 'warm-notif-2',
          content: { data: { course_id: 88, lesson_id: 99 } },
        },
      },
    });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        courseId: '88',
        lessonId: '99',
        normalizedScreen: 'LessonPlayer',
      })
    );

    unsubscribe();
  });

  it('queues cold-start notification navigation until navigationRef is ready and flushes cleanly', () => {
    const isReadySpy = jest.spyOn(navigationRef, 'isReady');
    const navigateSpy = jest
      .spyOn(navigationRef, 'navigate')
      .mockImplementation(() => undefined as any);

    // Cold start before container is ready
    isReadySpy.mockReturnValue(false);
    expect(navigateByNotificationData({ course_id: '123', screen: 'CourseDetail' })).toBe(true);
    expect(navigateByNotificationData({ screen: 'Workshops' })).toBe(true);
    expect(navigateSpy).not.toHaveBeenCalled();

    // NavigationContainer becomes ready -> flush queued actions
    isReadySpy.mockReturnValue(true);
    flushPendingNavigation();

    expect(navigateSpy).toHaveBeenNthCalledWith(1, 'CourseDetail', { courseId: '123' });
    expect(navigateSpy).toHaveBeenNthCalledWith(2, 'MainTabs', { screen: 'Workshops' });

    // Warm start routes immediately
    expect(navigateByNotificationData({ courseId: '45', lessonId: '67' })).toBe(true);
    expect(navigateSpy).toHaveBeenNthCalledWith(3, 'LessonPlayer', {
      courseId: '45',
      lessonId: '67',
    });

    isReadySpy.mockRestore();
    navigateSpy.mockRestore();
  });

  it('manages single active modal state via ModalProvider and useModal', async () => {
    await render(
      <ModalProvider>
        <ModalHarness />
      </ModalProvider>
    );

    expect(screen.getByTestId('active-modal').props.children).toBe('none');
    await fireEvent.press(screen.getByTestId('open-search'));
    expect(screen.getByTestId('active-modal').props.children).toBe('search');
    expect(screen.getByTestId('search-open').props.children).toBe('true');

    await fireEvent.press(screen.getByTestId('open-notifs'));
    expect(screen.getByTestId('active-modal').props.children).toBe('notifications');
    expect(screen.getByTestId('search-open').props.children).toBe('false');

    await fireEvent.press(screen.getByTestId('close-modal'));
    expect(screen.getByTestId('active-modal').props.children).toBe('none');
  });
});
