'use client'

import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    tone?: 'default' | 'accent'
}

export function Card({ children, className, tone = 'default', ...props }: CardProps) {
    const toneClasses = tone === 'accent' ? 'border-sky-500/40 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-200 bg-white dark:bg-slate-900'
    return (
        <div
            className={cn(
                'rounded-2xl border shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-sky-500/40',
                toneClasses,
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('border-b border-slate-200 px-6 py-4 text-slate-900 dark:text-slate-100', className)} {...props}>
            {children}
        </div>
    )
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('px-6 py-4 text-sm text-slate-700 dark:text-slate-200', className)} {...props}>
            {children}
        </div>
    )
}
