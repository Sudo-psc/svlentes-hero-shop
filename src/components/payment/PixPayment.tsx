'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PixPaymentData {
  success: boolean;
  paymentIntentId: string;
  clientSecret: string;
  qrCode: string; // Base64 QR Code image
  qrCodeText: string; // Pix copy-paste code
  expiresAt: number; // Unix timestamp
  status: string;
  amount: number;
  currency: string;
}

interface PixPaymentProps {
  /** Payment amount in cents (e.g., 1000 = R$ 10.00) */
  amount: number;
  /** Payment description */
  description: string;
  /** Customer email */
  customerEmail: string;
  /** Customer name */
  customerName: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
  /** Callback when payment succeeds */
  onSuccess?: (paymentIntentId: string) => void;
  /** Callback when payment fails or expires */
  onError?: (error: string) => void;
  /** Callback when payment is cancelled */
  onCancel?: () => void;
}

export function PixPayment({
  amount,
  description,
  customerEmail,
  customerName,
  metadata,
  onSuccess,
  onError,
  onCancel,
}: PixPaymentProps) {
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'succeeded' | 'failed' | 'expired'>('pending');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Create Pix payment on mount
  useEffect(() => {
    createPixPayment();
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!paymentData) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiresAt = paymentData.expiresAt;
      const diff = expiresAt - now;

      if (diff <= 0) {
        setPaymentStatus('expired');
        setTimeRemaining('Expirado');
        if (pollingInterval) clearInterval(pollingInterval);
        onError?.('Pagamento expirado');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [paymentData, pollingInterval, onError]);

  // Poll payment status
  useEffect(() => {
    if (!paymentData || paymentStatus !== 'pending') return;

    const checkStatus = async () => {
      try {
        setPaymentStatus('checking');
        const response = await fetch(
          `/api/stripe/pix/create-payment?payment_intent_id=${paymentData.paymentIntentId}`
        );
        const data = await response.json();

        if (data.success) {
          if (data.status === 'succeeded') {
            setPaymentStatus('succeeded');
            if (pollingInterval) clearInterval(pollingInterval);
            toast({ title: 'Pagamento confirmado! 🎉', variant: 'default' });
            onSuccess?.(paymentData.paymentIntentId);
          } else if (data.status === 'canceled' || data.status === 'failed') {
            setPaymentStatus('failed');
            if (pollingInterval) clearInterval(pollingInterval);
            onError?.('Pagamento falhou');
          } else {
            setPaymentStatus('pending');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setPaymentStatus('pending');
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    setPollingInterval(interval);

    return () => clearInterval(interval);
  }, [paymentData, paymentStatus, onSuccess, onError]);

  const createPixPayment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/pix/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description,
          customerEmail,
          customerName,
          metadata,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Falha ao criar pagamento');
      }

      setPaymentData(data);
      setPaymentStatus('pending');
      toast({ title: 'QR Code gerado com sucesso!' });
    } catch (error) {
      console.error('Error creating Pix payment:', error);
      toast({ title: 'Erro ao gerar QR Code Pix', variant: 'destructive' });
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (!paymentData?.qrCodeText) return;

    try {
      await navigator.clipboard.writeText(paymentData.qrCodeText);
      setCopied(true);
      toast({ title: 'Código Pix copiado!' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying Pix code:', error);
      toast({ title: 'Erro ao copiar código', variant: 'destructive' });
    }
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-8 h-8 text-cyan-500" />
          </motion.div>
          <span className="ml-3 text-lg">Gerando QR Code Pix...</span>
        </CardContent>
      </Card>
    );
  }

  if (!paymentData) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200">
        <CardContent className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>Erro ao carregar pagamento Pix</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-cyan-600">
          Pagar com Pix
        </CardTitle>
        <CardDescription>
          Escaneie o QR Code ou copie o código Pix
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Status */}
        <AnimatePresence mode="wait">
          {paymentStatus === 'succeeded' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
            >
              <div className="flex items-center justify-center text-green-600 mb-2">
                <Check className="w-6 h-6 mr-2" />
                <span className="font-semibold">Pagamento Confirmado!</span>
              </div>
              <p className="text-sm text-green-700">
                Obrigado pela sua compra
              </p>
            </motion.div>
          )}

          {paymentStatus === 'expired' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"
            >
              <div className="flex items-center justify-center text-red-600 mb-2">
                <AlertCircle className="w-6 h-6 mr-2" />
                <span className="font-semibold">QR Code Expirado</span>
              </div>
              <p className="text-sm text-red-700 mb-3">
                O prazo para pagamento expirou
              </p>
              <Button onClick={createPixPayment} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Novo QR Code
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Amount Display */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Valor a pagar</p>
          <p className="text-3xl font-bold text-cyan-600">
            {formatAmount(paymentData.amount)}
          </p>
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        </div>

        {/* QR Code Display */}
        {paymentStatus !== 'succeeded' && paymentStatus !== 'expired' && (
          <>
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-4 rounded-lg border-2 border-cyan-200"
              >
                <img
                  src={paymentData.qrCode}
                  alt="Pix QR Code"
                  className="w-64 h-64"
                />
              </motion.div>
            </div>

            {/* Copy Code Button */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 text-center">
                Ou copie o código Pix:
              </p>
              <Button
                onClick={copyPixCode}
                variant="outline"
                className="w-full"
                disabled={!paymentData.qrCodeText}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Código Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Código Pix
                  </>
                )}
              </Button>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>Expira em: {timeRemaining}</span>
            </div>

            {/* Status Indicator */}
            {paymentStatus === 'checking' && (
              <div className="flex items-center justify-center text-sm text-cyan-600">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                <span>Verificando pagamento...</span>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        {paymentStatus !== 'succeeded' && paymentStatus !== 'expired' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">
              Como pagar com Pix:
            </h4>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Abra o app do seu banco</li>
              <li>Escolha pagar com Pix QR Code</li>
              <li>Escaneie o código acima</li>
              <li>Confirme o pagamento</li>
            </ol>
            <p className="text-xs text-blue-700 mt-3 italic">
              O pagamento será confirmado automaticamente em alguns segundos.
            </p>
          </div>
        )}

        {/* Cancel Button */}
        {paymentStatus !== 'succeeded' && onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full text-gray-600"
          >
            Cancelar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
