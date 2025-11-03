'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentStatus = 'loading' | 'succeeded' | 'processing' | 'failed' | 'canceled' | 'expired';

interface PaymentStatusData {
  success: boolean;
  status: string;
  paid: boolean;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  created: number;
  charges: number;
}

function PixPaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentIntentId = searchParams.get('payment_intent');

  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [paymentData, setPaymentData] = useState<PaymentStatusData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!paymentIntentId) {
      setStatus('failed');
      setError('ID de pagamento não fornecido');
      return;
    }

    // Initial check
    checkPaymentStatus();

    // Poll every 5 seconds if still processing
    const interval = setInterval(() => {
      if (status === 'loading' || status === 'processing') {
        checkPaymentStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentIntentId, status]);

  const checkPaymentStatus = async () => {
    if (!paymentIntentId) return;

    try {
      const response = await fetch(
        `/api/stripe/pix/create-payment?payment_intent_id=${paymentIntentId}`
      );
      const data: PaymentStatusData = await response.json();

      if (!data.success) {
        setStatus('failed');
        setError('Erro ao verificar status do pagamento');
        return;
      }

      setPaymentData(data);

      // Map Stripe status to our internal status
      switch (data.status) {
        case 'succeeded':
          setStatus('succeeded');
          break;
        case 'processing':
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
          setStatus('processing');
          break;
        case 'canceled':
          setStatus('canceled');
          break;
        case 'failed':
          setStatus('failed');
          break;
        default:
          setStatus('processing');
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setStatus('failed');
      setError('Erro ao verificar status do pagamento');
    }
  };

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
      case 'canceled':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'processing':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-16 h-16 text-cyan-500" />
          </motion.div>
        );
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'succeeded':
        return 'Pagamento Confirmado!';
      case 'failed':
        return 'Pagamento Falhou';
      case 'canceled':
        return 'Pagamento Cancelado';
      case 'processing':
        return 'Processando Pagamento...';
      case 'expired':
        return 'Pagamento Expirado';
      default:
        return 'Verificando Pagamento...';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'succeeded':
        return 'Seu pagamento via Pix foi confirmado com sucesso. Você receberá um email de confirmação em breve.';
      case 'failed':
        return error || 'O pagamento não pôde ser processado. Por favor, tente novamente.';
      case 'canceled':
        return 'O pagamento foi cancelado. Você pode tentar novamente a qualquer momento.';
      case 'processing':
        return 'Aguardando confirmação do pagamento. Isso pode levar alguns instantes.';
      case 'expired':
        return 'O prazo para pagamento expirou. Por favor, gere um novo QR Code.';
      default:
        return 'Verificando o status do seu pagamento...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center mb-4"
          >
            {getStatusIcon()}
          </motion.div>
          <CardTitle className="text-2xl font-bold">
            {getStatusTitle()}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {getStatusDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Details */}
          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor:</span>
                <span className="font-semibold text-lg">
                  {formatAmount(paymentData.amount, paymentData.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ID do Pagamento:</span>
                <span className="text-xs font-mono text-gray-700">
                  {paymentIntentId?.slice(0, 15)}...
                </span>
              </div>
              {paymentData.metadata?.description && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Descrição:</span>
                  <span className="text-sm text-gray-700">
                    {paymentData.metadata.description}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Processing Status */}
          {status === 'processing' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-800">
                Estamos verificando o pagamento a cada 5 segundos.
                <br />
                Não feche esta janela.
              </p>
            </div>
          )}

          {/* Success Actions */}
          {status === 'succeeded' && (
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/area-assinante/dashboard')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Ir para Minha Conta
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          )}

          {/* Failure Actions */}
          {(status === 'failed' || status === 'canceled' || status === 'expired') && (
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/planos')}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          )}

          {/* Manual Refresh */}
          {status === 'processing' && (
            <Button
              onClick={checkPaymentStatus}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Status Manualmente
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PixPaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-8 h-8 text-cyan-500" />
            </motion.div>
            <span className="ml-3 text-lg">Carregando...</span>
          </CardContent>
        </Card>
      </div>
    }>
      <PixPaymentStatusContent />
    </Suspense>
  );
}
