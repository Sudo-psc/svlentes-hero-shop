'use client'

import { useEffect, useMemo } from 'react'
import { useLocalStorage } from '@/vision-hooks/useLocalStorage'

type ThemeName = 'light' | 'dark' | 'high-contrast'

interface ThemeConfig {
    name: ThemeName
    colors: {
        primary: string
        secondary: string
        background: string
        surface: string
        text: {
            primary: string
            secondary: string
            disabled: string
        }
        status: {
            success: string
            warning: string
            error: string
            info: string
        }
    }
    typography: {
        fontFamily: string
        fontSize: {
            xs: string
            sm: string
            base: string
            lg: string
            xl: string
        }
    }
}

const THEMES: Record<ThemeName, ThemeConfig> = {
    light: {
        name: 'light',
        colors: {
            primary: '#0f9cd8',
            secondary: '#6b7280',
            background: '#f9fafb',
            surface: '#ffffff',
            text: {
                primary: '#0f172a',
                secondary: '#1f2937',
                disabled: '#94a3b8'
            },
            status: {
                success: '#16a34a',
                warning: '#f59e0b',
                error: '#dc2626',
                info: '#0284c7'
            }
        },
        typography: {
            fontFamily: '"Inter", sans-serif',
            fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem'
            }
        }
    },
    dark: {
        name: 'dark',
        colors: {
            primary: '#0ea5e9',
            secondary: '#cbd5f5',
            background: '#0b1120',
            surface: '#111827',
            text: {
                primary: '#f8fafc',
                secondary: '#cbd5f5',
                disabled: '#64748b'
            },
            status: {
                success: '#22c55e',
                warning: '#fbbf24',
                error: '#f87171',
                info: '#38bdf8'
            }
        },
        typography: {
            fontFamily: '"Inter", sans-serif',
            fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem'
            }
        }
    },
    'high-contrast': {
        name: 'high-contrast',
        colors: {
            primary: '#00a3ff',
            secondary: '#ffffff',
            background: '#000000',
            surface: '#0f172a',
            text: {
                primary: '#ffffff',
                secondary: '#e5e7eb',
                disabled: '#9ca3af'
            },
            status: {
                success: '#22c55e',
                warning: '#fde047',
                error: '#f87171',
                info: '#38bdf8'
            }
        },
        typography: {
            fontFamily: '"Inter", sans-serif',
            fontSize: {
                xs: '0.8rem',
                sm: '0.95rem',
                base: '1.1rem',
                lg: '1.25rem',
                xl: '1.4rem'
            }
        }
    }
}

function applyTheme(theme: ThemeConfig) {
    if (typeof document === 'undefined') {
        return
    }
    const root = document.documentElement
    root.dataset.theme = theme.name
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-surface', theme.colors.surface)
    root.style.setProperty('--color-text-primary', theme.colors.text.primary)
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary)
    root.style.setProperty('--color-text-disabled', theme.colors.text.disabled)
    root.style.setProperty('--color-success', theme.colors.status.success)
    root.style.setProperty('--color-warning', theme.colors.status.warning)
    root.style.setProperty('--color-error', theme.colors.status.error)
    root.style.setProperty('--color-info', theme.colors.status.info)
}

export function useTheme() {
    const systemPrefersDark = useMemo(() => {
        if (typeof window === 'undefined') {
            return false
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    }, [])

    const defaultTheme = systemPrefersDark ? 'dark' : 'light'
    const { value: theme, setValue } = useLocalStorage<ThemeName>('vision-theme', defaultTheme)

    useEffect(() => {
        applyTheme(THEMES[theme])
    }, [theme])

    const setTheme = (value: ThemeName) => setValue(value)

    return { theme, setTheme, themes: THEMES }
}
