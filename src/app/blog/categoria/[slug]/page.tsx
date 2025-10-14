/**
 * Category Page
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Dynamic route for category-filtered blog articles.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategories, getPostsByCategory } from '@/lib/wordpress/api';
import { transformToArticlePreview, WordPressPostSchema, WordPressCategorySchema } from '@/types/wordpress';
import { generateCategoryMetadata } from '@/lib/wordpress/seo';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { CategoryFilter } from '@/components/blog/CategoryFilter';
import { SearchBar } from '@/components/blog/SearchBar';
import { Pagination } from '@/components/blog/Pagination';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c: any) => c.slug === slug);

  if (!category) {
    return { title: 'Categoria não encontrada - Blog SV Lentes' };
  }

  // Use comprehensive SEO metadata generator
  return generateCategoryMetadata(
    category.name,
    slug,
    category.description
  );
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10);

  const [categories, rawCategories] = await Promise.all([
    getCategories(),
    getCategories(),
  ]);

  const category = categories.find((c: any) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const { posts: rawPosts, totalPages } = await getPostsByCategory(category.id, currentPage, 9);

  const validCategories = rawCategories
    .map((cat: any) => {
      try {
        return WordPressCategorySchema.parse(cat);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as any[];

  const articles = rawPosts
    .map((post: any) => {
      try {
        const validated = WordPressPostSchema.parse(post);
        return transformToArticlePreview(validated);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as any[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <nav className="mb-4 text-sm text-gray-600">
            <Link href="/" className="hover:text-cyan-600">Início</Link>
            {' / '}
            <Link href="/blog" className="hover:text-cyan-600">Blog</Link>
            {' / '}
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
        </header>

        <CategoryFilter categories={validCategories} activeCategorySlug={slug} />
        <SearchBar />

        {articles.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhum artigo nesta categoria
            </h2>
            <p className="text-gray-600 mb-6">Explore outras categorias ou volte para o blog principal.</p>
            <Link href="/blog" className="inline-block px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
              Ver todos os artigos
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article: any, index: number) => (
                <ArticleCard key={article.id} article={article} priority={index < 3} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl={`/blog/categoria/${slug}`}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
