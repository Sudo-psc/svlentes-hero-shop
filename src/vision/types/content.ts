export interface GlossaryTerm {
    term: string
    definition: string
    relatedTerms: string[]
    category: string
    visualAid?: string
    pronunciation?: string
    synonyms: string[]
}

export interface FAQItem {
    question: string
    answer: string
    category: string
    helpfulVotes?: number
    notHelpfulVotes?: number
}
