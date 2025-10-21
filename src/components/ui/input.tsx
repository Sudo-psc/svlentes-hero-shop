import * as React from "react"
import { cn } from "@/lib/utils"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, id, label, error, helperText, required, ...props }, ref) => {
    const inputId = React.useId()
    const finalId = id || inputId
    const errorId = error ? `${finalId}-error` : undefined
    const helperId = helperText ? `${finalId}-helper` : undefined

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={finalId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="campo obrigatório">*</span>}
          </label>
        )}
        <input
          type={type}
          id={finalId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={cn(
            errorId,
            helperId
          )}
          aria-required={required}
          {...props}
        />
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-600 mt-1"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p 
            id={helperId}
            className="text-sm text-gray-600 mt-1"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
