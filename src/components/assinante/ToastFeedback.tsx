'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose?: () => void
  isVisible: boolean
}

export function Toast({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  isVisible
}: ToastProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(() => {
      onClose?.()
    }, duration)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const decrement = 100 / (duration / 100)
        return Math.max(0, prev - decrement)
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      clearInterval(progressInterval)
      setProgress(100)
    }
  }, [isVisible, duration, onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900'
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm transition-all duration-300 ease-in-out',
        'transform-gpu will-change-transform',
        isVisible
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      )}
    >
      <div className={cn(
        'p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        'relative overflow-hidden',
        colors[type]
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{title}</p>
            {message && (
              <p className="text-sm mt-1 opacity-90">{message}</p>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-black/20 transition-all duration-100 ease-linear">
          <div
            className="h-full bg-black/40 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: ToastType
    title: string
    message?: string
  }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => onRemove(toast.id)}
          isVisible={true}
        />
      ))}
    </div>
  )
}

// Hook para gerenciar toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string
    type: ToastType
    title: string
    message?: string
  }>>([])

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString()
    const newToast = { id, type, title, message }

    setToasts(prev => [...prev, newToast])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message?: string) => addToast('success', title, message)
  const error = (title: string, message?: string) => addToast('error', title, message)
  const warning = (title: string, message?: string) => addToast('warning', title, message)
  const info = (title: string, message?: string) => addToast('info', title, message)

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}