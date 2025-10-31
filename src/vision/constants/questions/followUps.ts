import { type QuestionDefinition } from '@/vision-types'

export const followUpQuestions: QuestionDefinition[] = [
    {
        id: 'aquatic-frequency',
        category: 'lifestyle',
        title: 'Frequência de prática de esportes aquáticos',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'occasional', label: 'Ocasional', impacts: { contactLens: -8, glasses: -4 }, riskTags: ['water-sports'] },
            { value: 'weekly', label: 'Semanal', impacts: { contactLens: -12, glasses: -6 }, riskTags: ['water-sports'] },
            { value: 'competitive', label: 'Competitivo', impacts: { contactLens: -16, glasses: -8 }, riskTags: ['water-sports'] }
        ]
    },
    {
        id: 'dry-eye-treatment',
        category: 'ocularHealth',
        title: 'Tratamentos atuais para olho seco',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'lubricants', label: 'Lubrificantes oculares', impacts: { contactLens: -4, glasses: 2 } },
            { value: 'medical-therapy', label: 'Terapia medicamentosa', impacts: { contactLens: -6, glasses: 2 }, riskTags: ['dry-eye-severe'] },
            { value: 'punctal-plugs', label: 'Tampões lacrimais', impacts: { contactLens: -2, glasses: 2 }, scientificBasis: ['dry-eye-contacts-2023'] },
            { value: 'none', label: 'Nenhum tratamento', impacts: { contactLens: -12, glasses: 4 }, riskTags: ['dry-eye-severe'] }
        ]
    },
    {
        id: 'presbyopia-work-needs',
        category: 'refractiveConditions',
        title: 'Necessidade de visão intermediária (computador)',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'high', label: 'Alta (8h/dia)', impacts: { contactLens: 2, glasses: 10 }, scientificBasis: ['presbyopia-guideline-2024'] },
            { value: 'moderate', label: 'Moderada (4h/dia)', impacts: { contactLens: 4, glasses: 8 }, scientificBasis: ['presbyopia-guideline-2024'] },
            { value: 'low', label: 'Baixa', impacts: { contactLens: 6, glasses: 4 } }
        ]
    },
    {
        id: 'budget-emphasis',
        category: 'preferences',
        title: 'Aspectos financeiros prioritários',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'initial-cost', label: 'Custo inicial baixo', impacts: { contactLens: -10, glasses: 6 }, riskTags: ['budget-low'] },
            { value: 'monthly-cost', label: 'Custo mensal controlado', impacts: { contactLens: -6, glasses: 4 }, riskTags: ['budget-low'] },
            { value: 'long-term', label: 'Custo total no longo prazo', impacts: { contactLens: -4, glasses: 4 } }
        ]
    }
]
