import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { AuthProvider } from '@/contexts/AuthContext'
import {
    baseMetadata,
    generateOrganizationStructuredData,
    generateWebSiteStructuredData
} from '@/lib/seo'
import { PreloadCriticalResources, ServiceWorkerRegistration } from '@/components/performance/MobilePerformanceOptimizer'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
    weight: ['300', '400', '500', '600', '700'],
})

const poppins = Poppins({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-poppins',
    weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = baseMetadata

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
            <head>
                {/* Performance optimizations */}
                <link rel="icon" href="/images/favicon.png" type="image/png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon.png" />
                <link rel="manifest" href="/site.webmanifest" />

                {/* DNS prefetch and preconnect for performance */}
                <link rel="dns-prefetch" href="https://api.whatsapp.com" />
                <link rel="dns-prefetch" href="//fonts.googleapis.com" />
                <link rel="dns-prefetch" href="//images.unsplash.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />

                {/* Critical resource preloading */}
                <link rel="preload" href="/HEro.png" as="image" />
                <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />

                {/* Mobile optimizations */}
                <meta name="theme-color" content="#06b6d4" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="format-detection" content="telephone=no" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

                {/* Core Web Vitals optimization */}
                <meta name="description" content="Assinatura de lentes de contato com acompanhamento médico. Economize até 67% com Dr. Philipe Saraiva Cruz (CRM-MG 69.870). Entrega mensal e consultas inclusas." />
            </head>
            <body className="antialiased">
                <PreloadCriticalResources />
                <ServiceWorkerRegistration />
                <AuthProvider>
                    <Header />
                    <main className="pt-16 lg:pt-20">
                        {children}
                    </main>
                    <Footer />
                    <WhatsAppFloat />
                </AuthProvider>
            </body>
        </html>
    )
}