'use client';
import { useEffect, useRef } from 'react';
import { trackAbandonment } from '@/lib/conversion-tracking';
import { trackEvent } from '@/lib/analytics';
interface AbandonmentTrackerProps {
    formType: 'lead_capture' | 'calculator' | 'checkout' | 'consultation';
    stage: 'lead_capture' | 'calculator_used' | 'checkout_started' | 'consultation_booked';
    children: React.ReactNode;
}
export function AbandonmentTracker({ formType, stage, children }: AbandonmentTrackerProps) {
    const formRef = useRef<HTMLDivElement>(null);
    const interactionStarted = useRef(false);
    const startTime = useRef<number>(Date.now());
    const fieldInteractions = useRef<Set<string>>(new Set());
    useEffect(() => {
        const formElement = formRef.current;
        if (!formElement) return;
        const handleFormInteraction = (event: Event) => {
            if (!interactionStarted.current) {
                interactionStarted.current = true;
                startTime.current = Date.now();
            }
            // Track field interactions
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                const fieldName = target.getAttribute('name') || target.getAttribute('id') || 'unknown';
                fieldInteractions.current.add(fieldName);
            }
        };
        const handleFormFocus = () => {
            if (!interactionStarted.current) {
                interactionStarted.current = true;
                startTime.current = Date.now();
            }
        };
        // Add event listeners for form interactions
        formElement.addEventListener('input', handleFormInteraction);
        formElement.addEventListener('change', handleFormInteraction);
        formElement.addEventListener('focus', handleFormFocus, true);
        return () => {
            formElement.removeEventListener('input', handleFormInteraction);
            formElement.removeEventListener('change', handleFormInteraction);
            formElement.removeEventListener('focus', handleFormFocus, true);
        };
    }, []);
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (interactionStarted.current) {
                const timeSpent = Date.now() - startTime.current;
                const fieldsInteracted = fieldInteractions.current.size;
                // Track abandonment if user started interacting but didn't complete
                trackAbandonment(stage, 'page_exit', {
                    time_spent: timeSpent,
                    fields_interacted: fieldsInteracted,
                    form_type: formType,
                });
            }
        };
        const handleVisibilityChange = () => {
            if (document.hidden && interactionStarted.current) {
                const timeSpent = Date.now() - startTime.current;
                const fieldsInteracted = fieldInteractions.current.size;
                trackAbandonment(stage, 'tab_switch', {
                    time_spent: timeSpent,
                    fields_interacted: fieldsInteracted,
                    form_type: formType,
                });
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [formType, stage]);
    return (
        <div ref={formRef} data-abandonment-tracker={formType}>
            {children}
        </div>
    );
}
// Hook for tracking form field errors
export function useFormErrorTracking(formType: string) {
    const trackFieldError = (fieldName: string, errorMessage: string) => {
        trackEvent('form_validation_error', {
            form_type: formType,
            field_name: fieldName,
            error_message: errorMessage,
        });
    };
    const trackFormSubmissionError = (errorType: string, errorMessage: string) => {
        trackEvent('subscription_error', {
            error_type: errorType,
            error_message: errorMessage,
            plan_name: 'unknown',
            step: 'form',
        });
    };
    return { trackFieldError, trackFormSubmissionError };
}
// Component for tracking CTA clicks and their effectiveness
interface CTATrackerProps {
    ctaType: 'primary' | 'secondary' | 'whatsapp';
    section: string;
    position?: string;
    children: React.ReactNode;
    onClick?: () => void;
}
export function CTATracker({ ctaType, section, position, children, onClick }: CTATrackerProps) {
    const handleClick = () => {
        // Track CTA click based on type
        if (ctaType === 'whatsapp') {
            trackEvent('cta_whatsapp_clicked', {
                section,
                context: 'support',
                has_user_data: false,
            });
        } else {
            trackEvent('cta_agendar_clicked', {
                section,
                position: position || ctaType,
                user_journey_stage: 'consideration',
            });
        }
        // Call original onClick if provided
        onClick?.();
    };
    return (
        <div onClick={handleClick} style={{ display: 'contents' }}>
            {children}
        </div>
    );
}