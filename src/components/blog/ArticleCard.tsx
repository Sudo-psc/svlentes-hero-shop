/**
 * ArticleCard Component
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Displays article preview card with image, title, excerpt, date, and CTA.
 * Used in blog listing and related articles sections.
 */

import Image from 'next/image';
import Link from 'next/link';
import type { ArticlePreview } from '@/types/wordpress';

interface ArticleCardProps {
  article: ArticlePreview;
  priority?: boolean;
}

export function ArticleCard({ article, priority = false }: ArticleCardProps) {
  const {
    slug,
    title,
    excerpt,
    publishedAt,
    featuredImage,
    author,
    categories,
  } = article;

  // Format date to Brazilian format (dd/mm/yyyy)
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(publishedAt);

  // Truncate excerpt to 150 characters
  const truncatedExcerpt = excerpt.length > 150
    ? excerpt.substring(0, 150) + '...'
    : excerpt;

  // Remove HTML tags from excerpt for display
  const cleanExcerpt = truncatedExcerpt.replace(/<[^>]*>/g, '');

  return (
    <article className="group flex flex-col h-full bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* Featured Image */}
      <Link href={`/blog/${slug}`} className="relative aspect-[3/2] overflow-hidden">
        <Image
          src={featuredImage?.url || '/images/blog-placeholder.webp'}
          alt={featuredImage?.alt || title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
        />
        {/* Category Badge */}
        {categories.length > 0 && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-cyan-600 text-white text-xs font-semibold rounded-full">
              {categories[0].name}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-grow p-6">
        {/* Title */}
        <Link href={`/blog/${slug}`}>
          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-cyan-600 transition-colors">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
          {cleanExcerpt}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Author & Date */}
          <div className="flex items-center gap-3">
            <Image
              src={author.avatarUrl}
              alt={author.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="text-sm">
              <p className="text-gray-900 font-medium">{author.name}</p>
              <time className="text-gray-500" dateTime={publishedAt.toISOString()}>
                {formattedDate}
              </time>
            </div>
          </div>

          {/* CTA */}
          <Link
            href={`/blog/${slug}`}
            className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm flex items-center gap-1 transition-colors"
          >
            Ler mais
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
          </Link>
        </div>
      </div>
    </article>
  );
}
