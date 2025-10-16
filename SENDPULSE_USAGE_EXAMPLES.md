# SendPulse Integration - Usage Examples

## Frontend Usage

### Example 1: Send Simple Message

```typescript
import { sendWhatsAppMessage } from '@/lib/sendpulse-client';

async function handleSendMessage() {
  try {
    const result = await sendWhatsAppMessage({
      phone: '5511999999999',
      message: 'Olá! Gostaria de saber mais sobre os planos.'
    });
    
    console.log('Message sent:', result.messageId);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}
```

### Example 2: Send Contextual Message (Lead Form)

```typescript
'use client';

import { useState } from 'react';
import { sendWhatsAppMessage } from '@/lib/sendpulse-client';

export function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const nome = formData.get('nome') as string;
    const email = formData.get('email') as string;
    const whatsapp = formData.get('whatsapp') as string;

    try {
      // Send message via SendPulse
      await sendWhatsAppMessage({
        phone: whatsapp,
        context: 'hero',
        userData: { nome, email, whatsapp },
        contextData: {
          page: 'home',
          section: 'hero-form'
        }
      });

      alert('Mensagem enviada com sucesso! Logo entraremos em contato.');
    } catch (error) {
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="nome" placeholder="Nome" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="whatsapp" placeholder="WhatsApp" required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
```

### Example 3: Calculator with WhatsApp Integration

```typescript
'use client';

import { useState } from 'react';
import { sendWhatsAppMessage } from '@/lib/sendpulse-client';

export function EconomyCalculator() {
  const [economy, setEconomy] = useState(0);
  const [userData, setUserData] = useState({ nome: '', whatsapp: '' });

  async function handleSendResults() {
    try {
      await sendWhatsAppMessage({
        phone: userData.whatsapp,
        context: 'calculator',
        userData: {
          nome: userData.nome,
          whatsapp: userData.whatsapp
        },
        contextData: {
          page: 'calculator',
          calculatedEconomy: economy
        }
      });

      alert('Resultado enviado para seu WhatsApp!');
    } catch (error) {
      alert('Erro ao enviar. Tente novamente.');
    }
  }

  return (
    <div>
      {/* Calculator UI */}
      <div>Economia calculada: R$ {economy.toFixed(2)}</div>
      
      {economy > 0 && (
        <div>
          <input 
            placeholder="Nome"
            value={userData.nome}
            onChange={(e) => setUserData({ ...userData, nome: e.target.value })}
          />
          <input 
            placeholder="WhatsApp"
            value={userData.whatsapp}
            onChange={(e) => setUserData({ ...userData, whatsapp: e.target.value })}
          />
          <button onClick={handleSendResults}>
            Receber no WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
```

### Example 4: Pricing Page - Direct WhatsApp

```typescript
'use client';

import { sendWhatsAppMessage } from '@/lib/sendpulse-client';

export function PricingCard({ plan }: { plan: string }) {
  async function handleInterest() {
    const nome = prompt('Qual seu nome?');
    const whatsapp = prompt('Qual seu WhatsApp?');
    
    if (!nome || !whatsapp) return;

    try {
      await sendWhatsAppMessage({
        phone: whatsapp,
        context: 'pricing',
        userData: { nome, whatsapp },
        contextData: {
          page: 'pricing',
          planInterest: plan
        }
      });

      alert('Mensagem enviada! Entraremos em contato em breve.');
    } catch (error) {
      alert('Erro ao enviar. Tente novamente.');
    }
  }

  return (
    <div className="pricing-card">
      <h3>{plan}</h3>
      <button onClick={handleInterest}>
        Tenho Interesse
      </button>
    </div>
  );
}
```

## Backend Usage (Server Actions)

### Example 5: Server Action for Sending Messages

```typescript
'use server';

import { getSendPulseClient } from '@/lib/sendpulse';
import { z } from 'zod';

const leadSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().min(10),
});

export async function submitLead(formData: FormData) {
  const data = {
    nome: formData.get('nome') as string,
    email: formData.get('email') as string,
    whatsapp: formData.get('whatsapp') as string,
  };

  const validatedData = leadSchema.parse(data);

  // Save to database first
  // ... database logic ...

  // Send WhatsApp message via SendPulse
  try {
    const client = getSendPulseClient();
    
    const message = `Olá ${validatedData.nome}! 👋

Obrigado pelo interesse na SV Lentes!

Recebemos seu contato e em breve um de nossos consultores entrará em contato para:
✓ Esclarecer suas dúvidas
✓ Apresentar nossos planos
✓ Agendar sua primeira consulta

Horário de atendimento: Segunda a Sexta, 8h às 18h

