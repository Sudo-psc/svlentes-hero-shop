'use client'

import { createContext, useContext, useState } from 'react'

type SupportedLanguage = 'pt-BR' | 'en'

interface LanguageContextValue {
    language: SupportedLanguage
    setLanguage: (language: SupportedLanguage) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<SupportedLanguage>('pt-BR')
    return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
}

export function useLanguageContext() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguageContext deve ser usado dentro de LanguageProvider')
    }
    return context
}
