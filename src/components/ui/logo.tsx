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
    header: "filter brightness-0 hover:brightness-110 transition-all",
    footer: "filter brightness-0 hover:brightness-110 transition-all"
  }
  // Use regular img for SVG to avoid optimization issues
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
        <img
          src="/images/logo-svlentes.svg"
          alt="SV Lentes"
          className={cn(
            "w-full h-full object-contain",
            size === "sm" ? "p-1" : size === "md" ? "p-1" : "p-2"
          )}
          onError={() => setError(true)}
        />
      </div>
    )
  }
  // Fallback to PNG with Next.js Image optimization
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
        src="/logosv-md.png"
        alt="SV Lentes"
        fill
        className={cn(
          "object-contain",
          size === "sm" ? "p-1" : size === "md" ? "p-1" : "p-2"
        )}
        priority
      />
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