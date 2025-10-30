/**
 * Reward Service
 *
 * Manages rewards catalog, claiming, and redemption
 */

import { prisma } from '@/lib/prisma'
import { type Reward, type RewardClaim, type RewardCategory, type RewardStatus } from '@prisma/client'
import { getOrCreateProfile, spendPoints } from './points-service'

export interface RewardWithEligibility {
  reward: Reward
  isEligible: boolean
  reason?: string
  userCanAfford: boolean
  meetsLevelRequirement: boolean
  isAvailable: boolean
  timeRemaining: number | null // milliseconds
}

export interface ClaimRewardResult {
  success: boolean
  rewardClaim?: RewardClaim
  redemptionCode?: string
  error?: string
}

export interface RedeemRewardResult {
  success: boolean
  rewardClaim?: RewardClaim
  error?: string
}

/**
 * Get all available rewards
 */
export async function getAvailableRewards(userId: string): Promise<RewardWithEligibility[]> {
  const profile = await getOrCreateProfile(userId)
  const now = new Date()

  // Get all active rewards
  const rewards = await prisma.reward.findMany({
    where: {
      isAvailable: true,
      OR: [
        { availableFrom: null },
        { availableFrom: { lte: now } }
      ],
      OR: [
        { availableUntil: null },
        { availableUntil: { gte: now } }
      ]
    },
    orderBy: [
      { category: 'asc' },
      { pointsCost: 'asc' },
      { sortOrder: 'asc' }
    ]
  })

  // Get user's reward claims
  const userClaims = await prisma.rewardClaim.findMany({
    where: {
      userId,
      rewardId: { in: rewards.map(r => r.id) }
    }
  })

  const claimCountMap = new Map<string, number>()
  for (const claim of userClaims) {
    claimCountMap.set(
      claim.rewardId,
      (claimCountMap.get(claim.rewardId) || 0) + 1
    )
  }

  return rewards.map(reward => {
    const userCanAfford = profile.availablePoints >= reward.pointsCost
    const meetsLevelRequirement = !reward.requiredLevel || profile.currentLevel >= reward.requiredLevel

    // Check claim limits
    const claimCount = claimCountMap.get(reward.id) || 0
    const hasReachedClaimLimit = reward.maxClaimsPerUser
      ? claimCount >= reward.maxClaimsPerUser
      : false

    // Check stock availability
    const hasStock = !reward.isLimited || (reward.remainingQuantity && reward.remainingQuantity > 0)

    const isEligible = userCanAfford && meetsLevelRequirement && !hasReachedClaimLimit && hasStock

    // Determine reason if not eligible
    let reason: string | undefined
    if (!userCanAfford) {
      reason = `Você precisa de ${reward.pointsCost - profile.availablePoints} pontos a mais`
    } else if (!meetsLevelRequirement) {
      reason = `Nível ${reward.requiredLevel} necessário`
    } else if (hasReachedClaimLimit) {
      reason = 'Limite de resgates atingido'
    } else if (!hasStock) {
      reason = 'Esgotado'
    }

    // Calculate time remaining
    let timeRemaining: number | null = null
    if (reward.availableUntil) {
      timeRemaining = Math.max(0, reward.availableUntil.getTime() - Date.now())
    }

    return {
      reward,
      isEligible,
      reason,
      userCanAfford,
      meetsLevelRequirement,
      isAvailable: hasStock,
      timeRemaining
    }
  })
}

/**
 * Get rewards by category
 */
export async function getRewardsByCategory(
  userId: string,
  category: RewardCategory
): Promise<RewardWithEligibility[]> {
  const allRewards = await getAvailableRewards(userId)
  return allRewards.filter(r => r.reward.category === category)
}

/**
 * Get user's reward claims
 */
export async function getUserRewardClaims(
  userId: string,
  options: {
    limit?: number
    offset?: number
    status?: RewardStatus
  } = {}
) {
  const { limit = 50, offset = 0, status } = options

  const claims = await prisma.rewardClaim.findMany({
    where: {
      userId,
      ...(status && { status })
    },
    orderBy: { claimedAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      reward: true
    }
  })

  const total = await prisma.rewardClaim.count({
    where: {
      userId,
      ...(status && { status })
    }
  })

  return {
    claims,
    total,
    hasMore: total > offset + limit
  }
}

/**
 * Claim a reward (spend points)
 */
