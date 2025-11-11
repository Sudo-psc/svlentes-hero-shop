import { type ScientificReference } from './scientific'

export type QuestionCategory =
    | 'lifestyle'
    | 'ocularHealth'
    | 'preferences'
    | 'refractiveConditions'
    | 'environmental'

export type QuestionType = 'multiple-choice' | 'range' | 'boolean'

export interface OptionImpact {
    contactLens: number
    glasses: number
    riskTags?: string[]
    scientificBasis?: string[]
}

export interface QuestionOption {
    value: string
    label: string
    description?: string
    tooltip?: string
    impacts: OptionImpact
    riskTags?: string[]
    scientificBasis?: string[]
}

export interface QuestionDefinition {
    id: string
    category: QuestionCategory
    title: string
    description?: string
    type: QuestionType
    required: boolean
    critical?: boolean
    options: QuestionOption[]
    scientificReferences?: ScientificReference['id'][]
}

export interface ConditionalLogic {
    questionId: string
    showIf: {
        questionId: string
        answerValues: string[]
        operator: 'AND' | 'OR' | 'NOT'
    }[]
    priority: number
}

export interface QuestionnaireState {
    currentIndex: number
    answers: Record<string, string>
    isComplete: boolean
}

export interface QuestionnaireContextValue {
    questions: QuestionDefinition[]
    currentQuestion: QuestionDefinition | null
    state: QuestionnaireState
    goNext: () => void
    goPrevious: () => void
    setAnswer: (questionId: string, value: string) => void
    reset: () => void
    getProgress: () => number
    estimatedTimeRemaining: () => number
}
