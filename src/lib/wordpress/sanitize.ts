/**
 * HTML Sanitization for WordPress Content
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Uses isomorphic-dompurify to sanitize WordPress HTML content
 * and prevent XSS attacks while preserving safe formatting.
 */

// Dynamic import to avoid build-time issues with isomorphic-dompurify
let DOMPurify: any = null;

async function getDOMPurify() {
  if (!DOMPurify) {
    const { default: purify } = await import('isomorphic-dompurify');
    DOMPurify = purify;
  }
  return DOMPurify;
}

/**
 * Allowed HTML tags for WordPress content
 * Based on common WordPress post content structure
 */
const ALLOWED_TAGS = [
  // Text formatting
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup',

  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',

  // Lists
  'ul', 'ol', 'li',

  // Links and media
  'a', 'img',

  // Quotes and code
  'blockquote', 'code', 'pre',

  // Tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',

  // Divisions (for WordPress blocks)
  'div', 'span',

  // Figures (for image captions)
  'figure', 'figcaption',
];

/**
 * Allowed HTML attributes
 * Restricts attributes to safe values only
 */
const ALLOWED_ATTR = [
  // Links
  'href', 'title', 'rel', 'target',

  // Images
  'src', 'alt', 'width', 'height', 'loading',

  // Styling (limited to WordPress classes)
  'class', 'id',

  // Code blocks
  'lang', 'language',
];

/**
 * DOMPurify configuration
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false, // Prevent data-* attributes
  ALLOW_UNKNOWN_PROTOCOLS: false, // Only allow http/https
  FORCE_BODY: true, // Wrap content in <body> for parsing
  RETURN_DOM: false, // Return string, not DOM
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true, // Additional DOM sanitization
};

/**
 * Sanitize WordPress post content HTML
 *
 * Removes potentially dangerous HTML while preserving safe formatting,
 * images, links, and text structure from WordPress posts.
 *
 * @param html - Raw HTML content from WordPress API
 * @returns Sanitized HTML safe for rendering with dangerouslySetInnerHTML
 *
 * @example
 * ```typescript
 * const post = await getPostBySlug('my-article');
 * const safeContent = await sanitizePostContent(post.content.rendered);
 * ```
 */
export async function sanitizePostContent(html: string): Promise<string> {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const purify = await getDOMPurify();
    const cleaned = purify.sanitize(html, SANITIZE_CONFIG);
    return cleaned.trim();
  } catch (error) {
    console.error('[WordPress] HTML sanitization error:', error);
    return ''; // Return empty string on sanitization failure
  }
}

/**
 * Sanitize WordPress excerpt HTML
 *
 * More restrictive than post content sanitization,
 * allowing only basic text formatting and links.
 *
 * @param html - Raw excerpt HTML from WordPress API
 * @returns Sanitized excerpt HTML
 */
export async function sanitizeExcerpt(html: string): Promise<string> {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const purify = await getDOMPurify();
    const cleaned = purify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });
    return cleaned.trim();
  } catch (error) {
    console.error('[WordPress] Excerpt sanitization error:', error);
    return '';
  }
}

/**
 * Strip all HTML tags from content
 * Useful for meta descriptions and previews
 *
 * @param html - HTML content
 * @returns Plain text without HTML tags
 */
export async function stripHtmlTags(html: string): Promise<string> {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const purify = await getDOMPurify();
    // First sanitize to remove dangerous content
    const sanitized = purify.sanitize(html, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
    });

    // Remove extra whitespace
    return sanitized.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('[WordPress] HTML stripping error:', error);
    return '';
  }
}
