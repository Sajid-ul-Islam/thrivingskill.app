import { useRef, useEffect, useCallback } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native';

export interface UseAutoScrollOptions {
  /** Whether auto-scroll is actively enabled (default: true) */
  enabled?: boolean;
  /** Pixels to advance per tick. E.g. 0.45 - 0.55 gives gentle gliding at ~15-18px/s (default: 0.5) */
  speed?: number;
  /** Tick frequency in milliseconds. 30ms gives ~33 FPS fluid motion (default: 30) */
  intervalMs?: number;
  /** Milliseconds to pause at the start/end edges before turnaround (default: 1500) */
  pauseAtEdgeMs?: number;
  /** Milliseconds of idle cooldown after the user swipes before resuming (default: 2800) */
  resumeDelayMs?: number;
  /** Turnaround behavior when reaching an edge: 'reverse' bounces back, 'restart' loops to 0 (default: 'reverse') */
  loopMode?: 'reverse' | 'restart';
}

export interface UseAutoScrollReturn {
  scrollViewRef: React.RefObject<ScrollView | null>;
  pauseTemporarily: (ms?: number) => void;
  resume: () => void;
  scrollProps: {
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onScrollBeginDrag: () => void;
    onScrollEndDrag: () => void;
    onMomentumScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onLayout: (e: LayoutChangeEvent) => void;
    onContentSizeChange: (w: number, h: number) => void;
    scrollEventThrottle: number;
  };
}

export const useAutoScroll = (options: UseAutoScrollOptions = {}): UseAutoScrollReturn => {
  const {
    enabled = true,
    speed = 0.5,
    intervalMs = 30,
    pauseAtEdgeMs = 1500,
    resumeDelayMs = 2800,
    loopMode = 'reverse',
  } = options;

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPosRef = useRef<number>(0);
  const contentWidthRef = useRef<number>(0);
  const containerWidthRef = useRef<number>(0);
  const isUserInteractingRef = useRef<boolean>(false);
  const scrollDirectionRef = useRef<'right' | 'left'>('right');
  const pauseCounterRef = useRef<number>(0);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pauseTicks = Math.max(1, Math.round(pauseAtEdgeMs / intervalMs));

  // Ticker for smooth linear motion
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (isUserInteractingRef.current) return;

      const maxScroll = Math.max(0, contentWidthRef.current - containerWidthRef.current);
      if (maxScroll <= 5) return;

      // Handle pause at edges
      if (pauseCounterRef.current > 0) {
        pauseCounterRef.current -= 1;
        return;
      }

      if (scrollDirectionRef.current === 'right') {
        scrollPosRef.current += speed;
        if (scrollPosRef.current >= maxScroll) {
          scrollPosRef.current = maxScroll;
          if (loopMode === 'reverse') {
            scrollDirectionRef.current = 'left';
          } else {
            scrollPosRef.current = 0;
          }
          pauseCounterRef.current = pauseTicks;
        }
      } else {
        scrollPosRef.current -= speed;
        if (scrollPosRef.current <= 0) {
          scrollPosRef.current = 0;
          scrollDirectionRef.current = 'right';
          pauseCounterRef.current = pauseTicks;
        }
      }

      scrollViewRef.current?.scrollTo({
        x: scrollPosRef.current,
        animated: false,
      });
    }, intervalMs);

    return () => {
      clearInterval(interval);
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [enabled, speed, intervalMs, pauseTicks, loopMode]);

  // Pause temporarily on interaction (e.g. card/pill tap)
  const pauseTemporarily = useCallback((ms: number = 3500) => {
    isUserInteractingRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, ms);
  }, []);

  const resume = useCallback(() => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    isUserInteractingRef.current = false;
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    isUserInteractingRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, resumeDelayMs);
  }, [resumeDelayMs]);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPosRef.current = e.nativeEvent.contentOffset.x;
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
      }, resumeDelayMs);
    },
    [resumeDelayMs]
  );

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isUserInteractingRef.current) {
      scrollPosRef.current = e.nativeEvent.contentOffset.x;
    }
  }, []);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    containerWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const handleContentSizeChange = useCallback((w: number) => {
    contentWidthRef.current = w;
  }, []);

  return {
    scrollViewRef,
    pauseTemporarily,
    resume,
    scrollProps: {
      onScroll: handleScroll,
      onScrollBeginDrag: handleScrollBeginDrag,
      onScrollEndDrag: handleScrollEndDrag,
      onMomentumScrollEnd: handleMomentumScrollEnd,
      onLayout: handleLayout,
      onContentSizeChange: handleContentSizeChange,
      scrollEventThrottle: 16,
    },
  };
};
