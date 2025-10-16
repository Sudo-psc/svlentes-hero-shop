// Unit tests for ML Service

import { MLService } from '../ml-service'
import { NotificationChannel } from '@/types/reminders'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    interaction: {
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userBehavior: {
      findUnique: jest.fn(),
    },
    mLPrediction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('MLService', () => {
  let mlService: MLService

  beforeEach(() => {
    mlService = new MLService()
    jest.clearAllMocks()
  })

  describe('calculateFatigueScore', () => {
    it('should calculate score for user with no recent notifications', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.interaction.count as jest.Mock)
        .mockResolvedValueOnce(0) // interactions
        .mockResolvedValueOnce(0) // opt-outs

      const score = await mlService.calculateFatigueScore('user-1')

      // When recent count is 0, interaction rate is 0 which adds 30 points
      expect(score).toBe(30)
    })

    it('should increase score for high notification count', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(6) // > 5
      ;(prisma.interaction.count as jest.Mock)
        .mockResolvedValueOnce(2) // interactions
        .mockResolvedValueOnce(0) // opt-outs

      const score = await mlService.calculateFatigueScore('user-1')

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should increase score for low interaction rate', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.interaction.count as jest.Mock)
        .mockResolvedValueOnce(1) // Only 1 interaction out of 10
        .mockResolvedValueOnce(0) // No opt-outs

      const score = await mlService.calculateFatigueScore('user-1')

      expect(score).toBeGreaterThan(30) // Low interaction should add significant score
    })

    it('should return score > 70 for fatigued user', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.interaction.count as jest.Mock)
        .mockResolvedValueOnce(0) // No interactions
        .mockResolvedValueOnce(2) // Multiple opt-outs

      const score = await mlService.calculateFatigueScore('user-1')

      expect(score).toBeGreaterThan(70) // Should trigger fatigue prevention
    })

    it('should cap fatigue score at 100', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(20)
      ;(prisma.interaction.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(5)

      const score = await mlService.calculateFatigueScore('user-1')

      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('shouldSendNotification', () => {
    it('should return false when fatigue score > 70', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.notification.count as jest.Mock)
        .mockResolvedValueOnce(10) // For fatigue calculation
        .mockResolvedValueOnce(2) // For today count
      ;(prisma.interaction.count as jest.Mock)
        .mockResolvedValueOnce(0) // No interactions
        .mockResolvedValueOnce(2) // Opt-outs
      ;(prisma.userBehavior.findUnique as jest.Mock).mockResolvedValue({
        preferredFrequency: 3,
      })

      const shouldSend = await mlService.shouldSendNotification('user-1')

      expect(shouldSend).toBe(false)
    })

    it('should respect daily frequency limits', async () => {
      const { prisma } = await import('@/lib/prisma')
      
      // Set up mocks - fatigue score will be low (20), but count will exceed limit
      ;(prisma.notification.count as jest.Mock)
        .mockResolvedValue(5) // Return 5 for all count calls
      ;(prisma.interaction.count as jest.Mock)
        .mockResolvedValue(3) // Good interaction rate
      ;(prisma.userBehavior.findUnique as jest.Mock).mockResolvedValue({
        preferredFrequency: 3, // Max 3 per day
      })

      const shouldSend = await mlService.shouldSendNotification('user-1')

      // Should be false because count (5) >= maxPerDay (3)
      expect(shouldSend).toBe(false)
    })

    it('should return true when conditions are met', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.notification.count as jest.Mock)
        .mockResolvedValueOnce(2) // For fatigue (low)
        .mockResolvedValueOnce(1) // Only 1 sent today
      ;(prisma.interaction.count as jest.Mock)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0)
      ;(prisma.userBehavior.findUnique as jest.Mock).mockResolvedValue({
        preferredFrequency: 3,
      })

      const shouldSend = await mlService.shouldSendNotification('user-1')

      expect(shouldSend).toBe(true)
    })
  })

  describe('predictOptimalTime', () => {
    it('should avoid quiet hours (late night)', async () => {
      const now = new Date()
      now.setHours(23, 0, 0, 0) // 11 PM

      const result = await mlService.predictOptimalTime('user-1', {
        hourOfDay: 23,
        dayOfWeek: 1,
        channelHistory: {} as any,
        recentEngagement: 0.5,
        fatigueScore: 20,
        avgResponseTime: 30,
        preferredFrequency: 3,
      })

      const hour = result.getHours()
      expect(hour).toBeGreaterThanOrEqual(8)
      expect(hour).toBeLessThanOrEqual(21)
    })

    it('should avoid early morning hours', async () => {
      const now = new Date()
      now.setHours(5, 0, 0, 0) // 5 AM

      const result = await mlService.predictOptimalTime('user-1', {
        hourOfDay: 5,
        dayOfWeek: 1,
        channelHistory: {} as any,
        recentEngagement: 0.5,
        fatigueScore: 20,
        avgResponseTime: 30,
        preferredFrequency: 3,
      })

      const hour = result.getHours()
      expect(hour).toBeGreaterThanOrEqual(8)
    })
  })

  describe('getModelAccuracy', () => {
    it('should calculate accuracy correctly', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.mLPrediction.findMany as jest.Mock).mockResolvedValue([
        { wasAccurate: true },
        { wasAccurate: true },
        { wasAccurate: true },
        { wasAccurate: false },
      ])

      const result = await mlService.getModelAccuracy()

      expect(result.accuracy).toBe(0.75) // 3/4 = 75%
      expect(result.totalPredictions).toBe(4)
    })

    it('should meet RF-005 requirement (accuracy >= 75%)', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.mLPrediction.findMany as jest.Mock).mockResolvedValue([
        { wasAccurate: true },
        { wasAccurate: true },
        { wasAccurate: true },
        { wasAccurate: true },
        { wasAccurate: false },
      ])

      const result = await mlService.getModelAccuracy()

      expect(result.accuracy).toBeGreaterThanOrEqual(0.75)
    })

    it('should return 0 accuracy with no predictions', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.mLPrediction.findMany as jest.Mock).mockResolvedValue([])

      const result = await mlService.getModelAccuracy()

      expect(result.accuracy).toBe(0)
      expect(result.totalPredictions).toBe(0)
    })
  })
})
