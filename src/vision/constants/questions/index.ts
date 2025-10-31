import { environmentalQuestions } from './environmental'
import { lifestyleQuestions } from './lifestyle'
import { ocularHealthQuestions } from './ocularHealth'
import { preferenceQuestions } from './preferences'
import { refractiveQuestions } from './specificConditions'

export const ALL_QUESTIONS = [
    ...ocularHealthQuestions,
    ...lifestyleQuestions,
    ...refractiveQuestions,
    ...preferenceQuestions,
    ...environmentalQuestions
]
