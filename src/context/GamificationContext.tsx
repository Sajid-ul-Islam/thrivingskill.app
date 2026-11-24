import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

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
    isUnlocked: false,
  },
  {
    id: 'streak_champ',
    title: 'Consistency Champ',
    banglaTitle: 'ধারাবাহিক লার্নার',
    description: 'Maintained a 3-day active learning streak',
    icon: 'flame',
    color: '#F59E0B',
    isUnlocked: false,
  },
  {
    id: 'ai_pioneer',
    title: 'AI Pioneer',
    banglaTitle: 'এআই অগ্রদূত',
    description: 'Completed a Generative AI masterclass lecture',
    icon: 'sparkles',
    color: '#8B5CF6',
    isUnlocked: false,
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
    isUnlocked: false,
  },
];

export interface CelebrationEvent {
  title: string;
  subtitle: string;
  xpAwarded?: number;
  icon?: string;
}

export interface WeeklyDayActivity {
  day: string;
  dayBn: string;
  hours: number;
  isToday?: boolean;
}

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const computeWeeklyActivity = (
  dailyHistory: Record<string, number> = {}
): WeeklyDayActivity[] => {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const distToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distToMonday);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNamesBn = ['সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি', 'রবি'];
  const todayStr = getLocalDateString(today);

  return dayNames.map((day, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = getLocalDateString(d);
    const minutes = dailyHistory[dateStr] || 0;
    const hours = Math.round((minutes / 60) * 10) / 10;

    return {
      day,
      dayBn: dayNamesBn[idx],
      hours,
      isToday: dateStr === todayStr,
    };
  });
};

interface GamificationState {
  streakDays: number;
  lastActiveDate: string;
  dailyMinutesSpent: number;
  dailyGoalMinutes: number;
  totalStudyMinutes: number;
  dailyHistory: Record<string, number>;
  badges: AchievementBadge[];
  xp: number;
}

interface GamificationContextType extends GamificationState {
  celebration: CelebrationEvent | null;
  weeklyActivity: WeeklyDayActivity[];
  recordStudyTime: (minutes: number) => void;
  unlockBadge: (badgeId: string) => void;
  setDailyGoal: (minutes: number) => void;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  triggerCelebration: (event: CelebrationEvent) => void;
  clearCelebration: () => void;
}

