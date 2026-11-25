import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { useSaaS } from '../context/SaaSContext';
import { useFeedback } from '../context/FeedbackContext';
import { triggerHaptic } from '../utils/haptics';
import { MIN_TOUCH_TARGET } from '../theme/typography';
import { shape } from '../theme/shapes';
import { useResponsive } from '../theme/responsive';
import { Header } from '../components';
import {
  ProfileHeaderCard,
  ProfileCourseSummary,
  ProfilePreferencesSection,
} from '../components/profile';
import { useProfileScreenState } from './profile/useProfileScreenState';
import { ProfileHubModals } from './profile/ProfileHubModals';

interface ProfileScreenProps {
  onOpenCorporateModal: () => void;
  onOpenSubscription: () => void;
  onOpenNotifications: () => void;
  onNavigateTab: (tab: any) => void;
  onNavigateToCourse?: (courseId: string) => void;
  onNavigateToLesson?: (courseId: string, lessonId: string) => void;
  onOpenDrawer?: () => void;
  onOpenSupport?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenCorporateModal,
  onOpenSubscription,
  onOpenNotifications,
  onNavigateTab,
  onNavigateToCourse,
  onNavigateToLesson,
  onOpenDrawer,
  onOpenSupport,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { containerClampStyle } = useResponsive();
  const { language, toggleLanguage, isBangla, t } = useLanguage();
  const { badges, streakDays } = useGamification();
  const { showToast } = useFeedback();
  const {
    userProgress,
    certificates,
    pendingSyncCount,
    hasReviewedCourse,
    submitMandatoryCourseReview,
  } = useLearning();
  const {
    user,
    isAuthenticated,
    isAdmin,
    setAuthModalVisible,
    isSyncingProfile,
    refreshUserProfile,
  } = useAuth();
  const { subscriptionTier, activeWorkspace } = useSaaS();

