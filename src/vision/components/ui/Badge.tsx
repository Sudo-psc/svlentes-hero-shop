'use client'

import { cn } from '@/lib/utils'

const variants = {
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
}

type BadgeVariant = keyof typeof variants

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant
}

export function Badge({ children, className, variant = 'info', ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    )
}
