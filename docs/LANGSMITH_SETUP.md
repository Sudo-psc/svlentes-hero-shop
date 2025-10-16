# LangSmith Observability Configuration

## 📋 Overview

LangSmith provides comprehensive observability for LangChain applications, enabling you to:
- **Trace** all LLM calls and chain executions
- **Debug** prompts and responses in real-time
- **Monitor** performance and costs
- **Analyze** user interactions and agent behavior
- **Optimize** prompts based on actual usage data

## 🚀 Quick Start

### 1. Create LangSmith Account

1. Go to [https://smith.langchain.com/](https://smith.langchain.com/)
2. Sign up for a free account (includes generous free tier)
3. Create a new project (e.g., `svlentes-whatsapp-support`)

### 2. Get API Key

1. Navigate to Settings → API Keys
2. Click "Create API Key"
3. Copy the generated API key (starts with `lsv2_pt_...`)

### 3. Configure Environment Variables

Add the following to your `.env` file:

```bash
# LangSmith Observability
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
LANGCHAIN_API_KEY="lsv2_pt_your_actual_api_key_here"
LANGCHAIN_PROJECT="svlentes-whatsapp-support"
```

### 4. Verify Configuration

When your application starts, you should see:

```
✅ LangSmith observability enabled
   Project: svlentes-whatsapp-support
   Endpoint: https://api.smith.langchain.com
   View traces at: https://smith.langchain.com/
```

## 📊 Features & Capabilities

### Automatic Tracing

All LangChain operations are automatically traced when LangSmith is enabled:

- **LLM Calls**: Token usage, latency, cost
- **Chain Executions**: Full execution flow with intermediate steps
- **Prompts**: Input/output pairs for each call
- **Errors**: Stack traces and error context

### Rich Metadata

The integration includes custom metadata for better insights:

```typescript
{
  userId: "user-123",
  userName: "John Doe",
  hasSubscription: true,
  messageLength: 150,
  conversationLength: 5,
  step: "intent-classification",
  intent: "subscription_pause",
  category: "BILLING",
  priority: "MEDIUM",
  sentiment: "neutral",
  tags: ["whatsapp-support", "customer-service", "intent", "classification"]
}
```

### Step-by-Step Tracking

Each stage of message processing is tracked separately:

1. **Emergency Detection** (`emergency-detection`)
   - Tags: `emergency`, `safety`, `critical`
   
2. **Intent Classification** (`intent-classification`)
   - Tags: `intent`, `classification`, `support`
   
3. **Response Generation** (`response-generation`)
   - Tags: `response`, `generation`, `{category}`
   
4. **Escalation Decision** (`escalation-decision`)
   - Tags: `escalation`, `decision`, `routing`

## 🔍 Using LangSmith Dashboard

### View Traces

1. Go to your project dashboard
2. Click on any trace to see:
   - Full conversation context
   - Token usage and costs
   - Execution time for each step
   - Input/output for each LLM call

### Monitor Performance

- **Latency**: Identify slow operations
- **Cost**: Track token usage per conversation
- **Success Rate**: Monitor error rates
- **User Patterns**: Analyze conversation flows

### Debug Issues

1. Filter traces by:
   - Tags (e.g., `emergency`, `escalation`)
   - Metadata (e.g., specific users or intents)
   - Error status
   - Date range

2. Inspect failed traces:
   - View exact prompt sent to LLM
   - See model response
   - Check error messages and stack traces

### Optimize Prompts

1. Compare different prompt versions
2. A/B test prompt variations
3. Analyze which prompts lead to:
   - Better intent classification
   - Fewer escalations
   - Higher customer satisfaction

## 🛠️ Advanced Configuration

### Environment-Specific Projects

Use different projects for different environments:

```bash
# Development
LANGCHAIN_PROJECT="svlentes-whatsapp-support-dev"

# Staging
LANGCHAIN_PROJECT="svlentes-whatsapp-support-staging"

# Production
LANGCHAIN_PROJECT="svlentes-whatsapp-support-prod"
```

### Disable Tracing in Development

If you want to disable tracing (e.g., for faster local development):

```bash
LANGCHAIN_TRACING_V2=false
```

### Custom Run Configuration

Add custom metadata to specific operations:

```typescript
import { getLangSmithRunConfig } from '@/lib/langsmith-config'

const runConfig = getLangSmithRunConfig({
  customField: 'customValue',
  tags: ['custom-tag']
})

await chain.invoke(input, runConfig)
```

## 📈 Metrics & Analytics

### Key Metrics to Track

1. **Response Time**
   - Average time per message
   - 95th percentile latency
   - Slowest operations

2. **Cost Management**
   - Tokens per conversation
   - Cost per customer interaction
   - Daily/monthly spend trends

3. **Quality Metrics**
   - Intent classification accuracy
   - Escalation rate
   - Emergency detection precision

4. **Customer Satisfaction**
   - Conversation length (shorter is often better)
   - Resolution rate
   - Escalation patterns

### Custom Dashboards

Create custom views in LangSmith:
- Filter by customer segment (subscribers vs. prospects)
- Track specific intents (cancellations, complaints)
- Monitor business hours vs. off-hours patterns

## 🔐 Security & Privacy

### Data Handling

LangSmith stores:
- ✅ Prompts and responses
- ✅ Metadata and tags
- ✅ Execution traces

**Important**: Ensure compliance with LGPD by:
1. Not including sensitive personal data in metadata
2. Using user IDs instead of names when possible
3. Reviewing LangSmith's data retention policies
4. Configuring appropriate data retention settings

### Access Control

- Limit API key access to production environments
- Use separate API keys for dev/staging/prod
- Rotate keys periodically
- Monitor API key usage

## 🐛 Troubleshooting

### Traces Not Appearing

1. Check environment variables:
   ```bash
   echo $LANGCHAIN_TRACING_V2
   echo $LANGCHAIN_API_KEY
   ```

2. Verify API key is valid:
   - Check for typos
   - Ensure key hasn't expired
   - Confirm key has project access

3. Check network connectivity:
   - Ensure `api.smith.langchain.com` is accessible
   - Check firewall rules

### High Costs

1. Review token usage per operation
2. Consider using smaller models for simple tasks
3. Implement caching for common queries
4. Optimize prompt lengths

### Missing Metadata

1. Ensure `getLangSmithRunConfig()` is called
2. Check metadata is being passed to invoke methods
3. Verify metadata keys don't contain special characters

## 📚 Resources

- **LangSmith Documentation**: https://docs.smith.langchain.com/
- **LangChain Python Docs**: https://python.langchain.com/docs/langsmith/
- **LangChain JS Docs**: https://js.langchain.com/docs/langsmith/
- **Best Practices**: https://docs.smith.langchain.com/category/best-practices
- **Pricing**: https://smith.langchain.com/pricing

## 🎯 Best Practices

### 1. Use Descriptive Tags

```typescript
tags: [
  'whatsapp-support',      // Channel
  'customer-service',      // Department
  'intent-classification', // Operation
  'billing'                // Category
]
```

### 2. Include Relevant Metadata

```typescript
metadata: {
  userId: context.userProfile?.id,
  intent: intent.name,
  priority: intent.priority,
  hasSubscription: !!context.subscriptionInfo
}
```

### 3. Name Steps Clearly

Use clear, descriptive step names:
- `emergency-detection`
- `intent-classification`
- `response-generation`
- `escalation-decision`

### 4. Monitor Regularly

- Set up alerts for errors
- Review traces weekly
- Analyze trends monthly
- Optimize prompts quarterly

### 5. Test in Staging First

- Validate tracing in staging environment
- Ensure no sensitive data leaks
- Check performance impact
- Review costs before production deployment

## 🎉 Benefits

### For Development
- **Faster Debugging**: See exactly what went wrong
- **Prompt Engineering**: Test and compare prompts
- **Cost Estimation**: Understand token usage

### For Operations
- **Performance Monitoring**: Identify bottlenecks
- **Error Tracking**: Catch issues before users report
- **Capacity Planning**: Predict scaling needs

### For Business
- **Customer Insights**: Understand user needs
- **Quality Metrics**: Measure support effectiveness
- **ROI Analysis**: Track automation savings

---

**Last Updated**: 2025-10-16
**Maintained By**: SV Lentes Development Team
