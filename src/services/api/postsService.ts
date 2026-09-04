import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { WpPost } from '../../types';
import { cleanHtml } from './transformers';

export interface PostQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  category?: number | string;
}

export class PostsService {
  private static POSTS_CACHE_PREFIX = 'wp_posts_list';

  /**
   * Fetch WordPress blog posts with featured media and authors embedded
   */
  static async getPosts(params: PostQueryParams = {}): Promise<WpPost[]> {
    const page = params.page || 1;
    const perPage = params.perPage || 6;
    const cacheKey = `${this.POSTS_CACHE_PREFIX}_p${page}_pp${perPage}_s${params.search || ''}`;

    if (!params.search) {
      const cached = await CacheManager.get<WpPost[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const queryParams: Record<string, any> = {
        page,
        per_page: perPage,
        _embed: true,
      };

      if (params.search && params.search.trim()) {
        queryParams.search = params.search.trim();
      }
      if (params.category) {
        queryParams.categories = params.category;
      }

      const data = await HttpClient.get<any[]>(Endpoints.WORDPRESS.POSTS, queryParams, {
        skipAuth: true,
      });

      if (!Array.isArray(data)) return [];

      const posts: WpPost[] = data.map((p: any) => {
        let featuredImageUrl: string | undefined = undefined;
        const media = p._embedded?.['wp:featuredmedia'];
        if (Array.isArray(media) && media[0]?.source_url) {
          featuredImageUrl = media[0].source_url;
        }

        const author = p._embedded?.author?.[0]?.name || 'Thriving Skills';

        return {
          id: p.id,
          title: cleanHtml(p.title?.rendered || 'Skill Article'),
          excerpt: cleanHtml(p.excerpt?.rendered || '').slice(0, 160) + '...',
          content: cleanHtml(p.content?.rendered || ''),
          date: p.date ? p.date.split('T')[0] : '',
          link: p.link || 'https://thrivingskill.com',
          authorName: cleanHtml(author),
          featuredImageUrl,
          categories: [],
        };
      });

      await CacheManager.set(cacheKey, posts);
      return posts;
    } catch {
      const stale = await CacheManager.get<WpPost[]>(cacheKey, true);
      if (stale) return stale;
      return [];
    }
  }

  /**
   * Fetch a single post by ID
   */
  static async getPostById(postId: string | number): Promise<WpPost | null> {
    try {
      const p = await HttpClient.get<any>(Endpoints.WORDPRESS.POST_DETAIL(postId), {
        _embed: true,
      });
      if (!p) return null;

      let featuredImageUrl: string | undefined = undefined;
      const media = p._embedded?.['wp:featuredmedia'];
      if (Array.isArray(media) && media[0]?.source_url) {
        featuredImageUrl = media[0].source_url;
      }

      return {
        id: p.id,
        title: cleanHtml(p.title?.rendered),
        excerpt: cleanHtml(p.excerpt?.rendered),
        content: cleanHtml(p.content?.rendered),
        date: p.date ? p.date.split('T')[0] : '',
        link: p.link || '',
        authorName: cleanHtml(p._embedded?.author?.[0]?.name || 'Thriving Skills'),
        featuredImageUrl,
        categories: [],
      };
    } catch {
      return null;
    }
  }
}
