# SV Lentes - API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the SV Lentes healthcare platform. The APIs handle payment processing, customer support, user management, and compliance operations.

## 🔐 Authentication & Security

### Security Headers
All API responses include comprehensive security headers:
- **HSTS**: Strict-Transport-Security with preload
- **CSP**: Content Security Policy optimized for integrations
- **X-Frame-Options**: SAMEORIGIN
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: enabled with block mode

### Rate Limiting
- Sensitive endpoints have rate limiting applied
- Webhook endpoints use token-based authentication
- Payment endpoints require additional validation

---

## 🏥 Core APIs

### Health Check

#### `GET /api/health-check`
Check application health and connectivity.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "asaas": "available",
    "sendpulse": "available"
  },
  "version": "1.0.0"
}
```

---

## 💳 Payment APIs (Asaas Integration)

### Create Payment

#### `POST /api/asaas/create-payment`
Create a new payment or subscription using Asaas API.

**Request Body:**
```typescript
{
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    address?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
  paymentInfo: {
    value: number;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    dueDate?: string;
    description?: string;
    installmentCount?: number;
    installmentValue?: number;
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
  };
  subscriptionInfo?: {
    cycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
    nextDueDate: string;
    value: number;
    description?: string;
    maxPayments?: number;
  };
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    id: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    pixQrCode?: {
      encodedImage: string;
      payload: string;
      expirationDate: string;
    };
    status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED';
    value: number;
    dueDate: string;
  },
  "subscription?: {
    id: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'CANCELED';
    nextPaymentDate: string;
  }
}
```

### Payment Webhook

#### `POST /api/webhooks/asaas`
Handle payment status updates from Asaas.

**Headers:**
- `asaas-access-token`: Webhook token validation

**Request Body:** Asaas webhook payload with payment events

**Events Handled:**
- `PAYMENT_RECEIVED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_OVERDUE`
- `PAYMENT_REFUNDED`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

---

## 💬 WhatsApp & Support APIs

### SendPulse Webhook

#### `POST /api/webhooks/sendpulse`
Handle incoming WhatsApp messages from SendPulse.

**Authentication:**
- SendPulse webhook signature validation

**Request Body:**
```json
{
  "event": "message_new",
  "message": {
    "id": string;
    "from": string;
    "text": string;
    "timestamp": string;
  },
  "contact": {
    "id": string;
    "name": string;
    "phone": string;
  }
}
```

**Processing Flow:**
1. Extract message content and sender information
2. AI-powered intent classification
3. Generate automated response
4. Create support ticket if needed
5. Send response via SendPulse API

### WhatsApp Redirect

#### `GET /api/whatsapp-redirect`
Redirect users to WhatsApp with pre-filled message.

**Query Parameters:**
- `phone`: Phone number (optional, uses default)
- `message`: Pre-filled message (optional)

**Response:**
- HTTP 302 redirect to WhatsApp URL

### Conversation Management

#### `POST /api/whatsapp/conversations`
Create or update WhatsApp conversation.

**Request Body:**
```json
{
  phoneNumber: string;
  message: string;
  intent?: string;
  response?: string;
  escalateToHuman?: boolean;
}
```

#### `GET /api/whatsapp/conversations/[id]`
Retrieve conversation history.

**Response:**
```json
{
  "conversation": {
    id: string;
    phoneNumber: string;
    status: 'ACTIVE' | 'CLOSED' | 'ESCALATED';
    createdAt: string;
    updatedAt: string;
    interactions: [
      {
        id: string;
        type: 'USER' | 'BOT' | 'HUMAN';
        message: string;
        timestamp: string;
        intent?: string;
        confidence?: number;
      }
    ]
  }
}
```

---

## 👤 User Management APIs

### User Profile

#### `GET /api/user/profile`
Get current user profile information.

**Authentication:** Required (session/JWT)

**Response:**
```json
{
  "user": {
    id: string;
    email: string;
    name: string;
    phone: string;
    cpf?: string;
    address?: AddressType;
    subscription?: {
      id: string;
      status: string;
      plan: string;
      nextPayment: string;
    };
    createdAt: string;
  }
}
```

#### `PUT /api/user/profile`
Update user profile information.

**Request Body:**
```json
{
  name?: string;
  phone?: string;
  address?: AddressType;
  preferences?: {
    notifications: boolean;
    language: 'pt-BR' | 'en';
  };
}
```

### Subscription Management

#### `GET /api/user/subscription`
Get user subscription details.

**Response:**
```json
{
  "subscription": {
    id: string;
    status: 'ACTIVE' | 'PAUSED' | 'CANCELED';
    plan: string;
    value: number;
    nextPayment: string;
    deliveryAddress?: AddressType;
    prescriptionStatus: 'VALID' | 'EXPIRED' | 'PENDING';
    createdAt: string;
  }
}
```

#### `POST /api/user/subscription/pause`
Pause subscription temporarily.

**Request Body:**
```json
{
  reason?: string;
  duration?: number; // days, default 30
}
```

#### `POST /api/user/subscription/reactivate`
Reactivate paused subscription.

---

## 📅 Consultation Scheduling

### Schedule Consultation

#### `POST /api/schedule-consultation`
Book medical consultation appointment.

**Request Body:**
```json
{
  userInfo: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  appointmentInfo: {
    preferredDate: string;
    preferredTime: string;
    consultationType: 'FIRST_TIME' | 'FOLLOW_UP' | 'PRESCRIPTION_RENEWAL';
    reason?: string;
  };
  addressInfo?: AddressType;
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    id: string;
    date: string;
    time: string;
    status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED';
    location: string;
    doctor: string;
    instructions: string[];
  }
}
```

### Consultation Status

#### `GET /api/appointments/[id]`
Get appointment details and status.

**Response:**
```json
{
  "appointment": {
    id: string;
    date: string;
    time: string;
    status: string;
    location: string;
    doctor: {
      name: string;
      crm: string;
      specialty: string;
    };
    instructions: string[];
    preparationNotes: string[];
  }
}
```

---

## 🔔 Notification APIs

### Send Notification

#### `POST /api/notifications/send`
Send notification to user via specified channel.

**Request Body:**
```json
{
  userId: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  type: 'PAYMENT_CONFIRMED' | 'APPOINTMENT_REMINDER' | 'DELIVERY_UPDATE' | 'MARKETING';
  title: string;
  message: string;
  data?: object; // additional data for templates
}
```

### Notification Preferences

#### `GET /api/notifications/preferences`
Get user notification preferences.

#### `PUT /api/notifications/preferences`
Update notification preferences.

**Request Body:**
```json
{
  email: {
    marketing: boolean;
    appointments: boolean;
    payments: boolean;
    deliveries: boolean;
  };
  whatsapp: {
    support: boolean;
    appointments: boolean;
    payments: boolean;
    deliveries: boolean;
  };
  sms: {
    urgent: boolean;
    appointments: boolean;
  };
}
```

---

## 🔒 Privacy & Compliance APIs (LGPD)

### Consent Management

#### `POST /api/privacy/consent-log`
Log user consent for data processing.

**Request Body:**
```json
{
  userId: string;
  consentType: 'DATA_PROCESSING' | 'MARKETING' | 'COMMUNICATIONS' | 'ANALYTICS';
  granted: boolean;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  documentId?: string; // privacy policy version
}
```

### Data Access Request

#### `POST /api/privacy/data-request`
Request access to or deletion of personal data.

**Request Body:**
```json
{
  requestType: 'ACCESS' | 'DELETION' | 'CORRECTION' | 'PORTABILITY';
  userId: string;
  email: string;
  cpf: string;
  reason?: string;
  specificData?: string[]; // specific data categories
}
```

**Response:**
```json
{
  "requestId": string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  estimatedCompletion: string;
  instructions: string[];
}
```

### Consent Status

#### `GET /api/privacy/consents/[userId]`
Get user consent history and status.

**Response:**
```json
{
  "consents": [
    {
      id: string;
      consentType: string;
      granted: boolean;
      timestamp: string;
      ipAddress: string;
      documentVersion: string;
    }
  ],
  "currentStatus: {
    dataProcessing: boolean;
    marketing: boolean;
    communications: boolean;
    analytics: boolean;
  }
}
```

---

## 📊 Monitoring & Analytics APIs

### Performance Metrics

#### `GET /api/monitoring/performance`
Get application performance metrics.

**Response:**
```json
{
  "metrics": {
    "responseTime": number; // ms
    "throughput": number; // requests/second
    "errorRate": number; // percentage
    "activeUsers": number;
    "databaseConnections": number;
    "memoryUsage": number; // MB
    "cpuUsage": number; // percentage
  },
  "timestamp": string;
  "period": "1h" | "24h" | "7d" | "30d";
}
```

### Error Logs

#### `GET /api/monitoring/errors`
Get recent error logs.

**Query Parameters:**
- `severity`: `error` | `warning` | `info`
- `limit`: number of entries (default 100)
- `since`: ISO date string

**Response:**
```json
{
  "errors": [
    {
      id: string;
      severity: string;
      message: string;
      stack: string;
      timestamp: string;
      userId?: string;
      requestId?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ]
}
```

### Business Metrics

#### `GET /api/monitoring/metrics`
Get business and operational metrics.

**Response:**
```json
{
  "metrics": {
    "subscriptions": {
      active: number;
      new: number;
      churned: number;
      churnRate: number;
    },
    "payments": {
      successful: number;
      failed: number;
      refunded: number;
      revenue: number;
    },
    "support": {
      ticketsCreated: number;
      ticketsResolved: number;
      averageResolutionTime: number;
      customerSatisfaction: number;
    },
    "consultations": {
      scheduled: number;
      completed: number;
      cancelled: number;
      noShow: number;
    }
  },
  "period": string;
}
```

---

## 🛠️ Configuration APIs

### System Status

#### `GET /api/config/status`
Get system configuration and status.

**Response:**
```json
{
  "system": {
    version: string;
    environment: 'development' | 'staging' | 'production';
    uptime: number; // seconds
    deployedAt: string;
  },
  "features": {
    payments: boolean;
    whatsapp: boolean;
    scheduling: boolean;
    analytics: boolean;
  },
  "integrations": {
    asaas: 'connected' | 'disconnected' | 'error';
    sendpulse: 'connected' | 'disconnected' | 'error';
    database: 'connected' | 'disconnected' | 'error';
  }
}
```

### Feature Flags

#### `GET /api/config/features`
Get current feature flag configuration.

**Response:**
```json
{
  "features": {
    newPaymentFlow: boolean;
    aiSupport: boolean;
    analyticsTracking: boolean;
    betaFeatures: boolean;
  }
}
```

---

## 📋 Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Authentication required or invalid
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMITED`: Too many requests
- `EXTERNAL_SERVICE_ERROR`: Third-party API failure
- `INTERNAL_ERROR`: Server error

---

## 🔧 Development & Testing

### Local Development
- API routes available at `http://localhost:3000/api/*`
- Use `.env.local` for environment variables
- Enable debug mode with `DEBUG=true`

### Testing Endpoints
```bash
# Health check
curl http://localhost:3000/api/health-check

# Create payment (sandbox)
curl -X POST http://localhost:3000/api/asaas/create-payment \
  -H "Content-Type: application/json" \
  -d '{"customerInfo":{"name":"Test User"...}}'
```

### Webhook Testing
- Use ngrok or similar for local webhook testing
- Configure webhook URLs in Asaas/SendPulse dashboards
- Validate webhook signatures in development

This API documentation provides comprehensive coverage of all endpoints in the SV Lentes platform, ensuring developers have the information needed to integrate with and extend the healthcare subscription service.