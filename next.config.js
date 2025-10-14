/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ['@heroicons/react'],
    },
    // Skip type checking and linting during deployment build if needed
    typescript: {
        ignoreBuildErrors: true, // Workaround for Next.js 15 type generation issue
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.google.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'svlentes.shop',
                port: '',
                pathname: '/wp-content/uploads/**',
            },
        ],
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        qualities: [75, 85, 90, 95, 100],
        minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        unoptimized: false,
        loader: 'default',
    },
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    headers: async () => {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.asaas.com accounts.google.com apis.google.com *.gstatic.com js.stripe.com *.facebook.com *.facebook.net; style-src 'self' 'unsafe-inline' https://r2cdn.perplexity.ai; img-src 'self' data: https: *.googleusercontent.com *.fbcdn.net; font-src 'self' data: https://r2cdn.perplexity.ai *.gstatic.com; connect-src 'self' *.asaas.com api.whatsapp.com accounts.google.com apis.google.com oauth2.googleapis.com www.googleapis.com *.googleapis.com *.gstatic.com *.facebook.com *.facebook.net www.facebook.com; frame-src 'self' *.firebaseapp.com accounts.google.com oauth2.googleapis.com js.stripe.com *.facebook.com www.facebook.com;",
                    },
                ],
            },
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
                    },
                ],
            },
            {
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/images/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ]
    },
    webpack: (config) => {
        // Fix for potential module resolution issues
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        }

        return config
    },
}

module.exports = nextConfig
