# LangSmith Integration Examples

## Basic Usage Example

### 1. Simple LangChain Call with Tracing

```typescript
import { ChatOpenAI } from '@langchain/openai'
import { getLangSmithRunConfig } from '@/lib/langsmith-config'

// Initialize LLM (LangSmith tracing is automatic if configured)
const llm = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY
})

// Add metadata for better trace organization
const runConfig = getLangSmithRunConfig({
  userId: 'user-123',
  operation: 'customer-query',
  tags: ['support', 'billing']
})

// Make LLM call - automatically traced in LangSmith
const response = await llm.invoke(
  "Como posso cancelar minha assinatura?",
  runConfig
)

console.log(response.content)
```

### 2. Chain Execution with Tracing

```typescript
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatOpenAI } from '@langchain/openai'
import { getLangSmithRunConfig } from '@/lib/langsmith-config'

// Create a chain
const prompt = PromptTemplate.fromTemplate(`
Você é um assistente de suporte ao cliente.
Cliente: {customerName}
Pergunta: {question}

Forneça uma resposta clara e profissional.
`)

const llm = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.3
})

const chain = RunnableSequence.from([
  prompt,
  llm,
  new StringOutputParser()
])

// Execute with metadata
const runConfig = getLangSmithRunConfig({
  customerName: 'João Silva',
  step: 'support-response',
  tags: ['customer-service', 'automated']
})

const result = await chain.invoke({
  customerName: 'João Silva',
  question: 'Quero rastrear meu pedido'
}, runConfig)

console.log(result)
```

### 3. WhatsApp Support Integration (Real Use Case)

```typescript
import { langchainSupportProcessor } from '@/lib/langchain-support-processor'

// Process incoming WhatsApp message
async function handleWhatsAppMessage(
  phoneNumber: string,
  message: string,
  userContext: any
) {
  // This automatically traces:
  // 1. Emergency detection
  // 2. Intent classification
  // 3. Response generation
  // 4. Escalation decision
  const result = await langchainSupportProcessor.processSupportMessage(
    message,
    {
      userProfile: {
        id: userContext.userId,
        name: userContext.userName,
        email: userContext.email,
        phone: phoneNumber
      },
      subscriptionInfo: userContext.subscription,
      previousTickets: await getUserTickets(userContext.userId),
      userHistory: [],
      conversationHistory: await getConversationHistory(phoneNumber)
    }
  )

  // Send response back to WhatsApp
  await sendWhatsAppMessage(phoneNumber, result.response)
  
  // Send quick reply buttons if available
  if (result.quickReplies.length > 0) {
    await sendQuickReplies(phoneNumber, result.quickReplies)
  }

  return result
}

// Example call
await handleWhatsAppMessage(
  '+5533998980026',
  'Gostaria de pausar minha assinatura por 30 dias',
  {
    userId: 'user-456',
    userName: 'Maria Santos',
    email: 'maria@example.com',
    subscription: {
      id: 'sub-789',
      status: 'active',
      planType: 'premium'
    }
  }
)
```

## Viewing Traces in LangSmith

After running the code above, you can:

1. Go to https://smith.langchain.com/
2. Select your project (e.g., `svlentes-whatsapp-support`)
3. See all traces with:
   - Full input/output
   - Execution time
   - Token usage
   - Cost per call
   - Custom metadata (userId, tags, etc.)

## Filtering Traces

### By User
Filter traces for a specific user:
```
metadata.userId = "user-123"
```

### By Intent
Find all subscription cancellation requests:
```
metadata.intent = "subscription_cancel"
```

### By Tags
View all emergency-related traces:
```
tags contains "emergency"
```

### By Performance
Find slow operations (>5 seconds):
```
latency > 5000
```

### By Cost
Identify expensive operations:
```
total_tokens > 2000
```

## Debug Example

### Scenario: Intent Classification Not Working

1. **Find the failing traces**:
   - Filter by `step = "intent-classification"`
   - Look for traces with unexpected results

2. **Inspect the trace**:
   - Click on the trace
   - View the exact prompt sent to the LLM
   - Check the model's response
   - Review metadata (conversation history, user context)

3. **Compare with successful traces**:
   - Find similar successful traces
   - Identify differences in:
     - Prompt structure
     - User context
     - Conversation history

