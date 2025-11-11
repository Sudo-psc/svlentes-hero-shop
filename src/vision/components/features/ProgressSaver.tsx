'use client'

import { Button } from '@/components/ui/button'
import { useQuestionnaireContext } from '@/vision/contexts/QuestionnaireContext'

export function ProgressSaver() {
    const { reset, state } = useQuestionnaireContext()

    return (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span>Progresso salvo automaticamente.</span>
            <Button variant="ghost" onClick={reset}>
                Reiniciar
            </Button>
            <span className="text-xs text-slate-500">Perguntas respondidas: {Object.keys(state.answers).length}</span>
        </div>
    )
}
