export interface ScientificReference {
    id: string
    type: 'peer-reviewed-study' | 'meta-analysis' | 'clinical-trial' | 'guideline' | 'review'
    title: string
    authors: {
        name: string
        affiliation: string
    }[]
    journal: {
        name: string
        impactFactor: number
        issn: string
    }
    publicationDate: {
        year: number
        month: number
    }
    doi: string
    pmid?: string
    url: string
    abstract: string
    keyFindings: string[]
    relevantFactors: string[]
    evidenceLevel: 'A' | 'B' | 'C' | 'D'
    sampleSize?: number
    studyDesign?: string
    limitations: string[]
    citations: number
    tags: string[]
}
