'use client'

/**
 * Offline Indicator Component
 * Shows visual indicator when user is offline
 */

import { useEffect, useState, useRef } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Set initial state and show indicator if offline on load
    const initiallyOnline = navigator.onLine
    setIsOnline(initiallyOnline)
    if (!initiallyOnline) {
      setShowIndicator(true)
    }

    const handleOnline = () => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      setIsOnline(true)
      setShowIndicator(true)

      // Hide "back online" message after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setShowIndicator(false)
      }, 3000)
    }

    const handleOffline = () => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      // Clean up timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-20 left-1/2 z-50 -translate-x-1/2 transform rounded-lg px-4 py-3 shadow-lg ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">Você está online novamente</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">Você está offline</span>
              </>
            )}
          </div>
          {!isOnline && (
            <p className="mt-1 text-sm opacity-90">
              Alguns recursos podem estar limitados
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
