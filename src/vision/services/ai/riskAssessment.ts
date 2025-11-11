import { RISK_RULES } from '@/vision/constants/thresholds'
import { resolveQuestionnaireFlow } from '@/vision/services/data/questionRepository'
import { type RiskAssessment } from '@/vision-types'

function collectRiskTags(answers: Record<string, string>): string[] {
    const questions = resolveQuestionnaireFlow(answers)
    const tags: string[] = []
    questions.forEach(question => {
        const option = question.options.find(item => item.value === answers[question.id])
        if (option?.riskTags) {
            tags.push(...option.riskTags)
        }
    })
    return tags
}

export function evaluateRiskProfile(answers: Record<string, string>): RiskAssessment {
    const tags = collectRiskTags(answers)
    const reasons: string[] = []
    let riskLevel: RiskAssessment['riskLevel'] = 'low'
    let contraindicationFor: RiskAssessment['contraindicationFor'] = 'none'
    let requiresConsultation = false
    let urgencyLevel: RiskAssessment['urgencyLevel'] = 'routine'

    const hasCritical = RISK_RULES.critical.some(tag => tags.includes(tag))
    const hasHigh = RISK_RULES.high.some(tag => tags.includes(tag))
    const hasModerate = RISK_RULES.moderate.some(tag => tags.includes(tag))

    if (hasCritical) {
        riskLevel = 'critical'
        contraindicationFor = 'contacts'
        requiresConsultation = true
        urgencyLevel = 'urgent'
        reasons.push('Condição crítica identificada: recomenda-se suspender uso de lentes e procurar atendimento urgente.')
    } else if (hasHigh) {
        riskLevel = 'high'
        contraindicationFor = 'contacts'
        requiresConsultation = true
        urgencyLevel = 'soon'
        reasons.push('Riscos elevados para uso de lentes: avaliação médica em curto prazo é necessária.')
    } else if (hasModerate) {
        riskLevel = 'moderate'
        contraindicationFor = 'none'
        requiresConsultation = true
        urgencyLevel = 'routine'
        reasons.push('Alguns fatores requerem acompanhamento para uso seguro das opções.')
    }

    if (tags.includes('budget-low')) {
        reasons.push('Orçamento limitado pode dificultar manutenção adequada das lentes de contato.')
    }
    if (tags.includes('hygiene-poor')) {
        reasons.push('Rotina de higiene insuficiente aumenta risco de complicações com lentes.')
    }
    if (tags.includes('water-sports')) {
        reasons.push('Uso frequente em ambientes aquáticos demanda orientação profissional antes de escolher lentes.')
    }

    return {
        riskLevel,
        contraindicationFor,
        reasons,
        requiresConsultation,
        urgencyLevel
    }
}
