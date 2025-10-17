# LangSmith Observability - Quick Reference

## ✅ Configuration Completed

LangSmith observability has been successfully configured for the SV Lentes WhatsApp support system.

## 📋 What Was Implemented

### 1. Configuration Module (`src/lib/langsmith-config.ts`)
- Centralized LangSmith configuration management
- Environment variable handling
- Run configuration generation with metadata
- Status logging and validation

### 2. Integration (`src/lib/langchain-support-processor.ts`)
- Automatic tracing of all LLM operations
- Rich metadata for each operation:
  - User context (ID, name, subscription status)
  - Message metadata (length, conversation history)
  - Intent classification details
  - Sentiment and priority analysis
- Step-by-step tracking:
  - Emergency detection
  - Intent classification
  - Response generation
  - Escalation decision

### 3. Environment Variables (`.env.example`)
```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY="your-langsmith-api-key"
LANGCHAIN_PROJECT="svlentes-whatsapp-support"
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Tests (`src/lib/__tests__/langsmith-config.test.ts`)
- 12 unit tests covering all configuration functions
- All tests passing ✅
- Test coverage for:
  - Configuration retrieval
  - Environment variable validation
  - Run configuration generation
  - Metadata handling

### 5. Documentation
- **Setup Guide**: `docs/LANGSMITH_SETUP.md` (8KB, comprehensive)
- **Usage Examples**: `docs/LANGSMITH_EXAMPLE.md` (9KB, practical)
- **AGENTS.md**: Updated with LangSmith section
- **Index**: Updated `docs/WHATSAPP_DOCS_INDEX.md`

## 🚀 How to Use

### Quick Start

1. **Get API Key**:
   - Go to https://smith.langchain.com/
   - Sign up and create a new project
   - Generate API key

2. **Configure Environment**:
   ```bash
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY="lsv2_pt_your_actual_key"
   LANGCHAIN_PROJECT="svlentes-whatsapp-support"
   ```

3. **Verify**:
   - Start your application
   - Look for log message:
     ```
     ✅ LangSmith observability enabled
        Project: svlentes-whatsapp-support
        View traces at: https://smith.langchain.com/
     ```

4. **View Traces**:
   - Process some messages through the support system
   - Go to https://smith.langchain.com/
   - Browse traces with full context and metadata

## 📊 What You Get

### Automatic Tracing
Every LangChain operation is automatically traced:
- Full input/output pairs
- Token usage and costs
- Execution time
- Error tracking

### Rich Metadata
Every trace includes:
- **User Context**: userId, userName, hasSubscription
- **Message Data**: message length, conversation length
- **Intent Analysis**: intent name, category, priority, sentiment
- **Step Identification**: which operation (detection, classification, generation, escalation)
- **Tags**: categorized for easy filtering

### Performance Insights
- Identify slow operations
- Track token usage
- Monitor costs per conversation
- Analyze conversation patterns

### Debugging
- See exact prompts sent to LLM
- View model responses
- Inspect chain execution flow
- Track errors with full context

## 🔍 Key Features

### Step-by-Step Tracking
1. **Emergency Detection** - Critical safety checks
2. **Intent Classification** - Understanding user needs
3. **Response Generation** - Creating helpful responses
4. **Escalation Decision** - When to involve human agents

### Metadata Tags
- `whatsapp-support` - Message source
- `customer-service` - Department
- `intent`, `classification`, `response`, `escalation` - Operation type
- `emergency`, `safety`, `critical` - Priority indicators
- Category-specific tags (e.g., `billing`, `delivery`, `technical`)

### Cost Management
- Track token usage per conversation
- Identify expensive operations
- Optimize prompt efficiency
- Compare model costs

## 📚 Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| Setup Guide | Complete configuration instructions | `docs/LANGSMITH_SETUP.md` |
| Examples | Code examples and use cases | `docs/LANGSMITH_EXAMPLE.md` |
| Config Module | TypeScript implementation | `src/lib/langsmith-config.ts` |
| Tests | Unit tests and validation | `src/lib/__tests__/langsmith-config.test.ts` |
| Agent Guide | Quick reference | `AGENTS.md` (LangSmith section) |

## ✨ Benefits

### For Developers
- **Faster debugging** - See exactly what went wrong
- **Prompt engineering** - Test and compare prompts
- **Cost estimation** - Understand token usage patterns

### For Operations
- **Performance monitoring** - Identify bottlenecks
- **Error tracking** - Catch issues before users report
- **Capacity planning** - Predict scaling needs

### For Business
- **Customer insights** - Understand user needs
- **Quality metrics** - Measure support effectiveness
- **ROI analysis** - Track automation savings

## 🔐 Security & Privacy

### LGPD Compliance
- No sensitive personal data in metadata
- User IDs used instead of names (where possible)
- Configurable data retention
- Secure API key handling

### Best Practices
- Separate API keys for dev/staging/prod
- Use environment-specific projects
- Rotate keys periodically
- Monitor API key usage

## 🎯 Next Steps

1. **Get API Key**: Sign up at smith.langchain.com
2. **Configure**: Add environment variables
3. **Test**: Process a few messages
4. **Monitor**: Review traces in dashboard
5. **Optimize**: Use insights to improve prompts and performance

## 📞 Support

- **Documentation**: `docs/LANGSMITH_SETUP.md`
- **Examples**: `docs/LANGSMITH_EXAMPLE.md`
- **Official Docs**: https://docs.smith.langchain.com/
- **Community**: https://discord.gg/langchain

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2025-10-16  
**Tests**: 12/12 passing ✅
