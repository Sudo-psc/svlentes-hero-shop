'use client'

import { useEffect } from 'react'
import { initializeChunkErrorHandler } from '@/lib/chunk-error-handler'

/**
 * Client Component to initialize chunk error handler
 * Moved from layout.tsx to fix hydration mismatch
 */
export function ChunkErrorInitializer() {
    useEffect(() => {
        initializeChunkErrorHandler()
    }, [])

    return null
}
