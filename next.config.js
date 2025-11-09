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
  // CSP desativado conforme solicitado
  // async headers() {
  //   return [
  //     {
  //       source: '/:path*',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: [
  //             "default-src 'self'",
  //             "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://m.stripe.network https://m.stripe.com https://api.stripe.com https://maps.googleapis.com https://www.googletagmanager.com https://apis.google.com https://accounts.google.com https://cdnjs.cloudflare.com",
  //             "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  //             "img-src 'self' data: https: blob:",
  //             "font-src 'self' data: https://fonts.gstatic.com",
  //             "connect-src 'self' https://js.stripe.com https://api.stripe.com https://m.stripe.network https://m.stripe.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://accounts.google.com https://apis.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  //             "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://checkout.stripe.com https://js.stripe.com/v3/ https://checkout.stripe.com/pay",
  //             "object-src 'none'",
  //             "base-uri 'self'",
  //             "form-action 'self'",
  //             "frame-ancestors 'self'",
  //             "upgrade-insecure-requests"
  //           ].join('; ')
  //         }
  //       ]
  //     }
  //   ]
  // }
};

module.exports = nextConfig;