Até breve! 😊`;

    await client.sendTextMessage(validatedData.whatsapp, message);

    return { success: true };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return { 
      success: false, 
      error: 'Cadastro realizado, mas não foi possível enviar WhatsApp' 
    };
  }
}
```

### Example 6: API Route Handler

```typescript
// app/api/consultation/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSendPulseClient } from '@/lib/sendpulse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerPhone, date, time } = body;

    const client = getSendPulseClient();

    // Send confirmation message
    await client.sendTextMessage(
      customerPhone,
      `✅ Consulta agendada com sucesso!

📅 Data: ${date}
🕐 Horário: ${time}
👨‍⚕️ Dr. Philipe Saraiva Cruz

📍 Local: [endereço da clínica]

Lembre-se de trazer:
• Documento com foto
• Receita anterior (se tiver)
• Histórico médico

Até lá! 😊`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error scheduling consultation:', error);
    return NextResponse.json(
      { error: 'Failed to schedule consultation' },
      { status: 500 }
    );
  }
}
```

## Advanced Usage

### Example 7: Template Messages (Requires SendPulse Template Setup)

```typescript
import { getSendPulseClient } from '@/lib/sendpulse';

async function sendAppointmentReminder(
  customerPhone: string,
  customerName: string,
  appointmentDate: string,
  appointmentTime: string
) {
  const client = getSendPulseClient();

  // Send template message
  await client.sendTemplateMessage(
    customerPhone,
    'appointment_reminder', // Template ID from SendPulse
    {
      customer_name: customerName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      doctor_name: 'Dr. Philipe Saraiva Cruz'
    }
  );
}
```

### Example 8: Batch Messages

```typescript
import { getSendPulseClient } from '@/lib/sendpulse';

async function sendBulkMessages(customers: Array<{ phone: string; name: string }>) {
  const client = getSendPulseClient();

  const results = await Promise.allSettled(
    customers.map(async (customer) => {
      return client.sendTextMessage(
        customer.phone,
        `Olá ${customer.name}! Nova promoção SV Lentes: 20% OFF em planos anuais! 🎉`
      );
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Sent: ${successful}, Failed: ${failed}`);
}
```

### Example 9: Error Handling and Retry

```typescript
import { getSendPulseClient } from '@/lib/sendpulse';

async function sendMessageWithRetry(
  phone: string,
  message: string,
  maxRetries = 3
) {
  const client = getSendPulseClient();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.sendTextMessage(phone, message);
      
      if (response.result) {
        console.log(`Message sent on attempt ${attempt}`);
        return response;
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw new Error(`Failed to send message after ${maxRetries} attempts: ${lastError?.message}`);
}
```

## Testing Examples

### Example 10: Unit Test with Mock

```typescript
// __tests__/sendpulse-integration.test.ts
import { sendWhatsAppMessage } from '@/lib/sendpulse-client';

// Mock fetch
global.fetch = jest.fn();

describe('SendPulse Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send message successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        messageId: 'msg_123',
        status: 'sent'
      })
    });

    const result = await sendWhatsAppMessage({
      phone: '5511999999999',
      message: 'Test'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_123');
  });

  it('should handle errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid phone' })
    });

    await expect(
      sendWhatsAppMessage({
        phone: 'invalid',
        message: 'Test'
      })
    ).rejects.toThrow('Invalid phone');
  });
});
```

## Environment-Specific Usage

### Development
```typescript
// Use test phone number
const phone = process.env.NODE_ENV === 'production' 
  ? customerPhone 
  : process.env.TEST_PHONE_NUMBER || '5511999999999';
```

### Production with Monitoring
```typescript
import { getSendPulseClient } from '@/lib/sendpulse';
import { trackEvent } from '@/lib/analytics';

async function sendWithMonitoring(phone: string, message: string) {
  const startTime = Date.now();
  
  try {
    const client = getSendPulseClient();
    const result = await client.sendTextMessage(phone, message);
    
    const duration = Date.now() - startTime;
    
    trackEvent('whatsapp_message_sent', {
      duration_ms: duration,
      message_length: message.length,
      success: result.result
    });
    
    return result;
  } catch (error) {
    trackEvent('whatsapp_message_failed', {
      error: (error as Error).message
    });
    throw error;
  }
}
```

## Best Practices

1. **Always validate phone numbers** before sending
2. **Use contextual messages** instead of generic ones
3. **Handle errors gracefully** with user-friendly messages
4. **Log all interactions** for debugging and analytics
5. **Respect rate limits** - don't spam customers
6. **Test in development** before deploying to production
7. **Monitor delivery status** via webhooks
8. **Keep messages concise** and actionable
9. **Include unsubscribe option** for marketing messages
10. **Follow LGPD/GDPR** compliance for data protection
