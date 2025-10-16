# 🚀 LangGraph Quick Start

## What is LangGraph?

LangGraph is a framework for building stateful, multi-actor applications with LLMs. It provides:
- **Stateful conversations** with memory persistence
- **Tool execution** for integrating with external systems
- **Agent-based reasoning** for complex decision-making
- **Built-in error handling** and retry logic

## Quick Setup (5 minutes)

### 1. Set Environment Variables

Add to your `.env` file:

```bash
# Required: OpenAI API Key
OPENAI_API_KEY=sk-proj-your_key_here

# Optional: WhatsApp Cloud API (for production)
WHATSAPP_API_VERSION=v21.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

### 2. Test the Agent

```typescript
import { langGraphAgent, conversationMemory } from '@/lib/langgraph'

// Process a message
const result = await langGraphAgent.processMessage(
  'Qual o status do pedido 12345?',
  '5511999999999', // customer phone
  'João Silva' // customer name (optional)
)

console.log('Response:', result.response)
console.log('Tools used:', result.toolsUsed)
console.log('Escalation needed:', result.escalationRequired)
```

### 3. Try It Out

Run the test script:

```bash
# Install dependencies first
npm install

# Run tests
npm test -- langgraph

# All tests should pass ✓
```

## Common Use Cases

### Use Case 1: Order Status Check

**Customer asks:** "Onde está meu pedido?"

**Agent:**
1. Uses `check_order_status` tool
2. Retrieves order information
3. Responds with tracking details

```typescript
// Automatic - no code needed!
// The agent decides when to use tools
```

### Use Case 2: FAQ Questions

**Customer asks:** "Como funciona a assinatura?"

**Agent:**
1. Uses `search_knowledge_base` tool
2. Finds relevant FAQ entries
3. Provides answer with context

### Use Case 3: Escalation to Human

**Customer says:** "Preciso falar com um atendente"

**Agent:**
1. Uses `create_support_ticket` tool
2. Creates ticket with conversation history
3. Responds confirming human contact soon

### Use Case 4: Consultation Scheduling

**Customer asks:** "Quero agendar consulta"

**Agent:**
1. Uses `schedule_consultation` tool
2. Books appointment
3. Sends confirmation

## Available Tools

The agent has access to these tools:

| Tool | When to Use | Example |
|------|------------|---------|
| `search_knowledge_base` | FAQ questions | "Como trocar lentes?" |
| `check_order_status` | Order inquiries | "Onde está pedido 12345?" |
| `schedule_consultation` | Appointment booking | "Quero consulta" |
| `create_support_ticket` | Complex issues, escalation | "Preciso falar com atendente" |

## Memory Management

### Store Conversation

```typescript
import { conversationMemory } from '@/lib/langgraph'

// Add user message
conversationMemory.addUserMessage(
  '5511999999999',
  'Olá, preciso de ajuda'
)

// Add AI response
conversationMemory.addAIMessage(
  '5511999999999',
  'Olá! Como posso ajudar?'
)
```

### Retrieve History

```typescript
// Get last messages
const history = conversationMemory.getConversation('5511999999999')

console.log(`Found ${history.length} messages`)
```

### Clear Old Conversations

```typescript
// Manual cleanup
conversationMemory.clearConversation('5511999999999')

// Auto cleanup after 24 hours (built-in)
```

## Integration with WhatsApp

The agent is already integrated with the WhatsApp webhook:

```
POST /api/whatsapp/support
```

**Flow:**
1. WhatsApp sends message → webhook
2. Webhook processes with LangGraph agent
3. Agent responds via WhatsApp API
4. Conversation stored in memory

**Code:**
```typescript
// In /api/whatsapp/support/route.ts (already implemented)
const result = await langGraphAgent.processMessage(
  messageContent,
  customerPhone,
  undefined,
  conversationHistory
)

await whatsappClient.sendTextMessage(customerPhone, result.response)
```

## Monitoring

### Check Active Conversations

```typescript
const stats = conversationMemory.getStats()

