"use client"
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
interface TimelineStep {
  label: string
  index: number
  isActive: boolean
}
interface ProcessTimelineProps {
  steps: string[]
  activeStep?: number
}
export function ProcessTimeline({ steps, activeStep = 0 }: ProcessTimelineProps) {
  return (
    <div className="relative py-8">
      {/* Timeline container */}
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
        {/* Progress line */}
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 -translate-y-1/2 z-10"
        />
        {/* Timeline steps */}
        {steps.map((step, index) => {
          const isActive = index <= activeStep
          return (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative z-20 flex flex-col items-center"
            >
              {/* Step circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all duration-300",
                  isActive
                    ? "bg-primary-500 border-primary-200 shadow-lg"
                    : "bg-white border-gray-300"
                )}
              >
                {isActive ? (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold text-gray-400">
                    {index + 1}
                  </span>
                )}
              </div>
              {/* Step label */}
              <span
                className={cn(
                  "absolute top-14 text-xs text-center max-w-[100px] leading-tight transition-all duration-300",
                  isActive ? "text-primary-700 font-semibold" : "text-gray-500"
                )}
              >
                {step}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}