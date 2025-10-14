/**
 * WordPress API Cache Utilities
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Provides ISR (Incremental Static Regeneration) cache configuration
 * for Next.js fetch operations with WordPress API.
 */

/**
 * Default revalidation time in seconds (1 minute)
 * Based on clarification: near real-time updates with 1-minute revalidation
 */
export const DEFAULT_REVALIDATE_TIME = 60; // 1 minute

/**
 * Cache configuration for different content types
 */
export const CACHE_TIMES = {
  /**
   * Posts list - revalidate every 1 minute
   */
  POSTS: 60,

  /**
   * Individual post - revalidate every 1 minute
   */
  POST: 60,

  /**
   * Categories - revalidate every 10 minutes (less frequently changed)
   */
  CATEGORIES: 600,

  /**
   * Related posts - cache for 5 minutes
   */
  RELATED: 300,

  /**
   * Search results - cache for 2 minutes (shorter due to dynamic nature)
   */
  SEARCH: 120,
} as const;

/**
 * Base cache tags for content types
 */
export const CACHE_TAGS = {
  WORDPRESS: 'wordpress',
  POSTS: 'posts',
  POST: 'post',
  CATEGORIES: 'categories',
  SEARCH: 'search',
} as const;

/**
 * Get ISR cache configuration for Next.js fetch
 *
 * Returns Next.js fetch cache options for ISR with appropriate
 * revalidation time and cache tags.
 *
 * @param revalidate - Revalidation time in seconds
 * @param tags - Cache tags for targeted revalidation
 * @returns Next.js fetch options object
 *
 * @example
 * ```typescript
 * const res = await fetch(url, {
 *   ...getCacheConfig(CACHE_TIMES.POSTS, ['wordpress', 'posts'])
 * });
 * ```
 */
export function getCacheConfig(
  revalidate: number = DEFAULT_REVALIDATE_TIME,
  tags: string[] = [CACHE_TAGS.WORDPRESS]
) {
  return {
    next: {
      revalidate,
      tags,
    },
  };
}

/**
 * Build cache tags for a specific post
 *
 * @param slug - Post slug
 * @returns Array of cache tags
 *
 * @example
 * ```typescript
 * const tags = buildPostCacheTags('cuidados-lentes-contato');
 * // Returns: ['wordpress', 'post', 'post-cuidados-lentes-contato']
 * ```
 */
export function buildPostCacheTags(slug: string): string[] {
  return [
    CACHE_TAGS.WORDPRESS,
    CACHE_TAGS.POST,
    `${CACHE_TAGS.POST}-${slug}`,
  ];
}

/**
 * Build cache tags for category posts
 *
 * @param categorySlug - Category slug
 * @returns Array of cache tags
 */
export function buildCategoryCacheTags(categorySlug: string): string[] {
  return [
    CACHE_TAGS.WORDPRESS,
    CACHE_TAGS.POSTS,
    `category-${categorySlug}`,
  ];
}

/**
 * Build cache tags for search results
 *
 * @param query - Search query
 * @returns Array of cache tags
 */
export function buildSearchCacheTags(query: string): string[] {
  return [
    CACHE_TAGS.WORDPRESS,
    CACHE_TAGS.SEARCH,
    `search-${encodeURIComponent(query)}`,
  ];
}

/**
 * Get cache configuration for posts list
 *
 * @param additional Tags - Additional cache tags
 * @returns Cache configuration object
 */
export function getPostsListCache(additionalTags: string[] = []) {
  return getCacheConfig(
    CACHE_TIMES.POSTS,
    [CACHE_TAGS.WORDPRESS, CACHE_TAGS.POSTS, ...additionalTags]
  );
}

/**
 * Get cache configuration for single post
 *
 * @param slug - Post slug
 * @returns Cache configuration object
 */
export function getSinglePostCache(slug: string) {
  return getCacheConfig(
    CACHE_TIMES.POST,
    buildPostCacheTags(slug)
  );
}

/**
 * Get cache configuration for categories
 *
 * @returns Cache configuration object
 */
export function getCategoriesCache() {
  return getCacheConfig(
    CACHE_TIMES.CATEGORIES,
    [CACHE_TAGS.WORDPRESS, CACHE_TAGS.CATEGORIES]
  );
}

/**
 * Get cache configuration for related posts
 *
 * @param postSlug - Current post slug
 * @returns Cache configuration object
 */
export function getRelatedPostsCache(postSlug: string) {
  return getCacheConfig(
    CACHE_TIMES.RELATED,
    [CACHE_TAGS.WORDPRESS, CACHE_TAGS.POSTS, `related-${postSlug}`]
  );
}

/**
 * Get cache configuration for search results
 *
 * @param query - Search query
 * @returns Cache configuration object
 */
export function getSearchCache(query: string) {
  return getCacheConfig(
    CACHE_TIMES.SEARCH,
    buildSearchCacheTags(query)
  );
}
