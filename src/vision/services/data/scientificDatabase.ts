import { scientificReferences } from '@/vision/constants/scientificReferences'
import { type ScientificReference } from '@/vision-types'

export function getScientificDatabase(): ScientificReference[] {
    return scientificReferences
}

export function findReferencesByFactor(factorId: string): ScientificReference[] {
    return scientificReferences.filter(reference => reference.relevantFactors.includes(factorId))
}
