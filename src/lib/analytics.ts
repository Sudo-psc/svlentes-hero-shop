// Google Analytics 4 Configuration and Custom Events
// Based on the design document requirements for conversion tracking

declare global {
    interface Window {
        gtag: (
            command: 'config' | 'event' | 'js' | 'set' | 'consent',
            targetId: string | Date | object,
            config?: object
        ) => void;
        dataLayer: any[];
    }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Initialize Google Analytics
export const initGA = () => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
        return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
        window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true,
        // Enhanced ecommerce for subscription tracking
        custom_map: {
            custom_parameter_1: 'plan_type',
            custom_parameter_2: 'billing_interval',
        },
    });
};

// Custom Events Interface based on design document
export interface CustomEvents {
    // Hero Section Events
    lead_form_submit: {
        source: 'hero_form';
        form_variant?: string;
        user_type?: 'new' | 'returning';
    };
    calculator_used: {
        economy_calculated: number;
        lens_type: string;
        usage_pattern: string;
        current_spending: number;
    };
    cta_agendar_clicked: {
        section: string;
        position?: string;
        user_journey_stage?: string;
    };
    cta_whatsapp_clicked: {
        section: string;
        context: string;
        has_user_data: boolean;
    };

    // Section-Specific Events
    pricing_tab_switched: {
        tab: 'mensal' | 'anual';
        previous_tab?: 'mensal' | 'anual';
    };
    plan_selected: {
        plan_name: string;
        price: number;
        billing_interval: 'monthly' | 'annual';
        plan_tier: string;
    };
    how_it_works_tab: {
        tab: 'mensal' | 'anual';
        time_spent?: number;
    };
    faq_opened: {
        question_id: string;
        question_text: string;
        section_position: number;
    };
    addon_selected: {
        addon_type: string;
        addon_name: string;
        addon_price?: number;
    };

    // Ecommerce Funnel Events
    product_page_view: {
        item_id: string;
        item_name: string;
        item_category: string;
        price?: number;
    };
    add_to_cart: {
        item_id: string;
        item_name: string;
        price: number;
        quantity: number;
        billing_interval: 'monthly' | 'annual';
    };
    checkout_started: {
        plan_id: string;
        plan_name: string;
        value: number;
        billing_interval: 'monthly' | 'annual';
        payment_method?: string;
    };
    payment_failure: {
        plan_id: string;
        plan_name?: string;
        reason: string;
        step: string;
        payment_method?: string;
        value?: number;
    };
    checkout_completed: {
        plan_id: string;
        plan_name?: string;
        value: number;
        billing_interval: 'monthly' | 'annual';
        transaction_id?: string;
        payment_method?: string;
    };
    conversion_rate_update: {
        stage: string;
        rate_from_previous: number;
        rate_from_start: number;
        drop_percentage: number;
        sample_size: number;
    };

    // Conversion Events
    consultation_scheduled: {
        plan_interest: string;
        source: string;
        form_completion_time?: number;
    };
    subscription_started: {
        plan_id: string;
        value: number;
        currency: 'BRL';
        billing_interval: 'monthly' | 'annual';
        transaction_id: string;
    };
    whatsapp_redirect: {
        context: string;
        user_data: boolean;
        message_type: 'lead' | 'consultation' | 'support';
    };

    // Error Events
    subscription_error: {
        error_type: string;
        error_message: string;
        plan_name: string;
        step: 'form' | 'payment' | 'processing';
    };
    form_validation_error: {
        form_type: string;
        field_name: string;
        error_message: string;
    };

    // Engagement Events
    section_viewed: {
        section_name: string;
        scroll_depth: number;
        time_on_section?: number;
    };
    referral_link_generated: {
        source: string;
        user_type: 'new' | 'existing';
    };
    referral_link_shared: {
        platform: string;
        method: 'copy' | 'direct_share';
    };
}

// Generic event tracking function
export const trackEvent = <T extends keyof CustomEvents>(
    eventName: T,
    parameters: CustomEvents[T]
) => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
        console.warn('Google Analytics not initialized');
        return;
    }

    try {
        window.gtag('event', eventName, {
            ...parameters,
            timestamp: new Date().toISOString(),
            page_location: window.location.href,
            page_title: document.title,
        });

        // Log for debugging in development
        if (process.env.NODE_ENV === 'development') {
            console.log('GA4 Event:', eventName, parameters);
        }
    } catch (error) {
        console.error('Error tracking event:', error);
    }
};

// Conversion funnel tracking
export const trackConversionFunnel = (
    stage: 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase',
    details: {
        funnel_step: number;
        funnel_name: string;
        value?: number;
        currency?: string;
        items?: Array<{
            item_id: string;
            item_name: string;
            item_category: string;
            price: number;
            quantity: number;
        }>;
    }
) => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
        return;
    }

    const eventName = stage === 'purchase' ? 'purchase' : 'funnel_step';

    window.gtag('event', eventName, {
        funnel_stage: stage,
        ...details,
        timestamp: new Date().toISOString(),
    });
};

