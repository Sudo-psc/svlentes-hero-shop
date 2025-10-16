# 🏗️ LangGraph Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Customer (WhatsApp)                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ Message
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    WhatsApp Cloud API (Meta)                        │
│                         - Message Gateway                            │
│                         - Webhook Delivery                           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ POST /api/whatsapp/support
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       Next.js API Route                             │
│                  (Webhook Handler & Router)                         │
│                                                                      │
│  1. Verify webhook signature                                        │
│  2. Extract message content                                         │
│  3. Retrieve conversation history                                   │
│  4. Call LangGraph agent                                            │
│  5. Send response via WhatsApp                                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
                 ↓               ↓               ↓
    ┌────────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Memory       │  │  LangGraph   │  │  WhatsApp    │
    │   Manager      │  │    Agent     │  │    Client    │
    └────────────────┘  └──────────────┘  └──────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ↓            ↓            ↓
           ┌──────────────┬──────────┬──────────────┐
           │  GPT-4o-mini │  Tools   │ Knowledge    │
           │   (OpenAI)   │          │    Base      │
           └──────────────┴──────────┴──────────────┘
```

## Component Breakdown

### 1. WhatsApp Cloud API (Meta)

**Responsibilities:**
- Receive customer messages
- Deliver via webhook
- Send responses back to customer
- Handle media (images, audio, docs)
- Manage delivery receipts

**Configuration:**
- Webhook URL: `https://svlentes.com.br/api/whatsapp/support`
- Events: `messages`, `message_status`

### 2. API Route Handler

**File:** `src/app/api/whatsapp/support/route.ts`

**Flow:**
```typescript
1. Receive webhook POST
2. Verify signature (security)
3. Extract message:
   - Customer phone
   - Message content
   - Message type
4. Get conversation history from Memory
5. Process with LangGraph Agent
6. Store response in Memory
7. Send via WhatsApp Client
8. Handle errors with fallback
```

**Endpoints:**
- `GET /api/whatsapp/support` - Webhook verification
- `POST /api/whatsapp/support` - Message processing

### 3. LangGraph Agent

**File:** `src/lib/langgraph/agent.ts`

**Architecture:**
```
┌─────────────────────────────────────┐
│         LangGraph Agent             │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      System Prompt           │  │
│  │  - Company info              │  │
│  │  - Behavior rules            │  │
│  │  - Escalation criteria       │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │         GPT-4o-mini          │  │
│  │   (Chat Language Model)      │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │           Tools              │  │
│  │  1. search_knowledge_base    │  │
│  │  2. check_order_status       │  │
│  │  3. schedule_consultation    │  │
│  │  4. create_support_ticket    │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │         State Graph          │  │
│  │  START → Agent → Tools → END │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Decision Flow:**
```
User Message
    ↓
Intent Classification
    ↓
Need Tool? ─No→ Generate Response → END
    │
   Yes
    ↓
Select Tool(s)
    ↓
Execute Tool(s)
    ↓
Process Results
    ↓
Generate Response
    ↓
Check Escalation?
    ↓
END
```

### 4. Conversation Memory

**File:** `src/lib/langgraph/memory.ts`

**Data Structure:**
```typescript
Map<CustomerPhone, {
  customerPhone: string
  messages: BaseMessage[]  // [HumanMessage, AIMessage, ...]
  metadata: {
    startedAt: Date
    lastMessageAt: Date
    messageCount: number
    customerName?: string
    escalated: boolean
  }
}>
```

**Operations:**
- `addUserMessage()` - Store customer message
- `addAIMessage()` - Store agent response
- `getConversation()` - Retrieve history
- `markAsEscalated()` - Flag for human
- `clearConversation()` - Remove old data
- `getStats()` - Analytics

**Lifecycle:**
```
New Message
    ↓
Conversation exists?
    │
    ├─ Yes → Load history
    │
    └─ No → Create new conversation
    ↓
Add user message
    ↓
Process with agent
    ↓
Add AI response
    ↓
Update metadata
    ↓
Trim if > 50 messages
    ↓
Auto cleanup after 24h
```

### 5. WhatsApp Client

**File:** `src/lib/langgraph/whatsapp-client.ts`

**Methods:**
```typescript
sendTextMessage(to, message)
    ↓
    POST https://graph.facebook.com/v21.0/{phone_id}/messages
    Body: {
      messaging_product: "whatsapp",
      to: "5511999999999",
      type: "text",
      text: { body: "message" }
    }

sendReaction(to, messageId, emoji)
markAsRead(messageId)
sendButtonMessage(to, text, buttons)
```

**Mock Mode:**
- No credentials? → Log instead of send
- Useful for testing without WhatsApp account

### 6. Tools System

Each tool follows this pattern:

```typescript
const tool = tool(
  async ({ param1, param2 }) => {
    // 1. Validate inputs
    // 2. Execute business logic
    // 3. Return result string
  },
  {
    name: 'tool_name',
    description: 'When to use this tool',
    schema: z.object({
      param1: z.string().describe('What is this'),
      param2: z.number().optional(),
    }),
  }
)
```

**Tool Execution Flow:**
```
Agent determines tool needed
    ↓
Extract parameters from conversation
    ↓
Validate with Zod schema
    ↓
Execute tool function
    ↓
Return result to agent
    ↓
Agent generates natural language response
```

## Data Flow Examples

### Example 1: Simple FAQ

```
Customer: "Como funciona a assinatura?"
    ↓
Webhook → API Route
    ↓
Load conversation: []  (new conversation)
    ↓
LangGraph Agent:
  - Intent: general_inquiry
  - Tool: search_knowledge_base("assinatura")
  - Tool returns: "FAQ answer about subscriptions..."
  - Generate: "Olá! Nossa assinatura funciona assim..."
    ↓
