import { HttpClient, ApiError } from './httpClient';
import { Endpoints } from './endpoints';
import { AuthService } from './authService';
import { CoursesService } from './coursesService';
import { LessonsService } from './lessonsService';
import { PostsService } from './postsService';
import { UserService } from './userService';
import { CacheManager } from '../cache/cacheManager';

export const Api = {
  auth: AuthService,
  courses: CoursesService,
  lessons: LessonsService,
  posts: PostsService,
  user: UserService,
  http: HttpClient,
  cache: CacheManager,
  endpoints: Endpoints,
};

export {
  HttpClient,
  ApiError,
  Endpoints,
  AuthService,
  CoursesService,
  LessonsService,
  PostsService,
  UserService,
  CacheManager,
};

export default Api;
