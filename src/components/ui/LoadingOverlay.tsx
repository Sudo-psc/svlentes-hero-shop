/**
 * Loading Overlay Component
 * Accessible full-screen loading indicator with portal rendering
 *
 * @author Dr. Philipe Saraiva Cruz
 * @date 2025-10-25
 */

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isLoading: boolean
  /** Optional loading message */
  message?: string
  /** Optional z-index override (default: 50) */
  zIndex?: number
}

/**
 * Full-screen loading overlay with accessibility features
 * Uses React Portal for proper z-index management
 * Includes ARIA live region for screen readers
 *
 * @example
 * ```tsx
 * <LoadingOverlay
 *   isLoading={isSubmitting}
 *   message="Salvando alterações..."
 * />
 * ```
 */
export function LoadingOverlay({
  isLoading,
  message = 'Processando...',
  zIndex = 50
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Prevent body scroll when loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isLoading])

  if (!mounted || !isLoading) {
    return null
  }

  const overlay = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label="Carregando"
    >
      {/* Loading content */}
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" aria-hidden="true" />

          {/* Message with live region for screen readers */}
          <p
            className="text-sm text-gray-600 text-center"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
