import { useCallback, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGamification } from '../../context/GamificationContext';
import { useLearning } from '../../context/LearningContext';
import { Course } from '../../types';

export function useMyLearningState() {
  const { isBangla } = useLanguage();
  const { totalStudyMinutes } = useGamification();
  const { courses, userProgress, bookmarks, certificates, getCourseProgressPercentage } =
    useLearning();

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

  const enrolledList = useMemo(
    () => courses.filter((c) => !!userProgress[c.id]),
    [courses, userProgress]
  );
  const inProgressList = useMemo(
    () => enrolledList.filter((c) => getCourseStatus(c.id) === 'in-progress'),
    [enrolledList, getCourseStatus]
  );
  const finishedList = useMemo(
    () =>
      enrolledList.filter((c) => {
        const st = getCourseStatus(c.id);
        return st === 'finished' || st === 'passed' || st === 'failed';
      }),
    [enrolledList, getCourseStatus]
  );
  const passedList = useMemo(
    () => enrolledList.filter((c) => getCourseStatus(c.id) === 'passed'),
    [enrolledList, getCourseStatus]
  );
  const failedList = useMemo(
    () => enrolledList.filter((c) => getCourseStatus(c.id) === 'failed'),
    [enrolledList, getCourseStatus]
  );
  const savedList = useMemo(
    () => courses.filter((c) => bookmarks.includes(c.id)),
    [courses, bookmarks]
  );

  const lpStats = useMemo(
    () => ({
      enrolledCount: enrolledList.length,
      inProgressCount: inProgressList.length,
      finishedCount: finishedList.length,
      passedCount: passedList.length,
      failedCount: failedList.length,
    }),
    [
      enrolledList.length,
      inProgressList.length,
      finishedList.length,
      passedList.length,
      failedList.length,
    ]
  );

  const historyList = useMemo(
    () =>
      enrolledList
        .map((course: Course) => {
          const progress = userProgress[course.id];
          const targetLessonId =
            progress?.lastAccessedLessonId || course.modules?.[0]?.lessons?.[0]?.id || '';
          const targetLesson =
            course.modules?.flatMap((m) => m.lessons || []).find((l) => l.id === targetLessonId) ||
            course.modules?.[0]?.lessons?.[0];
          const watchSec = progress?.lastWatchPositionSeconds?.[targetLessonId] || 120;
          const percent = getCourseProgressPercentage(course.id);
          return {
            course,
            lesson: targetLesson,
            watchSec,
            progressPercent: percent,
            dateWatched: isBangla ? 'আজ' : 'Today',
          };
        })
        .filter((h) => !!h.lesson),
    [enrolledList, userProgress, getCourseProgressPercentage, isBangla]
  );

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

  return {
    getCourseStatus,
    enrolledList,
    inProgressList,
    finishedList,
    passedList,
    failedList,
    savedList,
    lpStats,
    historyList,
    totalHoursLearned,
    certificates,
  };
}
