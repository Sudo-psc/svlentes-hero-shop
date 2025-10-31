import { COST_BANDS } from '@/vision/constants/thresholds'
import { calculateScore } from '@/vision/utils/scoring/calculateScore'
import { computeConfidence } from '@/vision/services/ai/confidenceCalculator'
import { evaluateRiskProfile } from '@/vision/services/ai/riskAssessment'
import { resolveQuestionnaireFlow } from '@/vision/services/data/questionRepository'
import {
    type BaseScore,
    type FinalResult,
    type Recommendation,
    type RecommendationNarrative,
    type RecommendationOption
} from '@/vision-types'
import { resolveReferences } from '@/vision/services/data/referenceManager'

function determinePrimaryOption(
    contactScore: number,
    glassesScore: number,
    riskContraindication: Recommendation['primary']['option']
): Recommendation['primary']['option'] {
    if (riskContraindication === 'consultation-required') {
        return 'consultation-required'
    }
    if (riskContraindication === 'glasses') {
        return 'glasses'
    }
    if (riskContraindication === 'contact-lenses') {
        return 'glasses'
    }
    if (Math.abs(contactScore - glassesScore) < 6) {
        return 'both'
    }
    return contactScore > glassesScore ? 'contact-lenses' : 'glasses'
}

function buildSpecificSuggestions(answers: Record<string, string>): Recommendation['specificSuggestions'] {
    const suggestions: Recommendation['specificSuggestions'] = {}
    if (answers['dry-eye'] && ['moderate', 'severe', 'treatment'].includes(answers['dry-eye'])) {
        suggestions.contactLenses = {
            type: 'scleral',
            material: ['Silicone hidrogel com alta lubrificação'],
            wearSchedule: 'daily',
            specialFeatures: ['Maior reserva de lágrima', 'Necessita acompanhamento médico próximo']
        }
    } else if (answers['sports-practice'] === 'contact') {
        suggestions.contactLenses = {
            type: 'soft',
            material: ['Silicone hidrogel respirável'],
            wearSchedule: 'daily',
            specialFeatures: ['Alta estabilidade em movimento', 'Troca diária para higiene ideal']
        }
    } else if (answers['myopia-degree'] === 'extreme') {
        suggestions.contactLenses = {
            type: 'rigid',
            material: ['RGP alto Dk'],
            wearSchedule: 'monthly',
            specialFeatures: ['Correção precisa para altos graus', 'Adaptação gradual necessária']
        }
    }

    if (answers['presbyopia-stage'] && answers['presbyopia-stage'] !== 'none') {
        suggestions.glasses = {
            lensType: 'progressive',
            coatings: ['Antirreflexo premium', 'Filtro luz azul'],
            frameSuggestions: ['Aro leve com ajuste nasal'],
            specialFeatures: ['Zona intermediária ampla para computador']
        }
    } else if (answers['monthly-budget'] === 'lt-100') {
        suggestions.glasses = {
            lensType: 'single-vision',
            coatings: ['Antirreflexo básico'],
            frameSuggestions: ['Aço inoxidável durável'],
            specialFeatures: ['Opções econômicas com garantia estendida']
        }
    }

    if (!suggestions.contactLenses && !suggestions.glasses) {
        suggestions.glasses = {
            lensType: 'single-vision',
            coatings: ['Antirreflexo', 'Proteção UV'],
            frameSuggestions: ['Acetato flexível', 'Titanium leve'],
            specialFeatures: ['Compatível com uso híbrido com lentes']
        }
    }

    return suggestions
}

function buildWarnings(riskReasons: string[], primary: RecommendationOption['option']): string[] {
    const warnings = [...riskReasons]
    if (primary === 'contact-lenses') {
        warnings.push('Recomenda-se manter óculos reserva para pausas e emergências.')
    }
    if (primary === 'both') {
        warnings.push('Planeje acompanhamento regular para ajustar cada solução às rotinas específicas.')
    }
    return warnings
}

function calculateCosts(primary: RecommendationOption['option']): Recommendation['estimatedCosts'] {
    if (primary === 'contact-lenses') {
        const range = COST_BANDS.contactLens.daily
        return {
            initial: { min: 400, max: 900 },
            monthly: { min: range.monthly[0], max: range.monthly[1] },
            annual: { min: range.annual[0], max: range.annual[1] }
        }
    }
    if (primary === 'glasses') {
        const range = COST_BANDS.glasses.singleVision
        return {
            initial: { min: range.initial[0], max: range.initial[1] },
            monthly: { min: 40, max: 90 },
            annual: { min: range.annual[0], max: range.annual[1] }
        }
    }
    return {
        initial: { min: 600, max: 1800 },
        monthly: { min: 120, max: 250 },
        annual: { min: 1500, max: 3200 }
    }
}

