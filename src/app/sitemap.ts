import { MetadataRoute } from 'next';
import { getPosts, getCategories } from '@/lib/wordpress/api';

/**
 * Dynamic sitemap generation
 * Includes all static pages plus dynamic blog content from WordPress
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://svlentes.shop';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/agendar-consulta`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/success`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cancel`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ];

  try {
    // Fetch blog data from WordPress
    const [posts, categories] = await Promise.all([
      getPosts({ perPage: 100 }), // Get up to 100 posts for sitemap
      getCategories(),
    ]);

    // Blog listing page
    const blogPages: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ];

    // Individual blog posts
    const postPages: MetadataRoute.Sitemap = posts.map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.modified ? new Date(post.modified) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    // Category pages
    const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
      url: `${baseUrl}/blog/categoria/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Combine all pages
    // Note: Search pages (/blog/busca) are intentionally excluded as they should not be indexed
    return [...staticPages, ...blogPages, ...postPages, ...categoryPages];
  } catch (error) {
    console.error('[Sitemap] Error fetching blog data:', error);
    // Return static pages only if WordPress is unavailable
    return staticPages;
  }
}