const GamificationContext = createContext<GamificationContextType>({} as GamificationContextType);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const scopedStorageKey = `${GAMIFICATION_STORAGE_KEY}${user?.id ? `_u_${user.id}` : '_guest'}`;
  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null);

  const getInitialState = (): GamificationState => ({
    streakDays: 0,
    lastActiveDate: getLocalDateString(),
    dailyMinutesSpent: 0,
    dailyGoalMinutes: 15,
    totalStudyMinutes: 0,
    dailyHistory: {},
    badges: DEFAULT_BADGES.map((b) => ({ ...b, isUnlocked: false, unlockedAt: undefined })),
    xp: 0,
  });

  const [state, setState] = useState<GamificationState>(getInitialState);

  useEffect(() => {
    let active = true;
    setState(getInitialState());

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(scopedStorageKey);
        if (stored && active) {
          const parsed = JSON.parse(stored);
          const today = getLocalDateString();
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterday = getLocalDateString(yesterdayDate);

          // Reset daily minutes if new day
          let parsedStreak = parsed.streakDays ?? 0;
          let parsedDailyMinutes = parsed.dailyMinutesSpent ?? 0;

          if (parsed.lastActiveDate !== today) {
            parsedDailyMinutes = 0;
            // If missed yesterday, streak is reset to 0 until user studies today
            if (parsed.lastActiveDate !== yesterday) {
              parsedStreak = 0;
            }
          }

          setState((prev) => ({
            ...prev,
            ...parsed,
            streakDays: parsedStreak,
            dailyMinutesSpent: parsedDailyMinutes,
            totalStudyMinutes: parsed.totalStudyMinutes ?? parsed.dailyMinutesSpent ?? 0,
            dailyHistory: parsed.dailyHistory ?? {},
            xp: parsed.xp ?? 0,
            badges: prev.badges.map((b) => {
              const savedBadge = parsed.badges?.find((sb: any) => sb.id === b.id);
              return savedBadge ? { ...b, ...savedBadge } : b;
            }),
          }));
        }
      } catch {}
    })();

    return () => {
      active = false;
    };
  }, [scopedStorageKey]);

  const saveState = async (newState: GamificationState) => {
    setState(newState);
    try {
      await AsyncStorage.setItem(scopedStorageKey, JSON.stringify(newState));
    } catch {}
  };

  const recordStudyTime = (minutes: number) => {
    if (minutes <= 0) return;
    const today = getLocalDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalDateString(yesterdayDate);

    setState((prevState) => {
      let newStreak = prevState.streakDays;
      const wasActiveToday = prevState.lastActiveDate === today && prevState.dailyMinutesSpent > 0;

      if (!wasActiveToday) {
        if (prevState.lastActiveDate === yesterday && prevState.streakDays > 0) {
          newStreak = prevState.streakDays + 1;
        } else {
          newStreak = 1;
        }
      } else if (newStreak === 0) {
        newStreak = 1;
      }

      const currentDayMins = (prevState.lastActiveDate === today ? prevState.dailyMinutesSpent : 0) + minutes;
      const newHistory = {
        ...(prevState.dailyHistory || {}),
        [today]: currentDayMins,
      };
      const newTotalMinutes = (prevState.totalStudyMinutes || 0) + minutes;

      const updated: GamificationState = {
        ...prevState,
        streakDays: newStreak,
        dailyMinutesSpent: currentDayMins,
        totalStudyMinutes: newTotalMinutes,
        dailyHistory: newHistory,
        lastActiveDate: today,
        xp: (prevState.xp || 0) + minutes * 5,
      };

      AsyncStorage.setItem(scopedStorageKey, JSON.stringify(updated)).catch(() => {});

      if (newStreak >= 3) {
        const streakBadge = prevState.badges.find((b) => b.id === 'streak_champ');
        if (streakBadge && !streakBadge.isUnlocked) {
          setTimeout(() => unlockBadge('streak_champ'), 0);
        }
      }

      return updated;
    });
  };

  const addXP = (amount: number) => {
    if (amount <= 0) return;
    setState((prevState) => {
      const updated: GamificationState = {
        ...prevState,
        xp: (prevState.xp || 0) + amount,
      };
      AsyncStorage.setItem(scopedStorageKey, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const incrementStreak = () => {
    const today = getLocalDateString();
    setState((prevState) => {
      const updated: GamificationState = {
        ...prevState,
        streakDays: (prevState.streakDays || 0) + 1,
        lastActiveDate: today,
      };
      AsyncStorage.setItem(scopedStorageKey, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const triggerCelebration = (event: CelebrationEvent) => {
    setCelebration(event);
  };

  const clearCelebration = () => {
    setCelebration(null);
  };

  const unlockBadge = (badgeId: string) => {
    const today = getLocalDateString();
    setState((prevState) => {
      const existing = prevState.badges.find((b) => b.id === badgeId);
      if (existing && existing.isUnlocked) {
        return prevState; // Already unlocked: prevent duplicate XP awards and celebrations
      }

      const updatedBadges = prevState.badges.map((b) =>
        b.id === badgeId
          ? { ...b, isUnlocked: true, unlockedAt: today }
          : b
      );

      const updated: GamificationState = {
        ...prevState,
        badges: updatedBadges,
        xp: (prevState.xp || 0) + 100,
      };

      AsyncStorage.setItem(scopedStorageKey, JSON.stringify(updated)).catch(() => {});

      if (existing && !existing.isUnlocked) {
        triggerCelebration({
          title: `Badge Unlocked: ${existing.title}! 🏆`,
          subtitle: existing.description,
          xpAwarded: 100,
          icon: existing.icon,
        });
      }

      return updated;
    });
  };

  const setDailyGoal = (minutes: number) => {
    if (minutes <= 0) return;
    setState((prevState) => {
      const updated: GamificationState = {
        ...prevState,
        dailyGoalMinutes: minutes,
      };
      AsyncStorage.setItem(scopedStorageKey, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const weeklyActivity = computeWeeklyActivity(state.dailyHistory);

  return (
    <GamificationContext.Provider
      value={{
        ...state,
        celebration,
        weeklyActivity,
        recordStudyTime,
        unlockBadge,
        setDailyGoal,
        addXP,
        incrementStreak,
        triggerCelebration,
        clearCelebration,
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
