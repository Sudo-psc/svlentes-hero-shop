'use client';
import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import { progressFunnelStage } from '@/lib/conversion-tracking';
interface SectionViewTrackerProps {
    sectionName: string;
    funnelStage?: 'hero_engagement' | 'pricing_viewed';
    threshold?: number; // Percentage of section that needs to be visible
    children: React.ReactNode;
}
export function SectionViewTracker({
    sectionName,
    funnelStage,
    threshold = 50,
    children
}: SectionViewTrackerProps) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const hasTracked = useRef(false);
    const startTime = useRef<number>(Date.now());
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= (threshold / 100)) {
                        if (!hasTracked.current) {
                            hasTracked.current = true;
                            // Track section view
                            trackEvent('section_viewed', {
                                section_name: sectionName,
                                scroll_depth: Math.round(entry.intersectionRatio * 100),
                                time_on_section: Date.now() - startTime.current,
                            });
                            // Progress funnel stage if specified
                            if (funnelStage) {
                                progressFunnelStage(funnelStage);
                            }
                        }
                    }
                });
            },
            {
                threshold: threshold / 100,
                rootMargin: '0px 0px -10% 0px', // Trigger when section is 10% from bottom of viewport
            }
        );
        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }
        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, [sectionName, funnelStage, threshold]);
    return (
        <div ref={sectionRef} data-section={sectionName}>
            {children}
        </div>
    );
}
// Hook for tracking time spent on sections
export function useTimeTracking(sectionName: string) {
    const startTime = useRef<number>(Date.now());
    const isVisible = useRef<boolean>(false);
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isVisible.current) {
                // Track time spent when user leaves the page
                const timeSpent = Date.now() - startTime.current;
                trackEvent('section_viewed', {
                    section_name: `${sectionName}_time_spent`,
                    scroll_depth: 100,
                    time_on_section: timeSpent,
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Track time spent on unmount
            if (isVisible.current) {
                const timeSpent = Date.now() - startTime.current;
                trackEvent('section_viewed', {
                    section_name: `${sectionName}_session_end`,
                    scroll_depth: 100,
                    time_on_section: timeSpent,
                });
            }
        };
    }, [sectionName]);
    const markVisible = () => {
        isVisible.current = true;
        startTime.current = Date.now();
    };
    const markHidden = () => {
        if (isVisible.current) {
            const timeSpent = Date.now() - startTime.current;
            trackEvent('section_viewed', {
                section_name: `${sectionName}_section_exit`,
                scroll_depth: 100,
                time_on_section: timeSpent,
            });
            isVisible.current = false;
        }
    };
    return { markVisible, markHidden };
}