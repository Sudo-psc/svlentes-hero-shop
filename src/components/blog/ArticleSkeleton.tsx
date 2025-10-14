/**
 * ArticleSkeleton Component
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Loading skeleton for article cards with shimmer effect.
 * Provides visual feedback while WordPress API data loads.
 */

export function ArticleSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-[3/2] bg-gray-200" />

      {/* Content Skeleton */}
      <div className="flex flex-col flex-grow p-6 space-y-4">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>

        {/* Excerpt Skeleton */}
        <div className="space-y-2 flex-grow">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>

        {/* Meta Info Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {/* Avatar Skeleton */}
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          </div>
          {/* CTA Skeleton */}
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * ArticleSkeletonGrid Component
 *
 * Grid of loading skeletons matching the article grid layout.
 * Use this as Suspense fallback for blog sections.
 */
export function ArticleSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <ArticleSkeleton key={index} />
      ))}
    </div>
  );
}
