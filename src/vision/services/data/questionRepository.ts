import { ALL_QUESTIONS } from '@/vision/constants/questions'
import { CONDITIONAL_QUESTIONS } from '@/vision/constants/questions/conditional'
import { followUpQuestions } from '@/vision/constants/questions/followUps'
import { type QuestionDefinition } from '@/vision-types'

const BASE_ESTIMATED_TIME = 28

const followUpMap = new Map(followUpQuestions.map(question => [question.id, question]))

function shouldShowConditional(questionId: string, answers: Record<string, string>): boolean {
    const conditional = CONDITIONAL_QUESTIONS.find(item => item.questionId === questionId)
    if (!conditional) {
        return false
    }
    return conditional.showIf.some(condition => {
        const userAnswer = answers[condition.questionId]
        if (condition.operator === 'NOT') {
            return userAnswer ? !condition.answerValues.includes(userAnswer) : false
        }
        if (!userAnswer) {
            return false
        }
        if (condition.operator === 'AND') {
            return condition.answerValues.every(value => value === userAnswer)
        }
        return condition.answerValues.includes(userAnswer)
    })
}

export function getBaseQuestions(): QuestionDefinition[] {
    return ALL_QUESTIONS
}

export function resolveQuestionnaireFlow(answers: Record<string, string>): QuestionDefinition[] {
    const base = [...ALL_QUESTIONS]
    const conditionalItems = CONDITIONAL_QUESTIONS.filter(item => shouldShowConditional(item.questionId, answers))
        .sort((a, b) => a.priority - b.priority)
        .map(item => followUpMap.get(item.questionId))
        .filter((question): question is QuestionDefinition => Boolean(question))
    return [...base, ...conditionalItems]
}

export function estimateCompletionTime(answerCount: number): number {
    const baseQuestions = ALL_QUESTIONS.length
    const conditionalCount = answerCount > 0 ? Math.min(answerCount / 4, followUpMap.size) : 0
    const total = baseQuestions + conditionalCount
    const minutes = (BASE_ESTIMATED_TIME / baseQuestions) * total
    return Math.ceil(minutes)
}
