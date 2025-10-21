import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "header" | "footer"
}
const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "md", variant = "default", ...props }, ref
) => {
  const [error, setError] = React.useState(false)
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  }
  const variantClasses = {
    default: "",
    header: "hover:opacity-90 transition-all",
    footer: "hover:opacity-90 transition-all"
  }
  // Use Next.js Image component for better optimization
  if (!error) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <Image
          src="/images/logo.jpeg"
          alt="SV Lentes"
          width={size === "sm" ? 32 : size === "md" ? 40 : 48}
          height={size === "sm" ? 32 : size === "md" ? 40 : 48}
          className="w-full h-full object-contain"
          priority
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
        "relative flex items-center justify-center",
        sizeClasses[size],
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
          fill
          className={cn(
            "object-contain",
            size === "sm" ? "p-1" : size === "md" ? "p-1" : "p-2"
          )}
          priority
        />
      </picture>
    </div>
  )
})
Logo.displayName = "Logo"
// Exportar componentes específicos para diferentes contextos
export const LogoHeader = React.forwardRef<HTMLDivElement, LogoProps>(
  (props, ref) => <Logo ref={ref} size="md" variant="header" {...props} />
)
LogoHeader.displayName = "LogoHeader"
export const LogoFooter = React.forwardRef<HTMLDivElement, LogoProps>(
  (props, ref) => <Logo ref={ref} size="sm" variant="footer" {...props} />
)
LogoFooter.displayName = "LogoFooter"
export { Logo }