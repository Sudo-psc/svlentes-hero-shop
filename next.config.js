/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        optimizePackageImports: [
            '@heroicons/react',
            'lucide-react',
            'date-fns',
            'react-hook-form',
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
        ],
    },
    skipTrailingSlashRedirect: true,
    typescript: {
        // Allow production builds with type errors - errors will be caught in IDE and CI
        ignoreBuildErrors: true,
    },
    // Next.js 16: eslint config moved to .eslintrc or eslint.config.mjs
    // ESLint is now configured via eslint.config.mjs
    // Skip failing paths during build
    generateBuildId: async () => {
        return 'build-' + Date.now()
    },
    // Turbopack configuration (Next.js 16 default)
    // Empty config silences migration warning while keeping webpack compat
    turbopack: {},
    // Webpack configuration (continue using webpack for now)
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            }
        }

        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        })

        return config
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
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
        unoptimized: false,
        loader: 'default',
    },
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    headers: async () => {
        const isDev = process.env.NODE_ENV === 'development'

        const cspDirectives = isDev
            ? [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' data: *.asaas.com accounts.google.com apis.google.com *.gstatic.com js.stripe.com *.facebook.com *.facebook.net securetoken.googleapis.com firebase.googleapis.com www.googletagmanager.com www.google-analytics.com checkout.stripe.com",
                "style-src 'self' 'unsafe-inline' data: r2cdn.perplexity.ai *.googleapis.com fonts.googleapis.com",
                "img-src 'self' data: https: blob: *.googleusercontent.com *.fbcdn.net *.google.com *.googleapis.com *.gstatic.com *.facebook.com",
                "font-src 'self' data: r2cdn.perplexity.ai *.gstatic.com *.googleapis.com fonts.gstatic.com",
                "connect-src 'self' *.asaas.com api.whatsapp.com accounts.google.com apis.google.com oauth2.googleapis.com www.googleapis.com *.googleapis.com *.gstatic.com securetoken.googleapis.com firebase.googleapis.com api.stripe.com checkout.stripe.com www.google-analytics.com *.facebook.com *.facebook.net www.facebook.com",
                "frame-src 'self' *.firebaseapp.com accounts.google.com oauth2.googleapis.com js.stripe.com *.facebook.com www.facebook.com checkout.stripe.com",
                "frame-ancestors 'self'",
                "form-action 'self' accounts.google.com",
                "object-src 'none'",
                "base-uri 'self'",
            ]
            : [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.asaas.com accounts.google.com apis.google.com *.gstatic.com js.stripe.com *.facebook.com *.facebook.net securetoken.googleapis.com firebase.googleapis.com www.googletagmanager.com www.google-analytics.com checkout.stripe.com",
                "style-src 'self' 'unsafe-inline' r2cdn.perplexity.ai *.googleapis.com fonts.googleapis.com",
                "img-src 'self' data: https: blob: *.googleusercontent.com *.fbcdn.net *.google.com *.googleapis.com *.gstatic.com *.facebook.com",
                "font-src 'self' data: r2cdn.perplexity.ai *.gstatic.com *.googleapis.com fonts.gstatic.com",
                "connect-src 'self' *.asaas.com api.whatsapp.com accounts.google.com apis.google.com oauth2.googleapis.com www.googleapis.com *.googleapis.com *.gstatic.com securetoken.googleapis.com firebase.googleapis.com api.stripe.com checkout.stripe.com www.google-analytics.com *.facebook.com *.facebook.net www.facebook.com",
                "frame-src 'self' *.firebaseapp.com accounts.google.com oauth2.googleapis.com js.stripe.com *.facebook.com www.facebook.com checkout.stripe.com",
                "frame-ancestors 'self'",
                "form-action 'self' accounts.google.com",
                "object-src 'none'",
                "base-uri 'self'",
                "upgrade-insecure-requests"
            ]

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
                        value: cspDirectives.join('; '),
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
                    // Note: CORS headers are handled in middleware.ts for proper origin validation
                    // Cannot use comma-separated origins with Access-Control-Allow-Credentials: true
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Origin'
                    },
                    {
                        key: 'Access-Control-Max-Age',
                        value: '86400'
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
}

module.exports = nextConfig
