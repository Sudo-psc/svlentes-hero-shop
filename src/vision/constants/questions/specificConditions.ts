import { type QuestionDefinition } from '@/vision-types'

export const refractiveQuestions: QuestionDefinition[] = [
    {
        id: 'myopia-degree',
        category: 'refractiveConditions',
        title: 'Grau de miopia',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Sem miopia', impacts: { contactLens: -2, glasses: 6 } },
            { value: 'mild', label: 'Miopia leve (-0,25 a -3,00)', impacts: { contactLens: 6, glasses: 4 } },
            { value: 'moderate', label: 'Miopia moderada (-3,25 a -6,00)', impacts: { contactLens: 8, glasses: 2 } },
            { value: 'high', label: 'Miopia alta (-6,25 a -10,00)', impacts: { contactLens: 12, glasses: -2 }, scientificBasis: ['athlete-performance-2022'] },
            { value: 'extreme', label: 'Miopia extrema (> -10,00)', impacts: { contactLens: 14, glasses: -4 }, riskTags: ['high-refractive'] }
        ]
    },
    {
        id: 'hyperopia-degree',
        category: 'refractiveConditions',
        title: 'Grau de hipermetropia',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Sem hipermetropia', impacts: { contactLens: 2, glasses: 6 } },
            { value: 'mild', label: 'Hipermetropia leve (+0,25 a +2,00)', impacts: { contactLens: 4, glasses: 4 } },
            { value: 'moderate', label: 'Hipermetropia moderada (+2,25 a +4,00)', impacts: { contactLens: 6, glasses: 4 } },
            { value: 'high', label: 'Hipermetropia alta (> +4,00)', impacts: { contactLens: 4, glasses: 6 }, riskTags: ['progressive-needed'] }
        ]
    },
    {
        id: 'astigmatism-degree',
        category: 'refractiveConditions',
        title: 'Astigmatismo',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Sem astigmatismo', impacts: { contactLens: 2, glasses: 6 } },
            { value: 'mild', label: 'Astigmatismo leve (-0,25 a -1,00)', impacts: { contactLens: 4, glasses: 4 } },
            { value: 'moderate', label: 'Astigmatismo moderado (-1,25 a -2,00)', impacts: { contactLens: 6, glasses: 4 } },
            { value: 'high', label: 'Astigmatismo alto (> -2,00)', impacts: { contactLens: 8, glasses: 2 }, riskTags: ['toric-needed'] },
            { value: 'irregular', label: 'Astigmatismo irregular', impacts: { contactLens: 12, glasses: -2 }, riskTags: ['scleral-indicated'] }
        ]
    },
    {
        id: 'presbyopia-stage',
        category: 'refractiveConditions',
        title: 'Presbiopia (vista cansada)',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Não tenho (< 40 anos)', impacts: { contactLens: 4, glasses: 4 } },
            { value: 'early', label: 'Início (40-45 anos)', impacts: { contactLens: 4, glasses: 6 }, scientificBasis: ['presbyopia-guideline-2024'] },
            { value: 'established', label: 'Estabelecida (45-55 anos)', impacts: { contactLens: 2, glasses: 8 }, scientificBasis: ['presbyopia-guideline-2024'] },
            { value: 'advanced', label: 'Avançada (> 55 anos)', impacts: { contactLens: 0, glasses: 10 }, riskTags: ['progressive-needed'] }
        ]
    },
    {
        id: 'anisometropia',
        category: 'refractiveConditions',
        title: 'Anisometropia (diferença entre olhos)',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Sem diferença significativa', impacts: { contactLens: 2, glasses: 4 } },
            { value: 'moderate', label: 'Diferença moderada (1,00-2,00)', impacts: { contactLens: 6, glasses: 2 } },
            { value: 'high', label: 'Diferença alta (> 2,00)', impacts: { contactLens: 10, glasses: 0 }, riskTags: ['anisometropia'] }
        ]
    },
    {
        id: 'prescription-stability',
        category: 'refractiveConditions',
        title: 'Progressão do grau',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'stable-gt-2', label: 'Estável há > 2 anos', impacts: { contactLens: 6, glasses: 4 } },
            { value: 'stable-1-2', label: 'Estável há 1-2 anos', impacts: { contactLens: 4, glasses: 4 } },
            { value: 'changed-last-year', label: 'Mudou no último ano', impacts: { contactLens: -4, glasses: 4 } },
            { value: 'frequent-change', label: 'Muda frequentemente', impacts: { contactLens: -8, glasses: 2 }, riskTags: ['monitoring-high'] },
            { value: 'unknown', label: 'Não sei', impacts: { contactLens: -2, glasses: 2 } }
        ]
    }
]
