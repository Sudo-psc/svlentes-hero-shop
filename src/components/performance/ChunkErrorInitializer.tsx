'use client'
import { useEffect } from 'react'
import { setupGlobalErrorHandlers, setupNetworkMonitoring } from '@/lib/error-handler'
/**
 * Client Component to initialize global error handling
 * Handles chunk loading errors, Stripe errors, and network issues
 */
export function ChunkErrorInitializer() {
    useEffect(() => {
        // Set up enhanced global error handling
        const cleanupErrorHandler = setupGlobalErrorHandlers()
        const cleanupNetworkMonitoring = setupNetworkMonitoring()

        return () => {
            cleanupErrorHandler?.()
            cleanupNetworkMonitoring?.()
        }
    }, [])
    return null
}