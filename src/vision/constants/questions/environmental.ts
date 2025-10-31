import { type QuestionDefinition } from '@/vision-types'

export const environmentalQuestions: QuestionDefinition[] = [
    {
        id: 'air-conditioning',
        category: 'environmental',
        title: 'Exposição a ar-condicionado',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'rarely', label: 'Raramente', impacts: { contactLens: 6, glasses: 2 } },
            { value: 'occasionally', label: 'Ocasionalmente (< 4h/dia)', impacts: { contactLens: 2, glasses: 2 } },
            { value: 'frequently', label: 'Frequentemente (4-8h/dia)', impacts: { contactLens: -4, glasses: 4 }, riskTags: ['dry-eye-moderate'] },
            { value: 'constantly', label: 'Constantemente (> 8h/dia)', impacts: { contactLens: -8, glasses: 4 }, riskTags: ['dry-eye-moderate'] }
        ]
    },
    {
        id: 'dust-exposure',
        category: 'environmental',
        title: 'Exposição a poeira/poluição',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'clean', label: 'Ambiente limpo', impacts: { contactLens: 6, glasses: 2 } },
            { value: 'light', label: 'Exposição leve', impacts: { contactLens: 2, glasses: 2 } },
            { value: 'moderate', label: 'Exposição moderada', impacts: { contactLens: -6, glasses: 4 }, riskTags: ['environment-dust'] },
            { value: 'high', label: 'Exposição alta', impacts: { contactLens: -10, glasses: 6 }, riskTags: ['environment-dust'] }
        ]
    },
    {
        id: 'chemical-exposure',
        category: 'environmental',
        title: 'Trabalho com produtos químicos',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Não trabalha', impacts: { contactLens: 6, glasses: 2 } },
            { value: 'occasional', label: 'Exposição ocasional', impacts: { contactLens: -2, glasses: 2 } },
            { value: 'regular', label: 'Exposição regular', impacts: { contactLens: -8, glasses: 4 }, riskTags: ['chemical-exposure'] },
            { value: 'constant', label: 'Exposição constante', impacts: { contactLens: -12, glasses: 6 }, riskTags: ['chemical-exposure'] }
        ]
    },
    {
        id: 'protective-need',
        category: 'environmental',
        title: 'Necessidade de proteção ocular',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Não necessária', impacts: { contactLens: 6, glasses: 2 } },
            { value: 'occasional', label: 'Ocasionalmente necessária', impacts: { contactLens: 2, glasses: 2 } },
            { value: 'frequent', label: 'Frequentemente necessária', impacts: { contactLens: -6, glasses: 4 }, riskTags: ['safety-gear'] },
            { value: 'mandatory', label: 'Obrigatória por norma', impacts: { contactLens: -12, glasses: 6 }, riskTags: ['safety-gear'] }
        ]
    },
    {
        id: 'regional-climate',
        category: 'environmental',
        title: 'Clima predominante da região',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'humid', label: 'Úmido', impacts: { contactLens: 6, glasses: 2 } },
            { value: 'dry', label: 'Seco', impacts: { contactLens: -4, glasses: 2 }, riskTags: ['dry-eye-moderate'] },
            { value: 'very-dry', label: 'Muito seco', impacts: { contactLens: -8, glasses: 4 }, riskTags: ['dry-eye-moderate'] },
            { value: 'variable', label: 'Variável', impacts: { contactLens: 2, glasses: 2 } }
        ]
    },
    {
        id: 'altitude',
        category: 'environmental',
        title: 'Altitude da residência/trabalho',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'sea-level', label: 'Nível do mar', impacts: { contactLens: 4, glasses: 2 } },
            { value: 'moderate', label: 'Altitude moderada (500-1500m)', impacts: { contactLens: 2, glasses: 2 } },
            { value: 'high', label: 'Altitude alta (> 1500m)', impacts: { contactLens: -4, glasses: 4 }, riskTags: ['environment-dry'] }
        ]
    }
]
