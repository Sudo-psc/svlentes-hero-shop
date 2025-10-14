/**
 * SearchBar Component
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Client component for blog search functionality.
 * Includes form validation and keyboard navigation.
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  /**
   * Initial search query value (for pre-filling on search results page)
   */
  initialQuery?: string;

  /**
   * Placeholder text for search input
   */
  placeholder?: string;
}

/**
 * SearchBar Component
 *
 * Provides blog search functionality with client-side navigation.
 * Supports keyboard navigation and accessibility features.
 *
 * @param initialQuery - Pre-filled search query
 * @param placeholder - Input placeholder text
 */
export function SearchBar({
  initialQuery = '',
  placeholder = 'Buscar artigos...',
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Trim and validate query
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    // Navigate to search results page
    router.push(`/blog/busca?q=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto mb-8"
      role="search"
    >
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-4 pointer-events-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
        </div>

        {/* Search Input */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="
            w-full pl-12 pr-4 py-3
            bg-white
            border border-gray-300 rounded-lg
            text-gray-900 placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
            transition-shadow
          "
          aria-label="Buscar artigos do blog"
          autoComplete="off"
        />

        {/* Search Button */}
        <button
          type="submit"
          className="
            absolute right-2
            px-4 py-2
            bg-cyan-600 text-white
            rounded-md
            font-semibold text-sm
            hover:bg-cyan-700
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={!query.trim()}
          aria-label="Buscar"
        >
          Buscar
        </button>
      </div>

      {/* Search Hint */}
      {query.length > 0 && query.length < 3 && (
        <p className="mt-2 text-sm text-gray-500">
          Digite pelo menos 3 caracteres para buscar
        </p>
      )}
    </form>
  );
}
