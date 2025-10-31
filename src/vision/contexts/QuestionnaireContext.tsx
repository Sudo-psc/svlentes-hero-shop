'use client'

import { createContext, useContext } from 'react'
import { useQuestionnaire } from '@/vision-hooks/useQuestionnaire'
import { type QuestionnaireContextValue } from '@/vision-types'

const QuestionnaireContext = createContext<QuestionnaireContextValue | null>(null)

export function QuestionnaireProvider({ children }: { children: React.ReactNode }) {
    const value = useQuestionnaire()
    return <QuestionnaireContext.Provider value={value}>{children}</QuestionnaireContext.Provider>
}

export function useQuestionnaireContext() {
    const context = useContext(QuestionnaireContext)
    if (!context) {
        throw new Error('useQuestionnaireContext deve ser usado dentro de QuestionnaireProvider')
    }
    return context
}
