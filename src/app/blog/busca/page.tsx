/**
 * Search Results Page
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Displays search results for blog articles with query highlighting.
 * Server Component with pagination support.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

import { searchPosts, getCategories } from '@/lib/wordpress/api';
import { transformToArticlePreview, WordPressPostSchema, WordPressCategorySchema } from '@/types/wordpress';
import { generateSearchMetadata } from '@/lib/wordpress/seo';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { ArticleSkeletonGrid } from '@/components/blog/ArticleSkeleton';
import { SearchBar } from '@/components/blog/SearchBar';
import { Pagination } from '@/components/blog/Pagination';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || '';

  // Use SEO metadata generator with noindex for search pages
  return generateSearchMetadata(query);
}

/**
 * Highlight search terms in text
 * Simple string replacement with <mark> tags
 */
function highlightSearchTerms(text: string, query: string): string {
  if (!query || !text) return text;

  const terms = query.toLowerCase().split(' ').filter(Boolean);
  let highlighted = text;

  terms.forEach((term) => {
    // Case-insensitive replacement
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 text-gray-900">$1</mark>');
  });

  return highlighted;
}

/**
 * Search Content Component (async server component)
 */
async function SearchContent({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const currentPage = parseInt(params.page || '1', 10);

  // Redirect to blog if no query
  if (!query.trim()) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Digite algo para buscar
        </h2>
        <p className="text-gray-600 mb-6">
          Use a barra de busca acima para encontrar artigos
        </p>
        <Link
          href="/blog"
          className="inline-block px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
        >
          Ver todos os artigos
        </Link>
      </div>
    );
  }

  try {
    // Fetch search results and categories in parallel
    const [rawSearchResults, rawCategories] = await Promise.all([
      searchPosts(query, currentPage, 9),
      getCategories(),
    ]);

    // Validate and transform categories
    const categories = rawCategories
      .map((cat) => {
        try {
          return WordPressCategorySchema.parse(cat);
        } catch (error) {
          console.error('[Search Page] Invalid category:', error);
          return null;
        }
      })
      .filter(Boolean) as any[];

    // Validate and transform posts
    const articles = rawSearchResults.posts
      .map((post) => {
        try {
          const validated = WordPressPostSchema.parse(post);
          const article = transformToArticlePreview(validated);

          // Highlight search terms in title and excerpt
          return {
            ...article,
            title: highlightSearchTerms(article.title, query),
            excerpt: highlightSearchTerms(article.excerpt, query),
          };
        } catch (error) {
          console.error('[Search Page] Invalid post:', error);
          return null;
        }
      })
      .filter(Boolean) as any[];

    // Empty state
    if (articles.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
            <svg
              className="w-10 h-10 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Nenhum resultado para "{query}"
          </h2>
          <p className="text-gray-600 mb-6">
            Tente buscar com palavras diferentes ou explore as categorias abaixo
          </p>

          {/* Category suggestions */}
          {categories.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Explore por categoria:
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    href={`/blog/categoria/${category.slug}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/blog"
              className="inline-block px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Ver todos os artigos
            </Link>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Results count */}
        <div className="mb-8 text-center">
          <p className="text-gray-600">
            Encontramos{' '}
            <span className="font-semibold text-gray-900">
              {rawSearchResults.total} {rawSearchResults.total === 1 ? 'resultado' : 'resultados'}
            </span>
            {' '}para "{query}"
          </p>
        </div>

        {/* Search Bar (pre-filled) */}
        <SearchBar initialQuery={query} />

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              priority={index < 3}
            />
          ))}
        </div>

        {/* Pagination */}
        {rawSearchResults.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={rawSearchResults.totalPages}
            baseUrl={`/blog/busca?q=${encodeURIComponent(query)}`}
          />
        )}
      </>
    );
  } catch (error) {
    console.error('[Search Page] Error fetching search results:', error);

    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <svg
            className="w-10 h-10 text-red-600"
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Erro ao buscar artigos
        </h2>
        <p className="text-gray-600 mb-6">
          Tente novamente em alguns instantes.
        </p>
        <Link
          href="/blog"
          className="inline-block px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
        >
          Voltar para o Blog
        </Link>
      </div>
    );
  }
}

/**
 * Search Page Component
 */
export default async function SearchPage(props: SearchPageProps) {
  const params = await props.searchParams;
  const query = params.q || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <header className="text-center mb-12">
          <nav className="mb-4 text-sm text-gray-600">
            <Link href="/" className="hover:text-cyan-600">Início</Link>
            {' / '}
            <Link href="/blog" className="hover:text-cyan-600">Blog</Link>
            {' / '}
            <span className="text-gray-900 font-medium">Busca</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {query ? `Resultados para "${query}"` : 'Busca'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encontre artigos sobre lentes de contato e saúde ocular
          </p>
        </header>

        {/* Search Content with Suspense */}
        <Suspense fallback={<ArticleSkeletonGrid count={9} />}>
          <SearchContent searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
