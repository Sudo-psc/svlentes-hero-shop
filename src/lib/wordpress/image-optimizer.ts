/**
 * WordPress Image Optimization Utilities
 * Feature: Integração com Blog WordPress via API Headless
 *
 * Handles WordPress media object processing and image URL optimization
 * for optimal loading performance with Next.js Image component.
 */

import type { WordPressMedia } from '@/types/wordpress';

/**
 * Default placeholder image path
 */
const PLACEHOLDER_IMAGE = '/images/blog-placeholder.webp';

/**
 * Image size preferences in order of priority
 * WordPress generates: thumbnail (150x150), medium (300x?), large (1024x?), full (original)
 */
const SIZE_PREFERENCES = ['medium', 'large', 'full'];

/**
 * Get optimized image URL from WordPress media object
 *
 * Selects the best available image size based on context:
 * - Prefers 'medium' size (300px) for article cards
 * - Falls back to 'large' (1024px) or 'full' if medium not available
 * - Returns placeholder if no valid image found
 *
 * @param media - WordPress media object (optional)
 * @param preferredSize - Preferred size ('medium', 'large', 'full')
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  media: WordPressMedia | undefined | null,
  preferredSize: 'medium' | 'large' | 'full' = 'medium'
): string {
  if (!media) {
    return PLACEHOLDER_IMAGE;
  }

  // Try preferred size first
  if (media.media_details?.sizes?.[preferredSize]) {
    return media.media_details.sizes[preferredSize].source_url;
  }

  // Fall back to other sizes in order of preference
  for (const size of SIZE_PREFERENCES) {
    if (size !== preferredSize && media.media_details?.sizes?.[size]) {
      return media.media_details.sizes[size].source_url;
    }
  }

  // Fall back to source URL
  if (media.source_url) {
    return media.source_url;
  }

  // Last resort: placeholder
  return PLACEHOLDER_IMAGE;
}

/**
 * Get image dimensions from WordPress media object
 *
 * Returns dimensions for the specified size, falling back to
 * full image dimensions if size not available.
 *
 * @param media - WordPress media object
 * @param size - Image size key
 * @returns Width and height in pixels
 */
export function getImageDimensions(
  media: WordPressMedia | undefined | null,
  size: string = 'medium'
): { width: number; height: number } {
  const defaultDimensions = { width: 300, height: 200 };

  if (!media) {
    return defaultDimensions;
  }

  // Try specific size dimensions
  if (media.media_details?.sizes?.[size]) {
    return {
      width: media.media_details.sizes[size].width,
      height: media.media_details.sizes[size].height,
    };
  }

  // Fall back to full dimensions
  if (media.media_details?.width && media.media_details?.height) {
    return {
      width: media.media_details.width,
      height: media.media_details.height,
    };
  }

  return defaultDimensions;
}

/**
 * Get image alt text from WordPress media object
 *
 * Falls back to title or generic description if alt text not set.
 *
 * @param media - WordPress media object
 * @param fallbackTitle - Fallback title (e.g., post title)
 * @returns Alt text for accessibility
 */
export function getImageAlt(
  media: WordPressMedia | undefined | null,
  fallbackTitle: string = 'Imagem do artigo'
): string {
  if (!media) {
    return fallbackTitle;
  }

  // Prefer explicit alt text
  if (media.alt_text && media.alt_text.trim()) {
    return media.alt_text;
  }

  // Fall back to image title
  if (media.title?.rendered && media.title.rendered.trim()) {
    return media.title.rendered;
  }

  // Use fallback
  return fallbackTitle;
}

/**
 * Check if image is available (not placeholder)
 *
 * @param imageUrl - Image URL to check
 * @returns True if real image, false if placeholder
 */
export function isRealImage(imageUrl: string): boolean {
  return imageUrl !== PLACEHOLDER_IMAGE;
}

/**
 * Get responsive image srcset from WordPress media
 *
 * Generates srcset string for responsive images using
 * available WordPress image sizes.
 *
 * @param media - WordPress media object
 * @returns srcset string for <img> or null if no sizes available
 */
export function getResponsiveSrcset(media: WordPressMedia | undefined | null): string | null {
  if (!media?.media_details?.sizes) {
    return null;
  }

  const srcsetParts: string[] = [];

  // Add available sizes to srcset
  Object.entries(media.media_details.sizes).forEach(([sizeName, sizeData]) => {
    if (sizeData.source_url && sizeData.width) {
      srcsetParts.push(`${sizeData.source_url} ${sizeData.width}w`);
    }
  });

  // Add full size as fallback
  if (media.source_url && media.media_details.width) {
    srcsetParts.push(`${media.source_url} ${media.media_details.width}w`);
  }

  return srcsetParts.length > 0 ? srcsetParts.join(', ') : null;
}

/**
 * Get Next.js Image component sizes attribute
 *
 * Returns appropriate sizes string for Next.js Image based on context.
 *
 * @param context - Image context ('card', 'hero', 'content')
 * @returns sizes attribute string
 */
export function getImageSizes(context: 'card' | 'hero' | 'content' = 'card'): string {
  switch (context) {
    case 'card':
      // Article cards: 100vw on mobile, 50vw on tablet, 33vw on desktop
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

    case 'hero':
      // Hero/featured images: full width on mobile, 80% on desktop
      return '(max-width: 768px) 100vw, 80vw';

    case 'content':
      // Content images: constrained by article width
      return '(max-width: 768px) 100vw, 768px';

    default:
      return '100vw';
  }
}