export async function claimReward(
  userId: string,
  rewardSlug: string
): Promise<ClaimRewardResult> {
  try {
    const profile = await getOrCreateProfile(userId)

    // Get reward
    const reward = await prisma.reward.findUnique({
      where: { slug: rewardSlug }
    })

    if (!reward) {
      return { success: false, error: `Reward not found: ${rewardSlug}` }
    }

    // Check if reward is available
    if (!reward.isAvailable) {
      return { success: false, error: 'Reward not available' }
    }

    // Check availability window
    const now = new Date()
    if (reward.availableFrom && reward.availableFrom > now) {
      return { success: false, error: 'Reward not yet available' }
    }
    if (reward.availableUntil && reward.availableUntil < now) {
      return { success: false, error: 'Reward no longer available' }
    }

    // Check if user has enough points
    if (profile.availablePoints < reward.pointsCost) {
      return {
        success: false,
        error: `Insufficient points. Need ${reward.pointsCost}, have ${profile.availablePoints}`
      }
    }

    // Check level requirement
    if (reward.requiredLevel && profile.currentLevel < reward.requiredLevel) {
      return {
        success: false,
        error: `Level ${reward.requiredLevel} required`
      }
    }

    // Check claim limit
    if (reward.maxClaimsPerUser) {
      const claimCount = await prisma.rewardClaim.count({
        where: {
          userId,
          rewardId: reward.id
        }
      })

      if (claimCount >= reward.maxClaimsPerUser) {
        return { success: false, error: 'Claim limit reached for this reward' }
      }
    }

    // Check stock
    if (reward.isLimited && (!reward.remainingQuantity || reward.remainingQuantity <= 0)) {
      return { success: false, error: 'Reward out of stock' }
    }

    // Generate redemption code
    const redemptionCode = generateRedemptionCode(reward)

    // Calculate expiration date
    const expiresAt = reward.expirationDays
      ? new Date(Date.now() + reward.expirationDays * 24 * 60 * 60 * 1000)
      : null

    // Claim reward in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create reward claim
      const rewardClaim = await tx.rewardClaim.create({
        data: {
          userId,
          profileId: profile.id,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
          status: 'CLAIMED',
          redemptionCode,
          redemptionDetails: {
            rewardName: reward.name,
            rewardDescription: reward.description,
            claimedAt: new Date().toISOString(),
            discountPercent: reward.discountPercent,
            value: reward.value?.toString()
          },
          claimedAt: new Date(),
          expiresAt
        }
      })

      // Update reward stock
      if (reward.isLimited && reward.remainingQuantity) {
        await tx.reward.update({
          where: { id: reward.id },
          data: {
            remainingQuantity: { decrement: 1 }
          }
        })
      }

      // Update profile reward count
      await tx.gamificationProfile.update({
        where: { id: profile.id },
        data: {
          totalRewardsClaimed: { increment: 1 }
        }
      })

      return rewardClaim
    })

    // Spend points
    await spendPoints({
      userId,
      amount: reward.pointsCost,
      reason: `Reward claimed: ${reward.name}`,
      description: reward.description,
      rewardClaimId: result.id,
      metadata: {
        rewardSlug: reward.slug,
        rewardCategory: reward.category,
        redemptionCode
      }
    })

    // Create event
    await prisma.gamificationEvent.create({
      data: {
        userId,
        eventType: 'reward_claimed',
        eventData: {
          rewardId: reward.id,
          rewardSlug: reward.slug,
          rewardName: reward.name,
          pointsSpent: reward.pointsCost,
          redemptionCode,
          category: reward.category
        }
      }
    })

    return {
      success: true,
      rewardClaim: result,
      redemptionCode
    }
  } catch (error) {
    console.error('[RewardService] Error claiming reward:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to claim reward'
    }
  }
}

/**
 * Redeem a reward (mark as used)
 */
export async function redeemReward(
  rewardClaimId: string,
  fulfillmentNotes?: string
): Promise<RedeemRewardResult> {
  try {
    // Get claim
    const claim = await prisma.rewardClaim.findUnique({
      where: { id: rewardClaimId },
      include: { reward: true }
    })

    if (!claim) {
      return { success: false, error: 'Reward claim not found' }
    }

    // Check if already redeemed
    if (claim.status === 'REDEEMED') {
      return { success: true, rewardClaim: claim }
    }

    // Check if expired
    if (claim.expiresAt && claim.expiresAt < new Date()) {
      await prisma.rewardClaim.update({
        where: { id: claim.id },
        data: { status: 'EXPIRED' }
      })
      return { success: false, error: 'Reward has expired' }
    }

    // Mark as redeemed
    const updatedClaim = await prisma.rewardClaim.update({
      where: { id: claim.id },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date(),
        fulfillmentStatus: 'completed',
        fulfillmentNotes,
        fulfilledAt: new Date()
      }
    })

    // Create event
    await prisma.gamificationEvent.create({
      data: {
        userId: claim.userId,
        eventType: 'reward_redeemed',
        eventData: {
          rewardClaimId: claim.id,
          rewardId: claim.rewardId,
          rewardName: claim.reward.name,
          redemptionCode: claim.redemptionCode
        }
      }
    })

    return { success: true, rewardClaim: updatedClaim }
  } catch (error) {
    console.error('[RewardService] Error redeeming reward:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to redeem reward'
    }
  }
}

