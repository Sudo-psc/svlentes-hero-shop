# LangGraph Module

This directory contains the LangGraph implementation for SVLentes WhatsApp customer support.

## Files

- **agent.ts** - Main LangGraph agent with tools and state management
- **memory.ts** - Conversation memory manager for chat history persistence
- **whatsapp-client.ts** - WhatsApp Cloud API client for sending messages
- **index.ts** - Module exports

## Quick Usage

```typescript
import { langGraphAgent, conversationMemory } from '@/lib/langgraph'

// Process a customer message
const result = await langGraphAgent.processMessage(
  'Preciso de ajuda',
  '5511999999999'
)

console.log(result.response)
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (for WhatsApp integration)
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
```

## Tools Available

1. **search_knowledge_base** - Search FAQ and knowledge base
2. **check_order_status** - Look up order tracking
3. **schedule_consultation** - Book appointments
4. **create_support_ticket** - Escalate to human support

## Documentation

See `docs/LANGGRAPH_IMPLEMENTATION.md` for full documentation.

## Tests

```bash
npm test -- langgraph
```