function buildNarrative(
    answers: Record<string, string>,
    recommendation: Recommendation,
    confidenceScore: number
): RecommendationNarrative {
    const introduction = `Com base nas suas respostas, ${
        recommendation.primary.option === 'contact-lenses'
            ? 'lentes de contato'
            : recommendation.primary.option === 'glasses'
              ? 'óculos'
              : recommendation.primary.option === 'both'
                  ? 'uma abordagem combinada'
                  : 'uma consulta presencial imediata'
    } é a escolha inicial sugerida (confiança: ${(confidenceScore * 100).toFixed(0)}%).`

    const keyFactors = [
        {
            factor: 'Rotina e estilo de vida',
            explanation:
                answers['activity-level'] && answers['sports-practice']
                    ? 'Seu nível de atividade física e envolvimento esportivo influenciam fortemente a necessidade de liberdade de movimento.'
                    : 'Sua rotina diária foi considerada para equilibrar praticidade e conforto.',
            weight: 'primary' as const
        },
        {
            factor: 'Saúde ocular',
            explanation: recommendation.warnings.length > 0
                ? 'Fatores clínicos exigem atenção especial antes de iniciar uso contínuo de lentes.'
                : 'Não foram identificadas contraindicações graves nas respostas fornecidas.',
            weight: 'primary' as const
        },
        {
            factor: 'Preferências pessoais',
            explanation: answers['aesthetic-importance']
                ? 'Sua percepção sobre estética e orçamento foi incorporada na recomendação.'
                : 'Suas expectativas foram ponderadas com base no questionário.',
            weight: 'secondary' as const
        }
    ]

    const considerations = recommendation.warnings
    const alternatives = recommendation.secondary
        ? [
              {
                  scenario: 'Cenário alternativo para atividades específicas',
                  recommendation: `Considere ${
                      recommendation.secondary.option === 'contact-lenses' ? 'lentes de contato' : 'óculos'
                  } durante ${recommendation.secondary.useCase.toLowerCase()}.`
              }
          ]
        : []

    const conclusion =
        'Esta recomendação é orientativa e deve ser validada com um profissional de saúde ocular. Planeje consultas regulares para monitoramento.'

    return {
        introduction,
        keyFactors,
        considerations,
        alternatives,
        conclusion
    }
}

