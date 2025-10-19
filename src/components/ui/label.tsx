import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  disabled?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }
export { Label as LabelComponent }