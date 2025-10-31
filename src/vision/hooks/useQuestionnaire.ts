'use client'

import { useCallback, useMemo } from 'react'
import { estimateCompletionTime, resolveQuestionnaireFlow } from '@/vision/services/data/questionRepository'
import { useLocalStorage } from '@/vision-hooks/useLocalStorage'
import { type QuestionnaireContextValue, type QuestionnaireState } from '@/vision-types'

const INITIAL_STATE: QuestionnaireState = {
    currentIndex: 0,
    answers: {},
    isComplete: false
}

export function useQuestionnaire(): QuestionnaireContextValue {
    const { value: state, setValue, clear } = useLocalStorage<QuestionnaireState>('vision-questionnaire', INITIAL_STATE)

    const questions = useMemo(() => resolveQuestionnaireFlow(state.answers), [state.answers])
    const currentQuestion = questions[state.currentIndex] ?? null

    const updateState = useCallback(
        (updater: (prev: QuestionnaireState) => QuestionnaireState) => {
            setValue(prev => {
                const nextState = updater(prev)
                const completed = Object.keys(nextState.answers).length >= questions.length
                return {
                    ...nextState,
                    isComplete: completed
                }
            })
        },
        [questions.length, setValue]
    )

    const goNext = useCallback(() => {
        updateState(prev => {
            const nextIndex = Math.min(prev.currentIndex + 1, questions.length - 1)
            return { ...prev, currentIndex: nextIndex }
        })
    }, [questions.length, updateState])

    const goPrevious = useCallback(() => {
        updateState(prev => ({ ...prev, currentIndex: Math.max(prev.currentIndex - 1, 0) }))
    }, [updateState])

    const setAnswer = useCallback(
        (questionId: string, value: string) => {
            updateState(prev => {
                const answers = { ...prev.answers, [questionId]: value }
                const nextIndex = Math.min(prev.currentIndex + 1, questions.length - 1)
                return { ...prev, answers, currentIndex: nextIndex }
            })
        },
        [questions.length, updateState]
    )

    const reset = useCallback(() => {
        clear()
    }, [clear])

    const getProgress = useCallback(() => {
        if (questions.length === 0) {
            return 0
        }
        const answered = Object.keys(state.answers).length
        return Math.round((answered / questions.length) * 100)
    }, [questions.length, state.answers])

    const estimatedTimeRemaining = useCallback(() => {
        const answered = Object.keys(state.answers).length
        const totalMinutes = estimateCompletionTime(answered)
        const progress = getProgress()
        const remaining = totalMinutes * (1 - progress / 100)
        return Math.max(1, Math.round(remaining))
    }, [getProgress, state.answers])

    return {
        questions,
        currentQuestion,
        state,
        goNext,
        goPrevious,
        setAnswer,
        reset,
        getProgress,
        estimatedTimeRemaining
    }
}
