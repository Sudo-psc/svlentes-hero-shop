'use client'

import { Slot } from '@radix-ui/react-slot'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const variants = {
    primary: 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400',
    ghost: 'bg-transparent text-slate-200 hover:bg-slate-800 focus-visible:ring-slate-500'
}

type ButtonVariant = keyof typeof variants

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'primary', asChild = false, className, ...props },
    ref
) {
    const Component = asChild ? Slot : 'button'
    return (
        <Component
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
                variants[variant],
                className
            )}
            {...props}
        />
    )
})
