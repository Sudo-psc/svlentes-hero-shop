/**
 * Pagination Component
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Accessible pagination component for blog listing pages.
 * Supports keyboard navigation and ARIA labels.
 */

import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Base URL for pagination links (e.g., '/blog', '/blog/categoria/cuidados')
   */
  baseUrl: string;

  /**
   * Maximum number of page buttons to show (default 7)
   */
  maxButtons?: number;
}

/**
 * Pagination Component
 *
 * Renders pagination controls with Previous/Next buttons and page numbers.
 * Automatically handles ellipsis for large page counts.
 *
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param baseUrl - Base URL for links
 * @param maxButtons - Maximum page buttons to display
 */
export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  maxButtons = 7,
}: PaginationProps) {
  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  const buildUrl = (page: number): string => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${page}`;
  };

  // Calculate which page buttons to show
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= maxButtons) {
      // Show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const sideButtons = Math.floor((maxButtons - 3) / 2); // Reserve 3 for first, last, ellipsis

    if (currentPage <= sideButtons + 2) {
      // Near start: [1, 2, 3, 4, ..., last]
      for (let i = 1; i <= maxButtons - 2; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - sideButtons - 1) {
      // Near end: [1, ..., n-3, n-2, n-1, n]
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - (maxButtons - 3); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Middle: [1, ..., current-1, current, current+1, ..., last]
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label="Paginação de artigos"
      className="flex items-center justify-center gap-2 mt-12"
    >
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="
            flex items-center gap-1 px-3 py-2
            text-gray-700 bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 hover:border-gray-400
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
            transition-colors
          "
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Anterior</span>
        </Link>
      ) : (
        <button
          disabled
          className="
            flex items-center gap-1 px-3 py-2
            text-gray-400 bg-gray-100 border border-gray-200 rounded-md
            cursor-not-allowed
          "
          aria-label="Página anterior (desabilitado)"
          aria-disabled="true"
        >
          <ChevronLeftIcon className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Anterior</span>
        </button>
      )}

      {/* Page Numbers */}
      <div className="hidden sm:flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return isActive ? (
            <span
              key={pageNum}
              className="
                px-4 py-2 min-w-[40px] text-center
                bg-cyan-600 text-white
                rounded-md font-semibold
              "
              aria-current="page"
              aria-label={`Página ${pageNum} (atual)`}
            >
              {pageNum}
            </span>
          ) : (
            <Link
              key={pageNum}
              href={buildUrl(pageNum)}
              className="
                px-4 py-2 min-w-[40px] text-center
                text-gray-700 bg-white border border-gray-300
                rounded-md font-medium
                hover:bg-gray-50 hover:border-gray-400
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
                transition-colors
              "
              aria-label={`Ir para página ${pageNum}`}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Mobile: Current Page Indicator */}
      <div className="sm:hidden px-4 py-2 text-sm text-gray-700">
        Página {currentPage} de {totalPages}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="
            flex items-center gap-1 px-3 py-2
            text-gray-700 bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 hover:border-gray-400
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
            transition-colors
          "
          aria-label="Próxima página"
        >
          <span className="text-sm font-medium">Próxima</span>
          <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
        </Link>
      ) : (
        <button
          disabled
          className="
            flex items-center gap-1 px-3 py-2
            text-gray-400 bg-gray-100 border border-gray-200 rounded-md
            cursor-not-allowed
          "
          aria-label="Próxima página (desabilitado)"
          aria-disabled="true"
        >
          <span className="text-sm font-medium">Próxima</span>
          <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </nav>
  );
}
