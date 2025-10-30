'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    GamificationProfile,
    UserPoints,
    Achievement,
    Mission,
    Reward,
    LeaderboardEntry,
    GamificationNotification,
    UserActivity,
    GamificationEvent
} from '@/types/gamification'
import { TrendingUp, Truck, Crown } from 'lucide-react'

// Dados mockados para desenvolvimento
const mockUserPoints: UserPoints = {
    totalPoints: 2450,
    currentLevel: 12,
    experiencePoints: 750,
    experienceToNextLevel: 1000,
    monthlyPoints: 320,
    weeklyPoints: 85,
    dailyPoints: 25,
    streakDays: 7,
    lastActivityDate: new Date().toISOString()
}

const mockAchievements: Achievement[] = [
    {
        id: 'first_login',
        name: 'Primeiros Passos',
        description: 'Realizou seu primeiro login no sistema',
        icon: '🎯',
        category: 'engagement',
        rarity: 'common',
        pointsAwarded: 10,
        requirements: [
            {
                type: 'login_streak',
                value: 1,
                description: 'Faça seu primeiro login'
            }
        ],
        progress: 1,
        maxProgress: 1,
        unlockedAt: new Date().toISOString(),
        isSecret: false
    },
    {
        id: 'week_streak',
        name: 'Semana de Dedicação',
        description: 'Manteve uma sequência de 7 dias de atividades',
        icon: '🔥',
        category: 'engagement',
        rarity: 'rare',
        pointsAwarded: 50,
        requirements: [
            {
                type: 'login_streak',
                value: 7,
                description: 'Mantenha uma sequência de 7 dias'
            }
        ],
        progress: 7,
        maxProgress: 7,
        unlockedAt: new Date().toISOString(),
        isSecret: false
    },
    {
        id: 'subscription_master',
        name: 'Mestre da Assinatura',
        description: 'Completou 30 dias de assinatura ativa',
        icon: '👑',
        category: 'subscription',
        rarity: 'epic',
        pointsAwarded: 100,
        requirements: [
            {
                type: 'subscription_duration',
                value: 30,
                description: 'Mantenha assinatura por 30 dias'
            }
        ],
        progress: 30,
        maxProgress: 30,
        unlockedAt: new Date().toISOString(),
        isSecret: false
    }
]

const mockMissions: Mission[] = [
    {
        id: 'daily_login',
        title: 'Login Diário',
        description: 'Faça login no sistema hoje',
        icon: '📱',
        category: 'daily',
        difficulty: 'easy',
        pointsReward: 5,
        requirements: [
            {
                type: 'login',
                value: 1,
                description: 'Faça login uma vez hoje'
            }
        ],
        progress: 1,
        maxProgress: 1,
        completedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
    },
    {
        id: 'update_profile',
        title: 'Complete seu Perfil',
        description: 'Atualize suas informações de perfil',
        icon: '👤',
        category: 'weekly',
        difficulty: 'medium',
        pointsReward: 20,
        requirements: [
            {
                type: 'update_profile',
                value: 1,
                description: 'Atualize seu perfil completo'
            }
        ],
        progress: 0,
        maxProgress: 1,
        completedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
    },
    {
        id: 'upload_prescription',
        title: 'Prescrição Digital',
        description: 'Envie sua prescrição médica',
        icon: '📋',
        category: 'monthly',
        difficulty: 'hard',
        pointsReward: 50,
        requirements: [
            {
                type: 'upload_prescription',
                value: 1,
                description: 'Envie uma prescrição válida'
            }
        ],
        progress: 0,
        maxProgress: 1,
        completedAt: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
    }
]

const mockRewards: Reward[] = [
    {
        id: 'discount_10',
        name: '10% de Desconto',
        description: 'Ganhe 10% de desconto na próxima compra',
        icon: require('lucide-react').TrendingUp,
        category: 'discount',
        pointsCost: 500,
        value: 10,
        type: 'percentage',
        isAvailable: true,
        isLimited: true,
        limitQuantity: 50,
        currentQuantity: 23,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        terms: 'Válido para uma única compra. Não acumulativo.'
    },
    {
        id: 'free_shipping',
        name: 'Frete Grátis',
        description: 'Frete grátis em seu próximo pedido',
        icon: require('lucide-react').Truck,
        category: 'freebie',
        pointsCost: 200,
        value: 1,
        type: 'item',
        isAvailable: true,
        isLimited: false,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'premium_support',
        name: 'Suporte Premium',
        description: 'Acesso prioritário ao suporte por 30 dias',
        icon: require('lucide-react').Crown,
        category: 'upgrade',
        pointsCost: 1000,
        value: 30,
        type: 'service',
        isAvailable: true,
        isLimited: true,
        limitQuantity: 10,
        currentQuantity: 7,
        terms: 'Benefício válido por 30 dias após resgate.'
    }
]

