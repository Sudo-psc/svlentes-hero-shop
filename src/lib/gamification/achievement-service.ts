/**
 * Achievement Service
 *
 * Manages badges, achievements, and unlock logic
 */

import { prisma } from '@/lib/prisma'
import { type Achievement, type UserAchievement, type AchievementCategory, type AchievementRarity } from '@prisma/client'
import { getOrCreateProfile, awardPoints } from './points-service'
import { awardXP } from './level-service'

export interface UnlockAchievementResult {
  success: boolean
  achievement?: Achievement
  userAchievement?: UserAchievement
  pointsAwarded?: number
  xpAwarded?: number
  error?: string
}

export interface AchievementProgress {
  achievement: Achievement
  userAchievement: UserAchievement | null
  progress: number
  maxProgress: number
  progressPercent: number
  isUnlocked: boolean
  isVisible: boolean
}

export interface AchievementRequirement {
  type: string
  value: number
  description: string
}

/**
 * Get all achievements for user with progress
 */
export async function getUserAchievements(userId: string): Promise<AchievementProgress[]> {
  const profile = await getOrCreateProfile(userId)

  // Get all active achievements
  const achievements = await prisma.achievement.findMany({
    where: { isActive: true },
    orderBy: [
      { category: 'asc' },
      { rarity: 'asc' },
      { sortOrder: 'asc' }
    ]
  })

  // Get user's achievement progress
  const userAchievements = await prisma.userAchievement.findMany({
    where: {
      userId,
      achievementId: { in: achievements.map(a => a.id) }
    }
  })

  const userAchievementMap = new Map(
    userAchievements.map(ua => [ua.achievementId, ua])
  )

  return achievements.map(achievement => {
    const userAchievement = userAchievementMap.get(achievement.id) || null
    const progress = userAchievement?.progress || 0
    const maxProgress = achievement.maxProgress
    const progressPercent = Math.floor((progress / maxProgress) * 100)
    const isUnlocked = userAchievement?.isCompleted || false
    const isVisible = !achievement.isSecret || isUnlocked

    return {
      achievement,
      userAchievement,
      progress,
      maxProgress,
      progressPercent,
      isUnlocked,
      isVisible
    }
  })
}

/**
 * Get achievements by category
 */
export async function getAchievementsByCategory(
  userId: string,
  category: AchievementCategory
): Promise<AchievementProgress[]> {
  const allAchievements = await getUserAchievements(userId)
  return allAchievements.filter(a => a.achievement.category === category)
}

/**
 * Get achievements by rarity
 */
export async function getAchievementsByRarity(
  userId: string,
  rarity: AchievementRarity
): Promise<AchievementProgress[]> {
  const allAchievements = await getUserAchievements(userId)
  return allAchievements.filter(a => a.achievement.rarity === rarity)
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  userId: string,
  achievementSlug: string,
  progress: number
): Promise<UnlockAchievementResult> {
  try {
    const profile = await getOrCreateProfile(userId)

    // Get achievement
    const achievement = await prisma.achievement.findUnique({
      where: { slug: achievementSlug }
    })

    if (!achievement) {
      return { success: false, error: `Achievement not found: ${achievementSlug}` }
    }

    // Get or create user achievement
    let userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id
        }
      }
    })

    if (!userAchievement) {
      userAchievement = await prisma.userAchievement.create({
        data: {
          userId,
          profileId: profile.id,
          achievementId: achievement.id,
          progress: 0,
          isCompleted: false
        }
      })
    }

    // Check if already completed
    if (userAchievement.isCompleted) {
      return {
        success: true,
        achievement,
        userAchievement,
        pointsAwarded: 0,
        xpAwarded: 0
      }
    }

    // Update progress
    const newProgress = Math.min(progress, achievement.maxProgress)
    const isNowComplete = newProgress >= achievement.maxProgress

    userAchievement = await prisma.userAchievement.update({
      where: { id: userAchievement.id },
      data: {
        progress: newProgress,
        isCompleted: isNowComplete,
        ...(isNowComplete && { completedAt: new Date() }),
        lastProgressAt: new Date()
      }
    })

    // If just completed, award points and XP
    if (isNowComplete) {
      await unlockAchievement(userId, achievement.id)
    }

    return {
      success: true,
      achievement,
      userAchievement,
      pointsAwarded: isNowComplete ? achievement.pointsAwarded : 0,
      xpAwarded: isNowComplete ? achievement.experienceAwarded : 0
    }
  } catch (error) {
    console.error('[AchievementService] Error updating progress:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress'
    }
  }
}

