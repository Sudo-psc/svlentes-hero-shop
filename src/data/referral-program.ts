// Dados do programa de indicação SV Lentes
export interface ReferralProgram {
    mainCard: {
        title: string
        description: string
        benefitIndicator: string
        benefitIndicated: string
        icon: string
        highlight: boolean
    }
    rulesCard: {
        title: string
        rules: string[]
        icon: string
    }
    howItWorks: {
        title: string
        steps: Array<{
            number: number
            title: string
            description: string
            icon: string
        }>
    }
    terms: {
        title: string
        conditions: string[]
    }
}
export const referralProgramData: ReferralProgram = {
    mainCard: {
        title: 'Indique e Ganhe',
        description: 'Compartilhe o cuidado com a visão e seja recompensado por isso',
        benefitIndicator: 'R$ 50 de desconto',
        benefitIndicated: 'R$ 30 de desconto',
        icon: '🎁',
        highlight: true
    },
    rulesCard: {
        title: 'Como Funciona',
        rules: [
            'Você ganha R$ 50 de desconto na sua próxima mensalidade',
            'Seu amigo ganha R$ 30 de desconto na primeira assinatura',
            'Válido apenas para novos assinantes',
            'Sem limite de indicações por mês',
            'Desconto aplicado automaticamente após confirmação do pagamento'
        ],
        icon: '📋'
    },
    howItWorks: {
        title: 'Passos Simples',
        steps: [
            {
                number: 1,
                title: 'Compartilhe seu link',
                description: 'Envie seu link personalizado para amigos e familiares',
                icon: '📤'
            },
            {
                number: 2,
                title: 'Amigo se inscreve',
                description: 'Seu amigo se cadastra e faz a primeira assinatura',
                icon: '✍️'
            },
            {
                number: 3,
                title: 'Vocês ganham',
                description: 'Ambos recebem os descontos automaticamente',
                icon: '🎉'
            }
        ]
    },
    terms: {
        title: 'Termos e Condições',
        conditions: [
            'Válido apenas para novos clientes que nunca assinaram a SV Lentes',
            'O desconto do indicador é aplicado na próxima cobrança após confirmação',
            'O desconto do indicado é aplicado na primeira mensalidade',
            'Não cumulativo com outras promoções',
            'SV Lentes se reserva o direito de alterar as condições do programa',
            'Programa sujeito a análise de fraude'
        ]
    }
}
// Dados para tracking e analytics
export const referralAnalytics = {
    events: {
        referral_link_generated: 'referral_link_generated',
        referral_link_shared: 'referral_link_shared',
        referral_signup: 'referral_signup',
        referral_conversion: 'referral_conversion'
    },
    sources: [
        'whatsapp',
        'email',
        'social_media',
        'direct_link',
        'other'
    ]
}