"use client"

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface StepCardProps {
  number: number
  title: string
  description: string
  cost: string
  economy: string
  icon: string
  duration: string
  index: number
}

export function StepCard({
  number,
  title,
  description,
  cost,
  economy,
  icon,
  duration,
  index
}: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className={cn(
        "relative p-6 hover:shadow-xl transition-all duration-300",
        "border-2 border-gray-200 hover:border-primary-300",
        "bg-gradient-to-br from-white to-gray-50"
      )}>
        {/* Número da etapa */}
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">{number}</span>
        </div>

        {/* Ícone */}
        <div className="text-5xl mb-4 mt-2">{icon}</div>

        {/* Título */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

        {/* Descrição */}
        <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>

        {/* Informações de custo e economia */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Custo:</span>
            <Badge variant="default" className="bg-primary-50 text-primary-700 border-primary-200 text-xs">
              {cost}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Economia:</span>
            <Badge variant="default" className="bg-success-50 text-success-700 border-success-200 text-xs">
              {economy}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Duração:</span>
            <span className="text-sm text-gray-600">{duration}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
