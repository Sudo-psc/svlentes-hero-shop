# WhatsApp Support Chatbot Implementation Guide

## Overview

This document describes the comprehensive WhatsApp API + LangChain customer support system implemented for SVLentes. The system provides intelligent, automated customer support with seamless escalation to human agents when needed.

## System Architecture

```
Customer WhatsApp → WhatsApp Cloud API → Support Webhook → LangChain Processor → Response Generator → WhatsApp Response
                                                    ↓
                                            Knowledge Base → Intent Classification → Ticket Manager → Escalation System
```

## Components

### 1. Support Knowledge Base (`src/lib/support-knowledge-base.ts`)

**Purpose**: Central repository of FAQ entries, response templates, and support knowledge.

**Key Features**:
- FAQ categorization (10 categories: billing, technical, product, delivery, etc.)
- Response templates for common intents
- Search functionality with caching
- Multi-language support (pt-BR default)
- Confidence scoring for automatic responses

**Usage Example**:
```typescript
const supportKB = new SupportKnowledgeBase()
const faqResults = await supportKB.searchFAQ("como pausar assinatura", FAQCategory.SUBSCRIPTION)
const template = supportKB.getResponseTemplate("subscription_pause")
```

### 2. Support Ticket Manager (`src/lib/support-ticket-manager.ts`)

**Purpose**: Automated ticket creation, assignment, and tracking from WhatsApp conversations.

**Key Features**:
- Automatic ticket creation with priority classification
- Intelligent agent assignment based on specialization
- SLA tracking and compliance
- Ticket numbering system (e.g., "SUB-2024-1234")
- Duplicate ticket detection and merging

**Ticket Categories**:
- Billing (payment issues, invoices)
- Technical (system problems, errors)
- Product (lens information, exchanges)
- Delivery (shipping, tracking)
- Account (login, profile management)
- Emergency (medical issues - CRITICAL priority)

### 3. LangChain Support Processor (`src/lib/langchain-support-processor.ts`)

**Purpose**: AI-powered message analysis and response generation using OpenAI GPT-4.

**Key Features**:
- Intent classification (14+ intent types)
- Entity extraction (sentiment, urgency, emotions)
- Emergency detection
- Escalation decision logic
- Context-aware response generation

**Intent Examples**:
```typescript
{
  name: "subscription_pause",
  category: TicketCategory.BILLING,
  priority: TicketPriority.MEDIUM,
  escalationRequired: false,
  entities: {
    sentiment: "neutral",
    urgency: "medium",
    emotions: ["uncertainty"],
    keywords: ["pausar", "mês", "volta"]
  }
}
```

### 4. Escalation System (`src/lib/support-escalation-system.ts`)

**Purpose**: Intelligent escalation management with human agent handoff.

**Key Features**:
- Automatic escalation triggers
- Agent availability matching
- Performance-based agent scoring
- SLA compliance monitoring
- Emergency notification system

**Escalation Triggers**:
- Customer explicitly requests human agent
- Emergency keywords detected
- Complex issues beyond AI capability
- Negative sentiment with high priority
- Recurring problems

### 5. Support Analytics Dashboard (`src/components/analytics/SupportAnalyticsDashboard.tsx`)

**Purpose**: Real-time monitoring and reporting of support operations.

**Key Features**:
- Ticket volume and resolution metrics
- Response time tracking
- Customer satisfaction analysis
- Agent performance monitoring
- Sentiment analysis visualization
- Export capabilities for reporting

## API Endpoints

### WhatsApp Support Webhook
```
POST /api/whatsapp/support
```

**Purpose**: Main webhook endpoint for WhatsApp Cloud API integration.

**Flow**:
1. Receive incoming WhatsApp message
2. Extract and analyze content
3. Process through LangChain
4. Generate appropriate response
5. Send response back via WhatsApp
6. Create ticket if necessary
7. Handle escalation if needed

### Support Analytics API
```
GET /api/analytics/support?timeRange=7d
```

**Response Example**:
```json
{
  "totalTickets": 234,
  "activeTickets": 12,
  "resolvedTickets": 222,
  "averageResponseTime": 8.5,
  "customerSatisfaction": 4.6,
  "escalationRate": 15.2,
  "firstContactResolution": 78.5,
  "ticketsByPriority": [
    { "priority": "HIGH", "count": 45, "avgResolutionTime": "2h 15m" }
  ],
  "sentimentAnalysis": [
    { "sentiment": "positive", "count": 180, "percentage": 77 }
  ]
}
```

## Configuration

### Environment Variables

```bash
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verification_token

# OpenAI (for LangChain)
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/svlentes_support
```

### Database Schema

The system extends the existing Prisma schema with additional models:

```prisma
model SupportTicket {
  id              String   @id @default(cuid())
  ticketNumber    String   @unique
  userId          String
  customerInfo    Json
  subject         String
  description     String
  category        TicketCategory
  priority        TicketPriority
  status          TicketStatus
  assignedAgentId String?
  escalationId    String?
  createdAt       DateTime @default(now())
  resolvedAt      DateTime?
  customerSatisfaction Float?
}

model Escalation {
  id              String   @id @default(cuid())
  ticketId        String   @unique
  reason          EscalationReason
  priority        TicketPriority
  assignedAgentId String?
  status          EscalationStatus
  createdAt       DateTime @default(now())
  resolvedAt      DateTime?
}

model WhatsAppInteraction {
  id                String   @id @default(cuid())
  messageId         String
  customerPhone     String
  userId            String?
  content           String
  isFromCustomer    Boolean  @default(true)
  intent            String?
  sentiment         String?
  urgency           String?
  response          String?
  escalationRequired Boolean  @default(false)
  ticketCreated     Boolean  @default(false)
  createdAt         DateTime @default(now())
}
```

