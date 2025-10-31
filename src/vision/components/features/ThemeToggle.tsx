'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/vision-components/ui/Button'
import { useThemeContext } from '@/vision/contexts/ThemeContext'

export function ThemeToggle() {
    const { theme, setTheme } = useThemeContext()
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }

    return (
        <Button variant="secondary" onClick={toggleTheme} className="flex items-center gap-2">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        </Button>
    )
}
