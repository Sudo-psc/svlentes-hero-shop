import { type QuestionDefinition } from '@/vision-types'

export const preferenceQuestions: QuestionDefinition[] = [
    {
        id: 'aesthetic-importance',
        category: 'preferences',
        title: 'Importância da estética',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'very-high', label: 'Muito importante', impacts: { contactLens: 14, glasses: -2 } },
            { value: 'high', label: 'Importante', impacts: { contactLens: 8, glasses: 0 } },
            { value: 'moderate', label: 'Moderadamente importante', impacts: { contactLens: 4, glasses: 4 } },
            { value: 'low', label: 'Pouco importante', impacts: { contactLens: 0, glasses: 6 } },
            { value: 'indifferent', label: 'Indiferente', impacts: { contactLens: 0, glasses: 2 } }
        ]
    },
    {
        id: 'maintenance-discipline',
        category: 'preferences',
        title: 'Disposição para rotina de manutenção',
        type: 'multiple-choice',
        required: true,
        critical: true,
        options: [
            { value: 'high', label: 'Alta', impacts: { contactLens: 12, glasses: 0 } },
            { value: 'moderate', label: 'Moderada', impacts: { contactLens: 6, glasses: 2 } },
            { value: 'low', label: 'Baixa', impacts: { contactLens: -6, glasses: 2 }, riskTags: ['hygiene-poor'] },
            { value: 'very-low', label: 'Muito baixa', impacts: { contactLens: -14, glasses: 6 }, riskTags: ['hygiene-poor'] }
        ]
    },
    {
        id: 'monthly-budget',
        category: 'preferences',
        title: 'Orçamento mensal disponível',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'lt-100', label: 'Até R$ 100', impacts: { contactLens: -12, glasses: 6 }, riskTags: ['budget-low'] },
            { value: '100-200', label: 'R$ 100-200', impacts: { contactLens: -4, glasses: 4 } },
            { value: '200-400', label: 'R$ 200-400', impacts: { contactLens: 4, glasses: 2 } },
            { value: '400-800', label: 'R$ 400-800', impacts: { contactLens: 6, glasses: 0 } },
            { value: 'gt-800', label: '> R$ 800', impacts: { contactLens: 10, glasses: 0 } },
            { value: 'no-limit', label: 'Sem restrição', impacts: { contactLens: 12, glasses: 0 } }
        ]
    },
    {
        id: 'initial-investment',
        category: 'preferences',
        title: 'Investimento inicial aceitável',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'lt-500', label: 'Até R$ 500', impacts: { contactLens: -10, glasses: 6 }, riskTags: ['budget-low'] },
            { value: '500-1000', label: 'R$ 500-1.000', impacts: { contactLens: -4, glasses: 4 } },
            { value: '1000-2000', label: 'R$ 1.000-2.000', impacts: { contactLens: 2, glasses: 2 } },
            { value: '2000-5000', label: 'R$ 2.000-5.000', impacts: { contactLens: 6, glasses: 0 } },
            { value: 'gt-5000', label: '> R$ 5.000', impacts: { contactLens: 8, glasses: 0 } }
        ]
    },
    {
        id: 'visual-experience',
        category: 'preferences',
        title: 'Experiência prévia com correção visual',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'first-time', label: 'Primeira vez', impacts: { contactLens: -4, glasses: 6 } },
            { value: 'glasses-lt-2', label: 'Usa óculos há < 2 anos', impacts: { contactLens: 2, glasses: 4 } },
            { value: 'glasses-gt-2', label: 'Usa óculos há > 2 anos', impacts: { contactLens: 4, glasses: 4 } },
            { value: 'failed-contacts', label: 'Já tentou lentes (não adaptou)', impacts: { contactLens: -12, glasses: 4 }, riskTags: ['adaptation-history'] },
            { value: 'current-contacts', label: 'Usa lentes atualmente', impacts: { contactLens: 10, glasses: 0 } },
            { value: 'alternates', label: 'Alterna entre óculos e lentes', impacts: { contactLens: 6, glasses: 4 } }
        ]
    },
    {
        id: 'glasses-style',
        category: 'preferences',
        title: 'Preferência de estilo (óculos)',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'minimalist', label: 'Discreto/minimalista', impacts: { contactLens: 2, glasses: 4 } },
            { value: 'fashion', label: 'Fashion/statement', impacts: { contactLens: -2, glasses: 6 } },
            { value: 'professional', label: 'Profissional/clássico', impacts: { contactLens: 0, glasses: 6 } },
            { value: 'sporty', label: 'Esportivo/funcional', impacts: { contactLens: 6, glasses: 4 } },
            { value: 'indifferent', label: 'Indiferente', impacts: { contactLens: 2, glasses: 2 } }
        ]
    },
    {
        id: 'appearance-concern',
        category: 'preferences',
        title: 'Preocupação com aparência',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'very-concerned', label: 'Muito preocupado', impacts: { contactLens: 12, glasses: -2 } },
            { value: 'concerned', label: 'Preocupado', impacts: { contactLens: 8, glasses: 0 } },
            { value: 'moderate', label: 'Moderadamente preocupado', impacts: { contactLens: 4, glasses: 4 } },
            { value: 'low', label: 'Pouco preocupado', impacts: { contactLens: 0, glasses: 4 } },
            { value: 'none', label: 'Não se preocupa', impacts: { contactLens: -2, glasses: 4 } }
        ]
    }
]
