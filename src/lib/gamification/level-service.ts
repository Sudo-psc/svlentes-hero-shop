/**
 * Level Service
 *
 * Manages experience points (XP) and level progression
 */

import { prisma } from '@/lib/prisma'
import { type GamificationProfile } from '@prisma/client'
import { getOrCreateProfile } from './points-service'

export interface AwardXPResult {
  success: boolean
  xpAwarded: number
  levelsGained: number
  newLevel: number
  newXP: number
  xpToNextLevel: number
  profile?: GamificationProfile
  error?: string
}

export interface LevelInfo {
  level: number
  xpCurrent: number
  xpToNextLevel: number
  xpTotalForLevel: number
  progressPercent: number
  tierName: string
  tierBenefits: string[]
}

/**
 * Calculate XP required to reach a specific level
 */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1))
}

/**
 * Calculate cumulative XP required to reach level
 */
export function cumulativeXPForLevel(targetLevel: number): number {
  let total = 0
  for (let level = 1; level < targetLevel; level++) {
    total += xpForLevel(level)
  }
  return total
}

/**
 * Calculate level from total XP
 */
export function levelFromXP(totalXP: number): {
  level: number
  currentXP: number
  xpToNextLevel: number
} {
  let level = 1
  let xpRemaining = totalXP

  while (xpRemaining >= xpForLevel(level + 1)) {
    xpRemaining -= xpForLevel(level + 1)
    level++
  }

  return {
    level: level + 1,
    currentXP: xpRemaining,
    xpToNextLevel: xpForLevel(level + 1) - xpRemaining
  }
}

/**
 * Award XP to user and handle level progression
 */
export async function awardXP(
  userId: string,
  xpAmount: number,
  reason: string,
  metadata: Record<string, any> = {}
): Promise<AwardXPResult> {
  if (xpAmount <= 0) {
    return {
      success: false,
      xpAwarded: 0,
      levelsGained: 0,
      newLevel: 0,
      newXP: 0,
      xpToNextLevel: 0,
      error: 'XP amount must be positive'
    }
  }

  try {
    const profile = await getOrCreateProfile(userId)

    const oldLevel = profile.currentLevel
    const oldXP = profile.experiencePoints

    // Calculate new XP and level
    const newTotalXP = oldXP + xpAmount
    const { level: newLevel, currentXP: newXP, xpToNextLevel } = levelFromXP(newTotalXP)

    const levelsGained = newLevel - oldLevel

    // Update profile
    const updatedProfile = await prisma.gamificationProfile.update({
      where: { id: profile.id },
      data: {
        experiencePoints: newTotalXP,
        currentLevel: newLevel,
        experienceToNextLevel: xpToNextLevel,
        lastActivityAt: new Date(),
      }
    })

    // Create event
    await prisma.gamificationEvent.create({
      data: {
        userId,
        eventType: 'xp_earned',
        eventData: {
          xpAwarded: xpAmount,
          reason,
          oldXP,
          newXP: newTotalXP,
          oldLevel,
          newLevel,
          levelsGained,
          ...metadata
        }
      }
    })

    // If level up occurred, create level up event
    if (levelsGained > 0) {
      await prisma.gamificationEvent.create({
        data: {
          userId,
          eventType: 'level_up',
          eventData: {
            oldLevel,
            newLevel,
            levelsGained,
            tierName: getTierName(newLevel),
            unlockedBenefits: getTierBenefits(newLevel)
          }
        }
      })
    }

    return {
      success: true,
      xpAwarded: xpAmount,
      levelsGained,
      newLevel,
      newXP: newTotalXP,
      xpToNextLevel,
      profile: updatedProfile
    }
  } catch (error) {
    console.error('[LevelService] Error awarding XP:', error)
    return {
      success: false,
      xpAwarded: 0,
      levelsGained: 0,
      newLevel: 0,
      newXP: 0,
      xpToNextLevel: 0,
      error: error instanceof Error ? error.message : 'Failed to award XP'
    }
  }
}

/**
 * Get level information for user
 */
export async function getLevelInfo(userId: string): Promise<LevelInfo> {
  const profile = await getOrCreateProfile(userId)

  const xpTotalForLevel = xpForLevel(profile.currentLevel + 1)
  const progressPercent = Math.floor(
    ((xpTotalForLevel - profile.experienceToNextLevel) / xpTotalForLevel) * 100
  )

  return {
    level: profile.currentLevel,
    xpCurrent: profile.experiencePoints,
    xpToNextLevel: profile.experienceToNextLevel,
    xpTotalForLevel,
    progressPercent,
    tierName: getTierName(profile.currentLevel),
    tierBenefits: getTierBenefits(profile.currentLevel)
  }
}

/**
 * Get tier name based on level
 */
export function getTierName(level: number): string {
  if (level <= 5) return 'Novato'
  if (level <= 10) return 'Regular'
  if (level <= 20) return 'Frequente'
  if (level <= 30) return 'Leal'
  if (level <= 50) return 'Campeão'
  return 'Lenda'
}

/**
 * Get tier benefits based on level
 */
