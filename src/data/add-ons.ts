import { AddOn } from '@/types'
// Serviços adicionais disponíveis
export const addOnsData: AddOn[] = [
    {
        id: 'consulta-extra',
        name: 'Consulta Médica Extra',
        description: 'Consulta adicional com Dr. Philipe quando precisar',
        price: 150.00,
        type: 'consulta'
    },
    {
        id: 'teleorientacao',
        name: 'Teleorientação Premium',
        description: 'Atendimento médico por vídeo 24/7',
        price: 49.90,
        type: 'teleorientacao'
    },
    {
        id: 'seguro-premium',
        name: 'Seguro Premium',
        description: 'Cobertura completa contra perda, dano e roubo',
        price: 29.90,
        type: 'seguro'
    },
    {
        id: 'atendimento-vip',
        name: 'Atendimento VIP',
        description: 'Suporte prioritário e concierge de saúde ocular',
        price: 99.90,
        type: 'vip'
    }
]
// Categorias de add-ons para organização
export const addOnCategories = {
    medical: {
        name: 'Serviços Médicos',
        description: 'Consultas e acompanhamento especializado',
        addOns: addOnsData.filter(addon => addon.type === 'consulta' || addon.type === 'teleorientacao')
    },
    protection: {
        name: 'Proteção e Seguro',
        description: 'Segurança para suas lentes e investimento',
        addOns: addOnsData.filter(addon => addon.type === 'seguro')
    },
    premium: {
        name: 'Experiência Premium',
        description: 'Atendimento diferenciado e exclusivo',
        addOns: addOnsData.filter(addon => addon.type === 'vip')
    }
}
// Pacotes de add-ons com desconto
export const addOnBundles = [
    {
        id: 'complete-care',
        name: 'Cuidado Completo',
        description: 'Teleorientação + Seguro Premium',
        addOns: ['teleorientacao', 'seguro-premium'],
        originalPrice: 79.80,
        bundlePrice: 69.90,
        savings: 9.90
    },
    {
        id: 'vip-experience',
        name: 'Experiência VIP Total',
        description: 'Todos os serviços premium incluídos',
        addOns: ['consulta-extra', 'teleorientacao', 'seguro-premium', 'atendimento-vip'],
        originalPrice: 329.70,
        bundlePrice: 279.90,
        savings: 49.80
    }
]