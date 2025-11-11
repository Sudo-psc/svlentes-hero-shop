'use client'

import { type BaseScore } from '@/vision-types'

interface FactorWeightProps {
    score: BaseScore
}

export function FactorWeight({ score }: FactorWeightProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{score.factor}</p>
            <p>Peso: {(score.weight * 100).toFixed(0)}%</p>
            <p>Lentes: {score.contactLensScore.toFixed(1)}</p>
            <p>Óculos: {score.glassesScore.toFixed(1)}</p>
        </div>
    )
}
