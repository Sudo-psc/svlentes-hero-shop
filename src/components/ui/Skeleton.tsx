'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'none'
  width?: string | number
  height?: string | number
}

/**
 * Enhanced Skeleton Component
 *
 * Provides content-aware loading placeholders with various shapes and animations.
 * Follows accessibility best practices with proper ARIA attributes.
 */
export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-md'
  }

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    none: ''
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn(
        'bg-gray-200',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
      role="status"
      aria-label="Carregando conteúdo"
      aria-live="polite"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  )
}

/**
 * Skeleton Group - Multiple skeleton lines with realistic spacing
 */
export function SkeletonGroup({
  lines = 3,
  className
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Carregando conteúdo">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          animation="wave"
        />
      ))}
    </div>
  )
}

/**
 * Card Skeleton - Simulates a card with header and content
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-label="Carregando cartão">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="40%" height={24} animation="wave" />
        <Skeleton variant="text" width="70%" height={16} animation="wave" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" animation="wave" />
        <Skeleton variant="text" width="85%" animation="wave" />
        <Skeleton variant="text" width="60%" animation="wave" />
      </div>
    </div>
  )
}

/**
 * Avatar Skeleton - Circular avatar placeholder
 */
export function SkeletonAvatar({
  size = 40,
  className
}: {
  size?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Carregando avatar"
      className={cn(
        'bg-gray-200 rounded-full animate-pulse',
        className
      )}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <span className="sr-only">Carregando...</span>
    </div>
  )
}

/**
 * Button Skeleton - Button-shaped placeholder
 */
export function SkeletonButton({
  width = 120,
  className
}: {
  width?: number | string
  className?: string
}) {
  const widthStyle = typeof width === 'number' ? `${width}px` : width

  return (
    <div
      role="status"
      aria-label="Carregando botão"
      className={cn(
        'bg-gray-200 rounded-md animate-pulse',
        className
      )}
      style={{ width: widthStyle, height: '40px' }}
    >
      <span className="sr-only">Carregando...</span>
    </div>
  )
}

/**
 * Table Row Skeleton - Simulates a table row
 */
export function SkeletonTableRow({
  columns = 4,
  className
}: {
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('flex gap-4 items-center', className)} role="status">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === 0 ? '30%' : '20%'}
          height={16}
          animation="wave"
        />
      ))}
    </div>
  )
}

/**
 * Dashboard Skeleton - Complete dashboard loading state
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6" role="status" aria-label="Carregando dashboard">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="30%" height={32} animation="wave" />
        <Skeleton variant="text" width="50%" height={20} animation="wave" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 border border-gray-200 rounded-lg">
            <SkeletonCard />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="p-6 border border-gray-200 rounded-lg">
        <div className="space-y-4">
          <Skeleton variant="text" width="25%" height={24} animation="wave" />
          <SkeletonGroup lines={5} />
        </div>
      </div>
    </div>
  )
}

/**
 * Subscription Card Skeleton - Specific to subscription dashboard
 */
export function SkeletonSubscriptionCard() {
  return (
    <div className="p-6 space-y-4" role="status" aria-label="Carregando assinatura">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <Skeleton variant="rounded" width={80} height={24} animation="pulse" />
        <Skeleton variant="rounded" width={100} height={32} animation="pulse" />
      </div>

      {/* Plan Info */}
      <div className="space-y-2">
        <Skeleton variant="text" width="60%" height={28} animation="wave" />
        <Skeleton variant="text" width="40%" height={20} animation="wave" />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Details */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="30%" height={16} animation="wave" />
          <Skeleton variant="text" width="25%" height={16} animation="wave" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="35%" height={16} animation="wave" />
          <Skeleton variant="text" width="20%" height={16} animation="wave" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="28%" height={16} animation="wave" />
          <Skeleton variant="text" width="30%" height={16} animation="wave" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <SkeletonButton width={100} />
        <SkeletonButton width={120} />
      </div>
    </div>
  )
}

/**
 * Order History Skeleton - Order list placeholder
 */
export function SkeletonOrderHistory() {
  return (
    <div className="space-y-4" role="status" aria-label="Carregando histórico de pedidos">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" width="40%" height={20} animation="wave" />
              <Skeleton variant="text" width="30%" height={16} animation="wave" />
            </div>
            <Skeleton variant="rounded" width={80} height={24} animation="pulse" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" width="60%" height={16} animation="wave" />
            <Skeleton variant="text" width="50%" height={16} animation="wave" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Add shimmer animation to global styles
if (typeof window !== 'undefined') {
  const styleId = 'skeleton-shimmer-animation'
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style')
    styleElement.id = styleId
    styleElement.textContent = `
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      .animate-shimmer {
        animation: shimmer 2s infinite linear;
      }
    `
    document.head.appendChild(styleElement)
  }
}
