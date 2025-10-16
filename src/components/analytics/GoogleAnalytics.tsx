'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { initGA, initScrollTracking, initSessionRecording, GA_MEASUREMENT_ID } from '@/lib/analytics';

export function GoogleAnalytics() {
    const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const consent = localStorage.getItem('cookie-consent');
            if (consent) {
                const parsed = JSON.parse(consent);
                setHasAnalyticsConsent(parsed?.preferences?.analytics ?? false);
            }
        }
    }, []);

    useEffect(() => {
        // Only initialize GA4 if user has given consent
        if (GA_MEASUREMENT_ID && hasAnalyticsConsent && !isInitialized) {
            initGA();

            // Initialize additional tracking features
            const cleanupScrollTracking = initScrollTracking();
            initSessionRecording();

            setIsInitialized(true);

            // Cleanup function
            return () => {
                if (cleanupScrollTracking) {
                    cleanupScrollTracking();
                }
            };
        }
    }, [hasAnalyticsConsent, isInitialized]);

    // Don't render anything if no measurement ID or no consent
    if (!GA_MEASUREMENT_ID || !hasAnalyticsConsent) {
        return null;
    }

    return (
        <>
            {/* Google Analytics 4 Script */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
                onLoad={() => {
                    console.log('Google Analytics script loaded');
                }}
            />

            {/* Initialize GA4 */}
            <Script
                id="google-analytics-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        
                        // Set initial consent state
                        gtag('consent', 'default', {
                            analytics_storage: 'granted',
                            ad_storage: 'denied'
                        });
                        
                        gtag('config', '${GA_MEASUREMENT_ID}', {
                            page_title: document.title,
                            page_location: window.location.href,
                            send_page_view: true,
                            custom_map: {
                                custom_parameter_1: 'plan_type',
                                custom_parameter_2: 'billing_interval'
                            }
                        });
                    `,
                }}
            />
        </>
    );
}

// Hook for tracking page views in App Router
export function usePageTracking() {
    useEffect(() => {
        if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
            window.gtag('config', GA_MEASUREMENT_ID, {
                page_location: window.location.href,
                page_title: document.title,
            });
        }
    }, []);
}