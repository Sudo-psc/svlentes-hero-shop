'use client'

import { Container } from './Container'

export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Container className="flex flex-col gap-2">
                <p>
                    AVISO IMPORTANTE: Este sistema fornece recomendações orientativas baseadas em evidências científicas e suas respostas ao questionário. NÃO substitui consulta, diagnóstico ou prescrição médica profissional.
                </p>
                <p>Consulte sempre um oftalmologista qualificado antes de tomar decisões sobre sua saúde ocular.</p>
            </Container>
        </footer>
    )
}
