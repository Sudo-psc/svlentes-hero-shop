'use client'

import { Badge } from '@/vision-components/ui/Badge'
import { Card, CardContent, CardHeader } from '@/vision-components/ui/Card'
import { type FactorExplanation } from '@/vision-types'

interface FactorBreakdownProps {
    factors: FactorExplanation[]
}

const IMPACT_LABELS: Record<FactorExplanation['impact']['onContactLenses'], string> = {
    'strongly-positive': 'Muito favorável',
    positive: 'Favorável',
    neutral: 'Neutro',
    negative: 'Desfavorável',
    'strongly-negative': 'Muito desfavorável'
}

export function FactorBreakdown({ factors }: FactorBreakdownProps) {
    if (factors.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Análise de fatores</h3>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                    Os fatores serão exibidos após o preenchimento completo do questionário.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Como chegamos nesta recomendação</h3>
            </CardHeader>
            <CardContent className="grid gap-4">
                {factors.map(factor => (
                    <div key={factor.factor} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase text-slate-500">{factor.category}</p>
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{factor.factor}</h4>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant="info">{IMPACT_LABELS[factor.impact.onContactLenses]}</Badge>
                                <Badge variant="success">Para óculos: {IMPACT_LABELS[factor.impact.onGlasses]}</Badge>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{factor.explanation.simple}</p>
                        {factor.scientificReferences.length > 0 ? (
                            <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                                <p>Referências científicas:</p>
                                {factor.scientificReferences.map(reference => (
                                    <a
                                        key={reference.id}
                                        href={reference.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block underline-offset-2 hover:underline"
                                    >
                                        {reference.title} ({reference.evidenceLevel})
                                    </a>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
