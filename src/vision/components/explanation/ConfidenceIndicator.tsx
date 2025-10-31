'use client'

import { Card, CardContent, CardHeader } from '@/vision-components/ui/Card'
import { type ConfidenceMetrics } from '@/vision-types'

interface ConfidenceIndicatorProps {
    confidence: ConfidenceMetrics
    messages: string[]
}

export function ConfidenceIndicator({ confidence, messages }: ConfidenceIndicatorProps) {
    return (
        <Card>
            <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Indicadores de confiança</h3>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Metric label="Completude" value={confidence.dataCompleteness} />
                    <Metric label="Consistência" value={confidence.factorConsistency} />
                    <Metric label="Suporte científico" value={confidence.scientificSupport} />
                    <Metric label="Casos limítrofes" value={confidence.edgeCaseDetection} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Observações</p>
                    <ul className="mt-2 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                        {messages.length > 0 ? messages.map(message => <li key={message}>{message}</li>) : <li>Sem observações adicionais.</li>}
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
                <span>{label}</span>
                <span>{Math.round(value * 100)}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.round(value * 100)}%` }} />
            </div>
        </div>
    )
}
