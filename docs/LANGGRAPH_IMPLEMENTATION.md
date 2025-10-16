# 🤖 LangGraph Implementation Guide

## Overview

This document describes the LangGraph implementation for the SVLentes WhatsApp customer support system. LangGraph is a framework built on LangChain that enables building stateful, multi-step AI agents with memory and tool execution capabilities.

## Architecture

```
┌─────────────────────────────────────┐
│   WhatsApp (Customers)              │
└─────────────┬───────────────────────┘
              │
              ↓ Webhook
┌─────────────────────────────────────┐
│   Next.js API Route                 │
│   /api/whatsapp/support             │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│   LangGraph Agent                   │
│   - Intent Classification           │
│   - Tool Execution                  │
│   - Response Generation             │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│   Tools & Integrations              │
│   - Knowledge Base Search           │
│   - Order Status Check              │
│   - Consultation Scheduling         │
│   - Support Ticket Creation         │
└─────────────────────────────────────┘
```

## Key Features

### 1. Stateful Conversations
- Maintains conversation history per customer
- Context-aware responses based on previous messages
- Automatic conversation cleanup after 24 hours

### 2. Tool Execution
The agent has access to the following tools:

- **search_knowledge_base**: Searches FAQ and knowledge base for relevant information
- **check_order_status**: Retrieves order status and tracking information
- **schedule_consultation**: Books ophthalmology consultations
- **create_support_ticket**: Creates tickets for human escalation

### 3. Intelligent Escalation
Automatically escalates to human agents when:
- Customer explicitly requests human support
- Problem is too complex for automation
- Serious complaints or dissatisfaction
- Emergency situations detected
- After 3 failed resolution attempts

### 4. Memory Management
- In-memory conversation storage (can be replaced with Redis/PostgreSQL)
- Tracks conversation metadata (start time, message count, escalation status)
- Automatic cleanup of old conversations
- Export functionality for analytics

## File Structure

```
src/lib/langgraph/
├── agent.ts              # Main LangGraph agent implementation
├── memory.ts            # Conversation memory manager
├── whatsapp-client.ts   # WhatsApp Cloud API client
└── index.ts             # Module exports

src/app/api/whatsapp/support/
└── route.ts             # API endpoint with LangGraph integration
```

## Environment Variables

Add these to your `.env` file:

```bash
# OpenAI API (required for LangGraph agent)
OPENAI_API_KEY=sk-...

# WhatsApp Cloud API (required for production)
WHATSAPP_API_VERSION=v21.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# Optional: LangSmith for tracing and debugging
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_...
```

## Usage

### Basic Integration

The LangGraph agent is automatically invoked when a WhatsApp message is received:

```typescript
import { langGraphAgent, conversationMemory } from '@/lib/langgraph'

// Get conversation history
const history = conversationMemory.getConversation(customerPhone)

// Process message with agent
const result = await langGraphAgent.processMessage(
  messageText,
  customerPhone,
  customerName,
  history
)

// Send response back to customer
await whatsappClient.sendTextMessage(customerPhone, result.response)

// Update conversation memory
conversationMemory.addAIMessage(customerPhone, result.response)
```

### Streaming Responses

For real-time updates (useful for web interfaces):

```typescript
const stream = langGraphAgent.streamMessage(
  messageText,
  customerPhone,
  customerName,
  history
)

for await (const chunk of stream) {
  if (chunk.content) {
    // Send partial response
    console.log(chunk.content)
  }
  if (chunk.toolCall) {
    // Tool is being executed
    console.log('Using tool:', chunk.toolCall.name)
  }
}
```

### Memory Management

```typescript
import { conversationMemory } from '@/lib/langgraph'

// Get conversation history
const messages = conversationMemory.getConversation(customerPhone)

// Check if conversation is escalated
const isEscalated = conversationMemory.isEscalated(customerPhone)

// Get conversation metadata
const metadata = conversationMemory.getMetadata(customerPhone)

// Clear conversation (e.g., after resolution)
conversationMemory.clearConversation(customerPhone)

// Get statistics
const stats = conversationMemory.getStats()
console.log('Active conversations:', stats.activeConversations)
```

## Agent Behavior

### System Prompt

The agent is configured with a comprehensive system prompt that defines:

- **Company Information**: SVLentes, Dr. Philipe Saraiva Cruz, contact details
- **Capabilities**: What the agent can help with
- **Guidelines**: How to interact with customers professionally
- **Escalation Rules**: When to involve human agents
- **Emergency Protocol**: How to handle medical emergencies

### Tool Selection

The agent automatically decides which tools to use based on the conversation context. Examples:

**Customer:** "Qual o status do pedido 12345?"
→ Agent uses `check_order_status` tool

**Customer:** "Preciso agendar uma consulta"
→ Agent uses `schedule_consultation` tool

**Customer:** "Quero falar com um atendente"
→ Agent uses `create_support_ticket` tool

### Response Generation

Responses are:
- Natural and conversational (Brazilian Portuguese)
- Empathetic and professional
- Concise but complete
- Include relevant emojis (moderately)
- Offer next steps or options

## Testing

### Mock Mode

When WhatsApp credentials are not configured, the system runs in mock mode:

```typescript
// Messages are logged instead of sent
console.log('[WhatsApp Mock] Would send message to', phone, ':', message)
```

### Test Webhook Locally

1. Use ngrok to expose local server:
```bash
ngrok http 3000
```

