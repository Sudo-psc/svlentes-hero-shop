import { scientificReferences } from '@/vision/constants/scientificReferences'
import { type ScientificReference } from '@/vision-types'

const referenceMap = new Map(scientificReferences.map(item => [item.id, item]))

export function getScientificReference(id: string): ScientificReference | undefined {
    return referenceMap.get(id)
}

export function resolveReferences(ids: string[]): ScientificReference[] {
    return ids
        .map(id => referenceMap.get(id))
        .filter((reference): reference is ScientificReference => Boolean(reference))
}

export function listReferencesByTag(tag: string): ScientificReference[] {
    return scientificReferences.filter(reference => reference.tags.includes(tag))
}
