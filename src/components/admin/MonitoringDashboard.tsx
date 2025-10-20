/**
 * Monitoring Dashboard Component
 * Displays system health, performance metrics, and alerts
 * This would typically be behind authentication in a real application
 */
'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
interface HealthCheck {
    timestamp: string
    status: 'healthy' | 'warning' | 'unhealthy'
    responseTime: number
    checks: {
        database: { status: string; responseTime: number }
        stripe: { status: string; responseTime: number }
        memory: { status: string; usage: number }
        uptime: number
    }
}
interface PerformanceMetrics {
    timestamp: string
    metrics: {
        averageLCP: number
        averageFID: number
        averageCLS: number
        averagePageLoadTime: number
        errorRate: number
        conversionRate: number
    }
    trends: {
        lcp: { trend: string; change: number }
        fid: { trend: string; change: number }
        cls: { trend: string; change: number }
        pageLoadTime: { trend: string; change: number }
    }
}
interface Alert {
    id: string
    type: string
    severity: 'info' | 'warning' | 'critical'
    timestamp: string
    data: any
    status: 'active' | 'resolved'
}
export default function MonitoringDashboard() {
    const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null)
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    useEffect(() => {
        fetchMonitoringData()
        const interval = setInterval(fetchMonitoringData, 30000) // Refresh every 30 seconds
        return () => clearInterval(interval)
    }, [])
    const fetchMonitoringData = async () => {
        try {
            setLoading(true)
            // Fetch health check
            const healthResponse = await fetch('/api/health-check')
            const healthData = await healthResponse.json()
            setHealthCheck(healthData)
            // Fetch performance metrics
            const performanceResponse = await fetch('/api/monitoring/performance')
            const performanceData = await performanceResponse.json()
            setPerformanceMetrics(performanceData)
            // Fetch alerts
            const alertsResponse = await fetch('/api/monitoring/alerts')
            const alertsData = await alertsResponse.json()
            setAlerts(alertsData.alerts || [])
            setError(null)
        } catch (err) {
            setError('Failed to fetch monitoring data')
            console.error('Monitoring data fetch error:', err)
        } finally {
            setLoading(false)
        }
    }
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-100'
            case 'warning': return 'text-yellow-600 bg-yellow-100'
            case 'unhealthy': return 'text-red-600 bg-red-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'info': return 'text-blue-600 bg-blue-100'
            case 'warning': return 'text-yellow-600 bg-yellow-100'
            case 'critical': return 'text-red-600 bg-red-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }
    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${days}d ${hours}h ${minutes}m`
    }
    if (loading && !healthCheck) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">SV Lentes Monitoring Dashboard</h1>
                <p className="text-gray-600">System health and performance overview</p>
            </div>
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
            {/* System Health */}
            {healthCheck && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">System Health</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Overall Status</p>
                                    <p className={`text-lg font-semibold px-2 py-1 rounded ${getStatusColor(healthCheck.status)}`}>
                                        {healthCheck.status.toUpperCase()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Response Time</p>
                                    <p className="text-lg font-semibold">{healthCheck.responseTime}ms</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div>
                                <p className="text-sm text-gray-600">Stripe Integration</p>
                                <p className={`text-sm px-2 py-1 rounded ${getStatusColor(healthCheck.checks.stripe.status)}`}>
                                    {healthCheck.checks.stripe.status}
                                </p>
                                <p className="text-xs text-gray-500">{healthCheck.checks.stripe.responseTime}ms</p>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div>
                                <p className="text-sm text-gray-600">Memory Usage</p>
                                <p className={`text-sm px-2 py-1 rounded ${getStatusColor(healthCheck.checks.memory.status)}`}>
                                    {healthCheck.checks.memory.usage}MB
                                </p>
                                <p className="text-xs text-gray-500">{healthCheck.checks.memory.status}</p>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div>
                                <p className="text-sm text-gray-600">Uptime</p>
                                <p className="text-lg font-semibold">{formatUptime(healthCheck.checks.uptime)}</p>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
            {/* Performance Metrics */}
            {performanceMetrics && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card className="p-4">
                            <div>
                                <p className="text-sm text-gray-600">Largest Contentful Paint</p>
                                <p className="text-2xl font-bold">{performanceMetrics.metrics.averageLCP}ms</p>
                                <p className={`text-sm ${performanceMetrics.trends.lcp.trend === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
                                    {performanceMetrics.trends.lcp.change > 0 ? '+' : ''}{performanceMetrics.trends.lcp.change}ms
                                </p>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div>
                                <p className="text-sm text-gray-600">First Input Delay</p>
                                <p className="text-2xl font-bold">{performanceMetrics.metrics.averageFID}ms</p>
                                <p className={`text-sm ${performanceMetrics.trends.fid.trend === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
                                    {performanceMetrics.trends.fid.change > 0 ? '+' : ''}{performanceMetrics.trends.fid.change}ms
                                </p>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div>
                                <p className="text-sm text-gray-600">Cumulative Layout Shift</p>
                                <p className="text-2xl font-bold">{performanceMetrics.metrics.averageCLS}</p>
                                <p className={`text-sm ${performanceMetrics.trends.cls.trend === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
                                    {performanceMetrics.trends.cls.change > 0 ? '+' : ''}{performanceMetrics.trends.cls.change}
                                </p>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div>
                                <p className="text-sm text-gray-600">Page Load Time</p>
                                <p className="text-2xl font-bold">{performanceMetrics.metrics.averagePageLoadTime}ms</p>
                                <p className={`text-sm ${performanceMetrics.trends.pageLoadTime.trend === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
                                    {performanceMetrics.trends.pageLoadTime.change > 0 ? '+' : ''}{performanceMetrics.trends.pageLoadTime.change}ms
                                </p>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div>
                                <p className="text-sm text-gray-600">Error Rate</p>
                                <p className="text-2xl font-bold">{(performanceMetrics.metrics.errorRate * 100).toFixed(2)}%</p>
                                <p className="text-xs text-gray-500">Last 24 hours</p>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div>
                                <p className="text-sm text-gray-600">Conversion Rate</p>
                                <p className="text-2xl font-bold">{(performanceMetrics.metrics.conversionRate * 100).toFixed(2)}%</p>
                                <p className="text-xs text-gray-500">Last 24 hours</p>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
            {/* Recent Alerts */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
                {alerts.length === 0 ? (
                    <Card className="p-4">
                        <p className="text-gray-600">No recent alerts</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {alerts.slice(0, 10).map((alert) => (
                            <Card key={alert.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                            {alert.severity.toUpperCase()}
                                        </span>
                                        <div>
                                            <p className="font-medium">{alert.type.replace(/_/g, ' ').toUpperCase()}</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(alert.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded text-xs ${alert.status === 'active' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {alert.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                {alert.data && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                            {JSON.stringify(alert.data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            {/* Refresh Button */}
            <div className="text-center">
                <button
                    onClick={fetchMonitoringData}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                    Last updated: {healthCheck ? new Date(healthCheck.timestamp).toLocaleString() : 'Never'}
                </p>
            </div>
        </div>
    )
}