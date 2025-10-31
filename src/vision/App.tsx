'use client'

import { useMemo } from 'react'
import { Header } from '@/vision/components/layout/Header'
import { Footer } from '@/vision/components/layout/Footer'
import { Sidebar } from '@/vision/components/layout/Sidebar'
import { Container } from '@/vision/components/layout/Container'
import { QuestionCard } from '@/vision/components/questionnaire/QuestionCard'
import { QuestionProgress } from '@/vision/components/questionnaire/QuestionProgress'
import { QuestionNavigation } from '@/vision/components/questionnaire/QuestionNavigation'
import { Glossary } from '@/vision/components/features/Glossary'
import { FAQ } from '@/vision/components/features/FAQ'
import { ResultDisplay } from '@/vision/components/results/ResultDisplay'
import { ExplanationPanel } from '@/vision/components/explanation/ExplanationPanel'
import { useQuestionnaireContext } from '@/vision/contexts/QuestionnaireContext'
import { useRecommendation } from '@/vision-hooks/useRecommendation'

export function VisionRecommendationApp() {
    const { currentQuestion, setAnswer, goNext, goPrevious, getProgress, estimatedTimeRemaining, state } =
        useQuestionnaireContext()
    const recommendation = useRecommendation({ answers: state.answers, isReady: state.isComplete })

    const currentAnswer = useMemo(() => {
        if (!currentQuestion) {
            return undefined
        }
        return state.answers[currentQuestion.id]
    }, [currentQuestion, state.answers])

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <Header />
            <Container className="py-10">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
                    <main className="space-y-8">
                        <QuestionProgress progress={getProgress()} timeRemaining={estimatedTimeRemaining()} />
                        {currentQuestion ? (
                            <QuestionCard
                                question={currentQuestion}
                                answer={currentAnswer}
                                onAnswer={value => {
                                    setAnswer(currentQuestion.id, value)
                                }}
                            />
                        ) : null}
                        <QuestionNavigation
                            canGoBack={state.currentIndex > 0}
                            canGoNext={Boolean(currentQuestion ? state.answers[currentQuestion.id] : true)}
                            onPrevious={goPrevious}
                            onNext={goNext}
                            isFinalStep={state.isComplete}
                            onFinish={() => null}
                        />
                        {recommendation ? (
                            <div className="space-y-8">
                                <ResultDisplay result={recommendation} />
                                <ExplanationPanel result={recommendation} />
                            </div>
                        ) : null}
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Glossary />
                            <FAQ />
                        </div>
                    </main>
                    <Sidebar />
                </div>
            </Container>
            <Footer />
        </div>
    )
}
