'use client'
import { Loader2 } from 'lucide-react'
interface LoaderProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    text?: string
    className?: string
    fullScreen?: boolean
}
const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
}
export function Loader({ size = 'md', text, className = '', fullScreen = false }: LoaderProps) {
    const content = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
            {text && (
                <p className="text-sm font-medium text-gray-600 animate-pulse">
                    {text}
                </p>
            )}
        </div>
    )
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                {content}
            </div>
        )
    }
    return content
}
interface ButtonLoaderProps {
    loading?: boolean
    children: React.ReactNode
    loadingText?: string
    className?: string
    disabled?: boolean
    [key: string]: any
}
export function ButtonWithLoader({
    loading = false,
    children,
    loadingText,
    className = '',
    disabled = false,
    ...props
}: ButtonLoaderProps) {
    return (
        <button
            disabled={loading || disabled}
            className={`relative ${className} ${loading || disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
            {...props}
        >
            {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </span>
            )}
            <span className={loading ? 'invisible' : ''}>
                {loading && loadingText ? loadingText : children}
            </span>
        </button>
    )
}
interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular'
    width?: string | number
    height?: string | number
}
export function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height
}: SkeletonProps) {
    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    }
    const style: React.CSSProperties = {}
    if (width) style.width = typeof width === 'number' ? `${width}px` : width
    if (height) style.height = typeof height === 'number' ? `${height}px` : height
    return (
        <div
            className={`bg-gray-200 animate-pulse ${variantClasses[variant]} ${className}`}
            style={style}
        />
    )
}
interface ToastProps {
    message: string
    type?: 'success' | 'error' | 'info' | 'warning'
    duration?: number
    onClose?: () => void
}
export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const typeStyles = {
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
    }
    const typeIcons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    }
    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg border-2 shadow-lg animate-slide-in ${typeStyles[type]}`}>
            <span className="text-2xl">{typeIcons[type]}</span>
            <p className="font-medium">{message}</p>
            {onClose && (
                <button
                    onClick={onClose}
                    className="ml-4 text-lg hover:opacity-70 transition-opacity"
                    aria-label="Fechar notificação"
                >
                    ×
                </button>
            )}
        </div>
    )
}