import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutAnimation,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useSaaS } from '../context/SaaSContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { useFeedback } from '../context/FeedbackContext';
import { triggerHaptic } from '../utils/haptics';
import { MIN_TOUCH_TARGET } from '../theme/typography';
import { shape } from '../theme/shapes';
import { useResponsive } from '../theme/responsive';
import {
  Header,
  AppUpdateModal,
  AboutTSLModal,
  AboutTabKey,
  LegalPolicyModal,
  LegalTabKey,
  HelpFaqModal,
  BlogModal,
  CertificateModal,
  MandatoryReviewModal,
  AnimatedTabContent,
} from '../components';
import { StorageManagerModal } from '../components/modals/StorageManagerModal';
import { SpacedRepetitionModal } from '../components/modals/SpacedRepetitionModal';
import { OfflineStudyDeckModal } from '../components/modals/OfflineStudyDeckModal';
import { LocalSearchModal } from '../components/modals/LocalSearchModal';
import { Course, Certificate, LearnPressCourseFilter } from '../types';
import { UserService } from '../services/api/userService';
import { CacheManager } from '../services/cache/cacheManager';
import {
  ProfileHeaderCard,
  ProfileLearningPortfolio,
  ProfilePreferencesSection,
  ProfileSettingsModal,
  ProfileDeleteAccountModal,
  ProfileChangePasswordModal,
  ProfileOrdersModal,
} from '../components/profile';

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
  const { isTablet, containerClampStyle } = useResponsive();
  const { language, toggleLanguage, isBangla, t } = useLanguage();
  const { badges, streakDays } = useGamification();
  const { showToast } = useFeedback();
  const {
    courses,
    userProgress,
    certificates,
    pendingSyncCount,
    hasReviewedCourse,
    submitMandatoryCourseReview,
  } = useLearning();
  const {
    user,
    isAuthenticated,
    logout,
    deleteAccount,
    setAuthModalVisible,
    updateUserProfile,
    isSyncingProfile,
    refreshUserProfile,
  } = useAuth();
  const isAdmin = Array.isArray(user?.roles) && user.roles.includes('administrator');
  const {
    subscriptionTier,
    activeWorkspace,
  } = useSaaS();

  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 8 && !isScrolled) {
      setIsScrolled(true);
    } else if (offsetY <= 8 && isScrolled) {
      setIsScrolled(false);
    }
  };

  const [profileSection, setProfileSection] = useState<'learning' | 'settings'>('learning');
  const [portfolioTab, setPortfolioTab] = useState<LearnPressCourseFilter>('all');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [mandatoryReviewVisible, setMandatoryReviewVisible] = useState(false);
  const [reviewTargetCourse, setReviewTargetCourse] = useState<Course | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<AboutTabKey>('overview');
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('terms');
  const [helpFaqModalVisible, setHelpFaqModalVisible] = useState(false);
  const [blogModalVisible, setBlogModalVisible] = useState(false);
  const [storageModalVisible, setStorageModalVisible] = useState(false);
  const [flashcardsModalVisible, setFlashcardsModalVisible] = useState(false);
  const [offlineDeckModalVisible, setOfflineDeckModalVisible] = useState(false);
  const [localSearchModalVisible, setLocalSearchModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [paymentHistoryModalVisible, setPaymentHistoryModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deletePass, setDeletePass] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // General Settings Form (Matching thrivingskill.com live schema)
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || user?.username || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [bioInfo, setBioInfo] = useState(user?.description || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(user?.cover_photo || '');
  const [socialFacebook, setSocialFacebook] = useState(user?.social?.facebook || '');
  const [socialTwitter, setSocialTwitter] = useState(user?.social?.twitter || '');
  const [socialYoutube, setSocialYoutube] = useState(user?.social?.youtube || '');
  const [socialLinkedin, setSocialLinkedin] = useState(user?.social?.linkedin || '');
  const [privacyPublic, setPrivacyPublic] = useState(true);
  const [privacyCourses, setPrivacyCourses] = useState(true);
  const [privacyCertificates, setPrivacyCertificates] = useState(true);

  // Backward compatibility state
  const [customName, setCustomName] = useState(user?.name || user?.displayName || user?.username || '');
  const [customBio, setCustomBio] = useState(user?.description || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  React.useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setDisplayName(user.displayName || user.name || user.username || '');
      setUserEmail(user.email || '');
      setBioInfo(user.description || '');
      setPhoneNumber(user.phone || '');
      setCity(user.city || '');
      setAvatarUrl(user.avatar || '');
      setCoverPhotoUrl(user.cover_photo || '');
      setSocialFacebook(user.social?.facebook || '');
      setSocialTwitter(user.social?.twitter || '');
      setSocialYoutube(user.social?.youtube || '');
      setSocialLinkedin(user.social?.linkedin || '');

      setCustomName(user.name || user.displayName || user.username || '');
      setCustomBio(user.description || '');
    }
  }, [user]);

  // Change Password Form
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Video Streaming Preference
  const [videoQuality, setVideoQuality] = useState<'Auto' | '1080p' | '720p' | '480p'>('Auto');

  const cycleVideoQuality = () => {
    const qualities: ('Auto' | '1080p' | '720p' | '480p')[] = ['Auto', '1080p', '720p', '480p'];
    const nextIdx = (qualities.indexOf(videoQuality) + 1) % qualities.length;
    setVideoQuality(qualities[nextIdx]);
    showToast({
      message: `Streaming resolution set to ${qualities[nextIdx]}`,
      type: 'info',
    });
  };

  const handleClearCache = async () => {
    await CacheManager.clearAll();
    showToast({
      message: isBangla ? 'অ্যাপ ক্যাশ ক্লিয়ার হয়েছে' : 'App cache cleared successfully',
      type: 'success',
    });
  };

  const handleSaveProfile = async () => {
    if (!isAuthenticated) {
      setEditProfileModalVisible(false);
      setAuthModalVisible(true);
      return;
    }

    if (!displayName.trim()) {
      Alert.alert(
        isBangla ? 'প্রয়োজনীয় তথ্য' : 'Required Field',
        isBangla ? 'ডিসপ্লে নেম দেওয়া বাধ্যতামূলক।' : 'Display name is required.'
      );
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = await UserService.updateProfile({
        name: displayName.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: displayName.trim(),
        description: bioInfo.trim(),
        phone: phoneNumber.trim(),
        city: city.trim(),
        avatar: avatarUrl.trim(),
        cover_photo: coverPhotoUrl.trim(),
        social: {
          facebook: socialFacebook.trim(),
          twitter: socialTwitter.trim(),
          youtube: socialYoutube.trim(),
          linkedin: socialLinkedin.trim(),
        },
      });

      await updateUserProfile({
        ...updatedUser,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: displayName.trim(),
        displayName: displayName.trim(),
        description: bioInfo.trim(),
        phone: phoneNumber.trim(),
        city: city.trim(),
        avatar: avatarUrl.trim() || updatedUser.avatar,
        cover_photo: coverPhotoUrl.trim() || updatedUser.cover_photo,
        social: {
          facebook: socialFacebook.trim(),
          twitter: socialTwitter.trim(),
          youtube: socialYoutube.trim(),
          linkedin: socialLinkedin.trim(),
        },
      });

      setEditProfileModalVisible(false);
      showToast({
        message: isBangla ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে' : 'Profile updated successfully',
        type: 'success',
      });
    } catch (err: any) {
      // Fallback local update
      try {
        await updateUserProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: displayName.trim(),
          displayName: displayName.trim(),
          description: bioInfo.trim(),
          phone: phoneNumber.trim(),
          city: city.trim(),
          avatar: avatarUrl.trim(),
          cover_photo: coverPhotoUrl.trim(),
          social: {
            facebook: socialFacebook.trim(),
            twitter: socialTwitter.trim(),
            youtube: socialYoutube.trim(),
            linkedin: socialLinkedin.trim(),
          },
        });
        setEditProfileModalVisible(false);
        showToast({
          message: isBangla
            ? 'আপনার প্রোফাইল তথ্য লোকালি সংরক্ষিত হয়েছে (সার্ভারে সিঙ্ক পেন্ডিং)।'
            : 'Your personal executive details have been saved locally (server sync pending).',
          type: 'info',
        });
      } catch {
        Alert.alert(
          isBangla ? 'ত্রুটি' : 'Error',
          err?.message || (isBangla ? 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save profile. Please try again.')
        );
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert(
        isBangla ? 'অসম্পূর্ণ ফর্ম' : 'Incomplete Form',
        isBangla ? 'অনুগ্রহ করে সকল পাসওয়ার্ড ঘর পূরণ করুন।' : 'Please fill in all password fields.'
      );
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert(
        isBangla ? 'পাসওয়ার্ড মেলেনি' : 'Mismatch',
        isBangla ? 'নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।' : 'New password and confirm password do not match.'
      );
      return;
    }
    if (newPass.length < 12) {
      Alert.alert(
        isBangla ? 'নিরাপত্তা বার্তা' : 'Security Notice',
        isBangla
          ? 'ওয়েবসাইটের নির্দেশিকা অনুসারে পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।'
          : 'The password should be at least twelve characters long as required by the website.'
      );
      return;
    }

    if (!isAuthenticated) {
      setChangePasswordModalVisible(false);
      setAuthModalVisible(true);
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await UserService.changePassword({
        old_password: currentPass,
        new_password: newPass,
        confirm_password: confirmPass,
      });

      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setChangePasswordModalVisible(false);
      Alert.alert(
        isBangla ? 'পাসওয়ার্ড পরিবর্তিত হয়েছে! 🔒' : 'Password Changed! 🔒',
        res.message || (isBangla ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।' : 'Your account credentials have been updated successfully.')
      );
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.includes('current password is incorrect') ||
        err?.code === 'rest_user_incorrect_password' ||
        err?.data?.code === 'rest_user_incorrect_password'
      ) {
        Alert.alert(
          isBangla ? 'ভুল বর্তমান পাসওয়ার্ড' : 'Incorrect Current Password',
          isBangla
            ? 'আপনার বর্তমান পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় চেক করুন।'
            : 'Your current password is incorrect. Please check and try again.'
        );
      } else {
        Alert.alert(
          isBangla ? 'ত্রুটি' : 'Error',
          msg || (isBangla ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' : 'Failed to change password. Please try again.')
        );
      }
    } finally {
      setIsChangingPass(false);
    }
  };

  const getCourseStatus = useCallback((courseId: string): 'in-progress' | 'finished' | 'passed' | 'failed' => {
    const prog = userProgress[courseId];
    if (!prog) return 'in-progress';
    if (prog.status === 'failed' || prog.grade === 'failed') return 'failed';
    if (prog.status === 'passed' || prog.grade === 'passed' || prog.isCompleted) return 'passed';
    if (prog.status === 'finished') return 'finished';
    return 'in-progress';
  }, [userProgress]);

  const enrolledOrderCourses = useMemo(() => Object.keys(userProgress)
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is Course => Boolean(c)), [userProgress, courses]);

  const inProgressCourses = useMemo(() => enrolledOrderCourses.filter((c) => getCourseStatus(c.id) === 'in-progress'), [enrolledOrderCourses, getCourseStatus]);
  const finishedCourses = useMemo(() => enrolledOrderCourses.filter((c) => {
    const st = getCourseStatus(c.id);
    return st === 'finished' || st === 'passed' || st === 'failed';
  }), [enrolledOrderCourses, getCourseStatus]);
  const passedCourses = useMemo(() => enrolledOrderCourses.filter((c) => getCourseStatus(c.id) === 'passed'), [enrolledOrderCourses, getCourseStatus]);
  const failedCourses = useMemo(() => enrolledOrderCourses.filter((c) => getCourseStatus(c.id) === 'failed'), [enrolledOrderCourses, getCourseStatus]);

  const lpStats = useMemo(() => ({
    enrolledCount: enrolledOrderCourses.length,
    inProgressCount: inProgressCourses.length,
    finishedCount: finishedCourses.length,
    passedCount: passedCourses.length,
    failedCount: failedCourses.length,
  }), [enrolledOrderCourses.length, inProgressCourses.length, finishedCourses.length, passedCourses.length, failedCourses.length]);

  const enrolledCount = enrolledOrderCourses.length;
  const completedCount = finishedCourses.length;
  const totalCompletedLessons = useMemo(() => Object.values(userProgress).reduce(
    (acc, p) => acc + p.completedLessonIds.length,
    0
  ), [userProgress]);
  const totalHoursLearned = useMemo(() => (totalCompletedLessons * 0.35).toFixed(1), [totalCompletedLessons]);
  const completionRate = useMemo(() => enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0, [enrolledCount, completedCount]);

  const displayedCourses = useMemo(() => {
    if (portfolioTab === 'in-progress') return inProgressCourses;
    if (portfolioTab === 'finished') return finishedCourses;
    if (portfolioTab === 'passed') return passedCourses;
    if (portfolioTab === 'failed') return failedCourses;
    return enrolledOrderCourses;
  }, [portfolioTab, inProgressCourses, finishedCourses, passedCourses, failedCourses, enrolledOrderCourses]);

  const handleConfirmDeleteAccount = async () => {
    if (!deletePass.trim()) {
      setDeleteError(
        isBangla ? 'স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলতে আপনার পাসওয়ার্ড দিন।' : 'Please enter your current password to confirm deletion.'
      );
      return;
    }

    setDeleteError('');
    setIsDeletingAccount(true);
    try {
      await deleteAccount(deletePass);
      setDeleteAccountModalVisible(false);
      setDeletePass('');
      Alert.alert(
        isBangla ? 'অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে' : 'Account Permanently Deleted',
        isBangla
          ? 'আপনার ওয়ার্ডপ্রেস/লার্নপ্রেস অ্যাকাউন্ট এবং সংশ্লিষ্ট ডেটা সার্ভার থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।'
          : 'Your account and associated learning records have been permanently deleted from our servers.'
      );
    } catch (err: any) {
      setDeleteError(
        err?.message ||
          (isBangla
            ? 'অ্যাকাউন্ট মুছে ফেলা যায়নি। অনুগ্রহ করে পাসওয়ার্ড যাচাই করুন অথবা ওয়েব ফর্ম ব্যবহার করুন।'
            : 'Unable to delete account. Please verify your password or submit via the web form.')
      );
    } finally {
      setIsDeletingAccount(false);
    }
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
        {/* Profile Hero Header Card */}
        <ProfileHeaderCard
          user={user}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          customName={customName}
          customBio={customBio}
          activeWorkspaceName={activeWorkspace?.name || 'Default Workspace'}
          colors={colors}
          isBangla={isBangla}
          onEditProfile={() => {
            triggerHaptic('light');
            setEditProfileModalVisible(true);
          }}
        />

        {/* Tab Switcher: Portfolio vs Settings */}
        <View
          style={[
            styles.profileSegmentedWrap,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.profileSegmentedBtn,
              profileSection === 'learning' && {
                backgroundColor: colors.surfaceCard,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
              },
            ]}
            onPress={() => {
              triggerHaptic('selection');
              if (Platform.OS === 'ios') {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              }
              setProfileSection('learning');
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: profileSection === 'learning' }}
          >
            <Ionicons
              name={profileSection === 'learning' ? 'school' : 'school-outline'}
              size={16}
              color={profileSection === 'learning' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.profileSegmentedText,
                { color: profileSection === 'learning' ? colors.text : colors.textMuted },
              ]}
            >
              {isBangla ? 'লার্নিং পোর্টফোলিও' : 'Learning Portfolio'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.profileSegmentedBtn,
              profileSection === 'settings' && {
                backgroundColor: colors.surfaceCard,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
              },
            ]}
            onPress={() => {
              triggerHaptic('selection');
              if (Platform.OS === 'ios') {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              }
              setProfileSection('settings');
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: profileSection === 'settings' }}
          >
            <Ionicons
              name={profileSection === 'settings' ? 'settings' : 'settings-outline'}
              size={16}
              color={profileSection === 'settings' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.profileSegmentedText,
                { color: profileSection === 'settings' ? colors.text : colors.textMuted },
              ]}
            >
              {isBangla ? 'প্রেফারেন্সেস ও সেটিংস' : 'Preferences & Settings'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Learning Portfolio */}
        {profileSection === 'learning' && (
          <AnimatedTabContent tabKey="profile-learning">
            <ProfileLearningPortfolio
              isAuthenticated={isAuthenticated}
              isDark={isDark}
              colors={colors}
              isBangla={isBangla}
              enrolledCount={enrolledCount}
              inProgressCourses={inProgressCourses}
              completedCount={completedCount}
              totalHoursLearned={totalHoursLearned}
              completionRate={completionRate}
              streakDays={streakDays}
              portfolioTab={portfolioTab}
              setPortfolioTab={setPortfolioTab}
              certificates={certificates}
              displayedCourses={displayedCourses}
              userProgress={userProgress}
              getCourseStatus={getCourseStatus}
              hasReviewedCourse={hasReviewedCourse}
              lpStats={lpStats}
              onNavigateTab={onNavigateTab}
              onNavigateToCourse={onNavigateToCourse}
              onNavigateToLesson={onNavigateToLesson}
              onOpenAuthModal={() => setAuthModalVisible(true)}
              onSelectCertificate={(cert) => setSelectedCert(cert)}
              onOpenMandatoryReview={(course) => {
                setReviewTargetCourse(course);
                setMandatoryReviewVisible(true);
              }}
              user={user}
            />
          </AnimatedTabContent>
        )}

        {/* Tab 2: Preferences & Settings */}
        {profileSection === 'settings' && (
          <AnimatedTabContent tabKey="profile-settings">
            <ProfilePreferencesSection
              isAdmin={isAdmin}
              isBangla={isBangla}
              isDark={isDark}
              colors={colors}
              subscriptionTier={subscriptionTier}
              onOpenSubscription={onOpenSubscription}
              onOpenOrders={() => setPaymentHistoryModalVisible(true)}
              enrolledCount={enrolledCount}
              completedCount={completedCount}
              certificatesCount={certificates.length}
              onNavigateTab={onNavigateTab}
              badges={badges}
              onOpenFlashcards={() => setFlashcardsModalVisible(true)}
              onOpenOfflineDeck={() => setOfflineDeckModalVisible(true)}
              onOpenLocalSearch={() => setLocalSearchModalVisible(true)}
              language={language}
              toggleLanguage={toggleLanguage}
              toggleTheme={toggleTheme}
              videoQuality={videoQuality}
              cycleVideoQuality={cycleVideoQuality}
              onOpenUpdateModal={() => setUpdateModalVisible(true)}
              biometricEnabled={biometricEnabled}
              setBiometricEnabled={setBiometricEnabled}
              onChangePassword={() => setChangePasswordModalVisible(true)}
              onOpenNotifications={onOpenNotifications}
              onClearCache={handleClearCache}
              onOpenCorporateModal={onOpenCorporateModal}
              onOpenHelpFaq={() => setHelpFaqModalVisible(true)}
              onOpenBlog={() => setBlogModalVisible(true)}
              onOpenStorage={() => setStorageModalVisible(true)}
              pendingSyncCount={pendingSyncCount}
              onOpenAbout={(tab) => {
                setAboutInitialTab(tab);
                setAboutModalVisible(true);
              }}
              onOpenLegal={(tab) => {
                setLegalInitialTab(tab);
                setLegalModalVisible(true);
              }}
              isAuthenticated={isAuthenticated}
              onDeleteAccount={() => {
                setDeletePass('');
                setDeleteError('');
                setDeleteAccountModalVisible(true);
              }}
              onLogout={logout}
              onOpenAuthModal={() => setAuthModalVisible(true)}
              showToast={showToast}
              t={t}
            />
          </AnimatedTabContent>
        )}

        {/* All Rights Reserved Enterprise Footer */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 12, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textAlign: 'center' }}>
            © 2026 Thriving Skills Limited (TSL). All Rights Reserved.
          </Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 3 }}>
            Gulshan-2, Dhaka • RJSC Registered • SDG-4 Quality Education
          </Text>
        </View>
      </ScrollView>

      {/* About TSL Modal */}
      <AboutTSLModal
        visible={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
        initialTab={aboutInitialTab}
        onNavigateTab={onNavigateTab}
      />

      {/* Legal & Policy Modal */}
      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialTab={legalInitialTab}
      />

      {/* In-App OTA Update Modal */}
      <AppUpdateModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
      />

      {/* Help & FAQ Center Modal */}
      <HelpFaqModal
        visible={helpFaqModalVisible}
        onClose={() => setHelpFaqModalVisible(false)}
      />

      {/* Blog & Articles Reader Modal */}
      <BlogModal
        visible={blogModalVisible}
        onClose={() => setBlogModalVisible(false)}
      />

      {/* Local Storage & Offline Sync Modal */}
      <StorageManagerModal
        visible={storageModalVisible}
        onClose={() => setStorageModalVisible(false)}
      />

      {/* Active Recall Spaced Repetition Modal */}
      <SpacedRepetitionModal
        visible={flashcardsModalVisible}
        onClose={() => setFlashcardsModalVisible(false)}
      />

      {/* Offline Study Deck Modal */}
      <OfflineStudyDeckModal
        visible={offlineDeckModalVisible}
        onClose={() => setOfflineDeckModalVisible(false)}
        onOpenLessonInPlayer={onNavigateToLesson}
      />

      {/* On-Device Local Search Modal */}
      <LocalSearchModal
        visible={localSearchModalVisible}
        onClose={() => setLocalSearchModalVisible(false)}
        onSelectCourse={onNavigateToCourse}
        onSelectLesson={onNavigateToLesson}
      />

      {/* Official Profile Settings Modal (5 tabs) */}
      <ProfileSettingsModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        user={user}
        colors={colors}
        isDark={isDark}
        isBangla={isBangla}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        displayName={displayName}
        setDisplayName={setDisplayName}
        userEmail={userEmail}
        bioInfo={bioInfo}
        setBioInfo={setBioInfo}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        city={city}
        setCity={setCity}
        avatarUrl={avatarUrl}
        setAvatarUrl={setAvatarUrl}
        coverPhotoUrl={coverPhotoUrl}
        setCoverPhotoUrl={setCoverPhotoUrl}
        socialFacebook={socialFacebook}
        setSocialFacebook={setSocialFacebook}
        socialTwitter={socialTwitter}
        setSocialTwitter={setSocialTwitter}
        socialYoutube={socialYoutube}
        setSocialYoutube={setSocialYoutube}
        socialLinkedin={socialLinkedin}
        setSocialLinkedin={setSocialLinkedin}
        handleSaveProfile={handleSaveProfile}
        isSavingProfile={isSavingProfile}
        currentPass={currentPass}
        setCurrentPass={setCurrentPass}
        newPass={newPass}
        setNewPass={setNewPass}
        confirmPass={confirmPass}
        setConfirmPass={setConfirmPass}
        showCurrentPass={showCurrentPass}
        setShowCurrentPass={setShowCurrentPass}
        showNewPass={showNewPass}
        setShowNewPass={setShowNewPass}
        showConfirmPass={showConfirmPass}
        setShowConfirmPass={setShowConfirmPass}
        handleChangePassword={handleChangePassword}
        isChangingPass={isChangingPass}
        privacyPublic={privacyPublic}
        setPrivacyPublic={setPrivacyPublic}
        privacyCourses={privacyCourses}
        setPrivacyCourses={setPrivacyCourses}
        privacyCertificates={privacyCertificates}
        setPrivacyCertificates={setPrivacyCertificates}
      />

      {/* Standalone Change Password Modal */}
      <ProfileChangePasswordModal
        visible={changePasswordModalVisible}
        onClose={() => setChangePasswordModalVisible(false)}
        colors={colors}
        isBangla={isBangla}
        currentPass={currentPass}
        setCurrentPass={setCurrentPass}
        newPass={newPass}
        setNewPass={setNewPass}
        confirmPass={confirmPass}
        setConfirmPass={setConfirmPass}
        showCurrentPass={showCurrentPass}
        setShowCurrentPass={setShowCurrentPass}
        showNewPass={showNewPass}
        setShowNewPass={setShowNewPass}
        showConfirmPass={showConfirmPass}
        setShowConfirmPass={setShowConfirmPass}
        handleChangePassword={handleChangePassword}
        isChangingPass={isChangingPass}
      />

      {/* Orders and Course Records Modal */}
      <ProfileOrdersModal
        visible={paymentHistoryModalVisible}
        onClose={() => setPaymentHistoryModalVisible(false)}
        colors={colors}
        isBangla={isBangla}
        enrolledOrderCourses={enrolledOrderCourses}
        userProgress={userProgress}
        insetsBottom={insets.bottom}
      />

      {/* Permanent Account Deletion Modal */}
      <ProfileDeleteAccountModal
        visible={deleteAccountModalVisible}
        onClose={() => setDeleteAccountModalVisible(false)}
        user={user}
        colors={colors}
        isBangla={isBangla}
        deletePass={deletePass}
        setDeletePass={setDeletePass}
        deleteError={deleteError}
        setDeleteError={setDeleteError}
        isDeletingAccount={isDeletingAccount}
        onConfirmDelete={handleConfirmDeleteAccount}
        insetsBottom={insets.bottom}
        t={t}
      />

      {/* Certificate Modal (CR-05) */}
      <CertificateModal
        visible={!!selectedCert}
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />

      {/* Mandatory Course Review Modal before Certificate Unlock (CR-02) */}
      {reviewTargetCourse && (
        <MandatoryReviewModal
          visible={mandatoryReviewVisible}
          courseTitle={reviewTargetCourse.title}
          instructorName={reviewTargetCourse.instructor?.name || 'Course Instructor'}
          onSubmit={(rating, feedback) => {
            const unlockedCert = submitMandatoryCourseReview(
              reviewTargetCourse.id,
              rating,
              feedback,
              user?.displayName || user?.username || 'Executive Graduate',
              'Course Graduate'
            );
            setMandatoryReviewVisible(false);
            if (unlockedCert) {
              setSelectedCert(unlockedCert);
            }
          }}
          onDismissLater={() => setMandatoryReviewVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  },
});
