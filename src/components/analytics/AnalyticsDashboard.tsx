'use client';
import { useState, useEffect } from 'react';
import { getConversionMetrics } from '@/lib/conversion-tracking';
import { GA_MEASUREMENT_ID } from '@/lib/analytics';
interface AnalyticsDashboardProps {
    isVisible?: boolean;
    onToggle?: () => void;
}
export function AnalyticsDashboard({ isVisible = false, onToggle }: AnalyticsDashboardProps) {
    const [metrics, setMetrics] = useState({
        sessionDuration: 0,
        stagesCompleted: 0,
        conversionRate: 0,
        abandonmentPoints: 0,
        currentStage: 'page_view' as any
    });
    const [events, setEvents] = useState<Array<{ timestamp: string; event: string; data: any }>>([]);
    useEffect(() => {
        if (isVisible) {
            // Update metrics
            const currentMetrics = getConversionMetrics();
            setMetrics(currentMetrics);
            // Mock recent events (in a real implementation, you'd store these)
            const recentEvents = [
                { timestamp: new Date().toISOString(), event: 'page_view', data: { page: 'landing' } },
                { timestamp: new Date().toISOString(), event: 'section_viewed', data: { section: 'hero' } },
            ];
            setEvents(recentEvents);
        }
    }, [isVisible]);
    if (!isVisible) {
        return (
            <button
                onClick={onToggle}
                className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50 hover:bg-blue-700"
                title="Open Analytics Dashboard"
            >
                📊
            </button>
        );
    }
    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    };
    return (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto z-50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Analytics Dashboard</h3>
                <button
                    onClick={onToggle}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>
            {/* GA4 Status */}
            <div className="mb-4 p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium">GA4 Status</div>
                <div className={`text-xs ${GA_MEASUREMENT_ID ? 'text-green-600' : 'text-red-600'}`}>
                    {GA_MEASUREMENT_ID ? `Connected: ${GA_MEASUREMENT_ID}` : 'Not configured'}
                </div>
            </div>
            {/* Conversion Metrics */}
            <div className="mb-4">
                <h4 className="font-medium mb-2">Conversion Funnel</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Current Stage:</span>
                        <span className="font-medium">{metrics.currentStage}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Session Duration:</span>
                        <span>{formatDuration(metrics.sessionDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Stages Completed:</span>
                        <span>{metrics.stagesCompleted}/9</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Conversion Rate:</span>
                        <span>{metrics.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Abandonment Points:</span>
                        <span className={metrics.abandonmentPoints > 0 ? 'text-red-600' : 'text-green-600'}>
                            {metrics.abandonmentPoints}
                        </span>
                    </div>
                </div>
            </div>
            {/* Funnel Progress Bar */}
            <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${metrics.conversionRate}%` }}
                    ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    Funnel Progress: {metrics.conversionRate.toFixed(1)}%
                </div>
            </div>
            {/* Recent Events */}
            <div className="mb-4">
                <h4 className="font-medium mb-2">Recent Events</h4>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                    {events.length > 0 ? (
                        events.map((event, index) => (
                            <div key={index} className="p-1 bg-gray-50 rounded">
                                <div className="font-medium">{event.event}</div>
                                <div className="text-gray-600">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-500">No recent events</div>
                    )}
                </div>
            </div>
            {/* Debug Actions */}
            <div className="border-t pt-2">
                <div className="text-xs text-gray-500 mb-2">Debug Actions</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (typeof window !== 'undefined' && window.gtag) {
                                window.gtag('event', 'debug_test', {
                                    event_category: 'debug',
                                    event_label: 'dashboard_test',
                                });
                                alert('Test event sent to GA4');
                            } else {
                                alert('GA4 not available');
                            }
                        }}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                    >
                        Test GA4
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('svlentes_user_journey');
                            window.location.reload();
                        }}
                        className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                    >
                        Reset Journey
                    </button>
                </div>
            </div>
        </div>
    );
}
// Hook for using the analytics dashboard
export function useAnalyticsDashboard() {
    const [isVisible, setIsVisible] = useState(false);
    // Show dashboard in development mode or when URL contains debug=analytics
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const showDebug = process.env.NODE_ENV === 'development' || urlParams.get('debug') === 'analytics';
        if (showDebug) {
            // Auto-show in development after 2 seconds
            const timer = setTimeout(() => setIsVisible(false), 2000);
            return () => clearTimeout(timer);
        }
    }, []);
    const toggle = () => setIsVisible(!isVisible);
    return { isVisible, toggle };
}