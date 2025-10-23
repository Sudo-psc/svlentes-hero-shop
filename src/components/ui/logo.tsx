import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "header" | "footer"
}

const SIZE_CONFIG = {
  sm: { wrapper: "h-10 w-10", dimension: 40 },
  md: { wrapper: "h-14 w-14", dimension: 56 },
  lg: { wrapper: "h-16 w-16", dimension: 64 },
  xl: { wrapper: "h-[200px] w-[200px]", dimension: 200 }
} as const

type SizeKey = keyof typeof SIZE_CONFIG

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "md", variant = "default", ...props }, ref
) => {
  const [error, setError] = React.useState(false)
  const sizeKey: SizeKey = size in SIZE_CONFIG ? size : "md"
  const { wrapper, dimension } = SIZE_CONFIG[sizeKey]
  const variantClasses = {
    default: "",
    header: "hover:opacity-90 transition-all",
    footer: "hover:opacity-90 transition-all"
  }
} as const

type SizeKey = keyof typeof SIZE_CONFIG

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "md", variant = "default", ...props }, forwardedRef) => {
    const hasSize = Object.prototype.hasOwnProperty.call(SIZE_CONFIG, size)
    const sizeKey = (hasSize ? size : "md") as SizeKey
    const { wrapper, dimension, sizes } = SIZE_CONFIG[sizeKey]
    const variantClasses = {
      default: "",
      header: "hover:opacity-90 transition-all",
      footer: "hover:opacity-90 transition-all"
    }

    return (
      <div
        ref={forwardedRef}
        className={cn(
          "relative flex items-center justify-center overflow-hidden flex-shrink-0",
          wrapper,
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <Image
          src="/images/logo_animado.gif"
          alt="SV Lentes"
          width={dimension}
          height={dimension}
          className="w-full h-full object-contain rounded-lg"
          priority
          unoptimized
          onError={() => setError(true)}
        />
      </div>
    )
  }
  // Fallback to WebP with PNG using Next.js Image optimization
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center overflow-hidden flex-shrink-0",
        wrapper,
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <picture>
        <source
          srcSet="/logosv-md.webp"
          type="image/webp"
        />
        <Image
          src="/logosv-md.png"
          alt="SV Lentes"
          width={dimension}
          height={dimension}
          className={cn(
            "object-contain",
            sizeKey === "sm" || sizeKey === "md" ? "p-1" : "p-2"
          )}
          priority
        />
      </picture>
    </div>
  )
})
Logo.displayName = "Logo"

export const LogoHeader = React.forwardRef<HTMLDivElement, LogoProps>(
  (props, ref) => <Logo ref={ref} size="xl" variant="header" {...props} />
)
LogoHeader.displayName = "LogoHeader"

export const LogoFooter = React.forwardRef<HTMLDivElement, LogoProps>(
  (props, ref) => <Logo ref={ref} size="xl" variant="footer" {...props} />
)
LogoFooter.displayName = "LogoFooter"

export { Logo }
