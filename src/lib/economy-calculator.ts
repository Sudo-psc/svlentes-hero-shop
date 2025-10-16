/**
 * @deprecated This file contains duplicated logic. Use calculator-service.ts instead.
 * This file is kept for backward compatibility but will be removed in a future version.
 */

import { economyCalculatorData } from '@/data/pricing-plans'

export interface EconomyCalculationInput {
    lensType: 'daily' | 'weekly' | 'monthly'
    usage: 'occasional' | 'regular' | 'daily'
    currentSpending?: number // Gasto atual mensal (opcional)
}

export interface EconomyCalculationResult {
    // Custos mensais
    currentMonthlyCost: number
    subscriptionMonthlyCost: number
    monthlySavings: number

    // Custos anuais
    currentAnnualCost: number
    subscriptionAnnualCost: number
    annualSavings: number

    // Percentuais
    savingsPercentage: number

    // Detalhes do cálculo
    lensesPerMonth: number
    costPerLens: {
        current: number
        subscription: number
    }

    // Recomendação de plano
    recommendedPlan: {
        id: 'basic' | 'premium' | 'vip'
        name: string
        price: number
        savings: number
    }

    // Benefícios adicionais
    additionalBenefits: string[]
}

// Função principal para calcular economia
export function calculateEconomy(input: EconomyCalculationInput): EconomyCalculationResult {
    const { lensType, usage } = input

    // Obter dados de preços
    const priceData = economyCalculatorData.averagePrices[lensType]
    const usageData = economyCalculatorData.usagePatterns[usage]

    // Calcular lentes por mês baseado no tipo e uso
    const lensesPerMonth = calculateLensesPerMonth(lensType, usage)

    // Custos mensais
    const currentMonthlyCost = input.currentSpending || (lensesPerMonth * priceData.avulso)
    const subscriptionMonthlyCost = lensesPerMonth * priceData.subscription
    const monthlySavings = currentMonthlyCost - subscriptionMonthlyCost

    // Custos anuais
    const currentAnnualCost = currentMonthlyCost * 12
    const subscriptionAnnualCost = subscriptionMonthlyCost * 12
    const annualSavings = currentAnnualCost - subscriptionAnnualCost

    // Percentual de economia
    const savingsPercentage = (monthlySavings / currentMonthlyCost) * 100

    // Recomendação de plano baseada no uso
    const recommendedPlan = getRecommendedPlan(lensType, usage, annualSavings)

    // Benefícios adicionais baseados na economia
    const additionalBenefits = getAdditionalBenefits(annualSavings, lensType)

    return {
        currentMonthlyCost,
        subscriptionMonthlyCost,
        monthlySavings,
        currentAnnualCost,
        subscriptionAnnualCost,
        annualSavings,
        savingsPercentage,
        lensesPerMonth,
        costPerLens: {
            current: priceData.avulso,
            subscription: priceData.subscription
        },
        recommendedPlan,
        additionalBenefits
    }
}

// Calcular quantas lentes são necessárias por mês
function calculateLensesPerMonth(lensType: 'daily' | 'weekly' | 'monthly', usage: 'occasional' | 'regular' | 'daily'): number {
    const usageMultiplier = economyCalculatorData.usagePatterns[usage].multiplier
    const daysPerMonth = economyCalculatorData.usagePatterns[usage].daysPerMonth

    switch (lensType) {
        case 'daily':
            // Lentes diárias: 1 par por dia de uso
            return Math.ceil(daysPerMonth * 2) // 2 lentes por dia (uma para cada olho)

        case 'weekly':
            // Lentes semanais: 1 par por semana, considerando uso
            const weeksPerMonth = 4.33 // Média de semanas por mês
            return Math.ceil(weeksPerMonth * usageMultiplier * 2)

        case 'monthly':
            // Lentes mensais: 1 par por mês
            return 2 // 1 lente para cada olho

        default:
            return 2
    }
}

