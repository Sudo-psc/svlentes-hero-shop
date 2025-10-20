'use client'
import dynamic from 'next/dynamic'
import { LazySection } from '@/components/ui/LazySection'
import { SectionSkeleton } from '@/components/ui/SectionSkeleton'
const QuickStartSection = dynamic(
    () =>
        import('@/components/sections/QuickStartSection').then((mod) => ({
            default: mod.QuickStartSection,
        })),
    {
        loading: () => <SectionSkeleton className="min-h-[480px]" />,
        ssr: false,
    }
)
const FinalCTA = dynamic(
    () =>
        import('@/components/sections/FinalCTA').then((mod) => ({
            default: mod.FinalCTA,
        })),
    {
        loading: () => <SectionSkeleton className="min-h-[520px]" />,
        ssr: false,
    }
)
const FAQSection = dynamic(
    () => import('@/components/sections/FAQ'),
    {
        loading: () => <SectionSkeleton className="min-h-[560px]" />,
        ssr: false,
    }
)
export function HomeLazySections() {
    return (
        <>
            <section id="planos-precos" className="bg-gradient-to-br from-primary-600 to-primary-700">
                <QuickStartSection />
            </section>
            <LazySection id="contato">
                <FinalCTA />
            </LazySection>
            <LazySection id="perguntas-frequentes">
                <FAQSection />
            </LazySection>
        </>
    )
}