/**
 * Validate redemption code
 */
export async function validateRedemptionCode(
  code: string
): Promise<{ valid: boolean; claim?: RewardClaim; error?: string }> {
  const claim = await prisma.rewardClaim.findUnique({
    where: { redemptionCode: code },
    include: { reward: true, user: true }
  })

  if (!claim) {
    return { valid: false, error: 'Invalid redemption code' }
  }

  if (claim.status === 'REDEEMED') {
    return { valid: false, error: 'Code already used' }
  }

  if (claim.status === 'EXPIRED') {
    return { valid: false, error: 'Code has expired' }
  }

  if (claim.expiresAt && claim.expiresAt < new Date()) {
    await prisma.rewardClaim.update({
      where: { id: claim.id },
      data: { status: 'EXPIRED' }
    })
    return { valid: false, error: 'Code has expired' }
  }

  return { valid: true, claim }
}

/**
 * Get reward statistics
 */
export async function getRewardStats(userId: string) {
  const profile = await getOrCreateProfile(userId)
  const claims = await getUserRewardClaims(userId)

  const totalClaimed = claims.total
  const totalSpent = claims.claims.reduce((sum, c) => sum + c.pointsSpent, 0)

  const byCategory = {
    discount: claims.claims.filter(c => c.reward.category === 'DISCOUNT').length,
    freebie: claims.claims.filter(c => c.reward.category === 'FREEBIE').length,
    upgrade: claims.claims.filter(c => c.reward.category === 'UPGRADE').length,
    experience: claims.claims.filter(c => c.reward.category === 'EXPERIENCE').length,
    exclusive: claims.claims.filter(c => c.reward.category === 'EXCLUSIVE').length
  }

  const byStatus = {
    claimed: claims.claims.filter(c => c.status === 'CLAIMED').length,
    redeemed: claims.claims.filter(c => c.status === 'REDEEMED').length,
    expired: claims.claims.filter(c => c.status === 'EXPIRED').length
  }

  const activeRewards = claims.claims.filter(
    c => c.status === 'CLAIMED' && (!c.expiresAt || c.expiresAt > new Date())
  )

  return {
    totalClaimed: profile.totalRewardsClaimed,
    totalSpent,
    byCategory,
    byStatus,
    activeRewards: activeRewards.length
  }
}

/**
 * Generate redemption code
 */
function generateRedemptionCode(reward: Reward): string {
  const prefix = reward.category.substring(0, 3).toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Expire old reward claims (run via cron)
 */
export async function expireRewardClaims() {
  const expiredClaims = await prisma.rewardClaim.findMany({
    where: {
      expiresAt: { lt: new Date() },
      status: 'CLAIMED'
    }
  })

  for (const claim of expiredClaims) {
    await prisma.rewardClaim.update({
      where: { id: claim.id },
      data: { status: 'EXPIRED' }
    })

    // Create event
    await prisma.gamificationEvent.create({
      data: {
        userId: claim.userId,
        eventType: 'reward_expired',
        eventData: {
          rewardClaimId: claim.id,
          rewardId: claim.rewardId,
          redemptionCode: claim.redemptionCode,
          expiresAt: claim.expiresAt
        }
      }
    })
  }

  console.log(`[RewardService] Expired ${expiredClaims.length} reward claims`)
  return expiredClaims.length
}

/**
 * Get featured rewards (sorted by popularity, time-limited, or admin selection)
 */
export async function getFeaturedRewards(userId: string, limit: number = 6) {
  const allRewards = await getAvailableRewards(userId)

  // Sort by:
  // 1. Time-limited rewards first
  // 2. Then by eligibility
  // 3. Then by popularity (approximated by claim count)
  return allRewards
    .sort((a, b) => {
      // Time-limited rewards first
      if (a.timeRemaining && !b.timeRemaining) return -1
      if (!a.timeRemaining && b.timeRemaining) return 1

      // Eligible rewards before ineligible
      if (a.isEligible && !b.isEligible) return -1
      if (!a.isEligible && b.isEligible) return 1

      // Lower cost first (more accessible)
      return a.reward.pointsCost - b.reward.pointsCost
    })
    .slice(0, limit)
}
