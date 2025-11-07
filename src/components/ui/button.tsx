import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] transform",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 shadow-md hover:shadow-lg",
        primary: "bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-500 shadow-md hover:shadow-lg",
        secondary: "bg-silver-100 text-silver-900 hover:bg-silver-200 focus-visible:ring-silver-500 border border-silver-300",
        success: "bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-500 shadow-md hover:shadow-lg",
        warning: "bg-warning-600 text-white hover:bg-warning-700 focus-visible:ring-warning-500 shadow-md hover:shadow-lg",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-md hover:shadow-lg",
        outline:
          "border-2 border-cyan-600 text-cyan-700 bg-white hover:bg-cyan-50 focus-visible:ring-cyan-500 hover:border-cyan-700",
        "outline-secondary":
          "border-2 border-silver-400 text-silver-700 bg-white hover:bg-silver-50 focus-visible:ring-silver-500 hover:border-silver-600",
        ghost: "text-silver-700 hover:bg-silver-100 hover:text-silver-900 focus-visible:ring-silver-500",
        "ghost-primary": "text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900 focus-visible:ring-cyan-500",
        link: "text-cyan-600 underline-offset-4 hover:text-cyan-700 hover:underline focus-visible:ring-cyan-500",
        "link-secondary": "text-silver-600 underline-offset-4 hover:text-silver-700 hover:underline focus-visible:ring-silver-500",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-12 rounded-lg px-6 text-base font-semibold",
        xl: "h-14 rounded-xl px-8 text-lg font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
export { Button, buttonVariants }