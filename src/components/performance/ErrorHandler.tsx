'use client'
import { useEffect } from 'react'
import { setupGlobalErrorHandlers } from '@/lib/error-handler'
export function ErrorHandler() {
    useEffect(() => {
        setupGlobalErrorHandlers()
    }, [])
    return null
}