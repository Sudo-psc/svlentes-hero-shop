import { type QuestionDefinition } from '@/vision-types'

export const lifestyleQuestions: QuestionDefinition[] = [
    {
        id: 'activity-level',
        category: 'lifestyle',
        title: 'Nível de atividade física diária',
        type: 'multiple-choice',
        required: true,
        options: [
            {
                value: 'sedentary',
                label: 'Sedentário (< 30min/dia)',
                impacts: { contactLens: -6, glasses: 4 }
            },
            {
                value: 'lightly-active',
                label: 'Levemente ativo (30-60min/dia)',
                impacts: { contactLens: 4, glasses: 2 }
            },
            {
                value: 'moderately-active',
                label: 'Moderadamente ativo (1-2h/dia)',
                impacts: { contactLens: 8, glasses: 0 },
                tooltip: 'Perfis ativos tendem a valorizar liberdade de movimento'
            },
            {
                value: 'very-active',
                label: 'Muito ativo (> 2h/dia)',
                impacts: { contactLens: 12, glasses: -4 },
                scientificBasis: ['athlete-performance-2022']
            },
            {
                value: 'competitive-athlete',
                label: 'Atleta profissional/amador competitivo',
                impacts: { contactLens: 18, glasses: -8 },
                scientificBasis: ['athlete-performance-2022']
            }
        ]
    },
    {
        id: 'work-environment',
        category: 'lifestyle',
        title: 'Ambiente de trabalho predominante',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'office', label: 'Escritório climatizado (> 6h/dia)', impacts: { contactLens: -2, glasses: 4 } },
            { value: 'outdoor', label: 'Ambiente externo', impacts: { contactLens: 8, glasses: -2 } },
            { value: 'industrial', label: 'Ambiente industrial', impacts: { contactLens: -10, glasses: 6 }, riskTags: ['environment-dust'] },
            { value: 'mixed', label: 'Ambiente misto', impacts: { contactLens: 2, glasses: 2 } },
            { value: 'remote', label: 'Trabalho remoto/home office', impacts: { contactLens: -2, glasses: 2 } }
        ]
    },
    {
        id: 'travel-frequency',
        category: 'lifestyle',
        title: 'Frequência de viagens',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'rarely', label: 'Raramente (< 1x/ano)', impacts: { contactLens: -2, glasses: 2 } },
            { value: 'occasionally', label: 'Ocasionalmente (2-4x/ano)', impacts: { contactLens: 2, glasses: 2 } },
            { value: 'frequently', label: 'Frequentemente (> 5x/ano)', impacts: { contactLens: 6, glasses: 0 } },
            { value: 'constant', label: 'Viajante constante', impacts: { contactLens: 8, glasses: -2 } }
        ]
    },
    {
        id: 'sports-practice',
        category: 'lifestyle',
        title: 'Prática de esportes',
        type: 'multiple-choice',
        required: true,
        critical: true,
        options: [
            { value: 'aquatic', label: 'Esportes aquáticos', impacts: { contactLens: -6, glasses: -12 }, riskTags: ['water-sports'] },
            { value: 'contact', label: 'Esportes de contato', impacts: { contactLens: 12, glasses: -10 }, riskTags: ['sports-contact'], scientificBasis: ['athlete-performance-2022'] },
            { value: 'precision', label: 'Esportes de precisão', impacts: { contactLens: 8, glasses: 4 } },
            { value: 'extreme', label: 'Esportes radicais', impacts: { contactLens: 10, glasses: -6 } },
            { value: 'none', label: 'Não pratica esportes regularmente', impacts: { contactLens: -4, glasses: 4 } }
        ]
    },
    {
        id: 'screen-time',
        category: 'lifestyle',
        title: 'Exposição a telas digitais',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'lt-2h', label: '< 2 horas/dia', impacts: { contactLens: 0, glasses: 2 } },
            { value: '2-4h', label: '2-4 horas/dia', impacts: { contactLens: 2, glasses: 2 } },
            { value: '4-8h', label: '4-8 horas/dia', impacts: { contactLens: 4, glasses: 2 } },
            { value: 'gt-8h', label: '> 8 horas/dia', impacts: { contactLens: 2, glasses: 4 }, scientificBasis: ['presbyopia-guideline-2024'] }
        ]
    },
    {
        id: 'wearing-schedule',
        category: 'lifestyle',
        title: 'Horário de uso da correção visual',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'day-only', label: 'Apenas durante o dia', impacts: { contactLens: 4, glasses: 4 } },
            { value: 'day-night', label: 'Dia e noite (> 12h/dia)', impacts: { contactLens: -4, glasses: 2 }, riskTags: ['extended-wear'] },
            { value: 'intermittent', label: 'Uso intermitente', impacts: { contactLens: 2, glasses: 2 } },
            { value: 'full-time', label: '24 horas (exceto dormir)', impacts: { contactLens: -8, glasses: 6 }, riskTags: ['extended-wear'] }
        ]
    }
]
