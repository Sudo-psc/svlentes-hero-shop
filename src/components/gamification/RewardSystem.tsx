'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Coins, Crown, Sparkles, Lock, Clock, CheckCircle, ShoppingCart, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Reward } from '@/types/gamification'

interface RewardSystemProps {
    rewards: Reward[]
    userPoints: number
    claimedRewards: string[]
    onClaimReward: (rewardId: string) => Promise<void>
    onFilterChange?: (category: string) => void
}

export function RewardSystem({
    rewards,
    userPoints,
    claimedRewards,
    onClaimReward,
    onFilterChange
}: RewardSystemProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [isClaiming, setIsClaiming] = useState<string | null>(null)

    const categories = [
        { id: 'all', name: 'Todas', icon: Gift },
        { id: 'discount', name: 'Descontos', icon: TrendingUp },
        { id: 'freebie', name: 'Brindes', icon: Gift },
        { id: 'upgrade', name: 'Upgrades', icon: Crown },
        { id: 'experience', name: 'Experiência', icon: Sparkles },
        { id: 'exclusive', name: 'Exclusivos', icon: Crown }
    ]

    const filteredRewards = selectedCategory === 'all'
        ? rewards
        : rewards.filter(reward => reward.category === selectedCategory)

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'discount': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'freebie': return 'bg-green-100 text-green-800 border-green-200'
            case 'upgrade': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'experience': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'exclusive': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'percentage': return '%'
            case 'fixed': return 'R$'
            case 'item': return Gift
            case 'service': return Crown
            default: return Coins
        }
    }

    const getRewardStatus = (reward: Reward) => {
        if (claimedRewards.includes(reward.id)) return 'claimed'
        if (!reward.isAvailable) return 'unavailable'
        if (reward.isLimited && reward.currentQuantity === 0) return 'soldout'
        if (userPoints < reward.pointsCost) return 'insufficient'
        return 'available'
    }

    const handleClaimReward = async (rewardId: string) => {
        setIsClaiming(rewardId)
        try {
            await onClaimReward(rewardId)
        } finally {
            setIsClaiming(null)
        }
    }

    const formatRewardValue = (reward: Reward) => {
        switch (reward.type) {
            case 'percentage':
                return `${reward.value}% de desconto`
            case 'fixed':
                return `R$ ${reward.value.toFixed(2)}`
            case 'item':
            case 'service':
                return reward.value.toString()
            default:
                return reward.value.toString()
        }
    }

    const renderRewardCard = (reward: Reward, index: number) => {
        const status = getRewardStatus(reward)
        const isDisabled = status !== 'available'

        return (
            <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative overflow-hidden rounded-lg border ${isDisabled ? 'opacity-60' : ''
                    }`}
            >
                <Card className={`h-full transition-all duration-300 ${!isDisabled ? 'hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'
                    }`}>
                    {/* Badge de Status */}
                    <div className="absolute top-3 right-3 z-10">
                        {status === 'claimed' && (
                            <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resgatado
                            </Badge>
                        )}
                        {status === 'soldout' && (
                            <Badge className="bg-red-100 text-red-800">
                                <Lock className="h-3 w-3 mr-1" />
                                Esgotado
                            </Badge>
                        )}
                        {status === 'unavailable' && (
                            <Badge className="bg-gray-100 text-gray-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Indisponível
                            </Badge>
                        )}
                        {reward.isLimited && status !== 'soldout' && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                                Restam: {reward.currentQuantity}
                            </Badge>
                        )}
                    </div>

                    <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                            <div className={`p-3 rounded-lg ${getCategoryColor(reward.category)}`}>
                                <reward.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg line-clamp-1">
                                    {reward.name}
                                </CardTitle>
                                <Badge
                                    variant="outline"
                                    className={`mt-1 text-xs ${getCategoryColor(reward.category)}`}
                                >
                                    {categories.find(c => c.id === reward.category)?.name}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {reward.description}
                        </p>

                        {/* Valor da Recompensa */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1 text-lg font-semibold text-gray-900">
                                {typeof getTypeIcon(reward.type) === 'string' ? (
                                    <span>{getTypeIcon(reward.type)}</span>
                                ) : (
                                    React.createElement(getTypeIcon(reward.type) as any, { className: "h-5 w-5" })
                                )}
                                <span>{formatRewardValue(reward)}</span>
                            </div>
                        </div>

                        {/* Informações Adicionais */}
                        {reward.terms && (
                            <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                <strong>Condições:</strong> {reward.terms}
                            </div>
                        )}

                        {reward.expiresAt && (
                            <div className="mb-4 text-xs text-orange-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expira em: {new Date(reward.expiresAt).toLocaleDateString('pt-BR')}
                            </div>
                        )}

                        {/* Custo e Ação */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <Coins className="h-4 w-4 text-yellow-600" />
                                <span className={`font-bold ${userPoints < reward.pointsCost ? 'text-red-600' : 'text-gray-900'
                                    }`}>
                                    {reward.pointsCost.toLocaleString('pt-BR')} pts
                                </span>
                            </div>

                            <Button
                                size="sm"
                                disabled={isDisabled || isClaiming === reward.id}
                                onClick={() => handleClaimReward(reward.id)}
                                className={`${status === 'claimed' ? 'bg-green-600 hover:bg-green-700' :
                                        status === 'insufficient' ? 'bg-gray-400' :
                                            'bg-cyan-600 hover:bg-cyan-700'
                                    }`}
                            >
                                {isClaiming === reward.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                ) : status === 'claimed' ? (
                                    'Resgatado'
                                ) : status === 'insufficient' ? (
                                    'Pontos Insuficientes'
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <ShoppingCart className="h-3 w-3" />
                                        Resgatar
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Progress Bar para recompensas limitadas */}
                        {reward.isLimited && reward.limitQuantity && (
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Disponibilidade</span>
                                    <span>{reward.currentQuantity}/{reward.limitQuantity}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${((reward.currentQuantity || 0) / reward.limitQuantity) * 100}%`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Loja de Recompensas</h2>
                <p className="text-gray-600 mb-6">
                    Use seus pontos para resgatar benefícios exclusivos!
                </p>

                {/* Saldo de Pontos */}
                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold">
                    <Coins className="h-5 w-5" />
                    Seu Saldo: {userPoints.toLocaleString('pt-BR')} pontos
                </div>
            </motion.div>

            {/* Filtros */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-fit">
                        {categories.map((category) => (
                            <TabsTrigger
                                key={category.id}
                                value={category.id}
                                className="flex items-center gap-1"
                            >
                                <category.icon className="h-4 w-4" />
                                <span className="hidden md:inline">{category.name}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </motion.div>

            {/* Grid de Recompensas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {filteredRewards.length === 0 ? (
                    <div className="text-center py-12">
                        <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhuma recompensa encontrada
                        </h3>
                        <p className="text-gray-600">
                            Tente selecionar outra categoria ou volte mais tarde para novas opções.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRewards.map((reward, index) => renderRewardCard(reward, index))}
                    </div>
                )}
            </motion.div>

            {/* Legendas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 p-4 rounded-lg"
            >
                <h4 className="font-semibold text-gray-900 mb-2">Informações Importantes:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Os pontos são deduzidos no momento do resgate</li>
                    <li>• Recompensas limitadas estão sujeitas à disponibilidade</li>
                    <li>• Alguns benefícios podem ter condições especiais</li>
                    <li>• Verifique a data de expiração das recompensas</li>
                </ul>
            </motion.div>
        </div>
    )
}
