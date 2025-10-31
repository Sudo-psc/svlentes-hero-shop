'use client'

import { ThemeToggle } from '@/vision/components/features/ThemeToggle'
import { ProgressSaver } from '@/vision/components/features/ProgressSaver'
import { Container } from './Container'

export function Header() {
    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                    <p className="text-sm font-semibold text-sky-600">SV Lentes</p>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Assistente de recomendação visual personalizada</h1>
                    <p className="text-xs text-slate-500">Baseado em diretrizes científicas e análise inteligente de fatores.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <ThemeToggle />
                    <ProgressSaver />
                </div>
            </Container>
        </header>
    )
}
