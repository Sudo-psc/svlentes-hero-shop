/**
 * WordPress API Data Transformers
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Transforms raw WordPress API responses into normalized,
 * client-friendly data structures for React components.
 *
 * These functions are re-exported from src/types/wordpress.ts
 * where they are defined alongside the type definitions.
 */

export {
  transformToArticlePreview,
  transformToArticleFull,
  type ArticlePreview,
  type ArticleFull,
  type WordPressPost,
} from '@/types/wordpress';
