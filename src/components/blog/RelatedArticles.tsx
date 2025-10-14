/**
 * RelatedArticles Component
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Displays a grid of related articles at the bottom of blog posts.
 * Uses ArticleCard component for consistent styling.
 */

import { ArticleCard } from './ArticleCard';
import type { ArticlePreview } from '@/types/wordpress';

interface RelatedArticlesProps {
  /**
   * Array of related article previews
   * Maximum 3 articles recommended for optimal layout
   */
  articles: ArticlePreview[];
}

/**
 * RelatedArticles Component
 *
 * Shows related blog articles in a responsive grid layout.
 * Empty state is handled gracefully by not rendering the section.
 *
 * @param articles - Related article previews (max 3 recommended)
 */
export function RelatedArticles({ articles }: RelatedArticlesProps) {
  // Don't render if no related articles
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-gray-200">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Artigos Relacionados
        </h2>
        <p className="text-gray-600">
          Continue aprendendo sobre cuidados com lentes de contato
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            priority={false}
          />
        ))}
      </div>
    </section>
  );
}
