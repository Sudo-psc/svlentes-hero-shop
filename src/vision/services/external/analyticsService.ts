interface AnalyticsEvent {
    name: string
    payload: Record<string, unknown>
}

export function trackEvent(event: AnalyticsEvent) {
    if (process.env.NODE_ENV !== 'production') {
        console.info('Analytics event', event)
    }
}
