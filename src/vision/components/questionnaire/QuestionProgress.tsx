'use client'

interface QuestionProgressProps {
    progress: number
    timeRemaining: number
}

export function QuestionProgress({ progress, timeRemaining }: QuestionProgressProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Progresso {progress}%</span>
                <span>Tempo estimado restante: {timeRemaining} min</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}