function buildFinalResult(
    answers: Record<string, string>,
    recommendation: Recommendation,
    baseScores: BaseScore[],
    confidenceScore: number
): FinalResult {
    const questions = resolveQuestionnaireFlow(answers)
    const references = resolveReferences(recommendation.primary.reasoning)
    const sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
    const scoreBreakdown = baseScores.map(score => ({
        category: score.category,
        factor: score.factor,
        userAnswer: answers[score.factor.split(':')[0]] ?? '',
        impact: {
            onContactLenses:
                score.contactLensScore >= 0
                    ? score.contactLensScore > 10
                        ? 'strongly-positive'
                        : 'positive'
                    : score.contactLensScore < -10
                        ? 'strongly-negative'
                        : 'negative',
            onGlasses:
                score.glassesScore >= 0
                    ? score.glassesScore > 10
                        ? 'strongly-positive'
                        : 'positive'
                    : score.glassesScore < -10
                        ? 'strongly-negative'
                        : 'negative',
            magnitude: Math.round(Math.abs(score.contactLensScore - score.glassesScore))
        },
        explanation: {
            simple: 'Este fator contribuiu para equilibrar conforto, saúde e preferências na análise.',
            technical: undefined
        },
        scientificReferences: resolveReferences(score.scientificBasis),
        relatedFactors: []
    }))
    return {
        summary: {
            recommendation,
            confidence: recommendation.primary.confidence,
            timestamp: new Date(),
            sessionId
        },
        detailedAnalysis: {
            scoreBreakdown,
            comparativeAnalysis: {
                contactLenses: {
                    totalScore: recommendation.primary.option === 'contact-lenses' ? recommendation.primary.score : recommendation.secondary?.option === 'contact-lenses' ? recommendation.secondary.score : 0,
                    pros: ['Campo visual amplo', 'Melhor desempenho em atividades dinâmicas'],
                    cons: ['Requer disciplina de higiene', 'Custos recorrentes maiores'],
                    bestFor: ['Estilo de vida ativo', 'Eventos sociais frequentes']
                },
                glasses: {
                    totalScore: recommendation.primary.option === 'glasses' ? recommendation.primary.score : recommendation.secondary?.option === 'glasses' ? recommendation.secondary.score : 0,
                    pros: ['Baixo risco de complicações', 'Manutenção simples'],
                    cons: ['Campo de visão reduzido', 'Sensibilidade a impactos'],
                    bestFor: ['Rotina em ambientes climatizados', 'Uso prolongado em computador']
                }
            },
            visualizations: {
                radarChart: {
                    metrics: ['Conforto', 'Saúde', 'Estética', 'Praticidade', 'Custo', 'Confiança'],
                    contactLenses: [72, 64, 78, 82, 55, confidenceScore * 100],
                    glasses: [64, 78, 62, 60, 72, confidenceScore * 100]
                },
                barChart: {
                    categories: questions.map(question => question.title),
                    contactLens: recommendation.primary.score,
                    glasses: recommendation.secondary?.score ?? 0
                },
                confidenceGauge: {
                    confidence: recommendation.primary.confidence.overallConfidence,
                    value: confidenceScore
                }
            }
        },
        personalizedSuggestions: recommendation.specificSuggestions,
        alerts: recommendation.warnings.map((warning, index) => ({
            id: `alert-${index}`,
            severity: warning.toLowerCase().includes('urgente') ? 'critical' : 'warning',
            category: 'health',
            title: 'Atenção aos fatores identificados',
            message: warning,
            actionRequired: true,
            dismissible: false
        })),
        actionPlan: {
            immediate: ['Agendar consulta com oftalmologista ou optometrista', 'Levar resultado para avaliação profissional'],
            shortTerm: ['Iniciar teste supervisionado da opção recomendada', 'Ajustar hábitos de higiene ocular conforme orientação'],
            longTerm: ['Revisão a cada 12 meses', 'Atualizar prescrição conforme mudanças de grau']
        },
        resources: {
            educationalMaterials: references.map(reference => ({
                title: reference.title,
                description: reference.abstract,
                url: reference.url,
                category: reference.type
            })),
            findProfessional: {
                specialty: 'Oftalmologia / Contatologia',
                urgency: recommendation.primary.option === 'consultation-required' ? 'urgent' : 'soon',
                tips: ['Leve histórico de sintomas', 'Compartilhe hábitos de higiene', 'Questione sobre opções híbridas']
            },
            costEstimates: {
                monthly: recommendation.estimatedCosts.monthly,
                annual: recommendation.estimatedCosts.annual
            }
        },
        followUp: {
            recommendedCheckups: ['Revisão oftalmológica anual', 'Avaliação de adaptação após 30 dias'],
            signsToWatch: ['Vermelhidão persistente', 'Dor ocular', 'Visão borrada repentina'],
            whenToReassess: 'Reavalie sempre que houver mudança relevante na rotina ou saúde ocular.'
        }
    }
}

export function generateRecommendation(answers: Record<string, string>): FinalResult {
    const { contactLens, glasses, baseScores, interactionFactors } = calculateScore(answers)
    const risk = evaluateRiskProfile(answers)
    const confidence = computeConfidence(answers, baseScores, interactionFactors.length)

    const riskOption: Recommendation['primary']['option'] =
        risk.riskLevel === 'critical'
            ? 'consultation-required'
            : risk.contraindicationFor === 'contacts'
                ? 'glasses'
                : 'none'

    const primaryOption = determinePrimaryOption(contactLens, glasses, riskOption)

    const primary: RecommendationOption = {
        option: primaryOption,
        score: Number((primaryOption === 'glasses' ? glasses : contactLens).toFixed(2)),
        confidence: confidence.breakdown.metrics,
        reasoning: baseScores.map(score => score.factor)
    }

    const secondary = primaryOption === 'both'
        ? {
              option: contactLens > glasses ? 'glasses' : 'contact-lenses',
              score: Number((contactLens > glasses ? glasses : contactLens).toFixed(2)),
              useCase: contactLens > glasses ? 'uso prolongado em ambientes controlados' : 'momentos de maior atividade física'
          }
        : undefined

    const recommendation: Recommendation = {
        primary,
        secondary,
        specificSuggestions: buildSpecificSuggestions(answers),
        warnings: buildWarnings(risk.reasons, primaryOption),
        nextSteps: ['Discutir plano de adaptação com profissional', 'Planejar rotina de higiene adequada'],
        estimatedCosts: calculateCosts(primaryOption)
    }

    const narrative = buildNarrative(answers, recommendation, confidence.breakdown.score)
    const result = buildFinalResult(answers, recommendation, baseScores, confidence.breakdown.score)

    return {
        ...result,
        summary: {
            ...result.summary,
            recommendation,
            confidence: confidence.breakdown.metrics
        },
        detailedAnalysis: {
            ...result.detailedAnalysis,
            scoreBreakdown: result.detailedAnalysis.scoreBreakdown,
            visualizations: result.detailedAnalysis.visualizations
        },
        actionPlan: result.actionPlan,
        resources: result.resources,
        followUp: result.followUp,
        narrative
    }
}
