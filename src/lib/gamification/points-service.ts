/**
 * Points Service
 *
 * Manages point transactions, earning, spending, and balance tracking
 */

import { prisma } from '@/lib/prisma'
import { type PointTransactionType, type GamificationProfile, type PointTransaction } from '@prisma/client'

export interface AwardPointsParams {
  userId: string
  amount: number
  reason: string
  description?: string
  type?: PointTransactionType
  metadata?: Record<string, any>
  achievementId?: string
  missionId?: string
  expiresInDays?: number
}

export interface SpendPointsParams {
  userId: string
  amount: number
  reason: string
  description?: string
  rewardClaimId?: string
  metadata?: Record<string, any>
}

export interface PointsServiceResult {
  success: boolean
  transaction?: PointTransaction
  profile?: GamificationProfile
  error?: string
}

/**
 * Get or create gamification profile for user
 */
export async function getOrCreateProfile(userId: string): Promise<GamificationProfile> {
  let profile = await prisma.gamificationProfile.findUnique({
    where: { userId }
  })

  if (!profile) {
    profile = await prisma.gamificationProfile.create({
      data: {
        userId,
        totalPoints: 0,
        availablePoints: 0,
        currentLevel: 1,
        experiencePoints: 0,
        experienceToNextLevel: 100,
        monthlyPoints: 0,
        weeklyPoints: 0,
        dailyPoints: 0,
        loginStreakDays: 0,
        longestLoginStreak: 0,
        totalAchievements: 0,
        totalMissionsCompleted: 0,
        totalRewardsClaimed: 0,
        totalPointsEarned: 0,
        totalPointsSpent: 0,
      }
    })
  }

  return profile
}

/**
 * Award points to user
 */
export async function awardPoints(params: AwardPointsParams): Promise<PointsServiceResult> {
  const {
    userId,
    amount,
    reason,
    description,
    type = 'EARNED',
    metadata = {},
    achievementId,
    missionId,
    expiresInDays
  } = params

  if (amount <= 0) {
    return { success: false, error: 'Amount must be positive' }
  }

  try {
    // Get or create profile
    const profile = await getOrCreateProfile(userId)

    // Calculate expiration date if specified
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    // Calculate new balance
    const newBalance = profile.availablePoints + amount

    // Create transaction and update profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create point transaction
      const transaction = await tx.pointTransaction.create({
        data: {
          userId,
          profileId: profile.id,
          type,
          amount,
          balance: newBalance,
          reason,
          description,
          metadata,
          achievementId,
          missionId,
          expiresAt,
        }
      })

      // Update profile
      const updatedProfile = await tx.gamificationProfile.update({
        where: { id: profile.id },
        data: {
          totalPoints: { increment: amount },
          availablePoints: { increment: amount },
          totalPointsEarned: { increment: amount },
          // Update time-based counters
          dailyPoints: { increment: amount },
          weeklyPoints: { increment: amount },
          monthlyPoints: { increment: amount },
          lastActivityAt: new Date(),
        }
      })

      return { transaction, profile: updatedProfile }
    })

    // Create gamification event for analytics
    await createGamificationEvent({
      userId,
      eventType: 'points_earned',
      eventData: {
        amount,
        reason,
        balance: newBalance,
        transactionId: result.transaction.id,
      }
    })

    return {
      success: true,
      transaction: result.transaction,
      profile: result.profile
    }
  } catch (error) {
    console.error('[PointsService] Error awarding points:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to award points'
    }
  }
}

/**
 * Spend points (redeem rewards)
 */
export async function spendPoints(params: SpendPointsParams): Promise<PointsServiceResult> {
  const {
    userId,
    amount,
    reason,
    description,
    rewardClaimId,
    metadata = {}
  } = params

  if (amount <= 0) {
    return { success: false, error: 'Amount must be positive' }
  }

  try {
    const profile = await getOrCreateProfile(userId)

    // Check if user has enough points
    if (profile.availablePoints < amount) {
      return {
        success: false,
        error: `Insufficient points. Available: ${profile.availablePoints}, Required: ${amount}`
      }
    }

    // Calculate new balance
    const newBalance = profile.availablePoints - amount

    // Create transaction and update profile
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.pointTransaction.create({
        data: {
          userId,
          profileId: profile.id,
          type: 'SPENT',
          amount: -amount, // Negative for spending
          balance: newBalance,
          reason,
          description,
          metadata,
          rewardClaimId,
        }
      })

      const updatedProfile = await tx.gamificationProfile.update({
        where: { id: profile.id },
        data: {
          availablePoints: { decrement: amount },
          totalPointsSpent: { increment: amount },
          lastActivityAt: new Date(),
        }
      })

      return { transaction, profile: updatedProfile }
    })

    // Create gamification event
    await createGamificationEvent({
      userId,
      eventType: 'points_spent',
      eventData: {
        amount,
        reason,
        balance: newBalance,
        transactionId: result.transaction.id,
      }
    })

    return {
      success: true,
      transaction: result.transaction,
      profile: result.profile
    }
  } catch (error) {
    console.error('[PointsService] Error spending points:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to spend points'
    }
  }
}

