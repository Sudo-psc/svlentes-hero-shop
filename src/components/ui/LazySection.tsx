'use client'

import React, { useRef } from 'react'
import { useIntersectionObserver } from '@/lib/performance'

interface LazySectionProps {
    children: React.ReactNode
    fallback?: React.ReactNode
    className?: string
    threshold?: number
    rootMargin?: string
    id?: string
}

export function LazySection({
    children,
    fallback = <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
    className = '',
    threshold = 0.1,
    rootMargin = '100px',
    id
}: LazySectionProps) {
    const ref = useRef<HTMLDivElement>(null)
    const { hasIntersected } = useIntersectionObserver(ref, {
        threshold,
        rootMargin,
    })

    return (
        <div ref={ref} className={className} id={id}>
            {hasIntersected ? <>{children}</> : fallback}
        </div>
    )
}
