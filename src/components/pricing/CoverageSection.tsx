'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Globe, Package } from 'lucide-react';

interface CoverageItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  locations?: string[];
  nationwide?: boolean;
}

interface CoverageSectionProps {
  items: CoverageItem[];
}

const iconMap = {
  '📍': MapPin,
  '🌐': Globe,
  '📦': Package,
};

export const CoverageSection: React.FC<CoverageSectionProps> = ({ items }) => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-cyan-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-cyan-600 border-cyan-600">
            Importante
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-silver-900 mb-4">
            Cobertura de Atendimento
          </h2>
          <p className="text-lg text-silver-600 max-w-2xl mx-auto">
            Conheça as regiões onde oferecemos nossos serviços
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon as keyof typeof iconMap];

            return (
              <Card
                key={item.id}
                className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-cyan-100 rounded-full flex items-center justify-center">
                    {IconComponent ? (
                      <IconComponent className="w-8 h-8 text-cyan-600" />
                    ) : (
                      <span className="text-3xl">{item.icon}</span>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-silver-900">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-silver-600">
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                  {item.nationwide && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      Todo Brasil 🇧🇷
                    </Badge>
                  )}

                  {item.locations && (
                    <div className="space-y-2">
                      {item.locations.map((location, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-center gap-2 text-sm text-silver-700"
                        >
                          <MapPin className="w-4 h-4 text-cyan-600" />
                          <span>{location}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-100 opacity-10 rounded-full -mr-10 -mt-10" />
              </Card>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="text-center mt-8">
          <p className="text-sm text-silver-600 flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-600" />
            <span>
              <strong>Clínica Saraiva Vision</strong> • Caratinga/MG • Atendemos toda a região
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CoverageSection;
