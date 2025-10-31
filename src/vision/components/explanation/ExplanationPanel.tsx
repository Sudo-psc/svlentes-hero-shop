'use client'

import { Card, CardContent, CardHeader } from '@/vision-components/ui/Card'
import { type FinalResult } from '@/vision-types'
import { FactorBreakdown } from '@/vision/components/results/FactorBreakdown'
import { ConfidenceIndicator } from './ConfidenceIndicator'

interface ExplanationPanelProps {
    result: FinalResult
}

export function ExplanationPanel({ result }: ExplanationPanelProps) {
    return (
        <div className="space-y-6">
            <ConfidenceIndicator confidence={result.summary.confidence} messages={result.narrative ? result.narrative.considerations : []} />
            <FactorBreakdown factors={result.detailedAnalysis.scoreBreakdown} />
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Narrativa personalizada</h3>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                    <p>{result.narrative?.introduction}</p>
                    <ul className="list-disc space-y-1 pl-5">
                        {result.narrative?.keyFactors.map(item => (
                            <li key={item.factor}>{item.explanation}</li>
                        ))}
                    </ul>
                    <p>{result.narrative?.conclusion}</p>
                </CardContent>
            </Card>
        </div>
    )
}
