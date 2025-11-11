import { calculateScore } from '@/vision/utils/scoring/calculateScore'

const baseAnswers = {
    'activity-level': 'moderately-active',
    'work-environment': 'office',
    'travel-frequency': 'occasionally',
    'sports-practice': 'contact',
    'screen-time': '4-8h',
    'wearing-schedule': 'day-only',
    'dry-eye': 'none',
    'ocular-sensitivity': 'none',
    'ocular-allergies': 'none',
    'infection-history': 'never',
    'medications': 'none',
    'systemic-conditions': 'none',
    'ocular-surgeries': 'none',
    'sleep-quality': 'excellent',
    'aesthetic-importance': 'very-high',
    'maintenance-discipline': 'high',
    'monthly-budget': '200-400',
    'initial-investment': '1000-2000',
    'visual-experience': 'current-contacts',
    'glasses-style': 'sporty',
    'appearance-concern': 'very-concerned',
    'myopia-degree': 'moderate',
    'hyperopia-degree': 'none',
    'astigmatism-degree': 'moderate',
    'presbyopia-stage': 'none',
    'anisometropia': 'none',
    'prescription-stability': 'stable-gt-2',
    'air-conditioning': 'occasionally',
    'dust-exposure': 'light',
    'chemical-exposure': 'none',
    'protective-need': 'none',
    'regional-climate': 'humid',
    'altitude': 'sea-level'
}

describe('calculateScore', () => {
    it('favorece lentes de contato para perfil ativo sem contraindicações', () => {
        const result = calculateScore(baseAnswers)
        expect(result.contactLens).toBeGreaterThan(result.glasses)
    })

    it('identifica penalização quando há olho seco severo', () => {
        const dryEyeAnswers = { ...baseAnswers, 'dry-eye': 'severe' }
        const result = calculateScore(dryEyeAnswers)
        expect(result.contactLens).toBeLessThan(result.glasses)
    })
})
