/**
 * Mission Service
 *
 * Manages missions/quests, progress tracking, and completion
 */

import { prisma } from '@/lib/prisma'
import { type Mission, type UserMission, type MissionCategory, type MissionDifficulty } from '@prisma/client'
import { getOrCreateProfile, awardPoints } from './points-service'
import { awardXP } from './level-service'

export interface MissionWithProgress {
  mission: Mission
  userMission: UserMission | null
  progress: number
  maxProgress: number
  progressPercent: number
  isActive: boolean
  isCompleted: boolean
  isAvailable: boolean
  timeRemaining: number | null // milliseconds
}

export interface StartMissionResult {
  success: boolean
  userMission?: UserMission
  error?: string
}

export interface CompleteMissionResult {
  success: boolean
  mission?: Mission
  pointsAwarded?: number
  xpAwarded?: number
  bonusRewards?: any[]
  error?: string
}

/**
 * Get all available missions for user
 */
export async function getAvailableMissions(userId: string): Promise<MissionWithProgress[]> {
  const profile = await getOrCreateProfile(userId)
  const now = new Date()

  // Get all active missions
  const missions = await prisma.mission.findMany({
    where: {
      isActive: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now } }
      ],
      OR: [
        { endsAt: null },
        { endsAt: { gte: now } }
      ]
    },
    orderBy: [
      { category: 'asc' },
      { difficulty: 'asc' },
      { sortOrder: 'asc' }
    ]
  })

  // Get user's mission progress
  const userMissions = await prisma.userMission.findMany({
    where: {
      userId,
      missionId: { in: missions.map(m => m.id) }
    }
  })

  const userMissionMap = new Map(
    userMissions.map(um => [um.missionId, um])
  )

  return missions.map(mission => {
    const userMission = userMissionMap.get(mission.id) || null
    const progress = userMission?.progress || 0
    const maxProgress = mission.maxProgress
    const progressPercent = Math.floor((progress / maxProgress) * 100)
    const isCompleted = userMission?.isCompleted || false
    const isActive = userMission?.isActive || false

    // Check if mission is available (level requirement, prerequisites)
    const meetsLevelRequirement = !mission.requiredLevel || profile.currentLevel >= mission.requiredLevel
    const isAvailable = meetsLevelRequirement && !isCompleted

    // Calculate time remaining
    let timeRemaining: number | null = null
    if (userMission?.expiresAt) {
      timeRemaining = Math.max(0, userMission.expiresAt.getTime() - Date.now())
    } else if (mission.endsAt) {
      timeRemaining = Math.max(0, mission.endsAt.getTime() - Date.now())
    }

    return {
      mission,
      userMission,
      progress,
      maxProgress,
      progressPercent,
      isActive,
      isCompleted,
      isAvailable,
      timeRemaining
    }
  })
}

/**
 * Get missions by category
 */
export async function getMissionsByCategory(
  userId: string,
  category: MissionCategory
): Promise<MissionWithProgress[]> {
  const allMissions = await getAvailableMissions(userId)
  return allMissions.filter(m => m.mission.category === category)
}

/**
 * Get daily missions
 */
export async function getDailyMissions(userId: string): Promise<MissionWithProgress[]> {
  return getMissionsByCategory(userId, 'DAILY')
}

/**
 * Get weekly missions
 */
export async function getWeeklyMissions(userId: string): Promise<MissionWithProgress[]> {
  return getMissionsByCategory(userId, 'WEEKLY')
}

/**
 * Start a mission
 */
export async function startMission(
  userId: string,
  missionSlug: string
): Promise<StartMissionResult> {
  try {
    const profile = await getOrCreateProfile(userId)

    // Get mission
    const mission = await prisma.mission.findUnique({
      where: { slug: missionSlug }
    })

    if (!mission) {
      return { success: false, error: `Mission not found: ${missionSlug}` }
    }

    // Check level requirement
    if (mission.requiredLevel && profile.currentLevel < mission.requiredLevel) {
      return {
        success: false,
        error: `Level ${mission.requiredLevel} required`
      }
    }

    // Check if already active or completed
    const existing = await prisma.userMission.findFirst({
      where: {
        userId,
        missionId: mission.id,
        OR: [
          { isActive: true },
          { isCompleted: true }
        ]
      }
    })

    if (existing?.isCompleted) {
      return { success: false, error: 'Mission already completed' }
    }

    if (existing?.isActive) {
      return { success: true, userMission: existing }
    }

    // Calculate expiration date
    const expiresAt = mission.duration
      ? new Date(Date.now() + mission.duration * 60 * 60 * 1000)
      : mission.endsAt
      ? mission.endsAt
      : null

    // Start mission
    const userMission = await prisma.userMission.create({
      data: {
        userId,
        profileId: profile.id,
        missionId: mission.id,
        progress: 0,
        isActive: true,
        isCompleted: false,
        startedAt: new Date(),
        expiresAt
      }
    })

    // Create event
    await prisma.gamificationEvent.create({
      data: {
        userId,
        eventType: 'mission_started',
        eventData: {
          missionId: mission.id,
          missionSlug: mission.slug,
          missionTitle: mission.title,
          category: mission.category,
          difficulty: mission.difficulty
        }
      }
    })

    return { success: true, userMission }
  } catch (error) {
    console.error('[MissionService] Error starting mission:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start mission'
    }
  }
}

