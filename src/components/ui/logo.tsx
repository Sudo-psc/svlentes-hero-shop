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
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-16 w-16"
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
          width={size === "sm" ? 40 : size === "md" ? 56 : 64}
          height={size === "sm" ? 40 : size === "md" ? 56 : 64}
          className="w-full h-full object-contain rounded-lg"
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
  (props, ref) => <Logo ref={ref} size="lg" variant="header" {...props} />
)
LogoHeader.displayName = "LogoHeader"
export const LogoFooter = React.forwardRef<HTMLDivElement, LogoProps>(
  (props, ref) => <Logo ref={ref} size="sm" variant="footer" {...props} />
)
LogoFooter.displayName = "LogoFooter"
export { Logo }