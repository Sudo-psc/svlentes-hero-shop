/**
 * Structured Data (JSON-LD) Generator
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Generates schema.org structured data in JSON-LD format for:
 * - Medical web pages (healthcare context)
 * - Articles with author and publisher information
 * - Breadcrumb navigation
 * - Organization information
 *
 * This improves search engine understanding and enables rich results.
 */

import type { ArticleFull } from '@/types/wordpress';

/**
 * Base configuration for structured data
 */
const STRUCTURED_DATA_CONFIG = {
  siteName: 'SV Lentes',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://svlentes.shop',
  organizationName: 'Saraiva Vision - SV Lentes',
  logo: 'https://svlentes.shop/images/logo.svg',
  contactPhone: '+5533999898026',
  contactEmail: 'saraivavision@gmail.com',
  medicalSpecialty: 'Ophthalmology',
  responsiblePhysician: {
    name: 'Dr. Philipe Saraiva Cruz',
    crm: 'CRM-MG 69.870',
  },
};

/**
 * Organization Schema
 * Represents SV Lentes as an organization
 */
export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  contactPoint: {
    '@type': 'ContactPoint';
    telephone: string;
    email: string;
    contactType: 'customer service';
    areaServed: 'BR';
    availableLanguage: 'Portuguese';
  };
}

/**
 * Person Schema (Author)
 * Represents article author
 */
export interface PersonSchema {
  '@type': 'Person';
  name: string;
}

/**
 * Medical Web Page Schema
 * Specialized schema for healthcare content
 */
export interface MedicalWebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'MedicalWebPage';
  '@id': string;
  url: string;
  name: string;
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified: string;
  author: PersonSchema;
  publisher: OrganizationSchema;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  about: {
    '@type': 'MedicalSpecialty';
    name: string;
  };
  medicalAudience?: {
    '@type': 'MedicalAudience';
    audienceType: 'Patient' | 'MedicalResearcher';
  };
}

/**
 * Article Schema
 * Standard article schema (alternative to MedicalWebPage)
 */
export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article';
  '@id': string;
  url: string;
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified: string;
  author: PersonSchema;
  publisher: OrganizationSchema;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  articleSection: string;
  keywords: string[];
  wordCount?: number;
}

/**
 * Breadcrumb List Schema
 * Navigation breadcrumb for SEO
 */
export interface BreadcrumbListSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

/**
 * Generate Organization schema
 * Represents SV Lentes organization
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: STRUCTURED_DATA_CONFIG.organizationName,
    url: STRUCTURED_DATA_CONFIG.siteUrl,
    logo: STRUCTURED_DATA_CONFIG.logo,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: STRUCTURED_DATA_CONFIG.contactPhone,
      email: STRUCTURED_DATA_CONFIG.contactEmail,
      contactType: 'customer service',
      areaServed: 'BR',
      availableLanguage: 'Portuguese',
    },
  };
}

/**
 * Generate Person schema for article author
 *
 * @param authorName - Author's name
 */
function generatePersonSchema(authorName: string): PersonSchema {
  return {
    '@type': 'Person',
    name: authorName,
  };
}

/**
 * Generate MedicalWebPage schema for article
 * Healthcare-specific structured data
 *
 * @param article - Full article object
 * @returns MedicalWebPage JSON-LD schema
 */
export function generateMedicalWebPageSchema(article: ArticleFull): MedicalWebPageSchema {
  const canonicalUrl = `${STRUCTURED_DATA_CONFIG.siteUrl}/blog/${article.slug}`;
  const imageUrl = article.featuredImage?.url || `${STRUCTURED_DATA_CONFIG.siteUrl}/images/blog-placeholder.webp`;

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': canonicalUrl,
    url: canonicalUrl,
    name: article.title,
    headline: article.title,
    description: article.excerpt.replace(/<[^>]*>/g, '').substring(0, 160),
    image: imageUrl,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.modifiedAt.toISOString(),
    author: generatePersonSchema(article.author.name),
    publisher: generateOrganizationSchema(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    about: {
      '@type': 'MedicalSpecialty',
      name: STRUCTURED_DATA_CONFIG.medicalSpecialty,
    },
    medicalAudience: {
      '@type': 'MedicalAudience',
      audienceType: 'Patient',
    },
  };
}

