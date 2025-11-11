import { type QuestionDefinition } from '@/vision-types'

export const ocularHealthQuestions: QuestionDefinition[] = [
    {
        id: 'dry-eye',
        category: 'ocularHealth',
        title: 'Diagnóstico de síndrome do olho seco',
        type: 'multiple-choice',
        required: true,
        critical: true,
        options: [
            { value: 'none', label: 'Nunca diagnosticado', impacts: { contactLens: 12, glasses: 2 } },
            { value: 'mild', label: 'Olho seco leve', impacts: { contactLens: 4, glasses: 4 } },
            { value: 'moderate', label: 'Olho seco moderado', impacts: { contactLens: -12, glasses: 4 }, riskTags: ['dry-eye-moderate'], scientificBasis: ['dry-eye-contacts-2023'] },
            { value: 'severe', label: 'Olho seco severo', impacts: { contactLens: -24, glasses: 6 }, riskTags: ['dry-eye-severe'], scientificBasis: ['dry-eye-contacts-2023'] },
            { value: 'treatment', label: 'Em tratamento ativo', impacts: { contactLens: -8, glasses: 4 }, riskTags: ['dry-eye-moderate'] }
        ]
    },
    {
        id: 'ocular-sensitivity',
        category: 'ocularHealth',
        title: 'Sensibilidade ocular',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Sem sensibilidade conhecida', impacts: { contactLens: 10, glasses: 2 } },
            { value: 'mild', label: 'Sensibilidade leve', impacts: { contactLens: 2, glasses: 2 } },
            { value: 'moderate', label: 'Sensibilidade moderada', impacts: { contactLens: -10, glasses: 4 }, riskTags: ['sensitivity-moderate'] },
            { value: 'severe', label: 'Sensibilidade severa', impacts: { contactLens: -18, glasses: 6 }, riskTags: ['sensitivity-high'] }
        ]
    },
    {
        id: 'ocular-allergies',
        category: 'ocularHealth',
        title: 'Alergias oculares',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Sem alergias conhecidas', impacts: { contactLens: 10, glasses: 2 } },
            { value: 'seasonal', label: 'Alergia sazonal', impacts: { contactLens: -4, glasses: 2 }, riskTags: ['allergy-seasonal'] },
            { value: 'perennial', label: 'Alergia perene', impacts: { contactLens: -12, glasses: 4 }, riskTags: ['allergy-perennial'] },
            { value: 'product-specific', label: 'Alergia a produtos específicos', impacts: { contactLens: -16, glasses: 6 }, riskTags: ['solution-allergy'] }
        ]
    },
    {
        id: 'infection-history',
        category: 'ocularHealth',
        title: 'Histórico de infecções oculares',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'never', label: 'Nunca teve', impacts: { contactLens: 12, glasses: 2 } },
            { value: 'few', label: '1-2 episódios', impacts: { contactLens: -4, glasses: 2 } },
            { value: 'recurrent', label: 'Episódios recorrentes', impacts: { contactLens: -18, glasses: 4 }, riskTags: ['infection-history'] },
            { value: 'recent', label: 'Infecção recente (< 6 meses)', impacts: { contactLens: -30, glasses: 4 }, riskTags: ['infection-recent'] }
        ]
    },
    {
        id: 'medications',
        category: 'ocularHealth',
        title: 'Uso de medicamentos',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'antihistamines', label: 'Anti-histamínicos', impacts: { contactLens: -8, glasses: 2 }, riskTags: ['dry-eye-moderate'] },
            { value: 'antidepressants', label: 'Antidepressivos', impacts: { contactLens: -6, glasses: 2 }, riskTags: ['dry-eye-moderate'] },
            { value: 'blood-pressure', label: 'Medicamentos para pressão', impacts: { contactLens: -4, glasses: 2 } },
            { value: 'isotretinoin', label: 'Isotretinoína', impacts: { contactLens: -24, glasses: 4 }, riskTags: ['dry-eye-severe'] },
            { value: 'eye-drops', label: 'Colírios de uso contínuo', impacts: { contactLens: -8, glasses: 2 } },
            { value: 'none', label: 'Nenhum medicamento regular', impacts: { contactLens: 8, glasses: 2 } }
        ]
    },
    {
        id: 'systemic-conditions',
        category: 'ocularHealth',
        title: 'Condições sistêmicas',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'diabetes', label: 'Diabetes', impacts: { contactLens: -12, glasses: 2 }, riskTags: ['diabetes-unstable'] },
            { value: 'autoimmune', label: 'Doenças autoimunes', impacts: { contactLens: -10, glasses: 2 }, riskTags: ['autoimmune'] },
            { value: 'sjogren', label: 'Síndrome de Sjögren', impacts: { contactLens: -24, glasses: 4 }, riskTags: ['dry-eye-severe'] },
            { value: 'rheumatoid', label: 'Artrite reumatoide', impacts: { contactLens: -12, glasses: 2 }, riskTags: ['autoimmune'] },
            { value: 'none', label: 'Nenhuma condição relevante', impacts: { contactLens: 10, glasses: 2 } }
        ]
    },
    {
        id: 'ocular-surgeries',
        category: 'ocularHealth',
        title: 'Cirurgias oculares prévias',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'none', label: 'Nunca realizou', impacts: { contactLens: 8, glasses: 2 } },
            { value: 'lasik', label: 'LASIK/PRK', impacts: { contactLens: 2, glasses: 2 } },
            { value: 'cataract', label: 'Cirurgia de catarata', impacts: { contactLens: -8, glasses: 4 } },
            { value: 'other', label: 'Outras cirurgias refrativas', impacts: { contactLens: -4, glasses: 2 } }
        ]
    },
    {
        id: 'sleep-quality',
        category: 'ocularHealth',
        title: 'Qualidade do sono',
        type: 'multiple-choice',
        required: true,
        options: [
            { value: 'excellent', label: 'Excelente (7-9h regulares)', impacts: { contactLens: 6, glasses: 2 } },
            { value: 'good', label: 'Boa (6-7h)', impacts: { contactLens: 4, glasses: 2 } },
            { value: 'irregular', label: 'Irregular (< 6h ou fragmentado)', impacts: { contactLens: -6, glasses: 2 }, riskTags: ['sleep-irregular'] },
            { value: 'chronic', label: 'Problemas crônicos de sono', impacts: { contactLens: -10, glasses: 2 }, riskTags: ['sleep-irregular'] }
        ]
    }
]
