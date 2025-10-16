import { UltraSimpleCalculator } from '@/components/subscription/UltraSimpleCalculator'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculadora de Economia - SV Lentes',
  description: 'Descubra quanto você pode economizar com assinatura de lentes de contato. Planos mensais e anuais com acompanhamento médico.',
}

export default function CalculadoraPage() {
  return <UltraSimpleCalculator />
}
