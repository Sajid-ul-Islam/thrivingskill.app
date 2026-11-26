import React from 'react';
import {
  AboutTSLModal,
  LegalPolicyModal,
  AppUpdateModal,
  HelpFaqModal,
  BlogModal,
  CertificateModal,
  MandatoryReviewModal,
  EbookModal,
  ServicesModal,
  InstructorsModal,
} from '../../components';
import { StorageManagerModal } from '../../components/modals/StorageManagerModal';
import { SpacedRepetitionModal } from '../../components/modals/SpacedRepetitionModal';
import { OfflineStudyDeckModal } from '../../components/modals/OfflineStudyDeckModal';
import { LocalSearchModal } from '../../components/modals/LocalSearchModal';
import { DeveloperOptionsModal } from '../../components/modals/DeveloperOptionsModal';
import {
  ProfileSettingsModal,
  ProfileDeleteAccountModal,
  ProfileChangePasswordModal,
  ProfileOrdersModal,
  FullProfileModal,
} from '../../components/profile';
import type { useProfileScreenState } from './useProfileScreenState';
import type { Certificate } from '../../types';

interface ProfileHubModalsProps {
  state: ReturnType<typeof useProfileScreenState>;
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: any;
  activeWorkspaceName: string;
  userProgress: Record<string, any>;
  certificates: Certificate[];
  streakDays: number;
  insetsBottom: number;
  onNavigateTab: (tab: any) => void;
  onNavigateToCourse?: (courseId: string) => void;
  onNavigateToLesson?: (courseId: string, lessonId: string) => void;
  onOpenCorporateModal: () => void;
  submitMandatoryCourseReview: (
    courseId: string,
    rating: number,
    feedback: string,
    userName?: string,
    userRole?: string
  ) => Promise<Certificate | null>;
  showToast: (opts: any) => void;
}