/**
 * Get point transaction history
 */
export async function getPointHistory(
  userId: string,
  options: {
    limit?: number
    offset?: number
    type?: PointTransactionType
  } = {}
) {
  const { limit = 50, offset = 0, type } = options

  const transactions = await prisma.pointTransaction.findMany({
    where: {
      userId,
      ...(type && { type })
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      achievement: true,
      mission: true,
      rewardClaim: {
        include: {
          reward: true
        }
      }
    }
  })

  const total = await prisma.pointTransaction.count({
    where: {
      userId,
      ...(type && { type })
    }
  })

  return {
    transactions,
    total,
    hasMore: total > offset + limit
  }
}

/**
 * Get points summary
 */
export async function getPointsSummary(userId: string) {
  const profile = await getOrCreateProfile(userId)

  const [
    totalEarned,
    totalSpent,
    expiringPoints
  ] = await Promise.all([
    prisma.pointTransaction.aggregate({
      where: {
        userId,
        type: 'EARNED'
      },
      _sum: { amount: true }
    }),
    prisma.pointTransaction.aggregate({
      where: {
        userId,
        type: 'SPENT'
      },
      _sum: { amount: true }
    }),
    prisma.pointTransaction.findMany({
      where: {
        userId,
        type: 'EARNED',
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      },
      orderBy: { expiresAt: 'asc' }
    })
  ])

  return {
    availablePoints: profile.availablePoints,
    totalPoints: profile.totalPoints,
    totalEarned: totalEarned._sum.amount || 0,
    totalSpent: Math.abs(totalSpent._sum.amount || 0),
    expiringPoints: expiringPoints.reduce((sum, t) => sum + t.amount, 0),
    expiringTransactions: expiringPoints,
    dailyPoints: profile.dailyPoints,
    weeklyPoints: profile.weeklyPoints,
    monthlyPoints: profile.monthlyPoints,
  }
}

/**
 * Apply level-based and streak-based multipliers
 */
export function calculatePointsWithMultipliers(
  basePoints: number,
  level: number,
  streakDays: number
): number {
  const levelMultiplier = getLevelMultiplier(level)
  const streakMultiplier = getStreakMultiplier(streakDays)
  return Math.floor(basePoints * levelMultiplier * streakMultiplier)
}

/**
 * Get level-based multiplier
 */
function getLevelMultiplier(level: number): number {
  if (level < 6) return 1.0
  if (level < 11) return 1.1
  if (level < 21) return 1.2
  if (level < 31) return 1.3
  if (level < 51) return 1.5
  return 1.75
}

/**
 * Get streak-based multiplier
 */
function getStreakMultiplier(streakDays: number): number {
  if (streakDays < 3) return 1.0
  if (streakDays < 7) return 1.1
  if (streakDays < 14) return 1.2
  if (streakDays < 30) return 1.3
  if (streakDays < 60) return 1.5
  return 2.0
}

/**
 * Reset time-based point counters (run via cron)
 */
export async function resetTimeBasedCounters(period: 'daily' | 'weekly' | 'monthly') {
  const updateData = period === 'daily'
    ? { dailyPoints: 0 }
    : period === 'weekly'
    ? { weeklyPoints: 0, dailyPoints: 0 }
    : { monthlyPoints: 0, weeklyPoints: 0, dailyPoints: 0 }

  const result = await prisma.gamificationProfile.updateMany({
    data: updateData
  })

  console.log(`[PointsService] Reset ${period} counters for ${result.count} users`)
  return result
}

/**
 * Expire old points (run via cron)
 */
export async function expirePoints() {
  const expiredTransactions = await prisma.pointTransaction.findMany({
    where: {
      expiresAt: { lt: new Date() },
      type: 'EARNED',
    },
    include: {
      profile: true
    }
  })

  for (const transaction of expiredTransactions) {
    await prisma.$transaction([
      // Mark transaction as expired
      prisma.pointTransaction.update({
        where: { id: transaction.id },
        data: {
          metadata: {
            ...((transaction.metadata as Record<string, any>) || {}),
            expired_at: new Date().toISOString()
          }
        }
      }),
      // Deduct from available points
      prisma.gamificationProfile.update({
        where: { id: transaction.profileId },
        data: {
          availablePoints: {
            decrement: transaction.amount
          }
        }
      })
    ])

    // Create expiration event
    await createGamificationEvent({
      userId: transaction.userId,
      eventType: 'points_expired',
      eventData: {
        amount: transaction.amount,
        transactionId: transaction.id,
        expiresAt: transaction.expiresAt,
      }
    })
  }

  console.log(`[PointsService] Expired ${expiredTransactions.length} point transactions`)
  return expiredTransactions.length
}

/**
 * Create gamification event for analytics
 */
async function createGamificationEvent(params: {
  userId: string
  eventType: string
  eventData: Record<string, any>
  source?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await prisma.gamificationEvent.create({
      data: params
    })
  } catch (error) {
    console.error('[PointsService] Error creating gamification event:', error)
  }
}
