'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { PrivacyProvider } from '@/components/privacy/PrivacyProvider'
import { ErrorHandler } from '@/components/performance/ErrorHandler'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PrivacyProvider>
        <ErrorHandler />
        {children}
      </PrivacyProvider>
    </AuthProvider>
  )
}
