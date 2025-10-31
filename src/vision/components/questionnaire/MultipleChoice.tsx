'use client'

import { CheckCircle2 } from 'lucide-react'
import { Badge } from '@/vision-components/ui/Badge'
import { Tooltip } from '@/vision-components/ui/Tooltip'
import { type QuestionOption } from '@/vision-types'

interface MultipleChoiceProps {
    options: QuestionOption[]
    value?: string
    onChange: (value: string) => void
}

export function MultipleChoice({ options, value, onChange }: MultipleChoiceProps) {
    return (
        <div className="grid gap-3">
            {options.map(option => {
                const isSelected = option.value === value
                const content = (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`flex w-full items-start gap-4 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                            isSelected
                                ? 'border-sky-500 bg-sky-50 text-slate-900 dark:border-sky-400 dark:bg-sky-900/30'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900'
                        }`}
                    >
                        <span className="mt-1">
                            {isSelected ? <CheckCircle2 className="h-5 w-5 text-sky-600" /> : <span className="inline-block h-5 w-5 rounded-full border border-slate-300" />}
                        </span>
                        <span className="flex-1">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{option.label}</span>
                            {option.description ? (
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{option.description}</p>
                            ) : null}
                            {option.riskTags && option.riskTags.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {option.riskTags.map(tag => (
                                        <Badge key={tag} variant="warning">
                                            {tag.replace(/-/g, ' ')}
                                        </Badge>
                                    ))}
                                </div>
                            ) : null}
                        </span>
                    </button>
                )
                return option.tooltip ? (
                    <Tooltip key={option.value} label={option.tooltip}>
                        <div>{content}</div>
                    </Tooltip>
                ) : (
                    content
                )
            })}
        </div>
    )
}
