/**
 * Tipos para sistema de privacidade e LGPD
 * Conformidade com Lei Geral de Proteção de Dados (LGPD)
 */
export type ConsentType = 'terms' | 'data_processing' | 'marketing' | 'medical_data'
export type DataRequestType = 'access' | 'rectification' | 'deletion' | 'portability' | 'opposition'
export type ConsentStatus = 'granted' | 'revoked' | 'expired'
export interface ConsentLog {
  id: string
  userId?: string
  email: string
  consentType: ConsentType
  status: ConsentStatus
  ipAddress: string
  userAgent: string
  timestamp: string
  expiresAt?: string
  metadata?: {
    source?: string
    planId?: string
    version?: string
  }
}
export interface ConsentLogRequest {
  email: string
  consentType: ConsentType
  status: ConsentStatus
  metadata?: {
    source?: string
    planId?: string
    version?: string
  }
}
export interface DataRequest {
  id: string
  email: string
  name: string
  requestType: DataRequestType
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  reason?: string
  requestedAt: string
  completedAt?: string
  metadata?: {
    notes?: string
    attachments?: string[]
  }
}
export interface DataRequestPayload {
  email: string
  name: string
  requestType: DataRequestType
  reason?: string
  cpfCnpj?: string
}
export interface DataExportResult {
  email: string
  exportedAt: string
  data: {
    personalData: {
      name?: string
      email: string
      phone?: string
      cpfCnpj?: string
    }
    subscriptions?: any[]
    orders?: any[]
    consents: ConsentLog[]
    medicalData?: {
      prescriptions?: any[]
      consultations?: any[]
    }
  }
}
export interface PrivacyResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}