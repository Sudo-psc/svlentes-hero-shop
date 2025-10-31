'use client'

import { useQuestionnaireContext } from '@/vision/contexts/QuestionnaireContext'
import { Badge } from '@/vision-components/ui/Badge'

export function Sidebar() {
    const { questions, state } = useQuestionnaireContext()
    return (
        <aside className="sticky top-28 hidden max-h-[80vh] w-72 flex-col gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 lg:flex">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Mapa do questionário</h3>
            <ul className="space-y-2">
                {questions.map((question, index) => {
                    const answered = state.answers[question.id]
                    return (
                        <li key={question.id} className="flex items-center justify-between gap-2">
                            <span className={`truncate ${state.currentIndex === index ? 'font-semibold text-sky-600' : ''}`}>{question.title}</span>
                            {answered ? <Badge variant="success">OK</Badge> : null}
                        </li>
                    )
                })}
            </ul>
        </aside>
    )
}