// Recomendar plano baseado no perfil do usuário
function getRecommendedPlan(
    lensType: 'daily' | 'weekly' | 'monthly',
    usage: 'occasional' | 'regular' | 'daily',
    annualSavings: number
): EconomyCalculationResult['recommendedPlan'] {

    // Lógica de recomendação baseada no perfil
    if (usage === 'daily' && lensType === 'daily') {
        // Usuário intensivo - recomendar Premium ou VIP
        return {
            id: 'premium',
            name: 'Plano Premium',
            price: 149.90,
            savings: annualSavings + 200 // Economia adicional com consultas incluídas
        }
    }

    if (usage === 'regular' || annualSavings > 600) {
        // Usuário regular com boa economia - Premium
        return {
            id: 'premium',
            name: 'Plano Premium',
            price: 149.90,
            savings: annualSavings + 150
        }
    }

    if (annualSavings > 1000) {
        // Alta economia - VIP pode valer a pena
        return {
            id: 'vip',
            name: 'Plano VIP',
            price: 249.90,
            savings: annualSavings + 400 // Economia com exames e atendimento domiciliar
        }
    }

    // Padrão - Básico
    return {
        id: 'basic',
        name: 'Plano Básico',
        price: 89.90,
        savings: annualSavings
    }
}

// Benefícios adicionais baseados na economia
function getAdditionalBenefits(annualSavings: number, lensType: 'daily' | 'weekly' | 'monthly'): string[] {
    const benefits: string[] = []

    // Benefícios baseados na economia
    if (annualSavings > 300) {
        benefits.push('Entrega gratuita em todo Brasil')
    }

    if (annualSavings > 500) {
        benefits.push('Acompanhamento médico especializado')
        benefits.push('Suporte prioritário via WhatsApp')
    }

    if (annualSavings > 800) {
        benefits.push('Consultas médicas semestrais incluídas')
        benefits.push('Seguro contra perda e dano')
    }

    if (annualSavings > 1200) {
        benefits.push('Atendimento médico domiciliar')
        benefits.push('Acesso a lentes premium')
        benefits.push('Desconto em cirurgias oftalmológicas')
    }

    // Benefícios específicos por tipo de lente
    if (lensType === 'daily') {
        benefits.push('Máxima higiene e praticidade')
        benefits.push('Ideal para pessoas ativas')
    } else if (lensType === 'monthly') {
        benefits.push('Melhor custo-benefício')
        benefits.push('Menos desperdício')
    }

    return benefits
}

// Função para simular diferentes cenários
export function compareScenarios(baseInput: EconomyCalculationInput) {
    const scenarios = [
        { ...baseInput, usage: 'occasional' as const },
        { ...baseInput, usage: 'regular' as const },
        { ...baseInput, usage: 'daily' as const }
    ]

    return scenarios.map(scenario => ({
        usage: scenario.usage,
        result: calculateEconomy(scenario)
    }))
}

// Função para calcular economia com diferentes tipos de lente
export function compareLensTypes(usage: 'occasional' | 'regular' | 'daily') {
    const lensTypes: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly']

    return lensTypes.map(lensType => ({
        lensType,
        result: calculateEconomy({ lensType, usage })
    }))
}

// Função para validar entrada da calculadora
export function validateCalculatorInput(input: Partial<EconomyCalculationInput>): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (!input.lensType) {
        errors.push('Tipo de lente é obrigatório')
    }

    if (!input.usage) {
        errors.push('Padrão de uso é obrigatório')
    }

    if (input.currentSpending !== undefined) {
        if (input.currentSpending < 0) {
            errors.push('Gasto atual não pode ser negativo')
        }
        if (input.currentSpending > 1000) {
            errors.push('Gasto atual parece muito alto, verifique o valor')
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

// Função para formatar resultados para exibição
export function formatEconomyResults(result: EconomyCalculationResult) {
    return {
        monthlySavings: `R$ ${result.monthlySavings.toFixed(2)}`,
        annualSavings: `R$ ${result.annualSavings.toFixed(2)}`,
        savingsPercentage: `${result.savingsPercentage.toFixed(0)}%`,
        currentMonthlyCost: `R$ ${result.currentMonthlyCost.toFixed(2)}`,
        subscriptionMonthlyCost: `R$ ${result.subscriptionMonthlyCost.toFixed(2)}`,
        recommendedPlan: result.recommendedPlan.name,
        recommendedPrice: `R$ ${result.recommendedPlan.price.toFixed(2)}`
    }
}