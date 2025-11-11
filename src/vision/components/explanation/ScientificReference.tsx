'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { type ScientificReference } from '@/vision-types'

interface ScientificReferenceListProps {
    references: ScientificReference[]
}

export function ScientificReferenceList({ references }: ScientificReferenceListProps) {
    return (
        <Card>
            <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Referências científicas</h3>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {references.map(reference => (
                    <div key={reference.id}>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{reference.title}</p>
                        <p>{reference.journal.name} · {reference.publicationDate.month}/{reference.publicationDate.year}</p>
                        <p>Nível de evidência: {reference.evidenceLevel}</p>
                        <a href={reference.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 underline-offset-2 hover:underline">
                            Acessar estudo
                        </a>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
