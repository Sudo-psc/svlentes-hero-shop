'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/vision-components/ui/Card'
import { Input } from '@/vision/components/features/Input'
import { Badge } from '@/vision-components/ui/Badge'
import { type GlossaryTerm } from '@/vision-types'

const TERMS: GlossaryTerm[] = [
    {
        term: 'Olho seco',
        definition: 'Condição em que a produção ou qualidade da lágrima é insuficiente para manter a superfície ocular lubrificada.',
        relatedTerms: ['Síndrome de Sjögren'],
        category: 'saúde ocular',
        pronunciation: 'ol-yo seco',
        synonyms: ['Síndrome do olho seco']
    },
    {
        term: 'Lente esclerais',
        definition: 'Lentes rígidas de grande diâmetro que repousam sobre a esclera, criando reservatório de lágrima.',
        relatedTerms: ['Olho seco', 'Astigmatismo irregular'],
        category: 'correção visual',
        synonyms: ['Lentes de apoio escleral']
    }
]

export function Glossary() {
    const [search, setSearch] = useState('')
    const terms = useMemo(() => {
        const lower = search.toLowerCase()
        if (!lower) {
            return TERMS
        }
        return TERMS.filter(term => term.term.toLowerCase().includes(lower) || term.definition.toLowerCase().includes(lower))
    }, [search])

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Glossário</h3>
                    <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar termos" />
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">
                {terms.map(term => (
                    <div key={term.term} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{term.term}</h4>
                            <Badge variant="info">{term.category}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{term.definition}</p>
                        {term.relatedTerms.length > 0 ? (
                            <p className="mt-2 text-xs text-slate-500">Relacionados: {term.relatedTerms.join(', ')}</p>
                        ) : null}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
