'use client';

/**
 * Feature Flag Usage Examples
 *
 * Este arquivo demonstra diferentes padrões de uso do sistema de feature flags
 */

import { useState, useEffect } from 'react';
import { isFeatureEnabled, evaluateFeatureFlag } from '@/lib/feature-flags';

// ========================================
// Exemplo 1: Toggle Simples
// ========================================
export function SimpleToggleExample({ userId }: { userId?: string }) {
  const [showNewUI, setShowNewUI] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFlag() {
      const enabled = await isFeatureEnabled('new_checkout_flow', userId);
      setShowNewUI(enabled);
      setLoading(false);
    }
    checkFlag();
  }, [userId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      {showNewUI ? (
        <div className="border-2 border-green-500 p-4 rounded">
          <h3 className="text-lg font-bold">✨ Nova Interface de Checkout</h3>
          <p>Esta é a versão melhorada do checkout com validação em tempo real.</p>
        </div>
      ) : (
        <div className="border-2 border-gray-500 p-4 rounded">
          <h3 className="text-lg font-bold">Checkout Padrão</h3>
          <p>Interface de checkout tradicional.</p>
        </div>
      )}
    </div>
  );
}

// ========================================
// Exemplo 2: Múltiplas Flags
// ========================================
export function MultipleFlagsExample({ userId }: { userId?: string }) {
  const [flags, setFlags] = useState({
    pixPayment: false,
    smartReminders: false,
    betaFeatures: false,
  });

  useEffect(() => {
    async function loadFlags() {
      const [pix, reminders, beta] = await Promise.all([
        isFeatureEnabled('pix_payment', userId),
        isFeatureEnabled('smart_reminders', userId),
        isFeatureEnabled('beta_features', userId),
      ]);

      setFlags({
        pixPayment: pix,
        smartReminders: reminders,
        betaFeatures: beta,
      });
    }
    loadFlags();
  }, [userId]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Suas Features Ativas</h3>

      <div className="grid gap-2">
        <FeatureCard
          title="Pagamento via PIX"
          enabled={flags.pixPayment}
          description="Pague suas assinaturas instantaneamente com PIX"
        />
        <FeatureCard
          title="Lembretes Inteligentes"
          enabled={flags.smartReminders}
          description="Receba notificações no melhor horário para você"
        />
        <FeatureCard
          title="Acesso Beta"
          enabled={flags.betaFeatures}
          description="Teste novas funcionalidades antes do lançamento"
        />
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  enabled,
  description,
}: {
  title: string;
  enabled: boolean;
  description: string;
}) {
  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        enabled ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{enabled ? '✅' : '⭕'}</span>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Exemplo 3: Avaliação Detalhada
// ========================================
export function DetailedEvaluationExample({ userId }: { userId?: string }) {
  const [evaluation, setEvaluation] = useState<{
    enabled: boolean;
    reason: string;
    metadata?: any;
  } | null>(null);

  useEffect(() => {
    async function evaluate() {
      const result = await evaluateFeatureFlag('smart_reminders', userId);
      setEvaluation(result);
    }
    evaluate();
  }, [userId]);

  if (!evaluation) {
    return <div>Avaliando feature...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">Resultado da Avaliação</h3>

      <div className="space-y-3">
        <div>
          <span className="font-semibold">Status: </span>
          <span
            className={`px-3 py-1 rounded ${
              evaluation.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {evaluation.enabled ? 'Ativada' : 'Desativada'}
          </span>
        </div>

        <div>
          <span className="font-semibold">Motivo: </span>
          <code className="bg-gray-100 px-2 py-1 rounded">{evaluation.reason}</code>
        </div>

        {evaluation.metadata && (
          <div>
            <span className="font-semibold">Metadata: </span>
            <pre className="bg-gray-100 p-3 rounded mt-2 overflow-auto">
              {JSON.stringify(evaluation.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// Exemplo 4: A/B Testing com Analytics
// ========================================
export function ABTestExample({ userId }: { userId?: string }) {
  const [variant, setVariant] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    async function determineVariant() {
      // Flag configurada com 50% rollout para teste A/B
      const showVariantB = await isFeatureEnabled('ab_test_calculator', userId);

      setVariant(showVariantB ? 'B' : 'A');

      // Registrar evento de exposição ao teste
      if (userId) {
        await fetch('/api/analytics/ab-test-exposure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testName: 'calculator_layout',
            variant: showVariantB ? 'B' : 'A',
            userId,
          }),
        });
      }
    }

    determineVariant();
  }, [userId]);

  if (!variant) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6 rounded-lg border-2">
      <div className="text-xs text-gray-500 mb-2">
        Teste A/B: Variante {variant}
      </div>

      {variant === 'A' ? (
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-900">Layout Original</h3>
          <p className="text-blue-700">Calculadora com layout tradicional vertical</p>
        </div>
      ) : (
        <div className="bg-purple-50 p-4 rounded">
          <h3 className="text-lg font-bold text-purple-900">Layout Experimental</h3>
          <p className="text-purple-700">Calculadora com layout horizontal otimizado</p>
        </div>
      )}
    </div>
  );
}

// ========================================
// Exemplo 5: Gradual Rollout Indicator
// ========================================
export function RolloutIndicator({ flagKey }: { flagKey: string }) {
  const [rolloutInfo, setRolloutInfo] = useState<{
    percentage: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    async function fetchRollout() {
      const response = await fetch(`/api/admin/feature-flags?flagKey=${flagKey}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const flag = data.data[0];
        setRolloutInfo({
          percentage: flag.rolloutPercentage,
          status: flag.status,
        });
      }
    }

    fetchRollout();
  }, [flagKey]);

  if (!rolloutInfo) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-2xl">🚀</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Feature em Rollout</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Esta funcionalidade está ativa para <strong>{rolloutInfo.percentage}%</strong> dos
              usuários.
            </p>
            {rolloutInfo.percentage < 100 && (
              <p className="mt-1 text-xs">
                Você está entre os primeiros a testar! Envie feedback para melhorarmos.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Exemplo 6: Feature com Fallback
// ========================================
export function FeatureWithFallback({ userId }: { userId?: string }) {
  const [content, setContent] = useState<React.ReactNode>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        const enabled = await isFeatureEnabled('enhanced_analytics', userId);

        if (enabled) {
          // Carregar componente avançado dinamicamente
          const { EnhancedAnalytics } = await import('@/components/analytics/Enhanced');
          setContent(<EnhancedAnalytics />);
        } else {
          // Fallback para versão básica
          const { BasicAnalytics } = await import('@/components/analytics/Basic');
          setContent(<BasicAnalytics />);
        }
      } catch (error) {
        console.error('Erro ao carregar analytics:', error);
        // Em caso de erro, mostrar versão básica
        const { BasicAnalytics } = await import('@/components/analytics/Basic');
        setContent(<BasicAnalytics />);
      }
    }

    loadContent();
  }, [userId]);

  return <div>{content || <div>Carregando analytics...</div>}</div>;
}

