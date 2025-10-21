'use client'

import React from 'react'

/**
 * Feature Modules - Code Splitting por Feature
 * Organiza componentes por funcionalidade para melhor bundle splitting
 */

// Dashboard Features
export const DashboardFeatures = {
  // Lazy loading para componentes do dashboard
  Metrics: () => import('../dashboard/lazy-components').then(mod => ({ default: mod.LazyDashboardMetrics })),
  Charts: () => import('../dashboard/lazy-components').then(mod => ({ default: mod.LazyResponsiveLineChart })),
  Tables: () => import('../dashboard/lazy-components').then(mod => ({ default: mod.LazySubscriptionTable })),
  Navigation: () => import('../dashboard/lazy-components').then(mod => ({ default: mod.LazyDesktopNavigation }))
}

// Payment Features
export const PaymentFeatures = {
  // Lazy loading para componentes de pagamento
  PaymentMethodSelector: () => import('../payment/lazy-components').then(mod => ({ default: mod.LazyPaymentMethodSelector })),
  PaymentTestModal: () => import('../payment/lazy-components').then(mod => ({ default: mod.LazyPaymentTestModal })),
  StripePricingTable: () => import('../payment/lazy-components').then(mod => ({ default: mod.LazyStripePricingTable })),
  StripeScript: () => import('../payment/lazy-components').then(mod => ({ default: mod.LazyStripeScript }))
}

// Componente wrapper para carregar features sob demanda
export const FeatureLoader = <T extends React.ComponentType<any>>(
  featureLoader: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(featureLoader)
  
  return ({ ...props }: React.ComponentProps<T>) => (
    <React.Suspense fallback={fallback ? React.createElement(fallback) : <div>Carregando...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

// Hook para pré-carregar features
export const useFeaturePreloader = () => {
  const preloadFeature = React.useCallback((featureLoader: () => Promise<any>) => {
    // Pré-carrega o componente em background
    featureLoader().catch(error => {
      console.warn('Failed to preload feature:', error)
    })
  }, [])

  const preloadDashboard = React.useCallback(() => {
    Object.values(DashboardFeatures).forEach(loader => preloadFeature(loader))
  }, [preloadFeature])

  const preloadPayment = React.useCallback(() => {
    Object.values(PaymentFeatures).forEach(loader => preloadFeature(loader))
  }, [preloadFeature])

  const preloadAuth = React.useCallback(() => {
    Object.values(AuthFeatures).forEach(loader => preloadFeature(loader))
  }, [preloadFeature])

  return {
    preloadFeature,
    preloadDashboard,
    preloadPayment,
    preloadAuth
  }
}

// Configuração de chunks por feature para Webpack
export const CHUNK_NAMES = {
  DASHBOARD: 'dashboard',
  PAYMENT: 'payment',
  AUTH: 'auth',
  ADMIN: 'admin',
  FORMS: 'forms'
} as const

// Utilitário para determinar qual chunk carregar baseado na rota
export const getChunkForRoute = (route: string): keyof typeof CHUNK_NAMES => {
  if (route.startsWith('/area-assinante')) return CHUNK_NAMES.DASHBOARD
  if (route.startsWith('/assinar') || route.startsWith('/payment')) return CHUNK_NAMES.PAYMENT
  if (route.startsWith('/auth') || route.startsWith('/area-assinante/login')) return CHUNK_NAMES.AUTH
  if (route.startsWith('/admin')) return CHUNK_NAMES.ADMIN
  if (route.includes('/form') || route.includes('/agendar')) return CHUNK_NAMES.FORMS
  return CHUNK_NAMES.DASHBOARD // default
}

// Componente de roteamento inteligente que carrega chunks por feature
export const SmartRouteLoader = ({ 
  route, 
  children 
}: { 
  route: string
  children: React.ReactNode 
}) => {
  const chunkName = getChunkForRoute(route)
  const { preloadFeature } = useFeaturePreloader()

  React.useEffect(() => {
    // Pré-carrega o chunk baseado na rota atual
    switch (chunkName) {
      case CHUNK_NAMES.DASHBOARD:
        import('../dashboard/lazy-components')
        break
      case CHUNK_NAMES.PAYMENT:
        import('../payment/lazy-components')
        break
      case CHUNK_NAMES.AUTH:
        import('../auth/LoginForm')
        break
      case CHUNK_NAMES.ADMIN:
        import('../admin/AdminPanel')
        break
      case CHUNK_NAMES.FORMS:
        import('../forms/ContactForm')
        break
    }
  }, [chunkName])

  return <>{children}</>
}
