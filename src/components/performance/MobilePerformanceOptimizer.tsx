'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useInView } from 'react-intersection-observer'

interface MobilePerformanceOptimizerProps {
  children: React.ReactNode
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
  className?: string
}

export function MobilePerformanceOptimizer({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  fallback = null,
  className = ''
}: MobilePerformanceOptimizerProps) {
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true
  })

  // Detect mobile and reduced motion preferences
  useEffect(() => {
    setIsClient(true)
    setIsMobile(window.innerWidth < 768)
    setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  // Performance-optimized rendering
  const shouldRender = useMemo(() => {
    if (!isClient) return false
    return inView
  }, [isClient, inView])

  const content = useMemo(() => {
    if (!shouldRender) return fallback

    // Wrap children with performance optimizations for mobile
    return (
      <div
        ref={ref}
        className={className}
        style={{
          willChange: 'auto',
          transform: isMobile && !prefersReducedMotion ? 'translateZ(0)' : undefined,
          backfaceVisibility: 'hidden' as const
        }}
      >
        {children}
      </div>
    )
  }, [shouldRender, children, className, ref, isMobile, prefersReducedMotion])

  return content
}

// Hook for optimized image loading
export function useOptimizedImage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  const loadImage = (src: string) => {
    if (!src || imageRef.current?.src === src) return

    const img = new Image()
    img.onload = () => {
      setIsLoaded(true)
      setError(false)
    }
    img.onerror = () => {
      setError(true)
      setIsLoaded(false)
    }
    img.src = src
  }

  return {
    isLoaded,
    error,
    loadImage,
    imageRef
  }
}

// Component for critical CSS optimization
export function CriticalCSS({ children }: { children: React.ReactNode }) {
  const [isCritical, setIsCritical] = useState(true)

  useEffect(() => {
    // Mark non-critical content after initial paint
    const timer = setTimeout(() => {
      setIsCritical(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{
      contain: isCritical ? 'layout style paint' : 'layout',
      contentVisibility: isCritical ? 'auto' : 'hidden'
    }}>
      {children}
    </div>
  )
}

// Mobile touch optimization
export function TouchOptimized({
  children,
  onClick
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <div
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onClick={onClick}
      style={{
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.1s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                setMetrics(prev => ({ ...prev, fcp: entry.startTime }))
              }
              break
            case 'largest-contentful-paint':
              setMetrics(prev => ({ ...prev, lcp: entry.startTime }))
              break
            case 'first-input':
              setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }))
              break
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ ...prev, cls: prev.cls + (entry as any).value }))
              }
              break
          }
        }
      })

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })

      return () => observer.disconnect()
    }
  }, [])

  return metrics
}

// Preload critical resources
export function PreloadCriticalResources() {
  useEffect(() => {
    // Preload critical fonts
    const fontLink = document.createElement('link')
    fontLink.rel = 'preload'
    fontLink.href = '/fonts/inter-var.woff2'
    fontLink.as = 'font'
    fontLink.type = 'font/woff2'
    fontLink.crossOrigin = 'anonymous'
    document.head.appendChild(fontLink)

    // Preload hero image
    const heroImage = document.createElement('link')
    heroImage.rel = 'preload'
    heroImage.href = '/HEro.png'
    heroImage.as = 'image'
    document.head.appendChild(heroImage)

    return () => {
      document.head.removeChild(fontLink)
      document.head.removeChild(heroImage)
    }
  }, [])

  return null
}

// Service Worker registration for caching
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration)
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError)
          })
      })
    }
  }, [])

  return null
}