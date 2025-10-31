'use client'

import { useMemo, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/vision-components/ui/Card'
import { Input } from './Input'
import { type FAQItem } from '@/vision-types'

const FAQ_ITEMS: FAQItem[] = [
    {
        question: 'O sistema substitui consulta médica?',
        answer: 'Não. As recomendações são orientativas e devem ser confirmadas por um profissional de saúde ocular.',
        category: 'sobre a recomendação'
    },
    {
        question: 'Como funciona a análise de risco?',
        answer: 'As respostas são avaliadas para identificar fatores que exigem atenção especial, seguindo evidências científicas atualizadas.',
        category: 'saúde ocular'
    }
]

export function FAQ() {
    const [search, setSearch] = useState('')
    const filtered = useMemo(() => {
        const lower = search.toLowerCase()
        if (!lower) {
            return FAQ_ITEMS
        }
        return FAQ_ITEMS.filter(item => item.question.toLowerCase().includes(lower) || item.answer.toLowerCase().includes(lower))
    }, [search])

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Perguntas frequentes</h3>
                    <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar respostas" />
                </div>
            </CardHeader>
            <CardContent>
                <Accordion.Root type="multiple" className="space-y-3">
                    {filtered.map(item => (
                        <Accordion.Item key={item.question} value={item.question} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                            <Accordion.Header>
                                <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-200 dark:hover:bg-slate-800">
                                    <span>{item.question}</span>
                                    <ChevronDown className="h-4 w-4 transition data-[state=open]:rotate-180" />
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                {item.answer}
                            </Accordion.Content>
                        </Accordion.Item>
                    ))}
                </Accordion.Root>
            </CardContent>
        </Card>
    )
}
