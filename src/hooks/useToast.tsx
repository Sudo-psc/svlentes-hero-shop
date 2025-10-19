'use client'

import { useState, useCallback } from 'react'
import { Toast } from '@/components/ui/loader'

interface ToastConfig {
    message: string
    type?: 'success' | 'error' | 'info' | 'warning'
    duration?: number
}

interface ToastItem extends ToastConfig {
    id: string
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const showToast = useCallback(({ message, type = 'info', duration = 3000 }: ToastConfig) => {
        const id = Math.random().toString(36).substring(7)
        const newToast: ToastItem = { id, message, type, duration }

        setToasts((prev) => [...prev, newToast])

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }, duration)

        return id
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const ToastContainer = useCallback(() => {
        return (
            <>
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </>
        )
    }, [toasts, removeToast])

    return {
        showToast,
        removeToast,
        ToastContainer,
        success: (message: string) => showToast({ message, type: 'success' }),
        error: (message: string) => showToast({ message, type: 'error' }),
        info: (message: string) => showToast({ message, type: 'info' }),
        warning: (message: string) => showToast({ message, type: 'warning' }),
    }
}