## Emergency Handling

### Emergency Detection

The system automatically detects emergencies through:
- Keyword analysis (e.g., "dor no olho", "emergência", "visão borrada")
- Urgency classification from LangChain
- Customer-provided emergency indicators

### Emergency Response

1. **Immediate Response**: Send emergency contact information
2. **Direct Contact**: Provide Dr. Philipe's WhatsApp number
3. **Medical Guidance**: Direct to nearest emergency care
4. **Escalation**: Auto-escalate to emergency-specialized agent

**Emergency Response Template**:
```
⚠️ EMERGÊNCIA OFTALMOLÓGICA DETECTADA ⚠️

NÃO ESPERE! PROCURE ATENDIMENTO MÉDICO IMEDIATO:
- Pronto-socorro oftalmológico
- Hospital com serviço de oftalmologia

📞 CONTATO DIRETO DR. PHILIPE:
- WhatsApp: (33) 99898-026
- Disponível 24h para emergências
```

## Agent Management

### Agent Specializations

- **Emergency**: Handles medical emergencies
- **Billing**: Payment and subscription issues
- **Technical**: System problems and errors
- **Product**: Product information and exchanges
- **Delivery**: Shipping and tracking issues
- **Customer Service**: General inquiries and complaints

### Performance Tracking

- Average response time
- Customer satisfaction scores
- Escalation rates
- Ticket resolution rates
- Specialization matching

## Testing and Quality Assurance

### Test Coverage

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: API endpoint testing
3. **End-to-End Tests**: Complete conversation flows
4. **Performance Tests**: Response time and load testing

### Test Scenarios

```typescript
// Emergency detection test
await testEmergencyDetection("Meu olho está doendo muito")

// Intent classification test
await testIntentClassification("Quero cancelar minha assinatura")

// Escalation trigger test
await testEscalationTrigger("Quero falar com um gerente agora!")

// Response generation test
await testResponseGeneration("Como faço para pausar minha assinatura?")
```

## Monitoring and Analytics

### Key Metrics

1. **Response Time**: Average time to first response
2. **Resolution Rate**: Percentage of tickets resolved
3. **Customer Satisfaction**: Average satisfaction scores
4. **Escalation Rate**: Percentage requiring human agent
5. **First Contact Resolution**: Resolved without escalation

### Real-time Monitoring

- Active ticket queue
- Agent availability status
- System health checks
- Emergency alert system

## Integration with Existing Systems

### WhatsApp Cloud API Integration

The system integrates with WhatsApp Cloud API for:
- Incoming message processing
- Outgoing message delivery
- Interactive message templates
- Media message handling

### LangChain Integration

AI processing includes:
- GPT-4 for intent classification
- Custom prompt templates
- Context-aware response generation
- Multi-turn conversation handling

### Database Integration

Persistent storage for:
- Ticket information
- Customer profiles
- Conversation history
- Analytics data

## Deployment Considerations

### Scalability

- Horizontal scaling of API endpoints
- Database connection pooling
- Caching for frequently accessed data
- Load balancing for high traffic

### Security

- API key management
- Data encryption (LGPD compliance)
- Access control and authentication
- Audit logging

### Reliability

- Error handling and retry logic
- Fallback mechanisms
- Health monitoring
- Disaster recovery procedures

## Troubleshooting

### Common Issues

1. **WhatsApp Webhook Not Receiving Messages**
   - Verify webhook URL accessibility
   - Check webhook verification token
   - Confirm WhatsApp Business API configuration

2. **LangChain Processing Errors**
   - Check OpenAI API key validity
   - Verify prompt template formatting
   - Monitor token usage limits

3. **Database Connection Issues**
   - Verify database connection string
   - Check database server status
   - Monitor connection pool usage

4. **Slow Response Times**
   - Monitor API response times
   - Check database query performance
   - Optimize caching strategies

### Monitoring Dashboard

Access the support analytics dashboard at:
```
/admin/support-analytics
```

## Future Enhancements

### Planned Features

1. **Voice Message Transcription**: Convert audio messages to text
2. **Image Analysis**: OCR for product images and documents
3. **Multi-language Support**: Expand beyond Portuguese
4. **Predictive Analytics**: Anticipate customer needs
5. **Proactive Support**: Reach out before issues escalate

### AI Improvements

1. **Fine-tuned Models**: Train on SVLentes-specific data
2. **Enhanced Context**: Better conversation memory
3. **Personalization**: Tailored responses based on history
4. **Proactive Suggestions**: Recommend solutions proactively

## Support and Maintenance

### Daily Operations

- Monitor system health and performance
- Review escalation rates and reasons
- Update knowledge base content
- Analyze customer feedback

### Weekly Tasks

- Generate performance reports
- Review agent performance metrics
- Update FAQ entries based on common issues
- Conduct system maintenance

### Monthly Reviews

- Analyze overall support trends
- Review customer satisfaction scores
- Update training data for AI models
- Plan system improvements

## Contact Information

For technical support or questions about this implementation:

- **Development Team**: [Team contact]
- **Project Manager**: [Manager contact]
- **Emergency Contact**: Dr. Philipe Saraiva Cruz - (33) 99898-026

---

*This document is part of the SVLentes WhatsApp Support System implementation. Last updated: October 2024*