2. Configure webhook in Meta Developer Console:
```
Callback URL: https://your-ngrok-url.ngrok.io/api/whatsapp/support
Verify Token: your_webhook_verify_token
```

3. Send test message from WhatsApp

### Simulate Webhook

```bash
curl -X POST http://localhost:3000/api/whatsapp/support \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "id": "wamid.test123",
            "type": "text",
            "text": {
              "body": "Olá, preciso de ajuda"
            }
          }]
        }
      }]
    }]
  }'
```

## Monitoring & Analytics

### Conversation Statistics

```typescript
const stats = conversationMemory.getStats()

console.log({
  totalConversations: stats.totalConversations,
  activeConversations: stats.activeConversations,
  escalatedConversations: stats.escalatedConversations,
  averageMessagesPerConversation: stats.averageMessagesPerConversation,
})
```

### Conversation Export

```typescript
// Export conversation for analysis
const conversation = conversationMemory.exportConversation(customerPhone)

// Save to database or send to analytics
await saveToDatabase(conversation)
```

### LangSmith Tracing (Optional)

Enable detailed agent tracing:

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_your_api_key
```

View traces at: https://smith.langchain.com

## Production Deployment

### 1. Configure Environment Variables

Ensure all required variables are set in production:

```bash
OPENAI_API_KEY=sk-proj-...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
```

### 2. Set Up Webhook

Configure webhook in Meta Developer Console:
- URL: `https://svlentes.com.br/api/whatsapp/support`
- Verify Token: Your secret token
- Subscribe to: `messages`

### 3. Database Integration (Recommended)

Replace in-memory storage with persistent database:

```typescript
// Example: PostgreSQL integration
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Save conversation to database
await pool.query(
  'INSERT INTO conversations (phone, messages, metadata) VALUES ($1, $2, $3)',
  [phone, JSON.stringify(messages), JSON.stringify(metadata)]
)
```

### 4. Monitoring

Set up monitoring for:
- Response times
- Error rates
- Escalation rates
- Tool usage statistics
- OpenAI API costs

### 5. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 messages per minute
})

const { success } = await ratelimit.limit(customerPhone)
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

## Troubleshooting

### Agent Not Responding

1. Check OpenAI API key is valid
2. Verify conversation memory is working
3. Check logs for errors
4. Test with simple message

### Tools Not Executing

1. Check tool definitions are correct
2. Verify tool functions are not throwing errors
3. Enable LangSmith tracing to debug
4. Test tools individually

### WhatsApp Messages Not Sent

1. Verify WhatsApp credentials
2. Check phone number format (+55...)
3. Test with Meta's API explorer
4. Check webhook is receiving messages

### High Latency

1. Use `gpt-4o-mini` instead of `gpt-4` for faster responses
2. Implement caching for common questions
3. Use streaming responses for better UX
4. Optimize tool execution

## Cost Optimization

### Token Usage

Monitor and optimize token usage:

```typescript
// Use shorter system prompts
// Limit conversation history length
const recentHistory = messages.slice(-10) // Only last 10 messages

// Use cheaper models for simple tasks
const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini', // Cheaper than gpt-4
  temperature: 0.7,
})
```

### Caching

Cache common responses:

```typescript
import { cache } from '@/lib/cache'

// Cache FAQ responses for 1 hour
const cachedResponse = await cache.get(`faq:${questionHash}`)
if (cachedResponse) {
  return cachedResponse
}

const response = await agent.processMessage(...)
await cache.set(`faq:${questionHash}`, response, 3600)
```

## Best Practices

1. **Always handle errors gracefully** - Provide fallback responses
2. **Log all interactions** - For debugging and analytics
3. **Monitor escalation rates** - High rates indicate issues
4. **Regularly update knowledge base** - Keep information current
5. **Test with real users** - Get feedback and iterate
6. **Implement rate limiting** - Prevent abuse
7. **Use streaming for better UX** - Show progress to users
8. **Keep system prompt updated** - Reflect company policies
9. **Monitor costs** - OpenAI API can be expensive
10. **Have human backup** - Always allow escalation

## Future Enhancements

### Planned Features

- [ ] Multi-language support (English, Spanish)
- [ ] Voice message transcription
- [ ] Image analysis (prescription, receipt)
- [ ] Integration with CRM system
- [ ] Advanced analytics dashboard
- [ ] A/B testing of prompts
- [ ] Custom fine-tuned model
- [ ] Proactive notifications
- [ ] Sentiment analysis
- [ ] Automated satisfaction surveys

### Database Schema (Recommended)

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- active, escalated, resolved
  escalated BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  INDEX idx_phone (customer_phone),
  INDEX idx_status (status)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(20) NOT NULL, -- user, assistant, tool
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  event_type VARCHAR(50) NOT NULL, -- tool_call, escalation, error
  event_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Support

For issues or questions about the LangGraph implementation:

1. Check this documentation
2. Review LangChain docs: https://python.langchain.com/docs/langgraph
3. Check LangGraph JS docs: https://langchain-ai.github.io/langgraphjs/
4. Open an issue in the repository
5. Contact the development team

## References

- [LangChain Documentation](https://js.langchain.com/docs/)
- [LangGraph JS Documentation](https://langchain-ai.github.io/langgraphjs/)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [OpenAI API](https://platform.openai.com/docs)
- [LangSmith](https://smith.langchain.com/)

---

**Last Updated:** 2025-10-16
**Version:** 1.0.0
