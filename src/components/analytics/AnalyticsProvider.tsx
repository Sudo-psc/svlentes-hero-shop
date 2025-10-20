'use client';
import { AnalyticsDashboard, useAnalyticsDashboard } from './AnalyticsDashboard';
export function AnalyticsProvider() {
    const { isVisible, toggle } = useAnalyticsDashboard();
    return <AnalyticsDashboard isVisible={isVisible} onToggle={toggle} />;
}