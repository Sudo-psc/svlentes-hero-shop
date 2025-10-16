// Unit tests for Behavior Service

import { BehaviorService } from '../behavior-service'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
    },
    userBehavior: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock ML Service
jest.mock('../ml-service', () => ({
  mlService: {
    calculateFatigueScore: jest.fn().mockResolvedValue(30),
  },
}))

describe('BehaviorService', () => {
  let behaviorService: BehaviorService

  beforeEach(() => {
    behaviorService = new BehaviorService()
    jest.clearAllMocks()
  })

  describe('updateUserBehavior', () => {
    it('should calculate and update user behavior metrics', async () => {
      const { prisma } = await import('@/lib/prisma')
      
      const mockNotifications = [
        {
          channel: 'EMAIL',
          sentAt: new Date(),
          interactions: [{ actionType: 'OPENED' }],
        },
        {
          channel: 'EMAIL',
          sentAt: new Date(),
          interactions: [{ actionType: 'CLICKED' }],
        },
        {
          channel: 'EMAIL',
          sentAt: new Date(),
          interactions: [],
        },
      ]

      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications)
      ;(prisma.userBehavior.upsert as jest.Mock).mockResolvedValue({})

      await behaviorService.updateUserBehavior('user-1')

      expect(prisma.userBehavior.upsert).toHaveBeenCalled()
      const callArgs = (prisma.userBehavior.upsert as jest.Mock).mock.calls[0][0]
      
      // Should calculate metrics
      expect(callArgs.create).toBeDefined()
      expect(callArgs.create.emailOpenRate).toBeGreaterThan(0)
      expect(callArgs.create.emailClickRate).toBeGreaterThan(0)
    })
  })

  describe('getUserBehavior', () => {
    it('should return user behavior metrics', async () => {
      const { prisma } = await import('@/lib/prisma')
      
      const mockBehavior = {
        userId: 'user-1',
        emailOpenRate: 0.6,
        emailClickRate: 0.3,
        whatsappOpenRate: 0.7,
        whatsappClickRate: 0.4,
        smsOpenRate: 0.5,
        smsClickRate: 0.2,
        pushOpenRate: 0.8,
        pushClickRate: 0.5,
        bestHourOfDay: 14,
        averageResponseTime: 45,
        preferredFrequency: 3,
        currentFatigueScore: 25,
        conversionRate: 0.15,
      }

      ;(prisma.userBehavior.findUnique as jest.Mock).mockResolvedValue(mockBehavior)

      const result = await behaviorService.getUserBehavior('user-1')

      expect(result).toEqual(mockBehavior)
    })

    it('should return null if no behavior data exists', async () => {
      const { prisma } = await import('@/lib/prisma')
      ;(prisma.userBehavior.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await behaviorService.getUserBehavior('user-1')

      expect(result).toBeNull()
    })
  })

  describe('incrementFatigueScore', () => {
    it('should increase fatigue score by 5', async () => {
      const { prisma } = await import('@/lib/prisma')
      
      ;(prisma.userBehavior.findUnique as jest.Mock).mockResolvedValue({
        currentFatigueScore: 40,
      })
      ;(prisma.userBehavior.update as jest.Mock).mockResolvedValue({})

      await behaviorService.incrementFatigueScore('user-1')

      expect(prisma.userBehavior.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { currentFatigueScore: 45 },
      })
    })

    it('should cap fatigue score at 100', async () => {
      const { prisma } = await import('@/lib/prisma')
      
      ;(prisma.userBehavior.findUnique as jest.Mock).mockResolvedValue({
        currentFatigueScore: 98,
      })
      ;(prisma.userBehavior.update as jest.Mock).mockResolvedValue({})

      await behaviorService.incrementFatigueScore('user-1')

      const callArgs = (prisma.userBehavior.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.currentFatigueScore).toBeLessThanOrEqual(100)
    })
  })

  describe('decreaseFatigueScore', () => {
    it('should decrease fatigue score by 10', async () => {
      const { prisma } = await import('@/lib/prisma')
      
      ;(prisma.userBehavior.findUnique as jest.Mock).mockResolvedValue({
        currentFatigueScore: 50,
      })
      ;(prisma.userBehavior.update as jest.Mock).mockResolvedValue({})

      await behaviorService.decreaseFatigueScore('user-1')

      expect(prisma.userBehavior.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { currentFatigueScore: 40 },
      })
    })

    it('should not go below 0', async () => {
      const { prisma } = await import('@/lib/prisma')
      
      ;(prisma.userBehavior.findUnique as jest.Mock).mockResolvedValue({
        currentFatigueScore: 5,
      })
      ;(prisma.userBehavior.update as jest.Mock).mockResolvedValue({})

      await behaviorService.decreaseFatigueScore('user-1')

      const callArgs = (prisma.userBehavior.update as jest.Mock).mock.calls[0][0]
      expect(callArgs.data.currentFatigueScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('RF-008 compliance: Frequency adjustment', () => {
    it('should adjust frequency based on engagement levels', async () => {
      const { prisma } = await import('@/lib/prisma')
      
      // Mock high engagement notifications - multiple per day with good engagement
      const mockNotifications = Array(20)
        .fill(null)
        .map((_, i) => ({
          channel: 'EMAIL',
          sentAt: new Date(Date.now() - Math.floor(i / 5) * 24 * 60 * 60 * 1000), // 5 per day
          interactions: [{ actionType: 'OPENED' }], // All have engagement
        }))

      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications)
      ;(prisma.userBehavior.upsert as jest.Mock).mockResolvedValue({})

      await behaviorService.updateUserBehavior('user-1')

      const callArgs = (prisma.userBehavior.upsert as jest.Mock).mock.calls[0][0]
      
      // Should calculate preferred frequency (1, 3, or 5)
      expect([1, 3, 5]).toContain(callArgs.create.preferredFrequency)
    })
  })
})
