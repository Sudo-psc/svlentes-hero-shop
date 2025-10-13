import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  priority?: boolean
  showSubtitle?: boolean
}

const SIZE_CONFIG = {
  sm: { width: 112, height: 38, textSize: 'text-lg', src: '/images/logo_transparent.png' },
  md: { width: 160, height: 54, textSize: 'text-2xl', src: '/images/logo_transparent.png' },
  lg: { width: 224, height: 76, textSize: 'text-3xl', src: '/images/logo_transparent.png' },
  xl: { width: 288, height: 96, textSize: 'text-4xl', src: '/images/logo_transparent.png' }
}

export function Logo({
  variant = 'full',
  size = 'md',
  className,
  priority = false,
  showSubtitle = false
}: LogoProps) {
  const config = SIZE_CONFIG[size]

  // Full logo with image
  if (variant === 'full') {
    return (
      <div className={cn('flex items-center space-x-3', className)}>
        <div className="relative flex-shrink-0">
          <Image
            src={config.src}
            alt="SV Lentes - Saraiva Vision Oftalmologia"
            width={config.width}
            height={config.height}
            priority={priority}
            className="object-contain drop-shadow-sm contrast-110 brightness-105"
            quality={100}
            sizes={`(max-width: 768px) ${config.width}px, ${config.width}px`}
          />
        </div>
        {showSubtitle && (
          <div className="hidden lg:flex flex-col text-sm text-gray-800 dark:text-gray-200">
            <span className="font-semibold text-gray-900 dark:text-white drop-shadow-sm">Saraiva Vision</span>
            <span className="text-primary-700 dark:text-primary-300 font-bold drop-shadow-sm">
              Dr. Philipe Saraiva Cruz
            </span>
          </div>
        )}
      </div>
    )
  }

  // Icon only (eye graphic from logo)
  if (variant === 'icon') {
    return (
      <div className={cn('relative flex-shrink-0', className)}>
        <Image
          src={config.src}
          alt="SV Lentes"
          width={config.height} // Square for icon
          height={config.height}
          priority={priority}
          className="object-contain"
          quality={95}
          sizes={`${config.height}px`}
        />
      </div>
    )
  }

  // Text only variant (fallback for loading or accessibility)
  return (
    <div className={cn('flex flex-col', className)}>
      <span className={cn(
        config.textSize,
        'font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent drop-shadow-sm'
      )}>
        SV Lentes
      </span>
      {showSubtitle && (
        <span className="text-sm text-gray-800 dark:text-gray-300 font-semibold drop-shadow-sm">
          Saraiva Vision Oftalmologia
        </span>
      )}
    </div>
  )
}

// Predefined logo variants for common use cases
export function LogoHeader() {
  return <Logo variant="full" size="lg" priority className="hover:scale-105 transition-transform duration-200" />
}

export function LogoFooter() {
  return (
    <div className="relative flex-shrink-0 mb-4">
      <Image
        src="/images/logo_animado_backup.gif"
        alt="SV Lentes - Saraiva Vision Oftalmologia"
        width={270} // 224 * 1.2 = 268.8 ≈ 270
        height={91} // 76 * 1.2 = 91.2 ≈ 91
        priority={false}
        className="object-contain drop-shadow-sm contrast-110 brightness-105"
        quality={100}
        sizes="(max-width: 768px) 270px, 270px"
        unoptimized={true}
      />
    </div>
  )
}

export function LogoMobile() {
  return <Logo variant="icon" size="sm" priority />
}

export function LogoLoading() {
  return <Logo variant="text" size="md" />
}
