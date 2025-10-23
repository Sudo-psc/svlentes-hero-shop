import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "footer"
  variant?: "default" | "header" | "footer"
}

const SIZE_CONFIG = {
  sm: { wrapper: "h-10 w-10", dimension: 40, sizes: "40px" },
  md: { wrapper: "h-14 w-14", dimension: 56, sizes: "56px" },
  lg: { wrapper: "h-16 w-16", dimension: 64, sizes: "64px" },
  xl: { wrapper: "h-[200px] w-[200px]", dimension: 200, sizes: "200px" },
  footer: {
    wrapper: "h-16 w-16 md:h-[200px] md:w-[200px]",
    dimension: 200,
    sizes: "(min-width: 768px) 200px, 64px"
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
          "relative flex items-center justify-center overflow-hidden flex-shrink-0 motion-safe:animate-logo-glow motion-reduce:animate-none",
          wrapper,
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <Image
          src="/images/logo_transparent.png"
          alt="SV Lentes"
          width={dimension}
          height={dimension}
          className={cn(
            "object-contain transition-transform duration-500",
            sizeKey === "sm" || sizeKey === "md" ? "p-1" : "p-2"
          )}
          priority={variant !== "footer"}
          loading={variant === "footer" ? "lazy" : undefined}
          sizes={sizes}
        />
      </div>
    )
  }
)
Logo.displayName = "Logo"

export const LogoHeader = React.forwardRef<HTMLDivElement, LogoProps>(
  (props, ref) => <Logo ref={ref} size="lg" variant="header" {...props} />
)
LogoHeader.displayName = "LogoHeader"

export const LogoFooter = React.forwardRef<HTMLDivElement, LogoProps>(
  (props, ref) => <Logo ref={ref} size="footer" variant="footer" {...props} />
)
LogoFooter.displayName = "LogoFooter"

export { Logo }
