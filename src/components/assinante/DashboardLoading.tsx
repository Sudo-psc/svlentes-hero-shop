import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Skeleton,
  SkeletonSubscriptionCard,
  SkeletonOrderHistory,
  SkeletonCard,
  SkeletonDashboard
} from '@/components/ui/Skeleton'

/**
 * Enhanced Dashboard Loading Component
 *
 * Provides content-aware skeleton screens that match the actual dashboard layout.
 * Improves perceived performance and user experience during data loading.
 */
export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-silver-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section Loading */}
        <div className="mb-8">
          <div className="space-y-2">
            <Skeleton variant="text" width="40%" height={32} animation="wave" />
            <Skeleton variant="text" width="60%" height={20} animation="wave" />
          </div>
        </div>

        {/* Subscription Status Loading */}
        <Card className="mb-8">
          <SkeletonSubscriptionCard />
        </Card>

        {/* Tabs Navigation Loading */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              variant="text"
              width={100}
              height={40}
              animation="pulse"
            />
          ))}
        </div>

        {/* Tab Content Loading */}
        <Card>
          <CardContent className="p-6">
            <SkeletonCard />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SubscriptionStatusLoading() {
  return (
    <Card>
      <SkeletonSubscriptionCard />
    </Card>
  )
}

export function BenefitsLoading() {
  return (
    <Card>
      <CardContent className="p-6">
        <SkeletonCard />
      </CardContent>
    </Card>
  )
}

export function ShippingAddressLoading() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton variant="text" width="50%" height={24} animation="wave" />
          <div className="space-y-2">
            <Skeleton variant="text" width="100%" height={16} animation="wave" />
            <Skeleton variant="text" width="80%" height={16} animation="wave" />
            <Skeleton variant="text" width="60%" height={16} animation="wave" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrderHistoryLoading() {
  return (
    <Card>
      <CardContent className="p-6">
        <SkeletonOrderHistory />
      </CardContent>
    </Card>
  )
}

export default DashboardLoading