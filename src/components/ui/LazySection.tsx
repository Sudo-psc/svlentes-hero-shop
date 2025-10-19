'use client'

import React, { useMemo, useRef } from 'react'
import { useIntersectionObserver } from '@/lib/performance'
import { SectionSkeleton } from '@/components/ui/SectionSkeleton'

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
    fallback = <SectionSkeleton />,
    className = '',
    threshold = 0.1,
    rootMargin = '100px',
    id
}: LazySectionProps) {
    const ref = useRef<HTMLDivElement>(null)
    const observerOptions = useMemo(
        () => ({ threshold, rootMargin }),
        [threshold, rootMargin]
    )
    const { hasIntersected } = useIntersectionObserver(ref, observerOptions)

    return (
        <div ref={ref} className={className} id={id}>
            {hasIntersected ? <>{children}</> : fallback}
        </div>
    )
}
