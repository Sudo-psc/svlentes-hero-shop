'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { type Recommendation } from '@/vision-types'

interface RecommendationCardProps {
    recommendation: Recommendation
    onDownload?: () => void
}

export function RecommendationCard({ recommendation, onDownload }: RecommendationCardProps) {
    const { primary, secondary, warnings, nextSteps, estimatedCosts } = recommendation
    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                            Recomendação principal: {primary.option === 'contact-lenses' ? 'Lentes de contato' : primary.option === 'glasses' ? 'Óculos' : primary.option === 'both' ? 'Uso híbrido' : 'Consulta presencial'}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Confiança: {primary.confidence.overallConfidence}</p>
                    </div>
                    {onDownload ? (
                        <Button variant="default" onClick={onDownload}>
                            Exportar PDF
                        </Button>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold uppercase text-slate-500">Próximos passos</h3>
                            <ul className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                {nextSteps.map(step => (
                                    <li key={step} className="flex items-start gap-2">
                                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-sky-500" />
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {secondary ? (
                            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                <h3 className="text-sm font-semibold uppercase text-slate-500">Alternativa estratégica</h3>
                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                                    {secondary.option === 'contact-lenses' ? 'Lentes de contato' : 'Óculos'} recomendados para {secondary.useCase}.
                                </p>
                            </div>
                        ) : null}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold uppercase text-slate-500">Alertas e considerações</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {warnings.map(warning => (
                                    <Badge key={warning} variant="outline">
                                        {warning}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <h3 className="text-sm font-semibold uppercase text-slate-500">Estimativa de custos</h3>
                            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                <li>Investimento inicial: R$ {estimatedCosts.initial.min} - R$ {estimatedCosts.initial.max}</li>
                                <li>Mensal: R$ {estimatedCosts.monthly.min} - R$ {estimatedCosts.monthly.max}</li>
                                <li>Anual: R$ {estimatedCosts.annual.min} - R$ {estimatedCosts.annual.max}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
