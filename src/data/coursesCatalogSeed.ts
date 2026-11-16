import { Course } from '../types';
import seedData from './coursesCatalogSeed.json';

export const INITIAL_COURSES_SEED: Course[] = seedData as unknown as Course[];
