import { Course } from '../types';
import rawCourses from './coursesCatalogSeed.json';

export const INITIAL_COURSES_SEED: Course[] = (rawCourses as unknown as Course[]).map(
  (c: Course) => ({
    ...c,
    _searchIndex: (
      c._searchIndex ||
      `${c.title} ${c.subtitle || ''} ${c.instructor?.name || ''} ${c.category} ${(c.categorySlugs || []).join(' ')}`
    ).toLowerCase(),
  })
);
