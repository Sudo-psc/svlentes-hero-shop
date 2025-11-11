import { type BaseScore, type FactorInteraction } from '@/vision-types'

interface InteractionResult {
    adjustedScores: BaseScore[]
    contactModifier: number
    glassesModifier: number
    triggered: FactorInteraction[]
}

const INTERACTIONS: FactorInteraction[] = [
    {
        factors: ['sports-practice:contact', 'dry-eye:severe'],
        interactionType: 'antagonistic',
        modifier: 0.7,
        description: 'Atletas de contato com olho seco severo têm maior risco com lentes de contato.',
        scientificEvidence: 'dry-eye-contacts-2023'
    },
    {
        factors: ['myopia-degree:high', 'sports-practice:contact'],
        interactionType: 'synergistic',
        modifier: 1.3,
        description: 'Alta miopia com esportes de contato favorece campo visual ampliado das lentes.',
        scientificEvidence: 'athlete-performance-2022'
    },
    {
        factors: ['presbyopia-stage:advanced', 'screen-time:gt-8h'],
        interactionType: 'conditional',
        modifier: 0.8,
        description: 'Presbiopia avançada com trabalho intenso em telas beneficia óculos progressivos.',
        scientificEvidence: 'presbyopia-guideline-2024'
    },
    {
        factors: ['monthly-budget:lt-100', 'myopia-degree:high'],
        interactionType: 'antagonistic',
        modifier: 0.75,
        description: 'Orçamento muito limitado com grau alto favorece iniciar com óculos.',
        scientificEvidence: 'cost-analysis-2021'
    }
]

function matchesInteraction(interaction: FactorInteraction, answers: Record<string, string>): boolean {
    return interaction.factors.every(factor => {
        const [questionId, value] = factor.split(':')
        return answers[questionId] === value
    })
}

export function applyInteractions(baseScores: BaseScore[], answers: Record<string, string>): InteractionResult {
    let contactModifier = 1
    let glassesModifier = 1
    const triggered: FactorInteraction[] = []

    INTERACTIONS.forEach(interaction => {
        if (matchesInteraction(interaction, answers)) {
            triggered.push(interaction)
            if (interaction.interactionType === 'synergistic') {
                contactModifier *= interaction.modifier
            }
            if (interaction.interactionType === 'antagonistic') {
                contactModifier *= interaction.modifier
                glassesModifier *= 1 / interaction.modifier
            }
            if (interaction.interactionType === 'conditional') {
                glassesModifier *= 1 / interaction.modifier
            }
        }
    })

    const adjustedScores = baseScores.map(score => {
        if (score.factor.startsWith('presbyopia-stage') && answers['screen-time'] === 'gt-8h') {
            return {
                ...score,
                glassesScore: score.glassesScore * 1.1
            }
        }
        return score
    })

    return { adjustedScores, contactModifier, glassesModifier, triggered }
}
