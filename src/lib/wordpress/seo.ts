/**
 * SEO Metadata Generator
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Generates comprehensive SEO metadata for blog articles including:
 * - Next.js Metadata object with title, description, keywords
 * - Open Graph tags for social sharing
 * - Twitter Cards for Twitter/X platform
 * - Article-specific metadata (published_time, author, section)
 */

import type { Metadata } from 'next';
import type { ArticleFull, ArticlePreview } from '@/types/wordpress';

/**
 * Base configuration for SEO metadata
 */
const SEO_CONFIG = {
  siteName: 'SV Lentes',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://svlentes.shop',
  defaultImage: '/images/blog-og-default.webp',
  twitterHandle: '@svlentes',
  locale: 'pt_BR',
  type: 'website',
};

/**
 * Generate article keywords from tags and categories
 *
 * @param article - Full article object with tags and categories
 * @returns Comma-separated keyword string
 */
export function generateArticleKeywords(article: ArticleFull): string {
  const keywords: string[] = [];

  // Add category names
  article.categories.forEach((cat) => keywords.push(cat.name));

  // Add tag names
  article.tags.forEach((tag) => keywords.push(tag.name));

  // Add default healthcare keywords
  keywords.push('lentes de contato', 'saúde ocular', 'oftalmologia', 'SV Lentes');

  // Remove duplicates and join
  return Array.from(new Set(keywords)).join(', ');
}

/**
 * Truncate text to specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Clean HTML tags from text
 *
 * @param html - HTML string
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Generate Open Graph image URL
 * Ensures proper dimensions (1200x630) for social sharing
 *
 * @param imageUrl - Featured image URL
 * @returns Optimized Open Graph image URL
 */
export function generateOgImageUrl(imageUrl?: string): string {
  if (!imageUrl) {
    return `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`;
  }

  // Return featured image URL (WordPress should already provide optimized size)
  return imageUrl;
}

/**
 * Generate article metadata for Next.js Metadata API
 * Comprehensive SEO metadata including Open Graph and Twitter Cards
 *
 * @param article - Full article object
 * @returns Next.js Metadata object
 */
export function generateArticleMetadata(article: ArticleFull): Metadata {
  const canonicalUrl = `${SEO_CONFIG.siteUrl}/blog/${article.slug}`;
  const ogImageUrl = generateOgImageUrl(article.featuredImage?.url);

  // Clean and truncate description
  const cleanExcerpt = stripHtmlTags(article.excerpt);
  const description = truncateText(cleanExcerpt, 160);

  // Generate keywords
  const keywords = generateArticleKeywords(article);

  // Primary category for og:article:section
  const primaryCategory = article.categories[0]?.name || 'Blog';

  return {
    // Basic metadata
    title: `${article.title} | Blog SV Lentes`,
    description,
    keywords,

    // Authors
    authors: [
      {
        name: article.author.name,
      },
    ],

    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },

    // Open Graph metadata
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url: canonicalUrl,
      siteName: SEO_CONFIG.siteName,
      locale: SEO_CONFIG.locale,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.featuredImage?.alt || article.title,
        },
      ],

      // Article-specific Open Graph tags
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.modifiedAt.toISOString(),
      authors: [article.author.name],
      section: primaryCategory,
      tags: article.tags.map((tag) => tag.name),
    },

    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      site: SEO_CONFIG.twitterHandle,
      creator: SEO_CONFIG.twitterHandle,
      title: article.title,
      description,
      images: [ogImageUrl],
    },

    // Robots directives
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  };
}

/**
 * Generate metadata for blog listing page
 *
 * @returns Next.js Metadata object
 */
export function generateBlogListingMetadata(): Metadata {
  const title = 'Blog - SV Lentes | Conteúdo sobre Lentes de Contato';
  const description =
    'Artigos educativos sobre cuidados com lentes de contato, saúde ocular, dicas de uso e muito mais. Conteúdo atualizado por especialistas.';
  const canonicalUrl = `${SEO_CONFIG.siteUrl}/blog`;
  const ogImageUrl = `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`;

  return {
    title,
    description,
    keywords: 'blog lentes de contato, saúde ocular, oftalmologia, cuidados com lentes, SV Lentes',

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: 'website',
      title,
      description,
      url: canonicalUrl,
      siteName: SEO_CONFIG.siteName,
      locale: SEO_CONFIG.locale,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Blog SV Lentes - Conteúdo Educativo sobre Lentes de Contato',
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      site: SEO_CONFIG.twitterHandle,
      title,
      description,
      images: [ogImageUrl],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate metadata for category page
 *
 * @param categoryName - Category name
 * @param categorySlug - Category slug
 * @param categoryDescription - Optional category description
 * @returns Next.js Metadata object
 */
export function generateCategoryMetadata(
  categoryName: string,
  categorySlug: string,
  categoryDescription?: string
): Metadata {
  const title = `${categoryName} - Blog SV Lentes`;
  const description = categoryDescription || `Artigos sobre ${categoryName}`;
  const canonicalUrl = `${SEO_CONFIG.siteUrl}/blog/categoria/${categorySlug}`;
  const ogImageUrl = `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`;

  return {
    title,
    description,
    keywords: `${categoryName}, lentes de contato, saúde ocular, SV Lentes`,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: 'website',
      title,
      description,
      url: canonicalUrl,
      siteName: SEO_CONFIG.siteName,
      locale: SEO_CONFIG.locale,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${categoryName} - Blog SV Lentes`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      site: SEO_CONFIG.twitterHandle,
      title,
      description,
      images: [ogImageUrl],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate metadata for search results page
 *
 * @param query - Search query string
 * @returns Next.js Metadata object
 */
export function generateSearchMetadata(query: string): Metadata {
  const title = query
    ? `Busca: "${query}" - Blog SV Lentes`
    : 'Busca - Blog SV Lentes';
  const description = query
    ? `Resultados da busca por "${query}" no Blog SV Lentes`
    : 'Busque artigos sobre lentes de contato e saúde ocular';
  const canonicalUrl = query
    ? `${SEO_CONFIG.siteUrl}/blog/busca?q=${encodeURIComponent(query)}`
    : `${SEO_CONFIG.siteUrl}/blog/busca`;

  return {
    title,
    description,

    // Search pages should not be indexed by search engines
    robots: {
      index: false,
      follow: false,
      noarchive: true,
    },

    // No canonical URL for search pages (to prevent indexing)
    // No Open Graph or Twitter metadata (not meant for sharing)
  };
}

/**
 * Generate article preview text for social sharing
 * Optimized length for Open Graph descriptions (155-160 characters)
 *
 * @param article - Article preview or full article
 * @returns Optimized preview text
 */
export function generateArticlePreview(article: ArticlePreview | ArticleFull): string {
  const cleanExcerpt = stripHtmlTags(article.excerpt);
  return truncateText(cleanExcerpt, 155);
}
