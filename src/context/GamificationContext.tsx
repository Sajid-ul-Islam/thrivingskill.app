import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GAMIFICATION_STORAGE_KEY = '@thriving_skill_gamification';

export interface AchievementBadge {
  id: string;
  title: string;
  banglaTitle: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
  isUnlocked: boolean;
}

const DEFAULT_BADGES: AchievementBadge[] = [
  {
    id: 'first_step',
    title: 'First Step',
    banglaTitle: 'প্রথম পদক্ষেপ',
    description: 'Enrolled in your first professional course',
    icon: 'flag',
    color: '#059669',
    isUnlocked: true,
    unlockedAt: '2026-08-15',
  },
  {
    id: 'streak_champ',
    title: 'Consistency Champ',
    banglaTitle: 'ধারাবাহিক লার্নার',
    description: 'Maintained a 3-day active learning streak',
    icon: 'flame',
    color: '#F59E0B',
    isUnlocked: true,
    unlockedAt: '2026-08-18',
  },
  {
    id: 'ai_pioneer',
    title: 'AI Pioneer',
    banglaTitle: 'এআই অগ্রদূত',
    description: 'Completed a Generative AI masterclass lecture',
    icon: 'sparkles',
    color: '#8B5CF6',
    isUnlocked: true,
    unlockedAt: '2026-08-20',
  },
  {
    id: 'data_wizard',
    title: 'Excel & Data Wizard',
    banglaTitle: 'ডাটা উইজার্ড',
    description: 'Practiced advanced financial modeling formulas',
    icon: 'grid',
    color: '#10B981',
    isUnlocked: false,
  },
  {
    id: 'quiz_master',
    title: 'Quiz Ace',
    banglaTitle: 'কুইজ মাস্টার',
    description: 'Scored 90%+ on a chapter assessment test',
    icon: 'trophy',
    color: '#EC4899',
    isUnlocked: false,
  },
  {
    id: 'certified_pro',
    title: 'Certified Specialist',
    banglaTitle: 'সার্টিফাইড স্পেশালিস্ট',
    description: 'Earned an accredited Thriving Skills completion certificate',
    icon: 'ribbon',
    color: '#2563EB',
    isUnlocked: true,
    unlockedAt: '2026-08-22',
  },
];

interface GamificationState {
  streakDays: number;
  lastActiveDate: string;
  dailyMinutesSpent: number;
  dailyGoalMinutes: number;
  badges: AchievementBadge[];
  xp: number;
}

interface GamificationContextType extends GamificationState {
  recordStudyTime: (minutes: number) => void;
  unlockBadge: (badgeId: string) => void;
  setDailyGoal: (minutes: number) => void;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
}

const GamificationContext = createContext<GamificationContextType>({} as GamificationContextType);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GamificationState>({
    streakDays: 4,
    lastActiveDate: new Date().toISOString().split('T')[0],
    dailyMinutesSpent: 11,
    dailyGoalMinutes: 15,
    badges: DEFAULT_BADGES,
    xp: 350,
  });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(GAMIFICATION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const today = new Date().toISOString().split('T')[0];

          // Reset daily minutes if new day
          if (parsed.lastActiveDate !== today) {
            parsed.dailyMinutesSpent = 0;
            parsed.lastActiveDate = today;
          }

          setState((prev) => ({
            ...prev,
            ...parsed,
            xp: parsed.xp ?? 350,
            badges: prev.badges.map((b) => {
              const savedBadge = parsed.badges?.find((sb: any) => sb.id === b.id);
              return savedBadge ? { ...b, ...savedBadge } : b;
            }),
          }));
        }
      } catch {}
    })();
  }, []);

  const saveState = async (newState: GamificationState) => {
    setState(newState);
    try {
      await AsyncStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(newState));
    } catch {}
  };

  const recordStudyTime = (minutes: number) => {
    const updated = {
      ...state,
      dailyMinutesSpent: state.dailyMinutesSpent + minutes,
      lastActiveDate: new Date().toISOString().split('T')[0],
      xp: state.xp + minutes * 5,
    };
    saveState(updated);
  };

  const addXP = (amount: number) => {
    const updated = {
      ...state,
      xp: (state.xp || 0) + amount,
    };
    saveState(updated);
  };

  const incrementStreak = () => {
    const updated = {
      ...state,
      streakDays: (state.streakDays || 0) + 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
    };
    saveState(updated);
  };

  const unlockBadge = (badgeId: string) => {
    const updatedBadges = state.badges.map((b) =>
      b.id === badgeId
        ? { ...b, isUnlocked: true, unlockedAt: new Date().toISOString().split('T')[0] }
        : b
    );
    saveState({ ...state, badges: updatedBadges, xp: (state.xp || 0) + 100 });
  };

  const setDailyGoal = (minutes: number) => {
    saveState({ ...state, dailyGoalMinutes: minutes });
  };

  return (
    <GamificationContext.Provider
      value={{
        ...state,
        recordStudyTime,
        unlockBadge,
        setDailyGoal,
        addXP,
        incrementStreak,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
