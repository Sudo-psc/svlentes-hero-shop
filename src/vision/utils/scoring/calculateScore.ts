import { CATEGORY_WEIGHTS } from '@/vision/constants/weights'
import { SCORING_CONFIDENCE } from '@/vision/constants/thresholds'
import { resolveQuestionnaireFlow } from '@/vision/services/data/questionRepository'
import { applyInteractions } from '@/vision/utils/scoring/applyInteractions'
import { normalizeWeights } from '@/vision/utils/scoring/normalizeWeights'
import { type BaseScore } from '@/vision-types'

interface ScoreResult {
    contactLens: number
    glasses: number
    baseScores: BaseScore[]
    interactionFactors: ReturnType<typeof applyInteractions>['triggered']
}

export function calculateScore(answers: Record<string, string>): ScoreResult {
    const normalizedWeights = normalizeWeights(CATEGORY_WEIGHTS)
    const questionMap = new Map(resolveQuestionnaireFlow(answers).map(question => [question.id, question]))
    const baseScores: BaseScore[] = []

    Object.entries(answers).forEach(([questionId, value]) => {
        const question = questionMap.get(questionId)
        if (!question) {
            return
        }
        const option = question.options.find(item => item.value === value)
        if (!option) {
            return
        }
        const categoryWeight = normalizedWeights[question.category] ?? 0
        const confidence = question.critical ? SCORING_CONFIDENCE.critical : SCORING_CONFIDENCE.normal
        baseScores.push({
            factor: `${questionId}:${value}`,
            category: question.category,
            weight: categoryWeight,
            contactLensScore: option.impacts.contactLens * categoryWeight,
            glassesScore: option.impacts.glasses * categoryWeight,
            confidence,
            scientificBasis: option.scientificBasis ?? []
        })
    })

    const { adjustedScores, contactModifier, glassesModifier, triggered } = applyInteractions(baseScores, answers)

    const aggregate = adjustedScores.reduce(
        (acc, score) => {
            acc.contactLens += score.contactLensScore
            acc.glasses += score.glassesScore
            return acc
        },
        { contactLens: 0, glasses: 0 }
    )

    return {
        contactLens: aggregate.contactLens * contactModifier,
        glasses: aggregate.glasses * glassesModifier,
        baseScores: adjustedScores,
        interactionFactors: triggered
    }
}
