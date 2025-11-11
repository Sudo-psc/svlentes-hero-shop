'use client'

import { RecommendationCard } from './RecommendationCard'
import { ComparisonChart } from './ComparisonChart'
import { FactorBreakdown } from './FactorBreakdown'
import { PDFExport } from './PDFExport'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type FinalResult } from '@/vision-types'

interface ResultDisplayProps {
    result: FinalResult
}

export function ResultDisplay({ result }: ResultDisplayProps) {
    const handleExport = () => {
        void PDFExport(result)
    }

    return (
        <div className="space-y-8">
            <RecommendationCard recommendation={result.summary.recommendation} onDownload={handleExport} />
            <ComparisonChart
                radarData={result.detailedAnalysis.visualizations.radarChart as any}
                barData={result.detailedAnalysis.visualizations.barChart as any}
                confidenceGauge={result.detailedAnalysis.visualizations.confidenceGauge as any}
            />
            <FactorBreakdown factors={result.detailedAnalysis.scoreBreakdown} />
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Plano de ação</h3>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    <ActionColumn title="Imediato" items={result.actionPlan.immediate} />
                    <ActionColumn title="Curto prazo" items={result.actionPlan.shortTerm} />
                    <ActionColumn title="Longo prazo" items={result.actionPlan.longTerm} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Alertas importantes</h3>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    {result.alerts.length === 0 ? <p className="text-sm text-slate-600">Nenhum alerta crítico identificado.</p> : null}
                    {result.alerts.map(alert => (
                        <Badge key={alert.id} variant={alert.severity === 'critical' ? 'danger' : 'warning'}>
                            {alert.title}
                        </Badge>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

function ActionColumn({ title, items }: { title: string; items: string[] }) {
    return (
        <div>
            <h4 className="text-sm font-semibold uppercase text-slate-500">{title}</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {items.map(item => (
                    <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-sky-500" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
