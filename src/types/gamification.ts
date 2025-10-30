/**
 * Gamification System Types
 * Tipos para o sistema de gamificação e recompensas
 */

import React from 'react'

// Interface para pontos e experiência do usuário
export interface UserPoints {
    totalPoints: number
    currentLevel: number
    experiencePoints: number
    experienceToNextLevel: number
    monthlyPoints: number
    weeklyPoints: number
    dailyPoints: number
    streakDays: number
    lastActivityDate: string
}

// Interface para conquistas/badges
export interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    category: 'subscription' | 'engagement' | 'loyalty' | 'milestone' | 'special'
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    pointsAwarded: number
    requirements: AchievementRequirement[]
    progress: number
    maxProgress: number
    unlockedAt: string | null
    isSecret: boolean
}

export interface AchievementRequirement {
    type: 'login_streak' | 'total_points' | 'subscription_duration' | 'referrals' | 'actions_completed' | 'plan_upgrade'
    value: number
    description: string
}

// Interface para recompensas
export interface Reward {
    id: string
    name: string
    description: string
    icon: React.ComponentType<any>
    category: 'discount' | 'freebie' | 'upgrade' | 'experience' | 'exclusive'
    pointsCost: number
    value: number
    type: 'percentage' | 'fixed' | 'item' | 'service'
    isAvailable: boolean
    isLimited: boolean
    limitQuantity?: number
    currentQuantity?: number
    expiresAt?: string
    terms?: string
}

// Interface para missões/desafios
export interface Mission {
    id: string
    title: string
    description: string
    icon: string
    category: 'daily' | 'weekly' | 'monthly' | 'special'
    difficulty: 'easy' | 'medium' | 'hard'
    pointsReward: number
    requirements: MissionRequirement[]
    progress: number
    maxProgress: number
    completedAt: string | null
    expiresAt: string
    isActive: boolean
}

export interface MissionRequirement {
    type: 'login' | 'update_profile' | 'upload_prescription' | 'make_payment' | 'refer_friend' | 'complete_tutorial'
    value: number
    description: string
}

// Interface para排行榜/leaderboard
export interface LeaderboardEntry {
    userId: string
    userName: string
    userAvatar?: string
    totalPoints: number
    level: number
    rank: number
    changeInRank: number
    streakDays: number
}

// Interface para notificações de gamificação
export interface GamificationNotification {
    id: string
    type: 'achievement_unlocked' | 'level_up' | 'reward_earned' | 'mission_completed' | 'streak_milestone'
    title: string
    message: string
    icon: string
    pointsAwarded?: number
    isRead: boolean
    createdAt: string
    metadata?: Record<string, any>
}

// Interface para atividades do usuário
export interface UserActivity {
    id: string
    type: 'login' | 'profile_update' | 'prescription_upload' | 'payment_made' | 'plan_upgrade' | 'referral' | 'mission_completed'
    pointsEarned: number
    description: string
    metadata?: Record<string, any>
    createdAt: string
}

// Interface para preferências de gamificação
export interface GamificationPreferences {
    enabled: boolean
    showNotifications: boolean
    showLeaderboard: boolean
    shareProgress: boolean
    soundEnabled: boolean
    animationEnabled: boolean
    dailyReminders: boolean
    weeklySummary: boolean
}

// Interface completa do perfil de gamificação do usuário
export interface GamificationProfile {
    userId: string
    points: UserPoints
    achievements: Achievement[]
    unlockedAchievements: string[]
    rewards: Reward[]
    claimedRewards: string[]
    missions: Mission[]
    completedMissions: string[]
    activities: UserActivity[]
    notifications: GamificationNotification[]
    preferences: GamificationPreferences
    createdAt: string
    updatedAt: string
}

// Tipos de eventos de gamificação
export interface GamificationEvent {
    type: 'points_earned' | 'achievement_unlocked' | 'level_up' | 'reward_claimed' | 'mission_completed' | 'streak_updated'
    userId: string
    data: any
    timestamp: string
}

// Níveis do sistema
export interface Level {
    level: number
    name: string
    description: string
    minExperience: number
    maxExperience: number
    icon: string
    color: string
    rewards: string[] // IDs de recompensas desbloqueadas no nível
}

// Configurações do sistema de gamificação
export interface GamificationConfig {
    pointsPerLogin: number
    pointsPerProfileUpdate: number
    pointsPerPrescriptionUpload: number
    pointsPerPayment: number
    pointsPerReferral: number
    streakBonusMultiplier: number
    levelUpBonusPoints: number
    maxStreakDays: number
    dailyLoginWindow: number // horas
}

// Interface para UserLevel (compatibilidade)
export interface UserLevel {
    id: string
    name: string
    level: number
    minPoints: number
    maxPoints: number
    color: string
    icon: string
    benefits: string[]
}

// Interface para UserGamificationData (compatibilidade)
export interface UserGamificationData {
    userId: string
    totalPoints: number
    currentLevel: UserLevel
    nextLevel?: UserLevel
    achievements: Achievement[]
    availableRewards: Reward[]
    claimedRewards: Reward[]
    streakDays: number
    lastActiveDate: string
    monthlyPoints: number
    rankPosition?: number
    totalUsers?: number
}

// Interface para ActivityLog (compatibilidade)
export interface ActivityLog {
    id: string
    userId: string
    type: 'points_earned' | 'achievement_unlocked' | 'level_up' | 'reward_claimed' | 'streak_maintained'
    points?: number
    achievementId?: string
    rewardId?: string
    description: string
    timestamp: string
    metadata?: Record<string, any>
}

// Interface para GamificationAction (compatibilidade)
export interface GamificationAction {
    type: 'login' | 'subscription_payment' | 'prescription_update' | 'appointment_completed' | 'referral_sent' | 'referral_accepted' | 'profile_completed' | 'support_ticket_resolved'
    points: number
    description: string
    cooldownHours?: number
}

// Interface para NotificationPreferences (compatibilidade)
export interface NotificationPreferences {
    achievementUnlocked: boolean
    levelUp: boolean
    rewardAvailable: boolean
    streakMilestone: boolean
    leaderboardUpdate: boolean
}

// Interface para LeaderboardEntry (compatibilidade)
export interface LeaderboardEntryCompat {
    userId: string
    userName: string
    userAvatar?: string
    points: number
    level: number
    rank: number
    change: 'up' | 'down' | 'same'
    achievementsCount: number
}
