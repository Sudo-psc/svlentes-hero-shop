'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MultipleChoice } from './MultipleChoice'
import { type QuestionDefinition } from '@/vision-types'

interface QuestionCardProps {
    question: QuestionDefinition
    answer?: string
    onAnswer: (value: string) => void
}

export function QuestionCard({ question, answer, onAnswer }: QuestionCardProps) {
    return (
        <Card tone={question.critical ? 'accent' : 'default'} className="w-full">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{question.title}</h2>
                        {question.description ? (
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{question.description}</p>
                        ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant="info">{question.category}</Badge>
                        {question.critical ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                Pergunta crítica
                            </span>
                        ) : null}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <MultipleChoice options={question.options} value={answer} onChange={onAnswer} />
            </CardContent>
        </Card>
    )
}