// Enhanced ecommerce events for subscription business
export const trackSubscriptionEvent = (
    action: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase' | 'cancel_subscription',
    planData: {
        item_id: string;
        item_name: string;
        item_category: 'subscription';
        price: number;
        currency: 'BRL';
        billing_interval: 'monthly' | 'annual';
        transaction_id?: string;
        subscription_id?: string;
    }
) => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
        return;
    }

    const eventData = {
        currency: planData.currency,
        value: planData.price,
        items: [{
            item_id: planData.item_id,
            item_name: planData.item_name,
            item_category: planData.item_category,
            price: planData.price,
            quantity: 1,
            item_variant: planData.billing_interval,
        }],
        ...(planData.transaction_id && { transaction_id: planData.transaction_id }),
        ...(planData.subscription_id && { subscription_id: planData.subscription_id }),
    };

    window.gtag('event', action, eventData);
};

export const trackProductListView = (
    listId: string,
    listName: string,
    items: Array<{
        item_id: string;
        item_name: string;
        item_category: string;
        price?: number;
    }>
) => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
        return;
    }

    window.gtag('event', 'view_item_list', {
        item_list_id: listId,
        item_list_name: listName,
        items: items.map(item => ({
            item_id: item.item_id,
            item_name: item.item_name,
            item_category: item.item_category,
            price: item.price,
        })),
    });
};

export const trackProductPageView = (item: {
    item_id: string;
    item_name: string;
    item_category: string;
    price?: number;
}) => {
    trackEvent('product_page_view', {
        item_id: item.item_id,
        item_name: item.item_name,
        item_category: item.item_category,
        price: item.price,
    });

    trackSubscriptionEvent('view_item', {
        item_id: item.item_id,
        item_name: item.item_name,
        item_category: item.item_category,
        price: item.price ?? 0,
        currency: 'BRL',
        billing_interval: 'monthly',
    });
};

export const trackAddToCartEvent = (item: {
    item_id: string;
    item_name: string;
    price: number;
    quantity?: number;
    billing_interval: 'monthly' | 'annual';
}) => {
    const quantity = item.quantity ?? 1;

    trackEvent('add_to_cart', {
        item_id: item.item_id,
        item_name: item.item_name,
        price: item.price,
        quantity,
        billing_interval: item.billing_interval,
    });

    trackSubscriptionEvent('add_to_cart', {
        item_id: item.item_id,
        item_name: item.item_name,
        item_category: 'subscription',
        price: item.price,
        currency: 'BRL',
        billing_interval: item.billing_interval,
    });
};

export const trackCheckoutStartedEvent = (data: {
    plan_id: string;
    plan_name: string;
    value: number;
    billing_interval: 'monthly' | 'annual';
    payment_method?: string;
}) => {
    trackEvent('checkout_started', {
        plan_id: data.plan_id,
        plan_name: data.plan_name,
        value: data.value,
        billing_interval: data.billing_interval,
        payment_method: data.payment_method,
    });

    trackSubscriptionEvent('begin_checkout', {
        item_id: data.plan_id,
        item_name: data.plan_name,
        item_category: 'subscription',
        price: data.value,
        currency: 'BRL',
        billing_interval: data.billing_interval,
    });
};

export const trackCheckoutCompletedEvent = (data: {
    plan_id: string;
    plan_name?: string;
    value: number;
    billing_interval: 'monthly' | 'annual';
    transaction_id?: string;
    payment_method?: string;
}) => {
    trackEvent('checkout_completed', {
        plan_id: data.plan_id,
        plan_name: data.plan_name,
        value: data.value,
        billing_interval: data.billing_interval,
        transaction_id: data.transaction_id,
        payment_method: data.payment_method,
    });
};

export const trackPaymentFailureEvent = (data: {
    plan_id: string;
    plan_name?: string;
    reason: string;
    step: string;
    payment_method?: string;
    value?: number;
}) => {
    trackEvent('payment_failure', {
        plan_id: data.plan_id,
        plan_name: data.plan_name,
        reason: data.reason,
        step: data.step,
        payment_method: data.payment_method,
        value: data.value,
    });
};

export const trackConversionRateEvent = (data: {
    stage: string;
    rate_from_previous: number;
    rate_from_start: number;
    drop_percentage: number;
    sample_size: number;
}) => {
    trackEvent('conversion_rate_update', data);
};

// Page view tracking for SPA navigation
export const trackPageView = (url: string, title?: string) => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
        return;
    }

    window.gtag('config', GA_MEASUREMENT_ID, {
        page_location: url,
        page_title: title || document.title,
    });
};

// User properties for segmentation
export const setUserProperties = (properties: {
    user_type?: 'new' | 'returning' | 'subscriber';
    subscription_status?: 'active' | 'cancelled' | 'trial' | 'none';
    plan_type?: string;
    customer_lifetime_value?: number;
    acquisition_source?: string;
}) => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
        return;
    }

    window.gtag('set', 'user_properties', properties);
};

// Scroll depth tracking
export const initScrollTracking = () => {
    if (typeof window === 'undefined') return;

    const scrollDepths = [25, 50, 75, 90, 100];
    const trackedDepths: number[] = [];

    const trackScrollDepth = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);

        scrollDepths.forEach(depth => {
            if (scrollPercent >= depth && !trackedDepths.includes(depth)) {
                trackedDepths.push(depth);
                trackEvent('section_viewed', {
                    section_name: 'page_scroll',
                    scroll_depth: depth,
                });
            }
        });
    };

    let ticking = false;
    const handleScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                trackScrollDepth();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
};

// Session recording integration (for Hotjar/Clarity)
export const initSessionRecording = () => {
    // This can be extended to integrate with session recording tools
    // For now, we'll track session start
    trackEvent('section_viewed', {
        section_name: 'session_start',
        scroll_depth: 0,
    });
};