import { calculateScore } from '@/vision/utils/scoring/calculateScore'
import { type BaseScore } from '@/vision-types'

export interface ScoreComputation {
    contactLens: number
    glasses: number
    baseScores: BaseScore[]
}

export function computeScores(answers: Record<string, string>): ScoreComputation {
    const result = calculateScore(answers)
    return {
        contactLens: result.contactLens,
        glasses: result.glasses,
        baseScores: result.baseScores
    }
}
