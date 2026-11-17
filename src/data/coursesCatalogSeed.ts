import { Course } from '../types';
import { COURSES } from './mockData';

export const INITIAL_COURSES_SEED: Course[] = COURSES.map((c: Course) => ({
  ...c,
  _searchIndex: (
    c._searchIndex ||
    `${c.title} ${c.subtitle || ''} ${c.instructor?.name || ''} ${c.category} ${(c.categorySlugs || []).join(' ')}`
  ).toLowerCase(),
}));
