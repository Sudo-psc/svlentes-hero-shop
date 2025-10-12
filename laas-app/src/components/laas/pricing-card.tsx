import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

interface PricingFeature {
  text: string
  included: boolean
}

interface PricingCardProps {
  title: string
  price: number | string
  period?: string
  description?: string
  features: PricingFeature[]
  highlighted?: boolean
  badge?: string
  ctaText?: string
  onSelectPlan?: () => void
  className?: string
}

export function PricingCard({
  title,
  price,
  period = "mês",
  description,
  features,
  highlighted = false,
  badge,
  ctaText = "Escolher Plano",
  onSelectPlan,
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl border-2 p-8 transition-all duration-300",
        highlighted
          ? "border-laas-blue shadow-laas-xl scale-105"
          : "border-laas-gray-200 hover:border-laas-blue hover:shadow-laas-lg",
        className
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-laas-blue text-white text-xs font-bold px-4 py-1 rounded-full">
          {badge}
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-laas-blue">{title}</h3>
          {description && (
            <p className="text-sm text-laas-gray-600">{description}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-laas-gray-600">R$</span>
            <span className="text-4xl font-bold text-laas-blue">{price}</span>
            <span className="text-sm text-laas-gray-600">/{period}</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                  feature.included
                    ? "bg-laas-success/10 text-laas-success"
                    : "bg-laas-gray-100 text-laas-gray-400"
                )}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </div>
              <span
                className={cn(
                  "text-sm flex-1",
                  feature.included
                    ? "text-laas-gray-700"
                    : "text-laas-gray-400 line-through"
                )}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          variant={highlighted ? "default" : "outline"}
          className="w-full"
          size="lg"
          onClick={onSelectPlan}
        >
          {ctaText}
        </Button>
      </div>
    </div>
  )
}

interface PricingComparisonProps {
  plans: PricingCardProps[]
  className?: string
}

export function PricingComparison({
  plans,
  className,
}: PricingComparisonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start",
        className
      )}
    >
      {plans.map((plan, index) => (
        <PricingCard key={index} {...plan} />
      ))}
    </div>
  )
}
