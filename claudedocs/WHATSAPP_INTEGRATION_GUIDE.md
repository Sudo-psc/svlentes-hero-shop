# 📱 WhatsApp Integration Guide

> **Complete guide for WhatsApp Business integration in SV Lentes**
> **Author**: Dr. Philipe Saraiva Cruz
> **Date**: 2025-10-24
> **Version**: 1.0.0

---

## Overview

The SV Lentes platform integrates with WhatsApp Business to provide contextual, personalized customer support. The integration supports multiple contexts and automatically pre-fills messages based on user state.

**WhatsApp Numbers**:
- **Chatbot (SendPulse)**: +55 33 99989-8026 (automated responses)
- **Direct Support**: +55 33 98606-1427 (human assistance)

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User Action (Click WhatsApp Button)                   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  FloatingWhatsAppButton Component                      │
│  - Detect current context                              │
│  - Gather user data                                     │
│  - Call WhatsApp redirect API                          │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  GET /api/whatsapp-redirect                            │
│  - Validate context                                     │
│  - Fetch user/subscription data                        │
│  - Generate contextual message                         │
│  - Return WhatsApp link                                │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  WhatsApp Web/App Opens                                │
│  - Pre-filled message                                   │
│  - User can edit before sending                        │
│  - Connect to appropriate number                       │
└─────────────────────────────────────────────────────────┘
```

---

## Available Contexts

### 1. Renewal Context

**Trigger**: Subscription expiring within 7 days

**Message Template**:
```
Olá! Gostaria de renovar minha assinatura.

*Dados da Assinatura:*
Plano: {planName}
Vencimento: {renewalDate}
Assinante: {userName}

Gostaria de informações sobre renovação.
```

**Example API Call**:
```typescript
const link = await generateWhatsAppLink('renewal', {
  userId: 'usr_123',
  subscriptionId: 'sub_abc456'
})
```

---

### 2. Support Context

**Trigger**: General support inquiries

**Message Template**:
```
Olá! Preciso de ajuda com minha assinatura.

*Assinante:* {userName}
*Email:* {userEmail}

Como posso ajudar você hoje?
```

**Example API Call**:
```typescript
const link = await generateWhatsAppLink('support', {
  userId: 'usr_123'
})
```

---

### 3. Delivery Context

**Trigger**: Active delivery in progress

**Message Template**:
```
Olá! Gostaria de informações sobre minha entrega.

*Rastreamento:*
Código: {trackingCode}
Pedido: {orderNumber}
Status: {deliveryStatus}
Previsão: {estimatedDelivery}

Você pode me atualizar sobre a entrega?
```

**Example API Call**:
```typescript
const link = await generateWhatsAppLink('delivery', {
  orderId: 'ord_789',
  userId: 'usr_123'
})
```

---

### 4. Payment Context

**Trigger**: Overdue payment or payment questions

**Message Template**:
```
Olá! Tenho uma dúvida sobre pagamento.

*Fatura:*
Valor: R$ {amount}
Vencimento: {dueDate}
Método: {paymentMethod}
Status: {paymentStatus}

Preciso de ajuda com este pagamento.
```

**Example API Call**:
```typescript
const link = await generateWhatsAppLink('payment', {
  userId: 'usr_123',
  subscriptionId: 'sub_abc456'
})
```

---

## Component Integration

### FloatingWhatsAppButton

**Basic Usage**:
```tsx
import { FloatingWhatsAppButton } from '@/components/assinante/FloatingWhatsAppButton'

<FloatingWhatsAppButton
  context="support"
  userData={{
    name: user.name,
    email: user.email,
    subscriptionId: subscription.id
  }}