const mockLeaderboard: LeaderboardEntry[] = [
    {
        userId: '1',
        userName: 'Ana Silva',
        userAvatar: '/avatars/ana.jpg',
        totalPoints: 5420,
        level: 25,
        rank: 1,
        changeInRank: 0,
        streakDays: 45
    },
    {
        userId: '2',
        userName: 'Carlos Santos',
        userAvatar: '/avatars/carlos.jpg',
        totalPoints: 4890,
        level: 23,
        rank: 2,
        changeInRank: 1,
        streakDays: 30
    },
    {
        userId: '3',
        userName: 'Mariana Costa',
        userAvatar: '/avatars/mariana.jpg',
        totalPoints: 4650,
        level: 22,
        rank: 3,
        changeInRank: -1,
        streakDays: 28
    }
]

export function useGamification(userId?: string) {
    const [profile, setProfile] = useState<GamificationProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Simular carregamento dos dados
    useEffect(() => {
        const loadGamificationData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Simular delay de rede
                await new Promise(resolve => setTimeout(resolve, 1000))

                if (!userId) {
                    throw new Error('ID do usuário não fornecido')
                }

                const mockProfile: GamificationProfile = {
                    userId,
                    points: mockUserPoints,
                    achievements: mockAchievements,
                    unlockedAchievements: mockAchievements.map(a => a.id),
                    rewards: mockRewards,
                    claimedRewards: ['free_shipping'], // Simular recompensa já resgatada
                    missions: mockMissions,
                    completedMissions: ['daily_login'], // Simular missão já completada
                    activities: [],
                    notifications: [],
                    preferences: {
                        enabled: true,
                        showNotifications: true,
                        showLeaderboard: true,
                        shareProgress: false,
                        soundEnabled: true,
                        animationEnabled: true,
                        dailyReminders: true,
                        weeklySummary: true
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }

                setProfile(mockProfile)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar dados de gamificação')
            } finally {
                setLoading(false)
            }
        }

        loadGamificationData()
    }, [userId])

    // Função para adicionar pontos
    const addPoints = useCallback(async (points: number, reason: string) => {
        if (!profile) return

        try {
            // Simular chamada à API
            await new Promise(resolve => setTimeout(resolve, 500))

            setProfile(prev => {
                if (!prev) return prev

                const updatedPoints = {
                    ...prev.points,
                    totalPoints: prev.points.totalPoints + points,
                    dailyPoints: prev.points.dailyPoints + points,
                    weeklyPoints: prev.points.weeklyPoints + points,
                    monthlyPoints: prev.points.monthlyPoints + points,
                    experiencePoints: prev.points.experiencePoints + points
                }

                // Verificar se subiu de nível
                let updatedLevel = prev.points.currentLevel
                if (updatedPoints.experiencePoints >= updatedPoints.experienceToNextLevel) {
                    updatedLevel++
                    updatedPoints.experiencePoints = updatedPoints.experiencePoints - updatedPoints.experienceToNextLevel
                    updatedPoints.experienceToNextLevel = updatedLevel * 100 // Simular cálculo
                }

                return {
                    ...prev,
                    points: {
                        ...updatedPoints,
                        currentLevel: updatedLevel
                    },
                    activities: [
                        {
                            id: Date.now().toString(),
                            type: 'mission_completed',
                            pointsEarned: points,
                            description: reason,
                            createdAt: new Date().toISOString()
                        },
                        ...prev.activities
                    ],
                    updatedAt: new Date().toISOString()
                }
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao adicionar pontos')
        }
    }, [profile])

    // Função para resgatar recompensa
    const claimReward = useCallback(async (rewardId: string) => {
        if (!profile) return

        try {
            // Simular chamada à API
            await new Promise(resolve => setTimeout(resolve, 1000))

            const reward = profile.rewards.find(r => r.id === rewardId)
            if (!reward) {
                throw new Error('Recompensa não encontrada')
            }

            if (profile.points.totalPoints < reward.pointsCost) {
                throw new Error('Pontos insuficientes')
            }

            if (profile.claimedRewards.includes(rewardId)) {
                throw new Error('Recompensa já resgatada')
            }

            setProfile(prev => {
                if (!prev) return prev

                return {
                    ...prev,
                    points: {
                        ...prev.points,
                        totalPoints: prev.points.totalPoints - reward.pointsCost
                    },
                    claimedRewards: [...prev.claimedRewards, rewardId],
                    activities: [
                        {
                            id: Date.now().toString(),
                            type: 'mission_completed',
                            pointsEarned: -reward.pointsCost,
                            description: `Resgatou recompensa: ${reward.name}`,
                            createdAt: new Date().toISOString()
                        },
                        ...prev.activities
                    ],
                    notifications: [
                        {
                            id: Date.now().toString(),
                            type: 'reward_earned',
                            title: 'Recompensa Resgatada!',
                            message: `Você resgatou ${reward.name} com sucesso!`,
                            icon: '🎁',
                            createdAt: new Date().toISOString(),
                            isRead: false
                        },
                        ...prev.notifications
                    ],
                    updatedAt: new Date().toISOString()
                }
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao resgatar recompensa')
            throw err
        }
    }, [profile])

    // Função para completar missão
    const completeMission = useCallback(async (missionId: string) => {
        if (!profile) return

        try {
            // Simular chamada à API
            await new Promise(resolve => setTimeout(resolve, 800))

            const mission = profile.missions.find(m => m.id === missionId)
            if (!mission) {
                throw new Error('Missão não encontrada')
            }

            setProfile(prev => {
                if (!prev) return prev

                return {
                    ...prev,
                    points: {
                        ...prev.points,
                        totalPoints: prev.points.totalPoints + mission.pointsReward,
                        dailyPoints: prev.points.dailyPoints + mission.pointsReward,
                        weeklyPoints: prev.points.weeklyPoints + mission.pointsReward,
                        monthlyPoints: prev.points.monthlyPoints + mission.pointsReward,
                        experiencePoints: prev.points.experiencePoints + mission.pointsReward
                    },
                    missions: prev.missions.map(m =>
                        m.id === missionId
                            ? { ...m, completedAt: new Date().toISOString(), progress: m.maxProgress }
                            : m
                    ),
                    completedMissions: [...prev.completedMissions, missionId],
                    activities: [
                        {
                            id: Date.now().toString(),
                            type: 'mission_completed',
                            pointsEarned: mission.pointsReward,
                            description: `Completou missão: ${mission.title}`,
                            createdAt: new Date().toISOString()
                        },
                        ...prev.activities
                    ],
                    notifications: [
                        {
                            id: Date.now().toString(),
                            type: 'mission_completed',
                            title: 'Missão Completada!',
                            message: `Você completou "${mission.title}" e ganhou ${mission.pointsReward} pontos!`,
                            icon: '✅',
                            pointsAwarded: mission.pointsReward,
                            createdAt: new Date().toISOString(),
                            isRead: false
                        },
                        ...prev.notifications
                    ],
                    updatedAt: new Date().toISOString()
                }
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao completar missão')
            throw err
        }
    }, [profile])

    // Função para marcar notificação como lida
    const markNotificationAsRead = useCallback(async (notificationId: string) => {
        if (!profile) return

        setProfile(prev => {
            if (!prev) return prev

            return {
                ...prev,
                notifications: prev.notifications.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                ),
                updatedAt: new Date().toISOString()
            }
        })
    }, [profile])

    // Função para obter leaderboard
    const getLeaderboard = useCallback(async (): Promise<LeaderboardEntry[]> => {
        // Simular chamada à API
        await new Promise(resolve => setTimeout(resolve, 500))
        return mockLeaderboard
    }, [])

    return {
        profile,
        loading,
        error,
        addPoints,
        claimReward,
        completeMission,
        markNotificationAsRead,
        getLeaderboard,
        refetch: () => {
            setLoading(true)
            setTimeout(() => setLoading(false), 1000)
        }
    }
}
