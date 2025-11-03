'use client';

import { useState } from 'react';
import { PixPayment } from '@/components/payment/PixPayment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

/**
 * Example page demonstrating Stripe Pix payment integration
 *
 * This is a demo page showing how to use the PixPayment component
 * for accepting Pix payments via Stripe in Brazil.
 *
 * Remove this file in production or protect it with authentication.
 */
export default function PixPaymentExamplePage() {
  const { toast } = useToast();
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState({
    amount: '5000', // R$ 50.00 in cents
    description: 'Teste de Pagamento Pix',
    customerEmail: 'cliente@example.com',
    customerName: 'Cliente Teste',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatePayment = () => {
    // Validate inputs
    if (!formData.customerEmail || !formData.customerName || !formData.amount) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    const amountNum = parseInt(formData.amount, 10);
    if (isNaN(amountNum) || amountNum < 100) {
      toast({ title: 'Valor mínimo de R$ 1,00 (100 centavos)', variant: 'destructive' });
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Payment successful!', paymentIntentId);
    toast({ title: 'Pagamento confirmado! 🎉' });
    // Redirect to success page or update UI
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast({ title: `Erro: ${error}`, variant: 'destructive' });
    setShowPayment(false);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    toast({ title: 'Pagamento cancelado' });
  };

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <PixPayment
          amount={parseInt(formData.amount, 10)}
          description={formData.description}
          customerEmail={formData.customerEmail}
          customerName={formData.customerName}
          metadata={{
            source: 'example_page',
            environment: process.env.NODE_ENV || 'development',
          }}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Stripe Pix Payment - Example
            </CardTitle>
            <CardDescription className="text-center">
              Demonstração de integração de pagamento via Pix usando Stripe
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">
              ℹ️ Sobre esta implementação
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Modo de Teste:</strong> Esta página usa o modo de teste do Stripe.
              Nenhum pagamento real será processado.
            </p>
            <p>
              <strong>QR Code de Teste:</strong> O QR Code gerado é válido apenas em ambiente
              de teste e não pode ser usado para pagamentos reais.
            </p>
            <p>
              <strong>Webhooks:</strong> Eventos de pagamento são enviados para{' '}
              <code className="bg-blue-100 px-1 rounded">/api/webhooks/stripe</code>
            </p>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Pagamento</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para gerar um QR Code Pix
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Valor (em centavos) *
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="100"
                step="100"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="5000 (= R$ 50,00)"
              />
              <p className="text-xs text-gray-500">
                Valor atual:{' '}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(parseInt(formData.amount || '0', 10) / 100)}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição do Pagamento *
              </Label>
              <Input
                id="description"
                name="description"
                type="text"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Ex: Assinatura Mensal"
              />
            </div>

            {/* Customer Email */}
            <div className="space-y-2">
              <Label htmlFor="customerEmail">
                Email do Cliente *
              </Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleInputChange}
                placeholder="cliente@example.com"
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Nome do Cliente *
              </Label>
              <Input
                id="customerName"
                name="customerName"
                type="text"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="João da Silva"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleCreatePayment}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              size="lg"
            >
              Gerar QR Code Pix
            </Button>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como Usar em Produção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Configurar Variáveis de Ambiente</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_APP_URL=https://svlentes.com.br`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Importar o Componente</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import { PixPayment } from '@/components/payment/PixPayment';

<PixPayment
  amount={5000}
  description="Assinatura Mensal"
  customerEmail="user@example.com"
  customerName="João Silva"
  onSuccess={(paymentIntentId) => {
    // Redirecionar para página de sucesso
    router.push(\`/success?payment=\${paymentIntentId}\`);
  }}
  onError={(error) => {
    // Mostrar mensagem de erro
    toast.error(error);
  }}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Configurar Webhooks no Stripe</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Acesse o Dashboard do Stripe</li>
                <li>Vá em Developers → Webhooks</li>
                <li>
                  Adicione endpoint:{' '}
                  <code className="bg-gray-200 px-1 rounded">
                    https://svlentes.com.br/api/webhooks/stripe
                  </code>
                </li>
                <li>Eventos a escutar: payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Testar em Modo Sandbox</h4>
              <p className="text-gray-700">
                Use chaves de teste do Stripe para validar o fluxo antes de ir para produção.
                O Stripe CLI permite simular webhooks localmente:
              </p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto mt-2">
{`stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
