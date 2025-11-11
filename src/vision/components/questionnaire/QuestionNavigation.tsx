'use client'

import { Button } from '@/components/ui/button'

interface QuestionNavigationProps {
    canGoBack: boolean
    canGoNext: boolean
    onPrevious: () => void
    onNext: () => void
    onFinish?: () => void
    isFinalStep: boolean
}

export function QuestionNavigation({ canGoBack, canGoNext, onPrevious, onNext, onFinish, isFinalStep }: QuestionNavigationProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" disabled={!canGoBack} onClick={onPrevious}>
                Voltar
            </Button>
            <div className="ml-auto flex gap-3">
                <Button variant="default" disabled={!canGoNext} onClick={isFinalStep ? onFinish ?? onNext : onNext}>
                    {isFinalStep ? 'Gerar recomendação' : 'Próxima pergunta'}
                </Button>
            </div>
        </div>
    )
}