// ========================================
// Exemplo 7: Admin Quick Actions
// ========================================
export function AdminQuickActions({ flagKey }: { flagKey: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function toggleFlag(action: 'activate' | 'deactivate') {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          flagKey,
          changedBy: 'admin-panel',
          reason: `Quick ${action} from admin UI`,
        }),
      });

      const result = await response.json();
      setMessage(result.success ? `✅ ${action} bem-sucedido` : `❌ Erro: ${result.error}`);
    } catch (error) {
      setMessage('❌ Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  async function updateRollout(percentage: number) {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_rollout',
          flagKey,
          value: percentage,
          changedBy: 'admin-panel',
          reason: `Rollout ajustado para ${percentage}%`,
        }),
      });

      const result = await response.json();
      setMessage(result.success ? `✅ Rollout: ${percentage}%` : `❌ Erro: ${result.error}`);
    } catch (error) {
      setMessage('❌ Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-3">
      <h4 className="font-semibold">Ações Rápidas: {flagKey}</h4>

      <div className="flex gap-2">
        <button
          onClick={() => toggleFlag('activate')}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Ativar
        </button>
        <button
          onClick={() => toggleFlag('deactivate')}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Desativar
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Rollout Rápido:</label>
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map(pct => (
            <button
              key={pct}
              onClick={() => updateRollout(pct)}
              disabled={loading}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="text-sm p-2 bg-gray-100 rounded">
          {message}
        </div>
      )}
    </div>
  );
}
