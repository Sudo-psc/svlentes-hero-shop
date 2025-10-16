# 🔧 LangGraph Setup Guide

Complete step-by-step guide to set up LangGraph for SVLentes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- OpenAI API account (for GPT models)
- Meta Developer account (for WhatsApp - optional for testing)

## Step 1: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install @langchain/core @langchain/openai @langchain/community @langchain/langgraph langchain
```

## Step 2: Get OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-proj-...`)
6. **Important:** Save it securely - you won't see it again!

### Pricing (as of 2024)

- **GPT-4o-mini:** $0.15 per 1M input tokens, $0.60 per 1M output tokens (recommended)
- **GPT-4o:** $2.50 per 1M input tokens, $10 per 1M output tokens
- **GPT-4:** $30 per 1M input tokens, $60 per 1M output tokens

**Recommendation:** Start with GPT-4o-mini - it's fast, cheap, and good enough for most support tasks.

## Step 3: Set Up Environment Variables

### Development (.env.local)

Create or update `.env.local`:

```bash
# OpenAI (Required)
OPENAI_API_KEY=sk-proj-your_key_here

# WhatsApp Cloud API (Optional for local testing)
WHATSAPP_API_VERSION=v21.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=your_secret_token_123

# LangSmith (Optional - for debugging/tracing)
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=
```

### Production (.env.production)

For production, add the same variables with real values.

**Security Note:** Never commit API keys to git! They're in `.gitignore`.

## Step 4: WhatsApp Cloud API Setup (Production Only)

Skip this for local testing - the system works in "mock mode" without WhatsApp.

### 4.1 Create Meta App

1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Select "Business" type
4. Fill in app details
5. Add "WhatsApp" product

### 4.2 Get Phone Number ID

1. In WhatsApp product page
2. Go to "API Setup"
3. Copy "Phone number ID"
4. Add to `.env`: `WHATSAPP_PHONE_NUMBER_ID=...`

### 4.3 Get Access Token

**Temporary (24h) - For Testing:**
- Copy from "API Setup" page
- Good for initial testing

**Permanent - For Production:**

Option A: System User Token (Recommended)
1. Business Settings → System Users → Add
2. Assign WhatsApp permissions
3. Generate token
4. Never expires!

Option B: Long-lived User Token
1. Use Graph API Explorer: https://developers.facebook.com/tools/explorer/
2. Select your app
3. Generate token with `whatsapp_business_management` permission
4. Exchange for long-lived token (60 days)

### 4.4 Configure Webhook

1. In WhatsApp Configuration
2. Click "Edit" next to Webhook
3. **Callback URL:** `https://your-domain.com/api/whatsapp/support`
4. **Verify Token:** Same as `WHATSAPP_VERIFY_TOKEN` in .env
5. Subscribe to "messages" field
6. Click "Verify and Save"

**For Local Testing:**
- Use ngrok: `ngrok http 3000`
- Copy ngrok URL: `https://abc123.ngrok.io`
- Use as callback URL: `https://abc123.ngrok.io/api/whatsapp/support`

## Step 5: Test the Setup

### Test 1: Agent Without WhatsApp

```bash
# Create test file: test-agent.js
node test-agent.js
```

```javascript
// test-agent.js
import { langGraphAgent } from './src/lib/langgraph/index.js'

async function test() {
  const result = await langGraphAgent.processMessage(
    'Olá, preciso de ajuda com meu pedido 12345',
    '5511999999999',
    'Test User'
  )

  console.log('Response:', result.response)
  console.log('Tools used:', result.toolsUsed)
  console.log('Escalation:', result.escalationRequired)
}

test()
```

### Test 2: Run Unit Tests

```bash
npm test -- langgraph
```

Expected output:
```
PASS  src/lib/langgraph/__tests__/agent.test.ts
  ✓ All tests pass
```

### Test 3: Test WhatsApp Webhook (Mock)

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
            "id": "test123",
            "type": "text",
            "text": {
              "body": "Olá"
            }
          }]
        }
      }]
    }]
  }'