export const ProfileHubModals: React.FC<ProfileHubModalsProps> = ({
  state,
  colors,
  isDark,
  isBangla,
  isAuthenticated,
  isAdmin,
  user,
  activeWorkspaceName,
  userProgress,
  certificates,
  streakDays,
  insetsBottom,
  onNavigateTab,
  onNavigateToCourse,
  onNavigateToLesson,
  onOpenCorporateModal,
  submitMandatoryCourseReview,
  showToast,
}) => (
  <>
    <AboutTSLModal
      visible={state.aboutModalVisible}
      onClose={() => state.setAboutModalVisible(false)}
      initialTab={state.aboutInitialTab}
      onNavigateTab={onNavigateTab}
    />
    <LegalPolicyModal
      visible={state.legalModalVisible}
      onClose={() => state.setLegalModalVisible(false)}
      initialTab={state.legalInitialTab}
    />
    <AppUpdateModal
      visible={state.updateModalVisible}
      onClose={() => state.setUpdateModalVisible(false)}
    />
    <HelpFaqModal
      visible={state.helpFaqModalVisible}
      onClose={() => state.setHelpFaqModalVisible(false)}
    />
    <BlogModal visible={state.blogModalVisible} onClose={() => state.setBlogModalVisible(false)} />
    <EbookModal
      visible={state.ebookModalVisible}
      onClose={() => state.setEbookModalVisible(false)}
    />
    <ServicesModal
      visible={state.servicesModalVisible}
      onClose={() => state.setServicesModalVisible(false)}
      onOpenInquiry={() => {
        state.setServicesModalVisible(false);
        onOpenCorporateModal();
      }}
    />
    <InstructorsModal
      visible={state.instructorsModalVisible}
      onClose={() => state.setInstructorsModalVisible(false)}
    />
    <StorageManagerModal
      visible={state.storageModalVisible}
      onClose={() => state.setStorageModalVisible(false)}
    />
    <SpacedRepetitionModal
      visible={state.flashcardsModalVisible}
      onClose={() => state.setFlashcardsModalVisible(false)}
    />
    <OfflineStudyDeckModal
      visible={state.offlineDeckModalVisible}
      onClose={() => state.setOfflineDeckModalVisible(false)}
      onOpenLessonInPlayer={onNavigateToLesson}
    />
    <LocalSearchModal
      visible={state.localSearchModalVisible}
      onClose={() => state.setLocalSearchModalVisible(false)}
      onSelectCourse={onNavigateToCourse}
      onSelectLesson={onNavigateToLesson}
    />

    <FullProfileModal
      visible={state.fullProfileModalVisible}
      onClose={() => state.setFullProfileModalVisible(false)}
      onEditProfile={() => state.setEditProfileModalVisible(true)}
      user={user}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      activeWorkspaceName={activeWorkspaceName}
      colors={colors}
      isDark={isDark}
      isBangla={isBangla}
      enrolledCount={state.enrolledCount}
      completedCount={state.completedCount}
      certificates={certificates}
      streakDays={streakDays}
      totalHoursLearned={state.totalHoursLearned}
      onSelectCertificate={(cert) => state.setSelectedCert(cert)}
    />

    <ProfileSettingsModal
      visible={state.editProfileModalVisible}
      onClose={() => state.setEditProfileModalVisible(false)}
      user={user}
      colors={colors}
      isDark={isDark}
      isBangla={isBangla}
      firstName={state.firstName}
      setFirstName={state.setFirstName}
      lastName={state.lastName}
      setLastName={state.setLastName}
      displayName={state.displayName}
      setDisplayName={state.setDisplayName}
      userEmail={state.userEmail}
      bioInfo={state.bioInfo}
      setBioInfo={state.setBioInfo}
      phoneNumber={state.phoneNumber}
      setPhoneNumber={state.setPhoneNumber}
      city={state.city}
      setCity={state.setCity}
      avatarUrl={state.avatarUrl}
      setAvatarUrl={state.setAvatarUrl}
      coverPhotoUrl={state.coverPhotoUrl}
      setCoverPhotoUrl={state.setCoverPhotoUrl}
      socialFacebook={state.socialFacebook}
      setSocialFacebook={state.setSocialFacebook}
      socialTwitter={state.socialTwitter}
      setSocialTwitter={state.setSocialTwitter}
      socialYoutube={state.socialYoutube}
      setSocialYoutube={state.setSocialYoutube}
      socialLinkedin={state.socialLinkedin}
      setSocialLinkedin={state.setSocialLinkedin}
      handleSaveProfile={state.handleSaveProfile}
      isSavingProfile={state.isSavingProfile}
      currentPass={state.currentPass}
      setCurrentPass={state.setCurrentPass}
      newPass={state.newPass}
      setNewPass={state.setNewPass}
      confirmPass={state.confirmPass}
      setConfirmPass={state.setConfirmPass}
      showCurrentPass={state.showCurrentPass}
      setShowCurrentPass={state.setShowCurrentPass}
      showNewPass={state.showNewPass}
      setShowNewPass={state.setShowNewPass}
      showConfirmPass={state.showConfirmPass}
      setShowConfirmPass={state.setShowConfirmPass}
      handleChangePassword={state.handleChangePassword}
      isChangingPass={state.isChangingPass}
      privacyPublic={state.privacyPublic}
      setPrivacyPublic={state.setPrivacyPublic}
      privacyCourses={state.privacyCourses}
      setPrivacyCourses={state.setPrivacyCourses}
      privacyCertificates={state.privacyCertificates}
      setPrivacyCertificates={state.setPrivacyCertificates}
    />

    <ProfileChangePasswordModal
      visible={state.changePasswordModalVisible}
      onClose={() => state.setChangePasswordModalVisible(false)}
      colors={colors}
      isBangla={isBangla}
      currentPass={state.currentPass}
      setCurrentPass={state.setCurrentPass}
      newPass={state.newPass}
      setNewPass={state.setNewPass}
      confirmPass={state.confirmPass}
      setConfirmPass={state.setConfirmPass}
      showCurrentPass={state.showCurrentPass}
      setShowCurrentPass={state.setShowCurrentPass}
      showNewPass={state.showNewPass}
      setShowNewPass={state.setShowNewPass}
      showConfirmPass={state.showConfirmPass}
      setShowConfirmPass={state.setShowConfirmPass}
      handleChangePassword={state.handleChangePassword}
      isChangingPass={state.isChangingPass}
    />

    <ProfileOrdersModal
      visible={state.paymentHistoryModalVisible}
      onClose={() => state.setPaymentHistoryModalVisible(false)}
      colors={colors}
      isBangla={isBangla}
      enrolledOrderCourses={state.enrolledOrderCourses}
      userProgress={userProgress}
      insetsBottom={insetsBottom}
    />

    <ProfileDeleteAccountModal
      visible={state.deleteAccountModalVisible}
      onClose={() => state.setDeleteAccountModalVisible(false)}
      user={user}
      colors={colors}
      isBangla={isBangla}
      deletePass={state.deletePass}
      setDeletePass={state.setDeletePass}
      deleteError={state.deleteError}
      setDeleteError={state.setDeleteError}
      isDeletingAccount={state.isDeletingAccount}
      onConfirmDelete={state.handleConfirmDeleteAccount}
      insetsBottom={insetsBottom}
      t={state.t}
    />

    <CertificateModal
      visible={!!state.selectedCert}
      certificate={state.selectedCert}
      onClose={() => state.setSelectedCert(null)}
    />

    {state.reviewTargetCourse && (
      <MandatoryReviewModal
        visible={state.mandatoryReviewVisible}
        courseTitle={state.reviewTargetCourse.title}
        instructorName={state.reviewTargetCourse.instructor?.name || 'Course Instructor'}
        onSubmit={async (rating, feedback) => {
          const unlockedCert = await submitMandatoryCourseReview(
            state.reviewTargetCourse!.id,
            rating,
            feedback,
            user?.displayName || user?.username || 'Executive Graduate',
            'Course Graduate'
          );
          state.setMandatoryReviewVisible(false);
          if (unlockedCert) {
            state.setSelectedCert(unlockedCert);
          }
        }}
        onDismissLater={() => state.setMandatoryReviewVisible(false)}
      />
    )}

    {__DEV__ && (
      <DeveloperOptionsModal
        visible={state.devModalVisible}
        onClose={() => state.setDevModalVisible(false)}
        onResetToStandardMode={() => {
          state.setServerEnv('production');
          state.setDevModalVisible(false);
          showToast({
            message: isBangla
              ? 'স্বাভাবিক মোড সক্রিয় হয়েছে (লাইভ সার্ভার)'
              : 'Standard Mode Restored (Live Production)',
            type: 'success',
          });
        }}
      />
    )}
  </>
);
