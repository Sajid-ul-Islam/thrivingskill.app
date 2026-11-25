import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useYouTube } from '../../context/YouTubeContext';
import { BrandDrawer } from './BrandDrawer';
import { SupportContactModal } from '../modals/SupportContactModal';
import { AppUpdateModal } from '../modals/AppUpdateModal';
import { SubscriptionModal } from '../modals/SubscriptionModal';
import { NotificationModal } from '../modals/NotificationModal';
import { SkillAssessmentModal } from '../modals/SkillAssessmentModal';
import { CorporateInquiryModal } from '../modals/CorporateInquiryModal';
import { AuthModal } from '../modals/AuthModal';
import { YouTubePlayerModal } from '../player/YouTubePlayerModal';
import { UniversalSearchModal } from '../modals/UniversalSearchModal';
import { BrandSplashScreen } from '../splash/BrandSplashScreen';
import { RootTab } from '../../types';

interface AppModalHostProps {
  onNavigateTab: (tab: RootTab) => void;
  onNavigateToCourse: (courseId: string) => void;
  onOpenYouTube: () => void;
}

/**
 * Centralized Modal Manager Host rendering every application-wide modal, drawer,
 * auth gate, splash overlay, and hardware-back modal dismiss handler.
 */
export const AppModalHost: React.FC<AppModalHostProps> = ({
  onNavigateTab,
  onNavigateToCourse,
  onOpenYouTube,
}) => {
  const { isBangla } = useLanguage();
  const {
    activeModal,
    isModalOpen,
    openModal,
    closeModal,
    isSplashVisible,
    setIsSplashVisible,
    authInitialMode,
    setAuthInitialMode,
  } = useModal();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    isAuthModalVisible,
    setAuthModalVisible,
    sessionExpiredNotice,
    clearSessionExpiredNotice,
  } = useAuth();
  const { activeVideo, playerMode, closePlayer, minimizePlayer, playVideo } = useYouTube();

  useEffect(() => {
    if (sessionExpiredNotice) {
      setAuthInitialMode('login');
      setIsSplashVisible(false);
    }
  }, [sessionExpiredNotice, setAuthInitialMode, setIsSplashVisible]);

  useEffect(() => {
    const onHardwareBack = () => {
      if (activeModal !== null) {
        closeModal();
        return true;
      }
      if (isAuthModalVisible) {
        setAuthModalVisible(false);
        return true;
      }
      if (playerMode === 'modal') {
        minimizePlayer();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [
    activeModal,
    closeModal,
    isAuthModalVisible,
    setAuthModalVisible,
    playerMode,
    minimizePlayer,
  ]);

  return (
    <>
      <BrandDrawer
        visible={isModalOpen('drawer')}
        onClose={closeModal}
        onNavigateTab={onNavigateTab}
        onOpenYouTube={onOpenYouTube}
        onOpenAssessment={() => openModal('assessment')}
        onOpenSubscription={() => openModal('subscription')}
        onOpenUpdate={() => openModal('update')}
        onOpenSupport={() => openModal('support')}
        onOpenCorporate={() => openModal('corporate')}
      />

      <SupportContactModal visible={isModalOpen('support')} onClose={closeModal} />
      <AppUpdateModal visible={isModalOpen('update')} onClose={closeModal} />
      <SubscriptionModal visible={isModalOpen('subscription')} onClose={closeModal} />

      <NotificationModal
        visible={isModalOpen('notifications')}
        onClose={closeModal}
        onNavigateToTab={(tab, courseId) => {
          if (tab) onNavigateTab(tab);
          if (courseId) onNavigateToCourse(courseId);
        }}
      />

      <SkillAssessmentModal
        visible={isModalOpen('assessment')}
        onClose={closeModal}
        onNavigateToCourse={onNavigateToCourse}
      />

      <CorporateInquiryModal visible={isModalOpen('corporate')} onClose={closeModal} />

      <AuthModal
        visible={isAuthModalVisible || (!isAuthenticated && !isAuthLoading && !isSplashVisible)}
        initialMode={sessionExpiredNotice ? 'login' : authInitialMode}
        initialInfoMessage={
          sessionExpiredNotice
            ? isBangla
              ? 'আপনার সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার সাইন ইন করুন।'
              : 'Your session has expired. Please sign in again.'
            : null
        }
        dismissible={isAuthenticated}
        onClose={() => {
          clearSessionExpiredNotice();
          setAuthModalVisible(false);
        }}
      />

      <YouTubePlayerModal
        visible={playerMode === 'modal' && activeVideo !== null}
        video={activeVideo}
        onClose={closePlayer}
        onMinimize={minimizePlayer}
        onNavigateToCourse={onNavigateToCourse}
        onSelectVideo={(v) => playVideo(v, 'modal')}
      />

      <UniversalSearchModal
        visible={isModalOpen('search')}
        onClose={closeModal}
        onSelectCourse={(courseId) => {
          closeModal();
          onNavigateToCourse(courseId);
        }}
        onSelectYouTubeVideo={(video) => {
          closeModal();
          playVideo(video, 'modal');
        }}
        onSelectWorkshop={() => {
          closeModal();
          onNavigateTab('Workshops');
        }}
      />

      {(isSplashVisible || isAuthLoading) && (
        <BrandSplashScreen
          isLoading={isAuthLoading}
          onGetStarted={() => {
            setIsSplashVisible(false);
            if (!isAuthenticated) {
              setAuthInitialMode('register');
              setAuthModalVisible(true);
            }
          }}
          onSignIn={() => {
            setIsSplashVisible(false);
            if (!isAuthenticated) {
              setAuthInitialMode('login');
              setAuthModalVisible(true);
            }
          }}
          onDismiss={() => setIsSplashVisible(false)}
          onExitComplete={() => setIsSplashVisible(false)}
        />
      )}
    </>
  );
};
