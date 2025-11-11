'use client'

import { Sparkles } from 'lucide-react'

interface ConditionalQuestionProps {
    label: string
    children: React.ReactNode
}

export function ConditionalQuestion({ label, children }: ConditionalQuestionProps) {
    return (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-sky-800 dark:bg-sky-900/30 dark:text-slate-200">
            <div className="mb-2 flex items-center gap-2 font-semibold text-sky-700 dark:text-sky-200">
                <Sparkles className="h-4 w-4" />
                {label}
            </div>
            {children}
        </div>
    )
}
