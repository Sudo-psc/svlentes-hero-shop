/**
 * Delivery Status API Tests - Phase 2
 * Testes de error handling e fallbacks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '../delivery-status/route'

describe('GET /api/assinante/delivery-status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return estimated delivery when no data found', async () => {
    const req = new NextRequest(
      'http://localhost/api/assinante/delivery-status?subscriptionId=123e4567-e89b-12d3-a456-426614174000'
    )

    const response = await GET(req)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.currentDelivery).toBeDefined()
    expect(data.currentDelivery.status).toBe('scheduled')
    expect(data.currentDelivery.progress).toBe(0)
    expect(data.currentDelivery.daysRemaining).toBe(30)
  })

  it('should validate subscriptionId format', async () => {
    const req = new NextRequest(
      'http://localhost/api/assinante/delivery-status?subscriptionId=invalid-id'
    )

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Dados inválidos')
    expect(data.currentDelivery).toBeDefined() // Fallback mesmo em erro
  })

  it('should use circuit breaker after 3 failures', async () => {
    // Simulate 3 failures
    for (let i = 0; i < 3; i++) {
      const req = new NextRequest(
        'http://localhost/api/assinante/delivery-status?subscriptionId=fail-test'
      )
      await GET(req)
    }

    // 4th request should use circuit breaker
    const req = new NextRequest(
      'http://localhost/api/assinante/delivery-status?subscriptionId=123e4567-e89b-12d3-a456-426614174000'
    )
    const response = await GET(req)
    const data = await response.json()

    expect(data.fallback).toBe(true)
    expect(data.reason).toBe('circuit_breaker_open')
  })

  it('should always return valid delivery status (never throw)', async () => {
    const req = new NextRequest(
      'http://localhost/api/assinante/delivery-status?subscriptionId=123e4567-e89b-12d3-a456-426614174000'
    )

    const response = await GET(req)

    expect(response).toBeDefined()
    expect(response.status).toBeLessThan(500) // Never 500 error
  })

  it('should include response time in metadata', async () => {
    const req = new NextRequest(
      'http://localhost/api/assinante/delivery-status?subscriptionId=123e4567-e89b-12d3-a456-426614174000'
    )

    const response = await GET(req)
    const data = await response.json()

    expect(data.metadata.responseTime).toBeDefined()
    expect(typeof data.metadata.responseTime).toBe('number')
  })
})
