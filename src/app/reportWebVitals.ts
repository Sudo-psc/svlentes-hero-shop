import type { NextWebVitalsMetric } from 'next/app'

const endpoint = '/api/monitoring/performance'

export function reportWebVitals(metric: NextWebVitalsMetric) {
    if (typeof window === 'undefined') {
        return
    }

    const body = JSON.stringify({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        label: metric.label,
        delta: metric.delta,
        rating: metric.rating,
        startTime: metric.startTime,
        navigationType: performance.getEntriesByType('navigation')[0]?.type ?? 'navigate',
        url: window.location.href,
        timestamp: Date.now(),
    })

    if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, body)
        return
    }

    fetch(endpoint, {
        method: 'POST',
        body,
        keepalive: true,
        headers: {
            'Content-Type': 'application/json',
        },
    }).catch(() => {})
}
