import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastPayload {
  id: string;
  message: string;
  type: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
}

export interface ShowToastOptions {
  message: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
  haptic?: boolean;
}

interface FeedbackContextType {
  currentToast: ToastPayload | null;
  showToast: (options: ShowToastOptions) => void;
  dismissToast: () => void;
}

const FeedbackContext = createContext<FeedbackContextType>({
  currentToast: null,
  showToast: () => {},
  dismissToast: () => {},
});

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const dismissToast = useCallback(() => {
    clearTimer();
    setCurrentToast(null);
  }, [clearTimer]);

  const showToast = useCallback(
    ({
      message,
      type = 'info',
      actionLabel,
      onAction,
      durationMs = actionLabel ? 5000 : 3200,
      haptic = true,
    }: ShowToastOptions) => {
      clearTimer();

      if (haptic) {
        if (type === 'success') triggerHaptic('success');
        else if (type === 'warning') triggerHaptic('warning');
        else if (type === 'error') triggerHaptic('error');
        else triggerHaptic('light');
      }

      const payload: ToastPayload = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message,
        type,
        actionLabel,
        onAction,
        durationMs,
      };

      setCurrentToast(payload);

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setCurrentToast(null);
      }, durationMs);
    },
    [clearTimer]
  );

  return (
    <FeedbackContext.Provider value={{ currentToast, showToast, dismissToast }}>
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => useContext(FeedbackContext);
