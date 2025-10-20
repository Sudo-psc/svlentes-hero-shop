'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    CookiePreferences,
    ConsentData,
    MarketingPreferences,
    getCookieConsent,
    getMarketingConsent,
    updateAnalyticsConsent,
    needsPrivacyConsent
} from '@/lib/privacy';
interface PrivacyContextType {
    cookieConsent: ConsentData | null;
    marketingConsent: any;
    showCookieBanner: boolean;
    hasAnalyticsConsent: boolean;
    hasMarketingConsent: boolean;
    updateCookieConsent: (preferences: CookiePreferences) => void;
    updateMarketingConsent: (granted: boolean, preferences: MarketingPreferences) => void;
    hideCookieBanner: () => void;
}
const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);
export function usePrivacy() {
    const context = useContext(PrivacyContext);
    if (context === undefined) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
}
interface PrivacyProviderProps {
    children: ReactNode;
}
export function PrivacyProvider({ children }: PrivacyProviderProps) {
    const [cookieConsent, setCookieConsent] = useState<ConsentData | null>(null);
    const [marketingConsent, setMarketingConsent] = useState<any>(null);
    const [showCookieBanner, setShowCookieBanner] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        // Initialize privacy state from localStorage
        const initializePrivacyState = () => {
            const savedCookieConsent = getCookieConsent();
            const savedMarketingConsent = getMarketingConsent();
            setCookieConsent(savedCookieConsent);
            setMarketingConsent(savedMarketingConsent);
            setShowCookieBanner(needsPrivacyConsent());
            setIsInitialized(true);
            // Update analytics consent based on saved preferences
            if (savedCookieConsent) {
                updateAnalyticsConsent(savedCookieConsent.preferences.analytics);
            }
        };
        initializePrivacyState();
        // Listen for consent updates from other components
        const handleConsentUpdate = (event: CustomEvent) => {
            const preferences = event.detail as CookiePreferences;
            setCookieConsent({
                preferences,
                timestamp: new Date().toISOString(),
                version: '1.0',
            });
            updateAnalyticsConsent(preferences.analytics);
        };
        const handlePrivacyDataCleared = () => {
            setCookieConsent(null);
            setMarketingConsent(null);
            setShowCookieBanner(true);
        };
        window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
        window.addEventListener('privacyDataCleared', handlePrivacyDataCleared);
        return () => {
            window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
            window.removeEventListener('privacyDataCleared', handlePrivacyDataCleared);
        };
    }, []);
    const updateCookieConsent = (preferences: CookiePreferences) => {
        const newConsent: ConsentData = {
            preferences,
            timestamp: new Date().toISOString(),
            version: '1.0',
        };
        setCookieConsent(newConsent);
        updateAnalyticsConsent(preferences.analytics);
        setShowCookieBanner(false);
    };
    const updateMarketingConsent = (granted: boolean, preferences: MarketingPreferences) => {
        const newConsent = {
            granted,
            timestamp: new Date().toISOString(),
            preferences,
        };
        setMarketingConsent(newConsent);
    };
    const hideCookieBanner = () => {
        setShowCookieBanner(false);
    };
    const contextValue: PrivacyContextType = {
        cookieConsent,
        marketingConsent,
        showCookieBanner: showCookieBanner && isInitialized,
        hasAnalyticsConsent: cookieConsent?.preferences.analytics ?? false,
        hasMarketingConsent: cookieConsent?.preferences.marketing ?? false,
        updateCookieConsent,
        updateMarketingConsent,
        hideCookieBanner,
    };
    return (
        <PrivacyContext.Provider value={contextValue}>
            {children}
        </PrivacyContext.Provider>
    );
}