/>
```

**Props Interface**:
```typescript
interface FloatingWhatsAppButtonProps {
  context?: 'renewal' | 'support' | 'delivery' | 'payment'
  userData?: {
    name?: string
    email?: string
    phone?: string
    subscriptionId?: string
    orderId?: string
  }
  customMessage?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  showOnMobile?: boolean
  showOnDesktop?: boolean
}
```

**Smart Context Detection**:
```tsx
const WhatsAppButtonWithContext = () => {
  const { subscription, activeDelivery } = useSubscription()

  // Auto-detect optimal context
  const context = useMemo(() => {
    if (activeDelivery) return 'delivery'
    if (subscription.daysUntilRenewal <= 7) return 'renewal'
    if (subscription.hasOverduePayment) return 'payment'
    return 'support'
  }, [subscription, activeDelivery])

  return (
    <FloatingWhatsAppButton
      context={context}
      userData={{
        name: subscription.user.name,
        subscriptionId: subscription.id,
        orderId: activeDelivery?.id
      }}
    />
  )
}
```

---

## API Reference

### POST /api/whatsapp-redirect

**Request Body**:
```typescript
{
  context: 'renewal' | 'support' | 'delivery' | 'payment' | 'hero' | 'pricing' | 'consultation' | 'calculator' | 'emergency',
  userData?: {
    nome?: string
    email?: string
    whatsapp?: string
  },
  contextData: {
    page: string              // Required: Current page path
    section?: string          // Optional: Page section
    planInterest?: string     // Optional: Interested plan
    calculatedEconomy?: number // Optional: Calculator result
    customMessage?: string    // Optional: Additional message (max 500 chars)
  },
  trackingData?: {
    source?: string
    medium?: string
    campaign?: string
    sessionId?: string
  }
}
```

**Response**:
```typescript
{
  success: true,
  whatsappLink: string,
  message: {
    preview: string,          // First 100 chars
    context: string,          // Context title
    fullMessage: string       // Complete message
  },
  attendance: {
    isBusinessHours: boolean,
    nextAvailableTime: string | null,
    message: string
  },
  metadata: {
    timestamp: string,
    context: string,
    page: string,
    hasUserData: boolean,
    messageLength: number
  }
}
```

**Example Usage**:
```typescript
const generateLink = async () => {
  const response = await fetch('/api/whatsapp-redirect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: 'renewal',
      userData: {
        nome: 'Maria Silva',
        email: 'maria@example.com'
      },
      contextData: {
        page: '/area-assinante/dashboard',
        planInterest: 'Plano Premium'
      }
    })
  })

  const { whatsappLink } = await response.json()
  window.open(whatsappLink, '_blank')
}
```

---

### GET /api/whatsapp-redirect

**Query Parameters**:
```
?context=support
&include_messages=true  // Include message templates in response
```

**Response**:
```typescript
{
  success: true,
  attendance: {
    isBusinessHours: boolean,
    businessHours: {
      start: 8,
      end: 18,
      timezone: 'America/Sao_Paulo'
    }
  },
  contexts: Array<{
    id: string,
    title: string,
    message?: string  // If include_messages=true
  }>,
  whatsappNumber: string,
  metadata: {
    timestamp: string,
    totalContexts: number
  }
}
```

---

## Business Hours Detection

**Business Hours**: Monday-Friday, 8:00 AM - 6:00 PM (Brasília Time)

**Implementation**:
```typescript
const isBusinessHours = () => {
  const now = new Date()
  const brazilTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    weekday: 'short'
  }).format(now)

  const hour = new Date().getHours()
  const day = new Date().getDay()

  // Monday-Friday (1-5), 8 AM - 6 PM
  return day >= 1 && day <= 5 && hour >= 8 && hour < 18
}
```

**User Feedback**:
```tsx
{attendance.isBusinessHours ? (
  <span className="text-green-600">
    ✅ Atendimento disponível agora
  </span>
) : (
  <span className="text-yellow-600">
    ⏰ Fora do horário comercial. Responderemos em breve!
  </span>
)}
```

---

## Message Customization

### Adding Custom Messages

```typescript
const link = await generateWhatsAppLink('support', {
  userId: 'usr_123'
}, {
  customMessage: 'Estou com dificuldade para fazer login no dashboard.'
})
```

**Resulting Message**:
```
Olá! Preciso de ajuda com minha assinatura.

*Assinante:* Maria Silva
*Email:* maria@example.com

