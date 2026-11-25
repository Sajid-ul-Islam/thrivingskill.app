import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { AuthMode } from '../components/modals/AuthModal';

export type AppModalType =
  | 'subscription'
  | 'notifications'
  | 'assessment'
  | 'corporate'
  | 'search'
  | 'drawer'
  | 'update'
  | 'support';

interface ModalContextValue {
  activeModal: AppModalType | null;
  isModalOpen: (modal: AppModalType) => boolean;
  openModal: (modal: AppModalType) => void;
  closeModal: () => void;
  isSplashVisible: boolean;
  setIsSplashVisible: React.Dispatch<React.SetStateAction<boolean>>;
  authInitialMode: AuthMode;
  setAuthInitialMode: React.Dispatch<React.SetStateAction<AuthMode>>;
}

const defaultModalContext: ModalContextValue = {
  activeModal: null,
  isModalOpen: () => false,
  openModal: () => {},
  closeModal: () => {},
  isSplashVisible: false,
  setIsSplashVisible: () => {},
  authInitialMode: 'login',
  setAuthInitialMode: () => {},
};

const ModalContext = createContext<ModalContextValue>(defaultModalContext);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<AppModalType | null>(null);
  const [isSplashVisible, setIsSplashVisible] = useState<boolean>(true);
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>('login');

  const openModal = useCallback((modal: AppModalType) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const isModalOpen = useCallback((modal: AppModalType) => activeModal === modal, [activeModal]);

  const value = useMemo<ModalContextValue>(
    () => ({
      activeModal,
      isModalOpen,
      openModal,
      closeModal,
      isSplashVisible,
      setIsSplashVisible,
      authInitialMode,
      setAuthInitialMode,
    }),
    [activeModal, isModalOpen, openModal, closeModal, isSplashVisible, authInitialMode]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export function useModal(): ModalContextValue {
  return useContext(ModalContext);
}