4. **Iterate on the prompt**:
   - Update prompt template in code
   - Test with same input
   - Compare traces to validate improvement

## Performance Optimization Example

### Find bottlenecks:

```typescript
// Add timing metadata
const startTime = Date.now()

const runConfig = getLangSmithRunConfig({
  operationStartTime: startTime,
  tags: ['performance-test']
})

const result = await chain.invoke(input, runConfig)

const duration = Date.now() - startTime
console.log(`Operation took ${duration}ms`)
```

### Analyze in LangSmith:
1. Sort traces by latency (descending)
2. Identify common patterns in slow traces
3. Check token usage (high tokens = high latency)
4. Consider:
   - Reducing prompt length
   - Using faster models for simple tasks
   - Caching frequent queries

## Cost Tracking Example

### Monthly Cost Report:

1. Go to LangSmith Analytics
2. Select date range (last 30 days)
3. View metrics:
   - Total tokens used
   - Estimated cost
   - Cost per conversation
   - Most expensive operations

### Cost Optimization:

```typescript
// Use cheaper model for simple tasks
const classificationLLM = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',  // Cheaper
  temperature: 0.1
})

// Use powerful model for complex responses
const responseLLM = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',  // More expensive but better
  temperature: 0.7
})
```

## Error Tracking Example

### Capture and trace errors:

```typescript
try {
  const runConfig = getLangSmithRunConfig({
    operation: 'risky-operation',
    tags: ['error-prone']
  })
  
  const result = await chain.invoke(input, runConfig)
  return result
} catch (error) {
  // Error is automatically captured in LangSmith trace
  console.error('Operation failed:', error)
  
  // You can add custom error metadata
  await logError({
    error: error.message,
    stack: error.stack,
    context: 'chain-invocation',
    userId: userId
  })
  
  throw error
}
```

### Find and fix errors:

1. Filter traces by status: `status = "error"`
2. Group by error message to find patterns
3. Review error traces for:
   - Input that caused the error
   - Stack trace
   - Context and metadata
4. Fix the root cause
5. Verify fix by re-running with same input

## Best Practices

### 1. Use Descriptive Tags

```typescript
// ❌ Bad
tags: ['tag1', 'tag2']

// ✅ Good
tags: ['whatsapp-support', 'intent-classification', 'high-priority']
```

### 2. Include Rich Metadata

```typescript
// ❌ Bad
metadata: { user: 'user-123' }

// ✅ Good
metadata: {
  userId: 'user-123',
  userName: 'João Silva',
  hasActiveSubscription: true,
  conversationLength: 5,
  previousTickets: 2,
  customerSegment: 'premium',
  timeOfDay: 'business-hours',
  deviceType: 'mobile'
}
```

### 3. Use Consistent Step Names

```typescript
// ✅ Good - consistent naming across operations
const steps = [
  'emergency-detection',
  'intent-classification',
  'response-generation',
  'escalation-decision',
  'ticket-creation'
]
```

### 4. Separate Dev/Staging/Prod

```bash
# .env.development
LANGCHAIN_PROJECT="svlentes-dev"

# .env.staging
LANGCHAIN_PROJECT="svlentes-staging"

# .env.production
LANGCHAIN_PROJECT="svlentes-prod"
```

## Common Troubleshooting

### Issue: Traces not appearing

**Check:**
```typescript
import { logLangSmithStatus } from '@/lib/langsmith-config'

// Logs current configuration status
logLangSmithStatus()
```

**Output should be:**
```
✅ LangSmith observability enabled
   Project: svlentes-whatsapp-support
   Endpoint: https://api.smith.langchain.com
   View traces at: https://smith.langchain.com/
```

### Issue: High latency

**Analyze:**
1. Check prompt length (shorter = faster)
2. Use streaming for long responses
3. Consider caching for frequent queries
4. Use faster models for simple tasks

### Issue: High costs

**Optimize:**
1. Cache common responses
2. Use gpt-3.5-turbo for simple tasks
3. Reduce prompt verbosity
4. Implement conversation summarization
5. Set token limits on responses

---

**For more examples, see:**
- `/src/lib/langchain-support-processor.ts` - Full implementation
- `/docs/LANGSMITH_SETUP.md` - Complete setup guide
- https://docs.smith.langchain.com/ - Official documentation
