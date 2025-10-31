/**
 * Legal Terms Version Management System
 * Tracks versions and updates for all legal documents in compliance with LGPD
 */

export interface LegalDocumentVersion {
    version: string
    effectiveDate: Date
    lastUpdated: Date
    summary: string
    requiresNewConsent: boolean
}

export interface LegalDocument {
    id: string
    title: string
    slug: string
    currentVersion: string
    versions: LegalDocumentVersion[]
}

/**
 * Current versions of all legal documents
 * Update these whenever legal terms change
 */
export const LEGAL_DOCUMENTS: Record<string, LegalDocument> = {
    TERMS_OF_USE: {
        id: 'terms-of-use',
        title: 'Termos de Uso',
        slug: 'termos-uso',
        currentVersion: '1.0',
        versions: [
            {
                version: '1.0',
                effectiveDate: new Date('2025-10-31'),
                lastUpdated: new Date('2025-10-31'),
                summary: 'Versão inicial dos Termos de Uso',
                requiresNewConsent: true,
            },
        ],
    },
    PRIVACY_POLICY: {
        id: 'privacy-policy',
        title: 'Política de Privacidade',
        slug: 'politica-privacidade',
        currentVersion: '2.0',
        versions: [
            {
                version: '2.0',
                effectiveDate: new Date('2025-10-31'),
                lastUpdated: new Date('2025-10-31'),
                summary: 'Adicionadas seções de incidentes de segurança, transferência internacional de dados, DPO e bases legais detalhadas conforme LGPD',
                requiresNewConsent: true,
            },
            {
                version: '1.0',
                effectiveDate: new Date('2025-01-01'),
                lastUpdated: new Date('2025-01-01'),
                summary: 'Versão inicial da Política de Privacidade',
                requiresNewConsent: true,
            },
        ],
    },
    EXCHANGE_RETURN_POLICY: {
        id: 'exchange-return-policy',
        title: 'Política de Troca e Devolução',
        slug: 'politica-troca-devolucao',
        currentVersion: '1.0',
        versions: [
            {
                version: '1.0',
                effectiveDate: new Date('2025-10-31'),
                lastUpdated: new Date('2025-10-31'),
                summary: 'Política completa de troca e devolução em conformidade com CDC',
                requiresNewConsent: false,
            },
        ],
    },
    CANCELLATION_POLICY: {
        id: 'cancellation-policy',
        title: 'Política de Cancelamento',
        slug: 'politica-cancelamento',
        currentVersion: '1.0',
        versions: [
            {
                version: '1.0',
                effectiveDate: new Date('2025-10-31'),
                lastUpdated: new Date('2025-10-31'),
                summary: 'Política transparente de cancelamento sem multas',
                requiresNewConsent: false,
            },
        ],
    },
}

/**
 * Get the current version of a legal document
 */
export function getCurrentVersion(documentId: keyof typeof LEGAL_DOCUMENTS): LegalDocumentVersion | null {
    const doc = LEGAL_DOCUMENTS[documentId]
    if (!doc) return null
    
    return doc.versions.find(v => v.version === doc.currentVersion) || null
}

/**
 * Check if a user needs to accept new terms
 * @param documentId - The document ID
 * @param userAcceptedVersion - The version the user last accepted
 * @returns true if user needs to accept new terms
 */
export function requiresNewAcceptance(
    documentId: keyof typeof LEGAL_DOCUMENTS,
    userAcceptedVersion: string | null
): boolean {
    const doc = LEGAL_DOCUMENTS[documentId]
    if (!doc) return false
    
    // If user never accepted, require acceptance
    if (!userAcceptedVersion) return true
    
    // If current version is different and requires new consent
    if (doc.currentVersion !== userAcceptedVersion) {
        const currentVer = getCurrentVersion(documentId)
        return currentVer?.requiresNewConsent || false
    }
    
    return false
}

/**
 * Get all legal documents for footer links
 */
export function getAllLegalDocuments(): Array<{
    title: string
    href: string
    version: string
}> {
    return Object.values(LEGAL_DOCUMENTS).map(doc => ({
        title: doc.title,
        href: `/${doc.slug}`,
        version: doc.currentVersion,
    }))
}

/**
 * Format last updated date for display
 */
export function formatLastUpdated(documentId: keyof typeof LEGAL_DOCUMENTS): string {
    const currentVersion = getCurrentVersion(documentId)
    if (!currentVersion) return 'Data não disponível'
    
    return currentVersion.lastUpdated.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}
