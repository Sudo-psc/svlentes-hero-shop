'use client'

import { useMemo } from 'react'
import { generateRecommendation } from '@/vision/services/ai/recommendationEngine'
import { type FinalResult } from '@/vision-types'

interface UseRecommendationOptions {
    answers: Record<string, string>
    isReady: boolean
}

export function useRecommendation({ answers, isReady }: UseRecommendationOptions) {
    const recommendation = useMemo<FinalResult | null>(() => {
        if (!isReady || Object.keys(answers).length === 0) {
            return null
        }
        return generateRecommendation(answers)
    }, [answers, isReady])

    return recommendation
}