  const [isScrolled, setIsScrolled] = useState(false);
  const state = useProfileScreenState(onNavigateTab);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 8 && !isScrolled) setIsScrolled(true);
    else if (offsetY <= 8 && isScrolled) setIsScrolled(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Executive Account"
        subtitle="SaaS Profile & Preferences"
        isScrolled={isScrolled}
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenDrawer={onOpenDrawer}
        onOpenSupport={onOpenSupport}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isSyncingProfile}
            onRefresh={async () => {
              triggerHaptic('light');
              await refreshUserProfile();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          containerClampStyle,
          { paddingBottom: Math.max(insets.bottom, 16) + 84 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <ProfileHeaderCard
          user={user}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          customName={state.customName}
          customBio={state.customBio}
          activeWorkspaceName={activeWorkspace?.name || 'Default Workspace'}
          colors={colors}
          isDark={isDark}
          isBangla={isBangla}
          onEditProfile={() => {
            triggerHaptic('light');
            state.setEditProfileModalVisible(true);
          }}
          onViewFullProfile={() => {
            triggerHaptic('light');
            state.setFullProfileModalVisible(true);
          }}
        />

        <ProfileCourseSummary
          isAuthenticated={isAuthenticated}
          isDark={isDark}
          colors={colors}
          isBangla={isBangla}
          enrolledCount={state.enrolledCount}
          completedCount={state.completedCount}
          streakDays={streakDays}
          certificates={certificates}
          badges={badges}
          displayedCourses={state.displayedCourses}
          portfolioTab={state.portfolioTab}
          setPortfolioTab={state.setPortfolioTab}
          userProgress={userProgress}
          getCourseStatus={state.getCourseStatus}
          hasReviewedCourse={hasReviewedCourse}
          lpStats={state.lpStats}
          onNavigateTab={onNavigateTab}
          onNavigateToCourse={onNavigateToCourse}
          onNavigateToLesson={onNavigateToLesson}
          onOpenAuthModal={() => setAuthModalVisible(true)}
          onSelectCertificate={(cert) => state.setSelectedCert(cert)}
          onOpenMandatoryReview={(course) => {
            state.setReviewTargetCourse(course);
            state.setMandatoryReviewVisible(true);
          }}
        />

        <ProfilePreferencesSection
          isAdmin={isAdmin}
          isBangla={isBangla}
          isDark={isDark}
          colors={colors}
          subscriptionTier={subscriptionTier}
          onOpenSubscription={onOpenSubscription}
          onOpenOrders={() => state.setPaymentHistoryModalVisible(true)}
          enrolledCount={state.enrolledCount}
          completedCount={state.completedCount}
          certificatesCount={certificates.length}
          onNavigateTab={onNavigateTab}
          badges={badges}
          onOpenFlashcards={() => state.setFlashcardsModalVisible(true)}
          onOpenOfflineDeck={() => state.setOfflineDeckModalVisible(true)}
          onOpenLocalSearch={() => state.setLocalSearchModalVisible(true)}
          language={language}
          toggleLanguage={toggleLanguage}
          toggleTheme={toggleTheme}
          videoQuality={state.videoQuality}
          cycleVideoQuality={state.cycleVideoQuality}
          onOpenUpdateModal={() => state.setUpdateModalVisible(true)}
          biometricEnabled={state.biometricEnabled}
          setBiometricEnabled={state.setBiometricEnabled}
          onChangePassword={() => state.setChangePasswordModalVisible(true)}
          onOpenNotifications={onOpenNotifications}
          onClearCache={state.handleClearCache}
          serverEnvironment={state.serverEnv}
          onSwitchServerEnvironment={state.handleSwitchServerEnvironment}
          isDevModeUnlocked={state.devModeUnlocked}
          onOpenDevOptions={() => state.setDevModalVisible(true)}
          onOpenCorporateModal={onOpenCorporateModal}
          onOpenHelpFaq={() => state.setHelpFaqModalVisible(true)}
          onOpenBlog={() => state.setBlogModalVisible(true)}
          onOpenStorage={() => state.setStorageModalVisible(true)}
          onOpenEbook={() => state.setEbookModalVisible(true)}
          onOpenServices={() => state.setServicesModalVisible(true)}
          onOpenInstructors={() => state.setInstructorsModalVisible(true)}
          pendingSyncCount={pendingSyncCount}
          onOpenAbout={(tab) => {
            state.setAboutInitialTab(tab);
            state.setAboutModalVisible(true);
          }}
          onOpenLegal={(tab) => {
            state.setLegalInitialTab(tab);
            state.setLegalModalVisible(true);
          }}
          isAuthenticated={isAuthenticated}
          onDeleteAccount={() => {
            state.setDeletePass('');
            state.setDeleteError('');
            state.setDeleteAccountModalVisible(true);
          }}
          onLogout={state.handleLogout}
          onOpenAuthModal={() => setAuthModalVisible(true)}
          showToast={showToast}
          t={t}
        />

        <View style={styles.footerContainer}>
          <Text style={[styles.footerCopyright, { color: colors.textMuted }]}>
            © 2026 Thriving <Text style={{ color: '#E34234' }}>Skills</Text> Limited (TSL). All
            Rights Reserved.
          </Text>
          <Text style={[styles.footerAddress, { color: colors.textMuted }]}>
            Gulshan-2, Dhaka • RJSC Registered • SDG-4 Quality Education
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={state.handleVersionTap}
            style={styles.versionTapBtn}
            accessibilityRole="button"
            accessibilityLabel="App Version"
          >
            <Text style={[styles.versionTapText, { color: colors.textMuted }]}>
              v1.4.0 • Thriving <Text style={{ color: '#E34234' }}>Skills</Text> App{' '}
              {state.devModeUnlocked ? '• [DEV MODE]' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ProfileHubModals
        state={state}
        colors={colors}
        isDark={isDark}
        isBangla={isBangla}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        user={user}
        activeWorkspaceName={activeWorkspace?.name || 'Default Workspace'}
        userProgress={userProgress}
        certificates={certificates}
        streakDays={streakDays}
        insetsBottom={insets.bottom}
        onNavigateTab={onNavigateTab}
        onNavigateToCourse={onNavigateToCourse}
        onNavigateToLesson={onNavigateToLesson}
        onOpenCorporateModal={onOpenCorporateModal}
        submitMandatoryCourseReview={submitMandatoryCourseReview}
        showToast={showToast}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  footerContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  footerCopyright: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  footerAddress: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 3,
  },
  versionTapBtn: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  versionTapText: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
  profileSegmentedWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 4,
  },
  profileSegmentedBtn: {
    flex: 1,
    minWidth: 0,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: shape.small,
    paddingHorizontal: 10,
  },
  profileSegmentedText: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
});
