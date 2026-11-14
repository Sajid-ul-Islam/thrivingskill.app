import { useState, useCallback, useRef } from 'react';
import { ActiveScreen, RootTab } from '../types';
import { triggerHaptic } from '../utils/haptics';

export interface UseNavigationStackOptions {
  initialTab?: RootTab;
  initialScreen?: ActiveScreen;
}

export interface NavigationStackResult {
  stack: ActiveScreen[];
  currentScreen: ActiveScreen;
  activeScreen: ActiveScreen; // Alias for backward compatibility & static checkers
  activeTab: RootTab;
  canGoBack: boolean;
  push: (screen: ActiveScreen) => void;
  pop: () => boolean;
  replace: (screen: ActiveScreen) => void;
  resetToTabs: (tab?: RootTab) => void;
  navigateToTab: (tab: RootTab) => void;
  navigateToCourse: (courseId: string) => void;
  navigateToLesson: (courseId: string, lessonId: string) => void;
  navigateBack: () => boolean;
}

/**
 * Type-Safe Navigation Stack Hook
 * Provides structured history management, seamless stack traversal,
 * automatic root fallback, and predictable Android hardware back handling.
 */
export function useNavigationStack(options: UseNavigationStackOptions = {}): NavigationStackResult {
  const initialTab: RootTab = options.initialTab || 'Home';
  const initialScreen: ActiveScreen = options.initialScreen || {
    name: 'MainTabs',
    tab: initialTab,
  };

  const [stack, setStack] = useState<ActiveScreen[]>([initialScreen]);
  const [activeTab, setActiveTab] = useState<RootTab>(initialTab);

  // Ref to guarantee up-to-date stack access in event callbacks
  const stackRef = useRef<ActiveScreen[]>([initialScreen]);
  stackRef.current = stack;

  const currentScreen = stack[stack.length - 1] || initialScreen;

  /**
   * Push a new screen onto the stack.
   */
  const push = useCallback((screen: ActiveScreen) => {
    setStack((prev) => {
      // Avoid duplicate consecutive identical screens
      const top = prev[prev.length - 1];
      if (top && top.name === screen.name) {
        if (
          top.name === 'CourseDetail' &&
          screen.name === 'CourseDetail' &&
          top.courseId === screen.courseId
        ) {
          return prev;
        }
        if (
          top.name === 'LessonPlayer' &&
          screen.name === 'LessonPlayer' &&
          top.courseId === screen.courseId &&
          top.lessonId === screen.lessonId
        ) {
          return prev;
        }
      }
      const nextStack = [...prev, screen];
      stackRef.current = nextStack;
      return nextStack;
    });
  }, []);

  /**
   * Pop the topmost screen from the stack.
   * Returns true if a screen was popped; false if already at root tabs.
   */
  const pop = useCallback((): boolean => {
    if (stackRef.current.length <= 1) {
      return false;
    }
    setStack((prev) => {
      if (prev.length <= 1) return prev;
      const nextStack = prev.slice(0, prev.length - 1);
      stackRef.current = nextStack;
      const top = nextStack[nextStack.length - 1];
      if (top && top.name === 'MainTabs') {
        setActiveTab(top.tab);
      }
      return nextStack;
    });
    return true;
  }, []);

  /**
   * Replace the topmost screen with a new screen (e.g. switching lessons in player).
   */
  const replace = useCallback((screen: ActiveScreen) => {
    setStack((prev) => {
      if (prev.length === 0) return [screen];
      const nextStack = [...prev.slice(0, prev.length - 1), screen];
      stackRef.current = nextStack;
      if (screen.name === 'MainTabs') {
        setActiveTab(screen.tab);
      }
      return nextStack;
    });
  }, []);

  /**
   * Reset navigation stack back to the root tabs.
   */
  const resetToTabs = useCallback((tab?: RootTab) => {
    setStack((prev) => {
      const targetTab = tab || activeTab;
      setActiveTab(targetTab);
      const rootScreen: ActiveScreen = { name: 'MainTabs', tab: targetTab };
      stackRef.current = [rootScreen];
      return [rootScreen];
    });
  }, [activeTab]);

  /**
   * Navigate to a primary bottom tab.
   */
  const navigateToTab = useCallback((tab: RootTab) => {
    const current = stackRef.current[stackRef.current.length - 1];
    if (tab !== activeTab || !current || current.name !== 'MainTabs') {
      triggerHaptic('selection');
    }
    setActiveTab(tab);
    const rootScreen: ActiveScreen = { name: 'MainTabs', tab };
    stackRef.current = [rootScreen];
    setStack([rootScreen]);
  }, [activeTab]);

  /**
   * Navigate to course details screen.
   */
  const navigateToCourse = useCallback((courseId: string) => {
    push({ name: 'CourseDetail', courseId });
  }, [push]);

  /**
   * Navigate to lesson player screen.
   * If already inside the player for the same course, replaces the current lesson
   * to keep the back stack concise (Jakob's Law).
   */
  const navigateToLesson = useCallback((courseId: string, lessonId: string) => {
    const top = stackRef.current[stackRef.current.length - 1];
    if (top && top.name === 'LessonPlayer' && top.courseId === courseId) {
      replace({ name: 'LessonPlayer', courseId, lessonId });
    } else {
      push({ name: 'LessonPlayer', courseId, lessonId });
    }
  }, [push, replace]);

  const canGoBack = stack.length > 1;

  return {
    stack,
    currentScreen,
    activeScreen: currentScreen,
    activeTab,
    canGoBack,
    push,
    pop,
    replace,
    resetToTabs,
    navigateToTab,
    navigateToCourse,
    navigateToLesson,
    navigateBack: pop,
  };
}
