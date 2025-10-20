import { FAQItem } from '@/types'
// Perguntas frequentes organizadas por categoria
export const faqData: FAQItem[] = [
    {
        id: 'how-it-works',
        question: 'Como funciona o serviço de assinatura?',
        answer: 'Cadastre-se, escolha seu plano e receba lentes automaticamente em casa com acompanhamento médico do Dr. Philipe Saraiva Cruz.',
        category: 'geral'
    },
    {
        id: 'medical-follow-up',
        question: 'Como é feito o acompanhamento médico?',
        answer: 'Consultas regulares + teleorientação com Dr. Philipe Saraiva Cruz (CRM 69.870), especialista em oftalmologia.',
        category: 'medico'
    },
    {
        id: 'lens-types',
        question: 'Que tipos de lentes vocês oferecem?',
        answer: 'Lentes diárias, semanais e mensais das melhores marcas. O tipo ideal é definido na consulta médica.',
        category: 'produto'
    },
    {
        id: 'prescription-needed',
        question: 'Preciso ter receita médica?',
        answer: 'Sim, lentes são dispositivos médicos. Sem receita atualizada? Agendamos consulta com Dr. Philipe.',
        category: 'medico'
    },
    {
        id: 'delivery-frequency',
        question: 'Com que frequência recebo as lentes?',
        answer: 'Básico: 3 meses | Premium: mensal | VIP: quinzenal. Sempre antes de acabar.',
        category: 'entrega'
    },
    {
        id: 'cancellation-policy',
        question: 'Posso cancelar a qualquer momento?',
        answer: 'Sim! Pause, altere ou cancele sem multas pelo WhatsApp ou app.',
        category: 'assinatura'
    },
    {
        id: 'emergency-replacement',
        question: 'E se eu perder ou danificar minhas lentes?',
        answer: 'Premium/VIP: seguro incluído | Básico: reposição com desconto especial.',
        category: 'suporte'
    },
    {
        id: 'cost-savings',
        question: 'Quanto eu economizo com a assinatura?',
        answer: 'Economia média de 30-40% vs. compra avulsa. Use a calculadora para seu caso.',
        category: 'preco'
    },
    {
        id: 'first-time-user',
        question: 'Nunca usei lentes de contato. Vocês me ajudam?',
        answer: 'Sim! Avaliação completa, treinamento e acompanhamento da adaptação com Dr. Philipe.',
        category: 'medico'
    },
    {
        id: 'coverage-area',
        question: 'Vocês atendem em todo o Brasil?',
        answer: 'Sim! Entrega grátis nacional. Consultas presenciais (SP) ou telemedicina.',
        category: 'entrega'
    }
]
// FAQ organizado por categorias para melhor UX
export const faqByCategory = {
    geral: faqData.filter(item => item.category === 'geral'),
    medico: faqData.filter(item => item.category === 'medico'),
    produto: faqData.filter(item => item.category === 'produto'),
    entrega: faqData.filter(item => item.category === 'entrega'),
    assinatura: faqData.filter(item => item.category === 'assinatura'),
    suporte: faqData.filter(item => item.category === 'suporte'),
    preco: faqData.filter(item => item.category === 'preco')
}
// FAQ destacado para a landing page (6 principais)
export const featuredFAQ: FAQItem[] = [
    faqData.find(item => item.id === 'how-it-works')!,
    faqData.find(item => item.id === 'medical-follow-up')!,
    faqData.find(item => item.id === 'cost-savings')!,
    faqData.find(item => item.id === 'cancellation-policy')!,
    faqData.find(item => item.id === 'prescription-needed')!,
    faqData.find(item => item.id === 'coverage-area')!
]