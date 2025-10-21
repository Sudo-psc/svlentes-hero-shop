/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ['@heroicons/react'],
    },
    // Enable type checking and linting for production builds
    typescript: {
        ignoreBuildErrors: false, // 🚀 QUICK WIN: Enable type checking for production safety
    },
    eslint: {
        ignoreDuringBuilds: false, // 🚀 QUICK WIN: Enable ESLint for code quality
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
        minimumCacheTTL: 60, // 60 seconds for dynamic images
        dangerouslyAllowSVG: true,
        unoptimized: false,
        loader: 'default',
    },
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    headers: async () => {
        const isDev = process.env.NODE_ENV === 'development'

        // Generate nonce for CSP
        const generateNonce = () => {
            const { randomBytes } = require('crypto');
            return randomBytes(16).toString('base64');
        }
        const nonce = generateNonce();

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
                        value: isDev
                            ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'unsafe-hashes' *.asaas.com accounts.google.com apis.google.com *.gstatic.com js.stripe.com *.facebook.com *.facebook.net securetoken.googleapis.com firebase.googleapis.com; style-src 'self' 'unsafe-inline' https://r2cdn.perplexity.ai *.googleapis.com; img-src 'self' data: https: *.googleusercontent.com *.fbcdn.net; font-src 'self' data: https://r2cdn.perplexity.ai *.gstatic.com *.googleapis.com; connect-src 'self' *.asaas.com api.whatsapp.com accounts.google.com apis.google.com oauth2.googleapis.com www.googleapis.com *.googleapis.com *.gstatic.com securetoken.googleapis.com firebase.googleapis.com *.facebook.com *.facebook.net www.facebook.com; frame-src 'self' *.firebaseapp.com accounts.google.com oauth2.googleapis.com js.stripe.com *.facebook.com www.facebook.com; object-src 'none'; base-uri 'self';"
                            : "default-src 'self'; script-src 'self' 'unsafe-hashes' *.asaas.com accounts.google.com apis.google.com *.gstatic.com js.stripe.com *.facebook.com *.facebook.net securetoken.googleapis.com firebase.googleapis.com; style-src 'self' 'unsafe-inline' https://r2cdn.perplexity.ai *.googleapis.com; img-src 'self' data: https: *.googleusercontent.com *.fbcdn.net; font-src 'self' data: https://r2cdn.perplexity.ai *.gstatic.com *.googleapis.com; connect-src 'self' *.asaas.com api.whatsapp.com accounts.google.com apis.google.com oauth2.googleapis.com www.googleapis.com *.googleapis.com *.gstatic.com securetoken.googleapis.com firebase.googleapis.com *.facebook.com *.facebook.net www.facebook.com; frame-src 'self' *.firebaseapp.com accounts.google.com oauth2.googleapis.com js.stripe.com *.facebook.com www.facebook.com; object-src 'none'; base-uri 'self';"
                    },
                    {
                        key: 'X-CSP-Nonce',
                        value: nonce,
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

        // Handle SVG files properly
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        })

        return config
    },
}

module.exports = nextConfig
