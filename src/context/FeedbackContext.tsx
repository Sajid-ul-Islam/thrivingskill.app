import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Alert, AlertButton, AlertOptions } from 'react-native';
import { triggerHaptic } from '../utils/haptics';

export type ToastType = 'success' | 'info' | 'warning' | 'error';
export type ToastPosition = 'top' | 'bottom';
export type BannerType = 'info' | 'warning' | 'error' | 'success' | 'promo';
export type PopupType = 'confirm' | 'info' | 'warning' | 'destructive' | 'success';

export interface ToastPayload {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  position?: ToastPosition;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
  icon?: string;
}

export interface ShowToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  position?: ToastPosition;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
  haptic?: boolean;
  icon?: string;
}

export interface SnackbarPayload {
  id: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  durationMs: number;
  type?: ToastType;
  showProgress?: boolean;
}

export interface ShowSnackbarOptions {
  message: string;
  actionLabel: string;
  onAction: () => void;
  durationMs?: number;
  type?: ToastType;
  showProgress?: boolean;
  haptic?: boolean;
}

export interface BannerPayload {
  id: string;
  title: string;
  message?: string;
  type?: BannerType;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: string;
}

export interface ShowBannerOptions {
  title: string;
  message?: string;
  type?: BannerType;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: string;
  haptic?: boolean;
}

export interface PopupPayload {
  id: string;
  title: string;
  message: string;
  type?: PopupType;
  icon?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  isDestructive?: boolean;
}

export interface ShowPopupOptions {
  title: string;
  message: string;
  type?: PopupType;
  icon?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  isDestructive?: boolean;
  haptic?: boolean;
}

export interface FeedbackContextType {
  currentToast: ToastPayload | null;
  showToast: (options: ShowToastOptions) => void;
  dismissToast: () => void;

  currentSnackbar: SnackbarPayload | null;
  showSnackbar: (options: ShowSnackbarOptions) => void;
  dismissSnackbar: () => void;

  currentBanner: BannerPayload | null;
  showBanner: (options: ShowBannerOptions) => void;
  dismissBanner: () => void;

  currentPopup: PopupPayload | null;
  showPopup: (options: ShowPopupOptions) => void;
  dismissPopup: () => void;
}

