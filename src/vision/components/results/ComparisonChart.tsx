'use client'

import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis
} from 'recharts'

interface ComparisonChartProps {
    radarData: {
        metrics: string[]
        contactLenses: number[]
        glasses: number[]
    }
    barData: {
        categories: string[]
        contactLens: number
        glasses: number
    }
    confidenceGauge: {
        confidence: string
        value: number
    }
}

const COLORS = {
    contacts: '#0ea5e9',
    glasses: '#6366f1'
}

export function ComparisonChart({ radarData, barData, confidenceGauge }: ComparisonChartProps) {
    const radarDataset = radarData.metrics.map((metric, index) => ({
        metric,
        contacts: radarData.contactLenses[index] ?? 0,
        glasses: radarData.glasses[index] ?? 0
    }))

    const barDataset = barData.categories.map(category => ({
        category,
        contacts: barData.contactLens,
        glasses: barData.glasses
    }))

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Radar de fatores</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <RadarChart data={radarDataset} outerRadius="70%">
                        <PolarGrid stroke="#CBD5F5" />
                        <PolarAngleAxis dataKey="metric" stroke="#64748b" />
                        <Radar name="Lentes" dataKey="contacts" stroke={COLORS.contacts} fill={COLORS.contacts} fillOpacity={0.4} />
                        <Radar name="Óculos" dataKey="glasses" stroke={COLORS.glasses} fill={COLORS.glasses} fillOpacity={0.3} />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid gap-6">
                <div className="h-64 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Impacto agregado</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={barDataset}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" hide />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="contacts" fill={COLORS.contacts} name="Lentes" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="glasses" fill={COLORS.glasses} name="Óculos" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Indicador de confiança</h3>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="h-24 w-24 rounded-full border-[10px] border-slate-200" style={{ borderColor: '#e2e8f0' }}>
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-lg font-semibold text-white">
                                {(confidenceGauge.value * 100).toFixed(0)}%
                            </div>
                        </div>
                        <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                            <p>Nível: {confidenceGauge.confidence}</p>
                            <p>Quanto mais próximo de 100%, maior a robustez da recomendação.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
