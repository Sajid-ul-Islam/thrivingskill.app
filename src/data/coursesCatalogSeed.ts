import { Course } from '../types';
import seedData from './coursesCatalogSeed.json';

export const INITIAL_COURSES_SEED: Course[] = (seedData as unknown as Course[]).map((c) => ({
  ...c,
  _searchIndex: (
    c._searchIndex ||
    `${c.title} ${c.subtitle || ''} ${c.instructor?.name || ''} ${c.category} ${(c.categorySlugs || []).join(' ')}`
  ).toLowerCase(),
}));
