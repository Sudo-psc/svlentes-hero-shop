import { NextRequest } from 'next/server'
import { withAdminAuth } from '@/lib/admin/auth'
import { Permission, RevenueData } from '@/types/admin'
export const GET = withAdminAuth(
  async (req: NextRequest, { user }) => {
    // Mock revenue data for the last 6 months
    const revenueData: RevenueData[] = [
      {
        date: '2024-05-01',
        revenue: 38450.00,
        subscriptions: 820,
        orders: 124,
      },
      {
        date: '2024-06-01',
        revenue: 41200.00,
        subscriptions: 845,
        orders: 138,
      },
      {
        date: '2024-07-01',
        revenue: 39800.00,
        subscriptions: 855,
        orders: 142,
      },
      {
        date: '2024-08-01',
        revenue: 42500.00,
        subscriptions: 870,
        orders: 151,
      },
      {
        date: '2024-09-01',
        revenue: 44200.00,
        subscriptions: 885,
        orders: 158,
      },
      {
        date: '2024-10-01',
        revenue: 45680.50,
        subscriptions: 892,
        orders: 165,
      },
    ]
    return Response.json({
      success: true,
      data: revenueData,
    })
  },
  Permission.VIEW_ANALYTICS
)