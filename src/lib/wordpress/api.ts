/**
 * WordPress REST API Client
 * Feature: Integração com Blog WordPress via API Headless
 *
 * This module provides a type-safe client for the WordPress REST API v2
 * with built-in timeout handling, ISR caching, and error resilience.
 */

/**
 * WordPress API configuration from environment variables
 */
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://svlentes.shop/wp-json/wp/v2';
const API_TIMEOUT = 5000; // 5 seconds - fail-fast strategy

/**
 * Fetch with timeout using AbortController
 * Implements 5-second timeout with fail-fast strategy (no retries)
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default 5000ms)
 * @returns Promise<Response>
 * @throws Error if timeout occurs or network fails
 */
/**
 * Error types for better error handling
 */
export enum WordPressAPIErrorType {
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK',
  HTTP_ERROR = 'HTTP_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class for WordPress API errors
 */
export class WordPressAPIError extends Error {
  constructor(
    message: string,
    public type: WordPressAPIErrorType,
    public url: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'WordPressAPIError';
  }
}

/**
 * Check if error is a network connectivity issue
 */
function isNetworkError(error: any): boolean {
  return (
    error.message?.includes('fetch failed') ||
    error.message?.includes('network') ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT'
  );
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorType = response.status >= 500
        ? WordPressAPIErrorType.HTTP_ERROR
        : WordPressAPIErrorType.HTTP_ERROR;

      console.error(
        `[WordPress API] HTTP ${response.status} for ${url}`,
        `(${response.statusText})`
      );

      throw new WordPressAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        errorType,
        url,
        response.status
      );
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Timeout error
    if (error.name === 'AbortError') {
      console.error(`[WordPress API] ⏱️  Timeout after ${timeout}ms for ${url}`);
      throw new WordPressAPIError(
        `Request timeout after ${timeout}ms`,
        WordPressAPIErrorType.TIMEOUT,
        url
      );
    }

    // Network connectivity error
    if (isNetworkError(error)) {
      console.error(`[WordPress API] 🌐 Network error for ${url}:`, error.message);
      throw new WordPressAPIError(
        'Network connectivity error - WordPress may be offline',
        WordPressAPIErrorType.NETWORK,
        url
      );
    }

    // Re-throw WordPressAPIError as-is
    if (error instanceof WordPressAPIError) {
      throw error;
    }

    // Unknown error
    console.error(`[WordPress API] ❌ Unknown error for ${url}:`, error.message);
    throw new WordPressAPIError(
      error.message || 'Unknown API error',
      WordPressAPIErrorType.UNKNOWN,
      url
    );
  }
}

/**
 * Build WordPress API URL with query parameters
 *
 * @param endpoint - API endpoint (e.g., '/posts', '/categories')
 * @param params - Query parameters
 * @returns Full API URL with parameters
 */
