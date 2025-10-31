import { type ConditionalLogic } from '@/vision-types'

export const CONDITIONAL_QUESTIONS: ConditionalLogic[] = [
    {
        questionId: 'aquatic-frequency',
        showIf: [
            {
                questionId: 'sports-practice',
                answerValues: ['aquatic'],
                operator: 'OR'
            }
        ],
        priority: 1
    },
    {
        questionId: 'dry-eye-treatment',
        showIf: [
            {
                questionId: 'dry-eye',
                answerValues: ['moderate', 'severe', 'treatment'],
                operator: 'OR'
            }
        ],
        priority: 2
    },
    {
        questionId: 'presbyopia-work-needs',
        showIf: [
            {
                questionId: 'presbyopia-stage',
                answerValues: ['early', 'established', 'advanced'],
                operator: 'OR'
            }
        ],
        priority: 3
    },
    {
        questionId: 'budget-emphasis',
        showIf: [
            {
                questionId: 'monthly-budget',
                answerValues: ['lt-100', '100-200'],
                operator: 'OR'
            }
        ],
        priority: 4
    }
]
