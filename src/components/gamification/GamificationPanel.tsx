'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGamification } from '@/hooks/useGamification'
import {
    Trophy,
    Star,
    Target,
    Gift,
    TrendingUp,
    Calendar,
    Crown,
    Medal,
    Award,
    Zap
} from 'lucide-react'

export function GamificationPanel() {
    const { profile, loading, error, addPoints, completeMission } = useGamification()

    const [activeTab, setActiveTab] = useState('overview')

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !profile) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-600">
                        <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Erro ao carregar dados de gamificação</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const { points, achievements, missions } = profile
    const unlockedAchievements = achievements.filter(a => a.unlockedAt)
    const activeMissions = missions.filter(m => !m.completedAt && m.isActive)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Cabeçalho com Status do Usuário */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="text-4xl">🏆</div>
                                <div>
                                    <h3 className="text-2xl font-bold">Nível {points.currentLevel}</h3>
                                    <p className="text-purple-100">Herói das Lentes</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm">
                                    <span className="font-semibold">{points.totalPoints}</span> pontos totais
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold">{points.streakDays}</span> dias seguidos 🔥
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl mb-2">⭐</div>
                            <Badge className="bg-white/20 text-white border-white/30">
                                Top 10%
                            </Badge>
                        </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span>Próximo nível</span>
                            <span>{points.experiencePoints}/{points.experienceToNextLevel} XP</span>
                        </div>
                        <Progress
                            value={(points.experiencePoints / points.experienceToNextLevel) * 100}
                            className="h-3 bg-white/20"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tabs de Navegação */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        <span className="hidden sm:inline">Visão</span>
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="flex items-center gap-2">
                        <Medal className="h-4 w-4" />
                        <span className="hidden sm:inline">Conquistas</span>
                    </TabsTrigger>
                    <TabsTrigger value="missions" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span className="hidden sm:inline">Missões</span>
                    </TabsTrigger>
                    <TabsTrigger value="rewards" className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        <span className="hidden sm:inline">Recompensas</span>
                    </TabsTrigger>
                </TabsList>

                {/* Visão Geral */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    Pontos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Este mês:</span>
                                        <span className="font-semibold">{points.monthlyPoints}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Esta semana:</span>
                                        <span className="font-semibold">{points.weeklyPoints}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Hoje:</span>
                                        <span className="font-semibold">{points.dailyPoints}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Medal className="h-5 w-5 text-purple-500" />
                                    Conquistas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Desbloqueadas:</span>
                                        <span className="font-semibold">{unlockedAchievements.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total:</span>
                                        <span className="font-semibold">{achievements.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Progresso:</span>
                                        <span className="font-semibold">
                                            {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5 text-green-500" />
                                    Missões
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Ativas:</span>
                                        <span className="font-semibold">{activeMissions.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Completadas:</span>
                                        <span className="font-semibold">{missions.filter(m => m.completedAt).length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pontos disponíveis:</span>
                                        <span className="font-semibold text-green-600">
                                            +{activeMissions.reduce((sum, m) => sum + m.pointsReward, 0)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Atividade Recente */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Atividade Recente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {profile.activities.slice(0, 3).map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <div>
                                                <p className="font-medium text-sm">{activity.description}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={activity.pointsEarned > 0 ? 'default' : 'secondary'}>
                                            {activity.pointsEarned > 0 ? '+' : ''}{activity.pointsEarned} pts
                                        </Badge>
                                    </div>
                                ))}
                                {profile.activities.length === 0 && (
                                    <p className="text-center text-gray-500 py-4">
                                        Nenhuma atividade recente. Complete missões para ganhar pontos!
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Conquistas */}
                <TabsContent value="achievements" className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {achievements.map((achievement) => (
                            <motion.div
                                key={achievement.id}
                                whileHover={{ scale: 1.02 }}
                                className={`p-4 rounded-lg border-2 transition-all ${achievement.unlockedAt
                                        ? 'border-yellow-400 bg-yellow-50'
                                        : 'border-gray-200 bg-gray-50 opacity-60'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-4xl mb-2">{achievement.icon}</div>
                                    <h4 className="font-semibold mb-1">{achievement.name}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Badge variant={
                                            achievement.rarity === 'legendary' ? 'destructive' :
                                                achievement.rarity === 'epic' ? 'default' :
                                                    achievement.rarity === 'rare' ? 'secondary' : 'outline'
                                        }>
                                            {achievement.rarity === 'common' && 'Comum'}
                                            {achievement.rarity === 'rare' && 'Raro'}
                                            {achievement.rarity === 'epic' && 'Épico'}
                                            {achievement.rarity === 'legendary' && 'Lendário'}
                                        </Badge>
                                        <span className="text-sm font-semibold">+{achievement.pointsAwarded} pts</span>
                                    </div>
                                    {achievement.unlockedAt ? (
                                        <p className="text-xs text-green-600">
                                            ✅ Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    ) : (
                                        <div className="space-y-1">
                                            <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                                            <p className="text-xs text-gray-500">
                                                {achievement.progress}/{achievement.maxProgress}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>

                {/* Missões */}
                <TabsContent value="missions" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {activeMissions.map((mission) => (
                            <Card key={mission.id} className="relative">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="text-2xl">{mission.icon}</div>
                                            <div>
                                                <h4 className="font-semibold">{mission.title}</h4>
                                                <Badge variant={
                                                    mission.difficulty === 'easy' ? 'secondary' :
                                                        mission.difficulty === 'medium' ? 'default' : 'destructive'
                                                }>
                                                    {mission.difficulty === 'easy' && 'Fácil'}
                                                    {mission.difficulty === 'medium' && 'Médio'}
                                                    {mission.difficulty === 'hard' && 'Difícil'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">+{mission.pointsReward}</p>
                                            <p className="text-xs text-gray-500">pontos</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{mission.description}</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Progresso:</span>
                                            <span>{mission.progress}/{mission.maxProgress}</span>
                                        </div>
                                        <Progress value={(mission.progress / mission.maxProgress) * 100} className="h-2" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">
                                                <Calendar className="h-3 w-3 inline mr-1" />
                                                Expires: {new Date(mission.expiresAt).toLocaleDateString('pt-BR')}
                                            </span>
                                            {mission.progress >= mission.maxProgress && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => completeMission(mission.id)}
                                                    className="text-xs"
                                                >
                                                    Completar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {activeMissions.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-600">Nenhuma missão ativa no momento.</p>
                                <p className="text-sm text-gray-500">Volte mais tarde para novas missões!</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Recompensas */}
                <TabsContent value="rewards" className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profile.rewards
                            .filter(reward => !profile.claimedRewards.includes(reward.id))
                            .map((reward) => (
                                <Card key={reward.id} className="relative">
                                    <CardContent className="p-4">
                                        <div className="text-center">
                                            <reward.icon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                                            <h4 className="font-semibold mb-1">{reward.name}</h4>
                                            <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Zap className="h-4 w-4 text-yellow-500" />
                                                    <span className="font-bold text-lg">{reward.pointsCost}</span>
                                                    <span className="text-sm text-gray-500">pontos</span>
                                                </div>
                                                {reward.isLimited && (
                                                    <p className="text-xs text-orange-600">
                                                        Limitado: {reward.currentQuantity}/{reward.limitQuantity}
                                                    </p>
                                                )}
                                                <Button
                                                    size="sm"
                                                    disabled={points.totalPoints < reward.pointsCost}
                                                    className="w-full"
                                                >
                                                    {points.totalPoints >= reward.pointsCost ? 'Resgatar' : 'Pontos insuficientes'}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                </TabsContent>
            </Tabs>
        </motion.div>
    )
}