/**
 * Unlock achievement (called when progress reaches 100%)
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string
): Promise<UnlockAchievementResult> {
  try {
    const profile = await getOrCreateProfile(userId)

    // Get achievement
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId }
    })

    if (!achievement) {
      return { success: false, error: 'Achievement not found' }
    }

    // Check if already unlocked
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId
        }
      }
    })

    if (existing?.isCompleted) {
      return { success: true, achievement, userAchievement: existing }
    }

    // Mark as completed in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user achievement
      const userAchievement = await tx.userAchievement.update({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          progress: achievement.maxProgress
        }
      })

      // Update profile total achievements count
      await tx.gamificationProfile.update({
        where: { id: profile.id },
        data: {
          totalAchievements: { increment: 1 }
        }
      })

      return { userAchievement }
    })

    // Award points
    if (achievement.pointsAwarded > 0) {
      await awardPoints({
        userId,
        amount: achievement.pointsAwarded,
        reason: `Achievement unlocked: ${achievement.name}`,
        description: achievement.description,
        type: 'EARNED',
        achievementId,
        metadata: {
          achievementSlug: achievement.slug,
          achievementRarity: achievement.rarity
        }
      })
    }

    // Award XP
    if (achievement.experienceAwarded > 0) {
      await awardXP(
        userId,
        achievement.experienceAwarded,
        `Achievement unlocked: ${achievement.name}`,
        {
          achievementId,
          achievementSlug: achievement.slug
        }
      )
    }

    // Create gamification event
    await prisma.gamificationEvent.create({
      data: {
        userId,
        eventType: 'achievement_unlocked',
        eventData: {
          achievementId,
          achievementSlug: achievement.slug,
          achievementName: achievement.name,
          rarity: achievement.rarity,
          category: achievement.category,
          pointsAwarded: achievement.pointsAwarded,
          xpAwarded: achievement.experienceAwarded
        }
      }
    })

    return {
      success: true,
      achievement,
      userAchievement: result.userAchievement,
      pointsAwarded: achievement.pointsAwarded,
      xpAwarded: achievement.experienceAwarded
    }
  } catch (error) {
    console.error('[AchievementService] Error unlocking achievement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unlock achievement'
    }
  }
}

/**
 * Check and update achievements based on user action
 */
export async function checkAchievementsForAction(
  userId: string,
  actionType: string,
  actionData: Record<string, any> = {}
) {
  // Get relevant achievements for this action type
  const achievements = await prisma.achievement.findMany({
    where: {
      isActive: true,
      requirements: {
        path: '$[*].type',
        array_contains: actionType
      }
    }
  })

  const results = []

  for (const achievement of achievements) {
    const requirements = achievement.requirements as AchievementRequirement[]
    const requirement = requirements.find(r => r.type === actionType)

    if (!requirement) continue

    // Calculate progress based on action
    const progress = await calculateAchievementProgress(
      userId,
      achievement,
      actionType,
      actionData
    )

    const result = await updateAchievementProgress(
      userId,
      achievement.slug,
      progress
    )

    results.push(result)
  }

  return results
}

/**
 * Calculate progress for an achievement
 */