/**
 * Update mission progress
 */
export async function updateMissionProgress(
  userId: string,
  missionSlug: string,
  progress: number
): Promise<CompleteMissionResult> {
  try {
    const profile = await getOrCreateProfile(userId)

    // Get mission
    const mission = await prisma.mission.findUnique({
      where: { slug: missionSlug }
    })

    if (!mission) {
      return { success: false, error: `Mission not found: ${missionSlug}` }
    }

    // Get or start user mission
    let userMission = await prisma.userMission.findFirst({
      where: {
        userId,
        missionId: mission.id,
        isActive: true
      }
    })

    if (!userMission) {
      const startResult = await startMission(userId, missionSlug)
      if (!startResult.success || !startResult.userMission) {
        return { success: false, error: 'Failed to start mission' }
      }
      userMission = startResult.userMission
    }

    // Check if already completed
    if (userMission.isCompleted) {
      return { success: true, mission }
    }

    // Check if expired
    if (userMission.expiresAt && userMission.expiresAt < new Date()) {
      await prisma.userMission.update({
        where: { id: userMission.id },
        data: { isActive: false }
      })
      return { success: false, error: 'Mission expired' }
    }

    // Update progress
    const newProgress = Math.min(progress, mission.maxProgress)
    const isNowComplete = newProgress >= mission.maxProgress

    userMission = await prisma.userMission.update({
      where: { id: userMission.id },
      data: {
        progress: newProgress,
        isCompleted: isNowComplete,
        isActive: !isNowComplete,
        ...(isNowComplete && { completedAt: new Date() }),
        lastProgressAt: new Date()
      }
    })

    // If just completed, award rewards
    if (isNowComplete) {
      return await completeMission(userId, mission.id)
    }

    return { success: true, mission }
  } catch (error) {
    console.error('[MissionService] Error updating progress:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress'
    }
  }
}

/**
 * Complete mission and award rewards
 */
async function completeMission(
  userId: string,
  missionId: string
): Promise<CompleteMissionResult> {
  try {
    const profile = await getOrCreateProfile(userId)

    // Get mission
    const mission = await prisma.mission.findUnique({
      where: { id: missionId }
    })

    if (!mission) {
      return { success: false, error: 'Mission not found' }
    }

    // Update profile mission count
    await prisma.gamificationProfile.update({
      where: { id: profile.id },
      data: {
        totalMissionsCompleted: { increment: 1 }
      }
    })

    // Award points
    if (mission.pointsReward > 0) {
      await awardPoints({
        userId,
        amount: mission.pointsReward,
        reason: `Mission completed: ${mission.title}`,
        description: mission.description,
        type: 'EARNED',
        missionId,
        metadata: {
          missionSlug: mission.slug,
          missionCategory: mission.category,
          missionDifficulty: mission.difficulty
        }
      })
    }

    // Award XP
    if (mission.experienceReward > 0) {
      await awardXP(
        userId,
        mission.experienceReward,
        `Mission completed: ${mission.title}`,
        {
          missionId,
          missionSlug: mission.slug
        }
      )
    }

    // Process bonus rewards
    const bonusRewards = (mission.bonusRewards as any[]) || []
    for (const bonus of bonusRewards) {
      // Handle different bonus types (implement as needed)
      // e.g., special items, temporary buffs, etc.
    }

    // Create event
    await prisma.gamificationEvent.create({
      data: {
        userId,
        eventType: 'mission_completed',
        eventData: {
          missionId,
          missionSlug: mission.slug,
          missionTitle: mission.title,
          category: mission.category,
          difficulty: mission.difficulty,
          pointsAwarded: mission.pointsReward,
          xpAwarded: mission.experienceReward,
          bonusRewards
        }
      }
    })

    // If recurring, create new instance
    if (mission.isRecurring) {
      await createRecurringMissionInstance(userId, mission)
    }

    return {
      success: true,
      mission,
      pointsAwarded: mission.pointsReward,
      xpAwarded: mission.experienceReward,
      bonusRewards
    }
  } catch (error) {
    console.error('[MissionService] Error completing mission:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete mission'
    }
  }
}