/**
 * Generate Article schema for article
 * Standard article schema (alternative to MedicalWebPage)
 *
 * @param article - Full article object
 * @returns Article JSON-LD schema
 */
export function generateArticleSchema(article: ArticleFull): ArticleSchema {
  const canonicalUrl = `${STRUCTURED_DATA_CONFIG.siteUrl}/blog/${article.slug}`;
  const imageUrl = article.featuredImage?.url || `${STRUCTURED_DATA_CONFIG.siteUrl}/images/blog-placeholder.webp`;

  // Extract keywords from tags
  const keywords = article.tags.map((tag) => tag.name);

  // Primary category
  const primaryCategory = article.categories[0]?.name || 'Blog';

  // Approximate word count from content
  const wordCount = article.content
    ? article.content.split(/\s+/).length
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': canonicalUrl,
    url: canonicalUrl,
    headline: article.title,
    description: article.excerpt.replace(/<[^>]*>/g, '').substring(0, 160),
    image: imageUrl,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.modifiedAt.toISOString(),
    author: generatePersonSchema(article.author.name),
    publisher: generateOrganizationSchema(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    articleSection: primaryCategory,
    keywords,
    ...(wordCount && { wordCount }),
  };
}

/**
 * Generate breadcrumb schema for article page
 * Navigation: Home > Blog > Category > Article
 *
 * @param article - Full article object
 * @returns BreadcrumbList JSON-LD schema
 */
export function generateArticleBreadcrumbSchema(article: ArticleFull): BreadcrumbListSchema {
  const primaryCategory = article.categories[0];

  const breadcrumbItems = [
    {
      '@type': 'ListItem' as const,
      position: 1,
      name: 'Início',
      item: STRUCTURED_DATA_CONFIG.siteUrl,
    },
    {
      '@type': 'ListItem' as const,
      position: 2,
      name: 'Blog',
      item: `${STRUCTURED_DATA_CONFIG.siteUrl}/blog`,
    },
  ];

  // Add category if available
  if (primaryCategory) {
    breadcrumbItems.push({
      '@type': 'ListItem' as const,
      position: 3,
      name: primaryCategory.name,
      item: `${STRUCTURED_DATA_CONFIG.siteUrl}/blog/categoria/${primaryCategory.slug}`,
    });
  }

  // Add current article (last position)
  breadcrumbItems.push({
    '@type': 'ListItem' as const,
    position: primaryCategory ? 4 : 3,
    name: article.title,
    item: `${STRUCTURED_DATA_CONFIG.siteUrl}/blog/${article.slug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };
}

/**
 * Generate breadcrumb schema for blog listing page
 * Navigation: Home > Blog
 *
 * @returns BreadcrumbList JSON-LD schema
 */
export function generateBlogBreadcrumbSchema(): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: STRUCTURED_DATA_CONFIG.siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${STRUCTURED_DATA_CONFIG.siteUrl}/blog`,
      },
    ],
  };
}

/**
 * Generate breadcrumb schema for category page
 * Navigation: Home > Blog > Category
 *
 * @param categoryName - Category name
 * @param categorySlug - Category slug
 * @returns BreadcrumbList JSON-LD schema
 */
export function generateCategoryBreadcrumbSchema(
  categoryName: string,
  categorySlug: string
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: STRUCTURED_DATA_CONFIG.siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${STRUCTURED_DATA_CONFIG.siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `${STRUCTURED_DATA_CONFIG.siteUrl}/blog/categoria/${categorySlug}`,
      },
    ],
  };
}

/**
 * Combine multiple schemas into a single JSON-LD graph
 * Useful for embedding multiple schemas in one script tag
 *
 * @param schemas - Array of schema objects
 * @returns Combined JSON-LD object with @graph
 */
export function combineSchemas(...schemas: any[]): object {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
}

/**
 * Convert schema object to JSON-LD script tag content
 * Ready to be embedded in HTML <script type="application/ld+json">
 *
 * @param schema - Schema object
 * @returns Stringified JSON-LD
 */
export function schemaToJsonLd(schema: object): string {
  return JSON.stringify(schema, null, 2);
}