const FeedbackContext = createContext<FeedbackContextType>({
  currentToast: null,
  showToast: () => {},
  dismissToast: () => {},

  currentSnackbar: null,
  showSnackbar: () => {},
  dismissSnackbar: () => {},

  currentBanner: null,
  showBanner: () => {},
  dismissBanner: () => {},

  currentPopup: null,
  showPopup: () => {},
  dismissPopup: () => {},
});

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastPayload | null>(null);
  const [currentSnackbar, setCurrentSnackbar] = useState<SnackbarPayload | null>(null);
  const [currentBanner, setCurrentBanner] = useState<BannerPayload | null>(null);
  const [currentPopup, setCurrentPopup] = useState<PopupPayload | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const clearSnackbarTimer = useCallback(() => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current);
      snackbarTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearToastTimer();
      clearSnackbarTimer();
    };
  }, [clearToastTimer, clearSnackbarTimer]);

  // ---------------------------------------------------------------------------
  // TOAST HANDLERS
  // ---------------------------------------------------------------------------
  const dismissToast = useCallback(() => {
    clearToastTimer();
    setCurrentToast(null);
  }, [clearToastTimer]);

  const showToast = useCallback(
    ({
      message,
      title,
      type = 'info',
      position = 'top',
      actionLabel,
      onAction,
      durationMs = actionLabel ? 5000 : 3200,
      haptic = true,
      icon,
    }: ShowToastOptions) => {
      clearToastTimer();

      if (haptic) {
        if (type === 'success') triggerHaptic('success');
        else if (type === 'warning') triggerHaptic('warning');
        else if (type === 'error') triggerHaptic('error');
        else triggerHaptic('light');
      }

      const payload: ToastPayload = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message,
        title,
        type,
        position,
        actionLabel,
        onAction,
        durationMs,
        icon,
      };

      setCurrentToast(payload);

      toastTimerRef.current = setTimeout(() => {
        toastTimerRef.current = null;
        setCurrentToast(null);
      }, durationMs);
    },
    [clearToastTimer]
  );

  // ---------------------------------------------------------------------------
  // SNACKBAR HANDLERS (Bottom-anchored action feedback with Undo / Retry)
  // ---------------------------------------------------------------------------
  const dismissSnackbar = useCallback(() => {
    clearSnackbarTimer();
    setCurrentSnackbar(null);
  }, [clearSnackbarTimer]);

  const showSnackbar = useCallback(
    ({
      message,
      actionLabel,
      onAction,
      durationMs = 5000,
      type = 'info',
      showProgress = true,
      haptic = true,
    }: ShowSnackbarOptions) => {
      clearSnackbarTimer();

      if (haptic) {
        triggerHaptic('medium');
      }

      const payload: SnackbarPayload = {
        id: `snack-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message,
        actionLabel,
        onAction,
        durationMs,
        type,
        showProgress,
      };

      setCurrentSnackbar(payload);

      snackbarTimerRef.current = setTimeout(() => {
        snackbarTimerRef.current = null;
        setCurrentSnackbar(null);
      }, durationMs);
    },
    [clearSnackbarTimer]
  );

  // ---------------------------------------------------------------------------
  // BANNER HANDLERS (Top announcement / system alert banner)
  // ---------------------------------------------------------------------------
  const dismissBanner = useCallback(() => {
    if (currentBanner?.onDismiss) {
      currentBanner.onDismiss();
    }
    setCurrentBanner(null);
  }, [currentBanner]);

  const showBanner = useCallback(
    ({
      title,
      message,
      type = 'info',
      actionLabel,
      onAction,
      dismissible = true,
      onDismiss,
      icon,
      haptic = true,
    }: ShowBannerOptions) => {
      if (haptic) {
        if (type === 'error' || type === 'warning') triggerHaptic('warning');
        else triggerHaptic('light');
      }

      const payload: BannerPayload = {
        id: `banner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        message,
        type,
        actionLabel,
        onAction,
        dismissible,
        onDismiss,
        icon,
      };

      setCurrentBanner(payload);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // POPUP HANDLERS (Modal dialog for confirmation / alert)
  // ---------------------------------------------------------------------------
  const dismissPopup = useCallback(() => {
    setCurrentPopup(null);
  }, []);

  const showPopup = useCallback(
    ({
      title,
      message,
      type = 'confirm',
      icon,
      primaryLabel,
      secondaryLabel,
      onConfirm,
      onCancel,
      isDestructive = false,
      haptic = true,
    }: ShowPopupOptions) => {
      if (haptic) {
        if (isDestructive || type === 'destructive') triggerHaptic('error');
        else if (type === 'warning') triggerHaptic('warning');
        else triggerHaptic('medium');
      }

      const payload: PopupPayload = {
        id: `popup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        message,
        type,
        icon,
        primaryLabel: primaryLabel || (type === 'confirm' ? 'Confirm' : 'OK'),
        secondaryLabel: secondaryLabel || (type === 'confirm' ? 'Cancel' : undefined),
        onConfirm,
        onCancel,
        isDestructive: isDestructive || type === 'destructive',
      };

      setCurrentPopup(payload);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // NATIVE ALERT BRIDGE: Intercepts Alert.alert() across the entire app
  // and routes it into the branded, accessible ModernPopup component.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const originalAlert = Alert.alert;

    Alert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions
    ) => {
      const fullText = `${title || ''} ${message || ''}`.toLowerCase();
      let type: PopupType = 'info';
      let icon: string | undefined;

      if (
        fullText.includes('certificate') ||
        fullText.includes('achievement') ||
        fullText.includes('সনদ') ||
        fullText.includes('অর্জন') ||
        fullText.includes('award') ||
        fullText.includes('credential')
      ) {
        icon = 'ribbon-outline';
        type = 'info';
      } else if (
        fullText.includes('error') ||
        fullText.includes('failed') ||
        fullText.includes('ত্রুটি') ||
        fullText.includes('ব্যর্থ') ||
        fullText.includes('incorrect')
      ) {
        type = 'destructive';
        icon = 'alert-circle-outline';
      } else if (
        fullText.includes('success') ||
        fullText.includes('সফল') ||
        fullText.includes('passed') ||
        fullText.includes('unlocked') ||
        fullText.includes('সক্রিয়')
      ) {
        type = 'success';
        icon = 'checkmark-circle-outline';
      } else if (
        fullText.includes('delete') ||
        fullText.includes('remove') ||
        fullText.includes('মুছে')
      ) {
        type = 'destructive';
        icon = 'trash-outline';
      } else if (
        fullText.includes('warning') ||
        fullText.includes('alert') ||
        fullText.includes('সতর্ক')
      ) {
        type = 'warning';
        icon = 'warning-outline';
      }

      let primaryLabel = 'OK';
      let secondaryLabel: string | undefined;
      let onConfirm: (() => void) | undefined;
      let onCancel: (() => void) | undefined;
      let isDestructive = false;

      if (buttons && buttons.length > 0) {
        if (buttons.length === 1) {
          primaryLabel = buttons[0].text || 'OK';
          const fn = buttons[0].onPress;
          onConfirm = fn ? () => { fn(); } : undefined;
          if (buttons[0].style === 'destructive') isDestructive = true;
        } else {
          const cancelBtn = buttons.find((b) => b.style === 'cancel');
          const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[1];

          if (cancelBtn) {
            secondaryLabel = cancelBtn.text || 'Cancel';
            const cFn = cancelBtn.onPress;
            onCancel = cFn ? () => { cFn(); } : undefined;
          }
          if (confirmBtn) {
            primaryLabel = confirmBtn.text || 'Confirm';
            const cfFn = confirmBtn.onPress;
            onConfirm = cfFn ? () => { cfFn(); } : undefined;
            if (confirmBtn.style === 'destructive') {
              isDestructive = true;
              type = 'destructive';
            }
          }
        }
      }

      const optDismiss = options?.onDismiss;
      showPopup({
        title: title || '',
        message: message || '',
        type,
        icon,
        primaryLabel,
        secondaryLabel,
        onConfirm,
        onCancel: onCancel || (optDismiss ? () => { optDismiss(); } : undefined),
        isDestructive,
      });
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, [showPopup]);

  return (
    <FeedbackContext.Provider
      value={{
        currentToast,
        showToast,
        dismissToast,
        currentSnackbar,
        showSnackbar,
        dismissSnackbar,
        currentBanner,
        showBanner,
        dismissBanner,
        currentPopup,
        showPopup,
        dismissPopup,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => useContext(FeedbackContext);