export function buildApiUrl(endpoint: string, params: Record<string, any> = {}): string {
  const url = new URL(`${WORDPRESS_API_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Get WordPress API base URL
 * Useful for external consumers
 */
export function getWordPressApiUrl(): string {
  return WORDPRESS_API_URL;
}

// Placeholder functions to be implemented in following tasks
// These will be completed in T011, T017, T018, T026, T027, T028

/**
 * Get published posts
 * Implementation: T011
 *
 * Fetches published blog posts from WordPress with optional filtering.
 * Uses ISR caching with 1-minute revalidation.
 *
 * @param params - Query parameters
 * @returns Array of WordPress posts with embedded media and authors
 */
export async function getPosts(params?: {
  page?: number;
  perPage?: number;
  categories?: string;
  search?: string;
}): Promise<any[]> {
  const {
    page = 1,
    perPage = 6,
    categories,
    search,
  } = params || {};

  try {
    // Build API URL with optimized fields
    const url = buildApiUrl('/posts', {
      page,
      per_page: perPage,
      categories,
      search,
      _embed: true,
      _fields: 'id,title,excerpt,slug,date,modified,author,featured_media,categories,tags,_embedded',
      status: 'publish',
      orderby: 'date',
      order: 'desc',
    });

    // Fetch with ISR cache configuration
    const response = await fetchWithTimeout(url, {
      next: {
        revalidate: 60, // 1 minute
        tags: ['wordpress', 'posts'],
      },
    });

    const posts = await response.json();
    return Array.isArray(posts) ? posts : [];
  } catch (error: any) {
    console.error('[WordPress API] getPosts error:', error.message);
    // Return empty array as fallback (fail-fast strategy)
    return [];
  }
}

/**
 * Get post by slug
 * Implementation: T017
 *
 * Fetches a single WordPress post by its slug with embedded media and authors.
 * Returns null if post not found.
 * Uses ISR caching with 1-minute revalidation.
 *
 * @param slug - Post slug (URL-friendly identifier)
 * @returns WordPress post object or null if not found
 */
export async function getPostBySlug(slug: string): Promise<any | null> {
  try {
    // Build API URL with slug filter
    const url = buildApiUrl('/posts', {
      slug,
      _embed: true,
      _fields: 'id,title,content,excerpt,slug,date,modified,author,featured_media,categories,tags,_embedded',
      status: 'publish',
    });

    // Fetch with ISR cache configuration
    const response = await fetchWithTimeout(url, {
      next: {
        revalidate: 60, // 1 minute
        tags: ['wordpress', 'posts', `post-${slug}`],
      },
    });

    const posts = await response.json();

    // WordPress returns an array, we need the first item
    if (Array.isArray(posts) && posts.length > 0) {
      return posts[0];
    }

    return null;
  } catch (error: any) {
    console.error(`[WordPress API] getPostBySlug error for ${slug}:`, error.message);
    return null;
  }
}

/**
 * Get related posts by category
 * Implementation: T018
 *
 * Fetches posts from the same categories as the current post,
 * excluding the current post. Used for "Related Articles" section.
 * Uses 5-minute cache for better performance.
 *
 * @param categoryIds - Array of category IDs to match
 * @param excludeId - Current post ID to exclude from results
 * @param limit - Maximum number of posts to return (default 3)
 * @returns Array of related WordPress posts
 */
export async function getRelatedPosts(
  categoryIds: number[],
  excludeId: number,
  limit: number = 3
): Promise<any[]> {
  try {
    // If no categories provided, return empty
    if (!categoryIds || categoryIds.length === 0) {
      return [];
    }

    // Build API URL with category filter and exclusion
    const url = buildApiUrl('/posts', {
      categories: categoryIds.join(','),
      exclude: excludeId,
      per_page: limit,
      _embed: true,
      _fields: 'id,title,excerpt,slug,date,modified,author,featured_media,categories,tags,_embedded',
      status: 'publish',
      orderby: 'date',
      order: 'desc',
    });

    // Fetch with ISR cache configuration (5 minutes)
    const response = await fetchWithTimeout(url, {
      next: {
        revalidate: 300, // 5 minutes
        tags: ['wordpress', 'related-posts'],
      },
    });

    const posts = await response.json();
    return Array.isArray(posts) ? posts : [];
  } catch (error: any) {
    console.error(`[WordPress API] getRelatedPosts error:`, error.message);
    return [];
  }
}

/**
 * Get all categories
 * Implementation: T026
 *
 * Fetches all WordPress categories for blog filtering.
 * Uses 10-minute cache for better performance.
 *
 * @returns Array of WordPress categories
 */
export async function getCategories(): Promise<any[]> {
  try {
    const url = buildApiUrl('/categories', {
      per_page: 100,
      orderby: 'count',
      order: 'desc',
      hide_empty: true,
    });

    const response = await fetchWithTimeout(url, {
      next: {
        revalidate: 600, // 10 minutes
        tags: ['wordpress', 'categories'],
      },
    });

    const categories = await response.json();
    return Array.isArray(categories) ? categories : [];
  } catch (error: any) {
    console.error('[WordPress API] getCategories error:', error.message);
    return [];
  }
}

/**
 * Get posts by category
 * Implementation: T027
 *
 * Fetches posts filtered by category with pagination support.
 * Returns posts array plus pagination metadata.
 * Uses ISR caching with 1-minute revalidation.
 *
 * @param categoryId - Category ID to filter by
 * @param page - Page number (default 1)
 * @param perPage - Posts per page (default 9)
 * @returns Object with posts array and pagination metadata
 */
export async function getPostsByCategory(
  categoryId: number,
  page: number = 1,
  perPage: number = 9
): Promise<{ posts: any[]; total: number; totalPages: number }> {
  try {
    const url = buildApiUrl('/posts', {
      categories: categoryId,
      page,
      per_page: perPage,
      _embed: true,
      _fields: 'id,title,excerpt,slug,date,modified,author,featured_media,categories,tags,_embedded',
      status: 'publish',
      orderby: 'date',
      order: 'desc',
    });

    const response = await fetchWithTimeout(url, {
      next: {
        revalidate: 60, // 1 minute
        tags: ['wordpress', 'posts', `category-${categoryId}`],
      },
    });

    const posts = await response.json();

    // Extract pagination headers
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

    return {
      posts: Array.isArray(posts) ? posts : [],
      total,
      totalPages,
    };
  } catch (error: any) {
    console.error(`[WordPress API] getPostsByCategory error for category ${categoryId}:`, error.message);
    return { posts: [], total: 0, totalPages: 0 };
  }
}

/**
 * Search posts
 * Implementation: T028
 *
 * Searches posts by keyword with pagination support.
 * Returns posts array plus pagination metadata.
 * Uses shorter 2-minute cache due to dynamic nature.
 *
 * @param query - Search query string
 * @param page - Page number (default 1)
 * @param perPage - Posts per page (default 9)
 * @returns Object with posts array and pagination metadata
 */
export async function searchPosts(
  query: string,
  page: number = 1,
  perPage: number = 9
): Promise<{ posts: any[]; total: number; totalPages: number }> {
  try {
    // URL encode the search query
    const encodedQuery = encodeURIComponent(query);

    const url = buildApiUrl('/posts', {
      search: encodedQuery,
      page,
      per_page: perPage,
      _embed: true,
      _fields: 'id,title,excerpt,slug,date,modified,author,featured_media,categories,tags,_embedded',
      status: 'publish',
      orderby: 'relevance',
      order: 'desc',
    });

    const response = await fetchWithTimeout(url, {
      next: {
        revalidate: 120, // 2 minutes (shorter for search)
        tags: ['wordpress', 'search'],
      },
    });

    const posts = await response.json();

    // Extract pagination headers
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

    return {
      posts: Array.isArray(posts) ? posts : [],
      total,
      totalPages,
    };
  } catch (error: any) {
    console.error(`[WordPress API] searchPosts error for query "${query}":`, error.message);
    return { posts: [], total: 0, totalPages: 0 };
  }
}
