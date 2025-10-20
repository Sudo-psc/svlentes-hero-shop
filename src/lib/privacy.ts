export interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}
export interface ConsentData {
    preferences: CookiePreferences;
    timestamp: string;
    version: string;
}
export interface MarketingPreferences {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
}
export interface PrivacyConsent {
    cookieConsent: ConsentData | null;
    marketingConsent: {
        granted: boolean;
        timestamp: string;
        preferences: MarketingPreferences;
    } | null;
    dataProcessingConsent: {
        granted: boolean;
        timestamp: string;
        purposes: string[];
    } | null;
}
// Cookie consent management
export const getCookieConsent = (): ConsentData | null => {
    if (typeof window === 'undefined') return null;
    try {
        const consent = localStorage.getItem('cookie-consent');
        return consent ? JSON.parse(consent) : null;
    } catch {
        return null;
    }
};
export const setCookieConsent = (preferences: CookiePreferences): void => {
    if (typeof window === 'undefined') return;
    const consentData: ConsentData = {
        preferences,
        timestamp: new Date().toISOString(),
        version: '1.0',
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    // Log consent for audit trail
    logConsentAction('cookie_consent_updated', consentData);
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
        detail: preferences
    }));
};
export const hasAnalyticsConsent = (): boolean => {
    const consent = getCookieConsent();
    return consent?.preferences.analytics ?? false;
};
export const hasMarketingConsent = (): boolean => {
    const consent = getCookieConsent();
    return consent?.preferences.marketing ?? false;
};
// Marketing consent management
export const getMarketingConsent = () => {
    if (typeof window === 'undefined') return null;
    try {
        const consent = localStorage.getItem('marketing-consent');
        return consent ? JSON.parse(consent) : null;
    } catch {
        return null;
    }
};
export const setMarketingConsent = (
    granted: boolean,
    preferences: MarketingPreferences
): void => {
    if (typeof window === 'undefined') return;
    const consentData = {
        granted,
        timestamp: new Date().toISOString(),
        preferences,
    };
    localStorage.setItem('marketing-consent', JSON.stringify(consentData));
    // Log consent for audit trail
    logConsentAction('marketing_consent_updated', consentData);
};
// Data processing consent
export const setDataProcessingConsent = (
    granted: boolean,
    purposes: string[]
): void => {
    if (typeof window === 'undefined') return;
    const consentData = {
        granted,
        timestamp: new Date().toISOString(),
        purposes,
    };
    localStorage.setItem('data-processing-consent', JSON.stringify(consentData));
    // Log consent for audit trail
    logConsentAction('data_processing_consent_updated', consentData);
};
// Consent logging for audit trail
export const logConsentAction = (action: string, data: any): void => {
    if (typeof window === 'undefined') return;
    const logEntry = {
        action,
        data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
    };
    // Store in localStorage for now (in production, send to server)
    const existingLogs = JSON.parse(localStorage.getItem('consent-logs') || '[]');
    existingLogs.push(logEntry);
    // Keep only last 100 entries
    if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
    }
    localStorage.setItem('consent-logs', JSON.stringify(existingLogs));
    // In production, also send to server
    if (process.env.NODE_ENV === 'production') {
        fetch('/api/consent-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logEntry),
        }).catch(() => {
            // Silently fail - logging shouldn't break user experience
        });
    }
};
// Get all privacy consents
export const getAllPrivacyConsents = (): PrivacyConsent => {
    return {
        cookieConsent: getCookieConsent(),
        marketingConsent: getMarketingConsent(),
        dataProcessingConsent: JSON.parse(
            localStorage.getItem('data-processing-consent') || 'null'
        ),
    };
};
// Clear all privacy data (for data deletion requests)
export const clearAllPrivacyData = (): void => {
    if (typeof window === 'undefined') return;
    // Log the deletion request
    logConsentAction('privacy_data_cleared', {
        timestamp: new Date().toISOString(),
    });
    // Clear all privacy-related localStorage items
    localStorage.removeItem('cookie-consent');
    localStorage.removeItem('marketing-consent');
    localStorage.removeItem('data-processing-consent');
    // Clear analytics data if possible
    if (window.gtag) {
        window.gtag('consent', 'update', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
        });
    }
    // Dispatch event for cleanup
    window.dispatchEvent(new CustomEvent('privacyDataCleared'));
};
// Check if user needs to see privacy notices
export const needsPrivacyConsent = (): boolean => {
    const cookieConsent = getCookieConsent();
    return !cookieConsent;
};
// Update analytics consent in Google Analytics
export const updateAnalyticsConsent = (granted: boolean): void => {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('consent', 'update', {
        analytics_storage: granted ? 'granted' : 'denied',
        ad_storage: granted ? 'granted' : 'denied',
    });
};
// LGPD compliance helpers
export const getLGPDComplianceStatus = () => {
    const consents = getAllPrivacyConsents();
    return {
        hasCookieConsent: !!consents.cookieConsent,
        hasMarketingConsent: !!consents.marketingConsent,
        hasDataProcessingConsent: !!consents.dataProcessingConsent,
        isCompliant: !!consents.cookieConsent, // Minimum requirement
        lastUpdated: consents.cookieConsent?.timestamp || null,
    };
};
// Export user data (for data portability requests)
export const exportUserPrivacyData = () => {
    const consents = getAllPrivacyConsents();
    const logs = JSON.parse(localStorage.getItem('consent-logs') || '[]');
    return {
        consents,
        consentLogs: logs,
        exportedAt: new Date().toISOString(),
        version: '1.0',
    };
};