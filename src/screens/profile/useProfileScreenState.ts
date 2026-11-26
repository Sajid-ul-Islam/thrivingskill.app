import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useGamification } from '../../context/GamificationContext';
import { useLearning } from '../../context/LearningContext';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { triggerHaptic } from '../../utils/haptics';
import { Course, Certificate, LearnPressCourseFilter } from '../../types';
import { UserService } from '../../services/api/userService';
import { CacheManager } from '../../services/cache/cacheManager';
import { CoursesService } from '../../services/api/coursesService';
import { Env, ApiEnvironment } from '../../config/env';
import type { AboutTabKey, LegalTabKey } from '../../components';

export function useProfileScreenState(onNavigateTab: (tab: any) => void) {
  const { isBangla, t } = useLanguage();
  const { totalStudyMinutes } = useGamification();
  const { showToast, showSnackbar, showPopup } = useFeedback();
  const { courses, userProgress } = useLearning();
  const { user, isAuthenticated, logout, deleteAccount, setAuthModalVisible, updateUserProfile } =
    useAuth();

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
  const [ebookModalVisible, setEbookModalVisible] = useState(false);
  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [instructorsModalVisible, setInstructorsModalVisible] = useState(false);
  const [storageModalVisible, setStorageModalVisible] = useState(false);
  const [flashcardsModalVisible, setFlashcardsModalVisible] = useState(false);
  const [offlineDeckModalVisible, setOfflineDeckModalVisible] = useState(false);
  const [localSearchModalVisible, setLocalSearchModalVisible] = useState(false);
  const [fullProfileModalVisible, setFullProfileModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [paymentHistoryModalVisible, setPaymentHistoryModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deletePass, setDeletePass] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [displayName, setDisplayName] = useState(
    user?.displayName || user?.name || user?.username || ''
  );
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
  const [customName, setCustomName] = useState(
    user?.name || user?.displayName || user?.username || ''
  );
  const [customBio, setCustomBio] = useState(user?.description || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [serverEnv, setServerEnv] = useState<ApiEnvironment>(Env.currentEnvironment);
  const [devModalVisible, setDevModalVisible] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'Auto' | '1080p' | '720p' | '480p'>('Auto');

  useEffect(() => {
    return Env.subscribeEnvironment((newEnv) => setServerEnv(newEnv));
  }, []);

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  const handleVersionTap = () => {
    if (!__DEV__) return;
    triggerHaptic('light');
    setDevModalVisible(true);
  };

  const cycleVideoQuality = () => {
    const qualities: ('Auto' | '1080p' | '720p' | '480p')[] = ['Auto', '1080p', '720p', '480p'];
    const nextIdx = (qualities.indexOf(videoQuality) + 1) % qualities.length;
    setVideoQuality(qualities[nextIdx]);
    showToast({ message: `Streaming resolution set to ${qualities[nextIdx]}`, type: 'info' });
  };

  const handleClearCache = async () => {
    showPopup({
      title: isBangla ? 'ক্যাশ মেমোরি খালি করবেন?' : 'Clear App Cache?',
      message: isBangla
        ? 'সাময়িক ক্যাশ ডেটা মুছে যাবে, তবে আপনার কোর্স অগ্রগতি সুরক্ষিত থাকবে।'
        : 'Temporary cache will be cleared. Your course enrollments and progress remain completely safe.',
      primaryLabel: isBangla ? 'ক্যাশ মুছুন' : 'Clear Cache',
      secondaryLabel: isBangla ? 'বাতিল' : 'Cancel',
      isDestructive: true,
      icon: 'trash-outline',
      onConfirm: async () => {
        await CacheManager.clearAll();
        showSnackbar({
          message: isBangla ? 'অ্যাপ ক্যাশ সফলভাবে ক্লিয়ার হয়েছে' : 'App cache cleared successfully',
          actionLabel: isBangla ? 'ঠিক আছে' : 'Dismiss',
          onAction: () => {},
          type: 'success',
        });
      },
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast({
        message: isBangla ? 'সফলভাবে সাইন আউট করা হয়েছে' : 'Signed out successfully',
        type: 'info',
      });
      onNavigateTab('Home');
    } catch (e) {
      console.warn('[ProfileScreen] Logout error:', e);
    }
  };

  const handleSwitchServerEnvironment = () => {
    if (!Env.canSwitchEnvironment) return;
    const isProd = serverEnv === 'production';
    const targetEnv: ApiEnvironment = isProd ? 'staging' : 'production';
    const targetLabel =
      targetEnv === 'production'
        ? 'Live Production (thrivingskill.com)'
        : 'Staging Server (staging.thrivingskill.com)';
    const targetLabelBn =
      targetEnv === 'production'
        ? 'লাইভ প্রোডাকশন (thrivingskill.com)'
        : 'স্টেজিং সার্ভার (staging.thrivingskill.com)';

    showPopup({
      title: isBangla ? 'সার্ভার পরিবর্তন করবেন?' : 'Switch Server Environment?',
      message: isBangla
        ? `আপনি কি ${targetLabelBn}-এ পরিবর্তন করতে চান? ক্যাশ মেমোরি স্বয়ংক্রিয়ভাবে রিফ্রেশ হবে এবং নতুন সার্ভার থেকে কোর্স ডেটা লোড হবে।`
        : `Do you want to switch to ${targetLabel}? Local cache will be refreshed and content reloaded from the selected server.`,
      primaryLabel: isBangla ? 'পরিবর্তন করুন' : 'Switch Server',
      secondaryLabel: isBangla ? 'বাতিল' : 'Cancel',
      icon: 'server-outline',
      onConfirm: async () => {
        await Env.setEnvironment(targetEnv);
        setServerEnv(targetEnv);
        await CacheManager.clearAll();
        CoursesService.notifyCatalogUpdated();
        if (isAuthenticated) {
          await logout();
          showToast({
            message: isBangla
              ? 'সার্ভার পরিবর্তিত হয়েছে। নতুন সার্ভারে সাইন ইন করুন।'
              : 'Server switched. Please sign in with your account on the new server.',
            type: 'info',
          });
        } else {
          showToast({
            message: isBangla
              ? `সার্ভার সফলভাবে পরিবর্তিত হয়েছে: ${targetEnv === 'production' ? 'লাইভ' : 'স্টেজিং'}`
              : `Connected to ${targetEnv === 'production' ? 'Live Production' : 'Staging Server'}`,
            type: 'success',
          });
        }
      },
    });
  };

  const handleSaveProfile = async () => {
    if (!isAuthenticated) {
      setEditProfileModalVisible(false);
      setAuthModalVisible(true);
      return;
    }
    if (!displayName.trim()) {
      showToast({
        title: isBangla ? 'প্রয়োজনীয় তথ্য' : 'Required Field',
        message: isBangla ? 'ডিসপ্লে নেম দেওয়া বাধ্যতামূলক।' : 'Display name is required.',
        type: 'warning',
        position: 'top',
      });
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
      await updateUserProfile(
        {
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
        },
        false
      );
      setEditProfileModalVisible(false);
      showToast({
        message: isBangla ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে' : 'Profile updated successfully',
        type: 'success',
      });
    } catch (err: any) {
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
          err?.message ||
            (isBangla ? 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save profile. Please try again.')
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
        isBangla
          ? 'নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।'
          : 'New password and confirm password do not match.'
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
        res.message ||
          (isBangla
            ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।'
            : 'Your account credentials have been updated successfully.')
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
          msg ||
            (isBangla
              ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।'
              : 'Failed to change password. Please try again.')
        );
      }
    } finally {
      setIsChangingPass(false);
    }
  };

  const getCourseStatus = useCallback(
    (courseId: string): 'in-progress' | 'finished' | 'passed' | 'failed' => {
      const prog = userProgress[courseId];
      if (!prog) return 'in-progress';
      if (prog.status === 'failed' || prog.grade === 'failed') return 'failed';
      if (prog.status === 'passed' || prog.grade === 'passed' || prog.isCompleted) return 'passed';
      if (prog.status === 'finished') return 'finished';
      return 'in-progress';
    },
    [userProgress]
  );

  const enrolledOrderCourses = useMemo(
    () =>
      Object.keys(userProgress)
        .map((id) => courses.find((c) => c.id === id))
        .filter((c): c is Course => Boolean(c)),
    [userProgress, courses]
  );
  const inProgressCourses = useMemo(
    () => enrolledOrderCourses.filter((c) => getCourseStatus(c.id) === 'in-progress'),
    [enrolledOrderCourses, getCourseStatus]
  );
  const finishedCourses = useMemo(
    () =>
      enrolledOrderCourses.filter((c) => {
        const st = getCourseStatus(c.id);
        return st === 'finished' || st === 'passed' || st === 'failed';
      }),
    [enrolledOrderCourses, getCourseStatus]
  );
  const passedCourses = useMemo(
    () => enrolledOrderCourses.filter((c) => getCourseStatus(c.id) === 'passed'),
    [enrolledOrderCourses, getCourseStatus]
  );
  const failedCourses = useMemo(
    () => enrolledOrderCourses.filter((c) => getCourseStatus(c.id) === 'failed'),
    [enrolledOrderCourses, getCourseStatus]
  );

  const lpStats = useMemo(
    () => ({
      enrolledCount: enrolledOrderCourses.length,
      inProgressCount: inProgressCourses.length,
      finishedCount: finishedCourses.length,
      passedCount: passedCourses.length,
      failedCount: failedCourses.length,
    }),
    [
      enrolledOrderCourses.length,
      inProgressCourses.length,
      finishedCourses.length,
      passedCourses.length,
      failedCourses.length,
    ]
  );

  const enrolledCount = enrolledOrderCourses.length;
  const completedCount = finishedCourses.length;
  const totalCompletedLessons = useMemo(
    () => Object.values(userProgress).reduce((acc, p) => acc + p.completedLessonIds.length, 0),
    [userProgress]
  );
  const totalWatchedSeconds = useMemo(
    () =>
      Object.values(userProgress).reduce((total, prog) => {
        const positions = Object.values(prog.lastWatchPositionSeconds || {});
        return total + positions.reduce((sum, s) => sum + (typeof s === 'number' ? s : 0), 0);
      }, 0),
    [userProgress]
  );
  const totalHoursLearned = useMemo(() => {
    const maxHours = Math.max(
      totalWatchedSeconds / 3600,
      (totalStudyMinutes || 0) / 60,
      totalCompletedLessons * 0.35
    );
    return maxHours.toFixed(1);
  }, [totalWatchedSeconds, totalStudyMinutes, totalCompletedLessons]);

  const displayedCourses = useMemo(() => {
    if (portfolioTab === 'in-progress') return inProgressCourses;
    if (portfolioTab === 'finished') return finishedCourses;
    if (portfolioTab === 'passed') return passedCourses;
    if (portfolioTab === 'failed') return failedCourses;
    return enrolledOrderCourses;
  }, [
    portfolioTab,
    inProgressCourses,
    finishedCourses,
    passedCourses,
    failedCourses,
    enrolledOrderCourses,
  ]);

  const handleConfirmDeleteAccount = async () => {
    if (!deletePass.trim()) {
      setDeleteError(
        isBangla
          ? 'স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলতে আপনার পাসওয়ার্ড দিন।'
          : 'Please enter your current password to confirm deletion.'
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

  return {
    portfolioTab,
    setPortfolioTab,
    selectedCert,
    setSelectedCert,
    mandatoryReviewVisible,
    setMandatoryReviewVisible,
    reviewTargetCourse,
    setReviewTargetCourse,
    updateModalVisible,
    setUpdateModalVisible,
    aboutModalVisible,
    setAboutModalVisible,
    aboutInitialTab,
    setAboutInitialTab,
    legalModalVisible,
    setLegalModalVisible,
    legalInitialTab,
    setLegalInitialTab,
    helpFaqModalVisible,
    setHelpFaqModalVisible,
    blogModalVisible,
    setBlogModalVisible,
    ebookModalVisible,
    setEbookModalVisible,
    servicesModalVisible,
    setServicesModalVisible,
    instructorsModalVisible,
    setInstructorsModalVisible,
    storageModalVisible,
    setStorageModalVisible,
    flashcardsModalVisible,
    setFlashcardsModalVisible,
    offlineDeckModalVisible,
    setOfflineDeckModalVisible,
    localSearchModalVisible,
    setLocalSearchModalVisible,
    fullProfileModalVisible,
    setFullProfileModalVisible,
    editProfileModalVisible,
    setEditProfileModalVisible,
    changePasswordModalVisible,
    setChangePasswordModalVisible,
    paymentHistoryModalVisible,
    setPaymentHistoryModalVisible,
    deleteAccountModalVisible,
    setDeleteAccountModalVisible,
    deletePass,
    setDeletePass,
    deleteError,
    setDeleteError,
    isDeletingAccount,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    displayName,
    setDisplayName,
    userEmail,
    bioInfo,
    setBioInfo,
    phoneNumber,
    setPhoneNumber,
    city,
    setCity,
    avatarUrl,
    setAvatarUrl,
    coverPhotoUrl,
    setCoverPhotoUrl,
    socialFacebook,
    setSocialFacebook,
    socialTwitter,
    setSocialTwitter,
    socialYoutube,
    setSocialYoutube,
    socialLinkedin,
    setSocialLinkedin,
    privacyPublic,
    setPrivacyPublic,
    privacyCourses,
    setPrivacyCourses,
    privacyCertificates,
    setPrivacyCertificates,
    customName,
    customBio,
    isSavingProfile,
    serverEnv,
    setServerEnv,
    devModalVisible,
    setDevModalVisible,
    currentPass,
    setCurrentPass,
    newPass,
    setNewPass,
    confirmPass,
    setConfirmPass,
    isChangingPass,
    showCurrentPass,
    setShowCurrentPass,
    showNewPass,
    setShowNewPass,
    showConfirmPass,
    setShowConfirmPass,
    videoQuality,
    handleVersionTap,
    cycleVideoQuality,
    handleClearCache,
    handleLogout,
    handleSwitchServerEnvironment,
    handleSaveProfile,
    handleChangePassword,
    handleConfirmDeleteAccount,
    getCourseStatus,
    enrolledOrderCourses,
    lpStats,
    enrolledCount,
    completedCount,
    totalHoursLearned,
    displayedCourses,
    t,
  };
}
