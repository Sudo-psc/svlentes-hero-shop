/**
 * ArticleContent Component
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Renders sanitized HTML content from WordPress posts with proper styling.
 * Uses Tailwind Typography plugin for prose styling.
 */

interface ArticleContentProps {
  /**
   * Sanitized HTML content (already processed by sanitizePostContent)
   * Safe to render with dangerouslySetInnerHTML
   */
  sanitizedContent: string;
}

/**
 * ArticleContent Component
 *
 * Renders WordPress post content with optimized typography and styling.
 * Content must be pre-sanitized before passing to this component.
 *
 * @param sanitizedContent - Pre-sanitized HTML from WordPress
 */
export function ArticleContent({ sanitizedContent }: ArticleContentProps) {
  return (
    <div
      className="
        prose prose-lg prose-cyan max-w-none
        prose-headings:text-cyan-600 prose-headings:font-bold
        prose-h1:text-4xl prose-h1:mb-6
        prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-ul:my-4 prose-ol:my-4
        prose-li:text-gray-700 prose-li:my-2
        prose-img:rounded-lg prose-img:shadow-lg prose-img:max-w-full prose-img:mx-auto
        prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
        prose-code:text-cyan-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
        prose-table:border-collapse prose-table:w-full
        prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:p-2 prose-th:text-left
        prose-td:border prose-td:border-gray-300 prose-td:p-2
      "
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