console.log({
  total: stats.totalConversations,
  active: stats.activeConversations,
  escalated: stats.escalatedConversations,
  avgMessages: stats.averageMessagesPerConversation,
})
```

### Export Conversation

```typescript
// For analytics or debugging
const data = conversationMemory.exportConversation('5511999999999')

console.log(JSON.stringify(data, null, 2))
```

### View Summary

```typescript
const summary = conversationMemory.getConversationSummary('5511999999999')

console.log(summary)
// Output:
// Conversation Summary:
// - Customer: João Silva (5511999999999)
// - Started: 2025-10-16T...
// - Duration: 15 minutes
// - Messages: 8
// - Escalated: No
```

## Customization

### Add New Tools

```typescript
// In src/lib/langgraph/agent.ts

import { tool } from '@langchain/core/tools'
import { z } from 'zod'

const myCustomTool = tool(
  async ({ param1, param2 }) => {
    // Your logic here
    return 'Result'
  },
  {
    name: 'my_custom_tool',
    description: 'What this tool does',
    schema: z.object({
      param1: z.string().describe('Description'),
      param2: z.number().optional(),
    }),
  }
)

// Add to tools array
this.tools = [
  searchKnowledgeBaseTool,
  createSupportTicketTool,
  myCustomTool, // ← Add here
]
```

### Modify System Prompt

```typescript
// In src/lib/langgraph/agent.ts

const SYSTEM_PROMPT = `
You are an AI assistant for SVLentes.

NEW INSTRUCTIONS:
- Always be extra polite
- Use more emojis
- Respond in under 100 words
...
`
```

### Change Model

```typescript
// In src/lib/langgraph/agent.ts

this.model = new ChatOpenAI({
  modelName: 'gpt-4o', // ← Change model
  temperature: 0.5, // ← Adjust creativity
  maxTokens: 500, // ← Limit response length
})
```

## Troubleshooting

### Agent Not Responding

**Check:**
1. Is `OPENAI_API_KEY` set?
2. Are there errors in console?
3. Is conversation memory working?

```bash
# Test manually
curl -X POST http://localhost:3000/api/whatsapp/support \
  -H "Content-Type: application/json" \
  -d '{"action":"test"}'
```

### Tools Not Executing

**Debug:**
```typescript
// Add logging in agent.ts
console.log('Tools used:', result.toolsUsed)

// Check tool definitions
console.log('Available tools:', this.tools.map(t => t.name))
```

### High Costs

**Optimize:**
1. Use `gpt-4o-mini` (cheaper)
2. Limit conversation history
3. Cache common responses
4. Set lower `temperature`

```typescript
// Limit history to last 10 messages
const recentHistory = history.slice(-10)
```

## Production Checklist

Before deploying to production:

- [ ] Set `OPENAI_API_KEY` in production environment
- [ ] Configure WhatsApp Cloud API credentials
- [ ] Test webhook with real WhatsApp messages
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Set up database for conversation persistence (optional)
- [ ] Enable LangSmith tracing for debugging (optional)
- [ ] Test escalation flow
- [ ] Verify all tools work correctly
- [ ] Load test with multiple concurrent users

## Next Steps

1. **Read Full Docs:** See `docs/LANGGRAPH_IMPLEMENTATION.md`
2. **Test Agent:** Send test messages via WhatsApp
3. **Monitor Usage:** Track OpenAI API costs
4. **Customize:** Add your own tools and prompts
5. **Optimize:** Improve based on real usage data

## Resources

- **LangChain Docs:** https://js.langchain.com/docs/
- **LangGraph Docs:** https://langchain-ai.github.io/langgraphjs/
- **OpenAI API:** https://platform.openai.com/docs
- **WhatsApp API:** https://developers.facebook.com/docs/whatsapp/cloud-api/

---

**Need Help?**
- Check logs: Look for errors in console
- Test tools individually: Verify each tool works
- Read full documentation: See `LANGGRAPH_IMPLEMENTATION.md`
- Check conversation memory: Use `getStats()` to debug

**Happy coding! 🚀**
