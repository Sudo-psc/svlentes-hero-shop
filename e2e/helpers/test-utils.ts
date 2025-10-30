/**
 * E2E Test Utilities
 * Helper functions for Playwright E2E tests
 */

import { APIRequestContext, Page } from '@playwright/test'

/**
 * Test user credentials and data
 */
export interface TestUser {
  userId: string
  email: string
  password: string
  firebaseUid: string
  authToken: string
}

/**
 * Subscription data for tests
 */
export interface TestSubscription {
  subscriptionId: string
  userId: string
  planId: string
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
}

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  details?: Record<string, string[]>
}

/**
 * Create a test user with Firebase authentication
 */
export async function createTestUser(
  email: string,
  password: string = 'Test123!@#'
): Promise<TestUser> {
  // In a real implementation, this would call Firebase Auth API
  // For tests, we can use a mock or test Firebase project
  const mockFirebaseUid = `firebase_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const mockUserId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`

  // Mock auth token (in real tests, get from Firebase)
  const mockAuthToken = Buffer.from(JSON.stringify({
    uid: mockFirebaseUid,
    email,
    exp: Date.now() + 3600000
  })).toString('base64')

  return {
    userId: mockUserId,
    email,
    password,
    firebaseUid: mockFirebaseUid,
    authToken: mockAuthToken
  }
}

/**
 * Create a subscription for a test user
 */
export async function createSubscription(
  request: APIRequestContext,
  authToken: string,
  planId: string = 'monthly-basic'
): Promise<string> {
  const response = await request.post('/api/assinante/subscription', {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    data: {
      planId,
      shippingAddress: {
        zipCode: '35300-000',
        street: 'Rua Teste',
        number: '100',
        neighborhood: 'Centro',
        city: 'Caratinga',
        state: 'MG'
      }
    }
  })

  if (!response.ok()) {
    throw new Error(`Failed to create subscription: ${response.status()}`)
  }

  const body = await response.json()
  return body.subscriptionId || body.subscription?.id
}

/**
 * Get auth token from test environment or create new user
 */
export async function getAuthToken(
  email?: string,
  password?: string
): Promise<string> {
  // Check if test credentials exist in environment
  const testEmail = email || process.env.TEST_USER_EMAIL || 'test@svlentes.shop'
  const testPassword = password || process.env.TEST_USER_PASSWORD || 'Test123!@#'

  // For now, return a mock token
  // In real implementation, authenticate with Firebase
  return Buffer.from(JSON.stringify({
    email: testEmail,
    uid: 'test_firebase_uid',
    exp: Date.now() + 3600000
  })).toString('base64')
}

/**
 * Get audit logs for a user
 */
export async function getAuditLogs(
  request: APIRequestContext,
  userId: string,
  adminToken?: string
): Promise<any[]> {
  const response = await request.get(`/api/admin/audit?userId=${userId}`, {
    headers: {
      'Authorization': `Bearer ${adminToken || await getAuthToken()}`
    }
  })

  if (!response.ok()) {
    return []
  }

  const body = await response.json()
  return body.logs || body.auditLogs || []
}

/**
 * Generate a fake PDF file as base64 for testing
 */
export function generateBase64PDF(sizeInBytes: number = 1024 * 1024): string {
  // Minimal valid PDF structure
  const pdfHeader = '%PDF-1.4\n'
  const pdfBody = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
  const pdfPages = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
  const pdfPage = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n'
  const pdfXref = 'xref\n0 4\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n'
  const pdfFooter = '%%EOF\n'

  let pdfContent = pdfHeader + pdfBody + pdfPages + pdfPage + pdfXref + pdfFooter

  // Pad to desired size with whitespace
  const padding = ' '.repeat(Math.max(0, sizeInBytes - pdfContent.length))
  pdfContent += padding

  const buffer = Buffer.from(pdfContent.slice(0, sizeInBytes))
  return `data:application/pdf;base64,${buffer.toString('base64')}`
}

/**
 * Generate a fake image file as base64 for testing
 */
export function generateBase64Image(
  sizeInBytes: number = 100 * 1024,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg'
): string {
  // Minimal valid JPEG structure
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])
  const jpegFooter = Buffer.from([0xFF, 0xD9])

  const paddingSize = Math.max(0, sizeInBytes - jpegHeader.length - jpegFooter.length)
  const padding = Buffer.alloc(paddingSize, 0x00)

  const imageBuffer = Buffer.concat([jpegHeader, padding, jpegFooter])
  return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
}

/**
 * Login helper for page tests
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/area-assinante/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
}

/**
 * Get subscription ID from dashboard page
 */
export async function getSubscriptionIdFromPage(page: Page): Promise<string | null> {
  // Extract subscription ID from page URL or data attributes
  const url = page.url()
  const match = url.match(/subscriptionId=([^&]+)/)
  if (match) {
    return match[1]
  }

  // Try to get from data attribute
  const element = await page.locator('[data-subscription-id]').first()
  if (await element.count() > 0) {
    return await element.getAttribute('data-subscription-id')
  }

  return null
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestUser(
  request: APIRequestContext,
  userId: string,
  adminToken: string
): Promise<void> {
  try {
    await request.delete(`/api/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
  } catch (error) {
    console.warn(`Failed to cleanup test user ${userId}:`, error)
  }
}

/**
 * Wait for API response with retry logic
 */
export async function waitForApi<T>(
  request: APIRequestContext,
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    data?: any
    maxRetries?: number
    retryDelay?: number
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    data,
    maxRetries = 3,
    retryDelay = 1000
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await request.fetch(url, {
        method,
        headers,
        data: data ? JSON.stringify(data) : undefined
      })

      if (response.ok()) {
        return await response.json() as T
      }

      lastError = new Error(`API request failed with status ${response.status()}`)
    } catch (error) {
      lastError = error as Error
    }

    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  throw lastError || new Error('API request failed after retries')
}

/**
 * Validate Brazilian CEP format
 */
export function isValidCEP(cep: string): boolean {
  // Remove non-digits
  const digits = cep.replace(/\D/g, '')
  return digits.length === 8
}

/**
 * Validate Brazilian phone format
 */
export function isValidBrazilianPhone(phone: string): boolean {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '')
  // Should be 10 or 11 digits (with or without mobile 9)
  return digits.length === 10 || digits.length === 11
}

/**
 * Format CEP for display
 */
export function formatCEP(cep: string): string {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return cep
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/**
 * Brazilian state codes (UF)
 */
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

/**
 * Validate Brazilian state code
 */
export function isValidBrazilianState(state: string): boolean {
  return BRAZILIAN_STATES.includes(state.toUpperCase())
}

/**
 * Sample valid address for tests
 */
export const VALID_TEST_ADDRESS = {
  zipCode: '35300-000',
  street: 'Rua Teste',
  number: '100',
  complement: 'Apto 101',
  neighborhood: 'Centro',
  city: 'Caratinga',
  state: 'MG'
}

/**
 * Sample valid prescription data
 */
export const VALID_PRESCRIPTION = {
  rightEye: {
    sphere: -2.50,
    cylinder: -0.75,
    axis: 180,
    addition: 0
  },
  leftEye: {
    sphere: -2.25,
    cylinder: -0.50,
    axis: 175,
    addition: 0
  },
  prescribedBy: 'Dr. Philipe Saraiva Cruz',
  crm: 'CRM-MG 69.870',
  prescriptionDate: new Date().toISOString()
}