Save to memory: [HumanMessage, AIMessage]
    ↓
Send via WhatsApp
    ↓
Customer receives response
```

### Example 2: Order Tracking

```
Customer: "Onde está meu pedido 12345?"
    ↓
Load conversation: [previous messages...]
    ↓
LangGraph Agent:
  - Intent: order_inquiry
  - Tool: check_order_status("12345")
  - Tool returns: "Pedido em separação"
  - Generate: "Seu pedido #12345 está em separação..."
    ↓
Update memory
    ↓
Send response
```

### Example 3: Escalation

```
Customer: "Quero falar com atendente"
    ↓
LangGraph Agent:
  - Intent: escalation_request
  - Tool: create_support_ticket(...)
  - Tool returns: "Ticket #123 created"
  - Mark: escalationRequired = true
  - Generate: "Entendi! Ticket #123 criado..."
    ↓
Mark conversation as escalated
    ↓
Notify support team (future)
    ↓
Send response
```

## State Management

### Conversation State

```typescript
StateAnnotation {
  messages: BaseMessage[]           // Full conversation
  customerPhone: string             // Customer ID
  customerName: string              // Customer name
  conversationContext: Object       // Metadata
  escalationRequired: boolean       // Flag for human
}
```

### Agent State Transitions

```
START
  ↓
Agent Node
  - Analyze message
  - Decide: Need tool?
  ↓
Conditional Edge
  ├─ Yes → Tools Node
  │          ↓
  │        Agent Node (with tool results)
  │          ↓
  │        Conditional Edge
  │
  └─ No → END
```

## Integration Points

### 1. Existing Systems

```typescript
// Support Ticket Manager
import { supportTicketManager } from '@/lib/support-ticket-manager'
await supportTicketManager.createTicket(...)

// Knowledge Base
import { SupportKnowledgeBase } from '@/lib/support-knowledge-base'
const kb = new SupportKnowledgeBase()
await kb.searchFAQ(query)
```

### 2. Future Integrations

```typescript
// CRM
import { crmClient } from '@/lib/crm'
await crmClient.updateCustomer(...)

// Analytics
import { analytics } from '@/lib/analytics'
await analytics.trackConversation(...)

// Database (Prisma)
import { prisma } from '@/lib/prisma'
await prisma.conversation.create(...)
```

## Error Handling

### Error Flow

```
Error occurs
    ↓
Catch in API route
    ↓
Log error details
    ↓
Send fallback response:
  "Desculpe, problema técnico..."
    ↓
Mark conversation as escalated
    ↓
Notify support team
```

### Retry Logic

```typescript
// In tools
try {
  return await executeOperation()
} catch (error) {
  console.error('Tool failed:', error)
  return 'Error message for agent'
}

// In API route
try {
  result = await agent.process()
} catch (error) {
  result = fallbackResponse()
}
```

## Performance Characteristics

### Latency

| Stage | Time | Can Optimize? |
|-------|------|---------------|
| Webhook receive | <50ms | ✓ CDN |
| Load memory | <10ms | ✓ Redis |
| Agent processing | 1-3s | ✓ Model choice |
| Tool execution | 100-500ms | ✓ Caching |
| WhatsApp send | 200-500ms | ✗ External API |
| **Total** | **2-4s** | |

### Concurrency

- **Memory:** Thread-safe (JavaScript single-threaded)
- **OpenAI API:** 500 req/min default
- **WhatsApp API:** 80 msg/sec
- **Bottleneck:** OpenAI API rate limit

### Scalability

```
1 user/sec    → No problem
10 users/sec   → Fine with current setup
100 users/sec  → Need:
                 - Redis for memory
                 - Queue system (Bull/BullMQ)
                 - Multiple API keys (load balance)
1000 users/sec → Need:
                 - Kubernetes cluster
                 - Dedicated OpenAI org
                 - WhatsApp Business Platform
```

## Security

### Layers

1. **Webhook Signature Verification**
   ```typescript
   const valid = verifySignature(payload, signature, secret)
   if (!valid) throw Error('Invalid signature')
   ```

2. **Environment Variables**
   - API keys in `.env`
   - Never in code
   - `.gitignore` configured

3. **Rate Limiting** (future)
   ```typescript
   if (requestsInMinute > 10) {
     return 'Too many requests'
   }
   ```

4. **Input Sanitization**
   - WhatsApp handles basic sanitization
   - Zod validates tool inputs
   - No SQL injection risk (using Prisma)

## Monitoring Points

### Metrics to Track

1. **Response Time**
   - Webhook → Response sent
   - Target: <5s

2. **Success Rate**
   - Messages processed successfully
   - Target: >99%

3. **Escalation Rate**
   - Conversations escalated to human
   - Target: <20%

4. **Tool Usage**
   - Which tools used most
   - Optimize accordingly

5. **Costs**
   - OpenAI API tokens
   - WhatsApp API conversations

### Logging

```typescript
console.log('Message received:', { phone, message })
console.log('Agent response:', { response, tools, escalation })
console.log('Memory stats:', conversationMemory.getStats())
```

## Summary

The LangGraph implementation provides:

✅ **Intelligent** - Uses GPT-4o-mini for natural conversations  
✅ **Stateful** - Remembers conversation context  
✅ **Extensible** - Easy to add new tools  
✅ **Resilient** - Error handling and fallbacks  
✅ **Scalable** - Can handle growing traffic  
✅ **Cost-effective** - Optimized for low costs  
✅ **Well-tested** - Unit tests covering key functionality  

Ready for production deployment! 🚀
