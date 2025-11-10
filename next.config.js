/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    forceSwcTransforms: true,
  },
  // Configurar cabeçalhos para resolver problemas de MIME type e trusted types
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com" "https://checkout.stripe.com" "https://api.stripe.com")'
          },
          // CSP desabilitado temporariamente para desenvolvimento e depuração
          // {
          //   key: 'Content-Security-Policy',
          //   value: [
          //     "default-src 'self'",
          //     "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.googleapis.com https://accounts.google.com https://r2cdn.perplexity.ai",
          //     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          //     "font-src 'self' https://fonts.gstatic.com",
          //     "img-src 'self' data: https: blob: https://lh3.googleusercontent.com https://r2cdn.perplexity.ai",
          //     "connect-src 'self' https://api.stripe.com https://js.stripe.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com https://*.googleapis.com wss://ws.jam.dev wss://*.jam.dev",
          //     "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://svlentes.firebaseapp.com https://*.firebaseapp.com https://accounts.google.com https://svlentes.firebaseapp.com/__",
          //     "trusted-types nextjs nextjs#bundler nextjs#script gapi#gapi goog#html default stripe-js decodeHTMLEntitiesPolicy 'allow-duplicates'"
          //   ].join('; ')
          // }
        ]
      }
    ]
  }
};

module.exports = nextConfig;