import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LearningProvider, useLearning } from './src/context/LearningContext';
import { SaaSProvider, useSaaS } from './src/context/SaaSContext';
import { RootTab, ActiveScreen } from './src/types';

import { HomeScreen } from './src/screens/HomeScreen';
import { CoursesScreen } from './src/screens/CoursesScreen';
import { SkillCopilotScreen } from './src/screens/SkillCopilotScreen';
import { MyLearningScreen } from './src/screens/MyLearningScreen';
import { EnterpriseTeamScreen } from './src/screens/EnterpriseTeamScreen';
import { WorkshopsScreen } from './src/screens/WorkshopsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CourseDetailScreen } from './src/screens/CourseDetailScreen';
import { LessonPlayerScreen } from './src/screens/LessonPlayerScreen';

import { SubscriptionModal } from './src/components/SubscriptionModal';
import { NotificationModal } from './src/components/NotificationModal';
import { SkillAssessmentModal } from './src/components/SkillAssessmentModal';
import { CorporateInquiryModal } from './src/components/CorporateInquiryModal';

const MainAppContent: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { userProgress } = useLearning();
  const { activeWorkspace, unreadNotificationsCount } = useSaaS();

  const [activeTab, setActiveTab] = useState<RootTab>('Home');
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>({
    name: 'MainTabs',
    tab: 'Home',
  });

  // Global Modals State
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [corporateModalVisible, setCorporateModalVisible] = useState(false);

  const inProgressCount = Object.values(userProgress).filter((p) => !p.isCompleted).length;

  const navigateToTab = (tab: RootTab) => {
    setActiveTab(tab);
    setActiveScreen({ name: 'MainTabs', tab });
  };

  const navigateToCourse = (courseId: string) => {
    setActiveScreen({ name: 'CourseDetail', courseId });
  };

  const navigateToLesson = (courseId: string, lessonId: string) => {
    setActiveScreen({ name: 'LessonPlayer', courseId, lessonId });
  };

  const navigateBackToTabs = () => {
    setActiveScreen({ name: 'MainTabs', tab: activeTab });
  };

  // Dynamically configure tabs based on Workspace (Personal vs Enterprise)
  const isEnterpriseWorkspace = activeWorkspace.type === 'enterprise';

  const tabItems: {
    id: RootTab;
    label: string;
    icon: string;
    iconOutline: string;
    badgeCount?: number;
  }[] = [
    { id: 'Home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
    { id: 'Courses', label: 'Explore', icon: 'compass', iconOutline: 'compass-outline' },
    { id: 'Copilot', label: 'AI Copilot', icon: 'sparkles', iconOutline: 'sparkles-outline' },
    isEnterpriseWorkspace
      ? { id: 'TeamHub', label: 'Team Hub', icon: 'business', iconOutline: 'business-outline' }
      : {
          id: 'MyLearning',
          label: 'My Hub',
          icon: 'book',
          iconOutline: 'book-outline',
          badgeCount: inProgressCount,
        },
    { id: 'Workshops', label: 'Live', icon: 'videocam', iconOutline: 'videocam-outline' },
    { id: 'Profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.surface} />

      <View style={styles.screenContainer}>
        {activeScreen.name === 'CourseDetail' ? (
          <CourseDetailScreen
            courseId={activeScreen.courseId}
            onBack={navigateBackToTabs}
            onNavigateToLesson={navigateToLesson}
          />
        ) : activeScreen.name === 'LessonPlayer' ? (
          <LessonPlayerScreen
            courseId={activeScreen.courseId}
            lessonId={activeScreen.lessonId}
            onBack={navigateBackToTabs}
            onSelectLesson={navigateToLesson}
          />
        ) : (
          <>
            {activeTab === 'Home' && (
              <HomeScreen
                onNavigateToCourse={navigateToCourse}
                onNavigateToLesson={navigateToLesson}
                onNavigateTab={navigateToTab}
                onOpenCorporateModal={() => setCorporateModalVisible(true)}
                onOpenSubscription={() => setSubscriptionModalVisible(true)}
                onOpenNotifications={() => setNotificationModalVisible(true)}
                onOpenAssessment={() => setAssessmentModalVisible(true)}
              />
            )}
            {activeTab === 'Courses' && (
              <CoursesScreen
                onNavigateToCourse={navigateToCourse}
                onOpenSubscription={() => setSubscriptionModalVisible(true)}
                onOpenNotifications={() => setNotificationModalVisible(true)}
              />
            )}
            {activeTab === 'Copilot' && (
              <SkillCopilotScreen
                onOpenSubscription={() => setSubscriptionModalVisible(true)}
                onOpenNotifications={() => setNotificationModalVisible(true)}
                onNavigateToCourse={navigateToCourse}
              />
            )}
            {activeTab === 'MyLearning' && (
              <MyLearningScreen
                onNavigateToCourse={navigateToCourse}
                onNavigateToLesson={navigateToLesson}
                onBrowseCourses={() => navigateToTab('Courses')}
                onOpenSubscription={() => setSubscriptionModalVisible(true)}
                onOpenNotifications={() => setNotificationModalVisible(true)}
              />
            )}
            {activeTab === 'TeamHub' && (
              <EnterpriseTeamScreen
                onOpenSubscription={() => setSubscriptionModalVisible(true)}
                onOpenNotifications={() => setNotificationModalVisible(true)}
                onNavigateToCourse={navigateToCourse}
              />
            )}
            {activeTab === 'Workshops' && (
              <WorkshopsScreen
                onOpenSubscription={() => setSubscriptionModalVisible(true)}
                onOpenNotifications={() => setNotificationModalVisible(true)}
              />
            )}
            {activeTab === 'Profile' && (
              <ProfileScreen
                onOpenCorporateModal={() => setCorporateModalVisible(true)}
                onOpenSubscription={() => setSubscriptionModalVisible(true)}
                onOpenNotifications={() => setNotificationModalVisible(true)}
                onNavigateTab={navigateToTab}
              />
            )}
          </>
        )}
      </View>

      {/* Bottom Tab Bar (shown only when on MainTabs) */}
      {activeScreen.name === 'MainTabs' && (
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: colors.tabBarBg,
              borderTopColor: colors.tabBarBorder,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          {tabItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabButton}
                onPress={() => navigateToTab(tab.id)}
                activeOpacity={0.7}
              >
                <View style={styles.tabIconWrapper}>
                  <Ionicons
                    name={(isActive ? tab.icon : tab.iconOutline) as any}
                    size={21}
                    color={isActive ? colors.tabActive : colors.tabInactive}
                  />
                  {tab.badgeCount && tab.badgeCount > 0 ? (
                    <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.tabBadgeText}>{tab.badgeCount}</Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.tabButtonLabel,
                    {
                      color: isActive ? colors.tabActive : colors.tabInactive,
                      fontWeight: isActive ? '800' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Global SaaS Modals */}
      <SubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
      />

      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        onNavigateToTab={(tab, courseId) => {
          if (tab) navigateToTab(tab);
          if (courseId) navigateToCourse(courseId);
        }}
      />

      <SkillAssessmentModal
        visible={assessmentModalVisible}
        onClose={() => setAssessmentModalVisible(false)}
        onNavigateToCourse={navigateToCourse}
      />

      <CorporateInquiryModal
        visible={corporateModalVisible}
        onClose={() => setCorporateModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SaaSProvider>
          <LearningProvider>
            <MainAppContent />
          </LearningProvider>
        </SaaSProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 3,
  },
  tabIconWrapper: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  tabButtonLabel: {
    fontSize: 10,
    marginTop: 3,
  },
});
