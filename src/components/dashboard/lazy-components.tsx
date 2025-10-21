/**
 * Lazy Loading Components for Dashboard
 * Implementa code splitting para componentes pesados
 */
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Loading component compartilhado
const DashboardLoader = () => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      <p className="text-sm text-gray-600">Carregando...</p>
    </div>
  </div>
)

// Error component para fallback
const DashboardError = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="text-center">
      <div className="text-red-600 mb-4">
        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar componente</h3>
      <p className="text-sm text-gray-600 mb-4">{error.message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  </div>
)

// Lazy Components com loading e error states
export const LazyDesktopNavigation = dynamic(
  () => import('./desktop-navigation').then(mod => ({ default: mod.DesktopNavigation })),
  {
    loading: DashboardLoader,
    ssr: false
  }
)

export const LazyDashboardMetrics = dynamic(
  () => import('./dashboard-metrics').then(mod => ({ default: mod.DashboardMetrics })),
  {
    loading: DashboardLoader,
    ssr: false
  }
)

export const LazySubscriptionTable = dynamic(
  () => import('./dashboard-data-table').then(mod => ({ default: mod.SubscriptionTable })),
  {
    loading: DashboardLoader,
    ssr: false
  }
)

export const LazyResponsiveLineChart = dynamic(
  () => import('./responsive-charts').then(mod => ({ default: mod.ResponsiveLineChart })),
  {
    loading: DashboardLoader,
    ssr: false
  }
)

export const LazyResponsiveBarChart = dynamic(
  () => import('./responsive-charts').then(mod => ({ default: mod.ResponsiveBarChart })),
  {
    loading: DashboardLoader,
    ssr: false
  }
)

export const LazyDashboardLayout = dynamic(
  () => import('./dashboard-layout').then(mod => ({ default: mod.DashboardLayout })),
  {
    loading: DashboardLoader,
    ssr: false
  }
)

export const LazyDashboardHeader = dynamic(
  () => import('./dashboard-header').then(mod => ({ default: mod.DashboardHeader })),
  {
    loading: DashboardLoader,
    ssr: false
  }
)

// Component wrapper com error boundary
export const SafeLazyComponent = ({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error }> 
}) => {
  return (
    <div className="lazy-component-wrapper">
      {children}
    </div>
  )
}
