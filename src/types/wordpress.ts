/**
 * WordPress REST API v2 Types
 * Feature: Integração com Blog WordPress via API Headless
 * Date: 2025-10-14
 */

import { z } from 'zod';

// ============================================================================
// WordPress API Entity Types
// ============================================================================

/**
 * WordPress Post Status
 */
export type WordPressPostStatus = 'publish' | 'draft' | 'pending' | 'future' | 'private';

/**
 * WordPress Post Format
 */
export type WordPressPostFormat = 'standard' | 'aside' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio';

/**
 * Rendered content object from WordPress
 */
export const RenderedContentSchema = z.object({
  rendered: z.string(),
  protected: z.boolean().optional(),
});

export type RenderedContent = z.infer<typeof RenderedContentSchema>;

/**
 * WordPress Media Image Sizes
 */
export const MediaSizeSchema = z.object({
  file: z.string(),
  width: z.number(),
  height: z.number(),
  mime_type: z.string(),
  source_url: z.string().url(),
});

export type MediaSize = z.infer<typeof MediaSizeSchema>;

/**
 * WordPress Media (Featured Image)
 */
export const WordPressMediaSchema = z.object({
  id: z.number(),
  date: z.string().datetime(),
  slug: z.string(),
  type: z.literal('attachment'),
  link: z.string().url(),

  title: RenderedContentSchema,
  author: z.number(),

  caption: RenderedContentSchema.optional(),
  alt_text: z.string(),

  media_type: z.enum(['image', 'file', 'video', 'audio']),
  mime_type: z.string(),

  media_details: z.object({
    width: z.number(),
    height: z.number(),
    file: z.string(),
    filesize: z.number().optional(),

    sizes: z.record(MediaSizeSchema).optional(),

    image_meta: z.object({
      aperture: z.string().optional(),
      credit: z.string().optional(),
      camera: z.string().optional(),
      caption: z.string().optional(),
      created_timestamp: z.string().optional(),
      copyright: z.string().optional(),
      focal_length: z.string().optional(),
      iso: z.string().optional(),
      shutter_speed: z.string().optional(),
      title: z.string().optional(),
      orientation: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    }).optional(),
  }),

  source_url: z.string().url(),

  _links: z.record(z.any()).optional(),
});

export type WordPressMedia = z.infer<typeof WordPressMediaSchema>;

/**
 * WordPress Author (User)
 */
export const WordPressAuthorSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string().url().optional(),
  description: z.string(),
  link: z.string().url(),
  slug: z.string(),

  avatar_urls: z.record(z.string(), z.string().url()),

  _links: z.record(z.any()).optional(),
});

export type WordPressAuthor = z.infer<typeof WordPressAuthorSchema>;

/**
 * WordPress Category
 */
export const WordPressCategorySchema = z.object({
  id: z.number(),
  count: z.number(),
  description: z.string(),
  link: z.string().url(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.literal('category'),
  parent: z.number(),

  _links: z.record(z.any()).optional(),
});

export type WordPressCategory = z.infer<typeof WordPressCategorySchema>;

/**
 * WordPress Tag
 */
export const WordPressTagSchema = z.object({
  id: z.number(),
  count: z.number(),
  description: z.string(),
  link: z.string().url(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.literal('post_tag'),

  _links: z.record(z.any()).optional(),
});

export type WordPressTag = z.infer<typeof WordPressTagSchema>;

/**
 * WordPress Post (Article)
 */
export const WordPressPostSchema = z.object({
  id: z.number(),
  date: z.string().datetime(),
  date_gmt: z.string().datetime(),
  modified: z.string().datetime(),
  modified_gmt: z.string().datetime(),

  slug: z.string(),
  status: z.enum(['publish', 'draft', 'pending', 'future', 'private']),
  type: z.literal('post'),

  link: z.string().url(),

  title: RenderedContentSchema,
  content: RenderedContentSchema,
  excerpt: RenderedContentSchema,

  author: z.number(),
  featured_media: z.number(),

  comment_status: z.enum(['open', 'closed']),
  ping_status: z.enum(['open', 'closed']),

  sticky: z.boolean(),
  format: z.enum(['standard', 'aside', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio']),

  categories: z.array(z.number()),
  tags: z.array(z.number()),

  _embedded: z.object({
    'wp:featuredmedia': z.array(WordPressMediaSchema).optional(),
    'author': z.array(WordPressAuthorSchema).optional(),
    'wp:term': z.array(z.array(z.union([WordPressCategorySchema, WordPressTagSchema]))).optional(),
  }).optional(),

  _links: z.record(z.any()).optional(),
});

export type WordPressPost = z.infer<typeof WordPressPostSchema>;

// ============================================================================
// API Response Types
// ============================================================================

/**
 * WordPress API Pagination Headers
 */
export interface WordPressPaginationHeaders {
  'X-WP-Total': string;
  'X-WP-TotalPages': string;
  'Link': string;
}

/**
 * Paginated API Response
 */
export interface WordPressPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ============================================================================
// Client-Side Normalized Types
// ============================================================================

/**
 * Article Preview (for cards/lists)
 */
export interface ArticlePreview {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date;
  modifiedAt: Date;

  featuredImage: {
    url: string;
    alt: string;
    width: number;
    height: number;
  } | null;

  author: {
    id: number;
    name: string;
    avatarUrl: string;
  };

  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

/**
 * Full Article (for article detail page)
 */
export interface ArticleFull extends ArticlePreview {
  content: string;
  readingTimeMinutes: number;

  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;

  relatedArticles?: ArticlePreview[];
}

// ============================================================================
// Transformation Utilities
// ============================================================================

/**
 * Transform WordPress Post to ArticlePreview
 */
export function transformToArticlePreview(post: WordPressPost): ArticlePreview {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
  const author = post._embedded?.['author']?.[0];
  const categories = (post._embedded?.['wp:term']?.[0] || []) as WordPressCategory[];

  return {
    id: post.id,
    slug: post.slug,
    title: post.title.rendered,
    excerpt: post.excerpt.rendered,
    publishedAt: new Date(post.date),
    modifiedAt: new Date(post.modified),

    featuredImage: featuredMedia ? {
      url: featuredMedia.media_details.sizes?.medium?.source_url || featuredMedia.source_url,
      alt: featuredMedia.alt_text || post.title.rendered,
      width: featuredMedia.media_details.sizes?.medium?.width || featuredMedia.media_details.width,
      height: featuredMedia.media_details.sizes?.medium?.height || featuredMedia.media_details.height,
    } : null,

    author: {
      id: author?.id || post.author,
      name: author?.name || 'Unknown',
      avatarUrl: author?.avatar_urls?.['96'] || '/images/default-avatar.png',
    },

    categories: categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    })),
  };
}

/**
 * Transform WordPress Post to ArticleFull
 */
export function transformToArticleFull(
  post: WordPressPost,
  sanitizedContent: string,
  relatedArticles?: WordPressPost[]
): ArticleFull {
  const preview = transformToArticlePreview(post);
  const tags = (post._embedded?.['wp:term']?.[1] || []) as WordPressTag[];

  // Calculate reading time (avg 200 words/min)
  const wordCount = sanitizedContent.split(/\s+/).length;
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return {
    ...preview,
    content: sanitizedContent,
    readingTimeMinutes,

    tags: tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),

    relatedArticles: relatedArticles?.map(transformToArticlePreview),
  };
}
