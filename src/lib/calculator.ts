import { CalculatorInput, CalculatorResult } from '@/types';
import { calculateEconomy as unifiedCalculateEconomy, formatCurrency as unifiedFormatCurrency, formatPercentage as unifiedFormatPercentage } from './calculator-service';

/**
 * @deprecated Use calculator-service.ts instead
 * Calcula a economia baseada no padrão de uso e tipo de lente
 */
export function calculateEconomy(input: CalculatorInput): CalculatorResult {
  return unifiedCalculateEconomy(input);
}

/**
 * @deprecated Use calculator-service.ts instead
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return unifiedFormatCurrency(value);
}

/**
 * @deprecated Use calculator-service.ts instead
 * Formata percentual para exibição
 */
export function formatPercentage(value: number): string {
  return unifiedFormatPercentage(value);
}