```

Check server logs for agent response.

### Test 4: Verify Webhook (WhatsApp)

```bash
curl "http://localhost:3000/api/whatsapp/support?hub.mode=subscribe&hub.verify_token=your_secret_token_123&hub.challenge=test123"
```

Should return: `test123`

## Step 6: Monitor Usage

### OpenAI API Usage

1. Go to https://platform.openai.com/usage
2. Check daily/monthly usage
3. Set up billing alerts

### Conversation Stats

```typescript
import { conversationMemory } from '@/lib/langgraph'

const stats = conversationMemory.getStats()
console.log(stats)
```

### LangSmith Tracing (Optional)

1. Sign up at https://smith.langchain.com
2. Get API key
3. Add to .env:
```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_...
```

4. View traces at https://smith.langchain.com/

## Step 7: Optimize Costs

### Use Cheaper Model

```typescript
// In src/lib/langgraph/agent.ts
this.model = new ChatOpenAI({
  modelName: 'gpt-4o-mini', // ✓ Cheaper
  // modelName: 'gpt-4o',    // More expensive
})
```

### Limit Conversation History

```typescript
// Keep only last 10 messages
const recentHistory = history.slice(-10)
```

### Cache Common Responses

```typescript
// Implement Redis cache for FAQs
import { cache } from '@/lib/cache'

const cached = await cache.get(`faq:${question}`)
if (cached) return cached
```

### Set Token Limits

```typescript
this.model = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  maxTokens: 500, // Limit response length
})
```

## Common Issues

### Issue: "OpenAI API key not found"

**Solution:**
```bash
# Check .env file exists
ls -la .env.local

# Check key is set
echo $OPENAI_API_KEY

# Restart server
npm run dev
```

### Issue: "WhatsApp webhook not receiving messages"

**Solutions:**
1. Check webhook is configured correctly
2. Verify HTTPS (required by Meta)
3. Check verify token matches
4. Test with ngrok for local dev
5. Check Meta Developer Console for errors

### Issue: "Agent responses are slow"

**Solutions:**
1. Use `gpt-4o-mini` instead of `gpt-4`
2. Reduce conversation history
3. Implement streaming responses
4. Cache common queries

### Issue: "Tests failing"

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Jest cache
npm test -- --clearCache

# Run tests with more info
npm test -- langgraph --verbose
```

### Issue: "Module not found"

**Solution:**
```bash
# Check TypeScript paths
cat tsconfig.json | grep paths

# Should see:
# "@/lib/*": ["./src/lib/*"]

# Rebuild
npm run build
```

## Security Checklist

- [ ] API keys in `.env`, not in code
- [ ] `.env` files in `.gitignore`
- [ ] HTTPS for webhook (production)
- [ ] Verify webhook signatures
- [ ] Rate limiting enabled
- [ ] No sensitive data in logs
- [ ] Access tokens rotated regularly
- [ ] Monitoring/alerts set up

## Production Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Environment Variables:**
- `OPENAI_API_KEY`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`

### Other Platforms

- **AWS Lambda:** Use Serverless Framework
- **Google Cloud Run:** Deploy as container
- **DigitalOcean:** Deploy to droplet

## Next Steps

1. ✓ Setup complete!
2. Test with real WhatsApp messages
3. Monitor usage and costs
4. Add custom tools for your needs
5. Optimize based on real data

## Resources

- [LangChain Docs](https://js.langchain.com/docs/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Full Implementation Guide](./LANGGRAPH_IMPLEMENTATION.md)
- [Quick Start Guide](./LANGGRAPH_QUICK_START.md)

## Support

Questions? Check:
1. Full documentation: `docs/LANGGRAPH_IMPLEMENTATION.md`
2. Quick start: `docs/LANGGRAPH_QUICK_START.md`
3. Tests: Run `npm test -- langgraph`
4. Logs: Check console output

---

**Setup time:** ~30 minutes  
**Difficulty:** Medium  
**Cost:** $0.10-$1 per day (depending on usage)

Happy coding! 🚀
