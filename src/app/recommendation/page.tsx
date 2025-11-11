import '@/vision/styles/themes.css'
import '@/vision/styles/globals.css'
import { QuestionnaireProvider } from '@/vision/contexts/QuestionnaireContext'
import { ThemeProvider } from '@/vision/contexts/ThemeContext'
import { LanguageProvider } from '@/vision/contexts/LanguageContext'
import { VisionRecommendationApp } from '@/vision/App'

export default function RecommendationPage() {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <QuestionnaireProvider>
                    <VisionRecommendationApp />
                </QuestionnaireProvider>
            </ThemeProvider>
        </LanguageProvider>
    )
}
