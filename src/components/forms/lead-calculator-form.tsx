'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadFormSchema, type LeadFormData } from '@/lib/validations';
import { CalculatorResult } from '@/types';
import { CalculatorForm } from './calculator-form';
import { CalculatorResults } from '../sections/calculator-results';

interface LeadCalculatorFormProps {
  onLeadSubmit?: (data: LeadFormData & { calculatorResult?: CalculatorResult }) => void;
}

export function LeadCalculatorForm({ onLeadSubmit }: LeadCalculatorFormProps) {
  const [step, setStep] = useState<'calculator' | 'results' | 'lead'>('calculator');
  const [calculatorResult, setCalculatorResult] = useState<CalculatorResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema)
  });

  const handleCalculate = (result: CalculatorResult) => {
    setCalculatorResult(result);
    setStep('results');
  };

  const handleShowLeadForm = () => {
    setStep('lead');
  };

  const handleLeadSubmit = async (data: LeadFormData) => {
    if (onLeadSubmit) {
      await onLeadSubmit({ ...data, calculatorResult: calculatorResult || undefined });
    }
  };

  const handleReset = () => {
    setStep('calculator');
    setCalculatorResult(null);
  };

  return (
    <div className="max-w-md mx-auto">
      {step === 'calculator' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Calcule sua economia
          </h3>
          <CalculatorForm onCalculate={handleCalculate} />
        </div>
      )}

      {step === 'results' && calculatorResult && (
        <div>
          <CalculatorResults result={calculatorResult} onReset={handleReset} />
          <div className="mt-6">
            <button
              onClick={handleShowLeadForm}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Quero Agendar Consulta
            </button>
          </div>
        </div>
      )}

      {step === 'lead' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agende sua consulta
          </h3>

          {calculatorResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-sm text-green-700 mb-1">Sua economia mensal:</div>
                <div className="text-xl font-bold text-green-800">
                  R$ {calculatorResult.monthlySavings.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(handleLeadSubmit)} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                {...register('nome')}
                id="calculator-nome"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Seu nome completo"
              />
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                {...register('whatsapp')}
                id="calculator-whatsapp"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="(11) 99999-9999"
              />
              {errors.whatsapp && (
                <p className="mt-1 text-sm text-red-600">{errors.whatsapp.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                {...register('email')}
                id="calculator-email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="flex items-start">
              <input
                {...register('lgpdConsent')}
                id="calculator-lgpd-consent"
                type="checkbox"
                className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="lgpdConsent" className="ml-2 text-sm text-gray-600">
                Concordo em receber informações sobre os serviços de assinatura de lentes de contato da SV Lentes e com o tratamento dos meus dados conforme a{' '}
                <a href="/politica-privacidade" className="text-primary-600 hover:underline">
                  Política de Privacidade
                </a>
              </label>
            </div>
            {errors.lgpdConsent && (
              <p className="text-sm text-red-600">{errors.lgpdConsent.message}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Agendar Consulta'}
            </button>
          </form>

          <button
            onClick={handleReset}
            className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800"
          >
            ← Voltar para calculadora
          </button>
        </div>
      )}
    </div>
  );
}