--- Mensagem adicional ---
Estou com dificuldade para fazer login no dashboard.
```

---

### Dynamic Data Injection

**Template Variables**:
- `{userName}` - User's full name
- `{userEmail}` - User's email
- `{planName}` - Subscription plan name
- `{renewalDate}` - Next renewal date (formatted)
- `{trackingCode}` - Delivery tracking code
- `{orderNumber}` - Order number
- `{amount}` - Payment amount (formatted)
- `{dueDate}` - Payment due date

**Example Template Engine**:
```typescript
const replacePlaceholders = (template: string, data: any): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] || match
  })
}

const message = replacePlaceholders(
  'Olá {userName}! Seu pedido {orderNumber} está a caminho.',
  {
    userName: 'Maria Silva',
    orderNumber: 'SV-2025-001234'
  }
)
// Result: "Olá Maria Silva! Seu pedido SV-2025-001234 está a caminho."
```

---

## Troubleshooting

### Issue: WhatsApp link not opening

**Possible Causes**:
1. Browser blocking popups
2. Invalid phone number format
3. URL encoding issues

**Solution**:
```typescript
// Use user gesture event
const handleClick = async (e: React.MouseEvent) => {
  e.preventDefault()

  const link = await generateWhatsAppLink('support', userData)

  // Try to open, fallback to manual copy
  const newWindow = window.open(link, '_blank')

  if (!newWindow || newWindow.closed) {
    // Popup blocked - show manual link
    setManualLink(link)
    setShowCopyModal(true)
  }
}
```

---

### Issue: Message not pre-filled

**Possible Causes**:
1. URL too long (>2000 chars)
2. Special characters not encoded
3. WhatsApp app version too old

**Solution**:
```typescript
// Truncate long messages
const truncateMessage = (message: string, maxLength = 1500): string => {
  if (message.length <= maxLength) return message

  return message.substring(0, maxLength) + '\n\n[mensagem truncada]'
}

// Proper URL encoding
const encoded Message = encodeURIComponent(truncateMessage(message))
```

---

### Issue: Wrong WhatsApp number

**Diagnosis**:
```bash
# Check environment variables
echo $NEXT_PUBLIC_WHATSAPP_NUMBER
# Expected: 5533999898026
```

**Solution**:
```typescript
// In .env.local
NEXT_PUBLIC_WHATSAPP_NUMBER=5533999898026

// Verify in code
console.log('WhatsApp Number:', process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)
```

---

## Best Practices

### 1. Context Selection

**DO**:
- Detect context automatically when possible
- Prioritize urgent contexts (payment, delivery)
- Provide fallback to general support

**DON'T**:
- Force users into wrong context
- Require manual context selection
- Use overly specific contexts

---

### 2. Message Length

**DO**:
- Keep messages under 500 characters
- Use bullet points for clarity
- Include only essential information

**DON'T**:
- Send walls of text
- Include unnecessary details
- Repeat information

---

### 3. User Privacy

**DO**:
- Only include necessary user data
- Obfuscate sensitive information
- Get consent for data sharing

**DON'T**:
- Include passwords or payment details
- Share personal data without consent
- Log sensitive information

---

## Analytics & Tracking

### Event Tracking

```typescript
// Track WhatsApp button clicks
const trackWhatsAppClick = (context: string) => {
  // Google Analytics
  gtag('event', 'whatsapp_click', {
    context,
    page: window.location.pathname,
    timestamp: new Date().toISOString()
  })

  // Custom analytics endpoint
  fetch('/api/whatsapp-redirect', {
    method: 'PUT',
    body: JSON.stringify({
      context,
      page: window.location.pathname,
      action: 'click',
      userData: {
        hasName: !!userData.name,
        hasEmail: !!userData.email,
        hasPhone: !!userData.phone
      }
    })
  })
}
```

### Metrics to Monitor

- **Click Rate**: WhatsApp button clicks / page views
- **Context Distribution**: Most/least used contexts
- **Conversion Rate**: Clicks / support tickets created
- **Response Time**: Time from click to agent response

---

**Author**: Dr. Philipe Saraiva Cruz (CRM-MG 69.870)
**Last Updated**: 2025-10-24
