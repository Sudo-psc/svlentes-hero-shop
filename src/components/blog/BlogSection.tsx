/**
 * BlogSection Component
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Displays recent blog articles on the landing page.
 * Server Component that fetches data from WordPress API.
 */

import { Suspense } from 'react';
import { getPosts } from '@/lib/wordpress/api';
import { transformToArticlePreview } from '@/lib/wordpress/transformers';
import { WordPressPostSchema } from '@/types/wordpress';
import { ArticleCard } from './ArticleCard';
import { ArticleSkeletonGrid } from './ArticleSkeleton';

/**
 * BlogContent Component (async server component)
 */
async function BlogContent() {
  try {
    // Fetch posts from WordPress API
    const rawPosts = await getPosts({ perPage: 6 });

    // Validate and transform posts
    const validPosts = rawPosts
      .map(post => {
        try {
          // Validate with Zod schema
          const validated = WordPressPostSchema.parse(post);
          return transformToArticlePreview(validated);
        } catch (error) {
          console.error('[BlogSection] Invalid post data:', error);
          return null;
        }
      })
      .filter(Boolean);

    // Empty state
    if (validPosts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 mb-4">
            <svg
              className="w-8 h-8 text-cyan-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Em breve, artigos sobre cuidados com lentes
          </h3>
          <p className="text-gray-600">
            Estamos preparando conteúdo educativo de qualidade para você.
          </p>
        </div>
      );
    }

    // Render article grid
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {validPosts.map((article, index) => article && (
          <ArticleCard
            key={article.id}
            article={article}
            priority={index === 0}
          />
        ))}
      </div>
    );
  } catch (error) {
    console.error('[BlogSection] Error fetching posts:', error);

    // Error fallback UI
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Conteúdo temporariamente indisponível
        </h3>
        <p className="text-gray-600">
          Tente novamente em alguns instantes.
        </p>
      </div>
    );
  }
}

/**
 * BlogSection Component (main export)
 *
 * Landing page section displaying recent blog articles.
 * Uses Suspense for loading state.
 */
export function BlogSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Conteúdo Educativo
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dicas e orientações sobre cuidados com lentes de contato,
            saúde ocular e muito mais.
          </p>
        </div>

        {/* Blog Content with Suspense */}
        <Suspense fallback={<ArticleSkeletonGrid count={6} />}>
          <BlogContent />
        </Suspense>

        {/* View All Link */}
        <div className="text-center mt-12">
          <a
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Ver todos os artigos
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
