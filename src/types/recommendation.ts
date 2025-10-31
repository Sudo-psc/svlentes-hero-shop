import { ScientificReference } from './scientific';

export interface ConfidenceMetrics {
  dataCompleteness: number;
  factorConsistency: number;
  scientificSupport: number;
  edgeCaseDetection: number;
  overallConfidence: 'low' | 'medium' | 'high' | 'very-high';
}

export interface Recommendation {
  primary: {
    option: 'contact-lenses' | 'glasses' | 'both' | 'consultation-required';
    score: number;
    confidence: ConfidenceMetrics;
    reasoning: string[];
  };
  secondary?: {
    option: 'contact-lenses' | 'glasses';
    score: number;
    useCase: string;
  };
  specificSuggestions: {
    contactLenses?: {
      type: 'soft' | 'rigid' | 'hybrid' | 'scleral';
      material: string[];
      wearSchedule: 'daily' | 'weekly' | 'monthly';
      specialFeatures: string[];
    };
    glasses?: {
      lensType: 'single-vision' | 'bifocal' | 'progressive' | 'occupational';
      coatings: string[];
      frameSuggestions: string[];
      specialFeatures: string[];
    };
  };
  warnings: string[];
  nextSteps: string[];
  estimatedCosts: {
    initial: { min: number; max: number };
    monthly: { min: number; max: number };
    annual: { min: number; max: number };
  };
}

export interface FactorExplanation {
  category: string;
  factor: string;
  userAnswer: string;
  impact: {
    onContactLenses: 'strongly-positive' | 'positive' | 'neutral' | 'negative' | 'strongly-negative';
    onGlasses: 'strongly-positive' | 'positive' | 'neutral' | 'negative' | 'strongly-negative';
    magnitude: number;
  };
  explanation: {
    simple: string;
    technical: string;
  };
  scientificReferences: ScientificReference[];
  relatedFactors: string[];
}