async function calculateAchievementProgress(
  userId: string,
  achievement: Achievement,
  actionType: string,
  actionData: Record<string, any>
): Promise<number> {
  const requirements = achievement.requirements as AchievementRequirement[]
  const requirement = requirements.find(r => r.type === actionType)

  if (!requirement) return 0

  // Different calculation methods based on action type
  switch (actionType) {
    case 'subscription_count':
      return await prisma.subscription.count({
        where: { userId, status: 'ACTIVE' }
      })

    case 'login_streak':
      const profile = await getOrCreateProfile(userId)
      return profile.loginStreakDays

    case 'total_points':
      const pointsProfile = await getOrCreateProfile(userId)
      return pointsProfile.totalPoints

    case 'level':
      const levelProfile = await getOrCreateProfile(userId)
      return levelProfile.currentLevel

    case 'payments_on_time':
      return await prisma.payment.count({
        where: {
          userId,
          status: 'CONFIRMED',
          paymentDate: { lte: prisma.payment.fields.dueDate }
        }
      })

    case 'referrals':
      // Count successful referrals (implement referral tracking separately)
      return actionData.referralCount || 0

    case 'achievements_unlocked':
      return await prisma.userAchievement.count({
        where: { userId, isCompleted: true }
      })

    case 'missions_completed':
      return await prisma.userMission.count({
        where: { userId, isCompleted: true }
      })

    default:
      return 0
  }
}

/**
 * Get achievement statistics
 */
export async function getAchievementStats(userId: string) {
  const profile = await getOrCreateProfile(userId)
  const achievements = await getUserAchievements(userId)

  const unlocked = achievements.filter(a => a.isUnlocked).length
  const total = achievements.length

  const byRarity = {
    common: achievements.filter(a => a.achievement.rarity === 'COMMON' && a.isUnlocked).length,
    rare: achievements.filter(a => a.achievement.rarity === 'RARE' && a.isUnlocked).length,
    epic: achievements.filter(a => a.achievement.rarity === 'EPIC' && a.isUnlocked).length,
    legendary: achievements.filter(a => a.achievement.rarity === 'LEGENDARY' && a.isUnlocked).length
  }

  const byCategory = {
    subscription: achievements.filter(a => a.achievement.category === 'SUBSCRIPTION' && a.isUnlocked).length,
    engagement: achievements.filter(a => a.achievement.category === 'ENGAGEMENT' && a.isUnlocked).length,
    loyalty: achievements.filter(a => a.achievement.category === 'LOYALTY' && a.isUnlocked).length,
    milestone: achievements.filter(a => a.achievement.category === 'MILESTONE' && a.isUnlocked).length,
    special: achievements.filter(a => a.achievement.category === 'SPECIAL' && a.isUnlocked).length,
    referral: achievements.filter(a => a.achievement.category === 'REFERRAL' && a.isUnlocked).length,
    health: achievements.filter(a => a.achievement.category === 'HEALTH' && a.isUnlocked).length
  }

  const inProgress = achievements.filter(a => !a.isUnlocked && a.progress > 0).length
  const completionPercent = Math.floor((unlocked / total) * 100)

  // Find rarest achievement
  const rarestUnlocked = achievements
    .filter(a => a.isUnlocked)
    .sort((a, b) => {
      const rarityOrder = { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 }
      return rarityOrder[b.achievement.rarity] - rarityOrder[a.achievement.rarity]
    })[0]

  return {
    totalUnlocked: unlocked,
    totalAvailable: total,
    completionPercent,
    byRarity,
    byCategory,
    inProgress,
    rarestAchievement: rarestUnlocked?.achievement || null
  }
}

/**
 * Get recent achievement unlocks (for feed/timeline)
 */
export async function getRecentUnlocks(userId: string, limit: number = 10) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: {
      userId,
      isCompleted: true
    },
    orderBy: { completedAt: 'desc' },
    take: limit,
    include: {
      achievement: true
    }
  })

  return userAchievements.map(ua => ({
    achievement: ua.achievement,
    unlockedAt: ua.completedAt,
    pointsEarned: ua.achievement.pointsAwarded,
    xpEarned: ua.achievement.experienceAwarded
  }))
}

/**
 * Get suggested next achievements (closest to completion)
 */
export async function getSuggestedAchievements(userId: string, limit: number = 5) {
  const achievements = await getUserAchievements(userId)

  return achievements
    .filter(a => !a.isUnlocked && a.progress > 0 && a.isVisible)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, limit)
}
