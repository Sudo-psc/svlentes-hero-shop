import { CONFIDENCE_THRESHOLDS } from '@/vision/constants/thresholds'
import { resolveQuestionnaireFlow } from '@/vision/services/data/questionRepository'
import { type BaseScore, type ConfidenceMetrics, type ConfidenceResult } from '@/vision-types'

function determineConfidenceLevel(score: number): ConfidenceMetrics['overallConfidence'] {
    if (score >= CONFIDENCE_THRESHOLDS.veryHigh) {
        return 'very-high'
    }
    if (score >= CONFIDENCE_THRESHOLDS.high) {
        return 'high'
    }
    if (score >= CONFIDENCE_THRESHOLDS.medium) {
        return 'medium'
    }
    return 'low'
}

export function computeConfidence(
    answers: Record<string, string>,
    baseScores: BaseScore[],
    interactionCount: number
): ConfidenceResult {
    const questions = resolveQuestionnaireFlow(answers)
    const completeness = questions.length === 0 ? 0 : Object.keys(answers).length / questions.length
    const evidenceBacked = baseScores.filter(score => score.scientificBasis.length > 0).length
    const consistencyBase = baseScores.reduce((acc, score) => acc + Math.abs(score.contactLensScore - score.glassesScore), 0)
    const maxConsistency = baseScores.length * 30
    const consistency = maxConsistency === 0 ? 0.5 : 1 - Math.min(consistencyBase / (maxConsistency * 2), 0.5)
    const scientificSupport = baseScores.length === 0 ? 0 : evidenceBacked / baseScores.length
    const edgeCasePenalty = interactionCount > 0 ? Math.min(interactionCount * 0.08, 0.25) : 0

    const aggregateScore = Math.max(
        0,
        Math.min(1, completeness * 0.4 + consistency * 0.3 + scientificSupport * 0.3 - edgeCasePenalty)
    )

    const metrics: ConfidenceMetrics = {
        dataCompleteness: Number(completeness.toFixed(2)),
        factorConsistency: Number(consistency.toFixed(2)),
        scientificSupport: Number(scientificSupport.toFixed(2)),
        edgeCaseDetection: Number((1 - edgeCasePenalty).toFixed(2)),
        overallConfidence: determineConfidenceLevel(aggregateScore)
    }

    const messages: string[] = []
    if (metrics.dataCompleteness < 0.7) {
        messages.push('Algumas perguntas essenciais não foram respondidas, o que reduz a confiança final.')
    }
    if (edgeCasePenalty > 0) {
        messages.push('Foram detectadas combinações complexas de fatores. Reforçamos a importância de avaliação clínica.')
    }
    if (metrics.scientificSupport > 0.6) {
        messages.push('A recomendação é sustentada por referências científicas robustas.')
    }

    return {
        breakdown: {
            metrics,
            score: Number(aggregateScore.toFixed(2))
        },
        messages
    }
}
