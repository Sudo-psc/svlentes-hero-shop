'use client';
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
export interface PricingCardProps {
  id: string;
  name: string;
  badge?: string;
  popularBadge?: string;
  description: string;
  price: number;
  installments: number;
  features: string[];
  highlighted?: boolean;
  onSaibaMais?: () => void;
  onAssinar?: () => void;
  className?: string;
}
export const PricingCard: React.FC<PricingCardProps> = ({
  id,
  name,
  badge,
  popularBadge,
  description,
  price,
  installments,
  features,
  highlighted = false,
  onSaibaMais,
  onAssinar,
  className,
}) => {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  // Calculate padding-top based on number of badges
  const hasBadges = !!(badge || popularBadge);
  const hasBothBadges = !!(badge && popularBadge);
  const headerPaddingClass = hasBothBadges ? 'pt-16' : hasBadges ? 'pt-12' : 'pt-8';
  return (
    <Card
      className={cn(
        'relative flex flex-col h-full transition-all duration-300 hover:shadow-xl',
        highlighted && 'border-cyan-500 border-2 shadow-2xl shadow-cyan-500/20 scale-105',
        !highlighted && 'hover:scale-102 hover:border-cyan-300',
        className
      )}
    >
      {/* Badges */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center z-10">
        {popularBadge && (
          <Badge
            variant="default"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-1 text-xs shadow-lg"
          >
            {popularBadge}
          </Badge>
        )}
        {badge && (
          <Badge
            variant={highlighted ? "default" : "secondary"}
            className={cn(
              "font-semibold px-4 py-1 text-xs shadow-lg",
              highlighted && "bg-cyan-600 hover:bg-cyan-700 text-white",
              !highlighted && "bg-silver-200 text-silver-700"
            )}
          >
            {badge}
          </Badge>
        )}
      </div>
      <CardHeader className={cn("text-center pb-4", headerPaddingClass)}>
        <CardTitle className="text-2xl font-bold text-silver-900">
          {name}
        </CardTitle>
        <CardDescription className="text-sm text-silver-600 mt-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {/* Pricing */}
        <div className="text-center space-y-1">
          {installments > 1 ? (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-lg font-medium text-silver-600">{installments}x de</span>
              <span className={cn(
                "text-4xl font-bold",
                highlighted ? "text-cyan-600" : "text-silver-900"
              )}>
                {formatPrice(price)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-lg font-medium text-silver-600">R$</span>
              <span className={cn(
                "text-4xl font-bold",
                highlighted ? "text-cyan-600" : "text-silver-900"
              )}>
                {formatPrice(price)}
              </span>
            </div>
          )}
          <p className="text-sm text-silver-500">ou à vista com desconto</p>
        </div>
        {/* Features List */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={cn(
                "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                highlighted ? "bg-cyan-100" : "bg-green-100"
              )}>
                <Check className={cn(
                  "w-3.5 h-3.5",
                  highlighted ? "text-cyan-600" : "text-green-600"
                )} />
              </div>
              <span className="text-sm text-silver-700 leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-6">
        <Button
          variant={highlighted ? "default" : "outline"}
          size="lg"
          className={cn(
            "w-full font-semibold",
            highlighted && "bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/30"
          )}
          onClick={onAssinar}
        >
          Assinar Agora
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full font-medium text-silver-600 hover:text-cyan-600 hover:bg-cyan-50"
          onClick={onSaibaMais}
        >
          Saiba Mais
        </Button>
      </CardFooter>
    </Card>
  );
};
export default PricingCard;