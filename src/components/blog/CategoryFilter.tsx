/**
 * CategoryFilter Component
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Displays category filter pills for blog navigation.
 * Horizontal scrollable on mobile, multi-row on desktop.
 */

import Link from 'next/link';
import type { WordPressCategory } from '@/types/wordpress';

interface CategoryFilterProps {
  /**
   * Array of WordPress categories
   */
  categories: WordPressCategory[];

  /**
   * Currently active category slug (null for "Todos")
   */
  activeCategorySlug: string | null;
}

/**
 * CategoryFilter Component
 *
 * Renders category filter pills with active state highlighting.
 * Supports horizontal scroll on mobile for better UX.
 *
 * @param categories - Available WordPress categories
 * @param activeCategorySlug - Current active category slug
 */
export function CategoryFilter({ categories, activeCategorySlug }: CategoryFilterProps) {
  return (
    <nav aria-label="Filtrar por categoria" className="mb-8">
      <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* "Todos" option */}
        <Link
          href="/blog"
          className={`
            px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors
            ${
              activeCategorySlug === null
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
          aria-current={activeCategorySlug === null ? 'page' : undefined}
        >
          Todos
        </Link>

        {/* Category pills */}
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/blog/categoria/${category.slug}`}
            className={`
              px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors
              ${
                activeCategorySlug === category.slug
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            aria-current={activeCategorySlug === category.slug ? 'page' : undefined}
          >
            {category.name}
            {category.count && (
              <span className="ml-1.5 opacity-75">({category.count})</span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