/**
 * Create new instance of recurring mission
 */
async function createRecurringMissionInstance(
  userId: string,
  mission: Mission
) {
  const profile = await getOrCreateProfile(userId)

  // Calculate next expiration based on recurrence pattern
  let expiresAt: Date | null = null
  const now = new Date()

  if (mission.recurrencePattern === 'daily') {
    expiresAt = new Date(now.setHours(23, 59, 59, 999))
  } else if (mission.recurrencePattern === 'weekly') {
    const daysUntilSunday = 7 - now.getDay()
    expiresAt = new Date(now.setDate(now.getDate() + daysUntilSunday))
    expiresAt.setHours(23, 59, 59, 999)
  } else if (mission.recurrencePattern === 'monthly') {
    expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  }

  await prisma.userMission.create({
    data: {
      userId,
      profileId: profile.id,
      missionId: mission.id,
      progress: 0,
      isActive: true,
      isCompleted: false,
      startedAt: new Date(),
      expiresAt
    }
  })
}

/**
 * Get mission statistics
 */
export async function getMissionStats(userId: string) {
  const profile = await getOrCreateProfile(userId)
  const missions = await getAvailableMissions(userId)

  const active = missions.filter(m => m.isActive).length
  const completed = missions.filter(m => m.isCompleted).length
  const available = missions.filter(m => m.isAvailable && !m.isActive && !m.isCompleted).length

  const byCategory = {
    daily: missions.filter(m => m.mission.category === 'DAILY' && m.isCompleted).length,
    weekly: missions.filter(m => m.mission.category === 'WEEKLY' && m.isCompleted).length,
    monthly: missions.filter(m => m.mission.category === 'MONTHLY' && m.isCompleted).length,
    special: missions.filter(m => m.mission.category === 'SPECIAL' && m.isCompleted).length
  }

  const byDifficulty = {
    easy: missions.filter(m => m.mission.difficulty === 'EASY' && m.isCompleted).length,
    medium: missions.filter(m => m.mission.difficulty === 'MEDIUM' && m.isCompleted).length,
    hard: missions.filter(m => m.mission.difficulty === 'HARD' && m.isCompleted).length
  }

  return {
    totalCompleted: profile.totalMissionsCompleted,
    active,
    completed,
    available,
    byCategory,
    byDifficulty
  }
}

/**
 * Check and auto-complete missions based on actions
 */
export async function checkMissionsForAction(
  userId: string,
  actionType: string,
  actionData: Record<string, any> = {}
) {
  // Get relevant missions for this action type
  const missions = await prisma.mission.findMany({
    where: {
      isActive: true,
      requirements: {
        path: '$[*].type',
        array_contains: actionType
      }
    }
  })

  const results = []

  for (const mission of missions) {
    const requirements = mission.requirements as any[]
    const requirement = requirements.find((r: any) => r.type === actionType)

    if (!requirement) continue

    // Calculate progress based on action
    const progress = actionData[requirement.type] || requirement.value

    const result = await updateMissionProgress(
      userId,
      mission.slug,
      progress
    )

    results.push(result)
  }

  return results
}

/**
 * Reset daily/weekly/monthly missions (run via cron)
 */
export async function resetRecurringMissions(period: 'daily' | 'weekly' | 'monthly') {
  const recurrencePattern = period

  // Get all recurring missions of this type
  const missions = await prisma.mission.findMany({
    where: {
      isRecurring: true,
      recurrencePattern
    }
  })

  // Deactivate completed instances
  await prisma.userMission.updateMany({
    where: {
      missionId: { in: missions.map(m => m.id) },
      isCompleted: true,
      isActive: false
    },
    data: {
      isActive: false
    }
  })

  // Create new instances for users who completed previous
  const completedUsers = await prisma.userMission.findMany({
    where: {
      missionId: { in: missions.map(m => m.id) },
      isCompleted: true
    },
    distinct: ['userId', 'missionId'],
    select: {
      userId: true,
      missionId: true
    }
  })

  for (const { userId, missionId } of completedUsers) {
    const mission = missions.find(m => m.id === missionId)
    if (mission) {
      await createRecurringMissionInstance(userId, mission)
    }
  }

  console.log(`[MissionService] Reset ${period} missions for ${completedUsers.length} users`)
  return completedUsers.length
}
