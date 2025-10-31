'use client'

import { createContext, useContext } from 'react'
import { useTheme } from '@/vision-hooks/useTheme'

interface ThemeContextValue {
    theme: string
    setTheme: (theme: 'light' | 'dark' | 'high-contrast') => void
    themes: Record<string, unknown>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, setTheme, themes } = useTheme()
    return <ThemeContext.Provider value={{ theme, setTheme, themes }}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useThemeContext deve ser usado dentro de ThemeProvider')
    }
    return context
}