export function getTierBenefits(level: number): string[] {
  if (level <= 5) {
    return [
      'Recursos básicos',
      'Recompensas padrão',
      'Suporte por email'
    ]
  }
  if (level <= 10) {
    return [
      '+10% pontos em todas as ações',
      'Acesso a recompensas raras',
      'Badge exclusivo',
      'Suporte prioritário'
    ]
  }
  if (level <= 20) {
    return [
      '+20% pontos em todas as ações',
      'Badges épicos',
      'Suporte via WhatsApp prioritário',
      'Acesso antecipado a novos recursos',
      'Perfil personalizado'
    ]
  }
  if (level <= 30) {
    return [
      '+30% pontos em todas as ações',
      'Recompensas épicas',
      'Avatar customizado',
      'Suporte VIP 24/7',
      'Desconto em renovações',
      'Beta tester de novos recursos'
    ]
  }
  if (level <= 50) {
    return [
      '+50% pontos em todas as ações',
      'Recompensas lendárias',
      'Tema exclusivo da interface',
      'Gerente de conta dedicado',
      'Desconto de 15% permanente',
      'Acesso a eventos exclusivos',
      'Nome destacado no leaderboard'
    ]
  }
  return [
    '+75% pontos em todas as ações',
    'Todas as recompensas desbloqueadas',
    'Interface totalmente personalizada',
    'Atendimento concierge',
    'Desconto de 25% permanente',
    'Eventos VIP presenciais',
    'Badge Lendário exclusivo',
    'Consultas oftalmológicas com desconto',
    'Early access a todos os lançamentos'
  ]
}

/**
 * Get level progress chart data
 */
export async function getLevelProgressChart(userId: string, levels: number = 10) {
  const profile = await getOrCreateProfile(userId)
  const currentLevel = profile.currentLevel

  const chartData = []
  for (let i = Math.max(1, currentLevel - 3); i <= currentLevel + levels; i++) {
    chartData.push({
      level: i,
      xpRequired: xpForLevel(i),
      cumulativeXP: cumulativeXPForLevel(i),
      tierName: getTierName(i),
      isCurrentLevel: i === currentLevel,
      isCompleted: i < currentLevel
    })
  }

  return chartData
}

/**
 * Calculate time to next level based on average daily XP
 */
export async function estimateTimeToNextLevel(userId: string): Promise<{
  daysEstimate: number | null
  averageDailyXP: number
  xpNeeded: number
}> {
  const profile = await getOrCreateProfile(userId)

  // Get XP earned in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentEvents = await prisma.gamificationEvent.findMany({
    where: {
      userId,
      eventType: 'xp_earned',
      createdAt: { gte: thirtyDaysAgo }
    }
  })

  const totalXPLast30Days = recentEvents.reduce((sum, event) => {
    const data = event.eventData as { xpAwarded: number }
    return sum + (data.xpAwarded || 0)
  }, 0)

  const averageDailyXP = totalXPLast30Days / 30

  if (averageDailyXP === 0) {
    return {
      daysEstimate: null,
      averageDailyXP: 0,
      xpNeeded: profile.experienceToNextLevel
    }
  }

  const daysEstimate = Math.ceil(profile.experienceToNextLevel / averageDailyXP)

  return {
    daysEstimate,
    averageDailyXP: Math.round(averageDailyXP),
    xpNeeded: profile.experienceToNextLevel
  }
}

/**
 * Get leaderboard by level
 */
export async function getLevelLeaderboard(options: {
  limit?: number
  minLevel?: number
} = {}) {
  const { limit = 100, minLevel = 1 } = options

  const profiles = await prisma.gamificationProfile.findMany({
    where: {
      currentLevel: { gte: minLevel },
      showOnLeaderboard: true,
      leaderboardOptIn: true
    },
    orderBy: [
      { currentLevel: 'desc' },
      { experiencePoints: 'desc' }
    ],
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          image: true
        }
      }
    }
  })

  return profiles.map((profile, index) => ({
    rank: index + 1,
    userId: profile.userId,
    userName: profile.user.name || 'Usuário Anônimo',
    userAvatar: profile.user.avatarUrl || profile.user.image,
    level: profile.currentLevel,
    experiencePoints: profile.experiencePoints,
    tierName: getTierName(profile.currentLevel),
    totalPoints: profile.totalPoints,
    streakDays: profile.loginStreakDays
  }))
}

/**
 * Get all tier information
 */
export function getAllTiers() {
  const tiers = [
    { name: 'Novato', levelRange: '1-5', color: '#9CA3AF' },
    { name: 'Regular', levelRange: '6-10', color: '#60A5FA' },
    { name: 'Frequente', levelRange: '11-20', color: '#34D399' },
    { name: 'Leal', levelRange: '21-30', color: '#FBBF24' },
    { name: 'Campeão', levelRange: '31-50', color: '#F97316' },
    { name: 'Lenda', levelRange: '51+', color: '#A855F7' }
  ]

  return tiers.map((tier, index) => {
    const minLevel = index === 0 ? 1 : [6, 11, 21, 31, 51][index - 1]
    const maxLevel = index === 5 ? 999 : [5, 10, 20, 30, 50][index]
    return {
      ...tier,
      benefits: getTierBenefits(minLevel),
      pointsMultiplier: getLevelMultiplier(minLevel)
    }
  })
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
