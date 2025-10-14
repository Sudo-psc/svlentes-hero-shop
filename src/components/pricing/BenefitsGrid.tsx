'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlight?: boolean;
}

interface BenefitsGridProps {
  benefits: Benefit[];
  title?: string;
  subtitle?: string;
}

export const BenefitsGrid: React.FC<BenefitsGridProps> = ({
  benefits,
  title = 'Por que escolher nossos planos?',
  subtitle,
}) => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-silver-900 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-silver-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit) => (
            <Card
              key={benefit.id}
              className={cn(
                'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                benefit.highlight && 'border-cyan-500 border-2 bg-gradient-to-br from-cyan-50 to-white'
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                      benefit.highlight
                        ? 'bg-cyan-100'
                        : 'bg-silver-100'
                    )}
                  >
                    {benefit.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3
                      className={cn(
                        'text-lg font-bold mb-2',
                        benefit.highlight ? 'text-cyan-900' : 'text-silver-900'
                      )}
                    >
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-silver-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>

                {/* Decorative element for highlighted items */}
                {benefit.highlight && (
                  <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-200 opacity-20 rounded-full -mr-10 -mt-10" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsGrid;
