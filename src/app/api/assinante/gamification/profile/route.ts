/**
 * Gamification Profile API
 *
 * GET /api/assinante/gamification/profile
 */

import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getOrCreateProfile, getPointsSummary } from '@/lib/gamification/points-service'
import { getLevelInfo } from '@/lib/gamification/level-service'
import { getAchievementStats } from '@/lib/gamification/achievement-service'
import { getMissionStats } from '@/lib/gamification/mission-service'
import { getRewardStats } from '@/lib/gamification/reward-service'

export async function GET(request: Request) {
  try {
    // Get user from Firebase token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Get or create gamification profile
    const profile = await getOrCreateProfile(userId)

    // Get comprehensive profile data
    const [
      pointsSummary,
      levelInfo,
      achievementStats,
      missionStats,
      rewardStats
    ] = await Promise.all([
      getPointsSummary(userId),
      getLevelInfo(userId),
      getAchievementStats(userId),
      getMissionStats(userId),
      getRewardStats(userId)
    ])

    return NextResponse.json({
      success: true,
      profile: {
        // Core stats
        userId: profile.userId,
        totalPoints: profile.totalPoints,
        availablePoints: profile.availablePoints,
        currentLevel: profile.currentLevel,
        experiencePoints: profile.experiencePoints,
        experienceToNextLevel: profile.experienceToNextLevel,

        // Time-based points
        dailyPoints: profile.dailyPoints,
        weeklyPoints: profile.weeklyPoints,
        monthlyPoints: profile.monthlyPoints,

        // Streaks
        loginStreakDays: profile.loginStreakDays,
        longestLoginStreak: profile.longestLoginStreak,
        lastLoginDate: profile.lastLoginDate,
        lastActivityAt: profile.lastActivityAt,

        // Totals
        totalAchievements: profile.totalAchievements,
        totalMissionsCompleted: profile.totalMissionsCompleted,
        totalRewardsClaimed: profile.totalRewardsClaimed,
        totalPointsEarned: profile.totalPointsEarned,
        totalPointsSpent: profile.totalPointsSpent,

        // Settings
        gamificationEnabled: profile.gamificationEnabled,
        notificationsEnabled: profile.notificationsEnabled,
        leaderboardOptIn: profile.leaderboardOptIn,
        showOnLeaderboard: profile.showOnLeaderboard,
        leaderboardRank: profile.leaderboardRank,

        // Customization
        customization: profile.customization,

        // Enhanced data
        pointsSummary,
        levelInfo,
        achievementStats,
        missionStats,
        rewardStats
      }
    })
  } catch (error) {
    console.error('[API] Error fetching gamification profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/assinante/gamification/profile
 * Update profile settings
 */
export async function PATCH(request: Request) {
  try {
    // Get user from Firebase token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Get request body
    const body = await request.json()
    const {
      gamificationEnabled,
      notificationsEnabled,
      leaderboardOptIn,
      showOnLeaderboard,
      customization
    } = body

    // Update profile
    const { prisma } = await import('@/lib/prisma')
    const updatedProfile = await prisma.gamificationProfile.update({
      where: { userId },
      data: {
        ...(typeof gamificationEnabled === 'boolean' && { gamificationEnabled }),
        ...(typeof notificationsEnabled === 'boolean' && { notificationsEnabled }),
        ...(typeof leaderboardOptIn === 'boolean' && {
          leaderboardOptIn,
          showOnLeaderboard: leaderboardOptIn ? showOnLeaderboard : false
        }),
        ...(typeof showOnLeaderboard === 'boolean' && leaderboardOptIn && { showOnLeaderboard }),
        ...(customization && { customization })
      }
    })

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    })
  } catch (error) {
    console.error('[API] Error updating gamification profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      },
      { status: 500 }
    )
  }
}
