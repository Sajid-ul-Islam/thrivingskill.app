import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LearningProvider, useLearning } from './src/context/LearningContext';
import { RootTab, ActiveScreen } from './src/types';

import { HomeScreen } from './src/screens/HomeScreen';
import { CoursesScreen } from './src/screens/CoursesScreen';
import { MyLearningScreen } from './src/screens/MyLearningScreen';
import { WorkshopsScreen } from './src/screens/WorkshopsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CourseDetailScreen } from './src/screens/CourseDetailScreen';
import { LessonPlayerScreen } from './src/screens/LessonPlayerScreen';
import { CorporateInquiryModal } from './src/components/CorporateInquiryModal';

const MainAppContent: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { userProgress } = useLearning();

  const [activeTab, setActiveTab] = useState<RootTab>('Home');
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>({
    name: 'MainTabs',
    tab: 'Home',
  });
  const [corporateModalVisible, setCorporateModalVisible] = useState<boolean>(false);

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
              />
            )}
            {activeTab === 'Courses' && (
              <CoursesScreen onNavigateToCourse={navigateToCourse} />
            )}
            {activeTab === 'MyLearning' && (
              <MyLearningScreen
                onNavigateToCourse={navigateToCourse}
                onNavigateToLesson={navigateToLesson}
                onBrowseCourses={() => navigateToTab('Courses')}
              />
            )}
            {activeTab === 'Workshops' && <WorkshopsScreen />}
            {activeTab === 'Profile' && (
              <ProfileScreen
                onOpenCorporateModal={() => setCorporateModalVisible(true)}
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
          {[
            { id: 'Home' as RootTab, label: 'Home', icon: 'home', iconOutline: 'home-outline' },
            { id: 'Courses' as RootTab, label: 'Explore', icon: 'compass', iconOutline: 'compass-outline' },
            {
              id: 'MyLearning' as RootTab,
              label: 'My Learning',
              icon: 'book',
              iconOutline: 'book-outline',
              badgeCount: inProgressCount,
            },
            { id: 'Workshops' as RootTab, label: 'Live', icon: 'videocam', iconOutline: 'videocam-outline' },
            { id: 'Profile' as RootTab, label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
          ].map((tab) => {
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
                    size={22}
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
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Global Corporate B2B Modal */}
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
        <LearningProvider>
          <MainAppContent />
        </LearningProvider>
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
    paddingVertical: 4,
  },
  tabIconWrapper: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabButtonLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});
